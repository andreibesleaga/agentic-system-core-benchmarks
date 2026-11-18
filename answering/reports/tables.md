## main

| Model | Condition | Rows | Correct % (answerable, n=50 questions) | Cited % (all gold items) | Correct abstention % (n=10) | Median tool calls | Median tokens | Median seconds |
|---|---|---|---|---|---|---|---|---|
| anthropic/claude-haiku-5.5 | C0 | 139 | 67.3 [55.0, 79.0] | 57.7 [44.7, 70.3] | 100.0 [100.0, 100.0] | 6.0 [4.0, 6.0] | 29559 [20921, 33107] | 8.3 [6.7, 9.6] |
| anthropic/claude-haiku-5.5 | C1 | 139 | 73.3 [61.7, 84.0] | 72.3 [61.3, 82.7] | 100.0 [100.0, 100.0] | 4.0 [4.0, 6.0] | 22589 [22170, 30204] | 6.5 [6.0, 7.9] |
| anthropic/claude-haiku-5.5 | C2 | 138 | 98.0 [95.3, 100.0] | 97.0 [93.3, 100.0] | 100.0 [100.0, 100.0] | 3.0 [3.0, 4.0] | 12983 [12463, 13060] | 4.5 [4.4, 4.7] |
| anthropic/claude-haiku-5.5 | C2u | 138 | 98.0 [94.7, 100.0] | 94.7 [88.7, 99.3] | 100.0 [100.0, 100.0] | 4.0 [3.0, 4.0] | 9800 [8897, 9996] | 4.6 [4.3, 4.8] |
| anthropic/claude-haiku-5.5 | C2b | 138 | 91.0 [84.0, 97.0] | 91.0 [83.7, 97.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 3137 [3105, 3181] | 1.6 [1.5, 1.7] |
| anthropic/claude-haiku-5.5 | C3 | 138 | 97.3 [94.7, 99.3] | 97.3 [92.7, 100.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 1311 [1271, 1350] | 1.2 [1.2, 1.3] |
| anthropic/claude-haiku-5.5 | C4 | 138 | 98.7 [96.7, 100.0] | 97.7 [94.7, 100.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 19856 [19836, 19873] | 1.3 [1.3, 1.4] |
| anthropic/claude-sonnet-5.5 | C0 | 40 | 82.5 [70.0, 92.5] | 77.5 [65.0, 90.0] | n/a | 4.0 [4.0, 5.0] | 20513 [20182, 24057] | 6.4 [6.0, 7.9] |
| anthropic/claude-sonnet-5.5 | C1 | 40 | 82.5 [70.0, 92.5] | 82.5 [70.0, 92.5] | n/a | 4.0 [3.0, 5.0] | 15918 [14125, 25898] | 5.5 [5.1, 6.1] |
| anthropic/claude-sonnet-5.5 | C2 | 39 | 97.4 [92.3, 100.0] | 100.0 [100.0, 100.0] | n/a | 3.0 [3.0, 3.0] | 10939 [9470, 12851] | 4.9 [4.6, 5.2] |
| anthropic/claude-sonnet-5.5 | C2b | 39 | 100.0 [100.0, 100.0] | 100.0 [100.0, 100.0] | n/a | 0.0 [0.0, 0.0] | 2986 [2917, 3021] | 1.1 [1.1, 1.2] |
| anthropic/claude-sonnet-5.5 | C3 | 39 | 100.0 [100.0, 100.0] | 97.4 [92.3, 100.0] | n/a | 0.0 [0.0, 0.0] | 1205 [1091, 1315] | 1.0 [1.0, 1.1] |
| anthropic/claude-sonnet-5.5 | C4 | 39 | 100.0 [100.0, 100.0] | 100.0 [100.0, 100.0] | n/a | 0.0 [0.0, 0.0] | 19785 [19766, 19796] | 1.2 [1.2, 1.2] |
| gemma3:4b | C2b | 180 | 83.3 [73.3, 92.0] | 30.0 [21.3, 39.3] | 63.3 [36.7, 86.7] | 0.0 [0.0, 0.0] | 2159 [2137, 2176] | 2.6 [2.5, 2.8] |
| gemma3:4b | C3 | 180 | 92.0 [84.7, 98.0] | 46.0 [35.3, 56.7] | 66.7 [43.3, 86.7] | 0.0 [0.0, 0.0] | 815 [799, 862] | 1.6 [1.5, 1.7] |
| gemma3:4b | C4 | 180 | 72.0 [60.0, 83.3] | 13.3 [7.3, 20.0] | 50.0 [20.0, 80.0] | 0.0 [0.0, 0.0] | 7273 [7268, 7278] | 1.5 [1.5, 1.7] |
| qwen2.5-coder:7b | C0 | 120 | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 100.0 [100.0, 100.0] | 8.0 [8.0, 8.0] | 13339 [5192, 36874] | 19.4 [17.8, 21.7] |
| qwen2.5-coder:7b | C0h | 120 | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 2441 [2421, 2508] | 7.9 [7.0, 9.4] |
| qwen2.5-coder:7b | C1 | 120 | 1.0 [0.0, 3.0] | 1.0 [0.0, 3.0] | 100.0 [100.0, 100.0] | 8.0 [8.0, 8.0] | 21474 [21269, 21610] | 21.8 [20.9, 22.8] |
| qwen2.5-coder:7b | C1h | 120 | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 2477 [2449, 2625] | 7.8 [6.4, 10.6] |
| qwen2.5-coder:7b | C2 | 120 | 1.0 [0.0, 3.0] | 5.0 [1.0, 10.0] | 100.0 [100.0, 100.0] | 8.0 [8.0, 8.0] | 14741 [14340, 15604] | 23.7 [21.9, 25.1] |
| qwen2.5-coder:7b | C2u | 120 | 13.0 [5.0, 22.0] | 15.0 [7.0, 24.0] | 100.0 [100.0, 100.0] | 8.0 [8.0, 8.0] | 14552 [13353, 15249] | 21.0 [19.8, 21.9] |
| qwen2.5-coder:7b | C2b | 180 | 84.0 [75.3, 91.3] | 54.7 [42.7, 66.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 2055 [2031, 2067] | 4.0 [3.7, 4.1] |
| qwen2.5-coder:7b | C3 | 180 | 94.0 [89.3, 98.0] | 68.7 [56.7, 80.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 770 [757, 804] | 2.7 [2.5, 2.8] |
| qwen2.5-coder:7b | C4 | 180 | 72.7 [61.3, 83.3] | 26.0 [16.0, 36.7] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 7084 [7081, 7088] | 2.9 [2.7, 3.1] |

## extra

| Model | Condition | Correct, one-item (n=40) | Correct, two-item (n=10) | Correct and cited | Cited (any gold item) | False abstention on answerable | Verifiable citation | Run errors |
|---|---|---|---|---|---|---|---|---|
| anthropic/claude-haiku-5.5 | C0 | 71.7 [58.7, 84.2] | 50.0 [25.0, 75.0] | 56.7 [44.0, 69.0] | 59.7 [47.0, 72.0] | 21.7 [12.0, 32.3] | 0.0 [0.0, 0.0] | 0 |
| anthropic/claude-haiku-5.5 | C1 | 76.7 [64.2, 87.9] | 60.0 [35.0, 85.0] | 68.3 [57.0, 79.3] | 74.3 [63.3, 85.0] | 17.7 [8.3, 28.0] | 0.0 [0.0, 0.0] | 0 |
| anthropic/claude-haiku-5.5 | C2 | 97.5 [94.2, 100.0] | 100.0 [100.0, 100.0] | 96.3 [92.3, 99.3] | 98.0 [94.7, 100.0] | 1.3 [0.0, 3.3] | 0.0 [0.0, 0.0] | 0 |
| anthropic/claude-haiku-5.5 | C2u | 97.5 [93.3, 100.0] | 100.0 [100.0, 100.0] | 94.7 [88.7, 99.3] | 96.7 [92.7, 100.0] | 1.3 [0.0, 4.0] | 0.0 [0.0, 0.0] | 0 |
| anthropic/claude-haiku-5.5 | C2b | 95.0 [89.6, 99.2] | 75.0 [50.0, 100.0] | 89.3 [81.7, 96.0] | 93.0 [87.0, 98.0] | 3.3 [0.0, 7.7] | 91.0 [83.7, 97.0] | 0 |
| anthropic/claude-haiku-5.5 | C3 | 96.7 [93.3, 99.2] | 100.0 [100.0, 100.0] | 95.3 [90.0, 99.3] | 97.3 [92.7, 100.0] | 2.0 [0.0, 4.7] | 0.0 [0.0, 0.0] | 0 |
| anthropic/claude-haiku-5.5 | C4 | 98.3 [95.8, 100.0] | 100.0 [100.0, 100.0] | 97.0 [94.0, 99.3] | 98.7 [96.7, 100.0] | 0.7 [0.0, 2.0] | 0.0 [0.0, 0.0] | 0 |
| anthropic/claude-sonnet-5.5 | C0 | 82.5 [70.0, 92.5] | n/a | 77.5 [65.0, 90.0] | 77.5 [65.0, 90.0] | 17.5 [7.5, 30.0] | 0.0 [0.0, 0.0] | 0 |
| anthropic/claude-sonnet-5.5 | C1 | 82.5 [70.0, 92.5] | n/a | 82.5 [70.0, 92.5] | 82.5 [70.0, 92.5] | 17.5 [7.5, 30.0] | 0.0 [0.0, 0.0] | 0 |
| anthropic/claude-sonnet-5.5 | C2 | 97.4 [92.3, 100.0] | n/a | 97.4 [92.3, 100.0] | 100.0 [100.0, 100.0] | 2.6 [0.0, 7.7] | 0.0 [0.0, 0.0] | 0 |
| anthropic/claude-sonnet-5.5 | C2b | 100.0 [100.0, 100.0] | n/a | 100.0 [100.0, 100.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 100.0 [100.0, 100.0] | 0 |
| anthropic/claude-sonnet-5.5 | C3 | 100.0 [100.0, 100.0] | n/a | 97.4 [92.3, 100.0] | 97.4 [92.3, 100.0] | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 0 |
| anthropic/claude-sonnet-5.5 | C4 | 100.0 [100.0, 100.0] | n/a | 100.0 [100.0, 100.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 0 |
| gemma3:4b | C2b | 90.8 [82.5, 97.5] | 53.3 [26.7, 80.0] | 26.7 [18.7, 35.3] | 35.3 [25.3, 46.0] | 0.0 [0.0, 0.0] | 20.7 [12.7, 28.7] | 0 |
| gemma3:4b | C3 | 96.7 [90.8, 100.0] | 73.3 [46.7, 96.7] | 41.3 [30.7, 52.0] | 48.0 [37.3, 58.7] | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 0 |
| gemma3:4b | C4 | 85.0 [75.0, 94.2] | 20.0 [0.0, 50.0] | 11.3 [6.0, 17.3] | 18.7 [11.3, 26.7] | 0.7 [0.0, 2.0] | 0.0 [0.0, 0.0] | 0 |
| qwen2.5-coder:7b | C0 | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 0 |
| qwen2.5-coder:7b | C0h | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 0 |
| qwen2.5-coder:7b | C1 | 1.3 [0.0, 3.8] | 0.0 [0.0, 0.0] | 1.0 [0.0, 3.0] | 1.0 [0.0, 3.0] | 99.0 [97.0, 100.0] | 0.0 [0.0, 0.0] | 0 |
| qwen2.5-coder:7b | C1h | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 0.0 [0.0, 0.0] | 100.0 [100.0, 100.0] | 0.0 [0.0, 0.0] | 0 |
| qwen2.5-coder:7b | C2 | 1.3 [0.0, 3.8] | 0.0 [0.0, 0.0] | 1.0 [0.0, 3.0] | 7.0 [2.0, 13.0] | 99.0 [97.0, 100.0] | 0.0 [0.0, 0.0] | 0 |
| qwen2.5-coder:7b | C2u | 16.3 [6.3, 27.5] | 0.0 [0.0, 0.0] | 11.0 [4.0, 20.0] | 17.0 [8.0, 27.0] | 87.0 [78.0, 95.0] | 0.0 [0.0, 0.0] | 0 |
| qwen2.5-coder:7b | C2b | 91.7 [84.2, 97.5] | 53.3 [26.7, 76.7] | 54.7 [42.7, 66.0] | 60.0 [48.7, 71.3] | 8.7 [3.3, 15.3] | 54.7 [42.7, 66.0] | 0 |
| qwen2.5-coder:7b | C3 | 95.8 [90.8, 99.2] | 86.7 [73.3, 100.0] | 66.7 [54.7, 78.0] | 72.0 [60.7, 82.7] | 3.3 [0.7, 6.7] | 0.0 [0.0, 0.0] | 0 |
| qwen2.5-coder:7b | C4 | 85.0 [75.0, 93.3] | 23.3 [0.0, 50.0] | 26.0 [16.0, 36.7] | 26.0 [16.0, 36.7] | 20.7 [10.7, 31.3] | 0.0 [0.0, 0.0] | 0 |

## compare

| Model | Comparison | Measure | Mean difference [95 % bootstrap] | Questions higher / lower / tied | Sign test p | Holm-adjusted p | Permutation p |
|---|---|---|---|---|---|---|---|
| anthropic/claude-haiku-5.5 | C2 vs C0 | correct | 0.307 [0.190, 0.427] | 19 / 1 / 30 | <0.001 | 0.004 | <0.001 |
| anthropic/claude-haiku-5.5 | C2 vs C0 | cited (all gold items) | 0.393 [0.270, 0.517] | 24 / 0 / 26 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2 vs C0 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2 vs C0 | tokens (prompt+completion) | -16463.281 [-19838.080, -13300.589] | 4 / 56 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2 vs C1 | correct | 0.247 [0.140, 0.360] | 16 / 1 / 33 | <0.001 | 0.028 | <0.001 |
| anthropic/claude-haiku-5.5 | C2 vs C1 | cited (all gold items) | 0.247 [0.147, 0.353] | 17 / 0 / 33 | <0.001 | 0.002 | <0.001 |
| anthropic/claude-haiku-5.5 | C2 vs C1 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2 vs C1 | tokens (prompt+completion) | -13274.306 [-16244.796, -10446.580] | 3 / 57 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2 vs C3 | correct | 0.007 [-0.013, 0.033] | 2 / 1 / 47 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2 vs C3 | cited (all gold items) | -0.003 [-0.050, 0.050] | 1 / 2 / 47 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2 vs C3 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2 vs C3 | tokens (prompt+completion) | 13123.067 [11280.087, 15245.588] | 60 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2 vs C4 | correct | -0.007 [-0.027, 0.013] | 1 / 2 / 47 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2 vs C4 | cited (all gold items) | -0.007 [-0.050, 0.030] | 2 / 2 / 46 | 1.000 | 1.000 | 0.871 |
| anthropic/claude-haiku-5.5 | C2 vs C4 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2 vs C4 | tokens (prompt+completion) | -557.086 [-2663.735, 1734.461] | 25 / 35 / 0 | 0.245 | 1.000 | 0.621 |
| anthropic/claude-haiku-5.5 | C2u vs C0 | correct | 0.307 [0.193, 0.427] | 19 / 0 / 31 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2u vs C0 | cited (all gold items) | 0.370 [0.250, 0.493] | 23 / 0 / 27 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2u vs C0 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2u vs C0 | tokens (prompt+completion) | -19990.519 [-23195.952, -16932.320] | 0 / 60 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2u vs C1 | correct | 0.247 [0.143, 0.360] | 16 / 0 / 34 | <0.001 | 0.003 | <0.001 |
| anthropic/claude-haiku-5.5 | C2u vs C1 | cited (all gold items) | 0.223 [0.123, 0.330] | 17 / 1 / 32 | <0.001 | 0.015 | <0.001 |
| anthropic/claude-haiku-5.5 | C2u vs C1 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2u vs C1 | tokens (prompt+completion) | -16801.544 [-19600.275, -14062.504] | 0 / 60 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2u vs C2 | correct | 0.000 [-0.020, 0.020] | 1 / 1 / 48 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2u vs C2 | cited (all gold items) | -0.023 [-0.060, 0.000] | 0 / 2 / 48 | 0.500 | 1.000 | 0.504 |
| anthropic/claude-haiku-5.5 | C2u vs C2 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2u vs C2 | tokens (prompt+completion) | -3527.239 [-4801.669, -2228.295] | 6 / 54 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2u vs C3 | correct | 0.007 [-0.013, 0.027] | 2 / 1 / 47 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2u vs C3 | cited (all gold items) | -0.027 [-0.080, 0.013] | 1 / 2 / 47 | 1.000 | 1.000 | 0.497 |
| anthropic/claude-haiku-5.5 | C2u vs C3 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2u vs C3 | tokens (prompt+completion) | 9595.828 [8105.552, 11303.951] | 60 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2u vs C4 | correct | -0.007 [-0.040, 0.020] | 1 / 1 / 48 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2u vs C4 | cited (all gold items) | -0.030 [-0.093, 0.023] | 2 / 3 / 45 | 1.000 | 1.000 | 0.372 |
| anthropic/claude-haiku-5.5 | C2u vs C4 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2u vs C4 | tokens (prompt+completion) | -4084.325 [-6018.931, -2024.105] | 24 / 36 / 0 | 0.155 | 1.000 | <0.001 |
| anthropic/claude-haiku-5.5 | C2b vs C3 | correct | -0.063 [-0.137, 0.000] | 3 / 7 / 40 | 0.344 | 1.000 | 0.094 |
| anthropic/claude-haiku-5.5 | C2b vs C3 | cited (all gold items) | -0.063 [-0.130, -0.007] | 1 / 5 / 44 | 0.219 | 1.000 | 0.066 |
| anthropic/claude-haiku-5.5 | C2b vs C3 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2b vs C3 | tokens (prompt+completion) | 1550.367 [1385.027, 1703.144] | 60 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C2b vs C2 | correct | -0.070 [-0.143, -0.010] | 2 / 7 / 41 | 0.180 | 1.000 | 0.054 |
| anthropic/claude-haiku-5.5 | C2b vs C2 | cited (all gold items) | -0.060 [-0.140, 0.013] | 2 / 6 / 42 | 0.289 | 1.000 | 0.182 |
| anthropic/claude-haiku-5.5 | C2b vs C2 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C2b vs C2 | tokens (prompt+completion) | -11572.700 [-13656.230, -9781.889] | 0 / 60 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C3 vs C0 | correct | 0.300 [0.180, 0.423] | 19 / 2 / 29 | <0.001 | 0.023 | <0.001 |
| anthropic/claude-haiku-5.5 | C3 vs C0 | cited (all gold items) | 0.397 [0.270, 0.523] | 23 / 0 / 27 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C3 vs C0 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C3 vs C0 | tokens (prompt+completion) | -29586.347 [-33003.473, -26262.578] | 0 / 60 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-haiku-5.5 | C3 vs C4 | correct | -0.013 [-0.040, 0.013] | 1 / 3 / 46 | 0.625 | 1.000 | 0.616 |
| anthropic/claude-haiku-5.5 | C3 vs C4 | cited (all gold items) | -0.003 [-0.053, 0.037] | 2 / 1 / 47 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C3 vs C4 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-haiku-5.5 | C3 vs C4 | tokens (prompt+completion) | -13680.153 [-15593.898, -11732.440] | 0 / 60 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-sonnet-5.5 | C2 vs C0 | correct | 0.154 [0.026, 0.282] | 7 / 1 / 31 | 0.070 | 1.000 | 0.070 |
| anthropic/claude-sonnet-5.5 | C2 vs C0 | cited (all gold items) | 0.231 [0.103, 0.359] | 9 / 0 / 30 | 0.004 | 0.375 | 0.004 |
| anthropic/claude-sonnet-5.5 | C2 vs C0 | tokens (prompt+completion) | -13803.154 [-16912.061, -10993.109] | 0 / 39 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-sonnet-5.5 | C2 vs C1 | correct | 0.154 [0.026, 0.282] | 7 / 1 / 31 | 0.070 | 1.000 | 0.070 |
| anthropic/claude-sonnet-5.5 | C2 vs C1 | cited (all gold items) | 0.179 [0.077, 0.308] | 7 / 0 / 32 | 0.016 | 1.000 | 0.016 |
| anthropic/claude-sonnet-5.5 | C2 vs C1 | tokens (prompt+completion) | -10450.026 [-13506.599, -7608.310] | 2 / 37 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-sonnet-5.5 | C2 vs C3 | correct | -0.026 [-0.077, 0.000] | 0 / 1 / 38 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-sonnet-5.5 | C2 vs C3 | cited (all gold items) | 0.026 [0.000, 0.077] | 1 / 0 / 38 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-sonnet-5.5 | C2 vs C3 | tokens (prompt+completion) | 9654.897 [8647.492, 10661.642] | 39 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-sonnet-5.5 | C2 vs C4 | correct | -0.026 [-0.077, 0.000] | 0 / 1 / 38 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-sonnet-5.5 | C2 vs C4 | cited (all gold items) | 0.000 [0.000, 0.000] | 0 / 0 / 39 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-sonnet-5.5 | C2 vs C4 | tokens (prompt+completion) | -4306.000 [-6032.350, -2472.872] | 11 / 28 / 0 | 0.009 | 0.824 | <0.001 |
| anthropic/claude-sonnet-5.5 | C2b vs C3 | correct | 0.000 [0.000, 0.000] | 0 / 0 / 39 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-sonnet-5.5 | C2b vs C3 | cited (all gold items) | 0.026 [0.000, 0.077] | 1 / 0 / 38 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-sonnet-5.5 | C2b vs C3 | tokens (prompt+completion) | 1447.205 [1227.229, 1648.721] | 37 / 2 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-sonnet-5.5 | C2b vs C2 | correct | 0.026 [0.000, 0.077] | 1 / 0 / 38 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-sonnet-5.5 | C2b vs C2 | cited (all gold items) | 0.000 [0.000, 0.000] | 0 / 0 / 39 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-sonnet-5.5 | C2b vs C2 | tokens (prompt+completion) | -8207.692 [-9098.251, -7331.636] | 0 / 39 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-sonnet-5.5 | C3 vs C0 | correct | 0.179 [0.077, 0.308] | 7 / 0 / 32 | 0.016 | 1.000 | 0.016 |
| anthropic/claude-sonnet-5.5 | C3 vs C0 | cited (all gold items) | 0.205 [0.077, 0.333] | 8 / 0 / 31 | 0.008 | 0.711 | 0.008 |
| anthropic/claude-sonnet-5.5 | C3 vs C0 | tokens (prompt+completion) | -23458.051 [-26688.226, -20489.308] | 0 / 39 / 0 | <0.001 | <0.001 | <0.001 |
| anthropic/claude-sonnet-5.5 | C3 vs C4 | correct | 0.000 [0.000, 0.000] | 0 / 0 / 39 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-sonnet-5.5 | C3 vs C4 | cited (all gold items) | -0.026 [-0.077, 0.000] | 0 / 1 / 38 | 1.000 | 1.000 | 1.000 |
| anthropic/claude-sonnet-5.5 | C3 vs C4 | tokens (prompt+completion) | -13960.897 [-16121.286, -11435.122] | 0 / 39 / 0 | <0.001 | <0.001 | <0.001 |
| gemma3:4b | C2b vs C3 | correct | -0.087 [-0.167, -0.020] | 2 / 8 / 40 | 0.109 | 1.000 | 0.037 |
| gemma3:4b | C2b vs C3 | cited (all gold items) | -0.160 [-0.287, -0.033] | 11 / 24 / 15 | 0.041 | 1.000 | 0.024 |
| gemma3:4b | C2b vs C3 | correct abstention | -0.033 [-0.133, 0.067] | 1 / 2 / 7 | 1.000 | 1.000 | 1.000 |
| gemma3:4b | C2b vs C3 | tokens (prompt+completion) | 1124.089 [1009.023, 1231.589] | 60 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| gemma3:4b | C3 vs C4 | correct | 0.200 [0.100, 0.313] | 14 / 2 / 34 | 0.004 | 0.397 | 0.001 |
| gemma3:4b | C3 vs C4 | cited (all gold items) | 0.327 [0.207, 0.447] | 30 / 6 / 14 | <0.001 | 0.007 | <0.001 |
| gemma3:4b | C3 vs C4 | correct abstention | 0.167 [-0.033, 0.400] | 4 / 1 / 5 | 0.375 | 1.000 | 0.313 |
| gemma3:4b | C3 vs C4 | tokens (prompt+completion) | -5006.533 [-5580.625, -4410.622] | 0 / 60 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2 vs C0 | correct | 0.010 [0.000, 0.030] | 1 / 0 / 49 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2 vs C0 | cited (all gold items) | 0.050 [0.010, 0.100] | 5 / 0 / 45 | 0.063 | 1.000 | 0.065 |
| qwen2.5-coder:7b | C2 vs C0 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2 vs C0 | tokens (prompt+completion) | 1535.083 [-3392.436, 6399.878] | 33 / 27 / 0 | 0.519 | 1.000 | 0.541 |
| qwen2.5-coder:7b | C2 vs C1 | correct | 0.000 [-0.030, 0.030] | 1 / 1 / 48 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2 vs C1 | cited (all gold items) | 0.040 [0.000, 0.090] | 5 / 1 / 44 | 0.219 | 1.000 | 0.221 |
| qwen2.5-coder:7b | C2 vs C1 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2 vs C1 | tokens (prompt+completion) | 69.933 [-4364.343, 4484.237] | 30 / 30 / 0 | 1.000 | 1.000 | 0.977 |
| qwen2.5-coder:7b | C2 vs C3 | correct | -0.930 [-0.973, -0.880] | 0 / 50 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2 vs C3 | cited (all gold items) | -0.637 [-0.760, -0.510] | 2 / 37 / 11 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2 vs C3 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2 vs C3 | tokens (prompt+completion) | 21591.983 [18463.465, 24855.934] | 60 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2 vs C4 | correct | -0.717 [-0.820, -0.603] | 0 / 40 / 10 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2 vs C4 | cited (all gold items) | -0.210 [-0.330, -0.097] | 5 / 19 / 26 | 0.007 | 0.608 | 0.002 |
| qwen2.5-coder:7b | C2 vs C4 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2 vs C4 | tokens (prompt+completion) | 16707.278 [13854.993, 19706.244] | 58 / 2 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C0h vs C0 | correct | 0.000 [0.000, 0.000] | 0 / 0 / 50 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C0h vs C0 | cited (all gold items) | 0.000 [0.000, 0.000] | 0 / 0 / 50 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C0h vs C0 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C0h vs C0 | tokens (prompt+completion) | -11185.900 [-15643.731, -6793.483] | 15 / 45 / 0 | <0.001 | 0.014 | <0.001 |
| qwen2.5-coder:7b | C1h vs C1 | correct | -0.010 [-0.030, 0.000] | 0 / 1 / 49 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C1h vs C1 | cited (all gold items) | -0.010 [-0.030, 0.000] | 0 / 1 / 49 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C1h vs C1 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C1h vs C1 | tokens (prompt+completion) | -9632.892 [-13062.600, -6208.079] | 13 / 47 / 0 | <0.001 | 0.001 | <0.001 |
| qwen2.5-coder:7b | C0h vs C3 | correct | -0.940 [-0.980, -0.893] | 0 / 50 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C0h vs C3 | cited (all gold items) | -0.687 [-0.800, -0.567] | 0 / 38 / 12 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C0h vs C3 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C0h vs C3 | tokens (prompt+completion) | 8871.000 [6136.800, 11982.639] | 60 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C1h vs C3 | correct | -0.940 [-0.980, -0.893] | 0 / 50 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C1h vs C3 | cited (all gold items) | -0.687 [-0.800, -0.567] | 0 / 38 / 12 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C1h vs C3 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C1h vs C3 | tokens (prompt+completion) | 11889.158 [8949.058, 14906.294] | 60 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2u vs C0h | correct | 0.130 [0.050, 0.220] | 8 / 0 / 42 | 0.008 | 0.711 | 0.008 |
| qwen2.5-coder:7b | C2u vs C0h | cited (all gold items) | 0.150 [0.070, 0.240] | 10 / 0 / 40 | 0.002 | 0.193 | 0.002 |
| qwen2.5-coder:7b | C2u vs C0h | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2u vs C0h | tokens (prompt+completion) | 8811.750 [5643.634, 11830.290] | 51 / 9 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2u vs C1h | correct | 0.130 [0.050, 0.220] | 8 / 0 / 42 | 0.008 | 0.711 | 0.008 |
| qwen2.5-coder:7b | C2u vs C1h | cited (all gold items) | 0.150 [0.070, 0.240] | 10 / 0 / 40 | 0.002 | 0.193 | 0.002 |
| qwen2.5-coder:7b | C2u vs C1h | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2u vs C1h | tokens (prompt+completion) | 5793.592 [2103.084, 9414.388] | 39 / 21 / 0 | 0.027 | 1.000 | 0.003 |
| qwen2.5-coder:7b | C2u vs C0 | correct | 0.130 [0.050, 0.220] | 8 / 0 / 42 | 0.008 | 0.711 | 0.008 |
| qwen2.5-coder:7b | C2u vs C0 | cited (all gold items) | 0.150 [0.070, 0.240] | 10 / 0 / 40 | 0.002 | 0.193 | 0.002 |
| qwen2.5-coder:7b | C2u vs C0 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2u vs C0 | tokens (prompt+completion) | -2374.150 [-7171.846, 2463.662] | 31 / 29 / 0 | 0.897 | 1.000 | 0.339 |
| qwen2.5-coder:7b | C2u vs C1 | correct | 0.120 [0.040, 0.220] | 8 / 1 / 41 | 0.039 | 1.000 | 0.020 |
| qwen2.5-coder:7b | C2u vs C1 | cited (all gold items) | 0.140 [0.050, 0.240] | 10 / 1 / 39 | 0.012 | 1.000 | 0.008 |
| qwen2.5-coder:7b | C2u vs C1 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2u vs C1 | tokens (prompt+completion) | -3839.300 [-7905.803, 261.717] | 24 / 36 / 0 | 0.155 | 1.000 | 0.077 |
| qwen2.5-coder:7b | C2u vs C2 | correct | 0.120 [0.040, 0.210] | 8 / 1 / 41 | 0.039 | 1.000 | 0.020 |
| qwen2.5-coder:7b | C2u vs C2 | cited (all gold items) | 0.100 [0.010, 0.200] | 8 / 3 / 39 | 0.227 | 1.000 | 0.075 |
| qwen2.5-coder:7b | C2u vs C2 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2u vs C2 | tokens (prompt+completion) | -3909.233 [-5837.584, -2033.397] | 13 / 47 / 0 | <0.001 | 0.001 | <0.001 |
| qwen2.5-coder:7b | C2u vs C3 | correct | -0.810 [-0.897, -0.707] | 1 / 45 / 4 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2u vs C3 | cited (all gold items) | -0.537 [-0.683, -0.380] | 5 / 34 / 11 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2u vs C3 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2u vs C3 | tokens (prompt+completion) | 17682.750 [15417.765, 20201.715] | 60 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2u vs C4 | correct | -0.597 [-0.717, -0.467] | 2 / 35 / 13 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2u vs C4 | cited (all gold items) | -0.110 [-0.250, 0.030] | 9 / 17 / 24 | 0.169 | 1.000 | 0.145 |
| qwen2.5-coder:7b | C2u vs C4 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2u vs C4 | tokens (prompt+completion) | 12798.044 [10681.157, 15118.114] | 60 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2b vs C3 | correct | -0.100 [-0.173, -0.040] | 1 / 11 / 38 | 0.006 | 0.590 | 0.005 |
| qwen2.5-coder:7b | C2b vs C3 | cited (all gold items) | -0.140 [-0.273, -0.007] | 7 / 23 / 20 | 0.005 | 0.491 | 0.058 |
| qwen2.5-coder:7b | C2b vs C3 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2b vs C3 | tokens (prompt+completion) | 1073.722 [961.785, 1177.388] | 60 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2b vs C2 | correct | 0.830 [0.740, 0.910] | 46 / 0 / 4 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2b vs C2 | cited (all gold items) | 0.497 [0.370, 0.620] | 34 / 2 / 14 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C2b vs C2 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C2b vs C2 | tokens (prompt+completion) | -20518.261 [-23721.051, -17440.898] | 1 / 59 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C3 vs C0 | correct | 0.940 [0.893, 0.980] | 50 / 0 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C3 vs C0 | cited (all gold items) | 0.687 [0.567, 0.800] | 38 / 0 / 12 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C3 vs C0 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C3 vs C0 | tokens (prompt+completion) | -20056.900 [-24035.776, -16221.351] | 1 / 59 / 0 | <0.001 | <0.001 | <0.001 |
| qwen2.5-coder:7b | C3 vs C4 | correct | 0.213 [0.113, 0.327] | 15 / 1 / 34 | <0.001 | 0.052 | <0.001 |
| qwen2.5-coder:7b | C3 vs C4 | cited (all gold items) | 0.427 [0.293, 0.553] | 27 / 4 / 19 | <0.001 | 0.004 | <0.001 |
| qwen2.5-coder:7b | C3 vs C4 | correct abstention | 0.000 [0.000, 0.000] | 0 / 0 / 10 | 1.000 | 1.000 | 1.000 |
| qwen2.5-coder:7b | C3 vs C4 | tokens (prompt+completion) | -4884.706 [-5447.013, -4301.033] | 0 / 60 / 0 | <0.001 | <0.001 | <0.001 |

## nomodel

| What the agent reads to reach one fact | Median bytes | Median tokens (o200k_base) | Questions |
|---|---|---|---|
| C0: pages on the shortest link path from the home page, with the item page | 19652 | 4487.5 | 50 |
| C1: llms.txt plus the item page | 16067.5 | 3626.5 | 50 |
| C2: one search answer plus read of the item | 7062 | 1975.5 | 50 |
| C3: the five passages put in the prompt | 2209.5 | 507.5 | 50 |
| C4: the whole corpus pasted (cut to the context limit) | 31034 | 6667 | 50 |
| Reference: the gold item page alone | 3661.5 | 874.5 | 50 |
| Reference: the gold chunk alone | 444 | 99 | 50 |

The node's read tool returned chunk digests inside the 3,500-character limit for 50/50 gold reads; where it did, every digest matched the published chunks.jsonl for 50/50.

Retrieval without a model (questions as authored, n=50): C3 BM25 top-5 holds every gold item for 50/50; its top hit is a gold item for 49/50; the node's search tool lists every gold item for 50/50; the node's ask tool cites every gold item for 47/50. Median click depth from the home page to a gold item: 2 link(s).

## loops

| Condition | Runs | Opening call was the home page "/" | Runs that opened a gold item page or read a gold item | Share of calls repeating an earlier call | Runs that ran out of context before 8 calls | Runs that answered NOT_IN_CORPUS |
|---|---|---|---|---|---|---|
| C0 | 120 | 0 % (0/120) | 0 % (0/100) | 57 % (539/944) | 40 % (48/120) | 100 % (120/120) |
| C0h | 120 | 8 % (10/120) | 1 % (1/100) | 57 % (172/300) | 12 % (14/120) | 100 % (120/120) |
| C1 | 120 | 0 % (0/120) | 11 % (11/100) | 57 % (542/947) | 25 % (30/120) | 99 % (119/120) |
| C1h | 120 | 2 % (2/120) | 2 % (2/100) | 68 % (179/262) | 23 % (28/120) | 100 % (120/120) |
| C2 | 120 | 0 % (0/120) | 18 % (18/100) | 81 % (738/913) | 28 % (33/120) | 99 % (119/120) |
| C2u | 120 | 0 % (0/120) | 18 % (18/100) | 71 % (679/960) | 14 % (17/120) | 89 % (107/120) |

## truncation

| Model | Gold item inside the pasted text | Answerable runs | Correct |
|---|---|---|---|
| qwen2.5-coder:7b | yes | 123 | 89 % (109/123) |
| qwen2.5-coder:7b | no (cut off) | 27 | 0 % (0/27) |
| gemma3:4b | yes | 123 | 88 % (108/123) |
| gemma3:4b | no (cut off) | 27 | 0 % (0/27) |

Items that fit in the 6692-token budget: patterns: 28 of 50 items fit; main: 14 of 14 items fit.
