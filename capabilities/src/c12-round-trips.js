'use strict';
/**
 * Case 12. Every export/import pair the engine documents, run on the patterns node: export from a Bundle, import into an empty Bundle,
 * and compare what survived. Fields are compared per item: the authored front matter keys and the body bytes. "Kept" means present and equal.
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, agsc, freshCopy, run } = require('./shared/lib');

/** items of a Bundle folder: slug -> {fm: parsed front matter, body}. Parsed by PyYAML (shared/fm.py) so quoting style does not count as a change. */
function readItems(root) {
  if (!fs.existsSync(root)) return {};
  const r = run('python3', ['-I', path.join(__dirname, 'shared/fm.py'), root]);
  return r.code === 0 ? JSON.parse(r.out) : {};
}
const PUBLISHED = (() => { const s = new Set(fs.readFileSync(path.join(cfg.wwwDir('patterns'), 'chunks.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).item)); return s; })();

function compare(a, b) {
  const slugs = Object.keys(a).filter((s) => PUBLISHED.has(s));
  let items = 0; let stamped = 0; let kept = 0; let lost = 0; let bodyKept = 0; const lostKeys = {}; const missing = [];
  for (const s of slugs) {
    if (!b[s]) { missing.push(s); continue; }
    items += 1;
    for (const k of Object.keys(a[s].fm)) { const same = b[s].fm[k] !== undefined && JSON.stringify(b[s].fm[k]) === JSON.stringify(a[s].fm[k]); const { source_version: sv, ...rest } = (k === 'prov' && b[s].fm[k]) || {}; const stampOnly = !same && k === 'prov' && sv !== undefined && JSON.stringify(rest) === JSON.stringify(a[s].fm[k]); if (stampOnly) { kept += 1; stamped += 1; } else if (same) kept += 1; else { lost += 1; lostKeys[k] = (lostKeys[k] || 0) + 1; } }
    if (a[s].body === b[s].body) bodyKept += 1;
  }
  return { items_in_source: slugs.length, items_found_after: items, items_missing_after: missing.length, front_matter_keys_kept: kept, prov_gained_only_a_source_version_stamp: stamped, front_matter_keys_lost_or_changed: lost, bodies_identical: bodyKept, lost_key_names: lostKeys };
}

const src = cfg.fullDir('patterns');
const orig = readItems(path.join(src, 'content'));
const out = [];
function pair(label, exportArgs, importFrom, exportDirRel, extraImport = []) {
  const work = freshCopy(src, 'c12-src'); const e = agsc(work, ['export', ...exportArgs, '--quiet']);
  const rec = { pair: label, export_cmd: `agsc export ${exportArgs.join(' ')}`, export_exit: e.code };
  if (e.code !== 0) { rec.error = `${e.out}${e.err}`.split('\n').filter(Boolean).slice(-2).join(' | ').slice(0, 240); out.push(rec); return; }
  const empty = path.join(cfg.SCRATCH, 'work', 'c12-empty'); fs.rmSync(empty, { recursive: true, force: true }); fs.mkdirSync(empty, { recursive: true });
  fs.copyFileSync(path.join(src, 'agsc.config.json'), path.join(empty, 'agsc.config.json'));
  const exp = path.join(work, exportDirRel);
  const i = agsc(empty, ['import', exp, '--from', importFrom, ...extraImport, '--quiet']);
  rec.import_cmd = `agsc import <export folder> --from ${importFrom} ${extraImport.join(' ')}`.trim(); rec.import_exit = i.code;
  if (i.code !== 0) rec.error = `${i.out}${i.err}`.split('\n').filter(Boolean).slice(-2).join(' | ').slice(0, 240);
  const got = readItems(path.join(empty, 'content'));
  Object.assign(rec, compare(orig, got)); out.push(rec);
}
pair('Markdown (byte-preserving) -> okf import', ['--okf'], 'okf', 'dist/export/okf');
pair('Markdown export -> okf import (the folder is the same layout)', ['--markdown'], 'okf', 'dist/export/markdown');
const DIR = { 'claude-code': 'dist/export/claude-code/memory', skills: 'dist/export/skills/agentskills/skills' };
for (const a of ['mem0', 'letta', 'zep', 'csv', 'basic-memory', 'claude-code', 'cogx', 'gabbe', 'skills']) pair(`${a} export -> ${a} import`, ['--to', a], a, DIR[a] || `dist/export/${a}`);
fs.writeFileSync(path.join(cfg.SCRATCH, 'work', 'c12-note.txt'), '');
writeResult('c12-round-trips', { source_items_published: PUBLISHED.size, source_items_in_bundle: Object.keys(orig).length, note: 'Compared over the published items only. Lost keys are named per pair. Mermaid, steering and SKOS exports have no import of the same shape: SKOS imports draft items from a thesaurus, steering files are one-way; they are not pairs.', pairs: out });
