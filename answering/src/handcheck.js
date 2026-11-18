'use strict';
/**
 * Hand check. `node src/handcheck.js sample` prints 30 randomly chosen raw rows (seeded) with the
 * mechanical verdict hidden, for a reader to judge. The reader's verdicts go to results/handcheck.jsonl as
 * {"key": "...", "correct": true|false|null, "cited": true|false|null, "abstained_ok": true|false|null}.
 * `node src/handcheck.js agree` compares the verdicts with the mechanical score.
 */
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');

const dir = path.join(cfg.STUDY, 'results');
const rows = () => fs.readdirSync(dir).filter((f) => /^runs-.*\.jsonl$/.test(f) && !f.includes('smoke'))
  .flatMap((f) => fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)));
const key = (r) => `${r.question_id}|${r.condition}|${r.model}|${r.seed}`;

function lcg(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

function sample() {
  const all = rows().filter((r) => !r.error).sort((a, b) => key(a).localeCompare(key(b)));
  const rnd = lcg(20261117); const picked = new Set();
  while (picked.size < Math.min(30, all.length)) picked.add(Math.floor(rnd() * all.length));
  return [...picked].sort((a, b) => a - b).map((i) => all[i]);
}

function agree() {
  const f = path.join(dir, 'handcheck.jsonl');
  const verdicts = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const byKey = new Map(rows().map((r) => [key(r), r]));
  let n = 0; let same = 0; const diffs = [];
  for (const v of verdicts) {
    const r = byKey.get(v.key); if (!r) continue;
    const mech = r.kind === 'unanswerable' ? r.scores.correct_abstention : r.scores.correct;
    const human = r.kind === 'unanswerable' ? v.abstained_ok : v.correct;
    n += 1; if (mech === human) same += 1; else diffs.push({ key: v.key, mech, human, note: v.note });
  }
  return { n, same, agreement: n ? same / n : null, diffs };
}

if (require.main === module) {
  if (process.argv[2] === 'sample') for (const r of sample()) console.log(`### ${key(r)} [${r.kind}] Q: ${r.question_run}\nA: ${r.answer}\n`);
  else console.log(JSON.stringify(agree(), null, 1));
}
module.exports = { sample, agree, key };
