'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { scoreAnswer, abstained, citedItems, verifiable, leakedFacts } = require('../src/scorer');
const { keeps, mustKeep } = require('../src/paraphrase');

const items = new Map([
  ['graph-of-thoughts', { slug: 'graph-of-thoughts', title: 'Graph of Thoughts', digests: ['ab12cd34ef56ab12', 'ff'.repeat(32)] }],
  ['link', { slug: 'link', title: 'Link', digests: ['0123456789abcdef'] }],
  ['source', { slug: 'source', title: 'Source', digests: [] }],
]);
const ctx = { items };
const single = { id: 't1', kind: 'single', gold: ['graph-of-thoughts'], facts: ['74 ?%', '\\b4 ?%'] };
const two = { id: 't2', kind: 'two', gold: ['link', 'source'], facts: ['sources', 'asc:Source'] };
const none = { id: 't3', kind: 'unanswerable', gold: [], facts: [] };

test('correct needs every fact and is not an abstention', () => {
  const a = 'Tree of Thoughts solved 74% and GPT-4 solved 4%.\nSources: graph-of-thoughts';
  const s = scoreAnswer(single, a, ctx);
  assert.equal(s.correct, true); assert.equal(s.cited_all, true);
  assert.equal(scoreAnswer(single, 'It solved 74%.\nSources: graph-of-thoughts', ctx).correct, false);
  assert.equal(scoreAnswer(single, 'NOT_IN_CORPUS 74% and 4%', ctx).correct, false);
});

test('a common word in running text is not a citation, a Sources line or a URL is', () => {
  assert.deepEqual(citedItems('A link is typed. See the source.', items), []);
  assert.deepEqual(citedItems('x\nSources: link, source', items).sort(), ['link', 'source']);
  assert.deepEqual(citedItems('see https://agenticsystemcore.com/concepts/link/ for it', items), ['link']);
  assert.deepEqual(citedItems('x\nSources: Graph of Thoughts', items), ['graph-of-thoughts']);
});

test('a Sources list on following lines counts', () => {
  assert.deepEqual(citedItems('Answer.\n\nSources:\n- graph-of-thoughts#1\n- link#0', items).sort(), ['graph-of-thoughts', 'link']);
  assert.deepEqual(citedItems('x\nSources: none', items), []);
});

test('two-item questions need both citations for cited_all', () => {
  const s = scoreAnswer(two, 'Written in sources[]; asc:Source.\nSources: link', ctx);
  assert.equal(s.correct, true); assert.equal(s.cited_any, true); assert.equal(s.cited_all, false);
});

test('abstention: token, plain words, and a refusal late in the text does not count', () => {
  assert.equal(abstained('NOT_IN_CORPUS The corpus gives no default.'), true);
  assert.equal(abstained('The corpus does not contain this.'), true);
  assert.equal(abstained('The default is 10.'), false);
  assert.equal(abstained(`${'x '.repeat(150)} the page does not say`), false);
  assert.equal(scoreAnswer(none, 'NOT_IN_CORPUS nothing', ctx).correct_abstention, true);
  assert.equal(scoreAnswer(none, 'The value is 5.', ctx).correct_abstention, false);
  assert.equal(scoreAnswer(single, 'NOT_IN_CORPUS', ctx).false_abstention, true);
});

test('verifiable only with a digest prefix of a gold chunk', () => {
  assert.equal(verifiable('digest ab12cd34ef56ab12', ['ab12cd34ef56ab12aaaa']), true);
  assert.equal(verifiable('digest 1234567890123456', ['ab12cd34ef56ab12aaaa']), false);
  assert.equal(verifiable('no digest', ['ab12']), false);
  const a = 'Tree 74% GPT-4 4%.\nSources: graph-of-thoughts (ab12cd34ef56ab12)';
  assert.equal(scoreAnswer(single, a, ctx).verifiable, true);
});

test('question leakage check', () => {
  assert.deepEqual(leakedFacts({ q: 'What is the NOW file?', facts: ['NOW'] }), ['NOW']);
  assert.deepEqual(leakedFacts({ q: 'What is the file?', facts: ['NOW'] }), []);
});

test('paraphrase guard keeps names and numbers', () => {
  const o = 'In the Game of 24, what share did Tree of Thoughts solve?';
  assert.ok(mustKeep(o).includes('24,') || mustKeep(o).some((t) => t.startsWith('24')));
  assert.equal(keeps(o, 'What fraction of Game of 24 tasks did Tree of Thoughts solve?'), true);
  assert.equal(keeps(o, 'What fraction of tasks did the tree method solve?'), false);
});

test('OpenAI message translation pairs tool results with their calls', () => {
  const { toOpenAI } = require('../src/llm');
  const out = toOpenAI([
    { role: 'user', content: 'q' },
    { role: 'assistant', content: '', tool_calls: [{ function: { name: 'read', arguments: { slug: 'a' } } }] },
    { role: 'tool', tool_name: 'read', content: 'text' },
    { role: 'assistant', content: '{"name":"read"}' },
    { role: 'tool', tool_name: 'read', content: 'orphan' },
  ]);
  assert.equal(out[1].tool_calls[0].function.arguments, '{"slug":"a"}');
  assert.equal(out[2].tool_call_id, out[1].tool_calls[0].id);
  assert.equal(out[4].role, 'user');
});

test('token budget refuses the call that would pass it', async () => {
  process.env.LLM_TOKEN_BUDGET = '10';
  process.env.LLM_BASE_URL = 'http://127.0.0.1:9'; // never reached
  const { chat } = require('../src/llm');
  await assert.rejects(() => chat({ model: 'x', seed: 1, messages: [{ role: 'user', content: 'hello' }] }), /TOKEN_BUDGET/);
  delete process.env.LLM_TOKEN_BUDGET; delete process.env.LLM_BASE_URL;
});

test('answer format is in the prompt of the single-shot conditions and only there', () => {
  const { system } = require('../src/prompts');
  for (const c of ['C2b', 'C3', 'C4']) assert.ok(system(c, 'patterns').includes('Sources:'), c);
  for (const c of ['C0', 'C1', 'C2', 'C2u']) assert.ok(!system(c, 'patterns').includes('Sources:'), c);
});
