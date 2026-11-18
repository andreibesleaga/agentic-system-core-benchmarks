#!/usr/bin/env bash
# Run of the answering study on two hosted models through an OpenAI-compatible endpoint.
# Required environment: LLM_API_KEY (the provider's key; never write it to a file).
# Optional: LLM_BASE_URL (default https://openrouter.ai/api/v1), NODES_DIR, ENGINE_DIR, BENCH_SCRATCH.
# Resumable: finished rows are skipped. Token caps (a hard limit on prompt plus completion tokens per process):
#   anthropic/claude-haiku-5.5   14,000,000
#   anthropic/claude-sonnet-5.5   3,000,000
# Exit code 3 from the runner means the cap was reached; the rows so far are kept.
set -uo pipefail
cd "$(dirname "$0")"
[ -n "${LLM_API_KEY:-}" ] || { echo "LLM_API_KEY is not set"; exit 1; }
export LLM_BASE_URL="${LLM_BASE_URL:-https://openrouter.ai/api/v1}"
export SOURCE_DATE_EPOCH=1767225600
export BENCH_NUM_CTX=32768
mkdir -p reports
bash src/setup.sh
node src/freeze.js --check

LLM_TOKEN_BUDGET=14000000 node src/runner.js --model anthropic/claude-haiku-5.5 \
  --conds C0,C1,C2,C2u,C2b,C3,C4 --seeds 1,2,3 > reports/paid-haiku.log 2>&1
echo "haiku exit $?" | tee -a reports/paid-haiku.log

LLM_TOKEN_BUDGET=3000000 node src/runner.js --model anthropic/claude-sonnet-5.5 \
  --conds C0,C1,C2,C2b,C3,C4 --seeds 1 > reports/paid-sonnet.log 2>&1
echo "sonnet exit $?" | tee -a reports/paid-sonnet.log

node src/report.js
echo "done: see REPORT.md"
