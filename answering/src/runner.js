'use strict';
/**
 * Runs the study. Resumable: a row already in the output file is never run again.
 * node src/runner.js --model qwen2.5-coder:7b --conds C0,C1,C2,C3,C4 --seeds 1,2,3 [--only q01,q02] [--out file]
 */
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');
const corpus = require('./corpus');
const { runCondition, closeServers } = require('./conditions');
const { scoreAnswer } = require('./scorer');

const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };

const loadQuestions = (only) => fs.readFileSync(path.join(cfg.STUDY, 'questions/questions.jsonl'), 'utf8')
  .split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((q) => !only || only.includes(q.id));

const keyOf = (r) => `${r.question_id}|${r.condition}|${r.model}|${r.seed}`;

function done(file) {
  if (!fs.existsSync(file)) return new Set();
  return new Set(fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => keyOf(JSON.parse(l))));
}

/** The wording run for a seed: seed 1 original, seed 2 first paraphrase, seed 3 second paraphrase. */
const formFor = (q, seed) => ({ text: q.forms[seed - 1] || q.forms[0], how: q.forms_how[seed - 1] || 'original' });

async function runOne(q, cond, model, seed, itemsByNode) {
  const form = formFor(q, seed);
  const t0 = Date.now();
  let out = { answer: '', toolCalls: [], promptTokens: 0, completionTokens: 0, steps: 0 }; let error = null;
  try { out = await runCondition(cond, q.node, { model, seed, question: form.text }); } catch (e) { if (/^TOKEN_BUDGET/.test(e.message)) throw e; error = String(e.message || e).slice(0, 300); }
  const wallMs = Date.now() - t0;
  const score = scoreAnswer(q, out.answer, { items: itemsByNode[q.node] });
  return {
    question_id: q.id, node: q.node, kind: q.kind, condition: cond, model, seed, form: form.how, question_run: form.text,
    answer: out.answer, cited_ids: score.cited_ids, gold_unit_ids: q.gold,
    tool_calls: out.toolCalls.map((c) => ({ name: c.name, args: c.args, ok: c.ok })), n_tool_calls: out.toolCalls.length,
    prompt_tokens: out.promptTokens, completion_tokens: out.completionTokens, wall_ms: wallMs, error,
    retrieved: out.retrieved || null, harness_calls: out.harnessCalls ?? null, truncated: out.truncated ?? null, context_stop: out.contextStop ?? null,
    trace: process.env.BENCH_TRACE && out.messages ? out.messages.map((m) => ({ role: m.role, content: String(m.content || '').slice(0, 1500), tool_calls: m.tool_calls })) : undefined, scores: score,
  };
}

async function main() {
  const model = arg('model', 'qwen2.5-coder:7b');
  const conds = arg('conds', cfg.CONDITIONS.join(',')).split(',');
  const seeds = arg('seeds', cfg.SEEDS.join(',')).split(',').map(Number);
  const only = arg('only', '') ? arg('only').split(',') : null;
  const out = arg('out', path.join(cfg.STUDY, 'results', `runs-${model.replace(/[^a-z0-9.]+/gi, '_')}.jsonl`));
  const questions = loadQuestions(only);
  const itemsByNode = Object.fromEntries(cfg.NODES.map((n) => [n, corpus.items(n)]));
  const have = done(out);
  let n = 0; const total = seeds.length * questions.length * conds.length;
  for (const seed of seeds) for (const q of questions) for (const cond of conds) {
    n += 1;
    if (have.has(`${q.id}|${cond}|${model}|${seed}`)) continue;
    const row = await runOne(q, cond, model, seed, itemsByNode);
    fs.appendFileSync(out, `${JSON.stringify(row)}\n`);
    process.stderr.write(`[${n}/${total}] s${seed} ${q.id} ${cond} ${row.wall_ms}ms calls=${row.n_tool_calls} ok=${row.scores.correct} ${row.error || ''}\n`);
  }
  await closeServers();
}

if (require.main === module) main().catch((e) => { console.error(e.message || e); process.exit(/^TOKEN_BUDGET/.test(e.message) ? 3 : 1); });
module.exports = { formFor, keyOf };
