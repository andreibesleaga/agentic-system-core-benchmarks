'use strict';
/** Runs inside `unshare -rn` (no network). Prints one JSON object on stdout. */
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const cp = require('node:child_process');
const { cfg, run, agsc, freshCopy, mcpOpen } = require('./shared/lib');

(async () => {
  const rows = [];
  const add = (op, r, extra = {}) => rows.push({ op, exit: r.code, ms: r.ms, ok: r.code === 0, ...extra });
  const reach = await new Promise((res) => { const s = net.connect({ host: '1.1.1.1', port: 443, timeout: 2000 }); s.on('connect', () => { s.destroy(); res('reachable'); }); s.on('error', (e) => res(e.code)); s.on('timeout', () => res('timeout')); });
  const dir = freshCopy(cfg.fullDir('patterns'), 'c14-bundle');
  add('agsc build', agsc(dir, ['build', '--quiet']));
  add('agsc lint', agsc(dir, ['lint', '--quiet']));
  add('agsc verify (two builds compared)', agsc(dir, ['verify', '--quiet']));
  add('agsc export --steer', agsc(dir, ['export', '--steer', '--quiet']));
  add('agsc skills', agsc(dir, ['skills', '--quiet']));
  const doc = path.join(dir, 'www/.well-known/knowledge-linkset');
  add('validate-wellknown level 2 (Node)', run(process.execPath, [path.join(cfg.ENGINE, 'tools/validate-wellknown'), doc, '--level', '2']));
  add('validate-wellknown level 2 (Python)', run(cfg.PY, ['-I', '-m', 'agentic_system_core.cli', 'validate-wellknown', doc, '--level', '2']));
  add('agsc conform --level 0', agsc(dir, ['conform', '--level', '0', '--quiet', '--to', 'dist/c0.json']));
  // MCP over stdio
  try {
    const t0 = Date.now(); const m = await mcpOpen(dir); const t1 = Date.now() - t0;
    const s = await m.call('search', { query: 'agent memory' }); const rd = await m.call('read', { slug: 'augmented-llm' }); const l = await m.call('links', { slug: 'augmented-llm' });
    rows.push({ op: 'agsc mcp (stdio): start, search, read, links', ok: !s.isError && !rd.isError && !l.isError, ms: Date.now() - t0, start_ms: t1, hits: (s.json && s.json.body.hits || []).length });
    await m.close();
  } catch (e) { rows.push({ op: 'agsc mcp (stdio)', ok: false, error: String(e.message).slice(0, 200) }); }
  // MCP over loopback HTTP: needs lo up inside the namespace
  const up = run('ip', ['link', 'set', 'lo', 'up']);
  const port = 38917;
  const srv = cp.spawn(process.execPath, [path.join(cfg.ENGINE, 'bin/agsc.js'), 'mcp', '--http', String(port)], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
  for (let i = 0; i < 60; i += 1) { // wait until the port accepts connections
    const ok = await new Promise((r) => { const c = net.connect(port, '127.0.0.1'); c.on('connect', () => { c.destroy(); r(true); }); c.on('error', () => r(false)); });
    if (ok) break; await new Promise((r) => setTimeout(r, 250));
  }
  try {
    const res = await fetch(`http://127.0.0.1:${port}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/list' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientInfo': { name: 'c14', version: '1' }, 'io.modelcontextprotocol/clientCapabilities': {} } } }) });
    const body = await res.text(); let n = null; try { n = JSON.parse(body).result.tools.length; } catch { /* keep null */ }
    rows.push({ op: 'agsc mcp --http on loopback: tools/list', ok: res.status === 200 && n === 10, http_status: res.status, tools: n, body_start: n === null ? body.slice(0, 160) : undefined, lo_up_exit: up.code });
  } catch (e) { rows.push({ op: 'agsc mcp --http on loopback', ok: false, error: String(e.message).slice(0, 200), lo_up_exit: up.code }); }
  srv.kill();
  // The node's own search index, read the way a page script does: search.json and a term lookup.
  const idx = JSON.parse(fs.readFileSync(path.join(dir, 'www/search.json'), 'utf8'));
  rows.push({ op: 'search.json readable and non-empty (page search is client-side)', ok: !!idx && Object.keys(idx).length > 0 });
  process.stdout.write(JSON.stringify({ outbound_connection_to_1_1_1_1_443: reach, rows }));
})();
