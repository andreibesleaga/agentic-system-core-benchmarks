'use strict';
/** The five conditions. Each returns { answer, toolCalls, promptTokens, completionTokens, steps }. */
const path = require('node:path');
const cfg = require('./config');
const corpus = require('./corpus');
const { chat } = require('./llm');
const { system } = require('./prompts');
const { runToolAgent, cap } = require('./agent');
const { Retriever } = require('./retrieval');

const tool = (name, description, props, required) => ({
  type: 'function', function: { name, description, parameters: { type: 'object', properties: props, required } },
});
const str = (d) => ({ type: 'string', description: d });

const PAGE_TOOLS = [tool('fetch_page', 'Return the text of one page of the site. The path looks like "/" or "/concepts/some-item/".', { path: str('site path') }, ['path'])];
const NODE_TOOLS = [
  tool('search', 'Search the node and return matching items.', { query: str('search words') }, ['query']),
  tool('read', 'Return one item by slug.', { slug: str('item slug') }, ['slug']),
  tool('links', 'Return the typed links of one item.', { slug: str('item slug') }, ['slug']),
  tool('ask', 'Return the descriptions of the best-matching items for a question.', { question: str('the question') }, ['question']),
];

/** One long-lived `agsc mcp` process per node: the tools are read-only, so no state leaks between runs. */
const servers = new Map();
async function mcpClient(node) {
  if (servers.has(node)) return servers.get(node);
  const { Client } = await import(path.join(cfg.ENGINE, 'node_modules/@modelcontextprotocol/client/dist/index.mjs'));
  const { StdioClientTransport } = await import(path.join(cfg.ENGINE, 'node_modules/@modelcontextprotocol/client/dist/stdio.mjs'));
  const transport = new StdioClientTransport({
    command: process.execPath, args: [path.join(cfg.ENGINE, 'bin/agsc.js'), 'mcp'], cwd: cfg.srcDir(node),
    env: { ...process.env, SOURCE_DATE_EPOCH: cfg.EPOCH },
  });
  const client = new Client({ name: 'answering-study', version: '1.0.0' });
  await client.connect(transport);
  servers.set(node, client);
  return client;
}
async function closeServers() { for (const c of servers.values()) await c.close(); servers.clear(); }

async function mcpCall(node, name, args) {
  const r = await (await mcpClient(node)).callTool({ name, arguments: args });
  const text = (r.content || []).map((c) => c.text || '').join('\n');
  if (r.isError) throw new Error(text.slice(0, 300));
  return text;
}

/**
 * C2u: the same four tools and the same server, but the host shows the model the answer's content, not the
 * JSON envelope (the envelope repeats chunk metadata and escapes newlines). It separates "the node's content"
 * from "the node's output format as served".
 */
function unwrap(text) {
  let j; try { j = JSON.parse(text); } catch { return text; }
  const b = j.body;
  if (b && typeof b.body === 'string') return `${b.iri}\n${b.body.trim()}`;
  if (b && Array.isArray(b.hits)) return b.hits.map((h) => `${h.slug} | ${h.title} | ${h.iri}`).join('\n') || 'no hits';
  if (typeof b === 'string') return `${b}${j.citations ? `\nItems: ${j.citations.join(' ')}` : ''}`;
  return JSON.stringify(b === undefined ? j : b);
}

async function nodeToolsUnwrapped(node, o) {
  const exec = async (name, args) => unwrap(await mcpCall(node, name, args));
  return runToolAgent({ model: o.model, seed: o.seed, system: system('C2', node), question: o.question, tools: NODE_TOOLS, exec });
}

/** The home page, fetched by the harness as if the model had called fetch_page("/"). */
async function homePrelude(node) {
  const text = cap(corpus.pageText(node, '/', false) || '');
  return [{ role: 'assistant', content: '', tool_calls: [{ function: { name: 'fetch_page', arguments: { path: '/' } } }] },
    { role: 'tool', tool_name: 'fetch_page', content: text }];
}

async function plainPages(node, o, withLlms, preloaded) {
  const exec = async (name, args) => {
    const t = corpus.pageText(node, args.path, withLlms);
    return t === null ? `No such page: ${args.path}` : t;
  };
  return runToolAgent({ model: o.model, seed: o.seed, system: system(withLlms ? 'C1' : 'C0', node, preloaded), question: o.question, tools: PAGE_TOOLS, exec,
    prelude: preloaded ? await homePrelude(node) : undefined });
}

async function nodeTools(node, o) {
  const exec = (name, args) => mcpCall(node, name, args);
  return runToolAgent({ model: o.model, seed: o.seed, system: system('C2', node), question: o.question, tools: NODE_TOOLS, exec });
}

const retrievers = new Map();
const retriever = (node) => { if (!retrievers.has(node)) retrievers.set(node, new Retriever(corpus.markdownChunks(node))); return retrievers.get(node); };

async function noTools(o, sys, user) {
  const r = await chat({ model: o.model, seed: o.seed, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] });
  return { answer: (r.message.content || '').trim(), toolCalls: [], promptTokens: r.promptTokens, completionTokens: r.completionTokens, steps: 1 };
}

async function bm25(node, o) {
  const hits = retriever(node).top(o.question, cfg.LIMITS.topK);
  const passages = hits.map((h) => `[${h.id}] ${h.title}\n${h.text}`).join('\n\n');
  const out = await noTools(o, system('C3', node), `${passages}\n\nQuestion: ${o.question}`);
  return { ...out, retrieved: hits.map((h) => h.id) };
}

/** The corpus as one document, cut to the context limit (room kept for prompt and answer). */
function pasteAll(node) {
  const budget = cfg.LIMITS.numCtx - 1500;
  let doc = ''; let used = 0; let cut = false;
  for (const it of corpus.markdownItems(node)) {
    const part = `### ${it.slug}\n${it.title}\n${it.body}\n\n`;
    const t = corpus.countTokens(part);
    if (used + t > budget) { cut = true; break; }
    doc += part; used += t;
  }
  return { doc, cut, tokens: used };
}
const pasted = new Map();
async function paste(node, o) {
  if (!pasted.has(node)) pasted.set(node, pasteAll(node));
  const p = pasted.get(node);
  return { ...(await noTools(o, system('C4', node), `${p.doc}\nQuestion: ${o.question}`)), truncated: p.cut };
}

/** C2b: the harness calls the node's search once, reads the top five items, and puts them in the prompt with digests. */
const ITEM_CHARS = 1400;
async function nodeOneShot(node, o) {
  const hits = JSON.parse(await mcpCall(node, 'search', { query: o.question })).body.hits.slice(0, cfg.LIMITS.topK);
  const parts = [];
  for (const h of hits) {
    const b = JSON.parse(await mcpCall(node, 'read', { slug: h.slug })).body;
    const digests = (b.chunks || []).map((c) => `${c.section}=${c.digest.slice(0, 16)}`).join(', ');
    parts.push(`[${h.slug}] ${h.title}\n${b.iri}\nchunk digests: ${digests}\n${b.body.trim().slice(0, ITEM_CHARS)}`);
  }
  const out = await noTools(o, system('C2b', node), `${parts.join('\n\n')}\n\nQuestion: ${o.question}`);
  return { ...out, harnessCalls: 1 + hits.length, retrieved: hits.map((h) => h.slug) };
}

const RUN = {
  C0: (n, o) => plainPages(n, o, false), C1: (n, o) => plainPages(n, o, true),
  C0h: (n, o) => plainPages(n, o, false, true), C1h: (n, o) => plainPages(n, o, true, true),
  C2: nodeTools, C2u: nodeToolsUnwrapped, C2b: nodeOneShot, C3: bm25, C4: paste,
};
/** @param {string} cond @param {string} node @param {{model:string,seed:number,question:string}} o */
const runCondition = (cond, node, o) => RUN[cond](node, o);

module.exports = { unwrap, runCondition, closeServers, mcpCall, pasteAll, cap };
