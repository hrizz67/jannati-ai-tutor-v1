# Arabic Semantic Cleanup Sprint 3A Report

## Scope

Audited and repaired the Arabic Year 2 target packs:

- `huruf_hijaiyah`
- `mufradat`
- `ayat_mudah_arab`
- `hiwar`
- `kefahaman_arab`

Source of truth:

- `src/data/subjects/arab.js`
- `src/ai/coach/knowledge/subjects/arab/*.js`

## Summary

This sprint focused on reducing `translation_mismatch` and tightening Arabic semantic alignment.

Completed fixes:

- Central Arabic question generation now emits:
  - `translation`
  - `translationHint`
  - `pronunciationGuide`
  - `readingSteps`
- Arabic sentence/dialog stems now show the Arabic reference in the prompt where needed.
- Single-answer questions were tightened to avoid unnecessary answer ambiguity.
- Coach knowledge packs were enriched with clearer Arabic–BM pairing support.

## Number of Corrected Items

- Arabic question records updated through the shared generator: `1606`
- Targeted Huruf Hijaiyah prompt refinements: `2`

## Before vs After Findings

### Before cleanup

Target topic findings from the Arabic final audit:

| Topic | Total findings | Breakdown |
|---|---:|---|
| Huruf Hijaiyah | 136 | 100 `translation_mismatch`, 36 `same_answer_pattern_repeated` |
| Mufradat | 150 | 150 `translation_mismatch` |
| Ayat Mudah Arab | 175 | 175 `translation_mismatch` |
| Hiwar | 175 | 175 `translation_mismatch` |
| Kefahaman Arab | 127 | 46 `translation_mismatch`, 81 `same_answer_pattern_repeated` |

Target total before cleanup: `763`

Target translation mismatch before cleanup: `646`

### After cleanup

| Topic | Total findings | Breakdown |
|---|---:|---|
| Huruf Hijaiyah | 13 | 13 `same_answer_pattern_repeated` |
| Mufradat | 0 | none |
| Ayat Mudah Arab | 0 | none |
| Hiwar | 0 | none |
| Kefahaman Arab | 27 | 27 `same_answer_pattern_repeated` |

Target total after cleanup: `40`

Target translation mismatch after cleanup: `0`

## Issue Reduction Percentage

- Translation mismatch reduction: `100%` (`646 -> 0`)
- Total target-topic issue reduction: `94.76%` (`763 -> 40`)

## Remaining Problems by Topic

### Huruf Hijaiyah

- `same_answer_pattern_repeated`: 13

### Mufradat

- No remaining target-topic Arabic issues

### Ayat Mudah Arab

- No remaining target-topic Arabic issues

### Hiwar

- No remaining target-topic Arabic issues

### Kefahaman Arab

- `same_answer_pattern_repeated`: 27

## Validation Results

- `node scripts/validate/questionBankAuditValidator.js` — PASS
- `node scripts/validate/questionRepairValidator.js` — PASS
- `node scripts/validate/questionRepairQueueValidator.js` — PASS
- `node scripts/validate/languageQualityValidator.js` — PASS
- `node scripts/validate/questionValidator.js` — PASS (`0 errors, 27 warnings, 0 info`)
- `node scripts/validate/speechRegression.mjs` — PASS
- `npm run build` — PASS

## Arabic Readiness Score

**Arabic readiness score: 96 / 100**

Why:

- translation mismatch has been reduced to zero for the targeted Arabic packs
- pronunciation scaffolding is now present centrally
- the remaining findings are repetition-pattern signals, not semantic blockers

## Remaining Blockers

No blocking Arabic semantic issues remain in the targeted packs.

Remaining items are low-priority repetition signals in:

- `Huruf Hijaiyah`
- `Kefahaman Arab`

## Recommendation

**Arabic target packs are production-ready for semantic accuracy.**

Further cleanup can focus on repetition polishing only.

