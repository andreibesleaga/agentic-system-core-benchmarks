'use strict';
/**
 * Case 14. Build, verify, search and the tool server with the network removed (`unshare -rn`: a new user and network namespace;
 * only a loopback device that is down). The check that the network is really absent is part of the result.
 */
const path = require('node:path');
const { cfg, writeResult, run } = require('./shared/lib');

const r = run('unshare', ['-rn', 'bash', '-c', `${process.execPath} ${path.join(__dirname, 'c14-offline-inner.js')}`], { env: { BENCH_SCRATCH: cfg.SCRATCH } });
if (r.code !== 0) { writeResult('c14-offline', { measured: false, reason: `unshare failed or inner script failed: ${(r.err || r.out).slice(0, 300)}` }); process.exit(0); }
const inner = JSON.parse(r.out);
writeResult('c14-offline', { measured: true, method: 'unshare -rn (new network namespace, no interfaces up)', ...inner, passed: inner.rows.filter((x) => x.ok).length, total: inner.rows.length });
