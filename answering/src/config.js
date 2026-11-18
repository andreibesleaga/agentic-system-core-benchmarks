'use strict';
/** Paths and fixed parameters of the study. Everything that decides a result is here. */
const path = require('node:path');
const os = require('node:os');

const STUDY = path.resolve(__dirname, '..');
/** Folder that holds the clones of the node repositories and of the engine (default: the parent of this repository). */
const NODES_DIR = process.env.NODES_DIR || path.resolve(STUDY, '..', '..');
/** Scratch folder: copies of the nodes, libraries and temporary files. Nothing is written in any repository. */
const SCRATCH = process.env.BENCH_SCRATCH || path.join(os.tmpdir(), 'agsc-benchmarks', 'answering');
/** The engine at tag v1.1.0, with `npm ci` run in it. */
const ENGINE = process.env.ENGINE_DIR || path.join(NODES_DIR, 'agentic-system-core');

module.exports = {
  STUDY, SCRATCH, ENGINE, NODES_DIR,
  DEPS: path.join(SCRATCH, 'deps', 'node_modules'),
  NODES: ['patterns', 'main'],
  wwwDir: (node) => path.join(SCRATCH, `www-${node}`),
  srcDir: (node) => path.join(SCRATCH, `src-${node}`),
  OLLAMA: 'http://127.0.0.1:11434',
  SEEDS: [1, 2, 3],
  /** Identical for every condition and model. */
  LIMITS: { toolCalls: 8, numCtx: Number(process.env.BENCH_NUM_CTX) || 8192, toolResultChars: 3500, maxAnswerTokens: 400, topK: 5 },
  EPOCH: '1767225600',
  NODE_NAMES: { patterns: 'AgenticSystemCore Graph (patterns.agenticsystemcore.com)', main: 'AgenticSystemCore (agenticsystemcore.com)' },
  CONDITIONS: ['C0', 'C0h', 'C1', 'C1h', 'C2', 'C2u', 'C2b', 'C3', 'C4'],
};
