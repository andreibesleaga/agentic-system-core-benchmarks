'use strict';
/**
 * Checks the question set (leakage of facts into any wording, gold items exist, counts) and writes the
 * SHA-256 of questions/questions.jsonl to questions/FROZEN.sha256. Run once, before any model run on the
 * questions. `node src/freeze.js --check` verifies the hash instead of writing it.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cfg = require('./config');
const corpus = require('./corpus');
const { leakedFacts } = require('./scorer');

const file = path.join(cfg.STUDY, 'questions/questions.jsonl');
const hashFile = path.join(cfg.STUDY, 'questions/FROZEN.sha256');
const sha = () => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function validate(rows) {
  const problems = [];
  const items = Object.fromEntries(cfg.NODES.map((n) => [n, corpus.items(n)]));
  const count = {};
  for (const q of rows) {
    count[q.kind] = (count[q.kind] || 0) + 1;
    for (const g of q.gold) if (!items[q.node].has(g)) problems.push(`${q.id}: gold item ${g} is not published on ${q.node}`);
    for (const form of q.forms) for (const f of leakedFacts({ q: form, facts: q.facts })) problems.push(`${q.id}: fact ${f} readable in "${form}"`);
    if (q.kind === 'unanswerable' && q.gold.length) problems.push(`${q.id}: unanswerable with gold`);
    if (q.kind !== 'unanswerable' && !q.facts.length) problems.push(`${q.id}: no facts`);
  }
  return { problems, count };
}

const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const { problems, count } = validate(rows);
console.log(JSON.stringify(count), problems.length ? problems.join('\n') : 'no problems');
if (process.argv.includes('--check')) {
  const ok = fs.readFileSync(hashFile, 'utf8').split(/\s+/)[0] === sha();
  console.log(ok ? 'hash matches' : 'HASH MISMATCH'); process.exit(ok && !problems.length ? 0 : 1);
}
if (problems.length) process.exit(1);
fs.writeFileSync(hashFile, `${sha()}  questions/questions.jsonl\nfrozen: ${new Date().toISOString()} (before any model run on these questions)\n`);
console.log('frozen', sha());
