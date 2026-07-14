# English Remediation Batch 1 Report

Project: Jannati AI Tutor v2.0

This was a small, controlled remediation pass. No answers, accepted answers, scoring, curriculum mapping, or AI logic were changed.

## Files modified

- `src/data/subjects/english.js`

## Number of question records changed

- 30 question records

## Stem families changed

1. `Complete the sentence`
2. `Choose the correct word to complete this sentence`
3. `Complete the sentence with the best word`

## Wording variants introduced

- Fill in the blank.
- Write the missing word.
- Read the sentence.
- Look at the sentence.
- Choose the correct answer.
- Pick the best answer.
- Choose the correct word.
- Read and complete.
- Find the correct word.
- Choose the word that fits.

## Before vs after metrics

### Before batch 1

- Unique stems: 446
- Repeated stem groups: 10
- Top stem share: 2.0%
- Top 5 stem share: 10.0%
- CEFR outliers: 30
- Question validator: 0 errors, 8 warnings

### After batch 1

- Unique stems: 454
- Repeated stem groups: 16
- Top stem share: 2.0%
- Top 5 stem share: 6.0%
- CEFR outliers: 30
- Question validator: 0 errors, 18 warnings

## Findings intentionally left unchanged

- Hints and explanations were not edited in this batch.
- Lower-confidence repeated families were left unchanged.
- CEFR outlier count was not reduced because this pass focused only on safe stem variation.

## Validator result

- `node scripts/validate/englishStyleValidator.mjs`
  - Questions scanned: 500
  - Unique stems: 454
  - Repeated stem groups: 16
  - Repeated hint templates: 92
  - Repeated explanation templates: 105
  - Robot-like issues: 0
  - CEFR outliers: 30

- `node scripts/validate/questionValidator.js`
  - 0 errors, 18 warnings, 0 info

## Build result

- `npm run build`
  - PASS

## Notes

- This batch deliberately touched only the three highest-frequency English stem families.
- The content remains Year 2 suitable and answer-safe.

