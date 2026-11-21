'use strict';
/**
 * The graph study, step 1: 50 questions whose answers are sets of cards, computed from the graphs the sites
 * publish (graph.nq), by fixed templates and a seed. No model writes a question or an answer.
 *
 *   node graph/make-questions.js      -> graph/questions-g.jsonl (then freeze: sha256sum, kept in FROZEN-G.sha256)
 */
const fs = require('node:fs');
const path = require('node:path');
const { SITES, P, loadGraph } = require('./lib');

const SEED = 20261121;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(SEED);
const shuffled = (xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const g = { patterns: loadGraph('patterns'), standards: loadGraph('standards'), main: loadGraph('main') };
const title = (node, slug) => g[node].items.get(slug).title;
const titles = (node, slugs) => slugs.map((s) => title(node, s));
const out = []; const used = new Set();
/** Adds one question; `subjects` are the cards the question names. */
function add(type, node, nodes, subjects, text, goldSlugs, facts) {
  out.push({ id: `g${String(out.length + 1).padStart(2, '0')}`, type, node, nodes, q: text,
    subject_slugs: subjects, subject_titles: titles(node, subjects), gold_slugs: goldSlugs, gold_titles: titles(node, goldSlugs), facts: facts || [],
    author: `templates over the published graphs (graph/make-questions.js, seed ${SEED})`, written: '2026-11-21' });
  subjects.forEach((s) => used.add(`${node}:${s}`));
}
const fresh = (node, slugs) => slugs.filter((s) => !used.has(`${node}:${s}`));
const where = (node) => `On ${SITES[node].name} (${SITES[node].base.replace('https://', '')})`;

// 1. Neighbours: every card linked to X as related, in either direction.
for (const [node, n] of [['patterns', 5], ['standards', 3]]) {
  const picks = shuffled(fresh(node, g[node].cards()).filter((s) => { const k = g[node].related(s).length; return k >= 2 && k <= 5; })).slice(0, n);
  for (const x of picks) add('neighbours', node, [node], [x], `${where(node)}, which cards are linked to the card "${title(node, x)}" as related cards?`, g[node].related(x));
}
// 2 and 3. Typed links of the Standards Map, forwards and backwards.
const TYPED = [['uses', P.uses, 'use', 'uses'], ['requires', P.requires, 'require', 'requires'], ['implements', P.implements, 'implement', 'implements']];
{
  const S = g.standards; const fw = []; const bw = [];
  for (const [key, pred, verb, verbs] of TYPED) for (const x of S.cards()) {
    if (S.out(x, pred).length) fw.push([key, pred, verb, x]);
    if (S.into(x, pred).length) bw.push([key, pred, verbs, x]);
  }
  for (const [key, pred, verb, x] of shuffled(fw).slice(0, 5)) add('typed', 'standards', ['standards'], [x], `${where('standards')}, which cards does the card "${title('standards', x)}" ${verb} (its links of the type "${key}")?`, S.out(x, pred));
  for (const [key, pred, verbs, x] of shuffled(bw).filter(([, , , x]) => !used.has(`standards:${x}`)).slice(0, 5)) add('typed-inverse', 'standards', ['standards'], [x], `${where('standards')}, which cards have a link of the type "${key}" that points to the card "${title('standards', x)}" (which cards ${verbs.replace(/s$/, '')} it)?`, S.into(x, pred));
}
// 4. Two steps along related links.
{
  const G = g.patterns; const cand = [];
  for (const x of fresh('patterns', G.cards())) {
    const one = G.related(x); if (!one.length) continue;
    const two = [...new Set(one.flatMap((y) => G.related(y)))].filter((z) => z !== x && !one.includes(z)).sort();
    if (two.length >= 1 && two.length <= 6 && one.length <= 4) cand.push([x, two]);
  }
  for (const [x, two] of shuffled(cand).slice(0, 6)) add('two-steps', 'patterns', ['patterns'], [x], `${where('patterns')}, which cards are two steps away from the card "${title('patterns', x)}" along related links: related to a card that is related to it, leaving out the card itself and the cards directly related to it?`, two);
}
// 5. Common neighbours of two cards.
{
  const G = g.patterns; const cards = fresh('patterns', G.cards()); const cand = [];
  for (let i = 0; i < cards.length; i += 1) for (let j = i + 1; j < cards.length; j += 1) {
    const both = G.related(cards[i]).filter((z) => G.related(cards[j]).includes(z));
    if (both.length >= 1 && both.length <= 3) cand.push([cards[i], cards[j], both]);
  }
  let n = 0;
  for (const [x, y, both] of shuffled(cand)) { if (n >= 6) break; if (used.has(`patterns:${x}`) || used.has(`patterns:${y}`)) continue; n += 1;
    add('common', 'patterns', ['patterns'], [x, y], `${where('patterns')}, which cards are related to both the card "${title('patterns', x)}" and the card "${title('patterns', y)}"?`, both); }
}
// 6. Related cards, kept only if they are in one cluster.
{
  const G = g.patterns; const cand = [];
  for (const x of fresh('patterns', G.cards())) for (const c of [...new Set(G.related(x).flatMap((y) => G.clustersOf(y)))]) {
    const inC = G.related(x).filter((y) => G.clustersOf(y).includes(c));
    if (inC.length >= 1 && inC.length < G.related(x).length && inC.length <= 3) cand.push([x, c, inC]);
  }
  let n = 0;
  for (const [x, c, inC] of shuffled(cand)) { if (n >= 5) break; if (used.has(`patterns:${x}`)) continue; n += 1;
    add('related-in-cluster', 'patterns', ['patterns'], [x], `${where('patterns')}, which of the cards related to the card "${title('patterns', x)}" are in the cluster "${title('patterns', c)}"?`, inC); }
}
// 7. Everything a card depends on, directly or through other cards (requires and uses).
{
  const S = g.standards; const dep = (x) => [...S.out(x, P.requires), ...S.out(x, P.uses)]; const cand = [];
  for (const x of S.cards()) {
    const seen = new Set(); const todo = [...dep(x)];
    while (todo.length) { const y = todo.pop(); if (seen.has(y) || y === x) continue; seen.add(y); todo.push(...dep(y)); }
    const direct = new Set(dep(x));
    if ([...seen].some((y) => !direct.has(y)) && seen.size <= 6) cand.push([x, [...seen].sort()]);
  }
  for (const [x, all] of shuffled(cand).slice(0, 3)) add('closure', 'standards', ['standards'], [x], `${where('standards')}, which cards does the card "${title('standards', x)}" depend on, directly or through other cards? Follow its links of the types "requires" and "uses", and the same links of every card you reach.`, all);
}
// 8. Two sites: a relation on one site and the meaning of a term on the format's own site.
{
  const MEANING = [
    ['And on the format\'s own site (agenticsystemcore.com), which graph property expresses the membership of an item in a cluster?', ['skos:member']],
    ['And on the format\'s own site (agenticsystemcore.com), which class is a Cluster a subclass of in the graph?', ['skos:Collection']],
    ['And on the format\'s own site (agenticsystemcore.com), which property does an item use to point to each of its sources in the graph?', ['asc:source']],
  ];
  const Gp = g.patterns; const Gs = g.standards;
  const a = shuffled(fresh('patterns', Gp.cards()).filter((x) => Gp.clustersOf(x).length === 1)).slice(0, 2);
  a.forEach((x, i) => add('two-sites', 'patterns', ['patterns', 'main'], [x], `${where('patterns')}, which cluster is the card "${title('patterns', x)}" in? ${MEANING[i][0]}`, Gp.clustersOf(x), MEANING[i][1]));
  const b = shuffled(fresh('patterns', Gp.cards()).filter((x) => { const k = Gp.related(x).length; return k >= 2 && k <= 4; })).slice(0, 2);
  b.forEach((x, i) => add('two-sites', 'patterns', ['patterns', 'main'], [x], `${where('patterns')}, which cards are linked to the card "${title('patterns', x)}" as related cards? ${MEANING[(i + 1) % 3][0]}`, Gp.related(x), MEANING[(i + 1) % 3][1]));
  const c = shuffled(Gs.cards().filter((x) => Gs.out(x, P.uses).length && !used.has(`standards:${x}`))).slice(0, 2);
  c.forEach((x, i) => add('two-sites', 'standards', ['standards', 'main'], [x], `${where('standards')}, which cards does the card "${title('standards', x)}" use (its links of the type "uses")? ${MEANING[(i + 2) % 3][0]}`, Gs.out(x, P.uses), MEANING[(i + 2) % 3][1]));
}
// 9. Questions whose right answer is "none".
{
  const S = g.standards; const Gp = g.patterns;
  const noReq = shuffled(fresh('standards', S.cards()).filter((x) => !S.out(x, P.requires).length && g.standards.items.get(x).folder === 'concepts')).slice(0, 2);
  noReq.forEach((x) => add('none', 'standards', ['standards'], [x], `${where('standards')}, which cards does the card "${title('standards', x)}" require (its links of the type "requires")?`, []));
  const notUsed = shuffled(fresh('standards', S.cards()).filter((x) => !S.into(x, P.uses).length && g.standards.items.get(x).folder === 'concepts')).slice(0, 2);
  notUsed.forEach((x) => add('none', 'standards', ['standards'], [x], `${where('standards')}, which cards have a link of the type "uses" that points to the card "${title('standards', x)}"?`, []));
  const cards = fresh('patterns', Gp.cards()); const pairs = [];
  for (let i = 0; i < cards.length; i += 1) for (let j = i + 1; j < cards.length; j += 1) if (Gp.related(cards[i]).length && Gp.related(cards[j]).length && !Gp.related(cards[i]).some((z) => Gp.related(cards[j]).includes(z))) pairs.push([cards[i], cards[j]]);
  shuffled(pairs).slice(0, 2).forEach(([x, y]) => add('none', 'patterns', ['patterns'], [x, y], `${where('patterns')}, which cards are related to both the card "${title('patterns', x)}" and the card "${title('patterns', y)}"?`, []));
}
fs.writeFileSync(path.join(__dirname, 'questions-g.jsonl'), `${out.map((q) => JSON.stringify(q)).join('\n')}\n`);
const by = {}; out.forEach((q) => { by[q.type] = (by[q.type] || 0) + 1; });
console.log(`${out.length} questions`, by);
