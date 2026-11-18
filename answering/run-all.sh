#!/usr/bin/env bash
# One command: set up the corpus, freeze check, tests, no-model measurements, model runs, report.
# Resumable: finished rows are skipped. Needs Ollama (`ollama serve`) with qwen2.5-coder:7b and gemma3:4b.
# Set NODES_DIR and ENGINE_DIR if the node repositories and the engine are not next to this repository (see README.md).
set -euo pipefail
cd "$(dirname "$0")"
export SOURCE_DATE_EPOCH=1767225600
bash src/setup.sh
curl -s -m 5 127.0.0.1:11434/api/tags >/dev/null || { echo 'Ollama is not running on 127.0.0.1:11434 (start it with: ollama serve)'; exit 1; }
node src/freeze.js --check
node --test tests/*.test.js
node src/nomodel.js
node src/runner.js --model qwen2.5-coder:7b                 # C0..C4, seeds 1,2,3 (about 8 h on the reference machine)
node src/runner.js --model gemma3:4b --conds C3,C4          # gemma3:4b has no tool calls
node src/report.js
echo "done: see REPORT.md"
