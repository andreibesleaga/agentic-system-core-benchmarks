'use strict';
/**
 * Case 7. Ten questions that need one fact from each of the two nodes. No model. A client starts at ONE node's address and must
 * find the other node and say which node each fact came from. Hosts are resolved to the two build folders (no network).
 *   A  discovery route: GET /.well-known/knowledge-linkset, follow the `peer` relation, read each node's chunks surface, BM25 over the merged chunks,
 *      attribute each hit by the host of the chunk's `iri`.
 *   B  page route: breadth-first crawl of the start site's HTML pages (internal and external links) until a page of the other host is reached; count pages and bytes.
 *   C  llms.txt route: does the start node's llms.txt name the other host?
 * Retrieval is the same BM25 for A and for the "RAG over both folders" control (raw Markdown of both nodes merged, file path kept as the source label).
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, run } = require('./shared/lib');
const { Retriever } = require('./shared/retrieval');

const HOSTS = { 'patterns.agenticsystemcore.com': 'patterns', 'agenticsystemcore.com': 'main' };
let requests = 0; let bytes = 0;
function get(url) {
  const u = new URL(url); const node = HOSTS[u.hostname]; if (!node) return null;
  let rel = decodeURIComponent(u.pathname).replace(/^\/+/, ''); if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  let f = path.join(cfg.wwwDir(node), rel); if (!fs.existsSync(f) && !path.extname(rel)) f = path.join(cfg.wwwDir(node), rel, 'index.html');
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return null;
  const buf = fs.readFileSync(f); requests += 1; bytes += buf.length; return buf.toString('utf8');
}
const reset = () => { requests = 0; bytes = 0; };

const Q = [
  ['x01', 'Which kind of item records the runs of a Gate, and what can the Copilot cloud agent not do to its own pull requests?', [['main', 'gate', /its runs are Episodes/i], ['patterns', 'human-only-merge-gate', /cannot approve or merge/i]]],
  ['x02', 'Which three severity values can a Lesson carry, and how is each record linked to the previous one in an immutable audit log?', [['main', 'lesson', /`info`, `warn` or `block`/i], ['patterns', 'immutable-audit-log', /by a hash/i]]],
  ['x03', 'How many agsc.config.json files does a Bundle hold, and how many levels does the Cloud Security Alliance autonomy scale propose?', [['main', 'bundle', /exactly one `agsc\.config\.json`/i], ['patterns', 'autonomy-ladder', /six levels/i]]],
  ['x04', 'Where are Procedures published, and what does a growing skill library keep?', [['main', 'procedure', /published in skill packs/i], ['patterns', 'skill-library', /library of executable skills/i]]],
  ['x05', 'What does each value of a Link hold, and what are the vertices in graph of thoughts?', [['main', 'link', /Each value is a slug/i], ['patterns', 'graph-of-thoughts', /thoughts are vertices/i]]],
  ['x06', 'Which three outcome values can an Episode have, and what is the shadow variant of a shadow test sent?', [['main', 'episode', /`success`, `partial` or `failure`/i], ['patterns', 'shadow-mode-rollout', /copy of the inference requests/i]]],
  ['x07', 'Which kinds can a Concept have, and what is the Langfuse example label for the candidate prompt?', [['main', 'concept', /a taxonomy, an explainer/i], ['patterns', 'canary-and-shadow-prompts', /`canary`/i]]],
  ['x08', 'What is a Source in the graph, and what do the OWASP prevention controls include for supply chains?', [['main', 'source', /subclass of `prov:Entity`/i], ['patterns', 'agentic-supply-chain', /pinning by content hash/i]]],
  ['x09', 'What is NOW never, and what does the termination conditions pattern decide in advance?', [['main', 'now', /never an item/i], ['patterns', 'termination-conditions', /every way an agent loop can end/i]]],
  ['x10', 'How many kinds of file does a Harness hold, and what do the producer and reviewer modes separate?', [['main', 'harness', /files of seven kinds/i], ['patterns', 'human-only-merge-gate', /producer mode cannot access merge tools/i]]],
];

const chunksOf = (node) => fs.readFileSync(path.join(cfg.wwwDir(node), 'chunks.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
// every gold fact must really be in the named item's published text: checked first
const all = { patterns: chunksOf('patterns'), main: chunksOf('main') };
const checkedGold = Q.map(([id, , gold]) => ({ id, ok: gold.every(([n, slug, re]) => all[n].some((c) => c.item === slug && re.test(c.text))) }));
if (checkedGold.some((g) => !g.ok)) { writeResult('c07-cross-node', { measured: false, reason: `gold fact not found in the published text for: ${checkedGold.filter((g) => !g.ok).map((g) => g.id).join(', ')}` }); process.exit(0); }

/** Route A: discover nodes from a start address. */
function discover(startHost) {
  reset(); const found = new Map(); const queue = [`https://${startHost}/`]; const seen = new Set(); const trace = [];
  while (queue.length && found.size < 4) {
    const origin = queue.shift(); if (seen.has(origin)) continue; seen.add(origin);
    const txt = get(`${origin}.well-known/knowledge-linkset`); if (!txt) { trace.push(`${origin}: no discovery document`); continue; }
    const doc = JSON.parse(txt).linkset[0]; const node = HOSTS[new URL(origin).hostname];
    const surf = (doc['https://w3id.org/agentic-system-core/rel#surface'] || []).find((s) => (s['agsc-surface'] || [])[0] === 'chunks');
    found.set(node, { origin, chunks_href: surf && surf.href, chunk_count: surf && surf['agsc-chunk-count'][0] });
    for (const p of doc['https://w3id.org/agentic-system-core/rel#peer'] || []) queue.push(new URL(p.href).origin + '/');
    trace.push(`${origin}: peers ${(doc['https://w3id.org/agentic-system-core/rel#peer'] || []).length}`);
  }
  const chunks = [];
  for (const [node, v] of found) { const txt = get(v.chunks_href); if (txt) for (const l of txt.split('\n').filter(Boolean)) { const c = JSON.parse(l); chunks.push({ id: c.id, slug: c.item, title: c.title, text: c.text, node: HOSTS[new URL(c.iri).hostname] || node }); } }
  return { nodes: [...found.keys()], requests, bytes, trace, chunks };
}

/** Route B: crawl pages from the start until a page of another host is found. */
function crawl(startHost) {
  reset(); const start = `https://${startHost}/`; const queue = [start]; const seen = new Set([start]); let pages = 0;
  while (queue.length) {
    const url = queue.shift(); const html = get(url); if (html === null) continue; pages += 1;
    if (new URL(url).hostname !== startHost) return { reached_other_host: true, pages_fetched: pages, bytes, first_page_of_other_host: url };
    for (const m of html.matchAll(/href="([^"#]+)"/g)) {
      let h; try { h = new URL(m[1], url).href; } catch { continue; }
      if (!/^https?:/.test(h)) continue; const u = new URL(h); if (!HOSTS[u.hostname] || (path.extname(u.pathname) && !u.pathname.endsWith('.html'))) continue;
      const key = h.split('?')[0]; if (!seen.has(key)) { seen.add(key); queue.push(key); }
    }
  }
  return { reached_other_host: false, pages_fetched: pages, bytes };
}

const out = { questions: Q.length, starts: {} };
for (const start of Object.keys(HOSTS)) {
  const d = discover(start);
  const A = { nodes_found: d.nodes, peer_found: d.nodes.length === 2, requests_to_get_both_indexes: d.requests, bytes_to_get_both_indexes: d.bytes, trace: d.trace };
  const retr = new Retriever(d.chunks.map((c, i) => ({ ...c, id: `${c.id}` })));
  const per = Q.map(([id, q, gold]) => {
    const top = retr.top(q, 6);
    const hitBoth = gold.every(([n, slug, re]) => top.some((t) => t.slug === slug && t.node === n && re.test(t.text)));
    const attributed = gold.every(([n, slug]) => { const t = top.find((x) => x.slug === slug); return t && t.node === n; });
    return { id, both_gold_chunks_in_top6: hitBoth, attribution_correct_for_retrieved_gold: attributed };
  });
  A.questions_with_both_facts_retrieved = per.filter((p) => p.both_gold_chunks_in_top6).length;
  A.attribution_correct = per.filter((p) => p.attribution_correct_for_retrieved_gold).length;
  A.per_question = per;
  const B = crawl(start);
  const llms = fs.readFileSync(path.join(cfg.wwwDir(HOSTS[start]), 'llms.txt'), 'utf8');
  const other = Object.keys(HOSTS).find((h) => h !== start);
  const C = { names_other_host: new RegExp(`https?://${other.replace(/\./g, '\\.')}`).test(llms), other_host_mentions: (llms.match(new RegExp(`https?://${other.replace(/\./g, '\\.')}`, 'g')) || []).length, says_it_is_a_peer: /peer/i.test(llms) };
  out.starts[start] = { discovery_route: A, page_crawl_route: B, llms_txt_route: C };
}
// Control: RAG over both folders merged (raw Markdown with front matter; the file path is kept as a source label). Same BM25, same top-6.
{
  const docs = [];
  for (const n of cfg.NODES) (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.md') && p.includes('/content/')) docs.push({ id: `${n}:${path.basename(p, '.md')}`, slug: path.basename(p, '.md'), title: path.basename(p, '.md'), text: fs.readFileSync(p, 'utf8'), node: n }); } }(path.join(cfg.srcDir(n), 'content')));
  const r = new Retriever(docs);
  const per = Q.map(([id, q, gold]) => { const top = r.top(q, 6); return gold.every(([n, slug, re]) => top.some((t) => t.slug === slug && t.node === n && re.test(t.text))); });
  out.control_rag_over_both_folders = { questions_with_both_facts_retrieved: per.filter(Boolean).length, attribution_by_file_path: 'every hit carries its node in the id, so attribution is correct for every retrieved gold file', note: 'A person must already know both folders exist; nothing in a folder says there is a second one.' };
}
// Mutual conformance check of the engine (AGSC-10-12): each document with the other as peer.
const mk = (n) => path.join(cfg.wwwDir(n), '.well-known/knowledge-linkset');
const mutual = run(process.execPath, [path.join(cfg.ENGINE, 'tools/validate-wellknown'), mk('patterns'), '--level', '2', '--peer', mk('main'), '--json']);
out.mutual_conformance_check = { exit: mutual.code, status: (() => { try { return JSON.parse(mutual.out).status; } catch { return 'unparsed'; } })() };
writeResult('c07-cross-node', out);
