#!/usr/bin/env bash
# Builds the scratch corpus from the repositories, read-only on them.
# Output: $SCRATCH/{www-patterns,www-main,src-patterns,src-main}
set -euo pipefail
# NODES_DIR  folder with the clones of AgenticSystemCore-Patterns and AgenticSystemCore.com (default: the parent of this repository)
# ENGINE_DIR the engine at tag v1.1.0 (default: $NODES_DIR/agentic-system-core)
# BENCH_SCRATCH scratch folder (default: ${TMPDIR:-/tmp}/agsc-benchmarks/answering)
HERE=$(cd "$(dirname "$0")/.." && pwd)
ROOT=${NODES_DIR:-$(cd "$HERE/../.." && pwd)}
SCRATCH=${BENCH_SCRATCH:-${TMPDIR:-/tmp}/agsc-benchmarks/answering}
ENGINE=${ENGINE_DIR:-$ROOT/agentic-system-core}
[ -d "$ROOT/AgenticSystemCore-Patterns/www" ] && [ -d "$ROOT/AgenticSystemCore.com/www" ] || { echo "NODES_DIR=$ROOT must hold AgenticSystemCore-Patterns and AgenticSystemCore.com"; exit 1; }
[ -x "$ENGINE/tools/publish-set" ] || { echo "ENGINE_DIR=$ENGINE is not the engine"; exit 1; }
# The studies ran at these commits; a different commit can give different figures.
expect() { have=$(git -C "$ROOT/$1" rev-parse HEAD 2>/dev/null || echo unknown); [ "$have" = "$2" ] || echo "warning: $1 is at $have, the studies ran at $2" >&2; }
expect AgenticSystemCore-Patterns 22946dc3bcfe3cfb7846edcf938734fa3bc0fc0f
expect AgenticSystemCore.com 5706b1ecb561ffc95cde87a1b52c401629454eba
mkdir -p "$SCRATCH"
# 1. The built sites (made by the 1.1.0 engine on 2026-11-13). A fresh build needs the git-log file of the
#    site's own pipeline (AGSC-E901 without it), so the committed build output is copied read-only.
[ -d "$SCRATCH/www-patterns" ] || cp -r "$ROOT/AgenticSystemCore-Patterns/www" "$SCRATCH/www-patterns"
[ -d "$SCRATCH/www-main" ]     || cp -r "$ROOT/AgenticSystemCore.com/www" "$SCRATCH/www-main"
# 2. The Bundle sources for `agsc mcp` and for the Markdown corpus: published items only.
for pair in patterns:AgenticSystemCore-Patterns main:AgenticSystemCore.com; do
  name=${pair%%:*}; repo=${pair##*:}
  if [ ! -d "$SCRATCH/src-$name" ]; then
    mkdir -p "$SCRATCH/src-$name"
    rsync -a --exclude .git --exclude www --exclude dist --exclude .wrangler --exclude '.env*' "$ROOT/$repo/" "$SCRATCH/src-$name/"
    if [ -f "$SCRATCH/src-$name/publish-set.json" ]; then
      (cd "$SCRATCH/src-$name" && node "$ENGINE/tools/publish-set" . >/dev/null)
    fi
    # `agsc mcp` serves held-back drafts too (see REPORT.md), so drafts are deleted from the scratch copy.
    python3 - "$SCRATCH/src-$name" <<'PY'
import re,glob,os,sys
for f in glob.glob(sys.argv[1]+'/content/**/*.md',recursive=True):
    m=re.match(r'---\n(.*?)\n---',open(f).read(),re.S)
    if m and re.search(r'^status: draft',m.group(1),re.M): os.remove(f)
PY
  fi
done
# 3. Libraries (scratch only).
if [ ! -d "$SCRATCH/deps/node_modules/minisearch" ]; then
  mkdir -p "$SCRATCH/deps"; cp "$HERE/package.json" "$SCRATCH/deps/package.json"
  (cd "$SCRATCH/deps" && npm install --no-audit --no-fund >/dev/null)
fi
echo "setup ok: $SCRATCH"
