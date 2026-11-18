'use strict';
/**
 * No model. For every answerable question: bytes and tokens an agent reads to reach the fact under each
 * condition, and retrieval recall of C3 (BM25 top-5) and of the node's own search and ask tools.
 * Writes results/nomodel.json.
 */
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');
const corpus = require('./corpus');
const { mcpCall, closeServers, pasteAll } = require('./conditions');
const { Retriever } = require('./retrieval');
const { cap } = require('./agent');

const bytes = (s) => Buffer.byteLength(s, 'utf8');
const cost = (texts) => ({ bytes: texts.reduce((a, t) => a + bytes(t), 0), tokens: texts.reduce((a, t) => a + corpus.countTokens(t), 0) });

/** Internal page links of a built page: absolute routes of .html pages. */
function linksOf(node, route) {
  const f = corpus.routeFile(cfg.wwwDir(node), route, false);
  if (!f) return [];
  const base = path.posix.dirname(route.endsWith('/') ? `${route}x` : route);
  const out = new Set();
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/href="([^"#?]+)"/g)) {
    let h = m[1];
    if (/^[a-z]+:/i.test(h) || h.startsWith('//')) continue;
    h = h.startsWith('/') ? h : path.posix.normalize(path.posix.join(base, h));
    if (!/\.[a-z0-9]+$/i.test(h) || h.endsWith('.html')) { if (corpus.routeFile(cfg.wwwDir(node), h, false)) out.add(h); }
  }
  return [...out];
}

/** Shortest chain of pages from "/" to the target route, by breadth-first search. */
function pathTo(node, target) {
  const seen = new Map([['/', null]]); const queue = ['/'];
  const norm = (r) => (r.endsWith('/') || r.endsWith('.html') ? r : `${r}/`);
  while (queue.length) {
    const cur = queue.shift();
    if (norm(cur) === target) { const chain = []; for (let c = cur; c !== null; c = seen.get(c)) chain.unshift(c); return chain; }
    for (const nx of linksOf(node, cur)) { const k = norm(nx); if (!seen.has(k)) { seen.set(k, cur); queue.push(k); } }
  }
  return null;
}

const itemRoute = (it) => new URL(it.iri).pathname;
const goldChunk = (q, chunks) => chunks.find((c) => q.gold.includes(c.slug) && q.facts.every((f) => new RegExp(f, 'i').test(c.text)))
  || chunks.find((c) => q.gold.includes(c.slug));

async function main() {
  const qs = fs.readFileSync(path.join(cfg.STUDY, 'questions/questions.jsonl'), 'utf8').split('\n').filter(Boolean)
    .map((l) => JSON.parse(l)).filter((q) => q.kind !== 'unanswerable');
  const rows = [];
  for (const q of qs) {
    const items = corpus.items(q.node); const chunks = corpus.markdownChunks(q.node);
    const retr = new Retriever(chunks);
    const pages = q.gold.map((g) => itemRoute(items.get(g)));
    const chains = pages.map((p) => pathTo(q.node, p));
    const pageTexts = (chain) => (chain || []).map((r) => corpus.pageText(q.node, r, false) || '');
    const llms = corpus.pageText(q.node, '/llms.txt', true) || '';
    const c0 = chains.every(Boolean) ? cost([...new Set(chains.flat())].flatMap((r) => pageTexts([r]))) : null;
    const c1 = cost([llms, ...pages.map((p) => corpus.pageText(q.node, p, false) || '')]);
    const search = await mcpCall(q.node, 'search', { query: q.q });
    const reads = await Promise.all(q.gold.map((g) => mcpCall(q.node, 'read', { slug: g })));
    const c2 = cost([cap(search), ...reads.map(cap)]);
    const seen = reads.flatMap((t) => [...cap(t).matchAll(/"digest":"([0-9a-f]{64})"/g)].map((m) => m[1]));
    const published = new Set(q.gold.flatMap((g) => items.get(g).digests));
    const digestMatch = seen.length ? seen.every((d) => published.has(d)) : null;
    const top = retr.top(q.q, cfg.LIMITS.topK);
    const c3 = cost(top.map((h) => `[${h.id}] ${h.title}\n${h.text}`));
    const gc = goldChunk(q, chunks);
    const c4 = pasteAll(q.node);
    const hitSlugs = new Set([...search.matchAll(/"slug":"([^"]+)"/g)].map((m) => m[1]));
    const ask = await mcpCall(q.node, 'ask', { question: q.q });
    const askSlugs = new Set([...ask.matchAll(/\/(?:concepts|procedures|clusters)\/([^/"]+)\//g)].map((m) => m[1]));
    rows.push({
      id: q.id, node: q.node, kind: q.kind,
      read_C0_path: c0, read_C1_llms_plus_page: c1, read_C2_search_plus_read: c2, read_C3_top5_prompt: c3,
      read_C4_whole_corpus: { bytes: bytes(c4.doc), tokens: c4.tokens }, truncated_C4: c4.cut,
      read_gold_page_only: cost(pages.map((p) => corpus.pageText(q.node, p, false) || '')),
      read_gold_chunk_only: gc ? cost([gc.text]) : null,
      c0_hops: chains.every(Boolean) ? Math.max(...chains.map((c) => c.length - 1)) : null,
      c2_read_digests_in_capped_output: seen.length, c2_read_digests_match_published: digestMatch,
      recall5_C3_all_gold: q.gold.every((g) => top.some((h) => h.slug === g)),
      top1_C3: q.gold.includes(top[0] && top[0].slug),
      recall_C2_search_all_gold: q.gold.every((g) => hitSlugs.has(g)), search_hits: hitSlugs.size,
      recall_C2_ask_all_gold: q.gold.every((g) => askSlugs.has(g)),
    });
  }
  await closeServers();
  fs.writeFileSync(path.join(cfg.STUDY, 'results/nomodel.json'), `${JSON.stringify(rows, null, 1)}\n`);
  process.stderr.write(`nomodel: ${rows.length} rows\n`);
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
