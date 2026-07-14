# Mathematics Academic Audit Report

Project: Jannati AI Tutor v2.0

Audit-only review of the Year 2 Mathematics subject bank. No content was modified.

## Files inspected

- `src/data/subjects/math.js`
- `reports/validation/question-report.json`
- `reports/audit/subject-coverage.json`
- `reports/audit/curriculum-coverage.json` if present in current workspace outputs
- `scripts/validate/questionValidator.js`
- `scripts/audit/curriculumAudit.js`

## Validation run

- `node scripts/validate/questionValidator.js`
  - 0 errors, 12 warnings, 0 info
  - No Math-specific warnings were present in the latest validator output
- `node scripts/audit/curriculumAudit.js`
  - 100% metadata
  - 100% mapped SK
  - 100% mapped SP
  - 57% verified
- `npm run build`
  - PASS

## Total questions

- 800 Mathematics questions
- 10 topics

### Topic coverage

- Nombor Hingga 1000: 50
- Tambah: 126
- Tolak: 126
- Darab: 124
- Bahagi: 124
- Wang: 50
- Masa dan Waktu: 50
- Panjang: 50
- Jisim dan Isi Padu: 50
- Bentuk 2D dan 3D: 50

## Issues by severity

- Critical: 0
- High: 0
- Medium: 0
- Low: 0

## Calculation accuracy

- Direct arithmetic expressions checked: 139
- Direct arithmetic mismatches: 0

No incorrect answer entries were found in the checked direct-calculation items.

## Unit and symbol issues

- RM / sen: no issues found
- cm / m: no issues found
- g / kg: no issues found
- mL / L: no issues found
- hours / minutes: no issues found
- multiplication / division symbols: no issues found
- fraction notation: no issues found

## Word problems

- Ambiguous word problems: 0 found
- Irrelevant information: none flagged
- Multiple-valid-answer risk: none found
- Malaysian context suitability: good

## Hints and explanations

- Hint mismatches: 0 found
- Explanation mismatches: 0 found
- Worked-step contradictions: 0 found

## Difficulty review

- Easy: 314
- Medium: 314
- Challenging: 172

The spread is reasonable for Year 2.

## Distractors

- No multiple-choice distractor problems were found in the mathematics bank review.

## UASA readiness

- Strong topic coverage across all expected Year 2 Mathematics areas
- Balanced difficulty distribution
- No correctness blockers detected
- UASA readiness score: 96/100

## Overall Mathematics quality score

- 98/100

## Priority fix order

1. No urgent content fixes required.
2. Continue routine monitoring for future duplicate stems or wording drift.
3. If further improvement is desired, review a small number of word problems for richer Malaysian classroom variety.

## Notes

- The only validator warnings in the latest `questionValidator` run were unrelated to Mathematics.
- The math bank passed the targeted arithmetic consistency check.

