'use strict';
/** Small helpers shared by every case script: results, shell, hashing, seeded random numbers, MCP client. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const cfg = require('./config');

const ENV = { ...process.env, SOURCE_DATE_EPOCH: cfg.EPOCH, NO_COLOR: '1' };

/** Writes results/<name>.json (stable key order, trailing newline). */
function writeResult(name, obj) {
  const file = path.join(cfg.STUDY, 'results', `${name}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 1)}\n`);
  process.stderr.write(`wrote ${file}\n`);
}

/** Runs a command; never throws. Returns { code, out, err, ms }. */
function run(cmd, args, o = {}) {
  const t0 = process.hrtime.bigint();
  const r = cp.spawnSync(cmd, args, { cwd: o.cwd, env: { ...ENV, ...(o.env || {}) }, encoding: 'utf8', maxBuffer: 1 << 29, timeout: o.timeout || 600000, input: o.input });
  return { code: r.status === null ? -1 : r.status, out: r.stdout || '', err: r.stderr || '', ms: Number((process.hrtime.bigint() - t0) / 1000000n) };
}

const agsc = (cwd, args, o = {}) => run(process.execPath, [path.join(cfg.ENGINE, 'bin/agsc.js'), ...args], { cwd, ...o });

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** Every file under dir: relative path -> sha256. */
function treeHash(dir, skip = () => false) {
  const out = {};
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name); const rel = path.relative(dir, p);
      if (skip(rel)) continue;
      if (e.isDirectory()) walk(p); else if (e.isFile()) out[rel] = sha256(fs.readFileSync(p));
    }
  };
  walk(dir);
  return out;
}

/** Deterministic generator (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Fresh copy of a directory in scratch. */
function freshCopy(src, name) {
  const dst = path.join(cfg.SCRATCH, 'work', name);
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
  return dst;
}

/** One `agsc mcp` client over stdio for a Bundle folder. */
async function mcpOpen(bundleDir, extraEnv = {}) {
  const { Client } = await import(path.join(cfg.ENGINE, 'node_modules/@modelcontextprotocol/client/dist/index.mjs'));
  const { StdioClientTransport } = await import(path.join(cfg.ENGINE, 'node_modules/@modelcontextprotocol/client/dist/stdio.mjs'));
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(cfg.ENGINE, 'bin/agsc.js'), 'mcp'], cwd: bundleDir, env: { ...ENV, ...extraEnv }, stderr: 'pipe' });
  const client = new Client({ name: 'capabilities-study', version: '1.0.0' });
  await client.connect(transport);
  const call = async (name, args) => {
    const r = await client.callTool({ name, arguments: args });
    const text = (r.content || []).map((c) => c.text || '').join('\n');
    let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { isError: !!r.isError, text, json };
  };
  return { client, call, close: () => client.close() };
}

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

module.exports = { cfg, ENV, writeResult, run, agsc, sha256, treeHash, rng, freshCopy, mcpOpen, mean, median };
