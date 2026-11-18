#!/usr/bin/env bash
# Case 15: reads the published graphs of the two nodes and of the three example Bundles with rdflib and pySHACL.
# Needs `bash src/setup.sh` and a finished case 6 (it builds the three example Bundles under $BENCH_SCRATCH/work).
set -euo pipefail
cd "$(dirname "$0")/.."
SCRATCH=${BENCH_SCRATCH:-${TMPDIR:-/tmp}/agsc-benchmarks/capabilities}
W="$SCRATCH/work"
"$SCRATCH/venv/bin/python" -I src/case15_semantics.py "$SCRATCH/engine" results/case15-semantics.json \
  "patterns=$SCRATCH/www-patterns" "main=$SCRATCH/www-main" \
  "example-engine=$W/c06-engine/www" "example-tool-server=$W/c06-tool-server/www" "example-linked-sites=$W/c06-linked-sites/www" >/dev/null
echo "wrote results/case15-semantics.json"
