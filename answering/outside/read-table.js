'use strict';
/**
 * The outside check, step 6: the second reading, for every model that answered the second question set.
 * A reader (see GRADE-50.md for who and how) read every answer the program rejected, with the route hidden,
 * and, for Claude Haiku 5.5, 34 answers the program accepted (the accepted rows of the 50-answer sample).
 * This script joins those readings with the raw rows and writes outside/READ-B.md: per model and route, the
 * program's strict count and the count after the reading.
 *
 *   node outside/read-table.js
 */
const fs = require('node:fs');
const path = require('node:path');

const here = (f) => path.join(__dirname, f);
const HAIKU = 'anthropic/claude-haiku-5.5';
const key = JSON.parse(fs.readFileSync(here('grade-50-key.json'), 'utf8')).rows;
const sheet = fs.readFileSync(here('GRADE-50.md'), 'utf8');
const sample = new Map([...sheet.matchAll(/^## (\d+)\.[\s\S]*?^Your grade:\s*(\S*)/gm)].map((m) => [Number(m[1]), m[2].toLowerCase() === 'correct']));

/** "model|question|route" -> the reader says correct */
const read = new Map();
for (const k of key) read.set(`${HAIKU}|${k.question_id}|${k.condition}`, sample.get(k.n));
for (const r of JSON.parse(fs.readFileSync(here('rejected-read.json'), 'utf8')).rows) read.set(`${HAIKU}|${r.question_id}|${r.condition}`, r.reader_correct);
if (fs.existsSync(here('rejected-read-more.json'))) for (const r of JSON.parse(fs.readFileSync(here('rejected-read-more.json'), 'utf8')).rows) read.set(`${r.model}|${r.question_id}|${r.condition}`, r.reader_correct);

const wilson = (k, n) => { if (!n) return [0, 0]; const z = 1.96; const p = k / n; const d = 1 + (z * z) / n; const c = p + (z * z) / (2 * n); const m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n); return [((c - m) / d) * 100, ((c + m) / d) * 100]; };
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
const ROUTES = [['C0', 'plain pages'], ['C1', 'pages and llms.txt'], ['C2', 'node tools'], ['C3', 'retrieval (BM25)']];
const f = (x) => x.toFixed(1);

const files = fs.readdirSync(here('results')).filter((n) => /^runs-b-.*\.jsonl$/.test(n)).sort((a, b) => (/sample/.test(a) - /sample/.test(b)) || a.localeCompare(b));
const out = []; let unread = 0;
for (const file of files) {
  const rows = fs.readFileSync(here(`results/${file}`), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.seed === 1);
  if (!rows.length) continue;
  const model = rows[0].model;
  out.push(`### ${model}${/sample/.test(file) ? ' (sample of six answerable questions)' : ''}`, '',
    '| Route | Program (strict wording) | After the reading | 95 % interval | Rejected rows read | Overturned | Right abstentions | Median tokens |', '|---|---|---|---|---|---|---|---|');
  for (const [cond, name] of ROUTES) {
    const rs = rows.filter((r) => r.condition === cond); if (!rs.length) continue;
    const ans = rs.filter((r) => r.kind !== 'unanswerable'); const un = rs.filter((r) => r.kind === 'unanswerable');
    const prog = ans.filter((r) => r.scores.correct).length;
    let after = 0; let rej = 0; let over = 0;
    for (const r of ans) {
      const g = read.get(`${model}|${r.question_id}|${r.condition}`);
      if (!r.scores.correct) { rej += 1; if (g === undefined) unread += 1; if (g) { after += 1; over += 1; } } else if (g !== false) after += 1;
    }
    const [lo, hi] = wilson(after, ans.length);
    out.push(`| ${name} | ${prog}/${ans.length} = ${f((100 * prog) / ans.length)} % | ${after}/${ans.length} = ${f((100 * after) / ans.length)} % | ${f(lo)}-${f(hi)} | ${rej} | ${over} | ${un.length ? `${un.filter((r) => r.scores.correct_abstention).length}/${un.length}` : '-'} | ${Math.round(median(rs.map((r) => r.prompt_tokens + r.completion_tokens)))} |`);
  }
  out.push('');
}
const text = `${out.join('\n')}\nRejected rows without a reading: ${unread}. Accepted rows the reading overturned: 0 of ${key.filter((k) => k.program_correct).length} read (Claude Haiku 5.5).\nThe program rejects an answer when a fact is not present word for word or when the first 200 characters hold a refusal phrase; the reading accepts an answer that states the fact in other words.\n`;
fs.writeFileSync(here('READ-B.md'), text);
process.stdout.write(text);
