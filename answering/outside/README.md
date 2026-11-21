# The outside check: a second question set and a second reading

The first question set of the answering study was written by Claude Sonnet 5.5, a model of the same family as two of
the models that answered it. This folder repeats the main comparison on questions written by a model of another
family, and adds a second reading of the scores. Run on 20 and 21 Nov 2026 with the harness of the study, unchanged
except for one option (`src/runner.js --questions <file>`).

## Result

Claude Haiku 5.5, the original wording of each question (seed 1), 50 answerable and 10 unanswerable questions.

| Route | Program (strict wording) | After the reading | 95 % interval | Right abstentions | Median tokens |
|---|---|---|---|---|---|
| Plain pages | 22/50 = 44.0 % | 30/50 = 60.0 % | 46.2-72.4 | 7/10 | 32,741 |
| Pages and `llms.txt` | 22/50 = 44.0 % | 35/50 = 70.0 % | 56.2-80.9 | 8/10 | 27,000 |
| Node tools | 35/50 = 70.0 % | 46/50 = 92.0 % | 81.2-96.8 | 10/10 | 13,022 |
| Retrieval (BM25) | 42/50 = 84.0 % | 48/50 = 96.0 % | 86.5-98.9 | 10/10 | 1,222 |

On the first question set, same model and seed, the program's scores were 72.0, 76.0, 100.0 and 100.0 %
(`TABLE-B.md` shows both sets side by side).

What the two columns mean:

- **Program.** `src/scorer.js` accepts an answer when every fact of the question is present word for word and the
  first 200 characters hold no refusal phrase. The questions of this set quote their facts from the item text, so an
  answer that states a fact in other words is rejected: "confirmed resolutions and assumed resolutions" for
  "confirmed and assumed resolutions", or a class name without the backticks of the source.
- **After the reading.** A reader read all 79 answers the program rejected and 34 of the 121 it accepted, each against
  the gold item's text at the commit the study used, with the route hidden. All 34 accepted answers were confirmed;
  38 of the 79 rejected answers state the fact the question asks for and were counted as correct. The program's
  score is therefore a floor.

The reader was a language model, Claude Fable 5.2: newer than the model that answered, from the same vendor, and from
another family than the model that wrote the questions. It is a second, model-based reading, not a grading by a
person. The rule it applied and the answers it read are in the files below, so anyone can read them again.

## Files

| File | What it is |
|---|---|
| `write-questions.js` | Writes the question set with `google/gemini-3.8-flash` from the published item texts (seed 20261120). A question is kept only when each fact appears word for word in its gold item and cannot be read from the question. |
| `questions-b.jsonl`, `FROZEN-B.sha256` | The 60 questions (same mix as the first set) and their hash, taken before any answering run. |
| `results/runs-b-anthropic_claude_haiku_5.5.jsonl`, `results/run-b.log` | The 240 raw rows (60 questions by four routes) and the run log. |
| `report-b.js`, `TABLE-B.md` | The program's scores for both sets, by route. |
| `grading-sheet.js`, `GRADE-50.md`, `grade-50-key.json` | A seeded sample of 50 answers with the route hidden, the reader's grade under each, and the key (route and program score). |
| `agreement.js` | Agreement between the grades in `GRADE-50.md` and the program: 43 of 50, Cohen's kappa 0.64; all seven disagreements are answers the program rejected and the reader accepted. |
| `rejected-read.json`, `read-table.js`, `READ-B.md` | The reading of the other 63 rejected answers, and the table after the reading. |

## Re-run

No model and no network are needed for the tables:

```sh
cd answering
node outside/report-b.js      # TABLE-B.md
node outside/agreement.js     # agreement on the sample of 50
node outside/read-table.js    # READ-B.md
```

`grading-sheet.js` and a new answering run need the set-up of the study (`../README.md`, "Inputs"). Running
`grading-sheet.js` again overwrites `GRADE-50.md` with an empty sheet.

## Limits

- One answering model, one pass, 50 answerable questions: the intervals are wide.
- The reading covers every rejected answer and a sample of the accepted ones. The first question set was not read
  again; its facts were written to allow for wording, and a reading of 30 of its rows agreed with the program on all 30.
- The reader is a model from the vendor of the answering model. The route was hidden, and the reader checked each
  answer against the item text, but a reading by a person would be stronger evidence.
- The sites, the harness and the first question set are the project's own.
