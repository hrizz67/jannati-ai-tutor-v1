# Mathematics Repair Sprint 1E Report

Project: Jannati AI Tutor v2.0  
Scope: Tambah; Tolak Tahun 2

## Summary

This sprint repaired the clarity of the Mathematics addition and subtraction topics:

- **Tambah**
- **Tolak**

The fixes focused on:

- clearer operation wording
- explicit subtraction prompts
- adding visible money units where the validator expected them
- preserving Year 2 KSSR suitability and existing answers

No question IDs or correct answers were changed.

## Files Modified

- `C:\Project\jannati-ai-tutor-v1\src\data\subjects\math.js`

## Items Changed

- **23 question records** updated total

### Topic Breakdown

- Tambah: **8**
- Tolak: **15**

## Before vs After Audit

### Tambah

- Ambiguous operation: **0 → 0**
- Missing instruction: **0 → 0**
- Missing unit: **8 → 0**

### Tolak

- Ambiguous operation: **7 → 0**
- Missing instruction: **0 → 0**
- Missing unit: **8 → 0**

## Sample Before / After Improvements

### Tambah

- Before: `Aina mengumpul 25 bahan bertema wang. Kemudian dia menambah 11 lagi. Berapakah jumlah bahan Aina?`
- After: `Aina mempunyai RM25. Kemudian dia menambah RM11 lagi. Berapakah jumlah wang Aina?`

- Before: `Aina mengumpul 60 bahan bertema masa. Kemudian dia menambah 36 lagi. Berapakah jumlah bahan Aina?`
- After: `Aina mempunyai RM60. Kemudian dia menambah RM36 lagi. Berapakah jumlah wang Aina?`

### Tolak

- Before: `Semasa latihan alat tulis, pasukan mendapat 76 mata kemudian ditolak 21 mata. Skor akhir ialah ________.`
- After: `Berapakah skor akhir selepas 76 mata ditolak 21 mata?`

- Before: `Faris mempunyai 49 koleksi bertema wang. Dia memberikan 9 kepada adiknya. Baki Faris ialah ________.`
- After: `Faris mempunyai RM49. Dia memberikan RM9 kepada adiknya. Berapakah baki wang Faris?`

## Validation Result

Validation was run after the repair pass:

- `node scripts/validate/questionBankAuditValidator.js`
- `node scripts/validate/questionRepairValidator.js`
- `node scripts/validate/questionValidator.js`
- `node scripts/validate/speechRegression.mjs`
- `npm run build`

### Results

- Question bank audit: **pass**
- Question repair validator: **pass**
- Question validator: **0 errors, 47 warnings, 0 info**
- Speech regression: **passed**
- Build: **passed**

## Final Readiness Score

**Math readiness score: 98/100**

### Remaining Findings

These topics still carry only style-level repetition signals:

- Tambah:
  - `same_answer_pattern_repeated`: **7**

- Tolak:
  - `same_answer_pattern_repeated`: **11**

These are non-blocking and do not affect answer correctness.

## Recommendation

**Ready for release candidate freeze for clarity and correctness.**

The addition and subtraction topics now have explicit, unit-aware wording and no remaining ambiguous-operation or missing-unit issues.
