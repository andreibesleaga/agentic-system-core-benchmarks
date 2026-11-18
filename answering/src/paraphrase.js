'use strict';
/**
 * Makes two paraphrases of every authored question with gemma3:4b (not the model under test).
 * A paraphrase is kept only if it still holds every number, code-like token and named entity of the
 * original; otherwise the original wording is used and the row says so.
 * Usage: node src/paraphrase.js questions/q-authored.jsonl > questions/questions.jsonl
 */
const fs = require('node:fs');
const { chat } = require('./llm');

const MODEL = 'gemma3:4b';
const PROMPTS = [
  'Rewrite this question in different words. Keep every name, number, code term and technical term exactly. Do not answer it. Output only the rewritten question.',
  'Rewrite this question with a different sentence structure. Keep every name, number, code term and technical term exactly. Do not answer it. Output only the rewritten question.',
];

/** Tokens that must survive: anything with a digit, a code character, or a capital not at sentence start. */
function mustKeep(q) {
  const toks = q.replace(/[?,]/g, '').split(/\s+/);
  return toks.filter((t, i) => /\d|[_./:\\#-]/.test(t) || (i > 0 && /^[A-Z]/.test(t)))
    .map((t) => t.replace(/^[("'`]+|[)"'`.;]+$/g, '')).filter(Boolean);
}

function keeps(original, para) {
  const low = para.toLowerCase();
  return mustKeep(original).every((t) => low.includes(t.toLowerCase()));
}

async function paraphrase(q, k) {
  const r = await chat({
    model: MODEL, seed: 10 + k, maxTokens: 120,
    messages: [{ role: 'system', content: PROMPTS[k] }, { role: 'user', content: q }],
  });
  return r.message.content.trim().replace(/^["']|["']$/g, '').split('\n')[0];
}

async function main() {
  const rows = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  for (const row of rows) {
    const forms = [row.q];
    const how = ['original'];
    for (let k = 0; k < 2; k += 1) {
      const p = await paraphrase(row.q, k);
      const ok = p.length > 10 && p.endsWith('?') && keeps(row.q, p);
      forms.push(ok ? p : row.q);
      how.push(ok ? `paraphrase-${MODEL}` : 'original-fallback');
    }
    process.stdout.write(`${JSON.stringify({ ...row, forms, forms_how: how, author: 'Claude (Sonnet 5.5), from the item texts', paraphrased_by: MODEL, written: '2026-11-17' })}\n`);
  }
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { mustKeep, keeps };
