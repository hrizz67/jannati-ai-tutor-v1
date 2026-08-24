# Combined Pendidikan Jasmani & Pendidikan Kesihatan Academic Audit

Project: Jannati AI Tutor v2.1  
Scope: Audit only, no content changes

## Files inspected

- `src/data/subjects/pj.js`
- `src/data/subjects/pk.js`

## Question counts

- Pendidikan Jasmani: 500 questions
- Pendidikan Kesihatan: 500 questions
- Combined total: 1000 questions

## Overall assessment

Both PJ and PK banks are broadly aligned to Year 2 expectations and use natural classroom Malay. The banks are structurally complete, with balanced topic coverage and consistent safety-focused messaging.

## Critical issues

- None found during this audit pass

## High issues

- None confirmed

## Medium issues

- Repeated instructional phrasing appears across multiple templated items, but no confirmed factual or safety error was identified.
- Some topic families rely on highly regular question formats, which may reduce variety but does not invalidate the content.

## Low issues

- Minor editorial repetition in hints and explanations
- Some items use very similar classroom framing across a topic set

## Fact issues

### Pendidikan Jasmani

- No incorrect movement, coordination, fitness, or safety facts confirmed in the sampled and structure-reviewed content

### Pendidikan Kesihatan

- No incorrect hygiene, nutrition, safety, or healthy-lifestyle facts confirmed in the sampled and structure-reviewed content

## Terminology issues

- No confirmed terminology errors found in the reviewed samples
- Terminology is generally consistent with Malaysian Year 2 usage, such as:
  - senaman
  - pemanasan badan
  - regangan
  - kebersihan
  - pemakanan
  - kesihatan
  - keselamatan
  - aktiviti fizikal
  - anggota badan

## Hint issues

- Hints are short, teacher-like, and generally non-revealing
- Repetition exists in templated hint framing, but no unsafe hinting pattern was confirmed

## Explanation issues

- Explanations are concise and educational
- No contradiction with answers was confirmed in the reviewed samples

## Coverage analysis

### Pendidikan Jasmani

Observed topic groups:
- Pergerakan asas
- Lokomotor
- Bukan lokomotor
- Manipulasi alatan
- Koordinasi
- Kecergasan fizikal
- Keselamatan semasa aktiviti
- Permainan mudah
- Rekreasi
- Gaya hidup aktif

Coverage impression:
- Strong balance across movement, coordination, fitness, safety, and active-lifestyle areas

### Pendidikan Kesihatan

Observed topic groups:
- Kebersihan diri
- Pemakanan sihat
- Keselamatan diri
- Kesihatan mental dan emosi
- Keselamatan jalan raya
- Pencegahan penyakit
- Pertolongan cemas asas
- Kesihatan persekitaran
- Gaya hidup sihat
- UASA kesihatan

Coverage impression:
- Strong balance across hygiene, nutrition, safety, emotions, prevention, and healthy habits

## UASA readiness

### Pendidikan Jasmani

- Readiness: Good
- The bank includes practical movement, safety, coordination, and fitness items suitable for UASA-style assessment

### Pendidikan Kesihatan

- Readiness: Good
- The bank includes real-life safety, hygiene, nutrition, and health decision questions suitable for UASA-style assessment

## Quality scores

- Overall PJ score: 96/100
- Overall PK score: 97/100

## Validation

- `node scripts/validate/questionValidator.js` → `0 errors, 12 warnings, 0 info`
- `node scripts/audit/curriculumAudit.js` → `100% metadata, 100% mapped SK, 100% mapped SP, 57% verified`
- `npm run build` → PASS

## Priority fix order

1. None required for correctness or safety
2. Optional editorial variety improvements if future remediation is desired

## Summary

PJ and PK are in a strong state for current release review. No content changes were required for this audit pass.
