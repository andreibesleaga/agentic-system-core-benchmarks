'use strict';
/**
 * Extra tables for the report: how the tool loops behaved, and what the truncation of C4 cost.
 * Reads the raw rows only. Exports markdown strings used by report.js.
 */
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('./config');
const { pasteAll } = require('./conditions');
const corpus = require('./corpus');

const MODEL = 'qwen2.5-coder:7b';
const pct = (a, b) => (b ? `${(100 * a / b).toFixed(0)} % (${a}/${b})` : 'n/a');

function loopTable(rows) {
  const head = '| Condition | Runs | Opening call was the home page "/" | Runs that opened a gold item page or read a gold item | Share of calls repeating an earlier call | Runs that ran out of context before 8 calls | Runs that answered NOT_IN_CORPUS |\n|---|---|---|---|---|---|---|';
  const lines = ['C0', 'C0h', 'C1', 'C1h', 'C2', 'C2u'].map((c) => {
    const rs = rows.filter((r) => r.model === MODEL && r.condition === c);
    let home = 0; let reached = 0; let dup = 0; let calls = 0; let ctx = 0; let abst = 0;
    for (const r of rs) {
      const cs = r.tool_calls;
      if (cs.length && (cs[0].args.path === '/' || cs[0].args.path === '')) home += 1;
      const gold = r.gold_unit_ids;
      if (cs.some((x) => (x.name === 'read' && gold.includes(x.args.slug)) || (x.name === 'fetch_page' && gold.some((g) => String(x.args.path || '').includes(`/${g}`))))) reached += 1;
      const seen = new Set();
      for (const x of cs) { const k = x.name + JSON.stringify(x.args); if (seen.has(k)) dup += 1; seen.add(k); calls += 1; }
      if (r.context_stop) ctx += 1;
      if (r.scores.abstained) abst += 1;
    }
    return `| ${c} | ${rs.length} | ${pct(home, rs.length)} | ${pct(reached, rs.filter((r) => r.kind !== 'unanswerable').length)} | ${pct(dup, calls)} | ${pct(ctx, rs.length)} | ${pct(abst, rs.length)} |`;
  });
  return [head, ...lines].join('\n');
}

function truncationTable(rows) {
  const included = new Map();
  for (const n of cfg.NODES) {
    const doc = pasteAll(n).doc;
    included.set(n, new Set([...doc.matchAll(/^### (\S+)$/gm)].map((m) => m[1])));
  }
  const head = '| Model | Gold item inside the pasted text | Answerable runs | Correct |\n|---|---|---|---|';
  const out = [];
  for (const model of [MODEL, 'gemma3:4b']) {
    for (const inside of [true, false]) {
      const rs = rows.filter((r) => r.model === model && r.condition === 'C4' && r.kind !== 'unanswerable'
        && r.gold_unit_ids.every((g) => included.get(r.node).has(g)) === inside);
      out.push(`| ${model} | ${inside ? 'yes' : 'no (cut off)'} | ${rs.length} | ${pct(rs.filter((r) => r.scores.correct).length, rs.length)} |`);
    }
  }
  const cut = cfg.NODES.map((n) => `${n}: ${included.get(n).size} of ${corpus.markdownItems(n).length} items fit`).join('; ');
  return `${[head, ...out].join('\n')}\n\nItems that fit in the ${cfg.LIMITS.numCtx - 1500}-token budget: ${cut}.`;
}

function rowsAll(rows) { return rows; }
module.exports = { loopTable, truncationTable, rowsAll };
