#!/usr/bin/env node
'use strict';
/**
 * Recomputes the headline figures of the public benchmarks page from the raw rows in this folder and prints
 * each one next to the value on the page. Exit code 0: every figure matches. Exit code 1: at least one differs.
 *
 *   node verify.js
 *
 * Needs only Node 18 or newer; nothing is installed, no model or network is used.
 * Point estimates and medians are recomputed here from the raw rows. The 95 % intervals come from
 * answering/reports/summary.json, which `node src/report.js` writes from the same rows (bootstrap from the
 * engine's bench/metrics.js); this script checks that file against the rows before it uses it.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const readJsonl = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const cap = (n) => readJson(`capabilities/results/${n}.json`);

const results = [];
/** @param {string} id @param {string} claim @param {*} page value on the public page @param {*} actual recomputed @param {string} source */
function check(id, claim, page, actual, source, same = (a, b) => a === b) {
  results.push({ id, claim, page, actual, source, ok: same(page, actual) });
}
const near = (a, b) => Math.abs(a - b) < 1e-9;
const r1 = (x) => Math.round(x * 10) / 10;

// ---------------------------------------------------------------- answering study
const files = fs.readdirSync(path.join(ROOT, 'answering/results')).filter((f) => /^runs-.*\.jsonl$/.test(f));
const rows = files.flatMap((f) => readJsonl(`answering/results/${f}`));
const questions = readJsonl('answering/questions/questions.jsonl');
const summary = readJson('answering/reports/summary.json').sums;
const ANSWERABLE = ['single', 'two'];
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const median = (v) => { const s = [...v].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Per-question mean over seeds, then the mean over questions (the unit of analysis of the report). */
function questionMean(model, cond, f) {
  const by = new Map();
  for (const r of rows) {
    if (r.model !== model || r.condition !== cond || !ANSWERABLE.includes(r.kind) || r.error) continue;
    if (!by.has(r.question_id)) by.set(r.question_id, []);
    by.get(r.question_id).push(f(r) ? 1 : 0);
  }
  return { value: mean([...by.values()].map(mean)), n: by.size };
}
const tokensMedian = (model, cond) => median(rows.filter((r) => r.model === model && r.condition === cond).map((r) => r.prompt_tokens + r.completion_tokens));
const sumFor = (model, cond) => summary.find((s) => s.model === model && s.cond === cond);

// Consistency of the generated summary with the rows (so its intervals can be trusted as belonging to these rows).
let summaryConsistent = true;
for (const s of summary) {
  const c = questionMean(s.model, s.cond, (r) => r.scores.correct);
  if (s.correct && (!near(Math.round(c.value * 10000) / 10000, s.correct.value) || c.n !== s.correct.n)) summaryConsistent = false;
  if (s.tokens && s.tokens.value !== tokensMedian(s.model, s.cond)) summaryConsistent = false;
}
check('A0', 'reports/summary.json agrees with the raw rows (correct rate and median tokens, every model and route)', true, summaryConsistent, 'answering/results/*.jsonl vs answering/reports/summary.json');

const H = 'anthropic/claude-haiku-5.5'; const S = 'anthropic/claude-sonnet-5.5'; const Q = 'qwen2.5-coder:7b';
// [id, model, route, label, correct % on the page, [low, high] on the page or null, median tokens on the page, questions]
const TABLE = [
  ['A1', H, 'C0', 'Haiku, plain pages', 67.3, [55.0, 79.0], 29559, 50],
  ['A2', H, 'C1', 'Haiku, pages and llms.txt', 73.3, [61.7, 84.0], 22589, 50],
  ['A3', H, 'C2', 'Haiku, node tools', 98.0, [95.3, 100], 12983, 50],
  ['A4', H, 'C3', 'Haiku, retrieval', 97.3, [94.7, 99.3], 1311, 50],
  ['A5', S, 'C0', 'Sonnet, plain pages', 82.5, [70.0, 92.5], 20513, 40],
  ['A6', S, 'C1', 'Sonnet, pages and llms.txt', 82.5, [70.0, 92.5], 15918, 40],
  ['A7', S, 'C2', 'Sonnet, node tools', 97.4, [92.3, 100], 10939, 39],
  ['A8', S, 'C3', 'Sonnet, retrieval', 100, null, 1205, 39],
];
const pct = {};
for (const [id, model, cond, label, correct, ci, tokens, n] of TABLE) {
  const c = questionMean(model, cond, (r) => r.scores.correct);
  pct[`${model}|${cond}`] = r1(c.value * 100);
  check(`${id}a`, `${label}: correct answers on answerable questions (%)`, correct, r1(c.value * 100), 'answering/results/runs-*.jsonl, kinds single+two, mean over questions of the mean over seeds');
  check(`${id}b`, `${label}: questions with rows`, n, c.n, 'answering/results/runs-*.jsonl');
  // The page rounds 15,917.5 up.
  check(`${id}c`, `${label}: median tokens of one answer`, tokens, Math.round(tokensMedian(model, cond)), 'answering/results/runs-*.jsonl, median of prompt_tokens + completion_tokens over all rows of the route');
  if (ci) {
    const s = sumFor(model, cond).correct;
    check(`${id}d`, `${label}: 95 % interval (%)`, ci.join(' to '), [r1(s.low * 100), r1(s.high * 100)].join(' to '), 'answering/reports/summary.json (bootstrap written by src/report.js)');
  }
}
check('A9', 'Sonnet, retrieval: every one of the 39 answers correct', '39 of 39', `${Math.round(questionMean(S, 'C3', (r) => r.scores.correct).value * 39)} of ${questionMean(S, 'C3', (r) => r.scores.correct).n}`, 'answering/results/runs-anthropic_claude_sonnet_5.5.jsonl');
const gain = TABLE.filter((t) => t[2] === 'C2').flatMap(([, model]) => ['C0', 'C1'].map((c) => pct[`${model}|C2`] - pct[`${model}|${c}`]));
check('B1', 'Node tools beat the page routes by 15 to 31 points', '15-31', `${Math.round(Math.min(...gain))}-${Math.round(Math.max(...gain))}`, 'derived from A1-A8');
const fewer = TABLE.filter((t) => t[2] === 'C2').flatMap(([, model]) => ['C0', 'C1'].map((c) => 100 * (1 - tokensMedian(model, 'C2') / tokensMedian(model, c))));
check('B2', 'and used 31 to 56 % fewer tokens', '31-56', `${Math.round(Math.min(...fewer))}-${Math.round(Math.max(...fewer))}`, 'derived from the medians of A1-A8');
check('B3', 'Node tools 97 to 98 % correct against 67 to 83 % on the page routes', '97-98 vs 67-83',
  `${Math.round(Math.min(pct[`${H}|C2`], pct[`${S}|C2`]))}-${Math.round(Math.max(pct[`${H}|C2`], pct[`${S}|C2`]))} vs ${Math.round(Math.min(...['C0', 'C1'].flatMap((c) => [pct[`${H}|${c}`], pct[`${S}|${c}`]])))}-${Math.round(Math.max(...['C0', 'C1'].flatMap((c) => [pct[`${H}|${c}`], pct[`${S}|${c}`]])))}`, 'derived from A1-A8');
check('C1', 'Local 7B model, node results in one step (C2b): correct (%)', 84.0, r1(questionMean(Q, 'C2b', (r) => r.scores.correct).value * 100), 'answering/results/runs-qwen2.5_coder_7b.jsonl');
check('C2', 'Local 7B model, retrieved passages (C3): correct (%)', 94.0, r1(questionMean(Q, 'C3', (r) => r.scores.correct).value * 100), 'answering/results/runs-qwen2.5_coder_7b.jsonl');
const toolLoops = ['C0', 'C1', 'C2'].map((c) => r1(questionMean(Q, c, (r) => r.scores.correct).value * 100));
check('C3', 'Local 7B model could not run a tool loop: correct (%) in C0, C1, C2 is at most 1', true, Math.max(...toolLoops) <= 1, `answering/results: ${toolLoops.join(', ')} %`);
check('D1', 'Haiku citation digest matched the published chunks.jsonl in 91.0 % of answers (C2b)', 91.0, r1(questionMean(H, 'C2b', (r) => r.scores.verifiable).value * 100), 'answering/results/runs-anthropic_claude_haiku_5.5.jsonl, scores.verifiable');
check('D2', 'Local 7B model, same: 54.7 %', 54.7, r1(questionMean(Q, 'C2b', (r) => r.scores.verifiable).value * 100), 'answering/results/runs-qwen2.5_coder_7b.jsonl, scores.verifiable');
const nomodel = readJson('answering/results/nomodel.json');
check('D3', 'The read tool returned matching digests for 50 of 50 items', 50, nomodel.filter((r) => r.c2_read_digests_match_published).length, 'answering/results/nomodel.json, c2_read_digests_match_published');
check('E1', 'Sixty questions', 60, questions.length, 'answering/questions/questions.jsonl');
const kinds = (k) => questions.filter((q) => q.kind === k).length;
check('E2', '40 answered by one item, 10 by two, 10 not in the node', '40/10/10', `${kinds('single')}/${kinds('two')}/${kinds('unanswerable')}`, 'answering/questions/questions.jsonl, field kind');
check('E3', 'Retrieval (top 5) held every gold item for 50 of 50 answerable questions', 50, nomodel.filter((r) => r.recall5_C3_all_gold).length, 'answering/results/nomodel.json, recall5_C3_all_gold');
const hand = readJsonl('answering/results/handcheck.jsonl'); const byKey = new Map(rows.map((r) => [`${r.question_id}|${r.condition}|${r.model}|${r.seed}`, r]));
let agree = 0;
for (const v of hand) {
  const r = byKey.get(v.key); if (!r) continue;
  const mech = r.kind === 'unanswerable' ? r.scores.correct_abstention : r.scores.correct;
  const human = r.kind === 'unanswerable' ? v.abstained_ok : v.correct;
  if (mech === human) agree += 1;
}
check('F1', 'A hand reading of 30 answers agreed with the program on all 30', '30 of 30', `${agree} of ${hand.length}`, 'answering/results/handcheck.jsonl against the stored scores');

// ---------------------------------------------------------------- capabilities study
const s15 = cap('case15-semantics'); const nodes = Object.values(s15.nodes);
const sumOf = (f) => nodes.reduce((a, n) => a + f(n), 0);
check('G1', '5 graphs', 5, nodes.length, 'capabilities/results/case15-semantics.json, nodes');
check('G2', '3,941 statements', 3941, sumOf((n) => n.nquads_statements), 'case15-semantics.json, nodes.*.nquads_statements');
check('G3', 'Turtle and N-Quads forms equal in 5 of 5 graphs', 5, nodes.filter((n) => n.turtle_equals_nquads).length, 'case15-semantics.json, nodes.*.turtle_equals_nquads');
check('G4', 'All 5 pass the SHACL shapes, 0 violations and 0 warnings', '5, 0', `${nodes.filter((n) => n.shacl_conforms).length}, ${sumOf((n) => Object.values(n.shacl_results_by_severity || {}).reduce((a, b) => a + b, 0))}`, 'case15-semantics.json, shacl_conforms and shacl_results_by_severity');
check('G5', '609 shape statements', 609, s15.shapes_statements, 'case15-semantics.json, shapes_statements');
check('G6', '3,648 queries run with 0 failures', '3648, 0', `${sumOf((n) => n.questions.reduce((a, q) => a + (q.ran || 0), 0))}, ${sumOf((n) => n.questions.reduce((a, q) => a + (q.failed || 0), 0))}`, 'case15-semantics.json, nodes.*.questions[].ran and .failed');
check('G7', '8 of the 10 published SPARQL questions run as written (two need a selection of items)', '8 of 10', `${nodes[0].questions.filter((q) => !q.needs_input).length} of ${nodes[0].questions.length}`, 'case15-semantics.json, questions[].needs_input');
const voc = {}; for (const n of nodes) for (const [k, c] of Object.entries(n.statements_by_vocabulary)) voc[k] = (voc[k] || 0) + c;
const total = Object.values(voc).reduce((a, b) => a + b, 0);
check('G8', '68 % of statements use a property from a shared vocabulary', 68, Math.round((100 * (total - voc.own)) / total), 'case15-semantics.json, statements_by_vocabulary (all but "own")');
check('G9', 'Ontology of 19 classes, 19 object properties, 22 datatype properties', '19/19/22', `${s15.ontology.classes}/${s15.ontology.object_properties}/${s15.ontology.datatype_properties}`, 'case15-semantics.json, ontology');
check('G10', 'rdflib 7.6.0 and pySHACL 0.40.2', 'rdflib 7.6.0, pyshacl 0.40.2', `rdflib ${s15.tools.rdflib}, pyshacl ${s15.tools.pyshacl}`, 'case15-semantics.json, tools');

const c06 = cap('c06-typed-link-questions');
check('H1', 'Typed-link questions answered through the links tool: 30 of 30', '30 of 30', `${c06.summary.G2_tool_server.exact} of ${c06.summary.G2_tool_server.n}`, 'c06-typed-link-questions.json, summary.G2_tool_server');
check('H2', 'Best route that gave a local model retrieved text: 16 of 30', 16, Math.max(...Object.entries(c06.summary).filter(([k]) => /^B[12]\|qwen/.test(k)).map(([, v]) => v.exact)), 'c06-typed-link-questions.json, summary.B1|B2 for qwen2.5-coder:7b');
check('H3', '71 items in the example Bundles', 71, c06.bundles.reduce((a, b) => a + b.items, 0), 'c06-typed-link-questions.json, bundles[].items');

const c12 = cap('c12-round-trips');
const pairsOk = c12.pairs.filter((p) => p.items_missing_after === 0 && p.front_matter_keys_lost_or_changed === 0 && p.bodies_identical === p.items_in_source).length;
check('I1', '11 of 11 export and import pairs returned every item, body and field unchanged', '11 of 11', `${pairsOk} of ${c12.pairs.length}`, 'c12-round-trips.json, pairs[]');

const c07 = cap('c07-cross-node');
const starts = Object.values(c07.starts);
check('J1', 'From either node the other was found in 4 requests', '4, 4', starts.map((s) => s.discovery_route.requests_to_get_both_indexes).join(', '), 'c07-cross-node.json, starts.*.discovery_route.requests_to_get_both_indexes');
check('J2', 'Facts attributed to the right node in 8 of 8 answers', '8 of 8', `${starts[0].discovery_route.attribution_correct} of ${starts[0].discovery_route.questions_with_both_facts_retrieved}`, 'c07-cross-node.json, discovery_route.attribution_correct');

const c01 = cap('c01-tamper-detection');
check('K1', 'Digest-listed files: 9', 9, c01.files_named_in_discovery_document, 'c01-tamper-detection.json');
const A = c01.by_class['A named in discovery document'];
check('K2', 'All 33 changes to those nine files detected by the engine and by the Python package', '33 of 33, 33 of 33', `${A.node_detected} of ${A.n}, ${A.python_detected} of ${A.n}`, 'c01-tamper-detection.json, by_class["A named in discovery document"]');
const c03 = cap('c03-reproducible-build');
check('K3', 'Two clean builds identical file for file: 323 of 323 and 237 of 237', '323 of 323, 237 of 237', `${c03.nodes.patterns.identical} of ${c03.nodes.patterns.files_a}, ${c03.nodes.main.identical} of ${c03.nodes.main.files_a}`, 'c03-reproducible-build.json, nodes');
const c05 = cap('c05-time-to-first-node');
check('L1', 'A first node: 6 commands, 22 seconds, 4 files by hand', '6, 22, 4', `${c05.commands_run}, ${Math.round(c05.seconds_total)}, ${c05.hand_written_file_count}`, 'c05-time-to-first-node.json');
const c04 = cap('c04-one-source-many-outputs');
check('L2', 'One build wrote 323 files of 14 kinds in 2.4 seconds', '323, 14, 2.4', `${c04.build.total_files}, ${Object.keys(c04.build.by_kind).filter((k) => k !== 'other').length}, ${r1(c04.build.ms / 1000)}`, 'c04-one-source-many-outputs.json, build (the report does not count the "other" bucket as a kind)');
const c08a = cap('c08a-governance-writes');
check('M1', '0 source files changed in 20 attempts', '0 of 20', `${c08a.files_changed_in_bundle} of ${c08a.writing_tools_inputs}`, 'c08a-governance-writes.json');
check('M2', '8 of the 20 attempts returned a proposal, 12 were refused with an error code', '8, 12', `${c08a.propose.proposal_returned + c08a.remember.proposal_returned}, ${c08a.propose.error_envelope + c08a.remember.error_envelope}`, 'c08a-governance-writes.json, propose and remember: proposal_returned, error_envelope');
const c13 = cap('c13-conformance-second-implementation'); const l3 = c13.engine['level 3'];
check('N1', '376 of 399 vectors pass, none fails (23 withdrawn)', '376, 0, 399, 23', `${l3.pass}, ${l3.fail}, ${l3.total}, ${l3.skip}`, 'c13-conformance-second-implementation.json, engine["level 3"]');
const py3 = c13.python['level 3'];
check('N2', 'The Python package runs the vectors of 7 areas: 115 pass, 0 fail', '7, 115, 0', `${py3.areas_run.length}, ${py3.counts.pass}, ${py3.counts.fail || 0}`, 'c13-conformance-second-implementation.json, python["level 3"]');
check('N3', 'Agrees with the engine on 40 of 40 damaged discovery documents', '40 of 40', `${c13.agreement.damaged_documents.same_verdict} of ${c13.agreement.damaged_documents.n}`, 'c13-conformance-second-implementation.json, agreement.damaged_documents');
const c14 = cap('c14-offline');
check('O1', 'Offline: 11 of 11 operations', '11 of 11', `${c14.passed} of ${c14.total}`, 'c14-offline.json');
const c10 = cap('c10-scale');
check('P1', 'At 5,000 items the local tool server took 35 seconds to start', 35, Math.round(c10.rows.find((r) => r.items === 5000).mcp_cold_start_ms / 1000), 'c10-scale.json, rows[items=5000].mcp_cold_start_ms');
const c09 = cap('c09-held-back-content');
check('Q1', 'The local tool server serves held-back drafts (103 of 103 read)', '103 of 103', `${c09.mcp_read_returns_held_back} of ${c09.held_back_items}`, 'c09-held-back-content.json');

// ---------------------------------------------------------------- output
const w = (s, n) => String(s).padEnd(n);
console.log(`${w('result', 9)}${w('id', 6)}${w('on the page', 34)}${w('recomputed', 34)}figure`);
for (const r of results) console.log(`${w(r.ok ? 'OK' : 'MISMATCH', 9)}${w(r.id, 6)}${w(r.page, 34)}${w(r.actual, 34)}${r.claim}`);
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length} figures checked, ${results.length - bad.length} match, ${bad.length} differ.`);
for (const r of bad) console.log(`  ${r.id}: ${r.claim}\n      source: ${r.source}`);
console.log('\nNot recomputable from this folder (taken from the engine\'s own record, docs/MEASUREMENTS.md): the scale table for 500, 5,000 and 10,000 items and the 80, 8 and 2 ms call times; 530 of 536 equal tool calls; 250 pages with 0 accessibility violations; 108 of 108 seeded faults and 14 of 14 controls; the build under another time zone (61 files); the thirteen digest-listed files of agenticsystemcore.com; hosting cost.');
process.exit(bad.length ? 1 : 0);
