'use strict';
/**
 * Case 2. Re-reads the rows of the answering study (copied to scratch first; the study folder is never written; the hosted-model files are incomplete because those runs stopped at their token caps,
 * so the row counts at copy time are recorded). For every CORRECT answer of an answerable question, three levels of citation are counted:
 *   L1  names the item that holds the fact (slug or URL);
 *   L2  gives a locator that a program can resolve to one passage without a model: a chunk id or digest prefix of a published chunk, or `slug#n`
 *       (the `slug#n` form is the answering study's own split into sections, not a published address; it is resolvable only with that study's code);
 *   L3  gives a digest prefix (>= 16 hex) of a published chunk, and that chunk's text contains every fact of the question: the passage can be
 *       fetched and its bytes checked against a published digest, and it supports the answer.
 * Nothing is judged by a model.
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult } = require('./shared/lib');

const SRC = cfg.ANSWERING;
const copyDir = path.join(cfg.SCRATCH, 'work', 'first-study-rows'); fs.mkdirSync(copyDir, { recursive: true });
const rowFiles = fs.readdirSync(path.join(SRC, 'results')).filter((f) => /^runs-(?!smoke)/.test(f));
const copied = {};
for (const f of rowFiles) { fs.copyFileSync(path.join(SRC, 'results', f), path.join(copyDir, f)); copied[f] = fs.readFileSync(path.join(copyDir, f), 'utf8').split('\n').filter(Boolean).length; }

const chunksByNode = {};
for (const n of cfg.NODES) {
  const list = fs.readFileSync(path.join(cfg.wwwDir(n), 'chunks.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  chunksByNode[n] = { list, sections: new Set() };
}
// the answering study's `slug#n` sections: one per "## " section of the item body (same rule as shared/corpus.js)
const corpus = require('./shared/corpus');
for (const n of cfg.NODES) for (const c of corpus.markdownChunks(n)) chunksByNode[n].sections.add(c.id);

const questions = {};
for (const l of fs.readFileSync(path.join(SRC, 'questions/questions.jsonl'), 'utf8').split('\n').filter(Boolean)) { const q = JSON.parse(l); questions[q.id] = q; }

const agg = {};
for (const f of rowFiles) {
  for (const line of fs.readFileSync(path.join(copyDir, f), 'utf8').split('\n').filter(Boolean)) {
    const r = JSON.parse(line); const q = questions[r.question_id];
    if (!q || q.kind === 'unanswerable' || !r.scores || !r.scores.correct) continue;
    const key = `${r.model} | ${r.condition}`; const a = (agg[key] = agg[key] || { model: r.model, condition: r.condition, correct_answers: 0, L1: 0, L2: 0, L3: 0 });
    a.correct_answers += 1;
    const text = r.answer.toLowerCase();
    if (r.scores.cited_all) a.L1 += 1;
    const chunks = chunksByNode[r.node];
    const hexes = text.match(/[0-9a-f]{16,64}/g) || [];
    const hit = hexes.map((h) => chunks.list.find((c) => c.digest.startsWith(h) || c.id.startsWith(h))).filter(Boolean);
    const sectionRefs = (text.match(/[a-z0-9-]+#\d+/g) || []).filter((s) => chunks.sections.has(s));
    if (hit.length || sectionRefs.length) a.L2 += 1;
    if (hit.some((c) => q.facts.every((x) => new RegExp(x, 'i').test(c.text))) && r.scores.cited_all) a.L3 += 1;
  }
}
const rows = Object.values(agg).sort((a, b) => (a.model + a.condition).localeCompare(b.model + b.condition))
  .map((a) => ({ ...a, L1_pct: +(100 * a.L1 / a.correct_answers).toFixed(1), L2_pct: +(100 * a.L2 / a.correct_answers).toFixed(1), L3_pct: +(100 * a.L3 / a.correct_answers).toFixed(1) }));
writeResult('c02-citation-checkability', {
  source_rows_copied: copied, note: 'Rows of runs-anthropic_* are incomplete: the hosted-model runs stopped at their token caps. Counts are of the rows present.',
  levels: { L1: 'names the item', L2: 'locator a program resolves to one passage (published chunk id or digest, or the answering study’s own slug#n)', L3: 'published digest of a passage that holds every fact of the question, and the item is named' },
  rows,
});
