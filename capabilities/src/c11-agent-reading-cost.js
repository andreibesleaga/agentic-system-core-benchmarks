'use strict';
/**
 * Case 11. Bytes and tokens an agent reads to reach one fact, per route. Routes C0..C4 and the two floors are taken from the answering study's
 * results/nomodel.json (copied first; produced by its src/nomodel.js, no model). Route D is new: start at a bare domain, read the discovery
 * document, take the chunks surface it names, rank the chunks with BM25 in the agent's own code, and put the top 5 chunks in the prompt.
 * "In context" counts what a model reads; "transferred" counts what the client downloads.
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, median } = require('./shared/lib');
const corpus = require('./shared/corpus');
const { Retriever } = require('./shared/retrieval');

const SRC = cfg.ANSWERING;
const copy = path.join(cfg.SCRATCH, 'work', 'first-study-rows'); fs.mkdirSync(copy, { recursive: true });
fs.copyFileSync(path.join(SRC, 'results/nomodel.json'), path.join(copy, 'nomodel.json'));
fs.copyFileSync(path.join(SRC, 'questions/questions.jsonl'), path.join(copy, 'questions.jsonl'));
const rows = JSON.parse(fs.readFileSync(path.join(copy, 'nomodel.json'), 'utf8'));
const qs = Object.fromEntries(fs.readFileSync(path.join(copy, 'questions.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).map((q) => [q.id, q]));
const bytes = (s) => Buffer.byteLength(s, 'utf8');

const D = [];
const cache = {};
for (const r of rows) {
  const q = qs[r.id]; const node = r.node;
  if (!cache[node]) {
    const www = cfg.wwwDir(node);
    const doc = fs.readFileSync(path.join(www, '.well-known/knowledge-linkset'), 'utf8');
    const raw = fs.readFileSync(path.join(www, 'chunks.jsonl'), 'utf8');
    const list = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));
    cache[node] = { doc, raw, list, retr: new Retriever(list.map((c) => ({ id: c.id, slug: c.item, title: c.title, text: c.text }))) };
  }
  const c = cache[node];
  const top = c.retr.top(q.q, 5);
  const ctx = top.map((t) => `[${t.id.slice(0, 16)}] ${t.title}\n${t.text}`).join('\n\n');
  const hasFacts = q.gold.every((g) => top.some((t) => t.slug === g)) && q.facts.every((f) => top.some((t) => new RegExp(f, 'i').test(t.text)));
  D.push({ id: r.id, discovery_document_bytes: bytes(c.doc), in_context_bytes: bytes(c.doc) + bytes(ctx), in_context_tokens: corpus.countTokens(c.doc) + corpus.countTokens(ctx), transferred_bytes: bytes(c.doc) + bytes(c.raw), gold_in_top5: hasFacts });
}
const med = (rs, f) => median(rs.map(f));
const routes = {
  'C0 crawl pages from the home page to the page': { ctx_bytes: med(rows, (r) => r.read_C0_path && r.read_C0_path.bytes), ctx_tokens: med(rows.filter((r) => r.read_C0_path), (r) => r.read_C0_path.tokens), n: rows.filter((r) => r.read_C0_path).length },
  'C1 llms.txt plus the gold page': { ctx_bytes: med(rows, (r) => r.read_C1_llms_plus_page.bytes), ctx_tokens: med(rows, (r) => r.read_C1_llms_plus_page.tokens), n: rows.length },
  'C2 node tools: search plus read (capped as served)': { ctx_bytes: med(rows, (r) => r.read_C2_search_plus_read.bytes), ctx_tokens: med(rows, (r) => r.read_C2_search_plus_read.tokens), n: rows.length },
  'C3 BM25 top 5 passages, index already local': { ctx_bytes: med(rows, (r) => r.read_C3_top5_prompt.bytes), ctx_tokens: med(rows, (r) => r.read_C3_top5_prompt.tokens), n: rows.length },
  'C4 whole corpus pasted': { ctx_bytes: med(rows, (r) => r.read_C4_whole_corpus.bytes), ctx_tokens: med(rows, (r) => r.read_C4_whole_corpus.tokens), n: rows.length, note: 'cut to the context limit for the larger node' },
  'D discovery route from a bare domain (document + BM25 top 5 chunks of the published chunk file)': { ctx_bytes: med(D, (d) => d.in_context_bytes), ctx_tokens: med(D, (d) => d.in_context_tokens), transferred_bytes: med(D, (d) => d.transferred_bytes), gold_in_top5: D.filter((d) => d.gold_in_top5).length, discovery_document_bytes_median: med(D, (d) => d.discovery_document_bytes), n: D.length },
  'floor: the gold page only': { ctx_bytes: med(rows, (r) => r.read_gold_page_only.bytes), ctx_tokens: med(rows, (r) => r.read_gold_page_only.tokens), n: rows.length },
  'floor: the gold chunk only': { ctx_bytes: med(rows.filter((r) => r.read_gold_chunk_only), (r) => r.read_gold_chunk_only.bytes), ctx_tokens: med(rows.filter((r) => r.read_gold_chunk_only), (r) => r.read_gold_chunk_only.tokens), n: rows.filter((r) => r.read_gold_chunk_only).length },
};
writeResult('c11-agent-reading-cost', { questions: rows.length, statistic: 'median over answerable questions of the answering study', routes, route_D_rows: D,
  first_study_recall: { C3_top5_recall_all_gold: rows.filter((r) => r.recall5_C3_all_gold).length, C2_search_recall_all_gold: rows.filter((r) => r.recall_C2_search_all_gold).length } });
