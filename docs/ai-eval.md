# Cover-reading evaluation (Phase 3)

Phase 3 is done when 20 real covers have been read on a device (at least 10 of them Sinhala) and the
results are recorded here (build plan §13, Phase 3). The results decide whether `GEMINI_MODEL` stays
`gemini-3.6-flash` (§ Decisions).

## How to run it

1. Development build against the real Supabase project, with `GEMINI_API_KEY` set on the functions.
2. For each book: **+ → Snap the cover** → crop → wait for Review. Don't edit anything before scoring.
3. Score each field:
   - ✓ = correct as filled;
   - ~ = small fix needed (one character, spacing, romanisation variant);
   - ✗ = wrong, or empty when the cover shows it.
4. Note whether the low-confidence hint ("Check this one") appeared on the fields that were wrong.

Model: `________________` · Date: `__________` · Device: `__________` · Build: `__________`

## Results

| #   | Book (as on cover) | Script | Title (native) | Title (romanised) | Author (native) | Author (romanised) | Language | Pages | Hint on the wrong fields? | Seconds | Notes |
| --- | ------------------ | ------ | -------------- | ----------------- | --------------- | ------------------ | -------- | ----- | ------------------------- | ------- | ----- |
| 1   |                    | si     |                |                   |                 |                    |          |       |                           |         |       |
| 2   |                    | si     |                |                   |                 |                    |          |       |                           |         |       |
| 3   |                    | si     |                |                   |                 |                    |          |       |                           |         |       |
| 4   |                    | si     |                |                   |                 |                    |          |       |                           |         |       |
| 5   |                    | si     |                |                   |                 |                    |          |       |                           |         |       |
| 6   |                    | si     |                |                   |                 |                    |          |       |                           |         |       |
| 7   |                    | si     |                |                   |                 |                    |          |       |                           |         |       |
| 8   |                    | si     |                |                   |                 |                    |          |       |                           |         |       |
| 9   |                    | si     |                |                   |                 |                    |          |       |                           |         |       |
| 10  |                    | si     |                |                   |                 |                    |          |       |                           |         |       |
| 11  |                    |        |                |                   |                 |                    |          |       |                           |         |       |
| 12  |                    |        |                |                   |                 |                    |          |       |                           |         |       |
| 13  |                    |        |                |                   |                 |                    |          |       |                           |         |       |
| 14  |                    |        |                |                   |                 |                    |          |       |                           |         |       |
| 15  |                    |        |                |                   |                 |                    |          |       |                           |         |       |
| 16  |                    |        |                |                   |                 |                    |          |       |                           |         |       |
| 17  |                    |        |                |                   |                 |                    |          |       |                           |         |       |
| 18  |                    |        |                |                   |                 |                    |          |       |                           |         |       |
| 19  |                    |        |                |                   |                 |                    |          |       |                           |         |       |
| 20  |                    |        |                |                   |                 |                    |          |       |                           |         |       |

## Summary

- Sinhala titles fully correct: \_\_ / 10
- All titles fully correct: \_\_ / 20
- Wrong fields that showed the "Check this one" hint: \_\_ / \_\_
- Median seconds from "Use photo" to Review: \_\_
- Decision on `GEMINI_MODEL`:
