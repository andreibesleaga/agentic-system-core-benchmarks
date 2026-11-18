'use strict';
/**
 * Case 4. One Bundle (the patterns node, 50 published items) -> every artefact kind the engine writes.
 * Counts files, bytes and wall time per output kind. Build output is classified by file name; every export
 * verb and adapter is run once in a clean copy.
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, agsc, treeHash, freshCopy } = require('./shared/lib');

const sum = (h, dir) => Object.keys(h).reduce((a, f) => a + fs.statSync(path.join(dir, f)).size, 0);

/** Classifies a file under www/ into a kind of artefact. First match wins. */
const KINDS = [
  ['discovery document (linkset)', /^\.well-known\/knowledge-linkset$/],
  ['other .well-known files', /^\.well-known\//],
  ['knowledge graph (JSON-LD, Turtle, N-Quads, context)', /^(graph\.(jsonld|ttl|nq)|ns\/.*|graph\/.*)$/],
  ['RDF shapes / ontology / vocabulary files', /\.(shacl|shapes)\./],
  ['chunks for retrieval (JSONL, TOON)', /^chunks(-index)?\.(jsonl|toon)$|^chunks\/.*/],
  ['text for language models (llms.txt, llms-full.txt, now.md)', /^(llms(-full)?\.txt|now\.md)$/],
  ['search index', /^search(\.json|\/.*\.json)$|^search\/.*\.json$/],
  ['skill packs (Agent Skills)', /^skills\//],
  ['ledger', /^ledger\.jsonl$/],
  ['JSON-LD description of each item', /^pages\/.*\.jsonld$/],
  ['in-browser tools (page tool scripts incl. WebMCP, graph explorer)', /^compose\/.*\.js$|^clusters\/agsc-explorer\.(js|css)$/],
  ['HTML pages', /\.html$/],
  ['Markdown copy of each item', /^pages\/.*\.md$|\.md$/],
  ['page scripts, styles, assets (client-side tools included)', /\.(js|css|svg|png|woff2?|ico|webmanifest)$|^assets\//],
  ['crawler and host files (robots, sitemap, headers, redirects)', /^(robots\.txt|sitemap\.xml|_headers|_redirects)$/],
];

function classify(rel) { for (const [k, re] of KINDS) if (re.test(rel)) return k; return 'other'; }

const out = { build: {}, commands: [], steer_targets: {} };
{
  const dir = freshCopy(cfg.fullDir('patterns'), 'c04-build');
  const r = agsc(dir, ['build', '--quiet']);
  const www = path.join(dir, 'www'); const h = treeHash(www);
  const by = {};
  for (const f of Object.keys(h)) { const k = classify(f); by[k] = by[k] || { files: 0, bytes: 0 }; by[k].files += 1; by[k].bytes += fs.statSync(path.join(www, f)).size; }
  out.build = { exit: r.code, ms: r.ms, total_files: Object.keys(h).length, total_bytes: sum(h, www), by_kind: by,
    items_published: JSON.parse(fs.readFileSync(path.join(www, '.well-known/knowledge-linkset'), 'utf8')).linkset[0].describedby[0]['agsc-counts'] };
}

const COMMANDS = [
  ['export --steer (default targets)', ['export', '--steer']],
  ['export --steer --target all 11', ['export', '--steer', '--target', 'agents,aider,claude,cline,codex,copilot,cursor,gabbe,gemini,kiro,windsurf']],
  ['export --markdown', ['export', '--markdown']], ['export --okf', ['export', '--okf']],
  ['export --jsonld', ['export', '--jsonld']], ['export --jsonl', ['export', '--jsonl']],
  ['export --skos', ['export', '--skos']], ['export --closure', ['export', '--closure']],
  ...['cogx', 'gabbe', 'mermaid', 'mem0', 'letta', 'zep', 'csv', 'basic-memory', 'claude-code', 'skills', 'llm-context', 'board'].map((a) => [`export --to ${a}`, ['export', '--to', a]]),
  ['skills (emit every pack)', ['skills']], ['skills --zip', ['skills', '--zip']],
  ['compose augmented-llm agents-as-tools --zip', ['compose', 'augmented-llm', 'agents-as-tools', '--zip']],
  ['compose ... --brief', ['compose', 'augmented-llm', 'agents-as-tools', '--brief']],
];
for (const [label, args] of COMMANDS) {
  const dir = freshCopy(cfg.fullDir('patterns'), 'c04-cmd');
  const before = treeHash(dir, (rel) => rel.startsWith('.git/') || rel.startsWith('www/'));
  const r = agsc(dir, args);
  const after = treeHash(dir, (rel) => rel.startsWith('.git/') || rel.startsWith('www/'));
  const added = Object.keys(after).filter((f) => before[f] !== after[f]);
  const ext = {};
  for (const f of added) { const e = path.extname(f) || '(none)'; ext[e] = (ext[e] || 0) + 1; }
  out.commands.push({ command: `agsc ${args.join(' ')}`, label, exit: r.code, ms: r.ms, files: added.length, bytes: added.reduce((a, f) => a + fs.statSync(path.join(dir, f)).size, 0),
    by_extension: ext, first_message: (r.code === 0 ? '' : (r.out + r.err).split('\n').filter(Boolean)[0] || '').slice(0, 240), sample: added.slice(0, 4) });
}
{
  const dir = freshCopy(cfg.fullDir('patterns'), 'c04-steer');
  agsc(dir, ['export', '--steer', '--target', 'agents,aider,claude,cline,codex,copilot,cursor,gabbe,gemini,kiro,windsurf']);
  const base = path.join(dir, 'dist/export/steer');
  const files = fs.existsSync(base) ? treeHash(base) : {};
  const hashes = new Set(Object.values(files));
  out.steer_targets = { files: Object.keys(files).sort(), distinct_contents: hashes.size, bytes_each: Object.keys(files).map((f) => fs.statSync(path.join(base, f)).size)[0] };
}
out.mcp = { tools: 10, note: 'counted in case 8 and case 10 from the server tool list' };
writeResult('c04-one-source-many-outputs', out);
