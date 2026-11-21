# The first question set by model, original wording

| Model | Route | Correct (answerable) | 95 % interval | Right abstentions | Median tokens | Empty answers |
|---|---|---|---|---|---|---|
| anthropic/claude-haiku-5.5 | plain pages | 36/50 = 72.0 % | 58.3-82.5 | 10/10 | 31516 | 5 |
| anthropic/claude-haiku-5.5 | pages and llms.txt | 38/50 = 76.0 % | 62.6-85.7 | 10/10 | 22491 | 2 |
| anthropic/claude-haiku-5.5 | node tools | 50/50 = 100.0 % | 92.9-100.0 | 10/10 | 12997 | 0 |
| anthropic/claude-haiku-5.5 | retrieval (BM25) | 50/50 = 100.0 % | 92.9-100.0 | 10/10 | 1323 | 0 |
| anthropic/claude-sonnet-5.5 | plain pages | 33/40 = 82.5 % | 68.0-91.3 | 0/0 | 20513 | 0 |
| anthropic/claude-sonnet-5.5 | pages and llms.txt | 33/40 = 82.5 % | 68.0-91.3 | 0/0 | 15918 | 0 |
| anthropic/claude-sonnet-5.5 | node tools | 38/39 = 97.4 % | 86.8-99.5 | 0/0 | 10939 | 0 |
| anthropic/claude-sonnet-5.5 | retrieval (BM25) | 39/39 = 100.0 % | 91.0-100.0 | 0/0 | 1205 | 0 |
| deepseek/deepseek-v4.1-flash | plain pages | 37/50 = 74.0 % | 60.4-84.1 | 10/10 | 19285 | 0 |
| deepseek/deepseek-v4.1-flash | pages and llms.txt | 38/50 = 76.0 % | 62.6-85.7 | 10/10 | 18578 | 0 |
| deepseek/deepseek-v4.1-flash | node tools | 50/50 = 100.0 % | 92.9-100.0 | 10/10 | 8785 | 0 |
| deepseek/deepseek-v4.1-flash | retrieval (BM25) | 50/50 = 100.0 % | 92.9-100.0 | 10/10 | 861 | 0 |
| gemma3:4b | retrieval (BM25) | 47/50 = 94.0 % | 83.8-97.9 | 8/10 | 811 | 0 |
| qwen2.5-coder:7b | plain pages | 0/50 = 0.0 % | 0.0-7.1 | 10/10 | 12594 | 0 |
| qwen2.5-coder:7b | pages and llms.txt | 0/50 = 0.0 % | 0.0-7.1 | 10/10 | 21467 | 0 |
| qwen2.5-coder:7b | node tools | 1/50 = 2.0 % | 0.4-10.5 | 10/10 | 14741 | 0 |
| qwen2.5-coder:7b | retrieval (BM25) | 49/50 = 98.0 % | 89.5-99.6 | 10/10 | 767 | 0 |

Rows of seed 1 (the original wording of each question). The hosted runs of 17-18 Nov stopped at their token caps, so Claude Sonnet 5.5 has fewer questions. `deepseek/deepseek-v4.1-flash` ran on 21 Nov 2026 with an answer limit of 1,500 tokens (it reasons before it answers); the earlier runs had 400. An empty answer counts as wrong.
