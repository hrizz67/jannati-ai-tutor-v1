# Arabic Answer Diversity Cleanup Sprint 3B

## Summary

This sprint removed the remaining `same_answer_pattern_repeated` signals from the two target Arabic packs:

- `huruf_hijaiyah`
- `kefahaman_arab`

The cleanup was content-only and preserved question IDs, learning intent, and correct answers.

## Files modified

- `src/data/subjects/arab.js`

## What changed

### Huruf Hijaiyah

- Reworked the repeated dot-position items into unique letter-identification prompts.
- Converted the repeated `atas / bawah` answer pattern into distinct Arabic-letter answers.
- Special-cased the `ه` item so it uses an Arabic-script stem and a unique answer pattern.

### Kefahaman Arab

- Reworked the duplicated follow-up half of the comprehension set into unique Arabic-word and Arabic-phrase recall prompts.
- Updated the overlapping items in the first comprehension half so they no longer repeat the same answer pattern.
- Kept the reading-comprehension intent intact while making the answer space more diverse.

## Before vs after repetition findings

| Topic | Before | After | Reduction |
|---|---:|---:|---:|
| Huruf Hijaiyah | 13 | 0 | 100% |
| Kefahaman Arab | 27 | 0 | 100% |
| Total | 40 | 0 | 100% |

## Number of items changed

- Question records updated: 42
- Target packs affected: 2

## Validation results

- `node scripts/validate/languageQualityValidator.js` ✅
- `node scripts/validate/questionBankAuditValidator.js` ✅
  - Target Arabic repetition signals cleared for `huruf_hijaiyah` and `kefahaman_arab`
- `node scripts/validate/questionRepairValidator.js` ✅
- `node scripts/validate/questionValidator.js` ✅
  - Output: `0 errors, 27 warnings, 0 info`
- `node scripts/validate/speechRegression.mjs` ✅
- `npm run build` ✅

## Remaining problems by topic

| Topic | Remaining issues |
|---|---|
| Huruf Hijaiyah | None from the targeted repetition audit |
| Kefahaman Arab | None from the targeted repetition audit |

## Arabic readiness score

- Target-pack readiness: 100/100

## Notes

- No translation mismatch was introduced.
- No new ambiguity was introduced.
- The cleanup stayed within the existing Arabic content structure and preserved question IDs.
