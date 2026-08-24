# Mathematics Content Repair Sprint 1A

## Scope

Bahagian dan Darab Tahun 2 only.

This sprint repaired question clarity in the two targeted Mathematics topics without changing UI, AI logic, scoring, or question IDs.

## Files modified

- `src/data/subjects/math.js`

## Number of questions changed

- Question records changed: 190

## Topics repaired

- Bahagi
- Darab

## Before vs after audit findings

| Issue type | Before | After | Reduction |
|---|---:|---:|---:|
| ambiguous_operation | 74 | 0 | 100% |
| missing_unit | 16 | 0 | 100% |
| missing_instruction | 0 | 0 | 0% |

### Topic breakdown

| Topic | ambiguous_operation before | ambiguous_operation after | missing_unit before | missing_unit after |
|---|---:|---:|---:|---:|
| Bahagi | 55 | 0 | 8 | 0 |
| Darab | 19 | 0 | 8 | 0 |

## Examples before / after

### Bahagi

Before:
- `12 bahagi 2 = ________.`

After:
- `Berapakah hasil bahagi 12 dengan 2?`

Before:
- `Dalam aktiviti wang, 32 objek dibahagi sama rata kepada 4 kumpulan. Setiap kumpulan mendapat ________ objek.`

After:
- `Berapakah jumlah ringgit setiap kumpulan jika 32 ringgit dibahagi sama rata kepada 4 kumpulan? RM ________.`

### Darab

Before:
- `Dalam tema permainan, ada 7 kumpulan dan setiap kumpulan ada 7 item. Jumlah item ialah ________.`

After:
- `Berapakah jumlah item jika ada 7 kumpulan dan setiap kumpulan ada 7 item? ________ item.`

Before:
- `Satu set wang mengandungi 5 objek. Jika ada 3 set, berapakah jumlah objek?`

After:
- `Satu set wang mengandungi RM 5. Jika ada 3 set, berapakah jumlah wang? RM ________.`

## Validation result

- `node scripts/validate/questionBankAuditValidator.js` ✅
- `node scripts/validate/questionRepairValidator.js` ✅
- `node scripts/validate/questionValidator.js` ✅
  - Output: `0 errors, 32 warnings, 0 info`
- `node scripts/validate/speechRegression.mjs` ✅
- `npm run build` ✅

## Remaining Math findings

The targeted Bahagi and Darab clarity issues are cleared.

Remaining Math audit signals are now dominated by `same_answer_pattern_repeated`, which is outside this sprint’s scope.

## Final Math readiness score

- Scoped readiness for Bahagi + Darab clarity issues: **100/100**
- Whole Mathematics bank readiness: **requires broader repetition cleanup** before a full freeze

## Recommended next step

If we continue math cleanup, the next best step is a repetition-focused batch for:

1. Bahagi
2. Darab
3. Bentuk 2D dan 3D
4. Remaining repeated-template topics

That will improve the broader Mathematics audit score without changing the already repaired operation clarity work.
