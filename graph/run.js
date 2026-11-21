'use strict';
/**
 * The graph study, step 2: runs the questions by four routes over the three sites. Resumable.
 *
 *   node graph/run.js --model <model> [--routes P,R,T,G] [--only g01,g02] [--out file]
 *
 * Routes (same limits for all: 8 tool calls, 3,500 characters per tool result):
 *   P  pages       fetch_page(url) on any of the three sites
 *   R  retrieval   BM25 over the passages of all three sites, the top five in one prompt, no loop
 *   T  tools       search, read, ask on any site (the node tools without the relation tools)
 *   G  graph tools T plus links, explain, compose (the typed links of the published graph)
 * When a final answer comes back empty, the harness asks once more (every route).
 */
const fs = require('node:fs');
const path = require('node:path');
const { SITES, cfg, loadGraph, scoreList, withCards } = require('./lib');
const corpus = require('../answering/src/corpus');
const { chat } = require('../answering/src/llm');
const { runToolAgent } = require('../answering/src/agent');
const { Retriever } = require('../answering/src/retrieval');
const { mcpCall, closeServers } = require('../answering/src/conditions');

const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const NODES = Object.keys(SITES);
const LIST = NODES.map((n) => `${SITES[n].name}, ${SITES[n].base}/`).join('; ');

const FORMAT = `Now give the final answer to the question, using ONLY what the sites gave you. Do not use outside knowledge.
1. Write one line that starts with "Answer:" and lists the exact titles of the cards asked for, separated by semicolons. If the question also asks for a term, a class or a property, add it at the end of that line after a semicolon.
2. If the sites show that no card fits, write "Answer: NONE".
3. If you could not find out, write "Answer: NOT_FOUND". Do not guess.
4. Add a last line that starts with "Sources:" and lists the identifiers of the items you used (the last part of each item's URL).`;
const CORE = `You answer one question using ONLY the knowledge published on three sites: ${LIST}. You have not seen them: look things up before you answer.`;

const tool = (name, description, props, required) => ({ type: 'function', function: { name, description, parameters: { type: 'object', properties: props, required } } });
const str = (d) => ({ type: 'string', description: d });
const site = { type: 'string', enum: NODES, description: 'which site: patterns, standards or main (the format\'s own site)' };
const PAGE_TOOLS = [tool('fetch_page', 'Return the text of one page. Give a full URL on one of the three sites, for example "https://patterns.agenticsystemcore.com/" or "https://standards.agenticsystemcore.com/concepts/some-item/".', { url: str('page URL') }, ['url'])];
const BASIC = [
  tool('search', 'Search one site and return matching items.', { site, query: str('search words') }, ['site', 'query']),
  tool('read', 'Return one item of a site by slug.', { site, slug: str('item slug') }, ['site', 'slug']),
  tool('ask', 'Return the descriptions of the best-matching items of a site for a question.', { site, question: str('the question') }, ['site', 'question']),
];
const GRAPH = [...BASIC,
  tool('links', 'Return the typed links of one item, in both directions: each edge has a key (related, uses, requires, implements and others), a source and a target slug.', { site, slug: str('item slug') }, ['site', 'slug']),
  tool('explain', 'Say whether a typed link holds between two items of a site, and why.', { site, key: str('link type, for example requires'), source: str('source slug'), target: str('target slug') }, ['site', 'key', 'source', 'target']),
  tool('compose', 'Return a selection of item slugs of a site together with every item they require, with the path that brought each one in.', { site, selection: { type: 'array', items: { type: 'string' }, description: 'item slugs' } }, ['site', 'selection']),
];

const nodeOf = (url, start) => { const h = /^https?:\/\/([^/]+)/.exec(String(url || '')); if (!h) return start; return NODES.find((n) => SITES[n].base === `https://${h[1]}`) || null; };
async function pages(q, o) {
  const exec = async (name, args) => {
    const node = nodeOf(args.url, q.node);
    if (!node) return `Not one of the three sites: ${args.url}`;
    const t = corpus.pageText(node, String(args.url).replace(/^https?:\/\/[^/]+/, '') || '/', false);
    return t === null ? `No such page: ${args.url}` : t;
  };
  return runToolAgent({ model: o.model, seed: 1, format: FORMAT, retryEmpty: true, question: q.q, tools: PAGE_TOOLS, exec,
    system: `${CORE}\nYou can read the sites' pages with the tool fetch_page(url). Start from the home page ${SITES[q.node].base}/. At most ${cfg.LIMITS.toolCalls} tool calls.` });
}
async function tools(q, o, set, line) {
  const exec = (name, args) => { const { site: s, ...rest } = args; if (!NODES.includes(s)) throw new Error(`site must be one of ${NODES.join(', ')}`); return mcpCall(s, name, rest); };
  return runToolAgent({ model: o.model, seed: 1, format: FORMAT, retryEmpty: true, question: q.q, tools: set, exec, system: `${CORE}\n${line} At most ${cfg.LIMITS.toolCalls} tool calls.` });
}
let retriever = null;
async function bm25(q, o) {
  if (!retriever) retriever = new Retriever(NODES.flatMap((n) => corpus.markdownChunks(n).map((c) => ({ ...c, id: `${n}:${c.id}` }))));
  const hits = retriever.top(q.q, cfg.LIMITS.topK);
  const passages = hits.map((h) => `[${h.id}] ${h.title}\n${h.text}`).join('\n\n');
  const messages = [{ role: 'system', content: `${CORE.replace(' You have not seen them: look things up before you answer.', '')}\n${FORMAT}\nThe passages below were retrieved from the three sites for the question. Each passage is labelled [site:identifier#section]. No tools are available.` }, { role: 'user', content: `${passages}\n\nQuestion: ${q.q}` }];
  let r = await chat({ model: o.model, seed: 1, messages }); let pt = r.promptTokens; let ct = r.completionTokens;
  if (!(r.message.content || '').trim()) { r = await chat({ model: o.model, seed: 1, messages }); pt += r.promptTokens; ct += r.completionTokens; }
  return { answer: (r.message.content || '').trim(), toolCalls: [], promptTokens: pt, completionTokens: ct, retrieved: hits.map((h) => h.id) };
}
const RUN = {
  P: pages, R: bm25,
  T: (q, o) => tools(q, o, BASIC, 'You can use the sites\' tools: search(site, query), read(site, slug) and ask(site, question).'),
  G: (q, o) => tools(q, o, GRAPH, 'You can use the sites\' tools: search(site, query), read(site, slug), ask(site, question), links(site, slug), explain(site, key, source, target) and compose(site, selection).'),
};

async function main() {
  const model = arg('model'); if (!model) throw new Error('give --model');
  const routes = arg('routes', 'P,R,T,G').split(',');
  const only = arg('only', '') ? arg('only').split(',') : null;
  const out = arg('out', path.join(__dirname, 'results', `runs-g-${model.replace(/[^a-z0-9.]+/gi, '_')}.jsonl`));
  const questions = fs.readFileSync(path.join(__dirname, 'questions-g.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((q) => !only || only.includes(q.id));
  const graphs = Object.fromEntries(NODES.map((n) => [n, loadGraph(n)]));
  const have = new Set(fs.existsSync(out) ? fs.readFileSync(out, 'utf8').split('\n').filter(Boolean).map((l) => { const r = JSON.parse(l); return `${r.question_id}|${r.route}`; }) : []);
  let n = 0; const total = questions.length * routes.length;
  for (const q of questions) for (const route of routes) {
    n += 1; if (have.has(`${q.id}|${route}`)) continue;
    const t0 = Date.now(); let r = { answer: '', toolCalls: [], promptTokens: 0, completionTokens: 0 }; let error = null;
    try { r = await RUN[route](q, { model }); } catch (e) { if (/^TOKEN_BUDGET/.test(e.message)) throw e; error = String(e.message || e).slice(0, 300); }
    const scores = scoreList(withCards(q, graphs), r.answer);
    fs.appendFileSync(out, `${JSON.stringify({ question_id: q.id, type: q.type, nodes: q.nodes, route, model, question: q.q, answer: r.answer, gold_titles: q.gold_titles,
      tool_calls: r.toolCalls.map((c) => ({ name: c.name, args: c.args, ok: c.ok })), n_tool_calls: r.toolCalls.length, prompt_tokens: r.promptTokens, completion_tokens: r.completionTokens,
      wall_ms: Date.now() - t0, error, retrieved: r.retrieved || null, context_stop: r.contextStop ?? null,
      trace: process.env.BENCH_TRACE && r.messages ? r.messages.map((m) => ({ role: m.role, content: String(m.content || '').slice(0, 1500), tool_calls: m.tool_calls })) : undefined, scores })}\n`);
    process.stderr.write(`[${n}/${total}] ${q.id} ${route} ${Date.now() - t0}ms calls=${r.toolCalls.length} exact=${scores.exact} ${scores.found}/${scores.gold}+${scores.extras} ${error || ''}\n`);
  }
  await closeServers();
}

if (require.main === module) main().catch(async (e) => { console.error(e.message || e); await closeServers().catch(() => {}); process.exit(/^TOKEN_BUDGET/.test(e.message) ? 3 : 1); });
