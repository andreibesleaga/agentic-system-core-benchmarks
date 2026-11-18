'use strict';
/**
 * Case 5. The documented quick start (docs/guides/mode-0.md) from an empty folder in scratch.
 * Counts commands, seconds, hand-written files, and records every error or warning message and whether it names a fix.
 * The git steps of the guide (git init, commit) are replaced by SOURCE_DATE_EPOCH, which the guide names as the
 * alternative; this study runs no git write command.
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, run, ENV } = require('./shared/lib');

const root = path.join(cfg.SCRATCH, 'work', 'c05');
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(root, { recursive: true });
const steps = []; let commands = 0; const handFiles = [];

function step(label, fn, isCommand = true) {
  const t0 = Date.now(); const r = fn(); const ms = Date.now() - t0;
  if (isCommand) commands += 1;
  const lines = r ? `${r.out || ''}${r.err || ''}`.split('\n').filter((l) => /^(error|before you build)/.test(l)) : [];
  steps.push({ label, ms, exit: r ? r.code : 0, problems: lines.slice(0, 12).map((l) => l.slice(0, 700)) });
  return r;
}

step('npm install agentic-system-core (from the registry)', () => run('npm', ['install', '--no-audit', '--no-fund', 'agentic-system-core'], { cwd: root }));
const installed = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/agentic-system-core/package.json'), 'utf8')).version;
const AGSC = path.join(root, 'node_modules/.bin/agsc');
const notes = path.join(root, 'my-notes'); fs.mkdirSync(notes);
const write = (f, s) => { fs.writeFileSync(path.join(notes, f), s); handFiles.push(f); };
step('write three notes by hand', () => {
  write('sourdough.md', '# Sourdough starter\n\nFlour and water, fed once a day. How runny it is depends on its [hydration](hydration.md).\n');
  write('hydration.md', '# Hydration\n\nThe weight of the water divided by the weight of the flour.\n');
  write('oven-spring.md', '# Oven spring\n\nThe last rise of a loaf, in the first minutes in a hot oven.\n');
  return null;
}, false);
step('agsc init', () => run(AGSC, ['init'], { cwd: notes }));
// A person who builds at once, as the guide does not say to, meets the first error.
const naive = step('agsc build straight after init (no security contact, no build instant)', () => run(AGSC, ['build'], { cwd: notes, env: { SOURCE_DATE_EPOCH: '' } }));
step('write .well-known/security.txt by hand', () => {
  fs.mkdirSync(path.join(notes, '.well-known'), { recursive: true });
  fs.writeFileSync(path.join(notes, '.well-known/security.txt'), 'Contact: mailto:security@example.org\n'); handFiles.push('.well-known/security.txt'); return null;
}, false);
const noEpoch = step('agsc build without a build instant (not a git repository)', () => run(AGSC, ['build'], { cwd: notes, env: { SOURCE_DATE_EPOCH: '' } }));
step('agsc ci (with SOURCE_DATE_EPOCH set)', () => run(AGSC, ['ci'], { cwd: notes, env: { SOURCE_DATE_EPOCH: cfg.EPOCH } }));
const b = step('agsc build', () => run(AGSC, ['build'], { cwd: notes, env: { SOURCE_DATE_EPOCH: cfg.EPOCH } }));
const www = path.join(notes, 'www');
const count = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((a, e) => a + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);
const wrote = (b.out.match(/wrote: (\d+) files/) || [])[1];
const hasChunks = fs.existsSync(path.join(www, 'chunks.jsonl')); const hasLinkset = fs.existsSync(path.join(www, '.well-known/knowledge-linkset'));
const v = run(process.execPath, [path.join(root, 'node_modules/agentic-system-core/tools/validate-wellknown'), path.join(www, '.well-known/knowledge-linkset'), '--level', '2'], { cwd: root });
const total = steps.reduce((a, s) => a + s.ms, 0);
const lastFailed = steps.filter((s) => s.exit !== 0).map((s) => s.label);
// Judged by hand after reading each full message (the heuristic of searching for verbs was too loose).
const FIX_NAMED = { 'AGSC-E204': 'yes: says to commit once, set SOURCE_DATE_EPOCH, or author an Expires',
  'AGSC-E901': 'partly: names the missing file and says nothing is emitted; the earlier line from init said to add it',
  'before you build': 'yes: says what to add or edit' };
const judge = (m) => (m.startsWith('before you build') ? FIX_NAMED['before you build'] : FIX_NAMED[(m.match(/AGSC-E\d+/) || [''])[0]] || 'not judged');
writeResult('c05-time-to-first-node', {
  engine_version_installed: installed, commands_run: commands, hand_written_files: handFiles, hand_written_file_count: handFiles.length,
  seconds_total: Math.round(total / 100) / 10, seconds_without_npm_install: Math.round((total - steps[0].ms) / 100) / 10,
  files_built: count(www), files_wrote_reported: Number(wrote), has_chunks: hasChunks, has_discovery_document: hasLinkset,
  discovery_check_level2: { exit: v.code, last_line: v.out.trim().split('\n').pop() },
  steps_that_failed: lastFailed,
  problems: steps.flatMap((s) => s.problems.map((m) => ({ step: s.label, message: m, fix_named: judge(m) }))),
  steps,
});
