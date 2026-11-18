# Leniency check of C3/C4 (17 Nov 2026), made on the first 31 C3/C4 answers of seed 1

Ten answers (seeded shuffle, Python `random.Random(5)`) read against the gold facts by Claude. Rows: q05 C4, q05 C3, q11 C4, q07 C4, q15 C3, q15 C4, q17 C4, q13 C4, q06 C3, q10 C4.

Result: 10 of 10 give the gold fact in a form a person would accept as correct; the mechanical score was `correct` for all 10. Mechanical `cited` was true only where the Sources block names the gold slug: three of the ten cite a wrong or invented identifier (`crewai` for q17, `dspy` for q13, `hearsay-II` for q06) or no source at all (q05 C4, q10 C4), and the scorer gives them no citation credit, as intended. The correctness facts are short strings, so a correct number or name inside a wrong sentence would pass; none of the ten did that.
