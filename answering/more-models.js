'use strict';
/**
 * The first question set by model, original wording (seed 1) only, so that models with one pass can be read
 * beside models with several. Writes MORE-MODELS.md; no model and no network.
 * REPORT.md (all seeds, intervals, paired tests) stays the report of the study; this table adds the models
 * that ran later.
 *
 *   node more-models.js
 */
const fs = require('node:fs');
const path = require('node:path');

const dir = path.join(__dirname, 'results');
const ROUTES = [['C0', 'plain pages'], ['C1', 'pages and llms.txt'], ['C2', 'node tools'], ['C3', 'retrieval (BM25)']];
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
const wilson = (k, n) => { if (!n) return [0, 0]; const z = 1.96; const p = k / n; const d = 1 + (z * z) / n; const c = p + (z * z) / (2 * n); const m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n); return [((c - m) / d) * 100, ((c + m) / d) * 100]; };
const f = (x) => x.toFixed(1);
const lines = ['| Model | Route | Correct (answerable) | 95 % interval | Right abstentions | Median tokens | Empty answers |', '|---|---|---|---|---|---|---|'];
for (const file of fs.readdirSync(dir).filter((n) => /^runs-.*\.jsonl$/.test(n) && !n.includes('smoke')).sort()) {
  const rows = fs.readFileSync(path.join(dir, file), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.seed === 1);
  for (const [cond, name] of ROUTES) {
    const rs = rows.filter((r) => r.condition === cond); if (!rs.length) continue;
    const ans = rs.filter((r) => r.kind !== 'unanswerable'); const un = rs.filter((r) => r.kind === 'unanswerable');
    const k = ans.filter((r) => r.scores.correct).length; const [lo, hi] = wilson(k, ans.length);
    lines.push(`| ${rs[0].model} | ${name} | ${k}/${ans.length} = ${f((100 * k) / ans.length)} % | ${f(lo)}-${f(hi)} | ${un.filter((r) => r.scores.correct_abstention).length}/${un.length} | ${Math.round(median(rs.map((r) => r.prompt_tokens + r.completion_tokens)))} | ${rs.filter((r) => !(r.answer || '').trim()).length} |`);
  }
}
const text = `# The first question set by model, original wording\n\n${lines.join('\n')}\n\nRows of seed 1 (the original wording of each question). The hosted runs of 17-18 Nov stopped at their token caps, so Claude Sonnet 5.5 has fewer questions. \`deepseek/deepseek-v4.1-flash\` ran on 21 Nov 2026 with an answer limit of 1,500 tokens (it reasons before it answers); the earlier runs had 400. An empty answer counts as wrong.\n`;
fs.writeFileSync(path.join(__dirname, 'MORE-MODELS.md'), text);
process.stdout.write(text);
