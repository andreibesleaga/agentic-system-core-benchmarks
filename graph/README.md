# The graph study: questions about relations between cards

The answering study asks for facts that one or two items state. This study asks for something a passage does not
state: which cards are related to which. It was run on 21 and 22 Nov 2026 over three sites (the patterns site, the
Standards Map and the format's own site), with the harness of the answering study.

## Questions

`questions-g.jsonl` holds 49 questions. A script made them from the graphs the sites publish (`graph.nq`), by fixed
templates and a seed (`make-questions.js`); no model wrote a question or an answer. The right answer of each is a
set of cards, read from the graph. The file was frozen before any run (`FROZEN-G.sha256`).

| Type | Questions | What it asks |
|---|---|---|
| neighbours | 8 | every card linked to a card as related, in either direction |
| typed | 5 | the cards a card uses, requires or implements |
| typed-inverse | 5 | the cards that use or require a card |
| two-steps | 6 | the cards two related links away from a card |
| common | 6 | the cards related to both of two cards |
| related-in-cluster | 5 | the related cards that are in one cluster |
| closure | 2 | everything a card depends on, directly or through other cards |
| two-sites | 6 | a relation on one site and the meaning of a term on the format's own site |
| none | 6 | the same kinds of question where no card fits |

## Routes

Every route may read all three sites, with at most eight tool calls and 3,500 characters per tool result.

| Route | What the model gets |
|---|---|
| pages | `fetch_page(url)`: the HTML pages, as text |
| retrieval (BM25) | the top five passages of all three sites in one prompt, no loop |
| tools without relations | `search`, `read`, `ask` of each site's tool server |
| graph tools | the same, plus `links`, `explain` and `compose` (the typed links of the published graph) |

## Result

Share of the 43 questions with a card to find whose answer is exactly the right set, and the six "none" questions.

| Model | pages | retrieval (BM25) | tools without relations | graph tools |
|---|---|---|---|---|
| `anthropic/claude-haiku-5.5` | 76.7 % (none 3/6) | 20.9 % (0/6) | 39.5 % (3/6) | 58.1 % (6/6) |
| `deepseek/deepseek-v4.1-flash` | 69.8 % (3/6) | 18.6 % (2/6) | 41.9 % (3/6) | 58.1 % (4/6) |
| `z-ai/glm-5.3-flash` | 72.1 % (5/6) | 20.9 % (2/6) | 46.5 % (3/6) | 58.1 % (6/6) |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | not run | 16.3 % (1/6) | not run | 58.1 % (6/6) |

Median tokens of one answer: pages 18,588 to 24,347; graph tools 10,374 to 17,489; retrieval 1,203 to 1,725.
`TABLE-G.md` has every figure, the intervals, recall and precision, and the table by question type.

What the figures say:

- **Passages do not carry relations.** Retrieval of passages answered 16 to 21 %. The relations have to be published.
- **Pages did best**, 70 to 77 %. The engine builds each card's page from the same graph, so the page lists the
  related cards in both directions, by title, and names the card's cluster. A model that reads the page reads the graph.
- **The graph tools answered 58 %** with every model, 12 to 19 points more than the same tools without the relation
  tools, at about a third fewer tokens than pages. They were right on 22 of 24 "none" questions (pages: 11 of 18) and
  on every question about inverse typed links and common neighbours (pages: 93 % and 61 %).
- **Where the graph tools fell short** (related cards in a cluster 10 %, two sites 12.5 %, neighbours 72 %): `links`
  returns identifiers, without titles and without cluster membership, and `read` cuts the item before its cluster.
  The model then guesses a title or cannot find the cluster. That is a gap in the tools as shipped in engine 1.1.0,
  and the pages do not have it.
- **Dependency chains** (closure) were answered by no route: the two questions need the model to follow `uses` links
  through another card, and none did.

Three high-priced models ran six of the questions (one per type; `sample-top.json`) by three routes, at low reasoning
effort: `openai/gpt-6.2-sol` pages 6/6, graph tools 6/6, retrieval 2/6; `google/gemini-4-hydrogen` 5/6, 4/6, 2/6;
`x-ai/grok-4.7` 5/6, 2/6, 2/6. Six questions show a direction, not a rate.

## Scoring

`lib.js` (`scoreList`) reads the line that starts with "Answer:". A card counts as named by its title, by its title
without a part in parentheses or a leading article, or by its identifier. An answer is exact when it names every
card of the right set and no other card of the sites asked; "none" questions need the word NONE. `tests/score.test.js`
covers the rules. Scores are recomputed from the stored answers by `report.js`.

Two rules were changed during the runs and applied to every route and model. The questions did not change.

1. After about 40 rows of the first model: the scorer had accepted titles only. The `links` tool returns
   identifiers, and models turn them into names ("Canary and Shadow Prompts" for "Canary and Shadow Deployment for
   Prompts and Models"), so identifiers are accepted too. Scores are recomputed from the stored answers, so this
   needed no new run.
2. Some models write the answer in their working turn and then return an empty final answer. After the same 40
   rows the harness asked once more; after the full tables showed 17 empty answers on the graph-tool route and none
   on pages, it asks once more without the working turn. The 26 rows whose answer was empty then (every route but
   the one-prompt route) were run again. 25 rows are still empty, mostly on the one-prompt route with models that
   reason before they answer, and count as wrong.

## Limits

- The right answers come from the graph the tools read, so the graph tools are measured against their own data; the
  pages and the passages come from the same build.
- 49 questions from templates, three small sites of one author; one pass per model; intervals are wide.
- The pages of this engine show the relations. Pages of another site generator may not.
- The high-priced models ran six questions each.

## Re-run

Tables, no model and no network (set `BENCH_SCRATCH` to a folder prepared by `../answering/src/setup.sh`, with the
Standards Map added as `www-standards` and `src-standards`; the standards repository at commit `f170bf4`):

```sh
node graph/report.js            # TABLE-G.md
node --test graph/tests/*.test.js
```

A new run: `node graph/run.js --model <model> [--routes P,R,T,G] [--only g01,g02]` with `LLM_BASE_URL` and
`LLM_API_KEY` in the environment; `LLM_USD_BUDGET` stops the run at a sum of money. The runs here used
`BENCH_MAX_ANSWER_TOKENS=1500`, and `BENCH_REASONING=low` for the three high-priced models. All runs of 21 and
22 Nov 2026 together cost USD 3.51.
