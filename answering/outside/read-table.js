'use strict';
/**
 * The outside check, step 6: the second reading. A reader (see GRADE-50.md for who and how) read every answer
 * the program rejected on the second question set (79 rows), with the route hidden, and 34 answers the program
 * accepted (the accepted rows of the 50-answer sample). This script joins those grades with the raw rows and
 * writes outside/READ-B.md: per route, the program's strict count and the count after the reading.
 *
 *   node outside/read-table.js
 */
const fs = require('node:fs');
const path = require('node:path');

const here = (f) => path.join(__dirname, f);
const rows = fs.readFileSync(here('results/runs-b-anthropic_claude_haiku_5.5.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const key = JSON.parse(fs.readFileSync(here('grade-50-key.json'), 'utf8')).rows;
const sheet = fs.readFileSync(here('GRADE-50.md'), 'utf8');
const sample = new Map([...sheet.matchAll(/^## (\d+)\.[\s\S]*?^Your grade:\s*(\S*)/gm)].map((m) => [Number(m[1]), m[2].toLowerCase() === 'correct']));
const rejected = JSON.parse(fs.readFileSync(here('rejected-read.json'), 'utf8')).rows;

const read = new Map(); // "question|route" -> reader says correct
for (const k of key) read.set(`${k.question_id}|${k.condition}`, sample.get(k.n));
for (const r of rejected) read.set(`${r.question_id}|${r.condition}`, r.reader_correct);

const wilson = (k, n) => { const z = 1.96; const p = k / n; const d = 1 + (z * z) / n; const c = p + (z * z) / (2 * n); const m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n); return [((c - m) / d) * 100, ((c + m) / d) * 100]; };
const ROUTES = [['C0', 'plain pages'], ['C1', 'pages and llms.txt'], ['C2', 'node tools'], ['C3', 'retrieval (BM25)']];
const f = (x) => x.toFixed(1);
const lines = ['| Route | Program (strict wording) | After the reading | 95 % interval | Rejected rows read | Overturned |', '|---|---|---|---|---|---|'];
let unread = 0; let overturnedAccepted = 0;
for (const [cond, name] of ROUTES) {
  const ans = rows.filter((r) => r.condition === cond && r.seed === 1 && r.kind !== 'unanswerable');
  const prog = ans.filter((r) => r.scores.correct).length;
  let after = 0; let rej = 0; let over = 0;
  for (const r of ans) {
    const g = read.get(`${r.question_id}|${r.condition}`);
    if (!r.scores.correct) { rej += 1; if (g === undefined) unread += 1; if (g) { after += 1; over += 1; } }
    else { if (g === false) overturnedAccepted += 1; else after += 1; }
  }
  const [lo, hi] = wilson(after, ans.length);
  lines.push(`| ${name} | ${prog}/${ans.length} = ${f((100 * prog) / ans.length)} % | ${after}/${ans.length} = ${f((100 * after) / ans.length)} % | ${f(lo)}-${f(hi)} | ${rej} | ${over} |`);
}
const text = `${lines.join('\n')}\n\nRejected rows without a reading: ${unread}. Accepted rows the reading overturned: ${overturnedAccepted} of ${key.filter((k) => k.program_correct).length} read.\nThe program rejects an answer when a fact is not present word for word or when the first 200 characters hold a refusal phrase; the reading accepts an answer that states the fact in other words.\n`;
fs.writeFileSync(here('READ-B.md'), text);
process.stdout.write(text);
