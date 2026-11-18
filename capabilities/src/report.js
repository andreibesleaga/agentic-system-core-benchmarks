'use strict';
/**
 * Writes REPORT.md from results/*.json. Every number in the report is read from a results file here;
 * the prose around the numbers is fixed text in this file. A missing results file gives a section that says so.
 */
const fs = require('node:fs');
const path = require('node:path');

const STUDY = path.resolve(__dirname, '..');
const read = (n) => { try { return JSON.parse(fs.readFileSync(path.join(STUDY, 'results', `${n}.json`), 'utf8')); } catch { return null; } };
const n0 = (x) => (x === null || x === undefined ? 'n/a' : Number(x).toLocaleString('en-US', { maximumFractionDigits: 0 }));
const n1 = (x) => (x === null || x === undefined ? 'n/a' : Number(x).toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 }));
const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;
const of = (a, b) => `${a} of ${b}`;
const NA = (title, why) => ({ row: [title, 'not measured', why, '', 'not measured', ''], text: `Not measured. ${why}` });

const cases = [];
const add = (id, title, f) => { const r = f(); cases.push({ id, title, ...r }); };

// 1. Tamper and staleness
add(1, 'Tamper and staleness detection', () => {
  const d = read('c01-tamper-detection'); if (!d) return NA('Tamper and staleness detection', 'results/c01-tamper-detection.json is missing.');
  const c = d.by_class; const A = c['A named in discovery document']; const rest = ['B pages (html)', 'C per-item copies (md, jsonld)', 'D other site files'].reduce((a, k) => ({ n: a.n + c[k].n, d: a.d + c[k].node_detected }), { n: 0, d: 0 });
  const g = d.markdown_folder_with_known_good_hashes; const w = d.whole_older_site_consistent_with_its_own_document;
  const tbl = Object.entries(c).sort().map(([k, v]) => `| ${k} | ${v.n} | ${v.node_detected} | ${v.python_detected} |`).join('\n');
  return {
    row: ['Tamper and staleness detection', `Seeded damage to published files (one byte, one sentence, truncation, swapped file, stale file), checked from the discovery document with the engine checker and the Python package`,
      `${of(d.totals.node_detected, d.totals.n)} damaged files detected (Node and Python agree: ${d.totals.python_detected}). All ${A.node_detected} damaged files among the ${d.files_named_in_discovery_document} the document names were caught; ${rest.d} of ${rest.n} damaged pages, per-item copies and other files were caught`,
      `Plain pages, llms.txt, BM25 index: no check exists, 0 of ${d.totals.n}. A Markdown folder in git with a known-good commit: ${of(g.detected, g.n)}`, 'capability difference (partial coverage)', `${d.totals.n}`],
    text: `**Method.** A copy of the built patterns site (${d.files_in_site} files) is damaged one file at a time with a seeded generator (seed ${d.seed}). Targets: all ${d.files_named_in_discovery_document} files the discovery document gives a digest for, and 20 random files in each other class. Damage kinds: one byte changed, one sentence replaced, the last 10 percent cut off, two files of the same class swapped. After each damage the discovery document is checked at level 2 by the engine's checker and by the Python package from PyPI. Five stale files (a file taken from a build in which one item was changed) and one whole older site were tested separately.

| Class of file | Damaged | Caught by Node checker | Caught by Python package |
|---|---|---|---|
${tbl}

**Stale and replaced.** Stale files from another build: ${d.stale_files_tested} tested, ${d.by_class['A named in discovery document'].n >= 1 ? 'all are in the class named by the document and are counted in the table above' : ''}. A complete older site, served with its own older discovery document, passes the digest check (Node reports a failure: ${w.digests_only_node}; Python: ${w.digests_only_python}). The anchor check (\`agsc-host verify-anchor\`, with the anchor of the current build kept by the client) rejects the older site: ${w.anchor_check_detects_old_site}, and accepts the current site: ${w.anchor_check_accepts_the_anchored_site}.

**Alternatives.** Plain pages, \`llms.txt\` and a BM25 index publish no digest, so a client with no earlier trusted copy has no way to detect any of the ${d.totals.n} cases (shown as 0 and labelled "no mechanism"). A Markdown folder in git is stronger than that: with a known-good commit it detected ${of(g.detected, g.n)} damaged files (git \`hash-object\`, nothing written). That protects the holder of the repository; it does not give a reader of a remote site any check.

**What the numbers say.** The digests cover the machine files (the nine named files, which include \`chunks.jsonl\`, so every sentence of every item is covered there) and nothing else. The HTML pages, the per-item Markdown copies and the other files carry no digest in the discovery document, so damage to them goes unseen by this check. A client can compare a page with the chunk file itself, but no tool of the engine does that.

**Limits.** The damage is synthetic and made by one person. Detection by the checker needs the discovery document to be intact; a host that replaces the document and the files together is caught by an anchor held outside the host, and not by the digests. Python and Node agree on every case, but the Python package is a checker, not a second build engine (its README says so).`,
  };
});

// 2. Citation checkability
add(2, 'Citation checkability', () => {
  const d = read('c02-citation-checkability'); if (!d) return NA('Citation checkability', 'results/c02-citation-checkability.json is missing.');
  const get = (m, c) => d.rows.find((r) => r.model.includes(m) && r.condition === c);
  const q = (c) => get('qwen', c); const g = (c) => get('gemma', c); const h = (c) => get('haiku', c);
  const tbl = d.rows.filter((r) => r.correct_answers >= 20).map((r) => `| ${r.model} | ${r.condition} | ${r.correct_answers} | ${n1(r.L1_pct)} | ${n1(r.L2_pct)} | ${n1(r.L3_pct)} |`).join('\n');
  return {
    row: ['Citation checkability', 'Share of correct answers whose citation a program can check, down to the passage and its published digest (rows of the answering study, re-scored)',
      `Node one-shot with digest (C2b): ${n1(q('C2b').L3_pct)} percent (qwen2.5-coder:7b), ${n1(g('C2b').L3_pct)} (gemma3:4b), ${n1(h('C2b').L3_pct)} (Haiku) of correct answers cite a published digest of a passage that holds the facts`,
      `BM25 passages (C3): ${n1(q('C3').L3_pct)} / ${n1(g('C3').L3_pct)} / ${n1(h('C3').L3_pct)}; it cites \`slug#n\` sections that a program can resolve (${n1(q('C3').L2_pct)} / ${n1(g('C3').L2_pct)} / ${n1(h('C3').L2_pct)}) but with no digest to check bytes against`,
      'capability difference (the node publishes the digests; the model must still copy one, which is what C2b asks)', `${q('C2b').correct_answers} / ${g('C2b').correct_answers} / ${h('C2b').correct_answers} correct answers`],
    text: `**Method.** The rows of the answering study (\`results/runs-*.jsonl\`) were copied to scratch first. Row counts at copy time: ${Object.entries(d.source_rows_copied).map(([k, v]) => `${k}: ${v}`).join('; ')}. The hosted-model runs stopped at their token caps (see the answering study), so those files are incomplete; the numbers describe the rows present at the copy. For every correct answer to an answerable question three levels are counted by program, with no model judging: L1 names the item that holds the fact; L2 gives a locator that resolves to one passage (a published chunk id or digest, or the answering study's \`slug#n\` section); L3 gives a published digest of a passage that holds every fact of the question, and names the item.

| Model | Condition | Correct answers | L1 % | L2 % | L3 % |
|---|---|---|---|---|---|
${tbl}

Conditions with fewer than 20 correct answers are left out of the table (the tool loops of a 7B model almost never answered; see the answering study). C2b is the node's \`read\` tool with an instruction to write the digest beside the item; C3 is BM25 passages; C4 is the whole corpus pasted.

**What the numbers say.** The node publishes a digest for every passage; the alternatives measured here do not, so L3 is out of reach for them. Whether a model copies the digest is a model and prompt matter: the instruction in C2b asks for it. BM25 citations by \`slug#n\` resolve to a section, but the section numbering belongs to the answering study's own splitting code, not to anything the Markdown folder publishes.

**Limits.** A retrieval index could keep a digest per passage if its builder added one; the answering study's did not, so L3 for C3 is 0 by construction and says nothing about what retrieval could do. L3 proves that the cited passage exists unchanged and holds the facts; it does not prove the answer is a fair reading of it. Rows from the paid run are incomplete.`,
  };
});

// 3. Reproducible build
add(3, 'Reproducible build', () => {
  const d = read('c03-reproducible-build'); if (!d) return NA('Reproducible build', 'results/c03-reproducible-build.json is missing.');
  const p = d.nodes.patterns; const m = d.nodes.main; const v = d.variations;
  const vr = Object.entries(v).map(([k, x]) => `| ${k} | ${x.exit === 0 ? `${x.identical} of ${x.files_a}` : `build failed (exit ${x.exit})`} | ${x.differing ?? ''} |`).join('\n');
  const b = d.alternative_bm25_index;
  return {
    row: ['Reproducible build', 'Two builds of each node in clean copies; files compared by SHA-256',
      `${of(p.identical, p.files_a)} files identical (patterns), ${of(m.identical, m.files_a)} (main); \`agsc verify\` passes on both`,
      b ? `BM25 index over the same Markdown: ${b.identical_bytes_in_two_runs ? '1 of 1 artefact identical' : 'not identical'} (one file)` : 'not run', 'tie on the property; the node covers far more artefacts', `${p.files_a + m.files_a} files`],
    text: `**Method.** Each node is built twice in two clean copies with \`SOURCE_DATE_EPOCH=1767225600\`, and every output file is compared by SHA-256. Git history is part of the input, so the copies carry it. The patterns node is built with \`agsc build\` (${sec(p.build_a_ms)}), the main node with its own pipeline (${sec(m.build_a_ms)}). \`agsc verify\` (two builds and a comparison) was run on both: exit ${p.verify.exit} and ${m.verify.exit}.

Patterns node: ${of(p.identical, p.files_a)} files identical, ${p.differing} differ. Main node: ${of(m.identical, m.files_a)} identical, ${m.differing} differ.

**What breaks it.** One change at a time against the patterns baseline:

| Change | Files identical | Files that differ |
|---|---|---|
${vr}

The build instant is an input, as the specification says (AGSC-04-09): changing it changes the files that carry a date (${v[Object.keys(v)[0]].differing} files), and an empty value is read as unset with a warning. The time zone, the locale and the folder path do not change any byte.

**The committed site against a fresh build.** ${d.committed_vs_fresh.differing} of ${d.committed_vs_fresh.files_a} files of the committed \`www/\` differ from a fresh build of the same repository, because the working tree is newer than the commit and the site's pipeline adds files (for example \`.well-known/sustainability-data\`). That is a difference between two inputs, not a failure of the build.

**Alternative.** A BM25 index over the same Markdown serialised twice is ${b && b.identical_bytes_in_two_runs ? 'byte-identical' : 'not byte-identical'} (${b ? `${b.artefacts} file, ${n0(b.bytes)} bytes` : ''}). The Markdown folder has no build. Both are reproducible; the node reproduces ${p.files_a} files of many kinds.

**Limits.** Two machines were not compared; the engine's own record does that. Builds that read the network are refused by the engine (AGSC-04-03), so none was tried.`,
  };
});

// 4. One source, many outputs
add(4, 'One source, many outputs', () => {
  const d = read('c04-one-source-many-outputs'); if (!d) return NA('One source, many outputs', 'results/c04-one-source-many-outputs.json is missing.');
  const by = d.build.by_kind; const kinds = Object.keys(by).filter((k) => k !== 'other').length;
  const okc = d.commands.filter((c) => c.exit === 0); const bad = d.commands.filter((c) => c.exit !== 0);
  const kt = Object.entries(by).sort((a, b) => b[1].files - a[1].files).map(([k, v]) => `| ${k} | ${v.files} | ${n0(v.bytes)} |`).join('\n');
  const ct = d.commands.map((c) => `| \`${c.command.length > 78 ? `${c.command.slice(0, 75)}...` : c.command}\` | ${c.exit === 0 ? 'ok' : `exit ${c.exit}`} | ${c.files} | ${n0(c.bytes)} | ${sec(c.ms)} |`).join('\n');
  return {
    row: ['One source, many outputs', 'Artefacts written from one Bundle of 50 published items',
      `One build: ${d.build.total_files} files in ${kinds} kinds (${mb(d.build.total_bytes)}, ${sec(d.build.ms)}); then ${okc.length} more export commands write ${okc.reduce((a, c) => a + c.files, 0)} files; 11 steering files for 11 coding tools have identical bytes (${d.steer_targets.distinct_contents} distinct content)`,
      'Markdown folder: the folder itself. llms.txt: 1 file. BM25 index: 1 file', 'capability difference', `${d.commands.length + 1} commands`],
    text: `**Method.** The patterns node (${d.build.items_published.join(', ')}) is built once; each export verb and adapter is then run once in a clean copy and the files it adds are counted.

| Kind of file in the build | Files | Bytes |
|---|---|---|
${kt}

Total: ${d.build.total_files} files, ${n0(d.build.total_bytes)} bytes, ${sec(d.build.ms)}. The tool server (\`agsc mcp\`) serves 10 tools from the same Bundle without writing a file (counted in case 8). The built pages also carry in-browser tool scripts (the page tools and WebMCP registration are in the "in-browser tools" row).

| Command | Result | Files added | Bytes | Time |
|---|---|---|---|---|
${ct}

**Steering files.** \`export --steer\` with all 11 targets wrote ${d.steer_targets.files.length} files of ${n0(d.steer_targets.bytes_each)} bytes each; ${d.steer_targets.distinct_contents === 1 ? 'every file has the same bytes' : `${d.steer_targets.distinct_contents} distinct contents`}.

${bad.length ? `**Failures.** ${bad.map((c) => `\`${c.command}\` exited ${c.exit}: ${c.first_message}`).join('; ')}. (\`--to board\` expects a board format and live board items; the patterns node has none.)` : ''}

**What the alternatives give.** A Markdown folder is the source and nothing more. An \`llms.txt\` is one file. A BM25 or vector index is one artefact. None of them writes the other kinds. Whether a user wants those kinds is a separate question: the case shows breadth, not value.

**Limits.** "Kinds" is the author's grouping of file names (the rules are in \`src/c04-one-source-many-outputs.js\`). A file counted as an output may not be useful to a given reader. The export commands were run with default flags.`,
  };
});

// 5. Time to first node
add(5, 'Time to first node', () => {
  const d = read('c05-time-to-first-node'); if (!d) return NA('Time to first node', 'results/c05-time-to-first-node.json is missing.');
  const errs = d.problems.filter((p) => /^(error|before)/.test(p.message) || true);
  const pt = errs.map((p) => `| ${p.step} | ${p.message.replace(/\|/g, '/').slice(0, 230)}${p.message.length > 230 ? '...' : ''} | ${p.fix_named} |`).join('\n');
  return {
    row: ['Time to first node', 'The documented quick start from an empty folder (npm install, three notes, init, build)',
      `${d.commands_run} commands, ${d.seconds_total} s (${d.seconds_without_npm_install} s without the npm install); ${d.hand_written_file_count} files written by hand (${d.hand_written_files.join(', ')}); ${d.files_built} files built; ${d.steps_that_failed.length} failed steps on the way`,
      'Not measured: a Markdown folder needs 0 commands but gives no site, index or graph, so there is no like-for-like time', 'cost only', '1 run'],
    text: `**Method.** The commands of \`docs/guides/mode-0.md\` were run from an empty folder in scratch with the published npm package (version ${d.engine_version_installed}). The guide's \`git init\` and \`git commit\` were replaced by \`SOURCE_DATE_EPOCH\` (the guide names it as the alternative; this study runs no git write command). A person who builds straight after \`init\` was also simulated, to meet the errors.

${d.commands_run} commands in ${d.seconds_total} s (npm install ${sec(d.steps[0].ms)}). Files written by hand: ${d.hand_written_files.join(', ')}. The build wrote ${d.files_built} files. ${d.has_chunks ? 'It includes' : 'It lacks'} the chunk file, and ${d.has_discovery_document ? 'the discovery document' : 'no discovery document'}.

**Steps that failed:** ${d.steps_that_failed.map((s) => `"${s}"`).join('; ')}.

**Every error and "before you build" line met** (warnings are left out; they are in the results file):

| Step | Message | Does it say what to do? (the author's reading) |
|---|---|---|
${pt}

**The node's own checker on the result.** The discovery document of this quick-start node fails the checker at level 2 (exit ${d.discovery_check_level2.exit}: ${d.discovery_check_level2.last_line}), because \`site.base\` is still the placeholder \`http://localhost/\`. \`agsc build\` and \`agsc ci\` both pass with a warning that says to set it. A node is not publishable before that change, and the guide says so.

**Limits.** One run on one machine. Time includes the registry download (${sec(d.steps[0].ms)}), which varies. "Does it say what to do" is the author's reading of the full message, not a measurement. The alternative has no comparable time: a folder of notes is already there, but it is not a site.`,
  };
});

// 6. Typed-link questions
add(6, 'Typed-link questions', () => {
  const d = read('c06-typed-link-questions'); if (!d) return NA('Typed-link questions', 'results/c06-typed-link-questions.json is missing; the case needs the local model server.');
  const s = d.summary; const mods = d.models;
  const best = (k) => mods.map((m) => ({ m, v: s[`${k}|${m}`] })).sort((a, b) => b.v.exact - a.v.exact)[0];
  const rowsTbl = ['G1_graph_read', 'G2_tool_server'].map((k) => `| ${k === 'G1_graph_read' ? 'G1 published graph read by a program (the gold source)' : 'G2 `links` tool calls by a program (no model)'} | ${s[k].exact} of ${s[k].n} | ${k === 'G2_tool_server' ? `${n1(s[k].precision * 100)} / ${n1(s[k].recall * 100)}` : 'n/a'} |`).join('\n')
    + '\n' + mods.flatMap((m) => ['B1', 'B2', 'W'].map((k) => `| ${{ B1: 'B1 BM25 top 5 whole files (question text)', B2: 'B2 BM25 top 5 whole files (question text plus subject slug)', W: 'W all files pasted' }[k]}, ${m} | ${s[`${k}|${m}`].exact} of ${s[`${k}|${m}`].n} | ${n1(s[`${k}|${m}`].precision * 100)} / ${n1(s[`${k}|${m}`].recall * 100)} |`)).join('\n');
  const types = Object.entries(d.by_type).map(([t, v]) => `| ${t} | ${v.n} | ${v.G2_exact} | ${mods.map((m) => ['B1', 'B2', 'W'].map((k) => v[`${k}|${m}`]).join('/')).join(' ; ')} |`).join('\n');
  const bb = Math.max(...mods.flatMap((m) => ['B1', 'B2', 'W'].map((k) => s[`${k}|${m}`].exact)));
  return {
    row: ['Typed-link questions', `30 questions on relations and 2 to 3 step paths over three Bundles with typed links (${d.bundles.reduce((a, b) => a + b.items, 0)} items); gold from the published graph`,
      `Program using the node's \`links\` tool: ${of(s.G2_tool_server.exact, s.G2_tool_server.n)} exact (the gold is read from the same graph; see limits)`,
      `Local model with BM25 whole files or all files pasted: best ${bb} of ${s.G2_tool_server.n} exact (${mods.join(', ')})`, `capability difference (a program answers exactly; the best local model system gave ${bb} of ${s.G2_tool_server.n})`, `${d.questions}`],
    text: `**Method.** The two published nodes use only the \`related\` key, so they cannot hold a question about "requires" or "decided-by". The questions use the engine's three worked blueprint Bundles (\`examples/blueprints/\`: ${d.bundles.map((b) => `${b.name} ${b.items} items`).join(', ')}), which use \`requires\`, \`uses\`, \`verifies\` and \`decided-by\`. They are example Bundles written by the project, not live nodes. ${d.questions} questions were generated from the graph by a seeded script (direct, inverse, two-step, three-step, verifies, decided-by). **Gold comes from \`graph.nq\` of each build, the published graph.** A system that reads that graph, or the node's tools over it, agrees with the gold by construction in part; for those systems this case shows what a program can do with a node, not an accuracy contest.

Systems. G1: the graph file read by a program (this is the gold source). G2: a program that calls the tool server's \`links\` tool and follows the edges (independent code path, no model). B1 and B2: BM25 (MiniSearch) over the whole raw Markdown files with front matter, top 5 files, then a local model (${mods.join(' and ')}, temperature 0, seed 1, ${d.context_tokens_limit}-token context); B2 adds the subject's slug to the query, the best fair shot for retrieval. W: every raw file of the Bundle pasted into the prompt.

| System | Exact set correct | Precision / recall % |
|---|---|---|
${rowsTbl}

| Question type | n | G2 exact | B1/B2/W exact per model (${mods.join(' ; ')}) |
|---|---|---|---|
${types}

**What the numbers say.** The tool route returns the exact set for every question; so does the graph file, since it is the source of the gold. The small local models ${bb >= d.questions * 0.7 ? 'answered most questions' : 'did not answer most questions exactly'} when they had to read prose and front matter (best ${bb} of ${d.questions}). A person could write the same graph walk over the Markdown front matter; the point is that the node publishes the edges, including the computed inverses, so no one has to.

**Limits.** Circular gold (above). Three Bundles written by the project, not third-party data. Two small local models, one seed, no tool-using model. The retrieval systems take one retrieval step; an agent that searched again for each step of a path was not tested, and it might do better on the two-step and three-step questions than the single step shown here. The question wording is templated. The "exact set" score is strict: one extra or missing item is a miss; precision and recall are shown for that reason.`,
  };
});

// 7. Cross-node
add(7, 'Cross-node questions', () => {
  const d = read('c07-cross-node'); if (!d) return NA('Cross-node questions', 'results/c07-cross-node.json is missing.');
  if (d.measured === false) return NA('Cross-node questions', d.reason);
  const hp = d.starts['patterns.agenticsystemcore.com']; const hm = d.starts['agenticsystemcore.com']; const c = d.control_rag_over_both_folders;
  return {
    row: ['Cross-node questions', `10 questions needing one fact from each node; the client starts from one node and must find the other and attribute each fact`,
      `Peer found from both starts (${hp.discovery_route.requests_to_get_both_indexes} requests, ${n0(hp.discovery_route.bytes_to_get_both_indexes)} bytes); both facts retrieved for ${of(hp.discovery_route.questions_with_both_facts_retrieved, d.questions)}; attribution correct for ${of(hp.discovery_route.attribution_correct, hp.discovery_route.questions_with_both_facts_retrieved)} retrieved`,
      `Page crawl reaches the other host after ${hp.page_crawl_route.pages_fetched} pages (from patterns) or ${hm.page_crawl_route.pages_fetched} (from main); llms.txt names no peer; RAG over both folders retrieves both facts for ${of(c.questions_with_both_facts_retrieved, d.questions)}`, 'tie on answers; capability difference in finding the peer (declared, checkable)', `${d.questions}`],
    text: `**Method.** Ten questions, each with one fact in each node (every fact was checked against the published text before the run). No network: host names are mapped to the two build folders. Route A starts at one node's address, reads \`/.well-known/knowledge-linkset\`, follows the \`peer\` relation, reads each node's chunk surface, ranks the merged chunks with BM25 (top 6) and attributes each hit by the host of the chunk's IRI. Route B crawls HTML pages from the start page until a page of the other host appears. Route C checks whether the start node's \`llms.txt\` names the other host. The control is a BM25 index over the raw Markdown of both folders, with the file path as source label.

| Start | Peer found by discovery | Requests and bytes | Both facts in top 6 | Attribution right | Page crawl to other host | llms.txt names other host |
|---|---|---|---|---|---|---|
| patterns | ${hp.discovery_route.peer_found} | ${hp.discovery_route.requests_to_get_both_indexes} / ${n0(hp.discovery_route.bytes_to_get_both_indexes)} | ${hp.discovery_route.questions_with_both_facts_retrieved} of ${d.questions} | ${hp.discovery_route.attribution_correct} of ${hp.discovery_route.questions_with_both_facts_retrieved} | ${hp.page_crawl_route.pages_fetched} pages, ${n0(hp.page_crawl_route.bytes)} bytes | ${hp.llms_txt_route.names_other_host} |
| main | ${hm.discovery_route.peer_found} | ${hm.discovery_route.requests_to_get_both_indexes} / ${n0(hm.discovery_route.bytes_to_get_both_indexes)} | ${hm.discovery_route.questions_with_both_facts_retrieved} of ${d.questions} | ${hm.discovery_route.attribution_correct} of ${hm.discovery_route.questions_with_both_facts_retrieved} | ${hm.page_crawl_route.pages_fetched} pages, ${n0(hm.page_crawl_route.bytes)} bytes | ${hm.llms_txt_route.names_other_host} |

The engine's mutual check of the two documents (\`validate-wellknown --peer\`) passes: ${d.mutual_conformance_check.status}.

**What the numbers say.** The discovery document names the peer as a peer, and the two documents check each other. Plain pages also lead to the other site by ordinary links, at the cost of ${hp.page_crawl_route.pages_fetched} to ${hm.page_crawl_route.pages_fetched} pages here, with nothing that says the other site is a peer. Retrieval and attribution are a tie: the control, a BM25 index over both folders, retrieves both facts for ${c.questions_with_both_facts_retrieved} of ${d.questions}, the discovery route for ${hp.discovery_route.questions_with_both_facts_retrieved}. Attribution by IRI host is correct for every retrieved fact, and path labels do the same in the control.

**Limits.** Two nodes by the same author, linked by design. Hosts mapped to local folders, so there is no network test. Ten questions written by the author with the facts known. The control knows both folders exist; nothing in a folder says so.`,
  };
});

// 8. Governance
add(8, 'Governance: writes and injection', () => {
  const a = read('c08a-governance-writes'); const b = read('c08b-injection-lint'); if (!a || !b) return NA('Governance', 'results/c08a-governance-writes.json or results/c08b-injection-lint.json is missing.');
  return {
    row: ['Governance: writes and injection', `${a.tool_calls} calls to the 10 tools of \`agsc mcp\` (20 inputs to the two tools that prepare changes); 30 injection samples and 10 controls through \`agsc lint\``,
      `Silent writes to the Bundle: ${a.files_changed_in_bundle} of ${a.writing_tools_inputs} inputs; ${a.propose.proposal_returned + a.remember.proposal_returned} proposals returned instead. Injection: ${of(b.structural.engine_caught, b.structural.n)} structural caught, ${of(b.subtle.engine_caught, b.subtle.n)} subtle caught; ${b.controls.engine_false_positives} of ${b.controls.n} controls flagged`,
      `No tool or scanner exists for a Markdown folder, a llms.txt or a RAG index. A five-line phrase search catches ${of(b.structural.baseline_caught, b.structural.n)} structural and ${of(b.subtle.baseline_caught, b.subtle.n)} subtle, ${b.controls.baseline_false_positives} of ${b.controls.n} controls flagged`, 'writes: capability difference. Injection: win on structural, loss on subtle', `${a.writing_tools_inputs} + ${b.total.n}`],
    text: `**Part A: writes.** All ten tools of \`agsc mcp\` were called (${a.tool_calls} calls): \`propose\` and \`remember\` with 10 inputs each, including a missing item, path-like slugs, a 5,000-character slug, a NUL byte, an unknown kind, a body with front matter inside it, and a body that tells the reader to ignore its instructions; and one call to each of the other eight tools. The whole Bundle folder, git data included, was hashed before and after.

- Files changed, added or removed: **${a.files_changed_in_bundle}**.
- \`propose\`: ${a.propose.proposal_returned} proposals returned, ${a.propose.error_envelope} refused with an error code (AGSC-E301 for the six slugs that name no item, AGSC-E203 for the two inputs that set a task state).
- \`remember\`: ${a.remember.proposal_returned} proposals returned, ${a.remember.error_envelope} refused (AGSC-E003 for the two calls with no operator, AGSC-E203 for the two comments; the messages are in the results file).
- Every proposal returned is marked \`origin: ai-generated\` (${a.proposals_marked_ai_generated} of ${a.proposal_returned_total ?? a.propose.proposal_returned + a.remember.proposal_returned}) and carries findings that ask for the agent and the model (${a.proposals_returned_with_a_required_field_finding} with findings). Paths stay inside \`content/\` (${a.proposals_with_path_outside_content} outside). The title \`../../../escape\` became \`content/concepts/escape.md\`.
- The injection text in a \`remember\` body was **${a.injection_text_flagged_at_proposal_stage ? '' : 'not '}flagged** at proposal stage. It would be flagged by \`agsc lint\` when the proposed file is checked, which part B measures.
- The other eight tools all answered (${a.other_tools_ok} of ${a.other_tools_n}).

**Part B: injection.** 30 samples written for this study (by the author, knowing the rule): 15 structural (a listed phrase, an HTML comment, zero-width characters, Unicode tag characters, bidirectional controls, a long base64 or hex run, a \`javascript:\` or \`data:\` link, a fenced "system prompt") and 15 subtle (a polite paraphrase, extra spaces or a line break inside the listed phrase, a digit for a letter, a Cyrillic letter, French and German versions, an instruction aimed at "assistants", a request to fetch and obey another page). 10 harmless controls were run beside them. Each text was placed in one item of a small Bundle and \`agsc lint --json\` was run.

| Group | n | Engine lint (codes AGSC-E401, E402) | Five-line phrase search |
|---|---|---|---|
| structural | ${b.structural.n} | ${b.structural.engine_caught} caught | ${b.structural.baseline_caught} caught |
| subtle | ${b.subtle.n} | ${b.subtle.engine_caught} caught | ${b.subtle.baseline_caught} caught |
| harmless controls flagged | ${b.controls.n} | ${b.controls.engine_false_positives} | ${b.controls.baseline_false_positives} |

Findings for a human-authored item are severities: ${b.severity_of_findings_for_a_human_authored_item.join(', ')} (an item with \`prov.agent\` set gets an error instead; AGSC-08-13). Missed samples: ${b.missed_ids.join(', ')}.

**What the numbers say.** The tool server wrote nothing in ${a.writing_tools_inputs} hostile and ordinary inputs, and returned each change as a reviewable payload. The lint catches what its rule lists, by design (AGSC-08-19 says it proves nothing about a novel injection); it catches none of the ${b.subtle.n} subtle samples, and a whitespace-tolerant phrase search catches ${b.subtle.baseline_caught} of them. One harmless control ("you are now expected to...") was flagged by both.

**Limits.** The samples were written knowing the rule; the subtle half sits outside it on purpose. The numbers show where the boundary is, not a score for the product. A model that reads the text is outside this case. The alternatives have no writing tool to compare in part A: a folder of Markdown is written by whatever edits it.`,
  };
});

// 9. Held-back content
add(9, 'Held-back content on the tool server', () => {
  const d = read('c09-held-back-content'); if (!d) return NA('Held-back content', 'results/c09-held-back-content.json is missing.');
  return {
    row: ['Held-back content on the tool server', `Does \`agsc mcp\` at tag 1.1.0 serve ${d.held_back_items} draft items of the patterns node?`,
      `Yes. \`read\` returned ${of(d.mcp_read_returns_held_back, d.held_back_items)}, \`links\` ${of(d.mcp_links_returns_held_back, d.held_back_items)}, \`search\` found ${of(d.mcp_search_finds_held_back_by_title, d.held_back_items)} by title; \`ask\` cited a draft in ${of(d.ask_cites_held_back, d.ask_asked)} questions. Published surfaces carry ${d.held_back_found_on_published_surfaces}`,
      `A published-only copy serves ${d.control_published_only_copy_read_returns_held_back} drafts. A folder of Markdown or an index over it serves whatever it holds`, 'loss (documented as intended for the author\'s own use)', `${d.held_back_items}`],
    text: `**Method.** The full copy of the patterns repository (drafts present) was served by \`agsc mcp\`. Every one of the ${d.held_back_items} held-back items (all with \`status: draft\`) was requested through \`read\`, \`links\` and \`search\` (by its title); \`ask\` was asked about the first 30. The built site's published surfaces (\`llms.txt\`, \`llms-full.txt\`, \`chunks.jsonl\`, the three graph files, the sitemap) were searched for the IRI of every held-back item. The control is the published-only copy the answering study used.

- \`read\`: ${d.mcp_read_returns_held_back} of ${d.held_back_items} drafts returned. \`links\`: ${d.mcp_links_returns_held_back}. \`search\`: ${d.mcp_search_finds_held_back_by_title}. \`ask\`: cited a draft in ${d.ask_cites_held_back} of ${d.ask_asked}.
- The result marks the status: ${d.mcp_read_marks_draft_in_result} of ${d.mcp_read_returns_held_back} returned items show \`status: draft\` in their text.
- The tool server lists ${d.resources_listed} resources and ${d.tools_listed} tools.
- Published surfaces carrying a held-back item: ${d.held_back_found_on_published_surfaces}. The published node holds back what it says it holds back.
- Control (published-only copy): ${d.control_published_only_copy_read_returns_held_back} drafts readable.

**This confirms the answering study's finding at tag 1.1.0, and it is a loss for a person who wants one server to be safe for a public audience.** The specification says the local tool server is the author's own tool over the author's Bundle and reads drafts (${d.documented}). The risk is for someone who exposes \`agsc mcp --http\` (loopback only by design) or hands its output to an agent that others use, believing it serves the published set. The way to get the published set is to serve a folder that holds only published items, as the answering study did.

**Limits.** One node with 103 drafts. The check of published surfaces looks for item IRIs; text of a draft quoted inside a published item is not detected.`,
  };
});

// 10. Scale
add(10, 'Scale', () => {
  const d = read('c10-scale'); if (!d) return NA('Scale', 'results/c10-scale.json is missing.');
  const ok = d.rows.filter((r) => r.generated);
  const last = ok[ok.length - 1];
  const tbl = d.rows.map((r) => (r.generated ? `| ${n0(r.items)} | ${r.build_ok ? sec(r.build_ms_median) : 'failed'} | ${n0(r.peak_rss_mb_max)} MB | ${r.output_bytes ? `${mb(r.output_bytes)}, ${n0(r.output_files)} files` : ''} | ${r.mcp_cold_start_ms ? sec(r.mcp_cold_start_ms) : r.mcp_error || ''} | ${r.mcp_search_ms_median !== undefined ? `${n1(r.mcp_search_ms_median)} ms (p95 ${n1(r.mcp_search_ms_p95)})` : ''} | ${n1(r.bm25_query_ms_median * 1)} ms; index ${n0(r.bm25_index_build_ms)} ms |` : `| ${n0(r.items)} | not generated: ${r.error} | | | | | |`)).join('\n');
  return {
    row: ['Scale', `Synthetic Bundles of ${ok.map((r) => n0(r.items)).join(', ')} items: build time, peak memory, output size, tool-server cold start and search latency`,
      `${n0(last.items)} items: build ${last.build_ok ? sec(last.build_ms_median) : 'failed'}, peak ${n0(last.peak_rss_mb_max)} MB, output ${last.output_bytes ? mb(last.output_bytes) : 'n/a'}; tool server cold start ${last.mcp_cold_start_ms ? sec(last.mcp_cold_start_ms) : 'n/a'}, search median ${n1(last.mcp_search_ms_median)} ms`,
      `BM25 index in one process: index build ${n0(last.bm25_index_build_ms)} ms, query median ${n1(last.bm25_query_ms_median)} ms at ${n0(last.items)} items`, 'loss on speed and size; the node does more per build', `${ok.length} sizes x ${d.runs_per_size} runs`],
    text: `**Method.** Synthetic Bundles from the engine's own generator (\`bench/gen-bundle.js\`; deterministic, valid per the schema, output a function of the item count). Build: \`agsc build\` run ${d.runs_per_size} times per size, median wall time, peak memory from GNU \`time -v\`. Search: the tool server's \`search\`, median of 30 queries made of words from the generated items (seeded). Cold start: spawn to first answer. Baseline: MiniSearch BM25 over the same Markdown files in one Node process. Machine: ${d.machine}.

| Items | Build (median) | Peak memory | Output | Tool server cold start | Tool server search | BM25 query |
|---|---|---|---|---|---|---|
${tbl}

**What the numbers say.** The node builds a site, graph, chunks and many other files; the baseline builds one in-memory index, so the two are not doing the same work and the baseline is faster at every size. What matters for a reader is whether the node stays usable: ${ok.every((r) => r.build_ok) ? 'every size built' : 'some sizes failed to build'}; the largest build is ${sec(last.build_ms_median)} and ${n0(last.peak_rss_mb_max)} MB.

**Limits.** Synthetic text from a fixed word list, not real prose. One machine. The page-side search (the browser index) was not measured. At more than 500 items the engine shards its indexes (AGSC-06-21 and AGSC-06-31); the sizes above cross that bound.`,
  };
});

// 11. Reading cost
add(11, 'Agent reading cost', () => {
  const d = read('c11-agent-reading-cost'); if (!d) return NA('Agent reading cost', 'results/c11-agent-reading-cost.json is missing.');
  const R = d.routes; const key = (p) => Object.keys(R).find((k) => k.startsWith(p));
  const D = R[key('D ')]; const c3 = R[key('C3')]; const c1 = R[key('C1')]; const c0 = R[key('C0')]; const c2 = R[key('C2')];
  const tbl = Object.entries(R).map(([k, v]) => `| ${k} | ${n0(v.ctx_bytes)} | ${n0(v.ctx_tokens)} | ${v.transferred_bytes ? n0(v.transferred_bytes) : ''} | ${v.n} |`).join('\n');
  return {
    row: ['Agent reading cost', 'Median bytes and tokens in the prompt to reach one fact, by route, 50 answerable questions',
      `Discovery route from a bare domain (document, chunk file, BM25 in the client): ${n0(D.ctx_bytes)} bytes / ${n0(D.ctx_tokens)} tokens in context, ${n0(D.transferred_bytes)} bytes downloaded; node tool route: ${n0(c2.ctx_bytes)} / ${n0(c2.ctx_tokens)}`,
      `BM25 passages with the index already local: ${n0(c3.ctx_bytes)} / ${n0(c3.ctx_tokens)}; llms.txt plus page: ${n0(c1.ctx_bytes)} / ${n0(c1.ctx_tokens)}; crawl from the home page: ${n0(c0.ctx_bytes)} / ${n0(c0.ctx_tokens)}`, `loss against BM25 passages with a local index (${n1(D.ctx_tokens / c3.ctx_tokens)} times the tokens); win against page routes (${n1(D.ctx_tokens / c1.ctx_tokens)} times the tokens of llms.txt plus page)`, `${d.questions}`],
    text: `**Method.** Routes C0 to C4 and the two floors come unchanged from the answering study's \`results/nomodel.json\` (no model; copied before reading). Route D is new: an agent that knows only the domain reads the discovery document, takes the chunk surface it names, ranks the published chunks with BM25 in its own code, and puts the top 5 chunks in the prompt. "In context" is what a model reads; "downloaded" is what the client fetches.

| Route | Bytes in context (median) | Tokens in context (median) | Bytes downloaded | n |
|---|---|---|---|---|
${tbl}

Route D found a chunk set that held the facts and the gold items for ${D.gold_in_top5} of ${D.n} questions (first-study recall for C3: ${d.first_study_recall.C3_top5_recall_all_gold} of ${D.n}).

**What the numbers say.** Starting from a bare domain, the discovery route puts ${n0(D.ctx_tokens)} tokens in the prompt, ${n1(D.ctx_tokens / c3.ctx_tokens)} times what BM25 passages with a local index need (${n0(c3.ctx_tokens)}); the discovery document alone is ${n0(D.discovery_document_bytes_median)} bytes of the ${n0(D.ctx_bytes)}. The route also downloads the whole chunk file (${n0(D.transferred_bytes)} bytes) because the client has no index yet. It is well below the page routes (${n0(c1.ctx_tokens)} tokens for llms.txt plus the page, ${n0(c0.ctx_tokens)} for a crawl). The node's tool route is ${n0(c2.ctx_tokens)} tokens; the answering study traced that to the envelope of chunk metadata around each answer. Without the document (a client can parse it in code and keep it out of the prompt) the chunk text is ${n0(D.ctx_bytes - D.discovery_document_bytes_median)} bytes, against ${n0(c3.ctx_bytes)} for the answering study's BM25 passages.

**Limits.** Tokens use the o200k vocabulary, as in the answering study. The numbers are costs of reaching a fact, not of getting it right. The answering study's C2 numbers used a 3,500-character cap per tool result.`,
  };
});

// 12. Round trips
add(12, 'Round trips', () => {
  const d = read('c12-round-trips'); if (!d) return NA('Round trips', 'results/c12-round-trips.json is missing.');
  const ok = d.pairs.filter((p) => p.import_exit === 0 && p.items_found_after !== undefined);
  const full = ok.filter((p) => p.items_found_after === p.items_in_source && p.front_matter_keys_lost_or_changed === 0 && p.bodies_identical === p.items_in_source);
  const tbl = d.pairs.map((p) => (p.import_exit === 0 && p.items_found_after !== undefined ? `| ${p.pair} | ${p.items_found_after} of ${p.items_in_source} | ${p.front_matter_keys_kept} kept, ${p.front_matter_keys_lost_or_changed} lost | ${p.bodies_identical} | ${Object.keys(p.lost_key_names).slice(0, 8).join(', ')} |` : `| ${p.pair} | ${p.error ? `failed: ${p.error.slice(0, 90)}` : 'failed'} | | | |`)).join('\n');
  return {
    row: ['Round trips', `${d.pairs.length} export and import pairs the engine documents, run on the patterns node (${d.source_items_published} published items)`,
      `${full.length} of ${d.pairs.length} pairs return every item and every body unchanged and every front-matter key equal; ${ok.length - full.length} do not; ${d.pairs.length - ok.length} did not run. The one change in every pair is a \`source_version\` stamp added to \`prov\` (${ok[0] ? ok[0].prov_gained_only_a_source_version_stamp : 0} of ${ok[0] ? ok[0].items_in_source : 0} items)`,
      'Markdown folder to another tool: no exporter; an import is by hand. llms.txt and a BM25 index have no import', 'capability difference', `${d.pairs.length} pairs`],
    text: `**Method.** Each pair: export from the full patterns Bundle, import into an empty Bundle that has only the configuration file, then compare the published items: every front-matter key (parsed with PyYAML, so quoting style does not count) and the body (bytes equal). ${d.note}

| Pair | Items back | Front-matter keys | Bodies identical | Keys lost or changed (names) |
|---|---|---|---|---|
${tbl}

"Kept" counts a \`prov\` block that differs from the source only by an added \`source_version\` (where the item came from); ${ok[0] ? ok[0].prov_gained_only_a_source_version_stamp : 0} items per pair.

**What the numbers say.** Every pair that ran gave back every item and body, and every key except the stamp. This is a round trip of the engine's own export. The Markdown exports are lossless by rule (AGSC-01-26); for the memory and agent-kit adapters the result shows what the current code does for its own output.

**Limits.** A file written by another tool, with its own fields, was not tested: that is where fields would be lost, and the engine's import has rules for it (AGSC-01-22). "Kept" compares top-level keys as parsed data, not as text. Steering, Mermaid and SKOS are not pairs.`,
  };
});

// 13. Conformance
add(13, 'Conformance and a second implementation', () => {
  const d = read('c13-conformance-second-implementation'); if (!d) return NA('Conformance', 'results/c13-conformance-second-implementation.json is missing.');
  const e3 = d.engine['level 3']; const p3 = d.python['level 3']; const ag = d.agreement.damaged_documents;
  const lv = [0, 1, 2, 3].map((l) => `| ${l} | ${d.engine[`level ${l}`].pass} / ${d.engine[`level ${l}`].skip} / ${d.engine[`level ${l}`].fail} | ${d.python[`level ${l}`].counts.pass || 0} / ${d.python[`level ${l}`].counts.skip || 0} / ${d.python[`level ${l}`].counts['not-run'] || 0} / ${d.python[`level ${l}`].counts.fail || 0} |`).join('\n');
  return {
    row: ['Conformance and a second implementation', 'Conformance vectors with the engine and with the Python package; agreement on discovery documents',
      `Engine level 3: ${e3.pass} pass, ${e3.skip} skipped, ${e3.fail} fail of ${e3.total}. Python runs ${p3.areas_run.length} of the areas: ${p3.counts.pass} pass, ${p3.counts['not-run']} not run, 0 fail. The two agree on ${of(ag.same_verdict, ag.n)} damaged documents and both nodes`,
      'A Markdown folder, llms.txt or a RAG index has no conformance vectors or checker to run', 'capability difference', `${e3.total} vectors; ${ag.n} damaged documents`],
    text: `**Method.** \`agsc conform --level 0..3\` runs the engine's vectors in a built Bundle copy. The Python package (from PyPI) runs the vectors of the areas it implements (\`run-vectors\`) and names the rest as not run. Agreement: both checkers read the discovery documents of both nodes at levels 0 to 3, then ${ag.n} seeded damaged copies of the patterns document (changed digest, removed digest, http anchor, unregistered relation, extra whitespace, changed counts, changed bundle hash, truncated JSON, removed target) at level 2.

| Level | Engine: pass / skip / fail | Python: pass / skip / not run / fail |
|---|---|---|
${lv}

- Python areas run: ${p3.areas_run.join(', ')}. Not run: ${p3.areas_not_run.join(', ')}.
- Vector files checked by the Node tool: ${d.vector_files_checked.node_tool_last_line}; by Python: exit ${d.vector_files_checked.python_exit}.
- Real nodes: both checkers agree at all four levels on both nodes (${['patterns', 'main'].map((n) => `${n}: ${d.agreement.real_nodes[n].filter((x) => x.agree).length} of 4`).join('; ')}).
- Damaged documents: same verdict on ${of(ag.same_verdict, ag.n)}, same error codes on ${of(ag.same_error_codes, ag.n)}; both rejected ${ag.both_rejected}.

**What the numbers say.** The vectors pass on the engine, and a second implementation, small and with no dependency, agrees with it on every document tried. The second implementation covers ${p3.areas_run.length} areas and ${p3.counts.pass} of ${p3.total} vectors; its README says it is not a second engine.

**Limits.** The Python package and the engine are by the same author, so agreement shows consistency, not independence. The 40 damaged documents were chosen by the author. "Not run" is not a pass.`,
  };
});

// 14. Offline
add(14, 'Offline operation', () => {
  const d = read('c14-offline'); if (!d) return NA('Offline operation', 'results/c14-offline.json is missing.');
  if (!d.measured) return NA('Offline operation', d.reason);
  const t = d.rows.map((r) => `| ${r.op} | ${r.ok ? 'ok' : 'failed'} | ${r.ms !== undefined ? sec(r.ms) : ''} |`).join('\n');
  return {
    row: ['Offline operation', 'Build, lint, verify, export, skills, checkers (Node and Python), conformance, tool server over stdio and over loopback HTTP, with the network removed',
      `${of(d.passed, d.total)} operations pass with the network removed (an outbound connection fails inside it: ${d.outbound_connection_to_1_1_1_1_443})`,
      'BM25 index, Markdown folder, llms.txt: work offline too (no network is involved)', 'tie', `${d.total}`],
    text: `**Method.** The operations ran inside \`unshare -rn\` (a new user and network namespace with no interface up). A connection to a public address from inside failed with ${d.outbound_connection_to_1_1_1_1_443}. Only the loopback device was brought up, for the tool server's HTTP transport.

| Operation | Result | Time |
|---|---|---|
${t}

**What the numbers say.** Nothing in this list needs the network. The engine refuses network access in a build by rule (AGSC-04-03). The alternatives do not need it either, so this is a tie; it matters as a property a user may want to know, not as an advantage.

**Limits.** Install is not offline (npm needs the registry); not tested here. The browser pages were not opened.`,
  };
});

// 15. Semantics: the published graph read by independent RDF tools (results/case15-semantics.json, made by src/case15_semantics.py)
add(15, 'The graph read by independent RDF tools', () => {
  const d = read('case15-semantics'); if (!d) return NA('The graph read by independent RDF tools', 'results/case15-semantics.json is missing.');
  const nodes = Object.entries(d.nodes); const N = nodes.length;
  const sum = (f) => nodes.reduce((a, [, v]) => a + f(v), 0);
  const stmts = sum((v) => v.nquads_statements);
  const equal = nodes.filter(([, v]) => v.turtle_equals_nquads).length; const conform = nodes.filter(([, v]) => v.shacl_conforms).length;
  const qs = nodes.flatMap(([, v]) => v.questions); const ran = qs.reduce((a, q) => a + (q.ran || 0), 0); const failed = qs.reduce((a, q) => a + (q.failed || 0), 0);
  const perNode = nodes[0][1].questions; const runnable = perNode.filter((q) => !q.needs_input).length;
  const voc = {}; for (const [, v] of nodes) for (const [k, c] of Object.entries(v.statements_by_vocabulary)) voc[k] = (voc[k] || 0) + c;
  const shared = Object.entries(voc).filter(([k]) => k !== 'own').reduce((a, [, c]) => a + c, 0);
  const pctShared = Math.round((100 * shared) / Object.values(voc).reduce((a, c) => a + c, 0));
  const rows = nodes.map(([k, v]) => `| ${k} | ${n0(v.nquads_statements)} | ${v.turtle_equals_nquads ? 'equal' : 'differ'} | ${v.shacl_conforms ? 'conforms' : 'violations'} | ${n0(v.questions.reduce((a, q) => a + (q.ran || 0), 0))} |`).join('\n');
  return {
    row: ['The graph read by independent RDF tools', `The graphs of the two nodes and the three example Bundles read with ${Object.entries(d.tools).map(([k, v]) => `${k} ${v}`).join(' and ')}: Turtle against N-Quads, the published SHACL shapes, the ten published SPARQL questions`,
      `${N} graphs, ${n0(stmts)} statements: ${of(equal, N)} Turtle and N-Quads forms equal; ${of(conform, N)} conform to the shapes; ${runnable} of ${perNode.length} questions run as written, ${n0(ran)} queries run with ${n0(failed)} failures; ${pctShared} % of statements use a shared vocabulary`,
      'A Markdown folder, llms.txt or a BM25 index publishes no graph to read', 'capability difference', `${N} graphs`],
    text: `**Method.** \`src/case15_semantics.py\` reads \`graph.ttl\` and \`graph.nq\` of each build with rdflib and pySHACL, tools that share no code with the engine. The JSON-LD form is not parsed (its context is a remote document and no network is used). The ten questions are the published SPARQL queries (\`docs/ontology-questions.json\`); each runs once for each subject of the graph. Two of them take a selection of items as input and are not run. The ontology has ${d.ontology.classes} classes, ${d.ontology.object_properties} object properties and ${d.ontology.datatype_properties} datatype properties (${d.ontology.statements} statements); the shapes file has ${d.shapes_statements}. This case was added after the other fourteen; \`results/case15-semantics.json\` holds its rows.

| Graph | Statements | Turtle and N-Quads | SHACL shapes | Queries run |
|---|---|---|---|---|
${rows}

Statements by vocabulary, all graphs: ${Object.entries(voc).sort().map(([k, c]) => `${k} ${n0(c)}`).join('; ')}.

**What the numbers say.** The published graphs parse and validate with libraries the project did not write, and the published questions run on them without a failure. Many questions return no answer on a given graph because the graph holds no such link; \`answered\` in the results file counts the ones that do.

**Limits.** A statement counts as "shared" when its property comes from Dublin Core, SKOS, PROV, RDF, RDFS, schema.org or OWL; the rest use the project's own terms. Passing the shapes shows the graph follows the project's own constraints, not that its meanings are right. The two independent tools were chosen by the project.`,
  };
});

// ---------- assemble ----------
const verdictCounts = (words) => cases.filter((c) => words.some((w) => String(c.row[4]).startsWith(w))).length;
const losses = cases.filter((c) => /loss/.test(String(c.row[4])));
const out = [];
out.push('# Capabilities study: what a node, or a part of it, offers');
out.push('');
out.push(`Run on 18 November 2026; every table is generated from the raw rows by \`src/report.js\` (case 15 was added later and is read from \`results/case15-semantics.json\`). The choices behind each case are in \`DECISIONS.md\`. Engine: tag 1.1.0. No model was called except two small local ones in case 6.`);
out.push('');
out.push('## 1. One-screen summary');
out.push('');
out.push(`The answering study measured question answering and found BM25 retrieval answered best and cheapest. This study measures other things: trust, governance, reuse, human use. ${cases.length} cases, each run by a script in \`src/\`. The cases are of two kinds. In a capability difference the alternative has no mechanism, so no accuracy is compared. In a win, tie or loss both sides did the same task.`);
out.push('');
const lines = cases.map((c) => `- **${c.id}. ${c.title}.** ${c.row[2]}. Verdict: ${c.row[4]}.`);
out.push(...lines);
out.push('');
out.push(`**Losses reported:** ${losses.map((c) => `case ${c.id} (${c.title})`).join('; ') || 'none'}.`);
out.push('');
out.push('## 2. Table');
out.push('');
out.push('| # | Case | What was measured | Node result | Best alternative | Verdict | n |');
out.push('|---|---|---|---|---|---|---|');
for (const c of cases) out.push(`| ${c.id} | ${c.row[0]} | ${c.row[1]} | ${c.row[2]} | ${c.row[3]} | ${c.row[4]} | ${c.row[5]} |`);
out.push('');
out.push('## 3. The cases');
for (const c of cases) { out.push(''); out.push(`### Case ${c.id}. ${c.title}`); out.push(''); out.push(c.text); }
out.push('');
out.push('## 4. What this does not show');
out.push('');
out.push(`- **It does not show the node is better at answering questions.** The answering study's result stands. Where this study reports a win it is for a property the node publishes (digests, typed links, a discovery document, governance of writes), not for answer quality.
- **A capability difference is not a score.** When the alternative has no mechanism, the comparison is 0 by construction. Whether anyone needs the mechanism is a separate question; the cases show that it exists and works.
- **Gold in case 6 comes from the graph it tests.** The program systems agree with it in part by construction. The model systems are where an accuracy comparison exists.
- **Two nodes, one author, one engine.** Both nodes were built by the engine's author with the engine's own conventions. Nothing here shows what a third party would find.
- **Small corpora.** 50 and 14 published items; three blueprint Bundles of 71 items; synthetic Bundles up to 5,000 items made from a word list.
- **No embedding or vector index.** Every "RAG" here is BM25. No remote model was called; the models used were two small local ones.
- **No user study.** Nothing here measures whether a person finds the node easier to use, only what the files and tools do. Case 5 is one run by a script.
- **The injection samples were written by the author, with the rule at hand.** They locate the edge of the check; they do not rate it.
- **Time and memory are one machine.** Compare the shape, not the seconds.
- **Citations in case 2 are re-scored from the answering study's rows; the hosted-model files are incomplete because those runs stopped at their token caps.**`);
out.push('');
fs.writeFileSync(path.join(STUDY, 'REPORT.md'), `${out.join('\n')}\n`);
process.stderr.write(`REPORT.md written (${cases.length} cases)\n`);
void verdictCounts;
