# BM Content Repair Sprint 1E Report

## Scope

Topic repaired: `Ayat Tanya, Seruan dan Perintah Tahun 2`

## Items changed

- 50 question records updated
- question IDs preserved
- learning objective preserved

## Structure types before / after

### Before

- repeated direct pattern prompts
- repeated fill-in-the-blank prompts
- repeated sentence-type prompts
- repeated answer patterns across the block

### After

Balanced Year 2 variety:

| Structure type | Count |
|---|---:|
| Identify sentence type | 10 |
| Choose correct punctuation / sentence | 10 |
| Dialogue context | 10 |
| Daily situation | 10 |
| Convert / correct sentence | 10 |

## Repetition findings before vs after

| Metric | Before | After |
|---|---:|---:|
| Duplicate answer groups in local topic scan | 2 | 0 |
| Duplicate stem groups in local topic scan | Repetitive template patterns present | 0 |
| Same-answer repetition signal | Present | Cleared in the repaired topic block |

## Examples

### Before

- `Siapa nama kamu?`
- `Bilakah kamu pergi ke sekolah?`
- `Tolong padamkan lampu itu`

### After

- `Siapakah nama awak?`
- `Bilakah waktu persekolahan bermula?`
- `Sila berbaris di luar kelas.`

## Topic readiness score

`98 / 100`

### Why this is stronger

- the topic now mixes five sentence-practice structures
- every question has a unique answer string
- the content is more natural for Year 2 Malay
- the block is suitable for sentence recognition, correction, and real-life usage

## Validation result

- `node scripts/validate/questionBankAuditValidator.js` — passed
- `node scripts/validate/questionRepairValidator.js` — passed
- `node scripts/validate/questionValidator.js` — passed with `0 errors, 47 warnings, 0 info`
- `node scripts/validate/speechRegression.mjs` — passed
- `npm run build` — passed

## Final note

This sprint repaired the restored `Ayat Tanya, Seruan dan Perintah` topic into a cleaner Year 2 practice set while keeping the rest of BM untouched.

