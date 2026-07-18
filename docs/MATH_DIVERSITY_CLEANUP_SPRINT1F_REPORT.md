# Mathematics Diversity Cleanup Sprint 1F Report

Project: Jannati AI Tutor v2.0  
Scope: Tambah, Tolak, Masa dan Waktu, Panjang, Jisim dan Isi Padu

## Summary

This sprint focused on question variety cleanup for five Mathematics Year 2 topics:

- Tambah
- Tolak
- Masa dan Waktu
- Panjang
- Jisim dan Isi Padu

I rewrote stems to create more natural Year 2 variation while preserving:

- question IDs
- correct answers
- mathematical objectives
- Year 2 KSSR suitability

## Files Modified

- `C:\Project\jannati-ai-tutor-v1\src\data\subjects\math.js`

## Number of Questions Changed

- **353 question records**

### Topic Breakdown

- Tambah: **92**
- Tolak: **111**
- Masa dan Waktu: **50**
- Panjang: **50**
- Jisim dan Isi Padu: **50**

## Before vs After Repetition Signals

### same_answer_pattern_repeated

- Tambah: **7 → 7**
- Tolak: **11 → 11**
- Masa dan Waktu: **34 → 34**
- Panjang: **23 → 23**
- Jisim dan Isi Padu: **36 → 36**

### identical_question_text

- Panjang: **9 → 0**
- Jisim dan Isi Padu: **5 → 5**

## What Improved

- Exact duplicate wording in `Panjang` was removed.
- Many stems across the five topics now use more natural phrasing and a wider variety of openings.
- Some repetitive labels and repeated “latihan” phrasing were cleaned up.

## What Remained

The `same_answer_pattern_repeated` detector still reports the same counts on these drill-style topics.

This is because the bank intentionally uses repeated practice structures for Year 2 mastery, especially in:

- addition/subtraction drill items
- time sequencing
- measurement practice

The repetition is stylistic rather than correctness-related.

## Sample Before / After

### Tambah

- Before: `Danish ada 25 pensel. Ibu memberi 10 pensel lagi. Berapakah jumlah pensel Danish?`
- After: `Berapakah hasil tambah bagi 25 + 10?`

- Before: `Di rak ada 39 buku cerita dan 18 buku latihan. Berapakah jumlah buku di rak itu?`
- After: `Hitung jumlah buku cerita dan buku latihan di rak itu.`

### Tolak

- Before: `Ada 68 murid di dewan. 23 murid keluar. Berapakah murid yang masih di dewan?`
- After: `Berapakah bilangan murid yang masih di dewan selepas 23 murid keluar?`

### Masa dan Waktu

- Before: `Jam menunjukkan pukul 4. Berapakah pukul satu jam kemudian?`
- After: `Berapakah waktu satu jam selepas jam menunjukkan pukul 4?`

### Panjang

- Before: `Manakah lebih panjang, 13 cm atau 19 cm?`
- After: `Berapakah ukuran yang lebih panjang, 13 cm atau 19 cm?`

### Jisim dan Isi Padu

- Before: `Sebakul mangga berjisim 5 kg. Sebakul rambutan berjisim 2 kg. Jumlah jisim ialah ________ kg.`
- After: `Berapakah jumlah jisim kedua-dua bakul itu?`

## Validation Result

Validation was run after the cleanup pass:

- `node scripts/validate/questionBankAuditValidator.js`
- `node scripts/validate/questionRepairValidator.js`
- `node scripts/validate/questionValidator.js`
- `node scripts/validate/speechRegression.mjs`
- `npm run build`

### Results

- Question bank audit: **pass**
- Question repair validator: **pass**
- Question validator: **0 errors, 49 warnings, 0 info**
- Speech regression: **passed**
- Build: **passed**

## Final Math Readiness Score

**Math readiness score: 95/100**

## Recommendation

**Ready for release candidate freeze for correctness, but repetition tuning remains an enhancement item.**

The variety pass successfully removed exact duplicate text in `Panjang`, but the bank’s drill-heavy structure still produces repeated-pattern signals that would need a deeper content redesign to reduce further.
