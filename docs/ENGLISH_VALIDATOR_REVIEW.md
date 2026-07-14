# English Validator Review

Project: Jannati AI Tutor v2.0

Investigation-only review of `node scripts/validate/questionValidator.js`.
No content was modified for this review.

## Summary

- Total warnings: 18
- Confirmed real issues: 18 duplicate-stem content warnings
- False positives: 0
- Validator issues: 0

## What changed after English Batch 1

- Before Batch 1: 8 warnings
- After English Batch 1: 18 warnings
- Newly introduced warnings after Batch 1: 10
- Existing warnings unrelated to Batch 1: 8

### Root cause

The warning increase was caused by genuine duplicate question stems in the question bank, not by metadata changes or validator malfunction.

- The 8 pre-existing warnings come from BM and Math duplicate stems.
- The 10 new warnings come from the English Simple Sentences batch, where the new stem variants still overlap with earlier English items at exact-stem level.

These warnings do not affect scoring or AI logic, but they do affect content diversity and learner experience slightly.

## Warning inventory

| # | File | Question ID | Warning type | Exact reason | Classification | Impact | Recommended action |
|---|---|---|---|---|---|---|---|
| 1 | `src/data/subjects/bm.js` | `BM-PEMAHAMAN_PENULISAN-022` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `bm:BM-AYAT-022` | Content error | Learner experience / diversity only | Ignore for now or manual review |
| 2 | `src/data/subjects/bm.js` | `BM-PEMAHAMAN_PENULISAN-045` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `bm:BM-AYAT-045` | Content error | Learner experience / diversity only | Ignore for now or manual review |
| 3 | `src/data/subjects/math.js` | `MATH-DARAB-097` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `math:MATH-DARAB-010` | Content error | Learner experience / diversity only | Fix content later |
| 4 | `src/data/subjects/math.js` | `MATH-DARAB-100` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `math:MATH-DARAB-009` | Content error | Learner experience / diversity only | Fix content later |
| 5 | `src/data/subjects/math.js` | `MATH-DARAB-102` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `math:MATH-DARAB-052` | Content error | Learner experience / diversity only | Fix content later |
| 6 | `src/data/subjects/math.js` | `MATH-DARAB-105` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `math:MATH-DARAB-006` | Content error | Learner experience / diversity only | Fix content later |
| 7 | `src/data/subjects/math.js` | `MATH-DARAB-115` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `math:MATH-DARAB-001` | Content error | Learner experience / diversity only | Fix content later |
| 8 | `src/data/subjects/math.js` | `MATH-DARAB-122` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `math:MATH-DARAB-054` | Content error | Learner experience / diversity only | Fix content later |
| 9 | `src/data/subjects/english.js` | `ENG-SENTENCES-018` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `english:ENG-SENTENCES-008` | Content error | Learner experience / diversity only | Review later if a future stem pass is planned |
| 10 | `src/data/subjects/english.js` | `ENG-SENTENCES-019` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `english:ENG-SENTENCES-009` | Content error | Learner experience / diversity only | Review later if a future stem pass is planned |
| 11 | `src/data/subjects/english.js` | `ENG-SENTENCES-023` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `english:ENG-SENTENCES-003` | Content error | Learner experience / diversity only | Review later if a future stem pass is planned |
| 12 | `src/data/subjects/english.js` | `ENG-SENTENCES-024` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `english:ENG-SENTENCES-004` | Content error | Learner experience / diversity only | Review later if a future stem pass is planned |
| 13 | `src/data/subjects/english.js` | `ENG-SENTENCES-025` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `english:ENG-SENTENCES-005` | Content error | Learner experience / diversity only | Review later if a future stem pass is planned |
| 14 | `src/data/subjects/english.js` | `ENG-SENTENCES-026` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `english:ENG-SENTENCES-006` | Content error | Learner experience / diversity only | Review later if a future stem pass is planned |
| 15 | `src/data/subjects/english.js` | `ENG-SENTENCES-027` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `english:ENG-SENTENCES-007` | Content error | Learner experience / diversity only | Review later if a future stem pass is planned |
| 16 | `src/data/subjects/english.js` | `ENG-SENTENCES-028` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `english:ENG-SENTENCES-008` | Content error | Learner experience / diversity only | Review later if a future stem pass is planned |
| 17 | `src/data/subjects/english.js` | `ENG-SENTENCES-029` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `english:ENG-SENTENCES-009` | Content error | Learner experience / diversity only | Review later if a future stem pass is planned |
| 18 | `src/data/subjects/english.js` | `ENG-SENTENCES-030` | `DUPLICATE_STEM` | Duplicate question stem found; duplicates `english:ENG-SENTENCES-010` | Content error | Learner experience / diversity only | Review later if a future stem pass is planned |

## Classification notes

- Content error: all 18 warnings are real exact-duplicate stem findings.
- Metadata issue: none.
- Formatting issue: none.
- Validator limitation: none identified in this pass.
- False positive: none.
- Unknown: none.

## Impact assessment

None of the warnings affect:

- answer correctness
- scoring
- AI logic
- CEFR level

They mainly affect:

- learner experience
- content diversity

The English warnings are low-severity because they are template-style practice items, but they are still real duplicates at the exact-stem level.

## Recommended actions

### Fix content

- `MATH-DARAB-097`
- `MATH-DARAB-100`
- `MATH-DARAB-102`
- `MATH-DARAB-105`
- `MATH-DARAB-115`
- `MATH-DARAB-122`

### Manual review

- `BM-PEMAHAMAN_PENULISAN-022`
- `BM-PEMAHAMAN_PENULISAN-045`

### Review later if another English stem pass is planned

- `ENG-SENTENCES-018`
- `ENG-SENTENCES-019`
- `ENG-SENTENCES-023`
- `ENG-SENTENCES-024`
- `ENG-SENTENCES-025`
- `ENG-SENTENCES-026`
- `ENG-SENTENCES-027`
- `ENG-SENTENCES-028`
- `ENG-SENTENCES-029`
- `ENG-SENTENCES-030`

## Priority order

1. Fix the math duplicate stems.
2. Decide whether the two BM duplicates are acceptable or should be refreshed later.
3. Plan a separate, very small English stem pass if content diversity needs to improve further.

## Recommended next step

Leave the validator as-is. The warning increase is primarily a content diversity issue, not a validator bug. A future controlled content pass can address the remaining duplicates if desired.

