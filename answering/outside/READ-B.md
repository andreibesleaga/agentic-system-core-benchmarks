### anthropic/claude-haiku-5.5

| Route | Program (strict wording) | After the reading | 95 % interval | Rejected rows read | Overturned | Right abstentions | Median tokens |
|---|---|---|---|---|---|---|---|
| plain pages | 22/50 = 44.0 % | 30/50 = 60.0 % | 46.2-72.4 | 28 | 8 | 7/10 | 32741 |
| pages and llms.txt | 22/50 = 44.0 % | 35/50 = 70.0 % | 56.2-80.9 | 28 | 13 | 8/10 | 27000 |
| node tools | 35/50 = 70.0 % | 46/50 = 92.0 % | 81.2-96.8 | 15 | 11 | 10/10 | 13022 |
| retrieval (BM25) | 42/50 = 84.0 % | 48/50 = 96.0 % | 86.5-98.9 | 8 | 6 | 10/10 | 1222 |

### deepseek/deepseek-v4.1-flash

| Route | Program (strict wording) | After the reading | 95 % interval | Rejected rows read | Overturned | Right abstentions | Median tokens |
|---|---|---|---|---|---|---|---|
| plain pages | 28/50 = 56.0 % | 36/50 = 72.0 % | 58.3-82.5 | 22 | 8 | 6/10 | 19466 |
| pages and llms.txt | 32/50 = 64.0 % | 37/50 = 74.0 % | 60.4-84.1 | 18 | 5 | 7/10 | 19724 |
| node tools | 42/50 = 84.0 % | 48/50 = 96.0 % | 86.5-98.9 | 8 | 6 | 10/10 | 10579 |
| retrieval (BM25) | 44/50 = 88.0 % | 48/50 = 96.0 % | 86.5-98.9 | 6 | 4 | 10/10 | 803 |

### google/gemini-4-hydrogen (sample of six answerable questions)

| Route | Program (strict wording) | After the reading | 95 % interval | Rejected rows read | Overturned | Right abstentions | Median tokens |
|---|---|---|---|---|---|---|---|
| plain pages | 3/6 = 50.0 % | 6/6 = 100.0 % | 61.0-100.0 | 3 | 3 | - | 16580 |
| node tools | 5/6 = 83.3 % | 6/6 = 100.0 % | 61.0-100.0 | 1 | 1 | - | 6121 |
| retrieval (BM25) | 6/6 = 100.0 % | 6/6 = 100.0 % | 61.0-100.0 | 0 | 0 | - | 998 |

### openai/gpt-6.2-sol (sample of six answerable questions)

| Route | Program (strict wording) | After the reading | 95 % interval | Rejected rows read | Overturned | Right abstentions | Median tokens |
|---|---|---|---|---|---|---|---|
| plain pages | 3/6 = 50.0 % | 5/6 = 83.3 % | 43.6-97.0 | 3 | 2 | - | 14095 |
| node tools | 5/6 = 83.3 % | 6/6 = 100.0 % | 61.0-100.0 | 1 | 1 | - | 4236 |
| retrieval (BM25) | 4/6 = 66.7 % | 6/6 = 100.0 % | 61.0-100.0 | 2 | 2 | - | 745 |

### x-ai/grok-4.7 (sample of six answerable questions)

| Route | Program (strict wording) | After the reading | 95 % interval | Rejected rows read | Overturned | Right abstentions | Median tokens |
|---|---|---|---|---|---|---|---|
| plain pages | 3/6 = 50.0 % | 4/6 = 66.7 % | 30.0-90.3 | 3 | 1 | - | 24492 |
| node tools | 6/6 = 100.0 % | 6/6 = 100.0 % | 61.0-100.0 | 0 | 0 | - | 12707 |
| retrieval (BM25) | 6/6 = 100.0 % | 6/6 = 100.0 % | 61.0-100.0 | 0 | 0 | - | 2128 |

Rejected rows without a reading: 0. Accepted rows the reading overturned: 0 of 34 read (Claude Haiku 5.5).
The program rejects an answer when a fact is not present word for word or when the first 200 characters hold a refusal phrase; the reading accepts an answer that states the fact in other words.
