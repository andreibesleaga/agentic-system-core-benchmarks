'use strict';
const test = require('node:test');
const assert = require('node:assert');
process.env.BENCH_SCRATCH = process.env.BENCH_SCRATCH || '/nonexistent';
const { scoreList, answerPart, forms } = require('../lib');

const c = (title, slug) => ({ title, slug });
const q = { gold: [c('Digest fields (RFC 9530)', 'digest-fields'), c('Link sets (RFC 9264)', 'link-sets')], subjects: [c('Check a published file against its digest', 'check-a-published-file')],
  pool: [c('RDF', 'rdf'), c('JSON-LD 1.1', 'json-ld'), c('Web linking (RFC 8288)', 'web-linking'), c('Blackboard', 'blackboard'), c('The Autonomy Ladder', 'autonomy-ladder')] };

test('a title may be written without its part in parentheses', () => {
  assert.deepStrictEqual(forms(c('Digest fields (RFC 9530)', 'digest-fields')), ['digest fields rfc 9530', 'digest fields']);
  const s = scoreList(q, 'Answer: Digest Fields; Link sets (RFC 9264)\nSources: digest-fields, link-sets');
  assert.strictEqual(s.exact, true); assert.strictEqual(s.found, 2); assert.strictEqual(s.extras, 0);
});
test('a missing title lowers recall and an extra title lowers precision', () => {
  const s = scoreList(q, 'Answer: Digest fields (RFC 9530); Web linking (RFC 8288)\nSources: x');
  assert.strictEqual(s.exact, false); assert.strictEqual(s.found, 1); assert.strictEqual(s.extras, 1);
  assert.strictEqual(s.recall, 0.5); assert.strictEqual(s.precision, 0.5);
});
test('the subject of the question and the Sources line are not counted as extra titles', () => {
  const s = scoreList(q, 'Answer: Check a published file against its digest is related to Digest fields (RFC 9530); Link sets (RFC 9264)\nSources: blackboard, rdf');
  assert.strictEqual(s.exact, true);
});
test('a question with no card: NONE is right, a title is wrong, NOT_FOUND is wrong', () => {
  const none = { gold: [], subjects: [c('RDF', 'rdf')], pool: [c('SHACL', 'shacl'), c('SKOS', 'skos')] };
  assert.strictEqual(scoreList(none, 'Answer: NONE\nSources: rdf').exact, true);
  assert.strictEqual(scoreList(none, 'Answer: SHACL\nSources: rdf').exact, false);
  assert.strictEqual(scoreList(none, 'Answer: NOT_FOUND').exact, false);
  assert.strictEqual(scoreList(none, '').exact, false);
});
test('a fact asked beside the list must be present', () => {
  const two = { ...q, facts: ['skos:member'] };
  assert.strictEqual(scoreList(two, 'Answer: Digest fields; Link sets; skos:member\nSources: a').exact, true);
  assert.strictEqual(scoreList(two, 'Answer: Digest fields; Link sets\nSources: a').exact, false);
});
test('a card may be named by its identifier, or without a leading article', () => {
  const g = { gold: [c('Canary and Shadow Deployment for Prompts and Models', 'canary-and-shadow-prompts'), c('The Autonomy Ladder', 'autonomy-ladder')], subjects: [], pool: q.pool.slice(0, 4) };
  assert.strictEqual(scoreList(g, 'Answer: Canary and Shadow Prompts; Autonomy Ladder\nSources: x').exact, true);
});
test('the answer part runs from the last Answer label to the Sources label', () => {
  assert.strictEqual(answerPart('Answer: a\nmore\nAnswer: b; c\nd\nSources: e').trim(), 'b; c d');
});
