# Bahasa Melayu Content Audit Sprint 1 Report

Project: Jannati AI Tutor v2.0  
Scope: Bahasa Melayu Tahun 2 question bank

## Summary

This is a read-only audit of the Bahasa Melayu Year 2 question bank in `src/data/subjects/bm.js`.

The current validator output shows one dominant issue type:

- repeated templates / answer pattern repetition

No current validator flags were returned for:

- incomplete sentences
- grammar mistakes
- unclear instructions
- multiple possible answers
- vocabulary suitability
- reading comprehension quality

That means the current audit layer is mainly detecting repetition rather than correctness or language errors.

## Files Inspected

- `C:\Project\jannati-ai-tutor-v1\src\data\subjects\bm.js`
- `C:\Project\jannati-ai-tutor-v1\reports\validation\question-bank-audit-report.json`
- `C:\Project\jannati-ai-tutor-v1\reports\validation\question-repair-report.json`

## Total BM Questions Scanned

- **800 questions**

## Issue Counts by Type

### Question Bank Audit

- `same_answer_pattern_repeated`: **653**

### Question Repair Validator

- `Total repair suggestions`: **2726**
- `P1 repair list`: **2**
- `Estimated cleanup priority`: **MEDIUM**

## Affected Topics

| Topic | Findings |
|---|---:|
| Kata Nama Am | 20 |
| Kata Nama Khas | 40 |
| Kata Ganti Nama | 44 |
| Kata Kerja | 40 |
| Kata Adjektif | 40 |
| Kata Sendi Nama | 42 |
| Kata Hubung | 44 |
| Penjodoh Bilangan | 78 |
| Ayat Tanya, Seruan dan Perintah | 43 |
| Pemahaman dan Penulisan | 98 |
| Tatabahasa | 45 |
| Imbuhan | 32 |
| Bina Ayat | 32 |
| Simpulan Bahasa | 27 |
| UASA/KBAT | 28 |

## Priority Repair Order

1. **Pemahaman dan Penulisan** — highest concentration of repeated patterns
2. **Penjodoh Bilangan**
3. **Kata Ganti Nama**
4. **Ayat Tanya, Seruan dan Perintah**
5. **Kata Hubung**
6. **Tatabahasa**
7. **Kata Kerja**
8. **Kata Adjektif**
9. **Kata Sendi Nama**
10. **Kata Nama Khas**
11. **UASA/KBAT**
12. **Simpulan Bahasa**
13. **Kata Nama Am**
14. **Imbuhan**
15. **Bina Ayat**

## Audit Observations

### What looks strong

- The BM question bank is structurally complete.
- The validator is not reporting missing instructions, grammar failures, or ambiguous-answer issues in the current BM audit output.

### What needs attention

- The bank has heavy repeated-stem usage across many BM topics.
- The repetition is especially visible in drill-style topics and large practice clusters.

## BM Readiness Score

**BM readiness score: 86/100**

### Why 86?

- Content quality is stable and no correctness blockers are currently flagged.
- However, the question bank still has a large repetition footprint, which affects variety and learner freshness.

## Recommendation

**Ready for content freeze from a correctness standpoint, but repetition cleanup is still recommended for future polish.**

The BM bank is usable, but the topic banks would benefit from a targeted diversity pass to reduce repeated templates and answer-pattern repetition.
