# Answering study: node tools, plain pages, llms.txt and retrieval, November 2026

Run on 17 and 18 November 2026. Every number below is generated from `results/*.jsonl` by `node src/report.js`. The choices behind the harness are in `DECISIONS.md`. Nothing was tuned to favour any condition; where the harness was wrong it was fixed and the affected rows were discarded or kept as a separate condition (DECISIONS 25-33). The summary below describes the local model `qwen2.5-coder:7b`; the tables also hold the rows of the other models.

## 1. One-screen summary

**Question.** Does a small local model find, check and cite facts better when the knowledge is a node than when it is plain pages, pages plus `llms.txt`, or ordinary retrieval over the same Markdown?

**Answer, observed under this configuration** (model `qwen2.5-coder:7b`, temperature 0, 8,192-token context, at most 8 tool calls, 60 questions on two small public nodes): no benefit of the node was demonstrated, and two results go against it.

1. **Driving the node's tools did not help this model.** Correct answers: node tool loop (C2) 1.0 % [0.0, 3.0]; plain pages (C0) 0.0 % [0.0, 0.0]; pages with `llms.txt` (C1) 1.0 % [0.0, 3.0]. Differences between C2 and C0 or C1: at most 1 question in 50, sign test p = 1.000. The model could not drive any of the three tool loops (section 4).
2. **Ordinary retrieval was the better choice for this model.** BM25 passages in the prompt (C3): 94.0 % correct [89.3, 98.0], median 770 tokens and 2.7 s per answer. The node's tool loop (C2): 1.0 % correct at a median 14,741 tokens. The paired difference is 0.93 [0.88, 0.97] on 50 questions (C3 higher on all 50). When the harness gave the model the node's own search and read results in the prompt in one step (C2b, no loop), it reached 84.0 % [75.3, 91.3] at a median 2,055 tokens, which is 10.0 points [4.0, 17.3] below C3 (1 question higher, 11 lower, 38 tied; sign test p = 0.006, Holm-adjusted 0.29).
3. **One capability exists only on the node side, and it works.** The node's `read` tool returns chunk digests that match the published `chunks.jsonl` (50 of 50 gold reads). When a model was told to write a digest next to an identifier (C2b), 54.7 % [42.7, 66.0] of its answers on answerable questions carried a gold citation with a matching digest (gemma3:4b: 20.7 % [12.7, 28.7]). No other condition's material contains a digest, so this is a capability difference and not an accuracy result.

### Main table (answerable n = 50 questions, unanswerable n = 10; intervals are 95 % bootstrap over questions for percentages and over runs for the medians; tokens = prompt + completion, summed over all calls of one answer)

{{main}}

Rows: C0, C0h, C1, C1h, C2, C2u: seeds 1 and 2 (120 rows each). C2b, C3, C4: seeds 1, 2, 3 (180 rows each). Seed 3 of the tool conditions was not run (section 7). A seed is also a wording: seed 1 the question as written, seeds 2 and 3 the two gemma3:4b paraphrases. C2b makes 6 harness calls per answer (1 search, 5 reads) that are not counted as model tool calls.

**Read the abstention column with care.** The tool loops answer `NOT_IN_CORPUS` almost every time (section 4), so they "abstain correctly" on 10 of 10 unanswerable questions for the wrong reason. Their false-abstention rate on answerable questions is 87-100 % (table in section 2).

**Cost per answer, plainly.** Median tokens for one answer, qwen2.5-coder:7b: C3 retrieval 770; C2b node one-shot 2,055; C0h and C1h 2,441 and 2,477 (the model rarely calls a tool when the home page is already in front of it); C4 paste-everything 7,084; C0 13,339; C2u 14,552; C2 node tools 14,741; C1 21,474. The node's tool loop costs 19 times the tokens of retrieval and returned a correct answer in 1 of 120 runs.

**Is ordinary retrieval the better choice for a small model?** In this study, yes: it gave the highest correct rate, the lowest token cost, the highest citation rate (68.7 % [56.7, 80.0] of answers named all gold items), and it abstained correctly on 10 of 10 unanswerable questions. This is measured on 50 questions written from the item texts, so their words overlap the items' words, which favours any lexical method (section 6).

## 2. More columns

{{extra}}

C4 is the whole corpus pasted into an 8,192-token context. For the demonstration node only 28 of its 50 items fit; the main site's 14 items fit entirely.

{{truncation}}

## 3. Paired comparisons

Unit: the question (mean over the seeds that were run). Difference = the condition named before "vs" minus the one after it. "Higher / lower / tied" counts questions. The permutation column is the engine's sign-flip test; the Holm column corrects the sign test over every row of this table. The rows that matter for the question:

- **C2 vs C0 and C1 (node tools vs plain pages):** correct +0.010 [0.000, 0.030] and 0.000 [-0.030, 0.030]; citation +0.050 [0.010, 0.100] and +0.040 [0.000, 0.090]. In effect no difference.
- **C2 vs C3 (node tools vs retrieval):** correct -0.930 [-0.973, -0.880], 0 higher / 50 lower; tokens +21,592 [18,463, 24,856] per answer.
- **C2b vs C3 (node content in the prompt vs BM25 passages, the like-for-like pair):** correct -0.100 [-0.173, -0.040]; citation -0.140 [-0.273, -0.007]; tokens +1,074. C2b gives whole items (cut to 1,400 characters) and their chunk digests; C3 gives five chunks.
- **C2u vs C2 (same tools, content shown without the JSON envelope):** correct +0.120 [0.040, 0.210], 8 higher / 1 lower / 41 tied, sign p = 0.039 (not significant after Holm correction). Part of the failure of C2 is the output format, not the content.
- **C0h vs C0, C1h vs C1 (home page given to the model):** no change in correctness.
- **C3 vs C4 (retrieval vs paste everything):** correct +0.213 [0.113, 0.327], tokens -4,885.

{{compare}}

## 4. Failures and surprises (including every failure of the node)

**The tool conditions failed because the model could not drive a tool loop, not because tool results did not reach it.** From the raw rows:

{{loops}}

- The model never opened with the home page when told to (0 of 240 runs in C0 and C1) and invented page names such as `/concepts/MASS-method/`; every one of those returned "No such page". See `reports/transcript-q01-C0.txt`.
- More than half of its tool calls repeat an earlier call with the same arguments; in C2, 81 %. See `reports/transcript-q03-C2.txt`: the model read the right item (`agents-as-tools`) five times, then answered `NOT_IN_CORPUS`.
- When the harness put the home page in front of the model (C0h, C1h), it made no tool call in most runs and abstained.
- With the node's JSON envelope as the tool result, a direct replay of one run had the model abstain; with the same item as plain text it answered correctly. C2u (content without the envelope) rose from 1.0 % to 13.0 % [5.0, 22.0]. The envelope of `read` repeats metadata for every chunk (digest, licence, terms) and escapes newlines, which costs a small model. This is a property of the output as served; a harness can strip it, but a plain page does not need that.
- The tool results are cut to 3,500 characters (the same for all) and the harness stops tool calls when the prompt nears the 8,192-token context: that happened in 40 % of C0 runs and 28 % of C2 runs. A model with a larger window would not hit it.

**Other findings about the node and the harness**

- **`agsc mcp` serves held-back drafts.** Run on a copy of the demonstration node's source, `read` returned draft items that are not published (103 draft items in the source folder). A node that holds items back must hand the tool server only the published items. The study deleted the drafts in its scratch copy so that C2 saw what the site shows.
- **The site's own build could not be repeated without the site pipeline's git-log file** (AGSC-E901: the home page links `/ledger.jsonl` and `/changelog/`). The committed build of 13 Nov (engine 1.1.0) was used.
- **The `search` tool returns only titles, slugs and scores, not text**, so an agent needs a second call per item. A harness that did this for it (C2b) made 6 calls.
- **C4 (paste everything) fails on the cut-off part of the corpus.** Gold item in the pasted text: 89 % correct (109/123); gold item cut off: 0 % (0/27). This depends on the context limit; a longer context removes it for this corpus (11,159 tokens of item text).
- **Citation is the weak point of the small models in every condition.** With C3 the model cites all gold items in 68.7 % of answers; with C4 26.0 %. It also invents identifiers (for example `burns-et-al-2023` with a made-up digest, found in the hand check), which the scorer counts as no citation.
- **C2b's initial pass was invalid** (the answer format was missing from its prompt, DECISIONS 32); its 360 rows were discarded and the condition re-run.
- **Wall time is noisy**: another process shared the CPU for part of the initial pass, and the machine clock moved backwards during some runs (30 rows with a non-positive time are left out of the seconds column).

## 5. Checks of the scoring

- **Hand check, 30 random rows** (seeded sample of the final rows; judged by Claude, the model that wrote the questions, not by an independent person): the mechanical correct/abstention verdict and the hand verdict agreed on 30 of 30 (`results/handcheck.jsonl`; `node src/handcheck.js agree`). The check covers correctness and abstention; citations were read but not scored separately. An earlier 30-row check on a previous version of the rows also agreed 30 of 30 (the file is not part of this package), and a 10-row leniency check of C3/C4 answers found 10 of 10 acceptable (`results/handcheck-c3c4-leniency.md`).
- **Re-score from scratch:** `node src/report.js` re-scores every stored answer with `src/scorer.js` and rebuilds all tables from the raw rows, so the numbers here are the numbers of the rows. The scorer was changed after the smoke run (a `Sources:` list on later lines now counts) and during its tests (a title match inside the word "Sources"); no question was changed after the freeze (hash in `questions/FROZEN.sha256`).
- **No-model measurements** (no model, 50 answerable questions):

{{nomodel}}

## 6. Limitations

- **Small local models.** `qwen2.5-coder:7b` (4-bit) and `gemma3:4b`. The tool conditions measure the model's tool use more than the node. A stronger model may drive the tool loops and change the picture; this study cannot say.
- **Same-author questions.** All 60 were written by the model Claude (Sonnet 5.5) from the item texts, then paraphrased by `gemma3:4b`. Questions copy the item's facts and often its vocabulary, which helps lexical retrieval (BM25 top-5 held every gold item for 50 of 50 questions, with no model). Questions that need a synonym or a reading across items would be harder for C3. No outside annotator wrote or checked a question.
- **Two small corpora.** 50 patterns items and 14 main-site items. A body of knowledge of thousands of items changes C3 and C4 most.
- **One machine, one run order, two seeds for tool conditions.** Seeds change the wording, not the sampling (temperature 0). Wording and seed are confounded. The 3,500-character tool-result limit and the 8,192-token context apply to every condition and favour short answers.
- **Lexical baselines only.** No embedding retrieval. C3 uses MiniSearch (BM25 family) with default scoring and a short stop list.
- **C4 is cut by the context limit**, by design, so it tests the limit as much as the idea.
- **C2 exposes four of the ten tools** (search, read, links, ask); the other six write or compose.
- **Citation scoring needs a `Sources:` block or a URL** and counts a slug or an exact title; a model that cites in another style loses citation credit but keeps correctness.
- **C2b gives items, C3 gives chunks.** The node's `read` returns whole items; they were cut to 1,400 characters, which can drop a fact.
- **No judge model** and no grader other than the program and the model that did the hand check.

## 7. What was not done

- Seed 3 for C0, C0h, C1, C1h, C2 and C2u of the local models (each has seeds 1 and 2, 120 rows). Their correct rate was 0-13 % in both seeds that were run.
- The 8-call loops were not repeated with a larger tool-result limit or context for the local models; the diagnosis suggests the model, not these limits, is the main cause, but this was not tested.
- No run with the other 6 node tools and no run with embedding retrieval.
- The hosted-model runs stopped at their token caps (anthropic/claude-haiku-5.5: 14,000,000 tokens; anthropic/claude-sonnet-5.5: 3,000,000). Their rows are incomplete; the Rows column of the main table gives each count. The Sonnet run covers one seed only and ended inside the tool conditions of seed 1.

## 8. Hosted models

The same harness ran two hosted models through an OpenAI-compatible endpoint (`paid-run.sh`, which needs `LLM_API_KEY` in the environment). They used a 32,768-token context so that C4 holds the whole corpus. The tables above include their rows next to the local models. Read the intervals with the row counts in mind. Where every answer in a cell was correct, the interval has no width.

## 9. Time

The local-model rows were run on 17 and 18 November 2026, about 6.5 hours of wall time on one machine (a 6 GB GPU, 16 cores). The hosted-model rows were run on 18 November 2026. Rows in the report: see the Rows column above. Smoke-test rows and the discarded C2b rows (DECISIONS 32) are not part of this package.
