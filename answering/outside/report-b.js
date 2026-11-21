'use strict';
/**
 * The outside check, step 4: the table for the second question set, by route, beside the first set's figures
 * for the same model, routes and seed. Writes outside/TABLE-B.md; prints it too.
 *
 *   node outside/report-b.js
 */
const fs = require('node:fs');
const path = require('node:path');

const RUNS_B = path.join(__dirname, 'results', 'runs-b-anthropic_claude_haiku_5.5.jsonl');
const RUNS_A = path.join(__dirname, '..', 'results', 'runs-anthropic_claude_haiku_5.5.jsonl');
const ROUTES = [['C0', 'plain pages'], ['C1', 'pages and llms.txt'], ['C2', 'node tools'], ['C3', 'retrieval (BM25)']];

const read = (file) => fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

/** Wilson 95 % interval, in percent. */
function wilson(k, n) {
  if (!n) return [0, 0];
  const z = 1.96; const p = k / n; const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n); const m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return [((c - m) / d) * 100, ((c + m) / d) * 100];
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };

function summary(rows, cond) {
  const rs = rows.filter((r) => r.condition === cond && r.seed === 1);
  const ans = rs.filter((r) => r.kind !== 'unanswerable');
  const un = rs.filter((r) => r.kind === 'unanswerable');
  const k = ans.filter((r) => r.scores.correct).length;
  const [lo, hi] = wilson(k, ans.length);
  return {
    rows: rs.length, correct: `${k}/${ans.length}`, pct: ans.length ? (100 * k) / ans.length : 0, lo, hi,
    cited: ans.length ? (100 * ans.filter((r) => r.scores.cited_all).length) / ans.length : 0,
    abst: `${un.filter((r) => r.scores.correct_abstention).length}/${un.length}`,
    tokens: median(rs.map((r) => r.prompt_tokens + r.completion_tokens)),
  };
}

function main() {
  const b = read(RUNS_B);
  const a = fs.existsSync(RUNS_A) ? read(RUNS_A) : [];
  const f = (x) => x.toFixed(1);
  const lines = ['| Route | Set | Rows | Correct (answerable) | 95 % interval | Cited every gold item | Right abstentions | Median tokens |', '|---|---|---|---|---|---|---|---|'];
  for (const [cond, name] of ROUTES) {
    for (const [label, rows] of [['first (Claude-written)', a], ['second (Gemini-written)', b]]) {
      const s = summary(rows, cond);
      if (!s.rows) continue;
      lines.push(`| ${name} | ${label} | ${s.rows} | ${s.correct} = ${f(s.pct)} % | ${f(s.lo)}-${f(s.hi)} | ${f(s.cited)} % | ${s.abst} | ${Math.round(s.tokens)} |`);
    }
  }
  const spent = b.reduce((t, r) => t + r.prompt_tokens + r.completion_tokens, 0);
  const text = `${lines.join('\n')}\n\nModel anthropic/claude-haiku-5.5, seed 1 (the original wording) for both sets. Second set: ${b.length} rows, ${spent} tokens.\n`;
  fs.writeFileSync(path.join(__dirname, 'TABLE-B.md'), text);
  process.stdout.write(text);
}

if (require.main === module) main();
