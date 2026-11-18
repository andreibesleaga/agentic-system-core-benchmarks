#!/usr/bin/env bash
# Builds the scratch folder from the repositories, read-only on them. Idempotent.
# Output: $BENCH_SCRATCH/{engine,www-*,src-*,full-*,deps,venv}
set -euo pipefail
# NODES_DIR  folder with the clones of AgenticSystemCore-Patterns and AgenticSystemCore.com (default: the parent of this repository)
# ENGINE_DIR the engine at tag v1.1.0 (default: $NODES_DIR/agentic-system-core)
# BENCH_SCRATCH scratch folder (default: ${TMPDIR:-/tmp}/agsc-benchmarks/capabilities)
HERE=$(cd "$(dirname "$0")/.." && pwd)
ROOT=${NODES_DIR:-$(cd "$HERE/../.." && pwd)}
SCRATCH=${BENCH_SCRATCH:-${TMPDIR:-/tmp}/agsc-benchmarks/capabilities}
ENGINE_SRC=${ENGINE_DIR:-$ROOT/agentic-system-core}
[ -d "$ROOT/AgenticSystemCore-Patterns/www" ] && [ -d "$ROOT/AgenticSystemCore.com/www" ] || { echo "NODES_DIR=$ROOT must hold AgenticSystemCore-Patterns and AgenticSystemCore.com"; exit 1; }
[ -x "$ENGINE_SRC/tools/publish-set" ] || { echo "ENGINE_DIR=$ENGINE_SRC is not the engine"; exit 1; }
# The studies ran at these commits; a different commit can give different figures.
expect() { have=$(git -C "$ROOT/$1" rev-parse HEAD 2>/dev/null || echo unknown); [ "$have" = "$2" ] || echo "warning: $1 is at $have, the studies ran at $2" >&2; }
expect AgenticSystemCore-Patterns 22946dc3bcfe3cfb7846edcf938734fa3bc0fc0f
expect AgenticSystemCore.com 5706b1ecb561ffc95cde87a1b52c401629454eba
mkdir -p "$SCRATCH"
# 1. The released engine, tag 1.1.0 (copy; the engine folder is never run in place).
[ -d "$SCRATCH/engine" ] || rsync -a "$ENGINE_SRC/" "$SCRATCH/engine/"
# 2. Built sites as committed (made by the 1.1.0 engine on 2026-11-13).
[ -d "$SCRATCH/www-patterns" ] || cp -r "$ROOT/AgenticSystemCore-Patterns/www" "$SCRATCH/www-patterns"
[ -d "$SCRATCH/www-main" ]     || cp -r "$ROOT/AgenticSystemCore.com/www" "$SCRATCH/www-main"
# 3. Full copies of the node repositories, drafts and git history included (history is needed for a rebuild:
#    the ledger and the changelog are derived from the git log). Reading history changes nothing.
for pair in patterns:AgenticSystemCore-Patterns main:AgenticSystemCore.com; do
  name=${pair%%:*}; repo=${pair##*:}
  if [ ! -d "$SCRATCH/full-$name" ]; then
    mkdir -p "$SCRATCH/full-$name"
    rsync -a --exclude www --exclude dist --exclude .wrangler --exclude '.env*' "$ROOT/$repo/" "$SCRATCH/full-$name/"
  fi
  # 4. Published-items-only copy (the answering study's corpus): drafts removed, publish switch applied.
  if [ ! -d "$SCRATCH/src-$name" ]; then
    mkdir -p "$SCRATCH/src-$name"
    rsync -a --exclude .git --exclude www --exclude dist --exclude .wrangler --exclude '.env*' "$ROOT/$repo/" "$SCRATCH/src-$name/"
    if [ -f "$SCRATCH/src-$name/publish-set.json" ]; then
      (cd "$SCRATCH/src-$name" && node "$SCRATCH/engine/tools/publish-set" . >/dev/null)
    fi
    python3 - "$SCRATCH/src-$name" <<'PY'
import re,glob,os,sys
for f in glob.glob(sys.argv[1]+'/content/**/*.md',recursive=True):
    m=re.match(r'---\n(.*?)\n---',open(f).read(),re.S)
    if m and re.search(r'^status: draft',m.group(1),re.M): os.remove(f)
PY
  fi
done
# 5. Libraries (scratch only): BM25, tokenizer, html-to-text.
if [ ! -d "$SCRATCH/deps/node_modules/minisearch" ]; then
  mkdir -p "$SCRATCH/deps"; cp "$HERE/package.json" "$SCRATCH/deps/package.json"
  (cd "$SCRATCH/deps" && npm install --no-audit --no-fund >/dev/null)
fi
# 6. The Python package from PyPI (checkers and reader) and the two independent RDF libraries of case 15.
if [ ! -x "$SCRATCH/venv/bin/python" ]; then
  python3 -m venv "$SCRATCH/venv" && "$SCRATCH/venv/bin/pip" install -q agentic-system-core
fi
"$SCRATCH/venv/bin/python" -c 'import rdflib, pyshacl' 2>/dev/null || "$SCRATCH/venv/bin/pip" install -q rdflib==7.6.0 pyshacl==0.40.2
echo "setup ok: $SCRATCH"
