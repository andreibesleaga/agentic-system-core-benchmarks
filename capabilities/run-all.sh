#!/usr/bin/env bash
# Re-runs all 15 cases from nothing and rebuilds REPORT.md. Needs: Node 24, Python 3 (with PyYAML), rsync, npm, /usr/bin/time,
# `unshare` with user namespaces, and Ollama on 127.0.0.1:11434 with qwen2.5-coder:7b and gemma3:4b (case 6 only; `--no-model` skips it).
# Case 10 (scale) takes about 10 minutes; case 6 about 20 minutes on a 6 GB GPU. Nothing is written outside this folder and the scratch folder.
set -euo pipefail
cd "$(dirname "$0")"
export SOURCE_DATE_EPOCH=1767225600
bash src/setup.sh
node --test tests/*.test.js
for c in c01-tamper-detection c02-citation-checkability c03-reproducible-build c04-one-source-many-outputs c05-time-to-first-node \
         c07-cross-node c08a-governance-writes c08b-injection-lint c09-held-back-content c11-agent-reading-cost c12-round-trips \
         c13-conformance-second-implementation c14-offline; do
  echo "== $c"; node "src/$c.js"
done
echo "== c10-scale (alone: it measures time and memory)"; node src/c10-scale.js
if [ "${1:-}" != "--no-model" ]; then
  curl -s -m 5 127.0.0.1:11434/api/tags >/dev/null || { echo 'Ollama is not running on 127.0.0.1:11434 (start it with: ollama serve), or use --no-model'; exit 1; }
  echo "== c06-typed-link-questions"; node src/c06-typed-link-questions.js
else
  echo "== c06-typed-link-questions (no model)"; node src/c06-typed-link-questions.js --no-model
fi
echo "== c15-semantics"; bash src/c15-semantics.sh
node src/report.js
