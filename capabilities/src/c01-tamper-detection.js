'use strict';
/**
 * Case 1. Seeded damage to a published site, and what a client detects from the node's discovery document.
 * Detectors: (1) validate-wellknown at level 2 (Node, the engine's checker); (2) the same check in the Python package.
 * Baselines: plain pages, llms.txt and a retrieval index carry no digest, so a client with no earlier copy has no check
 * (counted 0 of n and said so); a Markdown folder under git detects every change to a file it holds a known-good hash of
 * (measured here with `git hash-object`, which writes nothing).
 * A client holding a trusted anchor (agsc-host verify-anchor) is measured for stale and replaced whole sites.
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, run, rng, freshCopy, sha256 } = require('./shared/lib');

const site = freshCopy(cfg.wwwDir('patterns'), 'c01-site');
const doc = path.join(site, '.well-known/knowledge-linkset');
const NODE_TOOL = path.join(cfg.ENGINE, 'tools/validate-wellknown');
const detectNode = () => run(process.execPath, [NODE_TOOL, doc, '--level', '2']).code !== 0;
const detectPy = () => run(cfg.PY, ['-I', '-m', 'agentic_system_core.cli', 'validate-wellknown', doc, '--level', '2']).code !== 0;
const baselineOk = { node: !detectNode(), python: !detectPy() };

const linked = new Set(JSON.parse(fs.readFileSync(doc, 'utf8')).linkset[0] && Object.values(JSON.parse(fs.readFileSync(doc, 'utf8')).linkset[0]).flat()
  .filter((t) => t && t.digest && t.href).map((t) => new URL(t.href).pathname.replace(/^\//, '')));
const all = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else all.push(path.relative(site, p)); } }(site));
const TEXT = /\.(html|md|json|jsonld|txt|ttl|nq|jsonl|js|css|xml|toon)$/;
const classOf = (rel) => (linked.has(rel) ? 'A named in discovery document' : /^pages\/.*\.(md|jsonld)$/.test(rel) ? 'C per-item copies (md, jsonld)'
  : /\.html$/.test(rel) ? 'B pages (html)' : 'D other site files');
const byClass = {};
for (const f of all.filter((x) => TEXT.test(x) && !x.startsWith('.well-known/'))) (byClass[classOf(f)] = byClass[classOf(f)] || []).push(f);
for (const k of Object.keys(byClass)) byClass[k].sort();

const rand = rng(20261118);
const pick = (arr, n) => { const a = [...arr]; const out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rand() * a.length), 1)[0]); return out; };
const P = 20; // targets per class (class A has fewer files; all are used)

const MUT = {
  'one byte': (buf) => { const b = Buffer.from(buf); const i = Math.floor(rand() * b.length); b[i] = b[i] === 0x78 ? 0x79 : 0x78; return b; },
  'one sentence': (buf) => {
    const s = buf.toString('utf8'); const ms = [...s.matchAll(/[A-Z][a-z][^.<>"\n\\]{30,120}\./g)];
    if (!ms.length) return null; const m = ms[Math.floor(rand() * ms.length)];
    return Buffer.from(s.slice(0, m.index) + 'The seeded test replaced this sentence with another one.' + s.slice(m.index + m[0].length));
  },
  'truncated': (buf) => buf.subarray(0, Math.floor(buf.length * 0.9)),
};

const rows = [];
function trial(kind, cls, rel, mutate) {
  const file = path.join(site, rel); const orig = fs.readFileSync(file);
  const bad = mutate(orig);
  if (bad === null || Buffer.compare(bad, orig) === 0) return;
  fs.writeFileSync(file, bad);
  try { rows.push({ kind, class: cls, file: rel, node: detectNode(), python: detectPy() }); } finally { fs.writeFileSync(file, orig); }
}
for (const [cls, files] of Object.entries(byClass)) {
  const targets = cls.startsWith('A') ? files : pick(files, P);
  for (const rel of targets) for (const [kind, fn] of Object.entries(MUT)) trial(kind, cls, rel, fn);
  // swapped file: contents exchanged with another file of the same class
  const sw = cls.startsWith('A') ? files : pick(files, P);
  for (const rel of sw) {
    const other = files.filter((f) => f !== rel && path.extname(f) === path.extname(rel));
    if (!other.length) continue;
    const o = other[Math.floor(rand() * other.length)]; const fa = path.join(site, rel); const fb = path.join(site, o);
    const a = fs.readFileSync(fa); const b = fs.readFileSync(fb); if (Buffer.compare(a, b) === 0) continue;
    fs.writeFileSync(fa, b); fs.writeFileSync(fb, a);
    try { rows.push({ kind: 'swapped with another file', class: cls, file: `${rel} <-> ${o}`, node: detectNode(), python: detectPy() }); } finally { fs.writeFileSync(fa, a); fs.writeFileSync(fb, b); }
  }
}

// Stale files: build the same node with one sentence changed in one item, then serve one file of the older build.
const newer = freshCopy(cfg.fullDir('patterns'), 'c01-newer-src');
const item = path.join(newer, 'content/concepts/augmented-llm.md');
fs.writeFileSync(item, fs.readFileSync(item, 'utf8').replace(/\n\n/, '\n\nA new sentence added in the later version of this item.\n\n'));
const { agsc } = require('./shared/lib');
const nb = agsc(newer, ['build', '--quiet']);
const nwww = path.join(newer, 'www'); const stale = [];
for (const rel of [...linked]) {
  const a = path.join(site, rel); const b = path.join(nwww, rel);
  if (!fs.existsSync(b) || Buffer.compare(fs.readFileSync(a), fs.readFileSync(b)) === 0) continue;
  const orig = fs.readFileSync(a); fs.writeFileSync(a, fs.readFileSync(b));
  try { stale.push({ kind: 'stale file (from another version)', class: classOf(rel), file: rel, node: detectNode(), python: detectPy() }); } finally { fs.writeFileSync(a, orig); }
}
rows.push(...stale);

// Whole older site, consistent with its own discovery document (the host serves yesterday's build): digests agree.
const oldSite = freshCopy(cfg.wwwDir('patterns'), 'c01-older-site'); // the older build, complete
const anchorDir = path.join(cfg.SCRATCH, 'work', 'c01-anchor');
fs.rmSync(anchorDir, { recursive: true, force: true });
run(process.execPath, [path.join(cfg.ENGINE, 'bin/agsc-host.js'), 'emit', 'ledger-anchor', '--site', nwww, '--out', anchorDir]); // anchor of the NEWER build
const whole = {
  digests_only_node: run(process.execPath, [NODE_TOOL, path.join(oldSite, '.well-known/knowledge-linkset'), '--level', '2']).code !== 0,
  digests_only_python: run(cfg.PY, ['-I', '-m', 'agentic_system_core.cli', 'validate-wellknown', path.join(oldSite, '.well-known/knowledge-linkset'), '--level', '2']).code !== 0,
  anchor_check_detects_old_site: run(process.execPath, [path.join(cfg.ENGINE, 'bin/agsc-host.js'), 'verify-anchor', path.join(anchorDir, 'anchor.json'), '--site', oldSite]).code !== 0,
  anchor_check_accepts_the_anchored_site: run(process.execPath, [path.join(cfg.ENGINE, 'bin/agsc-host.js'), 'verify-anchor', path.join(anchorDir, 'anchor.json'), '--site', nwww]).code === 0,
};
// The same for a site whose discovery document was also replaced (the host is fully controlled): the document check passes, the anchor catches it.

// Markdown folder under git, known-good commit: the hash of every file is held, so any change is seen. Measured with git hash-object (no write).
const srcDir = freshCopy(cfg.srcDir('patterns'), 'c01-md-src');
const mdFiles = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.md') && p.includes('/content/')) mdFiles.push(p); } }(srcDir));
const blob = (f) => run('git', ['hash-object', f]).out.trim();
const base = Object.fromEntries(mdFiles.map((f) => [f, blob(f)]));
let gitSeen = 0; let gitN = 0;
for (const f of pick(mdFiles.sort(), 20)) for (const fn of Object.values(MUT)) {
  const orig = fs.readFileSync(f); const bad = fn(orig); if (bad === null || Buffer.compare(bad, orig) === 0) continue;
  fs.writeFileSync(f, bad); gitN += 1; if (blob(f) !== base[f]) gitSeen += 1; fs.writeFileSync(f, orig);
}

const summary = {};
for (const r of rows) {
  const k = `${r.kind} | ${r.class}`; summary[k] = summary[k] || { n: 0, node_detected: 0, python_detected: 0 };
  summary[k].n += 1; summary[k].node_detected += r.node ? 1 : 0; summary[k].python_detected += r.python ? 1 : 0;
}
const byCls = {};
for (const r of rows) { const c = r.class; byCls[c] = byCls[c] || { n: 0, node_detected: 0, python_detected: 0 }; byCls[c].n += 1; byCls[c].node_detected += r.node ? 1 : 0; byCls[c].python_detected += r.python ? 1 : 0; }
const tot = { n: rows.length, node_detected: rows.filter((r) => r.node).length, python_detected: rows.filter((r) => r.python).length };
writeResult('c01-tamper-detection', {
  seed: 20261118, baseline_clean_site_passes: baselineOk, newer_build_exit: nb.code,
  files_in_site: all.length, files_named_in_discovery_document: [...linked].filter((f) => all.includes(f)).length,
  by_class_file_count: Object.fromEntries(Object.entries(byClass).map(([k, v]) => [k, v.length])),
  totals: tot, by_class: byCls, by_kind_and_class: summary,
  plain_pages_llms_txt_rag_index: { detectors_available: 0, detected: 0, n: tot.n, reason: 'no digest or other integrity data is published with them; a client with no earlier trusted copy has nothing to compare with' },
  markdown_folder_with_known_good_hashes: { n: gitN, detected: gitSeen, method: 'git hash-object against hashes taken before the damage; needs the client to hold a trusted commit' },
  whole_older_site_consistent_with_its_own_document: whole,
  stale_files_tested: stale.length,
  rows,
});
