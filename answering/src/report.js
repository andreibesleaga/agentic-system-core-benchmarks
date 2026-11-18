'use strict';
/**
 * Rebuilds every number from the raw rows: re-scores each stored answer with src/scorer.js, aggregates,
 * and writes reports/summary.json and reports/tables.md. If reports/final-template.md exists, the
 * {{table-name}} placeholders in it are replaced by the generated tables and the result is written to REPORT.md.
 * node src/report.js
 */
// The local-model rows ran with an 8,192-token context; the truncation table of section 4 depends on that limit,
// so a BENCH_NUM_CTX set for a hosted-model run must not change the report.
delete process.env.BENCH_NUM_CTX;
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');
const corpus = require('./corpus');
const { scoreAnswer } = require('./scorer');
const S = require('./stats');
const D = require('./diagnostics');

const readJsonl = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const pct = (c) => (c ? `${(100 * c.value).toFixed(1)} [${(100 * c.low).toFixed(1)}, ${(100 * c.high).toFixed(1)}]` : 'n/a');
const num = (c, d = 1) => (c ? `${c.value.toFixed(d)} [${c.low.toFixed(d)}, ${c.high.toFixed(d)}]` : 'n/a');
const fmtP = (p) => (p < 0.001 ? '<0.001' : p.toFixed(3));

function load() {
  const questions = new Map(readJsonl(path.join(cfg.STUDY, 'questions/questions.jsonl')).map((q) => [q.id, q]));
  const items = Object.fromEntries(cfg.NODES.map((n) => [n, corpus.items(n)]));
  const rows = [];
  const dir = path.join(cfg.STUDY, 'results');
  for (const f of fs.readdirSync(dir).filter((x) => /^runs-.*\.jsonl$/.test(x) && !x.includes('smoke'))) {
    for (const r of readJsonl(path.join(dir, f))) {
      const q = questions.get(r.question_id);
      rows.push({ ...r, q, scores: scoreAnswer(q, r.answer, { items: items[q.node] }) });
    }
  }
  return { questions, rows };
}

/** Per-question mean over seeds of f(row), for the rows of one model and condition, in question order. */
function perQuestion(rows, model, cond, kinds, f) {
  const by = new Map();
  for (const r of rows) {
    if (r.model !== model || r.condition !== cond || !kinds.includes(r.kind) || r.error) continue;
    if (!by.has(r.question_id)) by.set(r.question_id, []);
    by.get(r.question_id).push(f(r));
  }
  return by;
}
const meanMap = (by) => new Map([...by].map(([k, v]) => [k, S.mean(v)]));
const ANSWERABLE = ['single', 'two']; const SINGLE = ['single']; const TWO = ['two']; const NONE = ['unanswerable'];
const b = (x) => (x ? 1 : 0);

function summarise(rows, model, cond) {
  const col = (kinds, f) => { const m = meanMap(perQuestion(rows, model, cond, kinds, f)); return m.size ? S.meanCI([...m.values()]) : null; };
  const mine = rows.filter((r) => r.model === model && r.condition === cond);
  const col2 = (f) => (mine.length ? S.medianCI(mine.map(f)) : null);
  return {
    model, cond, rows: mine.length, errors: mine.filter((r) => r.error).length,
    correct: col(ANSWERABLE, (r) => b(r.scores.correct)), correct_single: col(SINGLE, (r) => b(r.scores.correct)),
    correct_two: col(TWO, (r) => b(r.scores.correct)),
    cited_all: col(ANSWERABLE, (r) => b(r.scores.cited_all)), cited_any: col(ANSWERABLE, (r) => b(r.scores.cited_any)),
    correct_and_cited: col(ANSWERABLE, (r) => b(r.scores.correct && r.scores.cited_all)),
    verifiable: col(ANSWERABLE, (r) => b(r.scores.verifiable)),
    abstain_ok: col(NONE, (r) => b(r.scores.correct_abstention)), false_abstain: col(ANSWERABLE, (r) => b(r.scores.false_abstention)),
    tool_calls: col2((r) => r.n_tool_calls), tokens: col2((r) => r.prompt_tokens + r.completion_tokens),
    seconds: (() => { const ok = mine.filter((r) => r.wall_ms > 0); return ok.length ? S.medianCI(ok.map((r) => r.wall_ms / 1000)) : null; })(),
  };
}

function comparisons(rows, model, a, base) {
  const out = [];
  const measures = [['correct', ANSWERABLE, (r) => b(r.scores.correct)], ['cited (all gold items)', ANSWERABLE, (r) => b(r.scores.cited_all)],
    ['correct abstention', NONE, (r) => b(r.scores.correct_abstention)], ['tokens (prompt+completion)', ANSWERABLE.concat(NONE), (r) => r.prompt_tokens + r.completion_tokens]];
  for (const [name, kinds, f] of measures) {
    const ma = meanMap(perQuestion(rows, model, a, kinds, f)); const mb = meanMap(perQuestion(rows, model, base, kinds, f));
    const ids = [...ma.keys()].filter((k) => mb.has(k)).sort();
    if (ids.length < 3) continue;
    out.push({ model, a, base, measure: name, ...S.paired(ids.map((k) => ma.get(k)), ids.map((k) => mb.get(k))) });
  }
  return out;
}

function tableMain(sums) {
  const head = '| Model | Condition | Rows | Correct % (answerable, n=50 questions) | Cited % (all gold items) | Correct abstention % (n=10) | Median tool calls | Median tokens | Median seconds |\n|---|---|---|---|---|---|---|---|---|';
  const lines = sums.map((s) => `| ${s.model} | ${s.cond} | ${s.rows} | ${pct(s.correct)} | ${pct(s.cited_all)} | ${pct(s.abstain_ok)} | ${num(s.tool_calls, 1)} | ${num(s.tokens, 0)} | ${num(s.seconds, 1)} |`);
  return [head, ...lines].join('\n');
}

function tableExtra(sums) {
  const head = '| Model | Condition | Correct, one-item (n=40) | Correct, two-item (n=10) | Correct and cited | Cited (any gold item) | False abstention on answerable | Verifiable citation | Run errors |\n|---|---|---|---|---|---|---|---|---|';
  return [head, ...sums.map((s) => `| ${s.model} | ${s.cond} | ${pct(s.correct_single)} | ${pct(s.correct_two)} | ${pct(s.correct_and_cited)} | ${pct(s.cited_any)} | ${pct(s.false_abstain)} | ${pct(s.verifiable)} | ${s.errors} |`)].join('\n');
}

function tableCompare(cmps) {
  const ps = cmps.map((c) => c.p_sign); const adj = S.holm(ps) || ps;
  const head = '| Model | Comparison | Measure | Mean difference [95 % bootstrap] | Questions higher / lower / tied | Sign test p | Holm-adjusted p | Permutation p |\n|---|---|---|---|---|---|---|---|';
  const lines = cmps.map((c, i) => `| ${c.model} | ${c.a} vs ${c.base} | ${c.measure} | ${c.mean_difference.toFixed(3)} [${c.low.toFixed(3)}, ${c.high.toFixed(3)}] | ${c.wins_a} / ${c.wins_b} / ${c.ties} | ${fmtP(c.p_sign)} | ${fmtP(adj[i])} | ${fmtP(c.p_permutation)} |`);
  return [head, ...lines].join('\n');
}

function tableNoModel() {
  const f = path.join(cfg.STUDY, 'results/nomodel.json');
  if (!fs.existsSync(f)) return '(no-model results not yet produced)';
  const rows = JSON.parse(fs.readFileSync(f, 'utf8'));
  const med = (g) => { const v = rows.map(g).filter((x) => x !== null && x !== undefined); return v.length ? S.median(v) : null; };
  const line = (label, key) => `| ${label} | ${med((r) => r[key] && r[key].bytes)} | ${med((r) => r[key] && r[key].tokens)} | ${rows.filter((r) => r[key]).length} |`;
  const rec = (k) => `${rows.filter((r) => r[k]).length}/${rows.length}`;
  return [
    '| What the agent reads to reach one fact | Median bytes | Median tokens (o200k_base) | Questions |', '|---|---|---|---|',
    line('C0: pages on the shortest link path from the home page, with the item page', 'read_C0_path'),
    line('C1: llms.txt plus the item page', 'read_C1_llms_plus_page'),
    line('C2: one search answer plus read of the item', 'read_C2_search_plus_read'),
    line('C3: the five passages put in the prompt', 'read_C3_top5_prompt'),
    line('C4: the whole corpus pasted (cut to the context limit)', 'read_C4_whole_corpus'),
    line('Reference: the gold item page alone', 'read_gold_page_only'),
    line('Reference: the gold chunk alone', 'read_gold_chunk_only'),
    '', `The node's read tool returned chunk digests inside the 3,500-character limit for ${rows.filter((r) => r.c2_read_digests_in_capped_output > 0).length}/${rows.length} gold reads; where it did, every digest matched the published chunks.jsonl for ${rows.filter((r) => r.c2_read_digests_match_published === true).length}/${rows.filter((r) => r.c2_read_digests_in_capped_output > 0).length}.`,
    '', `Retrieval without a model (questions as authored, n=${rows.length}): C3 BM25 top-5 holds every gold item for ${rec('recall5_C3_all_gold')}; its top hit is a gold item for ${rec('top1_C3')}; the node's search tool lists every gold item for ${rec('recall_C2_search_all_gold')}; the node's ask tool cites every gold item for ${rec('recall_C2_ask_all_gold')}. Median click depth from the home page to a gold item: ${med((r) => r.c0_hops)} link(s).`,
  ].join('\n');
}

function main() {
  const { rows } = load();
  const models = [...new Set(rows.map((r) => r.model))].sort();
  const sums = []; const cmps = [];
  for (const model of models) {
    for (const cond of cfg.CONDITIONS) if (rows.some((r) => r.model === model && r.condition === cond)) sums.push(summarise(rows, model, cond));
    for (const base of ['C0', 'C1', 'C3', 'C4']) cmps.push(...comparisons(rows, model, 'C2', base));
    cmps.push(...comparisons(rows, model, 'C0h', 'C0'), ...comparisons(rows, model, 'C1h', 'C1'), ...comparisons(rows, model, 'C0h', 'C3'), ...comparisons(rows, model, 'C1h', 'C3'), ...comparisons(rows, model, 'C2u', 'C0h'), ...comparisons(rows, model, 'C2u', 'C1h'));
    for (const base of ['C0', 'C1', 'C2', 'C3', 'C4']) cmps.push(...comparisons(rows, model, 'C2u', base));
    cmps.push(...comparisons(rows, model, 'C2b', 'C3'), ...comparisons(rows, model, 'C2b', 'C2'));
    cmps.push(...comparisons(rows, model, 'C3', 'C0'), ...comparisons(rows, model, 'C3', 'C4'));
  }
  const tables = { main: tableMain(sums), extra: tableExtra(sums), compare: tableCompare(cmps), nomodel: tableNoModel(), loops: D.loopTable(rows), truncation: D.truncationTable(rows) };
  fs.mkdirSync(path.join(cfg.STUDY, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(cfg.STUDY, 'reports/summary.json'), `${JSON.stringify({ sums, cmps }, null, 1)}\n`);
  fs.writeFileSync(path.join(cfg.STUDY, 'reports/tables.md'), Object.entries(tables).map(([k, v]) => `## ${k}\n\n${v}\n`).join('\n'));
  const tpl = path.join(cfg.STUDY, 'reports/final-template.md');
  if (fs.existsSync(tpl)) {
    const text = fs.readFileSync(tpl, 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => (tables[k] !== undefined ? tables[k] : `{{${k}}}`));
    fs.writeFileSync(path.join(cfg.STUDY, 'REPORT.md'), text);
  }
  process.stderr.write(`report: ${rows.length} rows, models ${models.join(', ')}\n`);
}
if (require.main === module) main();
