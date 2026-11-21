| Route | Program (strict wording) | After the reading | 95 % interval | Rejected rows read | Overturned |
|---|---|---|---|---|---|
| plain pages | 22/50 = 44.0 % | 30/50 = 60.0 % | 46.2-72.4 | 28 | 8 |
| pages and llms.txt | 22/50 = 44.0 % | 35/50 = 70.0 % | 56.2-80.9 | 28 | 13 |
| node tools | 35/50 = 70.0 % | 46/50 = 92.0 % | 81.2-96.8 | 15 | 11 |
| retrieval (BM25) | 42/50 = 84.0 % | 48/50 = 96.0 % | 86.5-98.9 | 8 | 6 |

Rejected rows without a reading: 0. Accepted rows the reading overturned: 0 of 34 read.
The program rejects an answer when a fact is not present word for word or when the first 200 characters hold a refusal phrase; the reading accepts an answer that states the fact in other words.
