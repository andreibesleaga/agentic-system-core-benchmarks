'use strict';
/** The prompt text. One shared core; each condition only adds a line about how it can reach the corpus. */
const cfg = require('./config');

/** The answer format. C3 and C4 get it in their single prompt; tool conditions get it in a closing turn (see agent.js). */
const FORMAT = `Now give the final answer to the question, using ONLY what the corpus gave you. Do not use outside knowledge.
1. Answer in one to three sentences, with the specific facts asked for (names, numbers, terms exactly as the corpus gives them).
2. Add a last line that starts with "Sources:" and lists the identifiers of the items you used. An item identifier is the last part of the item's URL, for example "graph-of-thoughts" for https://example.org/concepts/graph-of-thoughts/.
3. If what you read does not contain the answer, begin with the single word NOT_IN_CORPUS, then one sentence saying what is missing. Do not guess.`;

const CORE = (node) => `You answer one question using ONLY the knowledge published at ${cfg.NODE_NAMES[node]}.`;

const LOOK = 'You have not seen this corpus: look things up with the tools before you answer.';
const ACCESS = {
  C0: `${LOOK} You can read the site's pages with the tool fetch_page(path). Start from the home page "/". At most ${cfg.LIMITS.toolCalls} tool calls.`,
  C1: `${LOOK} You can read the site's pages with the tool fetch_page(path). Start from the home page "/". The file "/llms.txt" is the site's list of its pages for language models. At most ${cfg.LIMITS.toolCalls} tool calls.`,
  C2: `${LOOK} You can use the node's tools: search(query), read(slug), links(slug) and ask(question). At most ${cfg.LIMITS.toolCalls} tool calls.`,
  C2b: 'The items below were returned by the node\'s search tool and read tool for the question. Each is labelled [identifier] and lists the digests of its chunks. In the Sources line write each item as identifier (digest), using the first 16 digits of the digest of the chunk you used. No tools are available.',
  C3: 'The passages below were retrieved from the corpus for the question. Each passage is labelled [identifier#section]. No tools are available.',
  C4: 'The whole corpus follows as one document, in the order of the item identifiers, each item headed "### identifier". No tools are available.',
};

const system = (cond, node, preloaded) => (['C2b', 'C3', 'C4'].includes(cond)
  ? `${CORE(node)}\n${FORMAT}\n${ACCESS[cond]}` : `${CORE(node)}\n${ACCESS[cond]}${preloaded ? ' The home page "/" has already been fetched for you (see the first tool result).' : ''}`);

module.exports = { system, FORMAT };
