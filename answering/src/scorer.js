'use strict';
/**
 * Mechanical scoring. No model judges anything. Pure functions: the same input gives the same output.
 * A question row: { id, kind: 'single'|'two'|'unanswerable', gold: [slug], facts: [regex source] }.
 */

const ABSTAIN = /NOT[_ ]IN[_ ]CORPUS/i;
/** Plain-words refusals, accepted when a model does not use the agreed token. */
const REFUSAL = /\b(does not|doesn't|do not|don't|did not|didn't) (contain|state|specify|mention|provide|say|give|include|cover|have)\b|\bnot (stated|specified|mentioned|provided|available|found|included|covered)\b|\bno (information|mention|data|details)\b|\b(cannot|can't|can not|unable to) (find|answer|determine|locate)\b|\bnot possible to (answer|determine)\b/i;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True when the answer declines: the agreed token, or a plain refusal in its first 200 characters. */
function abstained(answer) {
  const a = String(answer || '');
  return ABSTAIN.test(a) || REFUSAL.test(a.slice(0, 200));
}

/** Every fact (a regular expression, case-insensitive) must match the answer. */
function factsPresent(answer, facts) {
  return facts.length > 0 && facts.every((f) => new RegExp(f, 'i').test(answer));
}

/** The text from the last "Sources:" label to the end of the answer (a list may follow on later lines), or ''. */
function sourcesLine(answer) {
  const lines = String(answer || '').split('\n');
  let at = -1;
  lines.forEach((l, i) => { if (/^\W*sources?\s*:/i.test(l.trim())) at = i; });
  return at < 0 ? '' : lines.slice(at).join('\n');
}

/**
 * Items named by an answer. Counted: a URL of the item anywhere; the slug or the exact title inside the
 * "Sources:" line. A bare common word such as "link" in running text is not a citation.
 * @param {string} answer @param {Map<string,{slug:string,title:string}>} items
 */
function citedItems(answer, items) {
  const src = sourcesLine(answer).toLowerCase().replace(/^[^:]*:/, '');
  const all = String(answer || '').toLowerCase();
  const out = [];
  for (const [slug, it] of items) {
    const word = new RegExp(`(^|[^a-z0-9-])${escapeRe(slug.toLowerCase())}($|[^a-z0-9-])`);
    const url = new RegExp(`/(concepts|procedures|clusters|pages)/${escapeRe(slug.toLowerCase())}(/|\\.md|$|[^a-z0-9-])`);
    const titled = it.title && new RegExp(`(^|[^a-z0-9-])${escapeRe(String(it.title).toLowerCase())}($|[^a-z0-9-])`).test(src);
    if (url.test(all)) out.push(slug);
    else if (word.test(src) || titled) out.push(slug);
  }
  return out;
}

/** A citation is verifiable when the answer carries a hex digest that is a prefix of a gold chunk digest or id. */
function verifiable(answer, goldDigests) {
  const hexes = String(answer || '').toLowerCase().match(/[0-9a-f]{16,64}/g) || [];
  return hexes.some((h) => goldDigests.some((d) => d.startsWith(h)));
}

/**
 * @returns {{correct:boolean, cited_all:boolean, cited_any:boolean, abstained:boolean,
 *            correct_abstention:boolean|null, false_abstention:boolean|null, verifiable:boolean, cited_ids:string[]}}
 */
function scoreAnswer(q, answer, ctx) {
  const abst = abstained(answer);
  const cited = citedItems(answer, ctx.items);
  if (q.kind === 'unanswerable') {
    return { correct: false, cited_all: false, cited_any: false, abstained: abst, correct_abstention: abst,
      false_abstention: null, verifiable: false, cited_ids: cited };
  }
  const correct = !abst && factsPresent(answer, q.facts);
  const digests = q.gold.flatMap((g) => (ctx.items.get(g) || { digests: [] }).digests);
  return {
    correct, abstained: abst, correct_abstention: null, false_abstention: abst, cited_ids: cited,
    cited_all: q.gold.every((g) => cited.includes(g)), cited_any: q.gold.some((g) => cited.includes(g)),
    verifiable: q.gold.every((g) => cited.includes(g)) && verifiable(answer, digests),
  };
}

/** A fact must never be readable from the question itself. Returns the offending facts. */
function leakedFacts(q) {
  return (q.facts || []).filter((f) => new RegExp(f, 'i').test(q.q));
}

module.exports = { scoreAnswer, abstained, factsPresent, sourcesLine, citedItems, verifiable, leakedFacts };
