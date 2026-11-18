'use strict';
/** C3: lexical retrieval (BM25 family, MiniSearch) over Markdown chunks. Default scoring, no tuning. */
const path = require('node:path');
const cfg = require('./config');
const _ms = require(path.join(cfg.DEPS, 'minisearch', 'dist', 'cjs', 'index.cjs'));
const MiniSearch = _ms.default || _ms;

const STOP = new Set(('a an and are as at be by for from has have in is it its of on or that the this to was were which what who whom how '
  + 'many much when where with does do did can could would should about into than then there their they them these those not no one two').split(' '));

class Retriever {
  constructor(chunks) {
    this.byId = new Map(chunks.map((c) => [c.id, c]));
    this.index = new MiniSearch({
      fields: ['title', 'text'], storeFields: [], idField: 'id',
      processTerm: (t) => { const l = t.toLowerCase(); return STOP.has(l) ? null : l; },
      searchOptions: { combineWith: 'OR', prefix: false, fuzzy: false },
    });
    this.index.addAll(chunks);
  }

  top(query, k) {
    return this.index.search(query).slice(0, k).map((h) => this.byId.get(h.id));
  }
}

module.exports = { Retriever };
