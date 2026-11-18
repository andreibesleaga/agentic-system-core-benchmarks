# Capabilities study, November 2026

What does an AgenticSystemCore node, or one of its parts, offer that a folder of Markdown, an `llms.txt` or a retrieval index does not? The answering study (`../answering/`) measured question answering and found plain BM25 retrieval answered best. This study measures the other things the system was built for: trust, governance, reuse, human use. Fifteen cases, one script each. Start with `REPORT.md`; the choices behind each case are in `DECISIONS.md`.

## Re-run everything

```sh
cd capabilities
bash run-all.sh              # all 15 cases, then REPORT.md (about 45 minutes)
bash run-all.sh --no-model   # case 6 without the local models
```

The script sets up the scratch folder, runs the tests, runs each case and rebuilds the report. Case 10 (scale) must run alone: it measures time and memory. Nothing is written outside this folder and the scratch folder. `run-all.sh` has not been run end to end in one pass; each case script was run in its final form on its own (DECISIONS 24).

To rebuild only the report from the existing results: `node src/report.js`.

Case 2 re-reads the rows of the answering study. The recorded `results/c02-citation-checkability.json` was made from the complete rows now in `../answering/results/`; its file records the row counts it read.

## Requirements

- Linux, Node 22.13 or newer (the reference run used 24.18), Python 3 with PyYAML, `rsync`, `npm`, `/usr/bin/time`, and `unshare` with user namespaces (case 14).
- The network is used once by `src/setup.sh`: `npm install` of three libraries into the scratch folder, `pip install` of `agentic-system-core`, `rdflib==7.6.0` and `pyshacl==0.40.2` into a scratch virtual environment, and `npm install agentic-system-core` in case 5. Nothing else uses it.
- Ollama on `127.0.0.1:11434` with `qwen2.5-coder:7b` and `gemma3:4b` (case 6 only; start it with `ollama serve`). No remote model is used.
- The engine at tag `v1.1.0` with `npm ci` run in it, and clones of the two node repositories (with their git history) at the commits named in `../README.md`. Set `ENGINE_DIR` and `NODES_DIR` if they are not next to this repository. `src/setup.sh` copies them to scratch.
- `BENCH_SCRATCH`: scratch folder (default `${TMPDIR:-/tmp}/agsc-benchmarks/capabilities`). Use a different folder from the answering study.
- Fixed inputs: `SOURCE_DATE_EPOCH=1767225600`, seed 20261118 unless a case says otherwise.

Case 9 serves the full source folder of the patterns node, drafts included, to the local tool server; that is what the case measures. The results hold counts only, no draft text.

## Layout

| Path | What |
|---|---|
| `src/setup.sh` | copies the engine, nodes and libraries to scratch; makes the Python virtual environment |
| `src/c01-tamper-detection.js` ... `src/c14-offline.js` | one script per case (case 8 has two parts, `c08a` and `c08b`; `c14-offline-inner.js` runs inside the network-less namespace) |
| `src/case15_semantics.py`, `src/c15-semantics.sh` | case 15: the published graphs read with rdflib and pySHACL; the shell script gives the arguments |
| `src/shared/` | `config.js`, `lib.js` (results, shell, seeded generator, tool-server client), `fm.py`, and copies of the answering study's `corpus.js`, `retrieval.js`, `scorer.js`, `stats.js`, `llm.js` |
| `src/report.js` | writes `REPORT.md` from `results/*.json`; every number comes from a results file |
| `results/*.json` | one file per case, with the rows behind each number |
| `tests/` | small deterministic tests: `node --test tests/*.test.js` |
| `REPORT.md` | generated; do not edit by hand |
| `DECISIONS.md` | the choices of each case |

## The 15 cases

1 tamper and staleness detection; 2 citation checkability; 3 reproducible build; 4 one source, many outputs; 5 time to first node; 6 typed-link questions; 7 cross-node questions; 8 governance (tool-server writes, injection samples); 9 held-back content on the tool server; 10 scale; 11 agent reading cost; 12 round trips; 13 conformance and a second implementation; 14 offline operation; 15 the graph read by independent RDF tools.

## Single steps

```sh
node src/c01-tamper-detection.js        # one case
node src/c06-typed-link-questions.js --no-model
C10_SIZES=50,500 C10_RUNS=1 node src/c10-scale.js   # a quick scale check
bash src/c15-semantics.sh               # after case 6 has built the example Bundles
```

A case script overwrites its file in `results/`. Copy the folder first if you want to keep the recorded rows.
