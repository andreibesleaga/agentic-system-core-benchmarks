### anthropic/claude-haiku-5.5

| Route | Rows | Exact set (with a card to find) | 95 % interval | Mean recall | Mean precision | "None" right | Median tokens | Errors |
|---|---|---|---|---|---|---|---|---|
| pages | 49 | 33/43 = 76.7 % | 62.3-86.8 | 83.7 % | 84.9 % | 3/6 | 20100 | 0 |
| retrieval (BM25) | 49 | 9/43 = 20.9 % | 11.4-35.2 | 28.3 % | 30.9 % | 0/6 | 1341 | 0 |
| tools without relations | 49 | 17/43 = 39.5 % | 26.4-54.4 | 60.5 % | 68.6 % | 3/6 | 25691 | 0 |
| graph tools | 49 | 25/43 = 58.1 % | 43.3-71.6 | 67.1 % | 67.8 % | 6/6 | 14381 | 0 |

### deepseek/deepseek-v4.1-flash

| Route | Rows | Exact set (with a card to find) | 95 % interval | Mean recall | Mean precision | "None" right | Median tokens | Errors |
|---|---|---|---|---|---|---|---|---|
| pages | 49 | 30/43 = 69.8 % | 54.9-81.4 | 78.5 % | 80.2 % | 3/6 | 24347 | 0 |
| retrieval (BM25) | 49 | 8/43 = 18.6 % | 9.7-32.6 | 26.3 % | 30.2 % | 2/6 | 1315 | 0 |
| tools without relations | 49 | 18/43 = 41.9 % | 28.4-56.7 | 63.5 % | 72.5 % | 3/6 | 23990 | 0 |
| graph tools | 49 | 25/43 = 58.1 % | 43.3-71.6 | 68.6 % | 70.2 % | 4/6 | 17489 | 0 |

### nvidia/nemotron-3-ultra-550b-a55b:free

| Route | Rows | Exact set (with a card to find) | 95 % interval | Mean recall | Mean precision | "None" right | Median tokens | Errors |
|---|---|---|---|---|---|---|---|---|
| retrieval (BM25) | 49 | 7/43 = 16.3 % | 8.1-30.0 | 22.2 % | 25.6 % | 1/6 | 1725 | 0 |
| graph tools | 49 | 25/43 = 58.1 % | 43.3-71.6 | 66.7 % | 66.3 % | 6/6 | 14344 | 0 |

### google/gemini-4-hydrogen (sample of six questions)

| Route | Rows | Exact set (with a card to find) | 95 % interval | Mean recall | Mean precision | "None" right | Median tokens | Errors |
|---|---|---|---|---|---|---|---|---|
| pages | 6 | 5/6 = 83.3 % | 43.6-97.0 | 83.3 % | 83.3 % | 0/0 | 9820 | 0 |
| retrieval (BM25) | 6 | 2/6 = 33.3 % | 9.7-70.0 | 38.9 % | 50.0 % | 0/0 | 968 | 0 |
| graph tools | 6 | 4/6 = 66.7 % | 30.0-90.3 | 66.7 % | 66.7 % | 0/0 | 14678 | 0 |

### openai/gpt-6.2-sol (sample of six questions)

| Route | Rows | Exact set (with a card to find) | 95 % interval | Mean recall | Mean precision | "None" right | Median tokens | Errors |
|---|---|---|---|---|---|---|---|---|
| pages | 6 | 6/6 = 100.0 % | 61.0-100.0 | 100.0 % | 100.0 % | 0/0 | 7640 | 0 |
| retrieval (BM25) | 6 | 2/6 = 33.3 % | 9.7-70.0 | 33.3 % | 33.3 % | 0/0 | 582 | 0 |
| graph tools | 6 | 6/6 = 100.0 % | 61.0-100.0 | 100.0 % | 100.0 % | 0/0 | 10115 | 0 |

### x-ai/grok-4.7 (sample of six questions)

| Route | Rows | Exact set (with a card to find) | 95 % interval | Mean recall | Mean precision | "None" right | Median tokens | Errors |
|---|---|---|---|---|---|---|---|---|
| pages | 6 | 5/6 = 83.3 % | 43.6-97.0 | 83.3 % | 83.3 % | 0/0 | 21527 | 0 |
| retrieval (BM25) | 6 | 2/6 = 33.3 % | 9.7-70.0 | 33.3 % | 33.3 % | 0/0 | 2224 | 0 |
| graph tools | 6 | 2/6 = 33.3 % | 9.7-70.0 | 33.3 % | 33.3 % | 0/0 | 15010 | 0 |

### z-ai/glm-5.3-flash

| Route | Rows | Exact set (with a card to find) | 95 % interval | Mean recall | Mean precision | "None" right | Median tokens | Errors |
|---|---|---|---|---|---|---|---|---|
| pages | 49 | 31/43 = 72.1 % | 57.3-83.3 | 86.0 % | 82.4 % | 5/6 | 18588 | 0 |
| retrieval (BM25) | 49 | 9/43 = 20.9 % | 11.4-35.2 | 29.0 % | 31.9 % | 2/6 | 1203 | 0 |
| tools without relations | 49 | 20/43 = 46.5 % | 32.5-61.1 | 67.5 % | 74.8 % | 3/6 | 16032 | 0 |
| graph tools | 49 | 25/43 = 58.1 % | 43.3-71.6 | 71.3 % | 69.5 % | 6/6 | 10374 | 0 |

### Exact answers by question type, the full runs pooled

| Type | Questions | pages | retrieval (BM25) | tools without relations | graph tools |
|---|---|---|---|---|---|
| neighbours | 8 | 23/24 = 95.8 % | 9/32 = 28.1 % | 12/24 = 50.0 % | 23/32 = 71.9 % |
| typed | 5 | 8/15 = 53.3 % | 1/20 = 5.0 % | 9/15 = 60.0 % | 12/20 = 60.0 % |
| typed-inverse | 5 | 14/15 = 93.3 % | 0/20 = 0.0 % | 12/15 = 80.0 % | 20/20 = 100.0 % |
| two-steps | 6 | 16/18 = 88.9 % | 0/24 = 0.0 % | 0/18 = 0.0 % | 16/24 = 66.7 % |
| common | 6 | 11/18 = 61.1 % | 19/24 = 79.2 % | 16/18 = 88.9 % | 24/24 = 100.0 % |
| related-in-cluster | 5 | 14/15 = 93.3 % | 0/20 = 0.0 % | 3/15 = 20.0 % | 2/20 = 10.0 % |
| closure | 2 | 0/6 = 0.0 % | 0/8 = 0.0 % | 0/6 = 0.0 % | 0/8 = 0.0 % |
| two-sites | 6 | 8/18 = 44.4 % | 4/24 = 16.7 % | 3/18 = 16.7 % | 3/24 = 12.5 % |
| none | 6 | 11/18 = 61.1 % | 5/24 = 20.8 % | 9/18 = 50.0 % | 22/24 = 91.7 % |
