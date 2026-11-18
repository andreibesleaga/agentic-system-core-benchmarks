'use strict';
/**
 * Case 3. Build each node twice in clean copies; count byte-identical files. Then change one condition at a time
 * (build instant, folder path, time zone, locale) and name what changes the bytes. Also run `agsc verify`.
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, run, agsc, treeHash, freshCopy } = require('./shared/lib');

const SKIP = (rel) => rel.startsWith('.git');
function compare(a, b) {
  const ha = treeHash(a, SKIP); const hb = treeHash(b, SKIP);
  const all = new Set([...Object.keys(ha), ...Object.keys(hb)]);
  const diff = [...all].filter((f) => ha[f] !== hb[f]).sort();
  return { files_a: Object.keys(ha).length, files_b: Object.keys(hb).length, identical: [...all].length - diff.length, differing: diff.length, differing_files: diff.slice(0, 15) };
}

function buildIn(node, name, env, cwdTweak) {
  const dir = freshCopy(cfg.fullDir(node), name);
  // The main node builds through its own pipeline (scripts/build.js, which calls the engine); the patterns node through `agsc build`.
  const r = node === 'main'
    ? run(process.execPath, ['scripts/build.js'], { cwd: dir, env: { SITE_ENGINE: cfg.ENGINE, ...env } })
    : agsc(dir, ['build', '--quiet'], { env });
  return { dir: path.join(dir, 'www'), code: r.code, ms: r.ms, err: r.err.slice(0, 300) };
}

const out = { nodes: {}, variations: {} };
for (const node of cfg.NODES) {
  const a = buildIn(node, `c03-${node}-a`, {});
  const b = buildIn(node, `c03-${node}-b`, {});
  out.nodes[node] = { build_a_ms: a.ms, build_b_ms: b.ms, exit: [a.code, b.code], ...compare(a.dir, b.dir) };
  const v = agsc(path.dirname(a.dir), ['verify', '--json']);
  let j = null; try { j = JSON.parse(v.out); } catch { /* keep raw */ }
  out.nodes[node].verify = { exit: v.code, ms: v.ms, status: j && j.status, counts: j && j.counts, raw: j ? undefined : v.out.slice(0, 300) };
}
// Variations on the patterns node: each against the baseline build a.
const base = path.join(cfg.SCRATCH, 'work', 'c03-patterns-a', 'www');
const variants = {
  'different build instant (SOURCE_DATE_EPOCH + 1 day)': { env: { SOURCE_DATE_EPOCH: String(Number(cfg.EPOCH) + 86400) } },
  'different time zone (TZ=Asia/Tokyo)': { env: { TZ: 'Asia/Tokyo' } },
  'different locale (LC_ALL=de_DE.UTF-8)': { env: { LC_ALL: 'de_DE.UTF-8', LANG: 'de_DE.UTF-8' } },
  'SOURCE_DATE_EPOCH set to empty (read as unset, warning AGSC-E603)': { env: { SOURCE_DATE_EPOCH: '' } },
};
for (const [label, v] of Object.entries(variants)) {
  const r = buildIn('patterns', `c03-var-${Object.keys(out.variations).length}`, v.env);
  out.variations[label] = { exit: r.code, err: r.err, ...(r.code === 0 ? compare(base, r.dir) : {}) };
}
// A different folder path: same sources, built from another directory.
{
  const r = buildIn('patterns', 'c03-other-path/deeper/folder', {});
  out.variations['different folder path'] = { exit: r.code, ...(r.code === 0 ? compare(base, r.dir) : {}) };
}
// Committed site vs a fresh build of the same repository (the site pipeline adds files and the tree is newer than the commit).
out.committed_vs_fresh = compare(cfg.wwwDir('patterns'), base);
// The alternative's artefact: a BM25 index over the same Markdown, built twice in two processes; serialised and compared by bytes.
{
  const { cfg: c } = require('./shared/lib');
  const code = `const m=require(${JSON.stringify(path.join(c.DEPS, 'minisearch', 'dist', 'cjs', 'index.cjs'))});const MS=m.default||m;const fs=require('fs'),p=require('path');
const docs=[];(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const x=p.join(d,e.name);if(e.isDirectory())w(x);else if(x.endsWith('.md'))docs.push({id:x.slice(${JSON.stringify(c.srcDir('patterns')).length}),text:fs.readFileSync(x,'utf8')});}})(${JSON.stringify(path.join(c.srcDir('patterns'), 'content'))});
docs.sort((a,b)=>a.id<b.id?-1:1);const i=new MS({fields:['text']});i.addAll(docs);process.stdout.write(JSON.stringify(i));`;
  const a = run(process.execPath, ['-e', code]); const b = run(process.execPath, ['-e', code]);
  out.alternative_bm25_index = { artefacts: 1, bytes: a.out.length, identical_bytes_in_two_runs: a.code === 0 && a.out === b.out && a.out.length > 0, note: 'one JSON file; documents sorted by path before indexing' };
}
out.method = 'Two builds of full copies (git history included) with SOURCE_DATE_EPOCH=1767225600; files compared by SHA-256.';
writeResult('c03-reproducible-build', out);
