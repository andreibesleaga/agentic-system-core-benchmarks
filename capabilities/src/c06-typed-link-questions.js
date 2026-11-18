'use strict';
/**
 * Case 6. 30 questions whose answer is a relation or a 2-3 step path, over the engine's three blueprint Bundles (examples/blueprints/*):
 * 71 items with typed links (requires, uses, verifies, decided-by). The two published nodes use only `related`, so they cannot carry this case.
 * GOLD COMES FROM THE PUBLISHED GRAPH (graph.nq of each build). Systems that read the graph or the tool server therefore agree with the gold
 * by construction in part: for them this case shows what a program can do with the node, not an accuracy contest. The model systems
 * must find the same facts in prose and front matter.
 *   G1  published graph.nq read by a program (no model)
 *   G2  `agsc mcp` tools links / explain called by a program (no model); independent code path from G1
 *   B1  BM25 over whole raw Markdown files (front matter included), top 5 files for the question text, local model
 *   B2  as B1, the query also holds the subject's slug (the best fair shot for the retrieval side)
 *   W   every raw Markdown file of the Bundle pasted into the prompt, local model
 * Usage: node c06-typed-link-questions.js [--models qwen2.5-coder:7b,gemma3:4b] [--no-model]
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, run, agsc, rng, mcpOpen, freshCopy } = require('./shared/lib');
const { Retriever } = require('./shared/retrieval');
const { chat } = require('./shared/llm');
const corpus = require('./shared/corpus');

const args = process.argv.slice(2);
const MODELS = (args.includes('--models') ? args[args.indexOf('--models') + 1] : 'qwen2.5-coder:7b,gemma3:4b').split(',');
const NO_MODEL = args.includes('--no-model');
const BP = path.join(cfg.ENGINE, 'examples/blueprints');
const BUNDLES = ['engine', 'tool-server', 'linked-sites'];
const ns = { requires: 'http://purl.org/dc/terms/requires', requiredBy: 'http://purl.org/dc/terms/isRequiredBy', uses: 'https://w3id.org/agentic-system-core/ns#uses', verifies: 'https://w3id.org/agentic-system-core/ns#verifies', verifiedBy: 'https://w3id.org/agentic-system-core/ns#isVerifiedBy', decidedBy: 'https://w3id.org/agentic-system-core/ns#decidedBy' };

/** Builds a blueprint copy and loads its items and edges from the published graph. */
function load(name) {
  const dir = freshCopy(path.join(BP, name), `c06-${name}`);
  const b = agsc(dir, ['build', '--quiet']);
  if (b.code !== 0) throw new Error(`build of ${name} failed: ${b.out.slice(0, 200)}`);
  const nq = fs.readFileSync(path.join(dir, 'www/graph.nq'), 'utf8').split('\n').filter(Boolean);
  const slug = (iri) => iri.replace(/^https?:\/\/[^/]+\/(?:concepts|procedures|clusters|gates|lessons|episodes)\//, '').replace(/\/$/, '');
  const edges = []; const label = new Map();
  for (const l of nq) {
    const m = /^<([^>]+)> <([^>]+)> (<([^>]+)>|"([^"]*)")/.exec(l); if (!m) continue;
    if (m[2] === 'http://www.w3.org/2004/02/skos/core#prefLabel') label.set(slug(m[1]), m[5]);
    for (const [k, p] of Object.entries(ns)) if (m[2] === p && m[4]) edges.push({ rel: k, from: slug(m[1]), to: slug(m[4]) });
  }
  const files = {}; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.md') && p.includes('/content/') && !p.endsWith('/index.md')) files[path.basename(p, '.md')] = fs.readFileSync(p, 'utf8'); } }(path.join(dir, 'content')));
  return { name, dir, edges, label, files };
}

const outOf = (B, rel, x) => [...new Set(B.edges.filter((e) => e.rel === rel && e.from === x).map((e) => e.to))].sort();
const inTo = (B, rel, x) => [...new Set(B.edges.filter((e) => e.rel === rel && e.to === x).map((e) => e.from))].sort();
function closure(B, rel, x, maxHops) {
  const seen = new Set(); let front = [x];
  for (let h = 0; h < maxHops; h += 1) { const next = []; for (const f of front) for (const t of outOf(B, rel, f)) if (!seen.has(t) && t !== x) { seen.add(t); next.push(t); } front = next; }
  return [...seen].sort();
}
const exactly2 = (B, rel, x) => { const d1 = new Set(outOf(B, rel, x)); const out = new Set(); for (const a of d1) for (const t of outOf(B, rel, a)) if (t !== x) out.add(t); return [...out].sort(); };

function makeQuestions(Bs) {
  const rand = rng(20261118); const qs = [];
  const T = (B, s) => B.label.get(s) || s;
  const pool = (fn) => Bs.flatMap((B) => [...new Set(B.edges.map((e) => e.from).concat(B.edges.map((e) => e.to)))].map((x) => ({ B, x })).filter(({ B: b, x }) => fn(b, x)));
  const take = (cands, n, build) => { const c = [...cands]; let k = 0; while (k < n && c.length) { const { B, x } = c.splice(Math.floor(rand() * c.length), 1)[0]; qs.push({ ...build(B, x), bundle: B.name, subject: x }); k += 1; } };
  const ok = (a) => a.length >= 1 && a.length <= 6;
  take(pool((B, x) => ok(outOf(B, 'requires', x))), 8, (B, x) => ({ type: 'direct', q: `Which items does "${T(B, x)}" require? Use the typed link "requires".`, gold: outOf(B, 'requires', x) }));
  take(pool((B, x) => ok(inTo(B, 'requires', x))), 8, (B, x) => ({ type: 'inverse', q: `Which items require "${T(B, x)}"?`, gold: inTo(B, 'requires', x) }));
  take(pool((B, x) => ok(exactly2(B, 'requires', x)) && outOf(B, 'requires', x).length > 0), 6, (B, x) => ({ type: 'two-step', q: `Which items are required by the items that "${T(B, x)}" requires (the second step of the "requires" links)?`, gold: exactly2(B, 'requires', x) }));
  take(pool((B, x) => closure(B, 'requires', x, 3).length >= 3 && closure(B, 'requires', x, 3).length <= 8), 4, (B, x) => ({ type: 'closure-3', q: `List everything "${T(B, x)}" requires, directly or through other required items, up to three steps.`, gold: closure(B, 'requires', x, 3) }));
  take(pool((B, x) => outOf(B, 'verifiedBy', x).length >= 1 || inTo(B, 'verifies', x).length >= 1), 2, (B, x) => { const g = inTo(B, 'verifies', x); return { type: 'verifies', q: `Which items verify "${T(B, x)}"?`, gold: g }; });
  take(pool((B, x) => outOf(B, 'decidedBy', x).length >= 1), 2, (B, x) => ({ type: 'decided-by', q: `Which item records the decision for "${T(B, x)}" (typed link "decided-by")?`, gold: outOf(B, 'decidedBy', x) }));
  return qs.map((q, i) => ({ id: `t${String(i + 1).padStart(2, '0')}`, ...q }));
}

const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const prf = (got, gold) => { const g = new Set(gold); const tp = got.filter((x) => g.has(x)).length; return { p: got.length ? tp / got.length : (gold.length ? 0 : 1), r: gold.length ? tp / gold.length : 1 }; };

/** Slugs and titles of items named in a model's answer (the subject itself is not an answer). */
function parse(answer, B, subject) {
  const text = String(answer).toLowerCase(); const out = new Set();
  for (const [slug, title] of B.label) {
    if (slug === subject) continue;
    const hit = new RegExp(`(^|[^a-z0-9-])${slug.replace(/[-]/g, '[- ]')}($|[^a-z0-9-])`).test(text) || (title && text.includes(String(title).toLowerCase()));
    if (hit) out.add(slug);
  }
  return [...out].sort();
}

const SYS = 'You answer questions about a set of knowledge items. Use only the text given. Answer with the titles of the items, one per line, and nothing else. If there are none, write NONE.';

(async () => {
  const Bs = BUNDLES.map(load);
  const byName = Object.fromEntries(Bs.map((B) => [B.name, B]));
  const qs = makeQuestions(Bs);
  const rows = [];
  // G1 and G2 (no model)
  const servers = {}; for (const B of Bs) servers[B.name] = await mcpOpen(B.dir);
  for (const q of qs) {
    const B = byName[q.bundle]; const S = servers[q.bundle]; const row = { id: q.id, type: q.type, bundle: q.bundle, q: q.q, gold: q.gold };
    // G1: graph file read by program (same data source as gold, so equal by construction; kept as the cost baseline)
    row.G1 = { answer: q.gold, correct: true, circular: true };
    // G2: tool server
    let calls = 0; let bytes = 0;
    const links = async (slug) => { const r = await S.call('links', { slug }); calls += 1; bytes += Buffer.byteLength(r.text); return r.json ? r.json.body.edges : []; };
    const rel = { direct: 'requires', inverse: 'required-by', 'two-step': 'requires', 'closure-3': 'requires', verifies: 'verified-by', 'decided-by': 'decided-by' };
    const wantKey = q.type === 'verifies' ? 'verifies' : rel[q.type];
    let ans = [];
    const step = async (xs, key) => { const o = new Set(); for (const x of xs) for (const e of await links(x)) if (e.key === key) o.add(e.target); return [...o]; };
    if (q.type === 'direct' || q.type === 'inverse' || q.type === 'decided-by') ans = await step([q.subject], wantKey);
    else if (q.type === 'verifies') ans = await step([q.subject], 'verified-by');
    else if (q.type === 'two-step') ans = (await step(await step([q.subject], 'requires'), 'requires')).filter((x) => x !== q.subject);
    else { const seen = new Set(); let front = [q.subject]; for (let h = 0; h < 3; h += 1) { const nxt = await step(front, 'requires'); front = nxt.filter((x) => !seen.has(x) && x !== q.subject); front.forEach((x) => seen.add(x)); } ans = [...seen]; }
    ans = ans.sort();
    row.G2 = { answer: ans, correct: sameSet(ans, q.gold), tool_calls: calls, bytes_read: bytes, ...prf(ans, q.gold) };
    rows.push(row);
  }
  for (const s of Object.values(servers)) await s.close();

  if (!NO_MODEL) {
    for (const model of MODELS) {
      const retr = {}; for (const B of Bs) retr[B.name] = new Retriever(Object.entries(B.files).map(([id, text]) => ({ id, slug: id, title: B.label.get(id) || id, text })));
      for (const row of rows) {
        const B = byName[row.bundle];
        const run1 = async (key, ctxText, meta = {}) => {
          const r = await chat({ model, seed: 1, messages: [{ role: 'system', content: SYS }, { role: 'user', content: `${ctxText}\n\nQuestion: ${row.q}` }], maxTokens: 300 });
          const got = parse(r.message.content, B, qs.find((q) => q.id === row.id).subject);
          (row[key] = row[key] || {})[model] = { answer: got, raw: r.message.content.slice(0, 300), correct: sameSet(got, row.gold), ...prf(got, row.gold), prompt_tokens: r.promptTokens, ...meta };
        };
        const subj = qs.find((q) => q.id === row.id).subject;
        const need = new Set([subj, ...row.gold]);
        const hit = (top) => top.map((t) => t.id);
        const t1 = retr[row.bundle].top(row.q, 5); const t2 = retr[row.bundle].top(`${row.q} ${subj}`, 5);
        const asText = (top) => top.map((t) => `--- file ${t.id}.md ---\n${B.files[t.id]}`).join('\n\n');
        await run1('B1', asText(t1), { files_with_gold_or_subject: hit(t1).filter((x) => need.has(x)).length });
        await run1('B2', asText(t2), { files_with_gold_or_subject: hit(t2).filter((x) => need.has(x)).length });
        await run1('W', Object.entries(B.files).map(([id, t]) => `--- file ${id}.md ---\n${t}`).join('\n\n'));
      }
    }
  }
  const tally = (get) => { const v = rows.map(get).filter(Boolean); return { n: v.length, exact: v.filter((x) => x.correct).length, precision: +(v.reduce((a, x) => a + x.p, 0) / v.length).toFixed(3), recall: +(v.reduce((a, x) => a + x.r, 0) / v.length).toFixed(3) }; };
  const summary = { G1_graph_read: { n: rows.length, exact: rows.length, note: 'same source as the gold: equal by construction' }, G2_tool_server: tally((r) => r.G2) };
  const byType = {};
  for (const t of ['direct', 'inverse', 'two-step', 'closure-3', 'verifies', 'decided-by']) {
    const sub = rows.filter((r) => r.type === t); byType[t] = { n: sub.length, G2_exact: sub.filter((r) => r.G2.correct).length };
    for (const model of NO_MODEL ? [] : MODELS) for (const k of ['B1', 'B2', 'W']) byType[t][`${k}|${model}`] = sub.filter((r) => r[k][model].correct).length;
  }
  if (!NO_MODEL) for (const model of MODELS) for (const k of ['B1', 'B2', 'W']) summary[`${k}|${model}`] = tally((r) => r[k] && r[k][model]);
  writeResult('c06-typed-link-questions', {
    bundles: Bs.map((B) => ({ name: B.name, items: Object.keys(B.files).length, requires_edges: B.edges.filter((e) => e.rel === 'requires').length, edges_total: B.edges.length })),
    questions: qs.length, models: NO_MODEL ? [] : MODELS, context_tokens_limit: cfg.LIMITS.numCtx,
    gold_source: 'graph.nq of each Bundle build (the published graph). G1 is the gold source itself.', summary, by_type: byType, rows,
  });
})();
