'use strict';
/**
 * The graph study, shared parts: the three sites, their published graphs (graph.nq), and the set scorer.
 * It reuses the harness of the answering study (../answering/src) and adds the third site.
 */
const fs = require('node:fs');
const path = require('node:path');
const cfg = require('../answering/src/config');

const SITES = {
  patterns: { name: 'the patterns site', base: 'https://patterns.agenticsystemcore.com' },
  standards: { name: 'the Standards Map', base: 'https://standards.agenticsystemcore.com' },
  main: { name: "the format's own site", base: 'https://agenticsystemcore.com' },
};
if (!cfg.NODES.includes('standards')) cfg.NODES.push('standards');
cfg.NODE_NAMES.standards = 'Standards Map (standards.agenticsystemcore.com)';

const P = {
  label: 'http://www.w3.org/2004/02/skos/core#prefLabel', related: 'http://www.w3.org/2004/02/skos/core#related',
  member: 'http://www.w3.org/2004/02/skos/core#member', type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  uses: 'https://w3id.org/agentic-system-core/ns#uses', requires: 'http://purl.org/dc/terms/requires',
  implements: 'https://w3id.org/agentic-system-core/ns#implements',
};

/** Reads one site's published graph: items (slug, title, folder), and edges by predicate. */
function loadGraph(node) {
  const text = fs.readFileSync(path.join(cfg.wwwDir(node), 'graph.nq'), 'utf8');
  const base = SITES[node].base;
  const item = (iri) => { const m = new RegExp(`^${base.replace(/\./g, '\\.')}/(concepts|procedures|clusters|gates|episodes|lessons)/([^/]+)/$`).exec(iri); return m ? { folder: m[1], slug: m[2] } : null; };
  const items = new Map(); const edges = [];
  for (const line of text.split('\n')) {
    const m = /^<([^>]+)> <([^>]+)> (?:<([^>]+)>|"((?:[^"\\]|\\.)*)"\S*) /.exec(line);
    if (!m) continue;
    const s = item(m[1]); if (!s) continue;
    if (!items.has(s.slug)) items.set(s.slug, { slug: s.slug, folder: s.folder, title: null });
    if (m[2] === P.label && m[4] !== undefined) items.get(s.slug).title = JSON.parse(`"${m[4]}"`);
    const o = m[3] ? item(m[3]) : null;
    if (o) edges.push({ s: s.slug, p: m[2], o: o.slug });
  }
  const out = (slug, p) => [...new Set(edges.filter((e) => e.s === slug && e.p === p).map((e) => e.o))].sort();
  const into = (slug, p) => [...new Set(edges.filter((e) => e.o === slug && e.p === p).map((e) => e.s))].sort();
  return { node, items, edges, out, into,
    related: (slug) => [...new Set([...out(slug, P.related), ...into(slug, P.related)])].sort(),
    clustersOf: (slug) => into(slug, P.member), membersOf: (cluster) => out(cluster, P.member),
    cards: () => [...items.values()].filter((i) => i.folder !== 'clusters' && i.title).map((i) => i.slug).sort() };
}

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
/**
 * The forms under which an answer may name a card: its title as published, the title without a part in
 * parentheses or without a leading article, and its identifier (the `links` tool returns identifiers).
 * @param {{title:string, slug?:string}|string} card
 */
const forms = (card) => {
  const title = typeof card === 'string' ? card : card.title; const slug = typeof card === 'string' ? '' : card.slug;
  const bare = String(title).replace(/\([^)]*\)/g, ' ');
  return [...new Set([norm(title), norm(bare), norm(title).replace(/^the /, ''), norm(bare).replace(/^the /, ''), norm(slug)])].filter((f) => f.length >= 4).sort((a, b) => b.length - a.length);
};
const has = (text, form) => new RegExp(`(^| )${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(text);

/** The answer line(s): from the last "Answer:" label to the "Sources:" label or the end. */
function answerPart(answer) {
  const lines = String(answer || '').split('\n');
  let at = -1; lines.forEach((l, i) => { if (/^\W*answer\s*:/i.test(l.trim())) at = i; });
  if (at < 0) return '';
  const rest = lines.slice(at); const stop = rest.findIndex((l, i) => i > 0 && /^\W*sources?\s*:/i.test(l.trim()));
  return (stop < 0 ? rest : rest.slice(0, stop)).join(' ').replace(/^\W*answer\s*:/i, ' ');
}

/**
 * Scores a list answer against the gold set of cards.
 * @param {{gold:{title:string,slug:string}[], subjects:{title:string,slug:string}[], facts?:string[], pool:{title:string,slug:string}[]}} q
 *   pool = every other card and cluster of the sites asked
 * @returns {{exact:boolean, found:number, gold:number, extras:number, recall:number, precision:number, said_none:boolean, not_found:boolean, facts_ok:boolean}}
 */
function scoreList(q, answer) {
  const raw = answerPart(answer); let text = ` ${norm(raw)} `;
  const notFound = /\bnot found\b/.test(text) || !raw.trim();
  const cut = (f) => { text = text.replace(new RegExp(`(^| )${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`, 'g'), ' '); };
  let found = 0;
  for (const card of q.gold) { const hit = forms(card).filter((f) => has(text, f)); if (hit.length) { found += 1; hit.forEach(cut); } }
  for (const card of q.subjects || []) forms(card).forEach(cut);
  const extras = q.pool.filter((card) => forms(card).some((f) => has(text, f))).length;
  const saidNone = /\bnone\b/.test(text);
  const factsOk = (q.facts || []).every((f) => new RegExp(f, 'i').test(String(answer || '')));
  const gold = q.gold.length;
  const exact = !notFound && factsOk && extras === 0 && (gold === 0 ? saidNone : found === gold);
  return { exact, found, gold, extras, recall: gold ? found / gold : (saidNone && !extras ? 1 : 0), precision: found + extras ? found / (found + extras) : (gold === 0 && saidNone ? 1 : 0),
    said_none: saidNone, not_found: notFound, facts_ok: factsOk };
}

/** A question with its cards as {title, slug}, and the pool of every other card and cluster of the sites it asks. */
function withCards(q, graphs) {
  const pair = (ts, ss) => ts.map((title, i) => ({ title, slug: ss[i] }));
  const keep = new Set([...q.gold_slugs, ...q.subject_slugs].map((s) => `${q.node}:${s}`));
  const pool = q.nodes.flatMap((n) => [...graphs[n].items.values()].filter((i) => i.title && !keep.has(`${n}:${i.slug}`)).map((i) => ({ title: i.title, slug: i.slug })));
  return { ...q, gold: pair(q.gold_titles, q.gold_slugs), subjects: pair(q.subject_titles, q.subject_slugs), pool };
}

module.exports = { SITES, P, cfg, loadGraph, norm, forms, answerPart, scoreList, withCards };
