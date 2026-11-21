'use strict';
/**
 * The outside check, step 3: a seeded sample of 50 answers from the second question set, for a person to
 * grade by hand without seeing the route or the program's score. Writes two files:
 *   outside/GRADE-50.md       the sheet: question, the facts the program looked for, the gold item's address,
 *                             the answer, and a line to fill in (correct / wrong / partly)
 *   outside/grade-50-key.json which row each sheet entry is, with the route and the program's score; read it
 *                             only after grading, to measure agreement (outside/agreement.js)
 *
 *   node outside/grading-sheet.js
 */
const fs = require('node:fs');
const path = require('node:path');
const { rng, shuffled } = require('./write-questions');

const RUNS = path.join(__dirname, 'results', 'runs-b-anthropic_claude_haiku_5.5.jsonl');
const QUESTIONS = path.join(__dirname, 'questions-b.jsonl');
const SEED = 50;
const SIZE = 50;

function main() {
  const questions = new Map(fs.readFileSync(QUESTIONS, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).map((q) => [q.id, q]));
  const rows = fs.readFileSync(RUNS, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
    .filter((r) => r.kind !== 'unanswerable');
  const picked = shuffled(rows, rng(SEED)).slice(0, SIZE);
  const sheet = ['# Grading sheet: 50 answers from the second question set', '',
    'For each answer, write **correct**, **wrong** or **partly** after "Your grade". Judge only whether the answer gives',
    'what the question asks, as the gold item states it (open the address if unsure). The route and the program\'s score',
    'are hidden on purpose; they are in `grade-50-key.json`, to be read after grading.', ''];
  const key = [];
  picked.forEach((r, i) => {
    const q = questions.get(r.question_id);
    const n = String(i + 1).padStart(2, '0');
    sheet.push(`## ${n}. ${q.q}`, '', `Gold item(s): ${q.gold.join(', ')} on the ${q.node} node. Facts the program looked for: ${q.facts.map((f) => `\`${f.replace(/\\/g, '')}\``).join(', ')}`, '',
      '> ' + String(r.answer || '(no answer)').trim().replace(/\n/g, '\n> '), '', 'Your grade: ', '');
    key.push({ n: Number(n), question_id: r.question_id, condition: r.condition, program_correct: r.scores.correct });
  });
  fs.writeFileSync(path.join(__dirname, 'GRADE-50.md'), `${sheet.join('\n')}\n`);
  fs.writeFileSync(path.join(__dirname, 'grade-50-key.json'), `${JSON.stringify({ seed: SEED, size: SIZE, rows: key }, null, 2)}\n`);
  console.log(`wrote ${picked.length} answers to outside/GRADE-50.md and the key to outside/grade-50-key.json`);
}

if (require.main === module) main();
