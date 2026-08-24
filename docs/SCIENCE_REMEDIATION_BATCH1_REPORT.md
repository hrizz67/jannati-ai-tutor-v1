# Science Remediation Batch 1 Report

Project: Jannati AI Tutor v1

Scope: Small Science-only editorial remediation

## Summary

This batch focused on confirmed low/medium editorial issues in `Kemahiran Saintifik`.

No answers, accepted answers, scoring, AI logic, or curriculum mapping were changed.

## Files Modified

- `src/data/subjects/sains.js`
- `docs/SCIENCE_REMEDIATION_BATCH1_REPORT.md`

## Records Changed

- Total question records changed: 50
- Topic changed: `Kemahiran Saintifik`

## What Was Improved

### Hint Improvements

- Replaced the repeated hint frame `Fikirkan kemahiran memerhati.` with short, more specific teacher-style hints.
- Added more precise prompts for:
  - observation
  - comparison
  - measurement
  - recording data
  - simple reasoning

### Explanation Improvements

- Replaced repeated generic wording such as `memerhati` in explanations with clearer Science language.
- Kept explanations short and Year 2 friendly.
- Preserved all scientific meaning and correct answers.

### Wording Improvements

- Made the Science guidance sound more like a teacher speaking to Year 2 learners.
- Reduced repetition inside the skill-focused block.

## Before vs After Metrics

### Kemahiran Saintifik Hint Variety

- Before:
  - unique hints: 48
  - top repeated hint count: 2

- After:
  - unique hints: 50
  - top repeated hint count: 1

### Kemahiran Saintifik Explanation Variety

- Before:
  - unique explanations: 50
  - top repeated explanation count: 1

- After:
  - unique explanations: 50
  - top repeated explanation count: 1

### Validator / Audit Summary

- `node scripts/validate/questionValidator.js`
  - Result: 0 errors, 12 warnings overall
  - Science-specific warnings: none observed

- `node scripts/audit/curriculumAudit.js`
  - Result: 100% metadata, 100% mapped SK, 100% mapped SP, 57% verified overall

## Items Intentionally Left Unchanged

- All Science answers
- All accepted answers
- All Science difficulty values
- All curriculum metadata
- All non-Kemahiran Saintifik topics
- Any higher-confidence scientific content that was already correct and clear

## Validation Result

- `node scripts/validate/questionValidator.js` — pass
- `node scripts/audit/curriculumAudit.js` — pass
- `npm run build` — pass

## Build Result

Build completed successfully.

Vite reported the existing chunk-size warning, but there were no build errors.

