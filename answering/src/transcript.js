'use strict';
/** Prints the full conversation of one run (for the report's examples). node src/transcript.js <qid> <cond> <seed> [model] */
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');
const { runCondition, closeServers } = require('./conditions');
const { formFor } = require('./runner');

(async () => {
  const [qid, cond, seed, model = 'qwen2.5-coder:7b'] = process.argv.slice(2);
  const q = fs.readFileSync(path.join(cfg.STUDY, 'questions/questions.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((x) => x.id === qid);
  const out = await runCondition(cond, q.node, { model, seed: Number(seed), question: formFor(q, Number(seed)).text });
  for (const m of out.messages || []) console.log(`--- ${m.role}${m.tool_calls ? ` CALL ${JSON.stringify(m.tool_calls.map((c) => c.function))}` : ''}\n${String(m.content || '').slice(0, 1200)}`);
  console.log(`=== ANSWER\n${out.answer}`);
  await closeServers();
})();
