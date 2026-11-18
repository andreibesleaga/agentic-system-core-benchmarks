'use strict';
/** Paths and fixed parameters of the capabilities study. Everything that decides a result is here. */
const path = require('node:path');
const os = require('node:os');

const STUDY = path.resolve(__dirname, '..', '..');
/** Folder that holds the clones of the node repositories and of the engine (default: the parent of this repository). */
const NODES_DIR = process.env.NODES_DIR || path.resolve(STUDY, '..', '..');
/** Scratch folder: copies of the engine and nodes, libraries, virtual environment, temporary files. */
const SCRATCH = process.env.BENCH_SCRATCH || path.join(os.tmpdir(), 'agsc-benchmarks', 'capabilities');
/** The answering study (rows of questions and answers) that cases 2 and 11 re-read. */
const ANSWERING = path.resolve(STUDY, '..', 'answering');

module.exports = {
  STUDY, SCRATCH, NODES_DIR, ANSWERING,
  /** Read-only copy of the released engine (tag 1.1.0), made by setup.sh. */
  ENGINE: path.join(SCRATCH, 'engine'),
  DEPS: path.join(SCRATCH, 'deps', 'node_modules'),
  NODES: ['patterns', 'main'],
  wwwDir: (node) => path.join(SCRATCH, `www-${node}`),
  /** Published items only (drafts removed): the corpus the answering study used. */
  srcDir: (node) => path.join(SCRATCH, `src-${node}`),
  /** Full copy of the node repository, drafts included. */
  fullDir: (node) => path.join(SCRATCH, `full-${node}`),
  PY: path.join(SCRATCH, 'venv', 'bin', 'python'),
  OLLAMA: 'http://127.0.0.1:11434',
  EPOCH: '1767225600',
  LIMITS: { toolCalls: 8, numCtx: 16384, toolResultChars: 3500, maxAnswerTokens: 400, topK: 5 },
};
