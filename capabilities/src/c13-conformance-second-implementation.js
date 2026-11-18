'use strict';
/**
 * Case 13. Conformance vectors with the engine and with the Python package; do the two agree on a node's discovery document,
 * and on 40 seeded damaged copies of it? Counts only; nothing is estimated.
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, run, agsc, rng, freshCopy } = require('./shared/lib');

const out = { engine: {}, python: {}, agreement: {} };
const bundle = freshCopy(cfg.fullDir('patterns'), 'c13-bundle');
agsc(bundle, ['build', '--quiet']);
for (const level of [0, 1, 2, 3]) {
  const r = agsc(bundle, ['conform', '--level', String(level), '--json', '--to', `dist/conf${level}.json`]);
  const rep = JSON.parse(fs.readFileSync(path.join(bundle, `dist/conf${level}.json`), 'utf8'));
  out.engine[`level ${level}`] = { exit: r.code, class: rep.class, ...rep.summary, total: rep.results.length };
  const p = run(cfg.PY, ['-I', '-m', 'agentic_system_core.cli', 'run-vectors', path.join(cfg.ENGINE, 'tests/vectors'), '--level', String(level), '--json']);
  const j = JSON.parse(p.out); const c = {};
  for (const x of j.results) c[x.status] = (c[x.status] || 0) + 1;
  out.python[`level ${level}`] = { exit: p.code, counts: c, total: j.results.length, areas_run: j.areas_run, areas_not_run: Object.keys(j.areas_not_run) };
}
const vv = run(process.execPath, [path.join(cfg.ENGINE, 'tools/validate-vectors'), path.join(cfg.ENGINE, 'tests/vectors')]);
out.vector_files_checked = { node_tool_last_line: vv.out.trim().split('\n').pop().slice(0, 200) };
const pv = run(cfg.PY, ['-I', '-m', 'agentic_system_core.cli', 'validate-vectors', path.join(cfg.ENGINE, 'tests/vectors'), '--json']);
out.vector_files_checked.python_exit = pv.code;

// Agreement on discovery documents: both real nodes, then 40 seeded damaged copies of the patterns node's document.
const verdict = (impl, file, level) => {
  const r = impl === 'node' ? run(process.execPath, [path.join(cfg.ENGINE, 'tools/validate-wellknown'), file, '--level', String(level), '--json'])
    : run(cfg.PY, ['-I', '-m', 'agentic_system_core.cli', 'validate-wellknown', file, '--level', String(level), '--json']);
  let j = null; try { j = JSON.parse(r.out); } catch { /* not json */ }
  return { exit: r.code, codes: j ? [...new Set((j.findings || []).filter((f) => f.severity === 'error').map((f) => f.code))].sort() : ['unparsed'] };
};
const same = (a, b) => a.exit === b.exit && JSON.stringify(a.codes) === JSON.stringify(b.codes);
const nodes = {};
for (const n of cfg.NODES) {
  const f = path.join(cfg.wwwDir(n), '.well-known/knowledge-linkset');
  nodes[n] = [0, 1, 2, 3].map((l) => ({ level: l, node: verdict('node', f, l), python: verdict('python', f, l) })).map((x) => ({ level: x.level, node_exit: x.node.exit, python_exit: x.python.exit, agree: same(x.node, x.python) }));
}
out.agreement.real_nodes = nodes;

const rand = rng(20261118);
const site = freshCopy(cfg.wwwDir('patterns'), 'c13-site');
const docFile = path.join(site, '.well-known/knowledge-linkset');
const text = fs.readFileSync(docFile, 'utf8');
const doc = JSON.parse(text);
const clone = () => JSON.parse(text);
const rels = () => Object.keys(clone().linkset[0]).filter((k) => Array.isArray(clone().linkset[0][k]));
const MUT = [
  ['one character of a digest changed', () => { const ms = [...text.matchAll(/sha-256=:(.)/g)]; const m = ms[Math.floor(rand() * ms.length)]; const at = m.index + 'sha-256=:'.length; return text.slice(0, at) + (m[1] === 'A' ? 'B' : 'A') + text.slice(at + 1); }],
  ['a link loses its digest', () => { const d = clone(); const ks = rels().filter((k) => d.linkset[0][k].some((t) => t.digest)); const k = ks[Math.floor(rand() * ks.length)]; const t = d.linkset[0][k].find((x) => x.digest); delete t.digest; return JSON.stringify(d); }],
  ['anchor changed to http', () => text.replace('"anchor":"https://', '"anchor":"http://')],
  ['a relation renamed to an unregistered one', () => { const d = clone(); const ks = rels(); const k = ks[Math.floor(rand() * ks.length)]; d.linkset[0]['https://example.org/rel#x'] = d.linkset[0][k]; delete d.linkset[0][k]; return JSON.stringify(d); }],
  ['extra whitespace (not canonical)', () => text.replace('{"linkset":[', '{ "linkset":[')],
  ['chunk count changed', () => text.replace(/"agsc-chunk-count":\["\d+"\]/, '"agsc-chunk-count":["1"]')],
  ['ledger length changed', () => text.replace(/"agsc-ledger-length":\["\d+"\]/, '"agsc-ledger-length":["999"]')],
  ['bundle hash changed', () => text.replace(/("agsc-bundle-hash":\["sha-256=:)./, '$1A')],
  ['not valid JSON (truncated)', () => text.slice(0, Math.floor(text.length * 0.8))],
  ['a link target removed', () => { const d = clone(); const ks = rels(); const k = ks[Math.floor(rand() * ks.length)]; d.linkset[0][k] = []; return JSON.stringify(d); }],
];
const rows = [];
for (let i = 0; i < 40; i += 1) {
  const [label, fn] = MUT[i % MUT.length];
  const f = path.join(site, '.well-known', `mut-${i}`); fs.writeFileSync(docFile, fn());
  const a = verdict('node', docFile, 2); const b = verdict('python', docFile, 2);
  rows.push({ mutation: label, node_exit: a.exit, python_exit: b.exit, node_codes: a.codes, python_codes: b.codes, same_verdict: a.exit === b.exit, same_codes: same(a, b) });
  void f;
}
fs.writeFileSync(docFile, text);
out.agreement.damaged_documents = { n: rows.length, same_verdict: rows.filter((r) => r.same_verdict).length, same_error_codes: rows.filter((r) => r.same_codes).length,
  both_rejected: rows.filter((r) => r.node_exit !== 0 && r.python_exit !== 0).length, rows };
writeResult('c13-conformance-second-implementation', out);
