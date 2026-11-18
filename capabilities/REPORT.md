# Capabilities study: what a node, or a part of it, offers

Run on 18 November 2026; every table is generated from the raw rows by `src/report.js` (case 15 was added later and is read from `results/case15-semantics.json`). The choices behind each case are in `DECISIONS.md`. Engine: tag 1.1.0. No model was called except two small local ones in case 6.

## 1. One-screen summary

The answering study measured question answering and found BM25 retrieval answered best and cheapest. This study measures other things: trust, governance, reuse, human use. 15 cases, each run by a script in `src/`. The cases are of two kinds. In a capability difference the alternative has no mechanism, so no accuracy is compared. In a win, tie or loss both sides did the same task.

- **1. Tamper and staleness detection.** 33 of 268 damaged files detected (Node and Python agree: 33). All 33 damaged files among the 9 the document names were caught; 0 of 235 damaged pages, per-item copies and other files were caught. Verdict: capability difference (partial coverage).
- **2. Citation checkability.** Node one-shot with digest (C2b): 50.8 percent (qwen2.5-coder:7b), 17.6 (gemma3:4b), 88.0 (Haiku) of correct answers cite a published digest of a passage that holds the facts. Verdict: capability difference (the node publishes the digests; the model must still copy one, which is what C2b asks).
- **3. Reproducible build.** 323 of 323 files identical (patterns), 237 of 237 (main); `agsc verify` passes on both. Verdict: tie on the property; the node covers far more artefacts.
- **4. One source, many outputs.** One build: 323 files in 14 kinds (7.1 MB, 2.4 s); then 23 more export commands write 560 files; 11 steering files for 11 coding tools have identical bytes (1 distinct content). Verdict: capability difference.
- **5. Time to first node.** 6 commands, 22.1 s (6.1 s without the npm install); 4 files written by hand (sourdough.md, hydration.md, oven-spring.md, .well-known/security.txt); 57 files built; 2 failed steps on the way. Verdict: cost only.
- **6. Typed-link questions.** Program using the node's `links` tool: 30 of 30 exact (the gold is read from the same graph; see limits). Verdict: capability difference (a program answers exactly; the best local model system gave 16 of 30).
- **7. Cross-node questions.** Peer found from both starts (4 requests, 293,015 bytes); both facts retrieved for 8 of 10; attribution correct for 8 of 8 retrieved. Verdict: tie on answers; capability difference in finding the peer (declared, checkable).
- **8. Governance: writes and injection.** Silent writes to the Bundle: 0 of 20 inputs; 8 proposals returned instead. Injection: 15 of 15 structural caught, 0 of 15 subtle caught; 1 of 10 controls flagged. Verdict: writes: capability difference. Injection: win on structural, loss on subtle.
- **9. Held-back content on the tool server.** Yes. `read` returned 103 of 103, `links` 103 of 103, `search` found 103 of 103 by title; `ask` cited a draft in 30 of 30 questions. Published surfaces carry 0. Verdict: loss (documented as intended for the author's own use).
- **10. Scale.** 5,000 items: build 44.0 s, peak 1,056 MB, output 169.9 MB; tool server cold start 34.8 s, search median 9.0 ms. Verdict: loss on speed and size; the node does more per build.
- **11. Agent reading cost.** Discovery route from a bare domain (document, chunk file, BM25 in the client): 5,103 bytes / 1,587 tokens in context, 266,558 bytes downloaded; node tool route: 7,062 / 1,976. Verdict: loss against BM25 passages with a local index (3.1 times the tokens); win against page routes (0.4 times the tokens of llms.txt plus page).
- **12. Round trips.** 11 of 11 pairs return every item and every body unchanged and every front-matter key equal; 0 do not; 0 did not run. The one change in every pair is a `source_version` stamp added to `prov` (70 of 70 items). Verdict: capability difference.
- **13. Conformance and a second implementation.** Engine level 3: 376 pass, 23 skipped, 0 fail of 399. Python runs 7 of the areas: 115 pass, 261 not run, 0 fail. The two agree on 40 of 40 damaged documents and both nodes. Verdict: capability difference.
- **14. Offline operation.** 11 of 11 operations pass with the network removed (an outbound connection fails inside it: ENETUNREACH). Verdict: tie.
- **15. The graph read by independent RDF tools.** 5 graphs, 3,941 statements: 5 of 5 Turtle and N-Quads forms equal; 5 of 5 conform to the shapes; 8 of 10 questions run as written, 3,648 queries run with 0 failures; 68 % of statements use a shared vocabulary. Verdict: capability difference.

**Losses reported:** case 8 (Governance: writes and injection); case 9 (Held-back content on the tool server); case 10 (Scale); case 11 (Agent reading cost).

## 2. Table

| # | Case | What was measured | Node result | Best alternative | Verdict | n |
|---|---|---|---|---|---|---|
| 1 | Tamper and staleness detection | Seeded damage to published files (one byte, one sentence, truncation, swapped file, stale file), checked from the discovery document with the engine checker and the Python package | 33 of 268 damaged files detected (Node and Python agree: 33). All 33 damaged files among the 9 the document names were caught; 0 of 235 damaged pages, per-item copies and other files were caught | Plain pages, llms.txt, BM25 index: no check exists, 0 of 268. A Markdown folder in git with a known-good commit: 60 of 60 | capability difference (partial coverage) | 268 |
| 2 | Citation checkability | Share of correct answers whose citation a program can check, down to the passage and its published digest (rows of the answering study, re-scored) | Node one-shot with digest (C2b): 50.8 percent (qwen2.5-coder:7b), 17.6 (gemma3:4b), 88.0 (Haiku) of correct answers cite a published digest of a passage that holds the facts | BM25 passages (C3): 0.0 / 0.0 / 0.0; it cites `slug#n` sections that a program can resolve (74.5 / 87.7 / 15.8) but with no digest to check bytes against | capability difference (the node publishes the digests; the model must still copy one, which is what C2b asks) | 126 / 125 / 108 correct answers |
| 3 | Reproducible build | Two builds of each node in clean copies; files compared by SHA-256 | 323 of 323 files identical (patterns), 237 of 237 (main); `agsc verify` passes on both | BM25 index over the same Markdown: 1 of 1 artefact identical (one file) | tie on the property; the node covers far more artefacts | 560 files |
| 4 | One source, many outputs | Artefacts written from one Bundle of 50 published items | One build: 323 files in 14 kinds (7.1 MB, 2.4 s); then 23 more export commands write 560 files; 11 steering files for 11 coding tools have identical bytes (1 distinct content) | Markdown folder: the folder itself. llms.txt: 1 file. BM25 index: 1 file | capability difference | 25 commands |
| 5 | Time to first node | The documented quick start from an empty folder (npm install, three notes, init, build) | 6 commands, 22.1 s (6.1 s without the npm install); 4 files written by hand (sourdough.md, hydration.md, oven-spring.md, .well-known/security.txt); 57 files built; 2 failed steps on the way | Not measured: a Markdown folder needs 0 commands but gives no site, index or graph, so there is no like-for-like time | cost only | 1 run |
| 6 | Typed-link questions | 30 questions on relations and 2 to 3 step paths over three Bundles with typed links (71 items); gold from the published graph | Program using the node's `links` tool: 30 of 30 exact (the gold is read from the same graph; see limits) | Local model with BM25 whole files or all files pasted: best 16 of 30 exact (qwen2.5-coder:7b, gemma3:4b) | capability difference (a program answers exactly; the best local model system gave 16 of 30) | 30 |
| 7 | Cross-node questions | 10 questions needing one fact from each node; the client starts from one node and must find the other and attribute each fact | Peer found from both starts (4 requests, 293,015 bytes); both facts retrieved for 8 of 10; attribution correct for 8 of 8 retrieved | Page crawl reaches the other host after 10 pages (from patterns) or 28 (from main); llms.txt names no peer; RAG over both folders retrieves both facts for 9 of 10 | tie on answers; capability difference in finding the peer (declared, checkable) | 10 |
| 8 | Governance: writes and injection | 28 calls to the 10 tools of `agsc mcp` (20 inputs to the two tools that prepare changes); 30 injection samples and 10 controls through `agsc lint` | Silent writes to the Bundle: 0 of 20 inputs; 8 proposals returned instead. Injection: 15 of 15 structural caught, 0 of 15 subtle caught; 1 of 10 controls flagged | No tool or scanner exists for a Markdown folder, a llms.txt or a RAG index. A five-line phrase search catches 4 of 15 structural and 2 of 15 subtle, 2 of 10 controls flagged | writes: capability difference. Injection: win on structural, loss on subtle | 20 + 30 |
| 9 | Held-back content on the tool server | Does `agsc mcp` at tag 1.1.0 serve 103 draft items of the patterns node? | Yes. `read` returned 103 of 103, `links` 103 of 103, `search` found 103 of 103 by title; `ask` cited a draft in 30 of 30 questions. Published surfaces carry 0 | A published-only copy serves 0 drafts. A folder of Markdown or an index over it serves whatever it holds | loss (documented as intended for the author's own use) | 103 |
| 10 | Scale | Synthetic Bundles of 50, 500, 2,000, 5,000 items: build time, peak memory, output size, tool-server cold start and search latency | 5,000 items: build 44.0 s, peak 1,056 MB, output 169.9 MB; tool server cold start 34.8 s, search median 9.0 ms | BM25 index in one process: index build 1,681 ms, query median 8.4 ms at 5,000 items | loss on speed and size; the node does more per build | 4 sizes x 3 runs |
| 11 | Agent reading cost | Median bytes and tokens in the prompt to reach one fact, by route, 50 answerable questions | Discovery route from a bare domain (document, chunk file, BM25 in the client): 5,103 bytes / 1,587 tokens in context, 266,558 bytes downloaded; node tool route: 7,062 / 1,976 | BM25 passages with the index already local: 2,210 / 508; llms.txt plus page: 16,068 / 3,627; crawl from the home page: 19,652 / 4,488 | loss against BM25 passages with a local index (3.1 times the tokens); win against page routes (0.4 times the tokens of llms.txt plus page) | 50 |
| 12 | Round trips | 11 export and import pairs the engine documents, run on the patterns node (70 published items) | 11 of 11 pairs return every item and every body unchanged and every front-matter key equal; 0 do not; 0 did not run. The one change in every pair is a `source_version` stamp added to `prov` (70 of 70 items) | Markdown folder to another tool: no exporter; an import is by hand. llms.txt and a BM25 index have no import | capability difference | 11 pairs |
| 13 | Conformance and a second implementation | Conformance vectors with the engine and with the Python package; agreement on discovery documents | Engine level 3: 376 pass, 23 skipped, 0 fail of 399. Python runs 7 of the areas: 115 pass, 261 not run, 0 fail. The two agree on 40 of 40 damaged documents and both nodes | A Markdown folder, llms.txt or a RAG index has no conformance vectors or checker to run | capability difference | 399 vectors; 40 damaged documents |
| 14 | Offline operation | Build, lint, verify, export, skills, checkers (Node and Python), conformance, tool server over stdio and over loopback HTTP, with the network removed | 11 of 11 operations pass with the network removed (an outbound connection fails inside it: ENETUNREACH) | BM25 index, Markdown folder, llms.txt: work offline too (no network is involved) | tie | 11 |
| 15 | The graph read by independent RDF tools | The graphs of the two nodes and the three example Bundles read with pyshacl 0.40.2 and rdflib 7.6.0: Turtle against N-Quads, the published SHACL shapes, the ten published SPARQL questions | 5 graphs, 3,941 statements: 5 of 5 Turtle and N-Quads forms equal; 5 of 5 conform to the shapes; 8 of 10 questions run as written, 3,648 queries run with 0 failures; 68 % of statements use a shared vocabulary | A Markdown folder, llms.txt or a BM25 index publishes no graph to read | capability difference | 5 graphs |

## 3. The cases

### Case 1. Tamper and staleness detection

**Method.** A copy of the built patterns site (324 files) is damaged one file at a time with a seeded generator (seed 20261118). Targets: all 9 files the discovery document gives a digest for, and 20 random files in each other class. Damage kinds: one byte changed, one sentence replaced, the last 10 percent cut off, two files of the same class swapped. After each damage the discovery document is checked at level 2 by the engine's checker and by the Python package from PyPI. Five stale files (a file taken from a build in which one item was changed) and one whole older site were tested separately.

| Class of file | Damaged | Caught by Node checker | Caught by Python package |
|---|---|---|---|
| A named in discovery document | 33 | 33 | 33 |
| B pages (html) | 80 | 0 | 0 |
| C per-item copies (md, jsonld) | 80 | 0 | 0 |
| D other site files | 75 | 0 | 0 |

**Stale and replaced.** Stale files from another build: 5 tested, all are in the class named by the document and are counted in the table above. A complete older site, served with its own older discovery document, passes the digest check (Node reports a failure: false; Python: false). The anchor check (`agsc-host verify-anchor`, with the anchor of the current build kept by the client) rejects the older site: true, and accepts the current site: true.

**Alternatives.** Plain pages, `llms.txt` and a BM25 index publish no digest, so a client with no earlier trusted copy has no way to detect any of the 268 cases (shown as 0 and labelled "no mechanism"). A Markdown folder in git is stronger than that: with a known-good commit it detected 60 of 60 damaged files (git `hash-object`, nothing written). That protects the holder of the repository; it does not give a reader of a remote site any check.

**What the numbers say.** The digests cover the machine files (the nine named files, which include `chunks.jsonl`, so every sentence of every item is covered there) and nothing else. The HTML pages, the per-item Markdown copies and the other files carry no digest in the discovery document, so damage to them goes unseen by this check. A client can compare a page with the chunk file itself, but no tool of the engine does that.

**Limits.** The damage is synthetic and made by one person. Detection by the checker needs the discovery document to be intact; a host that replaces the document and the files together is caught by an anchor held outside the host, and not by the digests. Python and Node agree on every case, but the Python package is a checker, not a second build engine (its README says so).

### Case 2. Citation checkability

**Method.** The rows of the answering study (`results/runs-*.jsonl`) were copied to scratch first. Row counts at copy time: runs-anthropic_claude_haiku_5.5.jsonl: 968; runs-anthropic_claude_sonnet_5.5.jsonl: 236; runs-gemma3_4b.jsonl: 540; runs-qwen2.5_coder_7b.jsonl: 1260. The hosted-model runs stopped at their token caps (see the answering study), so those files are incomplete; the numbers describe the rows present at the copy. For every correct answer to an answerable question three levels are counted by program, with no model judging: L1 names the item that holds the fact; L2 gives a locator that resolves to one passage (a published chunk id or digest, or the answering study's `slug#n` section); L3 gives a published digest of a passage that holds every fact of the question, and names the item.

| Model | Condition | Correct answers | L1 % | L2 % | L3 % |
|---|---|---|---|---|---|
| anthropic/claude-haiku-5.5 | C0 | 84 | 85.7 | 0.0 | 0.0 |
| anthropic/claude-haiku-5.5 | C1 | 90 | 92.2 | 0.0 | 0.0 |
| anthropic/claude-haiku-5.5 | C2 | 115 | 98.3 | 0.0 | 0.0 |
| anthropic/claude-haiku-5.5 | C2b | 108 | 98.1 | 98.1 | 88.0 |
| anthropic/claude-haiku-5.5 | C2u | 115 | 96.5 | 0.0 | 0.0 |
| anthropic/claude-haiku-5.5 | C3 | 114 | 97.4 | 15.8 | 0.0 |
| anthropic/claude-haiku-5.5 | C4 | 116 | 98.3 | 0.0 | 0.0 |
| anthropic/claude-sonnet-5.5 | C0 | 33 | 93.9 | 0.0 | 0.0 |
| anthropic/claude-sonnet-5.5 | C1 | 33 | 100.0 | 0.0 | 0.0 |
| anthropic/claude-sonnet-5.5 | C2 | 38 | 100.0 | 0.0 | 0.0 |
| anthropic/claude-sonnet-5.5 | C2b | 39 | 100.0 | 100.0 | 100.0 |
| anthropic/claude-sonnet-5.5 | C3 | 39 | 97.4 | 0.0 | 0.0 |
| anthropic/claude-sonnet-5.5 | C4 | 39 | 100.0 | 0.0 | 0.0 |
| gemma3:4b | C2b | 125 | 32.0 | 74.4 | 17.6 |
| gemma3:4b | C3 | 138 | 44.9 | 87.7 | 0.0 |
| gemma3:4b | C4 | 108 | 15.7 | 0.0 | 0.0 |
| qwen2.5-coder:7b | C2b | 126 | 65.1 | 90.5 | 50.8 |
| qwen2.5-coder:7b | C3 | 141 | 70.9 | 74.5 | 0.0 |
| qwen2.5-coder:7b | C4 | 109 | 35.8 | 0.0 | 0.0 |

Conditions with fewer than 20 correct answers are left out of the table (the tool loops of a 7B model almost never answered; see the answering study). C2b is the node's `read` tool with an instruction to write the digest beside the item; C3 is BM25 passages; C4 is the whole corpus pasted.

**What the numbers say.** The node publishes a digest for every passage; the alternatives measured here do not, so L3 is out of reach for them. Whether a model copies the digest is a model and prompt matter: the instruction in C2b asks for it. BM25 citations by `slug#n` resolve to a section, but the section numbering belongs to the answering study's own splitting code, not to anything the Markdown folder publishes.

**Limits.** A retrieval index could keep a digest per passage if its builder added one; the answering study's did not, so L3 for C3 is 0 by construction and says nothing about what retrieval could do. L3 proves that the cited passage exists unchanged and holds the facts; it does not prove the answer is a fair reading of it. Rows from the paid run are incomplete.

### Case 3. Reproducible build

**Method.** Each node is built twice in two clean copies with `SOURCE_DATE_EPOCH=1767225600`, and every output file is compared by SHA-256. Git history is part of the input, so the copies carry it. The patterns node is built with `agsc build` (2.6 s), the main node with its own pipeline (7.4 s). `agsc verify` (two builds and a comparison) was run on both: exit 0 and 0.

Patterns node: 323 of 323 files identical, 0 differ. Main node: 237 of 237 identical, 0 differ.

**What breaks it.** One change at a time against the patterns baseline:

| Change | Files identical | Files that differ |
|---|---|---|
| different build instant (SOURCE_DATE_EPOCH + 1 day) | 292 of 323 | 31 |
| different time zone (TZ=Asia/Tokyo) | 323 of 323 | 0 |
| different locale (LC_ALL=de_DE.UTF-8) | 323 of 323 | 0 |
| SOURCE_DATE_EPOCH set to empty (read as unset, warning AGSC-E603) | 292 of 323 | 31 |
| different folder path | 323 of 323 | 0 |

The build instant is an input, as the specification says (AGSC-04-09): changing it changes the files that carry a date (31 files), and an empty value is read as unset with a warning. The time zone, the locale and the folder path do not change any byte.

**The committed site against a fresh build.** 33 of 324 files of the committed `www/` differ from a fresh build of the same repository, because the working tree is newer than the commit and the site's pipeline adds files (for example `.well-known/sustainability-data`). That is a difference between two inputs, not a failure of the build.

**Alternative.** A BM25 index over the same Markdown serialised twice is byte-identical (1 file, 149,661 bytes). The Markdown folder has no build. Both are reproducible; the node reproduces 323 files of many kinds.

**Limits.** Two machines were not compared; the engine's own record does that. Builds that read the network are refused by the engine (AGSC-04-03), so none was tried.

### Case 4. One source, many outputs

**Method.** The patterns node (clusters=20, concepts=50, episodes=0, gates=0, lessons=0, procedures=0) is built once; each export verb and adapter is then run once in a clean copy and the files it adds are counted.

| Kind of file in the build | Files | Bytes |
|---|---|---|
| HTML pages | 125 | 987,505 |
| JSON-LD description of each item | 70 | 153,214 |
| Markdown copy of each item | 70 | 145,310 |
| skill packs (Agent Skills) | 22 | 92,500 |
| page scripts, styles, assets (client-side tools included) | 7 | 123,237 |
| in-browser tools (page tool scripts incl. WebMCP, graph explorer) | 6 | 219,235 |
| knowledge graph (JSON-LD, Turtle, N-Quads, context) | 5 | 829,522 |
| crawler and host files (robots, sitemap, headers, redirects) | 4 | 21,515 |
| other | 4 | 4,420,191 |
| text for language models (llms.txt, llms-full.txt, now.md) | 3 | 85,123 |
| other .well-known files | 2 | 354 |
| chunks for retrieval (JSONL, TOON) | 2 | 292,388 |
| discovery document (linkset) | 1 | 2,840 |
| ledger | 1 | 6,936 |
| search index | 1 | 58,119 |

Total: 323 files, 7,437,989 bytes, 2.4 s. The tool server (`agsc mcp`) serves 10 tools from the same Bundle without writing a file (counted in case 8). The built pages also carry in-browser tool scripts (the page tools and WebMCP registration are in the "in-browser tools" row).

| Command | Result | Files added | Bytes | Time |
|---|---|---|---|---|
| `agsc export --steer` | ok | 2 | 24,564 | 1.3 s |
| `agsc export --steer --target agents,aider,claude,cline,codex,copilot,cursor...` | ok | 11 | 135,102 | 1.2 s |
| `agsc export --markdown` | ok | 72 | 157,616 | 1.6 s |
| `agsc export --okf` | ok | 73 | 159,949 | 1.7 s |
| `agsc export --jsonld` | ok | 1 | 134,524 | 2.2 s |
| `agsc export --jsonl` | ok | 1 | 153,214 | 2.2 s |
| `agsc export --skos` | ok | 1 | 53,731 | 2.4 s |
| `agsc export --closure` | ok | 1 | 36,695 | 2.4 s |
| `agsc export --to cogx` | ok | 5 | 600,026 | 1.3 s |
| `agsc export --to gabbe` | ok | 71 | 321,008 | 1.4 s |
| `agsc export --to mermaid` | ok | 90 | 75,386 | 1.2 s |
| `agsc export --to mem0` | ok | 1 | 324,069 | 1.2 s |
| `agsc export --to letta` | ok | 1 | 309,894 | 1.3 s |
| `agsc export --to zep` | ok | 1 | 313,182 | 1.3 s |
| `agsc export --to csv` | ok | 2 | 266,101 | 1.3 s |
| `agsc export --to basic-memory` | ok | 70 | 341,539 | 1.3 s |
| `agsc export --to claude-code` | ok | 71 | 351,112 | 1.3 s |
| `agsc export --to skills` | ok | 20 | 305,798 | 1.4 s |
| `agsc export --to llm-context` | ok | 2 | 127,093 | 1.3 s |
| `agsc export --to board` | exit 2 | 0 | 0 | 1.2 s |
| `agsc skills` | ok | 21 | 87,022 | 1.3 s |
| `agsc skills --zip` | ok | 22 | 176,516 | 1.4 s |
| `agsc compose augmented-llm agents-as-tools --zip` | ok | 9 | 20,378 | 1.3 s |
| `agsc compose augmented-llm agents-as-tools --brief` | ok | 12 | 19,677 | 1.3 s |

**Steering files.** `export --steer` with all 11 targets wrote 11 files of 12,282 bytes each; every file has the same bytes.

**Failures.** `agsc export --to board` exited 2: export: fail (1 error, 0 warn). (`--to board` expects a board format and live board items; the patterns node has none.)

**What the alternatives give.** A Markdown folder is the source and nothing more. An `llms.txt` is one file. A BM25 or vector index is one artefact. None of them writes the other kinds. Whether a user wants those kinds is a separate question: the case shows breadth, not value.

**Limits.** "Kinds" is the author's grouping of file names (the rules are in `src/c04-one-source-many-outputs.js`). A file counted as an output may not be useful to a given reader. The export commands were run with default flags.

### Case 5. Time to first node

**Method.** The commands of `docs/guides/mode-0.md` were run from an empty folder in scratch with the published npm package (version 1.1.0). The guide's `git init` and `git commit` were replaced by `SOURCE_DATE_EPOCH` (the guide names it as the alternative; this study runs no git write command). A person who builds straight after `init` was also simulated, to meet the errors.

6 commands in 22.1 s (npm install 16.1 s). Files written by hand: sourdough.md, hydration.md, oven-spring.md, .well-known/security.txt. The build wrote 57 files. It includes the chunk file, and the discovery document.

**Steps that failed:** "agsc build straight after init (no security contact, no build instant)"; "agsc build without a build instant (not a git repository)".

**Every error and "before you build" line met** (warnings are left out; they are in the results file):

| Step | Message | Does it say what to do? (the author's reading) |
|---|---|---|
| agsc init | before you build: add .well-known/security.txt with a Contact: line (RFC 9116); lint, build and ci report AGSC-E901 until it exists (AGSC-06-36) | yes: says what to add or edit |
| agsc init | before you build: agsc.config.json names the reference crawler list in site.tdm_crawlers, because the default prose licence adopts the Content Use Terms; edit the list, or name another prose licence to publish no reservation (AGSC... | yes: says what to add or edit |
| agsc build straight after init (no security contact, no build instant) | error: AGSC-E901 no .well-known/security.txt in the Bundle root, so the published one would carry no Contact: field — RFC 9116 section 2.5.3 says "This field MUST always be present in a 'security.txt' file". Nothing is emitted for... | partly: names the missing file and says nothing is emitted; the earlier line from init said to add it |
| agsc build without a build instant (not a git repository) | error: AGSC-E204 the build instant defaulted to 1970-01-01T00:00:00Z, because this build had no SOURCE_DATE_EPOCH and no git history (AGSC-04-09), so the derived Expires would be 1970-12-31T00:00:00Z — a security contact that expi... | yes: says to commit once, set SOURCE_DATE_EPOCH, or author an Expires |

**The node's own checker on the result.** The discovery document of this quick-start node fails the checker at level 2 (exit 1: validate-wellknown fail (level 2): 1 input file(s) read, 1 error(s), 0 warning(s)), because `site.base` is still the placeholder `http://localhost/`. `agsc build` and `agsc ci` both pass with a warning that says to set it. A node is not publishable before that change, and the guide says so.

**Limits.** One run on one machine. Time includes the registry download (16.1 s), which varies. "Does it say what to do" is the author's reading of the full message, not a measurement. The alternative has no comparable time: a folder of notes is already there, but it is not a site.

### Case 6. Typed-link questions

**Method.** The two published nodes use only the `related` key, so they cannot hold a question about "requires" or "decided-by". The questions use the engine's three worked blueprint Bundles (`examples/blueprints/`: engine 32 items, tool-server 22 items, linked-sites 17 items), which use `requires`, `uses`, `verifies` and `decided-by`. They are example Bundles written by the project, not live nodes. 30 questions were generated from the graph by a seeded script (direct, inverse, two-step, three-step, verifies, decided-by). **Gold comes from `graph.nq` of each build, the published graph.** A system that reads that graph, or the node's tools over it, agrees with the gold by construction in part; for those systems this case shows what a program can do with a node, not an accuracy contest.

Systems. G1: the graph file read by a program (this is the gold source). G2: a program that calls the tool server's `links` tool and follows the edges (independent code path, no model). B1 and B2: BM25 (MiniSearch) over the whole raw Markdown files with front matter, top 5 files, then a local model (qwen2.5-coder:7b and gemma3:4b, temperature 0, seed 1, 16384-token context); B2 adds the subject's slug to the query, the best fair shot for retrieval. W: every raw file of the Bundle pasted into the prompt.

| System | Exact set correct | Precision / recall % |
|---|---|---|
| G1 published graph read by a program (the gold source) | 30 of 30 | n/a |
| G2 `links` tool calls by a program (no model) | 30 of 30 | 100.0 / 100.0 |
| B1 BM25 top 5 whole files (question text), qwen2.5-coder:7b | 16 of 30 | 82.2 / 72.5 |
| B2 BM25 top 5 whole files (question text plus subject slug), qwen2.5-coder:7b | 16 of 30 | 83.9 / 76.4 |
| W all files pasted, qwen2.5-coder:7b | 9 of 30 | 58.7 / 55.5 |
| B1 BM25 top 5 whole files (question text), gemma3:4b | 11 of 30 | 72.7 / 73.0 |
| B2 BM25 top 5 whole files (question text plus subject slug), gemma3:4b | 10 of 30 | 73.8 / 80.8 |
| W all files pasted, gemma3:4b | 9 of 30 | 55.1 / 59.7 |

| Question type | n | G2 exact | B1/B2/W exact per model (qwen2.5-coder:7b ; gemma3:4b) |
|---|---|---|---|
| direct | 8 | 8 | 8/7/7 ; 6/6/6 |
| inverse | 8 | 8 | 4/5/0 ; 2/3/0 |
| two-step | 6 | 6 | 0/0/0 ; 0/0/0 |
| closure-3 | 4 | 4 | 0/0/0 ; 0/0/1 |
| verifies | 2 | 2 | 2/2/2 ; 2/1/1 |
| decided-by | 2 | 2 | 2/2/0 ; 1/0/1 |

**What the numbers say.** The tool route returns the exact set for every question; so does the graph file, since it is the source of the gold. The small local models did not answer most questions exactly when they had to read prose and front matter (best 16 of 30). A person could write the same graph walk over the Markdown front matter; the point is that the node publishes the edges, including the computed inverses, so no one has to.

**Limits.** Circular gold (above). Three Bundles written by the project, not third-party data. Two small local models, one seed, no tool-using model. The retrieval systems take one retrieval step; an agent that searched again for each step of a path was not tested, and it might do better on the two-step and three-step questions than the single step shown here. The question wording is templated. The "exact set" score is strict: one extra or missing item is a miss; precision and recall are shown for that reason.

### Case 7. Cross-node questions

**Method.** Ten questions, each with one fact in each node (every fact was checked against the published text before the run). No network: host names are mapped to the two build folders. Route A starts at one node's address, reads `/.well-known/knowledge-linkset`, follows the `peer` relation, reads each node's chunk surface, ranks the merged chunks with BM25 (top 6) and attributes each hit by the host of the chunk's IRI. Route B crawls HTML pages from the start page until a page of the other host appears. Route C checks whether the start node's `llms.txt` names the other host. The control is a BM25 index over the raw Markdown of both folders, with the file path as source label.

| Start | Peer found by discovery | Requests and bytes | Both facts in top 6 | Attribution right | Page crawl to other host | llms.txt names other host |
|---|---|---|---|---|---|---|
| patterns | true | 4 / 293,015 | 8 of 10 | 8 of 8 | 10 pages, 128,524 bytes | false |
| main | true | 4 / 293,015 | 8 of 10 | 8 of 8 | 28 pages, 652,992 bytes | false |

The engine's mutual check of the two documents (`validate-wellknown --peer`) passes: pass.

**What the numbers say.** The discovery document names the peer as a peer, and the two documents check each other. Plain pages also lead to the other site by ordinary links, at the cost of 10 to 28 pages here, with nothing that says the other site is a peer. Retrieval and attribution are a tie: the control, a BM25 index over both folders, retrieves both facts for 9 of 10, the discovery route for 8. Attribution by IRI host is correct for every retrieved fact, and path labels do the same in the control.

**Limits.** Two nodes by the same author, linked by design. Hosts mapped to local folders, so there is no network test. Ten questions written by the author with the facts known. The control knows both folders exist; nothing in a folder says so.

### Case 8. Governance: writes and injection

**Part A: writes.** All ten tools of `agsc mcp` were called (28 calls): `propose` and `remember` with 10 inputs each, including a missing item, path-like slugs, a 5,000-character slug, a NUL byte, an unknown kind, a body with front matter inside it, and a body that tells the reader to ignore its instructions; and one call to each of the other eight tools. The whole Bundle folder, git data included, was hashed before and after.

- Files changed, added or removed: **0**.
- `propose`: 2 proposals returned, 8 refused with an error code (AGSC-E301 for the six slugs that name no item, AGSC-E203 for the two inputs that set a task state).
- `remember`: 6 proposals returned, 4 refused (AGSC-E003 for the two calls with no operator, AGSC-E203 for the two comments; the messages are in the results file).
- Every proposal returned is marked `origin: ai-generated` (6 of 8) and carries findings that ask for the agent and the model (6 with findings). Paths stay inside `content/` (0 outside). The title `../../../escape` became `content/concepts/escape.md`.
- The injection text in a `remember` body was **not flagged** at proposal stage. It would be flagged by `agsc lint` when the proposed file is checked, which part B measures.
- The other eight tools all answered (8 of 8).

**Part B: injection.** 30 samples written for this study (by the author, knowing the rule): 15 structural (a listed phrase, an HTML comment, zero-width characters, Unicode tag characters, bidirectional controls, a long base64 or hex run, a `javascript:` or `data:` link, a fenced "system prompt") and 15 subtle (a polite paraphrase, extra spaces or a line break inside the listed phrase, a digit for a letter, a Cyrillic letter, French and German versions, an instruction aimed at "assistants", a request to fetch and obey another page). 10 harmless controls were run beside them. Each text was placed in one item of a small Bundle and `agsc lint --json` was run.

| Group | n | Engine lint (codes AGSC-E401, E402) | Five-line phrase search |
|---|---|---|---|
| structural | 15 | 15 caught | 4 caught |
| subtle | 15 | 0 caught | 2 caught |
| harmless controls flagged | 10 | 1 | 2 |

Findings for a human-authored item are severities: warn (an item with `prov.agent` set gets an error instead; AGSC-08-13). Missed samples: u01, u02, u03, u04, u05, u06, u07, u08, u09, u10, u11, u12, u13, u14, u15.

**What the numbers say.** The tool server wrote nothing in 20 hostile and ordinary inputs, and returned each change as a reviewable payload. The lint catches what its rule lists, by design (AGSC-08-19 says it proves nothing about a novel injection); it catches none of the 15 subtle samples, and a whitespace-tolerant phrase search catches 2 of them. One harmless control ("you are now expected to...") was flagged by both.

**Limits.** The samples were written knowing the rule; the subtle half sits outside it on purpose. The numbers show where the boundary is, not a score for the product. A model that reads the text is outside this case. The alternatives have no writing tool to compare in part A: a folder of Markdown is written by whatever edits it.

### Case 9. Held-back content on the tool server

**Method.** The full copy of the patterns repository (drafts present) was served by `agsc mcp`. Every one of the 103 held-back items (all with `status: draft`) was requested through `read`, `links` and `search` (by its title); `ask` was asked about the first 30. The built site's published surfaces (`llms.txt`, `llms-full.txt`, `chunks.jsonl`, the three graph files, the sitemap) were searched for the IRI of every held-back item. The control is the published-only copy the answering study used.

- `read`: 103 of 103 drafts returned. `links`: 103. `search`: 103. `ask`: cited a draft in 30 of 30.
- The result marks the status: 103 of 103 returned items show `status: draft` in their text.
- The tool server lists 72 resources and 10 tools.
- Published surfaces carrying a held-back item: 0. The published node holds back what it says it holds back.
- Control (published-only copy): 0 drafts readable.

**This confirms the answering study's finding at tag 1.1.0, and it is a loss for a person who wants one server to be safe for a public audience.** The specification says the local tool server is the author's own tool over the author's Bundle and reads drafts (spec/00-overview.md AGSC-00-05 and spec/01-bundle.md AGSC-01-26: the local tool server is the author’s own tool over the author’s Bundle and reads drafts; it is not a published surface.). The risk is for someone who exposes `agsc mcp --http` (loopback only by design) or hands its output to an agent that others use, believing it serves the published set. The way to get the published set is to serve a folder that holds only published items, as the answering study did.

**Limits.** One node with 103 drafts. The check of published surfaces looks for item IRIs; text of a draft quoted inside a published item is not detected.

### Case 10. Scale

**Method.** Synthetic Bundles from the engine's own generator (`bench/gen-bundle.js`; deterministic, valid per the schema, output a function of the item count). Build: `agsc build` run 3 times per size, median wall time, peak memory from GNU `time -v`. Search: the tool server's `search`, median of 30 queries made of words from the generated items (seeded). Cold start: spawn to first answer. Baseline: MiniSearch BM25 over the same Markdown files in one Node process. Machine: AMD Ryzen 7 5800H with Radeon Graphics, 16 threads, 31 GB.

| Items | Build (median) | Peak memory | Output | Tool server cold start | Tool server search | BM25 query |
|---|---|---|---|---|---|---|
| 50 | 1.9 s | 136 MB | 6.3 MB, 205 files | 2.0 s | 2.1 ms (p95 4.1) | 0.2 ms; index 36 ms |
| 500 | 5.6 s | 304 MB | 21.1 MB, 1,559 files | 4.5 s | 2.8 ms (p95 4.5) | 0.9 ms; index 197 ms |
| 2,000 | 16.5 s | 630 MB | 70.7 MB, 6,077 files | 13.9 s | 5.9 ms (p95 8.4) | 3.7 ms; index 686 ms |
| 5,000 | 44.0 s | 1,056 MB | 169.9 MB, 15,113 files | 34.8 s | 9.0 ms (p95 13.7) | 8.4 ms; index 1,681 ms |

**What the numbers say.** The node builds a site, graph, chunks and many other files; the baseline builds one in-memory index, so the two are not doing the same work and the baseline is faster at every size. What matters for a reader is whether the node stays usable: every size built; the largest build is 44.0 s and 1,056 MB.

**Limits.** Synthetic text from a fixed word list, not real prose. One machine. The page-side search (the browser index) was not measured. At more than 500 items the engine shards its indexes (AGSC-06-21 and AGSC-06-31); the sizes above cross that bound.

### Case 11. Agent reading cost

**Method.** Routes C0 to C4 and the two floors come unchanged from the answering study's `results/nomodel.json` (no model; copied before reading). Route D is new: an agent that knows only the domain reads the discovery document, takes the chunk surface it names, ranks the published chunks with BM25 in its own code, and puts the top 5 chunks in the prompt. "In context" is what a model reads; "downloaded" is what the client fetches.

| Route | Bytes in context (median) | Tokens in context (median) | Bytes downloaded | n |
|---|---|---|---|---|
| C0 crawl pages from the home page to the page | 19,652 | 4,488 |  | 50 |
| C1 llms.txt plus the gold page | 16,068 | 3,627 |  | 50 |
| C2 node tools: search plus read (capped as served) | 7,062 | 1,976 |  | 50 |
| C3 BM25 top 5 passages, index already local | 2,210 | 508 |  | 50 |
| C4 whole corpus pasted | 31,034 | 6,667 |  | 50 |
| D discovery route from a bare domain (document + BM25 top 5 chunks of the published chunk file) | 5,103 | 1,587 | 266,558 | 50 |
| floor: the gold page only | 3,662 | 875 |  | 50 |
| floor: the gold chunk only | 444 | 99 |  | 50 |

Route D found a chunk set that held the facts and the gold items for 50 of 50 questions (first-study recall for C3: 50 of 50).

**What the numbers say.** Starting from a bare domain, the discovery route puts 1,587 tokens in the prompt, 3.1 times what BM25 passages with a local index need (508); the discovery document alone is 2,840 bytes of the 5,103. The route also downloads the whole chunk file (266,558 bytes) because the client has no index yet. It is well below the page routes (3,627 tokens for llms.txt plus the page, 4,488 for a crawl). The node's tool route is 1,976 tokens; the answering study traced that to the envelope of chunk metadata around each answer. Without the document (a client can parse it in code and keep it out of the prompt) the chunk text is 2,263 bytes, against 2,210 for the answering study's BM25 passages.

**Limits.** Tokens use the o200k vocabulary, as in the answering study. The numbers are costs of reaching a fact, not of getting it right. The answering study's C2 numbers used a 3,500-character cap per tool result.

### Case 12. Round trips

**Method.** Each pair: export from the full patterns Bundle, import into an empty Bundle that has only the configuration file, then compare the published items: every front-matter key (parsed with PyYAML, so quoting style does not count) and the body (bytes equal). Compared over the published items only. Lost keys are named per pair. Mermaid, steering and SKOS exports have no import of the same shape: SKOS imports draft items from a thesaurus, steering files are one-way; they are not pairs.

| Pair | Items back | Front-matter keys | Bodies identical | Keys lost or changed (names) |
|---|---|---|---|---|
| Markdown (byte-preserving) -> okf import | 70 of 70 | 1096 kept, 0 lost | 70 |  |
| Markdown export -> okf import (the folder is the same layout) | 70 of 70 | 1096 kept, 0 lost | 70 |  |
| mem0 export -> mem0 import | 70 of 70 | 1096 kept, 0 lost | 70 |  |
| letta export -> letta import | 70 of 70 | 1096 kept, 0 lost | 70 |  |
| zep export -> zep import | 70 of 70 | 1096 kept, 0 lost | 70 |  |
| csv export -> csv import | 70 of 70 | 1096 kept, 0 lost | 70 |  |
| basic-memory export -> basic-memory import | 70 of 70 | 1096 kept, 0 lost | 70 |  |
| claude-code export -> claude-code import | 70 of 70 | 1096 kept, 0 lost | 70 |  |
| cogx export -> cogx import | 70 of 70 | 1096 kept, 0 lost | 70 |  |
| gabbe export -> gabbe import | 70 of 70 | 1096 kept, 0 lost | 70 |  |
| skills export -> skills import | 70 of 70 | 1096 kept, 0 lost | 70 |  |

"Kept" counts a `prov` block that differs from the source only by an added `source_version` (where the item came from); 70 items per pair.

**What the numbers say.** Every pair that ran gave back every item and body, and every key except the stamp. This is a round trip of the engine's own export. The Markdown exports are lossless by rule (AGSC-01-26); for the memory and agent-kit adapters the result shows what the current code does for its own output.

**Limits.** A file written by another tool, with its own fields, was not tested: that is where fields would be lost, and the engine's import has rules for it (AGSC-01-22). "Kept" compares top-level keys as parsed data, not as text. Steering, Mermaid and SKOS are not pairs.

### Case 13. Conformance and a second implementation

**Method.** `agsc conform --level 0..3` runs the engine's vectors in a built Bundle copy. The Python package (from PyPI) runs the vectors of the areas it implements (`run-vectors`) and names the rest as not run. Agreement: both checkers read the discovery documents of both nodes at levels 0 to 3, then 40 seeded damaged copies of the patterns document (changed digest, removed digest, http anchor, unregistered relation, extra whitespace, changed counts, changed bundle hash, truncated JSON, removed target) at level 2.

| Level | Engine: pass / skip / fail | Python: pass / skip / not run / fail |
|---|---|---|
| 0 | 35 / 2 / 0 | 35 / 2 / 0 / 0 |
| 1 | 113 / 3 / 0 | 62 / 3 / 51 / 0 |
| 2 | 266 / 18 / 0 | 115 / 18 / 151 / 0 |
| 3 | 376 / 23 / 0 | 115 / 23 / 261 / 0 |

- Python areas run: build, discovery, frontmatter, graph, jcs, links, slug. Not run: adopt, boards, boundary, bundle, chunks, cli, compose, conform, export, import, ledger, lint, prov.
- Vector files checked by the Node tool: validate-vectors: 399 input file(s) read, 399 vectors, 0 error, 0 warn; declared areas with no vector file (informational, AGSC-09-90): skills adapters channels harness run; by Python: exit 0.
- Real nodes: both checkers agree at all four levels on both nodes (patterns: 4 of 4; main: 4 of 4).
- Damaged documents: same verdict on 40 of 40, same error codes on 40 of 40; both rejected 40.

**What the numbers say.** The vectors pass on the engine, and a second implementation, small and with no dependency, agrees with it on every document tried. The second implementation covers 7 areas and 115 of 399 vectors; its README says it is not a second engine.

**Limits.** The Python package and the engine are by the same author, so agreement shows consistency, not independence. The 40 damaged documents were chosen by the author. "Not run" is not a pass.

### Case 14. Offline operation

**Method.** The operations ran inside `unshare -rn` (a new user and network namespace with no interface up). A connection to a public address from inside failed with ENETUNREACH. Only the loopback device was brought up, for the tool server's HTTP transport.

| Operation | Result | Time |
|---|---|---|
| agsc build | ok | 2.4 s |
| agsc lint | ok | 1.5 s |
| agsc verify (two builds compared) | ok | 4.2 s |
| agsc export --steer | ok | 1.2 s |
| agsc skills | ok | 1.2 s |
| validate-wellknown level 2 (Node) | ok | 0.1 s |
| validate-wellknown level 2 (Python) | ok | 0.1 s |
| agsc conform --level 0 | ok | 1.2 s |
| agsc mcp (stdio): start, search, read, links | ok | 2.9 s |
| agsc mcp --http on loopback: tools/list | ok |  |
| search.json readable and non-empty (page search is client-side) | ok |  |

**What the numbers say.** Nothing in this list needs the network. The engine refuses network access in a build by rule (AGSC-04-03). The alternatives do not need it either, so this is a tie; it matters as a property a user may want to know, not as an advantage.

**Limits.** Install is not offline (npm needs the registry); not tested here. The browser pages were not opened.

### Case 15. The graph read by independent RDF tools

**Method.** `src/case15_semantics.py` reads `graph.ttl` and `graph.nq` of each build with rdflib and pySHACL, tools that share no code with the engine. The JSON-LD form is not parsed (its context is a remote document and no network is used). The ten questions are the published SPARQL queries (`docs/ontology-questions.json`); each runs once for each subject of the graph. Two of them take a selection of items as input and are not run. The ontology has 19 classes, 19 object properties and 22 datatype properties (318 statements); the shapes file has 609. This case was added after the other fourteen; `results/case15-semantics.json` holds its rows.

| Graph | Statements | Turtle and N-Quads | SHACL shapes | Queries run |
|---|---|---|---|---|
| example-engine | 569 | equal | conforms | 648 |
| example-linked-sites | 292 | equal | conforms | 328 |
| example-tool-server | 350 | equal | conforms | 416 |
| main | 377 | equal | conforms | 456 |
| patterns | 2,353 | equal | conforms | 1,800 |

Statements by vocabulary, all graphs: Dublin Core 992; OWL 1; RDF 458; RDFS 9; SKOS 900; other 2; own 1,252; schema.org 327.

**What the numbers say.** The published graphs parse and validate with libraries the project did not write, and the published questions run on them without a failure. Many questions return no answer on a given graph because the graph holds no such link; `answered` in the results file counts the ones that do.

**Limits.** A statement counts as "shared" when its property comes from Dublin Core, SKOS, PROV, RDF, RDFS, schema.org or OWL; the rest use the project's own terms. Passing the shapes shows the graph follows the project's own constraints, not that its meanings are right. The two independent tools were chosen by the project.

## 4. What this does not show

- **It does not show the node is better at answering questions.** The answering study's result stands. Where this study reports a win it is for a property the node publishes (digests, typed links, a discovery document, governance of writes), not for answer quality.
- **A capability difference is not a score.** When the alternative has no mechanism, the comparison is 0 by construction. Whether anyone needs the mechanism is a separate question; the cases show that it exists and works.
- **Gold in case 6 comes from the graph it tests.** The program systems agree with it in part by construction. The model systems are where an accuracy comparison exists.
- **Two nodes, one author, one engine.** Both nodes were built by the engine's author with the engine's own conventions. Nothing here shows what a third party would find.
- **Small corpora.** 50 and 14 published items; three blueprint Bundles of 71 items; synthetic Bundles up to 5,000 items made from a word list.
- **No embedding or vector index.** Every "RAG" here is BM25. No remote model was called; the models used were two small local ones.
- **No user study.** Nothing here measures whether a person finds the node easier to use, only what the files and tools do. Case 5 is one run by a script.
- **The injection samples were written by the author, with the rule at hand.** They locate the edge of the check; they do not rate it.
- **Time and memory are one machine.** Compare the shape, not the seconds.
- **Citations in case 2 are re-scored from the answering study's rows; the hosted-model files are incomplete because those runs stopped at their token caps.**

