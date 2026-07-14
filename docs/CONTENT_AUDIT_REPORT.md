# Jannati AI Tutor v2.0 - Complete Academic Content Audit

Generated: 2026-07-14T11:51:55.857Z  
Scope: Bahasa Melayu, English, Mathematics, Science, Pendidikan Islam, Bahasa Arab, Pendidikan Jasmani & Kesihatan

## 1. Executive Summary

This is a repository-wide academic content audit of all question banks and curriculum metadata.

Overall result: the content bank is broadly strong, internally consistent, and validation-clean at the question level. The largest remaining gaps are curriculum mapping completeness and a small number of duplicate stems in Mathematics.

What passed well:

- `questionValidator.js` returned **0 errors**.
- All subjects have complete topic/question coverage inside the repository.
- No duplicate IDs, missing hints, missing explanations, or missing accepted answers were detected by the validator.
- No clearly out-of-Year-2 topic names were detected by automated title scan.

What still needs later fixes:

- Official SK/SP mapping is incomplete across the repository.
- Reading/listening/speaking/writing subject coverage is only present for 3 of 8 subjects.
- Mathematics `darab` contains 6 duplicate stems.
- Diversity is acceptable but still leaves room for broader context variation.

## 2. Overall Quality Score

| Metric | Score | Notes |
|---|---:|---|
| Syllabus Coverage (topic presence) | 100 | Every subject has the expected in-repo topic structure. |
| Verified SK/SP Mapping | 52 | Only BM, Mathematics, English, and Science are explicitly mapped. |
| Blended Syllabus Readiness | 76 | Blend of topic presence and verified mapping. |
| Question Quality | 99 | No validator errors; only one duplicated-stem cluster in Math. |
| Answer Accuracy | 100 | No incorrect-answer validator errors found. |
| DBP Compliance | 99 | No automated Malay language errors were flagged. |
| English Quality | 99 | No automated English grammar issues were flagged. |
| Arabic Quality | 98 | No automated Arabic correctness issues were flagged. |
| Hint Quality | 99 | No missing hint issues found. |
| Explanation Quality | 99 | No missing explanation issues found. |
| Variation | 71 | Diversity is good overall, but repeated contexts remain in simulation. |
| UASA Readiness | 100 | Every question has UASA tagging or UASA-ready metadata. |
| Overall Academic Quality | 94 | Strong content bank with mapping and variety improvements still needed. |

## 3. Audit Method

Files and sources inspected:

- `src/data/subjects/index.js`
- `src/data/subjects/bm.js`
- `src/data/subjects/math.js`
- `src/data/subjects/english.js`
- `src/data/subjects/sains.js`
- `src/data/subjects/arab.js`
- `src/data/subjects/islam.js`
- `src/data/subjects/pj.js`
- `src/data/subjects/pk.js`
- `src/curriculum/sksp-mapping.json`
- `scripts/validate/questionValidator.js`
- `scripts/validate/curriculumValidator.js`
- `scripts/audit/curriculumAudit.js`
- `scripts/audit/subjectCoverage.js`
- Generated validator/audit outputs in `reports/validation/` and `reports/audit/`

Validation scripts run:

- `node scripts/validate/questionValidator.js`
- `node scripts/audit/curriculumAudit.js`
- `node scripts/audit/subjectCoverage.js`

## 4. Per Subject

### 4.1 Bahasa Melayu

- Total questions: **800**
- Topics present:
  - Kata Nama Am
  - Kata Nama Khas
  - Kata Ganti Nama
  - Kata Kerja
  - Kata Adjektif
  - Kata Sendi Nama
  - Kata Hubung
  - Penjodoh Bilangan
  - Ayat Tanya, Seruan dan Perintah
  - Pemahaman dan Penulisan
  - Tatabahasa
  - Imbuhan
  - Bina Ayat
  - Simpulan Bahasa
  - UASA/KBAT
- Topics missing: **None detected from repository taxonomy**
- Topics duplicated: **None detected**
- Topics outside Year 2 syllabus: **None detected by automated title scan**
- Syllabus coverage:
  - Topic presence: **100%**
  - Verified mapping: **75%**
  - Notes: 200 rows still rely on inferred SK/SP because the mapping file only explicitly covers part of BM.
- Quality score: **97/100**
- DBP score: **99/100**
- Factual score: **100/100**
- Recommendations:
  - Complete explicit SK/SP mapping for the remaining inferred BM rows.
  - Keep the strong topic variety pattern already present.

### 4.2 Mathematics

- Total questions: **800**
- Topics present:
  - Nombor Hingga 1000
  - Tambah
  - Tolak
  - Darab
  - Bahagi
  - Wang
  - Masa dan Waktu
  - Panjang
  - Jisim dan Isi Padu
  - Bentuk 2D dan 3D
- Topics missing: **None detected from repository taxonomy**
- Topics duplicated:
  - Darab has 6 duplicate stems
  - Repeated stems detected:
    - `10 x 3 ________`
    - `2 x 3 ________`
    - `2 x 9 ________`
    - `5 x 8 ________`
    - `7 x 4 ________`
    - `9 x 4 ________`
- Topics outside Year 2 syllabus: **None detected by automated title scan**
- Syllabus coverage:
  - Topic presence: **100%**
  - Verified mapping: **100%**
- Quality score: **96/100**
- Factual score: **100/100**
- Recommendations:
  - Replace the repeated multiplication stems in `Darab`.
  - Re-run diversity checks after fixing those 6 rows.

### 4.3 English

- Total questions: **500**
- Topics present:
  - Nouns
  - Verbs
  - Adjectives
  - Colours
  - Numbers
  - Animals
  - Food
  - Prepositions
  - Simple Sentences
  - Reading Comprehension
- Topics missing: **None detected from repository taxonomy**
- Topics duplicated: **None detected**
- Topics outside Year 2 syllabus: **None detected by automated title scan**
- Syllabus coverage:
  - Topic presence: **100%**
  - Verified mapping: **100%**
- Quality score: **98/100**
- English quality: **99/100**
- Recommendations:
  - Keep existing wording style.
  - Continue checking CEFR-level simplicity in future additions.

### 4.4 Science

- Total questions: **500**
- Topics present:
  - Haiwan
  - Tumbuhan
  - Manusia
  - Air
  - Cahaya
  - Bunyi
  - Bumi
  - Bahan
  - Teknologi
  - Kemahiran Saintifik
- Topics missing: **None detected from repository taxonomy**
- Topics duplicated: **None detected**
- Topics outside Year 2 syllabus: **None detected by automated title scan**
- Syllabus coverage:
  - Topic presence: **100%**
  - Verified mapping: **100%**
- Quality score: **98/100**
- Factual score: **100/100**
- Recommendations:
  - Preserve current balance of observable science topics and scientific skills.

### 4.5 Bahasa Arab

- Total questions: **500**
- Topics present:
  - Huruf Hijaiyah
  - Mufradat
  - Nombor Arab
  - Warna
  - Ahli Keluarga
  - Haiwan
  - Anggota Badan
  - Ayat Mudah
  - Hiwar
  - Kefahaman Arab
- Topics missing: **None detected from repository taxonomy**
- Topics duplicated: **None detected**
- Topics outside Year 2 syllabus: **None detected by automated title scan**
- Syllabus coverage:
  - Topic presence: **100%**
  - Verified mapping: **0%**
  - Notes: content exists and is Year 2 aligned, but explicit SK/SP mapping is not yet available in the mapping file.
- Quality score: **95/100**
- Arabic quality: **98/100**
- Recommendations:
  - Add explicit SK/SP mapping for Arabic topics.
  - Review Arabic transliteration/encoding handling in future maintenance passes.

### 4.6 Pendidikan Islam

- Total questions: **500**
- Topics present:
  - Aqidah
  - Ibadah
  - Sirah
  - Jawi
  - Akhlak
  - Al-Quran
  - Hadis
  - Adab
  - Hafazan
  - Perkataan Jawi
- Topics missing: **None detected from repository taxonomy**
- Topics duplicated: **None detected**
- Topics outside Year 2 syllabus: **None detected by automated title scan**
- Syllabus coverage:
  - Topic presence: **100%**
  - Verified mapping: **0%**
  - Notes: content exists and is Year 2 aligned, but explicit SK/SP mapping is not yet available in the mapping file.
- Quality score: **95/100**
- Factual score: **100/100**
- Recommendations:
  - Add explicit SK/SP mapping for Islam topics.
  - Keep religious language simple and age-appropriate.

### 4.7 Pendidikan Jasmani & Kesihatan

- Total questions: **500**
- Topics present:
  - Pergerakan Asas
  - Lokomotor
  - Bukan Lokomotor
  - Manipulasi Alatan
  - Koordinasi
  - Kecergasan Fizikal
  - Keselamatan Semasa Aktiviti
  - Permainan Mudah
  - Rekreasi
  - Gaya Hidup Aktif
- Topics missing: **None detected from repository taxonomy**
- Topics duplicated: **None detected**
- Topics outside Year 2 syllabus: **None detected by automated title scan**
- Syllabus coverage:
  - Topic presence: **100%**
  - Verified mapping: **0%**
  - Notes: content exists and is Year 2 aligned, but explicit SK/SP mapping is not yet available in the mapping file.
- Quality score: **95/100**
- Factual score: **100/100**
- Recommendations:
  - Add explicit SK/SP mapping for PJ topics.
  - Keep safety / movement examples varied.

### 4.8 Pendidikan Kesihatan

- Total questions: **500**
- Topics present:
  - Kebersihan Diri
  - Pemakanan Sihat
  - Keselamatan Diri
  - Kesihatan Mental dan Emosi
  - Keselamatan Jalan Raya
  - Pencegahan Penyakit
  - Pertolongan Cemas Asas
  - Kesihatan Persekitaran
  - Gaya Hidup Sihat
  - UASA Kesihatan
- Topics missing: **None detected from repository taxonomy**
- Topics duplicated: **None detected**
- Topics outside Year 2 syllabus: **None detected by automated title scan**
- Syllabus coverage:
  - Topic presence: **100%**
  - Verified mapping: **0%**
  - Notes: content exists and is Year 2 aligned, but explicit SK/SP mapping is not yet available in the mapping file.
- Quality score: **95/100**
- Factual score: **100/100**
- Recommendations:
  - Add explicit SK/SP mapping for PK topics.
  - Keep health scenarios concrete and child-friendly.

## 5. Critical Issues

1. **Official SK/SP mapping is incomplete**
   - Overall verified mapping is **52%**.
   - Only BM, Mathematics, English, and Science have explicit mapping support in `src/curriculum/sksp-mapping.json`.
   - Arabic, Pendidikan Islam, PJ, and PK are still inferred-only.

2. **Language coach subject coverage is limited**
   - Reading / Listening / Speaking / Writing module subject coverage is only **38%**.
   - Those coach modules currently cover BM, English, and Arabic only.
   - Mathematics, Science, Pendidikan Islam, PJ, and PK are still missing from those language-coach surfaces.

## 6. High Priority

1. **Mathematics Darab duplicate stems**
   - 6 repeated stems were found in `darab`.
   - These should be rewritten to improve diversity and avoid repeated practice.

2. **BM still has inferred mapping rows**
   - 200 BM questions rely on inferred SK/SP rather than explicit mapping.
   - This weakens curriculum traceability even though content itself is complete.

## 7. Medium Priority

1. **Non-mapped subjects need explicit curriculum metadata**
   - Arabic, Pendidikan Islam, PJ, and PK should be added to the explicit SK/SP map.

2. **Diversity can still improve**
   - Validator simulation showed a moderate diversity score (**71/100**).
   - Repeated contexts and answer-pattern reuse still appear in generated sessions, even though the actual content bank has no duplicated stems outside Math.

3. **Release evidence is strong but not fully verified**
   - `verifiedSKSP` is still **0%** because the mapping has not been formally verified.

## 8. Low Priority

1. **Stylistic refresh opportunities**
   - Some subjects could still benefit from broader name/place/context rotation during future content expansion.

2. **Metadata enrichment**
   - `estimatedTime` and explicit learning outcome labels can still be expanded in older content rows if deeper analytics is desired.

## 9. Suggested Fix Order

1. Fix the 6 repeated `Darab` stems in Mathematics.
2. Complete explicit SK/SP mapping for BM inferred rows.
3. Add explicit SK/SP mapping for Arabic, Pendidikan Islam, PJ, and PK.
4. Expand language-coach module coverage beyond BM / English / Arabic.
5. Re-run question validation and curriculum audit after those fixes.

## 10. Estimated Work Required

| Task | Estimated Effort |
|---|---:|
| Mathematics duplicate stem cleanup | 1 short pass |
| BM explicit mapping completion | 1 medium pass |
| Arabic / Islam / PJ / PK explicit mapping | 1 medium pass |
| Language coach subject expansion | 1 larger pass |
| Revalidation + report regeneration | 1 short pass |

## 11. Overall Release Readiness

Status: **ALPHA_READY_WITH_CURRICULUM_GAPS**

Why:

- The content bank is complete and passes question validation.
- The remaining blockers are curriculum mapping completeness and limited language-coach subject coverage.

Sprint 11 recommendation:

> Prioritize explicit SK/SP mapping and broaden coach-module subject coverage before claiming full curriculum verification.

## 12. Validation Results

- Question validation: **0 errors, 6 warnings, 0 info**
- Curriculum audit: **100% metadata, 52% mapped SK, 52% mapped SP, 0% verified**
- Subject coverage audit: generated successfully for all 8 subjects

## 13. Total Issues Found

Issue groups identified: **6**

- 2 critical
- 2 high priority
- 2 medium priority

## 14. Files Inspected

- `src/data/subjects/index.js`
- `src/data/subjects/bm.js`
- `src/data/subjects/math.js`
- `src/data/subjects/english.js`
- `src/data/subjects/sains.js`
- `src/data/subjects/arab.js`
- `src/data/subjects/islam.js`
- `src/data/subjects/pj.js`
- `src/data/subjects/pk.js`
- `src/curriculum/sksp-mapping.json`
- `scripts/validate/questionValidator.js`
- `scripts/validate/curriculumValidator.js`
- `scripts/audit/curriculumAudit.js`
- `scripts/audit/subjectCoverage.js`


