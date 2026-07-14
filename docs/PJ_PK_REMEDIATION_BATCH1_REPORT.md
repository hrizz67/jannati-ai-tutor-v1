# PJ & PK Remediation Batch 1 Report

Project: Jannati AI Tutor v2.1  
Scope: Small editorial remediation only

## Files modified

- `src/data/subjects/pj.js`
- `src/data/subjects/pk.js`

## Records changed

- 25 question records total
  - Pendidikan Jasmani: 5 records
  - Pendidikan Kesihatan: 20 records

## Hint improvements

### Pendidikan Jasmani

- Reduced repetition in the opening movement items by refreshing the early hints:
  - `Pilih pergerakan kaki yang tidak laju.`
  - `Badan akan naik seketika dari lantai.`
  - `Bandingkan dengan berjalan.`
  - `Pinggang dan bahu bergerak ke sisi.`
  - `Badan direndahkan ke hadapan.`

### Pendidikan Kesihatan

- Refreshed the repeated hygiene hint phrasing in four high-frequency items:
  - `Tangan yang bersih membantu mengurangkan kuman dalam badan.`
  - `Mencuci tangan selepas tandas membantu menjaga kesihatan diri.`
  - `Menggosok gigi sebelum tidur membantu menjaga gigi daripada berlubang.`
  - `Mandi dan memakai pakaian bersih membuat badan lebih segar.`

## Explanation improvements

### Pendidikan Jasmani

- Slightly varied the earliest movement explanations to keep tone natural while preserving meaning.

### Pendidikan Kesihatan

- Kept explanations factual and short, with slightly smoother teacher-style Malay in the hygiene section.

## Stem improvements

- No question stems were rewritten in this batch.
- The batch focused on editorial repetition in hints and explanations only.

## Before vs after metrics

- Before batch:
  - `node scripts/validate/questionValidator.js` → `0 errors, 12 warnings, 0 info`
  - `node scripts/audit/curriculumAudit.js` → `100% metadata, 100% mapped SK, 100% mapped SP, 57% verified`
- After batch:
  - `node scripts/validate/questionValidator.js` → `0 errors, 12 warnings, 0 info`
  - `node scripts/audit/curriculumAudit.js` → `100% metadata, 100% mapped SK, 100% mapped SP, 57% verified`

## Validation result

- `node scripts/validate/questionValidator.js` ✅
- `node scripts/audit/curriculumAudit.js` ✅
- `npm run build` ✅

## Build result

- Build passed successfully
- Vite reported the existing chunk-size warning only

## Items intentionally left unchanged

- Answers
- Accepted answers
- Scoring
- AI logic
- Curriculum mapping
- All untouched PJ/PK content outside the confirmed editorial hotspots

## Release readiness recommendation

PJ and PK remain release-ready for this small editorial pass. The changes improve classroom tone and reduce repeated wording without changing subject meaning or assessment behaviour.
