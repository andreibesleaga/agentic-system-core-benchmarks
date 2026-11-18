# AgenticSystemCore benchmarks

Two measurement studies of AgenticSystemCore 1.1.0, run on 17 and 18 November 2026, with the harness, the questions, the raw rows and the generated reports. They let a reader check the figures on the project's benchmarks page (`docs/benchmarks` at [agenticsystemcore.com](https://agenticsystemcore.com/)) and run the studies again.

The harness, the questions and the reports were prepared with AI assistance and reviewed by the maintainer (Andrei N. Besleaga). The model that wrote the questions is named in the question file, and the hand check was done by the same model, not by an independent person.

Check the figures in one command, without a model, a network or an install:

```sh
node verify.js          # Node 18 or newer; prints each figure next to the page value; exit code 1 if any differs
```

## The two studies

**`answering/`: question answering.**
- Sixty questions about two small public nodes (50 and 14 items): 40 answered by one item, 10 by two, 10 not answered in the node.
- The same content reaches a model by four routes: plain pages, pages and `llms.txt`, the node's tools, and BM25 retrieval over the Markdown.
- A program scores each answer against facts written down before any run; a hand reading of 30 answers is recorded.
- Models: `qwen2.5-coder:7b` and `gemma3:4b` locally; `anthropic/claude-haiku-5.5` and `anthropic/claude-sonnet-5.5` through a hosted endpoint (both runs stopped at their token caps, so those rows are incomplete).
- Result in short: the node's tools beat the page routes; BM25 retrieval was as accurate and cheaper per answer. Details in `answering/REPORT.md`.

**`capabilities/`: fifteen cases.**
- Tamper detection, citation checkability, reproducible build, one source with many outputs, time to a first node, typed-link questions, cross-node questions, governed writes and injection samples, held-back content, scale, reading cost, export and import round trips, conformance with a second implementation, offline operation, and the graph read by independent RDF tools.
- Each case is one script that writes one file in `results/`; `src/report.js` writes the report from those files.
- Where an alternative has no mechanism (a Markdown folder has no digest to check), the report says "capability difference" and compares no accuracy.
- Only case 6 uses a model (the two local ones).
- Result in short: `capabilities/REPORT.md`, section 1; losses are listed there too (held-back drafts on the local tool server, subtle injection samples).

## Where each figure on the benchmarks page comes from

`verify.js` recomputes every row below that has an id and prints it next to the page value. `answering/results/*.jsonl` are the raw rows (one per question, route, model and seed); `capabilities/results/*.json` hold one file per case.

| Figure on the page | Recomputed from | Id |
|---|---|---|
| 97–98 % correct against 67–83 %; 15 to 31 points; 31 to 56 % fewer tokens | `answering/results/runs-anthropic_*.jsonl`: rows with `condition` C0, C1, C2, C3 and `kind` single or two; mean over questions of the mean over seeds of `scores.correct`; median of `prompt_tokens + completion_tokens` | A1–A8, B1–B3 |
| Table cells: percentages, 95 % intervals, tokens, 39 of 39 | the same rows; the intervals are the bootstrap in `answering/reports/summary.json`, which `node src/report.js` writes from the rows and `verify.js` checks against them | A1–A9 |
| Sonnet row: 40 and 39 of the 50 answerable questions | number of questions with rows for the route (`A*b`) | A5b–A8b |
| Local 7B model: 84.0 % with the node's results in one step, 94.0 % with retrieved passages, no tool loop by any route | `answering/results/runs-qwen2.5_coder_7b.jsonl`, conditions C2b, C3 and C0, C1, C2 | C1–C3 |
| Citation digest matched in 91.0 % (Haiku) and 54.7 % (local model) | the same files, condition C2b, `scores.verifiable` | D1, D2 |
| `read` returned matching digests for 50 of 50 items | `answering/results/nomodel.json`, `c2_read_digests_match_published` | D3 |
| Sixty questions: 40, 10, 10; retrieval holds every gold item for 50 of 50 | `answering/questions/questions.jsonl` (`kind`); `nomodel.json` (`recall5_C3_all_gold`) | E1–E3 |
| Hand reading of 30 answers agreed with the program on 30 | `answering/results/handcheck.jsonl` against the stored `scores` | F1 |
| 5 graphs, 3,941 statements; two RDF forms equal; all pass the SHACL shapes (609 shape statements); 3,648 queries, 0 failures; 8 of 10 questions run as written; 68 % shared vocabulary; ontology of 19, 19 and 22; rdflib 7.6.0 and pySHACL 0.40.2 | `capabilities/results/case15-semantics.json`: `nodes.*.nquads_statements`, `turtle_equals_nquads`, `shacl_conforms`, `questions[].ran/failed/needs_input`, `statements_by_vocabulary`, `ontology`, `shapes_statements`, `tools` | G1–G10 |
| 30 of 30 typed-link questions through `links`; 16 of 30 for the best local route; 71 items | `capabilities/results/c06-typed-link-questions.json`: `summary.G2_tool_server`, `summary.B1|B2 for qwen2.5-coder:7b`, `bundles[].items` | H1–H3 |
| 11 of 11 export and import pairs lost nothing | `capabilities/results/c12-round-trips.json`, `pairs[]` | I1 |
| Peer found in 4 requests; 8 of 8 attributions | `capabilities/results/c07-cross-node.json`, `starts.*.discovery_route` | J1, J2 |
| 33 of 33 changes to the 9 digest-listed files detected, by the engine and by Python | `capabilities/results/c01-tamper-detection.json`, `files_named_in_discovery_document`, `by_class["A named in discovery document"]` | K1, K2 |
| 323 of 323 and 237 of 237 files identical across two builds | `capabilities/results/c03-reproducible-build.json`, `nodes` | K3 |
| First node: 6 commands, 22 seconds, 4 files by hand | `capabilities/results/c05-time-to-first-node.json` | L1 |
| 323 files of 14 kinds in 2.4 seconds | `capabilities/results/c04-one-source-many-outputs.json`, `build` (the "other" bucket is not counted as a kind) | L2 |
| 0 source files changed in 20 attempts; 8 returned a proposal, 12 were refused with an error code | `capabilities/results/c08a-governance-writes.json`: `files_changed_in_bundle`, `propose` and `remember` (`proposal_returned`, `error_envelope`) | M1, M2 |
| 376 of 399 vectors pass, 0 fail; Python 115 pass, 0 fail on 7 areas; 40 of 40 damaged documents agree | `capabilities/results/c13-conformance-second-implementation.json` | N1–N3 |
| Offline: 11 of 11 operations | `capabilities/results/c14-offline.json` | O1 |
| At 5,000 items the tool server took 35 seconds to start | `capabilities/results/c10-scale.json`, `rows[items=5000].mcp_cold_start_ms` | P1 |
| The local tool server serves held-back drafts | `capabilities/results/c09-held-back-content.json` (counts only, no draft text) | Q1 |
| The injection check stops listed patterns and misses paraphrases | `capabilities/results/c08b-injection-lint.json`: 15 of 15 structural samples caught, 0 of 15 subtle | (not in `verify.js`) |
| Digests cover the machine files, not the HTML pages | `capabilities/results/c01-tamper-detection.json`, `by_class`: 0 of 235 damaged pages, per-item copies and other files caught | (not in `verify.js`) |
| Limits: eight tool calls, results cut to 3,500 characters, BM25 only, questions written by the project | `answering/src/config.js` (`LIMITS`), `answering/DECISIONS.md` items 11, 17; `questions.jsonl` field `author` | (stated, not computed) |

Figures on the page that come from the engine's own measurement record (`docs/MEASUREMENTS.md` in the engine repository), not from these studies, and so cannot be recomputed here: the scale table (the 500, 5,000 and 10,000 item rows and the 80, 8 and 2 ms call times), 530 of 536 equal tool calls, 250 pages with 0 accessibility violations, 108 of 108 seeded faults with 14 of 14 controls and 16 of 16 hostile discovery documents, the build under another time zone and locale (61 files), the thirteen digest-listed files of agenticsystemcore.com, and the hosting cost. Case 10 here measures scale as well, with other sizes and a different run: at 500 items 5.6 s and 304 MiB, at 5,000 items 44.0 s and 1,056 MiB.

## Inputs

The harness reads the engine at tag `v1.1.0` and the two built nodes. The engine and the main node are public repositories. The patterns node is kept in a private working copy, which also holds unpublished drafts; its published items are public in [andreibesleaga/agsc-demo-node](https://github.com/andreibesleaga/agsc-demo-node), and at commit `6bb5769` of that repository the card text is the text the studies used (later commits shorten and correct the cards). Checking the figures with `verify.js` needs none of them. The studies ran on the working copy; a re-run from the public copy has not been tried here, and one case (the held-back items) needs the drafts, which are not public.

| Input | Repository | Commit the studies ran at |
|---|---|---|
| Engine, tag `v1.1.0` (run `npm ci` in it) | [andreibesleaga/agentic-system-core](https://github.com/andreibesleaga/agentic-system-core) | `ec7a67ff7efa2aa42f83bb018596af37112384ea` (the commit of the tag) |
| Main node, agenticsystemcore.com | [andreibesleaga/AgenticSystemCore.com](https://github.com/andreibesleaga/AgenticSystemCore.com) | `5706b1ecb561ffc95cde87a1b52c401629454eba` (its `www/` holds 237 files; later commits add pages and change that number) |
| Patterns node, patterns.agenticsystemcore.com | `AgenticSystemCore-Patterns` (private working copy); published items: [andreibesleaga/agsc-demo-node](https://github.com/andreibesleaga/agsc-demo-node) at `6bb5769` | `22946dc3bcfe3cfb7846edcf938734fa3bc0fc0f` |

```sh
mkdir work && cd work
git clone https://github.com/andreibesleaga/agentic-system-core && git -C agentic-system-core checkout v1.1.0 && (cd agentic-system-core && npm ci)
git clone https://github.com/andreibesleaga/AgenticSystemCore.com && git -C AgenticSystemCore.com checkout 5706b1ecb561ffc95cde87a1b52c401629454eba
# the patterns node: a clone of its repository at 22946dc3bcfe3cfb7846edcf938734fa3bc0fc0f, named AgenticSystemCore-Patterns (not public)
git clone <this repository>      # next to the three folders above
```

By default the harness looks for the other folders next to this repository. Set `NODES_DIR` (the folder that holds `AgenticSystemCore.com` and `AgenticSystemCore-Patterns`) and `ENGINE_DIR` (the engine) to put them elsewhere, and `BENCH_SCRATCH` to move the scratch folder. `src/setup.sh` of each study warns if a node is at another commit.

The capabilities study read the source folder of the patterns node, including its unpublished drafts, for case 9 only; that case measures whether the local tool server serves them. This package holds counts for case 9 and no draft text.

## Re-run

| What | Command | Needs | Time |
|---|---|---|---|
| Check the page figures | `node verify.js` | Node 18+ | under 1 s |
| Rebuild one report from its rows | `cd answering && bash src/setup.sh && node src/report.js`, `cd capabilities && node src/report.js` | Node 22.13+, the inputs above (answering only) | seconds |
| Answering study, all local rows | `cd answering && bash run-all.sh` | the inputs, Ollama with `qwen2.5-coder:7b` and `gemma3:4b`, a 6 GB GPU | about 6.5 hours |
| Answering study, hosted rows | `cd answering && LLM_API_KEY=... bash paid-run.sh` | the inputs, a key, about 17 million tokens in all | hours; costs money |
| Capabilities study, all cases | `cd capabilities && bash run-all.sh` (`--no-model` skips case 6) | the inputs, Python 3, `rsync`, `unshare`; Ollama for case 6 | about 45 minutes |
| A smoke step with no model | `cd answering && bash src/setup.sh && node src/freeze.js --check && npm test && node src/nomodel.js` | the inputs | about 30 s |

The tests: `cd answering && npm test`, `cd capabilities && node --test tests/*.test.js`.

### What needs a paid key

Only the hosted-model rows of the answering study (`anthropic/claude-haiku-5.5`, `anthropic/claude-sonnet-5.5`). The environment variables:

| Variable | Meaning |
|---|---|
| `LLM_API_KEY` | the key of an OpenAI-compatible provider. Required by `answering/paid-run.sh`. Read from the environment only; no file is read for it. |
| `LLM_BASE_URL` | the provider's base URL; `paid-run.sh` defaults to `https://openrouter.ai/api/v1` |
| `LLM_TOKEN_BUDGET` | hard cap on prompt plus completion tokens for one process; the run stops with exit code 3 when it is reached |
| `BENCH_NUM_CTX` | context size in tokens for hosted runs (32768 in the reports) |

Everything else, including both reports and `verify.js`, runs without a key.

## Limits

- The project wrote the questions, with a language model, from the items' own text. That favours word-matching retrieval. No outside annotator wrote or checked a question.
- The corpora are small: 50 and 14 published items. Retrieval was BM25 only; no embedding search was tested.
- No outside grader: the program scores, and the hand check was done by the model that wrote the questions.
- Each answer was limited to eight tool calls, and tool results were cut to 3,500 characters, for every route.
- The two local models are small; the tool-loop rows measure the model's tool use at least as much as the node. The hosted rows stopped at their token caps (Haiku inside a third pass, Sonnet inside the first).
- The two nodes and the engine are by the same author. The typed-link results come from the engine's example Bundles, because the two public nodes use few link types.
- Time and memory figures come from one machine (an AMD Ryzen 7 laptop with a 6 GB GPU).
- `capabilities/run-all.sh` has not been run end to end in one pass; each case script was run on its own.
- These are the project's own measurements. No third party has repeated them.

## Clean-up of the rows

The raw rows were checked for private paths, keys and personal data before publication. None were found, so no row was changed. Excluded from this package: smoke runs, rows discarded after a harness fix (360 rows of one route, replaced by a re-run), the rows of an aborted first attempt, run logs, and scratch output. Case 9 keeps counts and drops the text of draft items. The injection samples in case 8 are synthetic text written for the test.

## Layout

```
README.md  NOTICE  LICENSE  LICENSE-DATA  LICENSES/  REUSE.toml
verify.js              the check above
answering/             harness, questions (with FROZEN.sha256), raw rows, REPORT.md, DECISIONS.md, run scripts
capabilities/          fifteen case scripts, results, REPORT.md, DECISIONS.md, run scripts
```

## Licence

Code and documents: Apache-2.0 (`LICENSE`). Data (questions, results, reports): CC BY 4.0 (`LICENSE-DATA`). Excerpts of node items inside the rows stay under that node's content terms. See `NOTICE`.
