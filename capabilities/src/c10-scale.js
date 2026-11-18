'use strict';
/**
 * Case 10. Synthetic Bundles of 50, 500, 2000 and 5000 items from the engine's own deterministic generator (bench/gen-bundle.js):
 * build time and peak memory (GNU time), output size, search latency of the tool server's `search` (median of 30 seeded queries),
 * tool server cold start (spawn to first answer). Baseline: a BM25 index (MiniSearch) over the same Markdown, built and queried in
 * one Node process. Three runs per size for build time; the median is reported.
 */
const fs = require('node:fs');
const path = require('node:path');
const { cfg, writeResult, run, agsc, rng, mcpOpen, median, treeHash } = require('./shared/lib');
const MiniSearch = (() => { const m = require(path.join(cfg.DEPS, 'minisearch', 'dist', 'cjs', 'index.cjs')); return m.default || m; })();

const SIZES = (process.env.C10_SIZES || '50,500,2000,5000').split(',').map(Number);
const RUNS = Number(process.env.C10_RUNS || 3);
const GEN = path.join(cfg.ENGINE, 'bench/gen-bundle.js');
const dirSize = (d) => { let n = 0; (function w(x) { for (const e of fs.readdirSync(x, { withFileTypes: true })) { const p = path.join(x, e.name); if (e.isDirectory()) w(p); else n += fs.statSync(p).size; } }(d)); return n; };
const fileCount = (d) => Object.keys(treeHash(d)).length;
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

(async () => {
  const rows = [];
  for (const n of SIZES) {
    const dir = path.join(cfg.SCRATCH, 'work', `c10-n${n}`);
    fs.rmSync(dir, { recursive: true, force: true });
    const g = run(process.execPath, [GEN, '--items', String(n), '--out', dir]);
    if (g.code !== 0) { rows.push({ items: n, generated: false, error: (g.err || g.out).slice(0, 200) }); continue; }
    const row = { items: n, generated: true, source_bytes: dirSize(dir), build_runs: [] };
    for (let i = 0; i < RUNS; i += 1) {
      fs.rmSync(path.join(dir, 'www'), { recursive: true, force: true });
      const t = run('/usr/bin/time', ['-v', process.execPath, path.join(cfg.ENGINE, 'bin/agsc.js'), 'build', '--quiet'], { cwd: dir, timeout: 1800000 });
      const mem = Number((/Maximum resident set size \(kbytes\): (\d+)/.exec(t.err) || [])[1]);
      const wall = (/Elapsed \(wall clock\) time.*?: ([\d:.]+)/.exec(t.err) || [])[1];
      row.build_runs.push({ exit: t.code, ms: t.ms, peak_rss_mb: Math.round(mem / 1024), wall });
    }
    row.build_ms_median = median(row.build_runs.map((r) => r.ms)); row.peak_rss_mb_max = Math.max(...row.build_runs.map((r) => r.peak_rss_mb));
    row.build_ok = row.build_runs.every((r) => r.exit === 0);
    const www = path.join(dir, 'www');
    if (row.build_ok) { row.output_bytes = dirSize(www); row.output_files = fileCount(www); }
    // queries: seeded words taken from the generated items' text
    const rand = rng(n);
    const mdDir = path.join(dir, 'content/concepts'); const files = fs.readdirSync(mdDir).filter((f) => f.endsWith('.md'));
    const docs = files.map((f, i) => ({ id: f.slice(0, -3), text: fs.readFileSync(path.join(mdDir, f), 'utf8') }));
    const words = docs.slice(0, 200).flatMap((d) => d.text.split(/[^a-z]+/).filter((w) => w.length > 4));
    const queries = Array.from({ length: 30 }, () => `${words[Math.floor(rand() * words.length)]} ${words[Math.floor(rand() * words.length)]}`);
    // baseline BM25 over the raw Markdown (frontmatter included)
    const tb = process.hrtime.bigint(); const ms = new MiniSearch({ fields: ['text'], idField: 'id' }); ms.addAll(docs); const idxMs = Number((process.hrtime.bigint() - tb) / 1000000n);
    const bl = queries.map((q) => { const t0 = process.hrtime.bigint(); ms.search(q); return Number(process.hrtime.bigint() - t0) / 1e6; });
    row.bm25_index_build_ms = idxMs; row.bm25_query_ms_median = median(bl);
    // tool server
    try {
      const t0 = Date.now(); const m = await mcpOpen(dir); const first = await m.call('search', { query: queries[0] }); row.mcp_cold_start_ms = Date.now() - t0; row.mcp_first_hits = first.json ? first.json.body.hits.length : null;
      const lat = [];
      for (const q of queries) { const t1 = process.hrtime.bigint(); await m.call('search', { query: q }); lat.push(Number(process.hrtime.bigint() - t1) / 1e6); }
      row.mcp_search_ms_median = median(lat); row.mcp_search_ms_p95 = pct(lat, 0.95);
      await m.close();
    } catch (e) { row.mcp_error = String(e.message).slice(0, 200); }
    rows.push(row);
    fs.rmSync(path.join(dir, 'www'), { recursive: true, force: true }); // keep scratch small
  }
  writeResult('c10-scale', { generator: 'bench/gen-bundle.js of the 1.1.0 engine (deterministic; output a pure function of the item count)', runs_per_size: RUNS, machine: `${require('node:os').cpus()[0].model}, ${require('node:os').cpus().length} threads, ${Math.round(require('node:os').totalmem() / 2 ** 30)} GB`, rows });
})();
