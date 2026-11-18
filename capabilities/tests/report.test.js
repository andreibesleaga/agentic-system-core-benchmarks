'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('REPORT.md uses none of the words this project does not use about itself', () => {
  const f = path.join(__dirname, '..', 'REPORT.md');
  if (!fs.existsSync(f)) return; // before the first report
  const text = fs.readFileSync(f, 'utf8');
  for (const w of ['first-ever', 'unique', 'revolutionary', 'groundbreaking', 'game-changing']) assert.ok(!new RegExp(`\\b${w}\\b`, 'i').test(text), w);
});

test('every results file is valid JSON', () => {
  const d = path.join(__dirname, '..', 'results');
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.json'))) JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
});
