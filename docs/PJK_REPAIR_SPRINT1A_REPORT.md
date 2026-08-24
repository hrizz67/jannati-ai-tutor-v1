# PJK Repair Sprint 1A

## Executive Summary

This sprint repaired only the two PJK questions flagged with `missing_instruction`.

- Records updated: **2**
- Readiness before: **91/100**
- Readiness after: **92/100**
- `missing_instruction`: **2 → 0**
- `same_answer_pattern_repeated`: **640 → 640**

The fix was intentionally narrow: only the missing instructions were added, while the answers and learning objectives were preserved.

---

## Repaired Questions

| Question ID | Topic | Change |
|---|---|---|
| PJ-PERGERAKAN_ASAS-023 | Pergerakan Asas | Added a short instruction phrase |
| PJ-PERGERAKAN_ASAS-045 | Pergerakan Asas | Added a short instruction phrase |

---

## Missing Instruction Reduction

| Metric | Before | After | Change |
|---|---:|---:|---:|
| missing_instruction | 2 | 0 | -2 |
| same_answer_pattern_repeated | 640 | 640 | 0 |
| duplicate_answer_groups | 0 | 0 | 0 |
| duplicate_question_templates | 0 | 0 | 0 |
| identical_question_text | 0 | 0 | 0 |

---

## Examples of the Repair

### PJ-PERGERAKAN_ASAS-023

Before:

- `Apakah maksud pergerakan asas?`

After:

- `Pilih jawapan yang betul. Apakah maksud pergerakan asas?`

### PJ-PERGERAKAN_ASAS-045

Before:

- `Apakah contoh pergerakan lokomotor?`

After:

- `Pilih jawapan yang betul. Apakah contoh pergerakan lokomotor?`

---

## Remaining Findings

Only low-severity repetition findings remain in PJK.

| Topic | Remaining Findings |
|---|---:|
| Pergerakan Asas | 1 |
| Lokomotor | 36 |
| Bukan Lokomotor | 36 |
| Manipulasi Alatan | 32 |
| Koordinasi | 40 |
| Kecergasan Fizikal | 36 |
| Keselamatan Semasa Aktiviti | 36 |
| Permainan Mudah | 36 |
| Rekreasi | 36 |
| Gaya Hidup Aktif | 37 |
| Kebersihan Diri | 37 |
| Pemakanan Sihat | 34 |
| Keselamatan Diri | 36 |
| Kesihatan Mental dan Emosi | 31 |
| Keselamatan Jalan Raya | 36 |
| Pencegahan Penyakit | 35 |
| Pertolongan Cemas Asas | 36 |
| Kesihatan Persekitaran | 36 |
| Gaya Hidup Sihat | 27 |
| UASA Kesihatan | 6 |
| **Total** | **640** |

---

## Validation Results

- `node scripts/validate/questionBankAuditValidator.js` — passed
- `node scripts/validate/questionValidator.js` — passed with 0 errors, 39 warnings
- `node scripts/validate/speechRegression.mjs` — passed
- `npm run build` — passed

---

## Final Summary

- Records updated: **2**
- Readiness improvement: **+1 point**
- `missing_instruction` reduction: **2 → 0**
- Remaining findings: **640 low-severity repetition signals**
- Validation status: passed

