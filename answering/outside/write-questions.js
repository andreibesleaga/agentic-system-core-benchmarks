'use strict';
/**
 * The outside check, step 1: a second question set written by a model of another family than the one
 * that wrote the first set (Claude Sonnet 5.5), from the same published item texts, with the same mix
 * as the first set: per node, single-item questions, two-item questions and unanswerable questions.
 *
 *   LLM_BASE_URL=https://openrouter.ai/api/v1 LLM_API_KEY=... node outside/write-questions.js
 *
 * Writes outside/questions-b.jsonl. Every fact a question asks for must appear, word for word (case
 * aside), in the text of its gold item, and must not be readable from the question; a question that
 * fails is dropped and the next item in the seeded order is tried. Run once; then freeze the file
 * (`sha256sum outside/questions-b.jsonl`, kept in outside/FROZEN-B.sha256) before any answering run.
 */
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('../src/config');
const corpus = require('../src/corpus');
const { leakedFacts } = require('../src/scorer');

const WRITER = process.env.WRITER_MODEL || 'google/gemini-3.8-flash';
const SEED = 20261120;
const PLAN = { patterns: { single: 28, two: 7, unanswerable: 7 }, main: { single: 12, two: 3, unanswerable: 3 } };
const OUT = path.join(__dirname, 'questions-b.jsonl');
const TEXT_LIMIT = 6000;

/** A small seeded generator (mulberry32), so the order of items can be re-made from the seed. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const PROMPTS = {
  single: (a) => `Below is one published documentation item. Write ONE question that a reader of this kind of documentation might ask, whose answer is a short fact stated in the item. Then give 1 to 3 "facts": short exact phrases (2 to 6 words each) copied word for word from the item, that a correct answer must contain. A fact must not appear in your question. Do not copy the item's title into the question word for word.

Reply with JSON only: {"q": "...", "facts": ["...", "..."]}

ITEM "${a.title}":
${a.body.slice(0, TEXT_LIMIT)}`,
  two: (a, b) => `Below are two published documentation items. Write ONE question that needs a fact from EACH item to answer. Then give 2 or 3 "facts": short exact phrases (2 to 6 words each) copied word for word from the items, at least one from each item, that a correct answer must contain. A fact must not appear in your question.

Reply with JSON only: {"q": "...", "facts": ["...", "..."]}

ITEM 1 "${a.title}":
${a.body.slice(0, TEXT_LIMIT / 2)}

ITEM 2 "${b.title}":
${b.body.slice(0, TEXT_LIMIT / 2)}`,
  unanswerable: (titles, subject) => `A documentation site covers this subject: ${subject}. Its items have these titles:
${titles.map((t) => `- ${t}`).join('\n')}

Write ONE question a reader might ask on this subject that NONE of these items answers: the answer must need a specific fact (a number, a date, a name, a version) that such documentation would not contain. It must not be answerable from general knowledge alone either.

Reply with JSON only: {"q": "..."}`,
};

async function ask(prompt) {
  const res = await fetch(`${process.env.LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.LLM_API_KEY || ''}` },
    body: JSON.stringify({ model: WRITER, temperature: 0, seed: SEED, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`endpoint ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const text = (await res.json()).choices[0].message.content || '';
  const m = /\{[\s\S]*\}/.exec(text);
  return m ? JSON.parse(m[0]) : null;
}

/** Facts as the scorer reads them: regular expressions, so special characters are escaped. */
const asPattern = (fact) => fact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function checkFacts(row, bodies) {
  if (!row || typeof row.q !== 'string' || row.q.length < 15 || !Array.isArray(row.facts)) return null;
  const facts = row.facts.map((f) => String(f).trim()).filter((f) => f.length >= 3 && f.length <= 60);
  if (facts.length === 0) return null;
  for (const f of facts) if (!bodies.some((b) => b.toLowerCase().includes(f.toLowerCase()))) return null;
  for (const body of bodies) if (!facts.some((f) => body.toLowerCase().includes(f.toLowerCase()))) return null;
  const patterns = facts.map(asPattern);
  if (leakedFacts({ q: row.q, facts: patterns }).length) return null;
  return patterns;
}

async function main() {
  if (!process.env.LLM_BASE_URL) throw new Error('set LLM_BASE_URL and LLM_API_KEY');
  if (fs.existsSync(OUT)) throw new Error(`${OUT} exists: the set is written once`);
  const random = rng(SEED);
  const rows = [];
  const written = new Date().toISOString().slice(0, 10);
  const add = (node, kind, q, gold, facts) => rows.push({ id: `b${String(rows.length + 1).padStart(2, '0')}`, node, kind, q, gold, facts,
    forms: [q], forms_how: ['original'], author: `${WRITER}, from the item texts (outside/write-questions.js, seed ${SEED})`, written });
  for (const node of cfg.NODES) {
    const plan = PLAN[node];
    const items = shuffled(corpus.markdownItems(node).filter((i) => i.body.length > 300), random);
    // Single-item questions: one per item, in the seeded order, until the plan is met.
    let made = 0;
    for (const a of items) {
      if (made === plan.single) break;
      const row = await ask(PROMPTS.single(a)).catch(() => null);
      const facts = checkFacts(row, [a.body]);
      if (facts) { add(node, 'single', row.q.trim(), [a.slug], facts); made += 1; }
    }
    // Two-item questions: pairs from a second seeded order.
    const order = shuffled(items, random);
    made = 0;
    for (let i = 0; i + 1 < order.length && made < plan.two; i += 2) {
      const [a, b] = [order[i], order[i + 1]];
      const row = await ask(PROMPTS.two(a, b)).catch(() => null);
      const facts = checkFacts(row, [a.body, b.body]);
      if (facts) { add(node, 'two', row.q.trim(), [a.slug, b.slug], facts); made += 1; }
    }
    // Unanswerable questions: from the titles alone; graded by abstention.
    const subject = cfg.NODE_NAMES[node];
    const titles = items.map((i) => i.title);
    const seen = new Set();
    for (let tries = 0; seen.size < plan.unanswerable && tries < plan.unanswerable * 3; tries += 1) {
      const row = await askAt(PROMPTS.unanswerable(titles, subject), tries).catch(() => null);
      const q = row && typeof row.q === 'string' ? row.q.trim() : '';
      if (q.length >= 15 && !seen.has(q.toLowerCase())) { seen.add(q.toLowerCase()); add(node, 'unanswerable', q, [], []); }
    }
  }
  fs.writeFileSync(OUT, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const count = rows.reduce((c, r) => ({ ...c, [`${r.node}/${r.kind}`]: (c[`${r.node}/${r.kind}`] || 0) + 1 }), {});
  console.log(`wrote ${rows.length} questions to ${OUT}`, count);
}

/** The same request with another seed, for the unanswerable questions, which share one prompt. */
async function askAt(prompt, n) {
  const res = await fetch(`${process.env.LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.LLM_API_KEY || ''}` },
    body: JSON.stringify({ model: WRITER, temperature: 0.7, seed: SEED + n, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`endpoint ${res.status}`);
  const text = (await res.json()).choices[0].message.content || '';
  const m = /\{[\s\S]*\}/.exec(text);
  return m ? JSON.parse(m[0]) : null;
}

if (require.main === module) main().catch((e) => { console.error(e.message || e); process.exit(1); });

module.exports = { rng, shuffled, checkFacts, asPattern, PLAN, WRITER, SEED, PROMPTS, main };
