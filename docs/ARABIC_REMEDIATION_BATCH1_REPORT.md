# Arabic Remediation Batch 1 Report

Project: Jannati AI Tutor v2.1  
Scope: Small editorial cleanup only, focused on confirmed Huruf Hijaiyah repetition

## Files modified

- `src/data/subjects/arab.js`

## Records changed

- 28 question records updated

## What changed

### Hint improvements

- Replaced one repeated Hijaiyah hint pattern with 4 short classroom-style variants:
  - `Lihat bentuk huruf dengan teliti.`
  - `Perhatikan huruf Arab ini.`
  - `Cuba ingat nama huruf ini.`
  - `Sebut huruf ini dengan betul.`

### Explanation improvements

- Simplified the repeated Huruf Hijaiyah explanation framing to a shorter teacher-style form:
  - `Ini huruf <nama>.`

### Stem improvements

- No question stems were rewritten in this batch.
- The batch stayed inside the confirmed repetition hotspot in Huruf Hijaiyah only.

## Before vs after metrics

### Record-level editorial variety

- Before: 1 repeated hint template across the main Huruf Hijaiyah mapping items
- After: 4 rotating hint templates across the same 28 items

### Validation summary

- Before batch:
  - Question validator: `0 errors, 12 warnings, 0 info`
  - Curriculum audit: `100% metadata, 100% mapped SK, 100% mapped SP, 57% verified`
- After batch:
  - Question validator: `0 errors, 12 warnings, 0 info`
  - Curriculum audit: `100% metadata, 100% mapped SK, 100% mapped SP, 57% verified`

## Items intentionally left unchanged

- Arabic spelling
- Arabic grammar
- Correct answers
- Accepted answers
- Curriculum mapping
- AI logic
- Scoring
- All non-Hijaiyah content

## Validation result

- `node scripts/validate/questionValidator.js` ✅
- `node scripts/audit/curriculumAudit.js` ✅
- `npm run build` ✅

## Build result

- Build passed successfully
- Vite completed with the existing chunk-size warning only

## Release readiness recommendation

Arabic content is improved in the confirmed repetition hotspot and remains safe for the current release candidate review. Further batch work can continue if additional editorial refinement is desired, but this pass did not introduce answer or curriculum changes.
