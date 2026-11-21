'use strict';
/**
 * The graph study, step 3: tables from the raw rows. No model and no network. Scores are recomputed from each
 * stored answer, so a change of the scorer shows here without a new run.
 *
 *   node graph/report.js      -> graph/TABLE-G.md (printed too)
 */
const fs = require('node:fs');
const path = require('node:path');
const { SITES, loadGraph, scoreList, withCards } = require('./lib');

const ROUTES = [['P', 'pages'], ['R', 'retrieval (BM25)'], ['T', 'tools without relations'], ['G', 'graph tools']];
const questions = new Map(fs.readFileSync(path.join(__dirname, 'questions-g.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).map((q) => [q.id, q]));
const graphs = Object.fromEntries(Object.keys(SITES).map((n) => [n, loadGraph(n)]));
const wilson = (k, n) => { if (!n) return [0, 0]; const z = 1.96; const p = k / n; const d = 1 + (z * z) / n; const c = p + (z * z) / (2 * n); const m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n); return [((c - m) / d) * 100, ((c + m) / d) * 100]; };
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const f = (x) => x.toFixed(1);

const files = fs.readdirSync(path.join(__dirname, 'results')).filter((n) => /^runs-g-.*\.jsonl$/.test(n)).sort();
const lines = [];
const byType = {};
for (const file of files) {
  const rows = fs.readFileSync(path.join(__dirname, 'results', file), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
    .map((r) => ({ ...r, s: scoreList(withCards(questions.get(r.question_id), graphs), r.answer) }));
  if (!rows.length) continue;
  const sample = /-sample-/.test(file);
  lines.push(`### ${rows[0].model}${sample ? ' (sample of six questions)' : ''}`, '', '| Route | Rows | Exact set (with a card to find) | 95 % interval | Mean recall | Mean precision | "None" right | Median tokens | Errors |', '|---|---|---|---|---|---|---|---|---|');
  for (const [route, name] of ROUTES) {
    const rs = rows.filter((r) => r.route === route); if (!rs.length) continue;
    const some = rs.filter((r) => r.gold_titles.length); const none = rs.filter((r) => !r.gold_titles.length);
    const k = some.filter((r) => r.s.exact).length; const [lo, hi] = wilson(k, some.length);
    lines.push(`| ${name} | ${rs.length} | ${k}/${some.length} = ${f(some.length ? (100 * k) / some.length : 0)} % | ${f(lo)}-${f(hi)} | ${f(100 * mean(some.map((r) => r.s.recall)))} % | ${f(100 * mean(some.map((r) => r.s.precision)))} % | ${none.filter((r) => r.s.exact).length}/${none.length} | ${Math.round(median(rs.map((r) => r.prompt_tokens + r.completion_tokens)))} | ${rs.filter((r) => r.error).length} |`);
    if (!sample) for (const r of rs) { const key = `${r.type}|${route}`; byType[key] = byType[key] || { k: 0, n: 0 }; byType[key].n += 1; byType[key].k += r.s.exact ? 1 : 0; }
  }
  lines.push('');
}
const types = [...new Set([...questions.values()].map((q) => q.type))];
lines.push('### Exact answers by question type, the full runs pooled', '', `| Type | Questions | ${ROUTES.map(([, n]) => n).join(' | ')} |`, `|---|---|${ROUTES.map(() => '---').join('|')}|`);
for (const t of types) lines.push(`| ${t} | ${[...questions.values()].filter((q) => q.type === t).length} | ${ROUTES.map(([r]) => { const c = byType[`${t}|${r}`]; return c ? `${c.k}/${c.n} = ${f((100 * c.k) / c.n)} %` : '-'; }).join(' | ')} |`);
const text = `${lines.join('\n')}\n`;
fs.writeFileSync(path.join(__dirname, 'TABLE-G.md'), text);
process.stdout.write(text);
