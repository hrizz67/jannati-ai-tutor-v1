# Final Content Release Audit

Read-only repository-wide content-quality audit for Release Candidate v2.0.

## Summary

- Subjects audited: 8
- Questions audited: 4600
- Question validator: 0 errors, 12 warnings, 0 info
- Curriculum audit: 100% metadata, 100% mapped SK, 100% mapped SP, 57% verified
- BM style audit: 0 confirmed issues, 148 possible DBP issues, 788 repeated hint templates, 768 repeated explanation templates
- English style audit: 16 repeated stem groups, 92 repeated hint templates, 105 repeated explanation templates, 30 CEFR outliers

## Severity

- 🔴 Critical: 0 issues surfaced by the current automated checks.
- 🟠 High: 12 duplicate-stem warnings in the question validator.
- 🟡 Medium: BM possible DBP issues (148) and English CEFR outliers (30).
- 🟢 Low: broad template repetition remains in BM/English hint and explanation text, but the current validators do not mark it as a blocking error.

## Automated warnings

| # | Subject | Topic | Question ID | Current content | Why it is wrong | Recommended fix | Estimated impact |
|---:|---|---|---|---|---|---|---|
| 1 | bm | pemahaman_penulisan | BM-PEMAHAMAN_PENULISAN-022 | Selepas tamat sekolah, Danish membeli roti di kedai kampung berhampiran rumah. Di manakah Danish membeli roti? (Latihan 3) | Duplicate stem reduces variation in the Bahasa Melayu bank. | Rewrite the stem with the same learning objective but a different instruction frame. | Medium: reduces topic variety. |
| 2 | bm | pemahaman_penulisan | BM-PEMAHAMAN_PENULISAN-045 | Baca ayat ini dan fikirkan jenisnya. Aduh, sakitnya kaki saya! (Latihan 5) | Duplicate stem reduces variation in the Bahasa Melayu bank. | Rewrite the stem with the same learning objective but a different instruction frame. | Medium: reduces topic variety. |
| 3 | english | sentences | ENG-SENTENCES-018 | Read and complete. We ________ English. | Duplicate stem reduces variation within the English sentence bank. | Vary the sentence pattern while keeping the same Year 2 grammar target. | Medium to high: repeated stems reduce assessment variety. |
| 4 | english | sentences | ENG-SENTENCES-019 | Find the correct word. The cats ________ small. | Duplicate stem reduces variation within the English sentence bank. | Vary the sentence pattern while keeping the same Year 2 grammar target. | Medium to high: repeated stems reduce assessment variety. |
| 5 | english | sentences | ENG-SENTENCES-023 | Read the sentence. They ________ happy. | Duplicate stem reduces variation within the English sentence bank. | Vary the sentence pattern while keeping the same Year 2 grammar target. | Medium to high: repeated stems reduce assessment variety. |
| 6 | english | sentences | ENG-SENTENCES-024 | Look at the sentence. This is ________ apple. | Duplicate stem reduces variation within the English sentence bank. | Vary the sentence pattern while keeping the same Year 2 grammar target. | Medium to high: repeated stems reduce assessment variety. |
| 7 | english | sentences | ENG-SENTENCES-025 | Choose the correct answer. This is ________ book. | Duplicate stem reduces variation within the English sentence bank. | Vary the sentence pattern while keeping the same Year 2 grammar target. | Medium to high: repeated stems reduce assessment variety. |
| 8 | english | sentences | ENG-SENTENCES-026 | Pick the best answer. I ________ to school every day. | Duplicate stem reduces variation within the English sentence bank. | Vary the sentence pattern while keeping the same Year 2 grammar target. | Medium to high: repeated stems reduce assessment variety. |
| 9 | english | sentences | ENG-SENTENCES-027 | Choose the correct word. He ________ a red cap. | Duplicate stem reduces variation within the English sentence bank. | Vary the sentence pattern while keeping the same Year 2 grammar target. | Medium to high: repeated stems reduce assessment variety. |
| 10 | english | sentences | ENG-SENTENCES-028 | Read and complete. We ________ English. | Duplicate stem reduces variation within the English sentence bank. | Vary the sentence pattern while keeping the same Year 2 grammar target. | Medium to high: repeated stems reduce assessment variety. |
| 11 | english | sentences | ENG-SENTENCES-029 | Find the correct word. The cats ________ small. | Duplicate stem reduces variation within the English sentence bank. | Vary the sentence pattern while keeping the same Year 2 grammar target. | Medium to high: repeated stems reduce assessment variety. |
| 12 | english | sentences | ENG-SENTENCES-030 | Write the missing word. My mother ________ cooking. | Duplicate stem reduces variation within the English sentence bank. | Vary the sentence pattern while keeping the same Year 2 grammar target. | Medium to high: repeated stems reduce assessment variety. |

## Subject summary

### Bahasa Melayu Tahun 2 (bm)

- Topics: 15
- Questions: 800
- Validator warnings linked to this subject: 2
- Content-quality note: the automated scan flags two duplicate stems in Pemahaman dan Penulisan. BM style validation also reports many repeated hint/explanation templates and 148 possible DBP issues for manual review.

| Topic | Questions | Status |
|---|---:|---|
| Kata Nama Am | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kata Nama Khas | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kata Ganti Nama | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kata Kerja | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kata Adjektif | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kata Sendi Nama | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kata Hubung | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Penjodoh Bilangan | 90 | 🟢 No specific warning surfaced in the current automated checks. |
| Ayat Tanya, Seruan dan Perintah | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Pemahaman dan Penulisan | 110 | 🟠 2 duplicate-stem warnings detected across this topic. |
| Tatabahasa | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Imbuhan | 40 | 🟢 No specific warning surfaced in the current automated checks. |
| Bina Ayat | 40 | 🟢 No specific warning surfaced in the current automated checks. |
| Simpulan Bahasa | 35 | 🟢 No specific warning surfaced in the current automated checks. |
| UASA/KBAT | 35 | 🟢 No specific warning surfaced in the current automated checks. |

### Matematik Tahun 2 (math)

- Topics: 10
- Questions: 800
- Validator warnings linked to this subject: 0
- Content-quality note: no blocking subject-specific warnings were surfaced by the current automated checks.

| Topic | Questions | Status |
|---|---:|---|
| Nombor Hingga 1000 | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Tambah | 126 | 🟢 No specific warning surfaced in the current automated checks. |
| Tolak | 126 | 🟢 No specific warning surfaced in the current automated checks. |
| Darab | 124 | 🟢 No specific warning surfaced in the current automated checks. |
| Bahagi | 124 | 🟢 No specific warning surfaced in the current automated checks. |
| Wang | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Masa dan Waktu | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Panjang | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Jisim dan Isi Padu | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Bentuk 2D dan 3D | 50 | 🟢 No specific warning surfaced in the current automated checks. |

### English Year 2 (english)

- Topics: 10
- Questions: 500
- Validator warnings linked to this subject: 10
- Content-quality note: the automated scan flags duplicate stems in Simple Sentences. English style validation also reports 30 CEFR outliers and repeated hint/explanation templates for review.

| Topic | Questions | Status |
|---|---:|---|
| Nouns | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Verbs | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Adjectives | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Colours | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Numbers | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Animals | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Food | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Prepositions | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Simple Sentences | 50 | 🟠 10 duplicate-stem warnings detected across this topic. |
| Reading Comprehension | 50 | 🟢 No specific warning surfaced in the current automated checks. |

### Sains Tahun 2 (sains)

- Topics: 10
- Questions: 500
- Validator warnings linked to this subject: 0
- Content-quality note: no blocking subject-specific warnings were surfaced by the current automated checks.

| Topic | Questions | Status |
|---|---:|---|
| Haiwan | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Tumbuhan | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Manusia | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Air | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Cahaya | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Bunyi | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Bumi | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Bahan | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Teknologi | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kemahiran Saintifik | 50 | 🟢 No specific warning surfaced in the current automated checks. |

### Bahasa Arab Tahun 2 (arab)

- Topics: 10
- Questions: 500
- Validator warnings linked to this subject: 0
- Content-quality note: no blocking subject-specific warnings were surfaced by the current automated checks.

| Topic | Questions | Status |
|---|---:|---|
| Huruf Hijaiyah | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Mufradat | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Nombor Arab | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Warna | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Ahli Keluarga | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Haiwan | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Anggota Badan | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Ayat Mudah | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Hiwar | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kefahaman Arab | 50 | 🟢 No specific warning surfaced in the current automated checks. |

### Pendidikan Islam Tahun 2 (islam)

- Topics: 10
- Questions: 500
- Validator warnings linked to this subject: 0
- Content-quality note: no blocking subject-specific warnings were surfaced by the current automated checks.

| Topic | Questions | Status |
|---|---:|---|
| Aqidah | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Ibadah | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Sirah | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Jawi | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Akhlak | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Al-Quran | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Hadis | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Adab | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Hafazan | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Perkataan Jawi | 50 | 🟢 No specific warning surfaced in the current automated checks. |

### Pendidikan Jasmani Tahun 2 (pj)

- Topics: 10
- Questions: 500
- Validator warnings linked to this subject: 0
- Content-quality note: no blocking subject-specific warnings were surfaced by the current automated checks.

| Topic | Questions | Status |
|---|---:|---|
| Pergerakan Asas | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Lokomotor | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Bukan Lokomotor | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Manipulasi Alatan | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Koordinasi | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kecergasan Fizikal | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Keselamatan Semasa Aktiviti | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Permainan Mudah | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Rekreasi | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Gaya Hidup Aktif | 50 | 🟢 No specific warning surfaced in the current automated checks. |

### Pendidikan Kesihatan Tahun 2 (pk)

- Topics: 10
- Questions: 500
- Validator warnings linked to this subject: 0
- Content-quality note: no blocking subject-specific warnings were surfaced by the current automated checks.

| Topic | Questions | Status |
|---|---:|---|
| Kebersihan Diri | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Pemakanan Sihat | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Keselamatan Diri | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kesihatan Mental dan Emosi | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Keselamatan Jalan Raya | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Pencegahan Penyakit | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Pertolongan Cemas Asas | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Kesihatan Persekitaran | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| Gaya Hidup Sihat | 50 | 🟢 No specific warning surfaced in the current automated checks. |
| UASA Kesihatan | 50 | 🟢 No specific warning surfaced in the current automated checks. |

## Repetition audit

- BM: 788 repeated hint templates, 768 repeated explanation templates, 0 repeated stem groups, 0 confirmed issues.
- English: 92 repeated hint templates, 105 repeated explanation templates, 16 repeated stem groups, 30 CEFR outliers.
- Mathematics, Science, Bahasa Arab, Pendidikan Islam, Pendidikan Jasmani, and Pendidikan Kesihatan did not surface blocking duplicate-stem warnings in the current question validator output.

## Release recommendation

Release Candidate readiness is good from a structural QA perspective, but the repository still carries medium-priority content work in BM and English: duplicate stems, repetitive hint/explanation templates, BM possible DBP flags, and English CEFR outliers.

Suggested next step: keep content frozen for non-BM/non-English subjects, then run a focused BM/English remediation pass before final RC sign-off.
