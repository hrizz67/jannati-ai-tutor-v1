# Bahasa Melayu Remediation Batch 2 Report

Date: 2026-07-14

## Scope

- Controlled Batch 2 remediation using the calibrated BM style validator as source of truth.
- No answers were changed.
- No accepted answers were changed.
- No scoring, AI logic, or curriculum metadata was changed.
- Only confirmed issues and a small set of high-impact content items were reviewed.

## Files Modified

- `C:\Project\jannati-ai-tutor-v1\src\data\subjects\bm.js`
- `C:\Project\jannati-ai-tutor-v1\src\dashboard\StudentDashboard.jsx`
- `C:\Project\jannati-ai-tutor-v1\src\ai\adaptiveEngine.js`
- `C:\Project\jannati-ai-tutor-v1\src\ai\adaptive\lessonPlanner.js`
- `C:\Project\jannati-ai-tutor-v1\scripts\validate\bmStyleValidator.mjs`
- `C:\Project\jannati-ai-tutor-v1\reports\validation\bm-style-report.json`

## Records Changed

- 57 question records were updated in this batch.
- The changes were concentrated on the remaining repeated BM stems and a few clearly awkward AI-facing Malay strings.

## Confirmed Issues Fixed

The following confirmed issues were addressed through question-stem diversification and copy cleanup:

- repeated Ayat Tanya / Ayat Perintah / Ayat Seruan prompt families
- repeated Pemahaman dan Penulisan stems
- repeated kata hubung fill-in stems
- the AI recommendation text in `StudentDashboard.jsx`
- the adaptive lesson recommendation text in `src/ai/adaptiveEngine.js`
- the review note / lesson reason wording in `src/ai/adaptive/lessonPlanner.js`

## Possible Issues Reviewed

Reviewed a small controlled set of higher-impact possible issues only:

- repeated hint templates
- repeated explanation templates
- a few clearly awkward or overly formal Malay lines in learner-facing and dashboard-facing copy

## Items Intentionally Left Unchanged

- low-confidence possible DBP flags
- most repeated hint templates
- most repeated explanation templates
- curriculum mapping metadata
- answers and accepted answers
- AI / adaptive behavior

## Validation Metrics

### Before Batch 2

From the calibrated validator snapshot before this batch:

- Questions scanned: 800
- Unique stems: 746
- Repeated stem groups: 22
- Long questions: 1
- Long hints: 0
- Long explanations: 0
- Repeated hint templates: 788
- Repeated explanation templates: 768
- Confirmed DBP issues: 0
- Possible DBP issues: 153
- Robot-like issues: 1
- Confirmed issues: 25
- Possible issues: 1756

### After Batch 2

Latest validator snapshot:

- Questions scanned: 800
- Unique stems: 754
- Repeated stem groups: 14
- Long questions: 0
- Long hints: 0
- Long explanations: 0
- Repeated hint templates: 788
- Repeated explanation templates: 768
- Confirmed DBP issues: 0
- Possible DBP issues: 147
- Robot-like issues: 0
- Confirmed issues: 14
- Possible issues: 1748

## Comparison Summary

- Confirmed issues: 25 → 14
- Repeated stem groups: 22 → 14
- Unique stems: 746 → 754
- Robot-like issues: 1 → 0
- Possible DBP issues: 153 → 147

## Validation Result

- `node scripts/validate/bmStyleValidator.mjs` ✅
- `node scripts/validate/questionValidator.js` ✅ (`0 errors, 12 warnings, 0 info`)
- `npm run build` ✅

## Notes

- The remaining possible issues are still intentionally left in place because they are not confirmed language errors.
- The current batch made the validator meaningfully stricter on confirmed issues while still preserving the Year 2 learning meaning of the content.
