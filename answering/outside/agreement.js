'use strict';
/**
 * The outside check, step 5: agreement between the reader's grades in outside/GRADE-50.md and the program's
 * scores in outside/grade-50-key.json. "partly" counts as wrong. Prints the agreement and Cohen's kappa.
 *
 *   node outside/agreement.js
 */
const fs = require('node:fs');
const path = require('node:path');

function main() {
  const sheet = fs.readFileSync(path.join(__dirname, 'GRADE-50.md'), 'utf8');
  const key = JSON.parse(fs.readFileSync(path.join(__dirname, 'grade-50-key.json'), 'utf8')).rows;
  const grades = [...sheet.matchAll(/^## (\d+)\.[\s\S]*?^Your grade:\s*(\S*)/gm)].map((m) => ({ n: Number(m[1]), grade: m[2].toLowerCase() }));
  const graded = grades.filter((g) => ['correct', 'wrong', 'partly'].includes(g.grade));
  if (graded.length < key.length) {
    console.log(`${graded.length} of ${key.length} answers graded; grade all before measuring agreement.`);
    return;
  }
  let agree = 0; let both = 0; let human = 0; let program = 0;
  for (const g of graded) {
    const h = g.grade === 'correct';
    const p = key.find((k) => k.n === g.n).program_correct;
    agree += h === p ? 1 : 0; both += h && p ? 1 : 0; human += h ? 1 : 0; program += p ? 1 : 0;
  }
  const n = graded.length;
  const po = agree / n;
  const pe = (human / n) * (program / n) + (1 - human / n) * (1 - program / n);
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
  console.log(`agreement ${agree}/${n} = ${(100 * po).toFixed(1)} %; Cohen's kappa ${kappa.toFixed(2)}; reader correct ${human}, program correct ${program}, both ${both}`);
}

if (require.main === module) main();
