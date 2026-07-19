# PJK Content Audit Sprint 1

## Executive Summary

Pendidikan Jasmani & Kesihatan (PJK) Tahun 2 is broadly usable, but it still needs targeted cleanup before release freeze.

- Overall readiness: **91/100**
- Highest scoring topic: **Gaya Hidup Sihat (93/100)**
- Lowest scoring topic: **Pergerakan Asas (89/100)**
- Average readiness: **91/100**

The bank shows strong coverage and generally age-appropriate wording, but repetition is widespread across both PJ and PK topics. Two questions in Pergerakan Asas still have missing-instruction issues, so the bank is not yet fully production-ready.

---

## Topic Scores

| Topic | Score |
|---|---:|
| Pergerakan Asas | 89 |
| Lokomotor | 91 |
| Bukan Lokomotor | 91 |
| Manipulasi Alatan | 92 |
| Koordinasi | 90 |
| Kecergasan Fizikal | 91 |
| Keselamatan Semasa Aktiviti | 91 |
| Permainan Mudah | 91 |
| Rekreasi | 91 |
| Gaya Hidup Aktif | 91 |
| Kebersihan Diri | 91 |
| Pemakanan Sihat | 92 |
| Keselamatan Diri | 91 |
| Kesihatan Mental dan Emosi | 92 |
| Keselamatan Jalan Raya | 91 |
| Pencegahan Penyakit | 91 |
| Pertolongan Cemas Asas | 91 |
| Kesihatan Persekitaran | 91 |
| Gaya Hidup Sihat | 93 |
| UASA Kesihatan | 99 |

---

## Findings

### Critical

None.

### High

| Topic | Issue | Count |
|---|---|---:|
| Pergerakan Asas | missing_instruction | 2 |

### Medium

None.

### Low

| Topic | Issue | Count |
|---|---|---:|
| Pergerakan Asas | same_answer_pattern_repeated | 3 |
| Lokomotor | same_answer_pattern_repeated | 36 |
| Bukan Lokomotor | same_answer_pattern_repeated | 36 |
| Manipulasi Alatan | same_answer_pattern_repeated | 32 |
| Koordinasi | same_answer_pattern_repeated | 40 |
| Kecergasan Fizikal | same_answer_pattern_repeated | 36 |
| Keselamatan Semasa Aktiviti | same_answer_pattern_repeated | 36 |
| Permainan Mudah | same_answer_pattern_repeated | 36 |
| Rekreasi | same_answer_pattern_repeated | 36 |
| Gaya Hidup Aktif | same_answer_pattern_repeated | 37 |
| Kebersihan Diri | same_answer_pattern_repeated | 37 |
| Pemakanan Sihat | same_answer_pattern_repeated | 34 |
| Keselamatan Diri | same_answer_pattern_repeated | 36 |
| Kesihatan Mental dan Emosi | same_answer_pattern_repeated | 31 |
| Keselamatan Jalan Raya | same_answer_pattern_repeated | 36 |
| Pencegahan Penyakit | same_answer_pattern_repeated | 35 |
| Pertolongan Cemas Asas | same_answer_pattern_repeated | 36 |
| Kesihatan Persekitaran | same_answer_pattern_repeated | 36 |
| Gaya Hidup Sihat | same_answer_pattern_repeated | 27 |
| UASA Kesihatan | same_answer_pattern_repeated | 6 |

**Issue counts by severity**

- Critical: **0**
- High: **2**
- Medium: **0**
- Low: **640**

**Issue counts by type**

- `same_answer_pattern_repeated`: **640**
- `missing_instruction`: **2**
- `duplicate_answer_groups`: **0**
- `duplicate_question_templates`: **0**
- `identical_question_text`: **0**
- `multiple_possible_answers`: **0**
- incorrect health/sports facts: **0**
- unsuitable Year 2 vocabulary: **0**
- inconsistent formatting: **0**

---

## Priority Ranking

Highest repair priority to lowest:

1. Pergerakan Asas
2. Koordinasi
3. Gaya Hidup Aktif
4. Kebersihan Diri
5. Lokomotor
6. Bukan Lokomotor
7. Keselamatan Semasa Aktiviti
8. Permainan Mudah
9. Rekreasi
10. Manipulasi Alatan
11. Kecergasan Fizikal
12. Pemakanan Sihat
13. Keselamatan Diri
14. Keselamatan Jalan Raya
15. Pencegahan Penyakit
16. Pertolongan Cemas Asas
17. Kesihatan Persekitaran
18. Kesihatan Mental dan Emosi
19. Gaya Hidup Sihat
20. UASA Kesihatan

This order reflects issue volume and the presence of the only high-severity findings, not the correctness of the subject matter itself.

---

## Release Recommendation

**MINOR REPAIR**

Reason:

- There are no critical issues.
- The only high-severity findings are two incomplete-instruction items in Pergerakan Asas.
- There are no factual health or sports errors.
- The content is otherwise age-appropriate and aligned to Year 2 learning.
- Repetition is extensive, but it is still pedagogically understandable and safe.

The bank is close to release quality, but the repetition layer is still heavy enough that a small cleanup pass would improve teacher and learner experience.

---

## Diversity Analysis

### Question Diversity

The bank covers a broad range of PJK practice:

- movement concepts
- body coordination
- physical fitness
- safety during activity
- daily hygiene
- nutrition
- emotional wellbeing
- road safety
- illness prevention
- first aid

### Answer Diversity

Answer diversity is acceptable at a basic Year 2 level, but many questions reuse the same answer patterns, which is why the repetition signal remains high.

### Contextual Variety

Contextual variety is good in topic coverage, but many stems are still template-driven rather than naturally varied.

### Daily-Life Health Situations

Daily-life health situations are present and suitable, especially in:

- Kebersihan Diri
- Pemakanan Sihat
- Keselamatan Diri
- Kesihatan Mental dan Emosi
- Pencegahan Penyakit

### Exercise and Movement Scenarios

Movement scenarios are strong in the PJ section, especially in:

- Lokomotor
- Bukan Lokomotor
- Koordinasi
- Kecergasan Fizikal
- Permainan Mudah

### Safety and Hygiene Situations

Safety and hygiene coverage is solid across both subjects, with good emphasis on:

- activity safety
- road safety
- personal safety
- environmental hygiene
- first aid

---

## Comparison with Original Audit

| Metric | Original | Current | Improvement |
|---|---:|---:|---:|
| Overall readiness | 91 | 91 | 0 |
| Critical issues | 0 | 0 | 0 |
| High issues | 2 | 2 | 0 |
| Medium issues | 0 | 0 | 0 |
| Low issues | 640 | 640 | 0 |
| `same_answer_pattern_repeated` | 640 | 640 | 0 |
| `missing_instruction` | 2 | 2 | 0 |
| `multiple_possible_answers` | 0 | 0 | 0 |
| `duplicate_answer_groups` | 0 | 0 | 0 |
| `identical_question_text` | 0 | 0 | 0 |

---

## Recommended Remaining Work

1. Fix the two missing-instruction items in Pergerakan Asas.
2. Reduce repetitive stems in Koordinasi, Gaya Hidup Aktif, Kebersihan Diri, and the other high-volume PJ/PK topics.
3. Introduce more natural classroom and daily-life phrasing without changing the learning objectives.

The remaining repetition is not unsafe, but it is still more templated than ideal for a polished release.

---

## Final Verdict

PJK Tahun 2 is functional and academically safe, but it is not yet fully polished for production freeze.

**Final recommendation: MINOR REPAIR**

---

## Validation

- `node scripts/validate/questionBankAuditValidator.js` — passed
- `node scripts/validate/questionValidator.js` — passed with 0 errors, 39 warnings
- `node scripts/validate/speechRegression.mjs` — passed
- `npm run build` — passed

