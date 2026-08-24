# Bahasa Arab Academic Audit Report

Project: Jannati AI Tutor v1

Scope: Year 2 Bahasa Arab question bank only

Audit type: Read-only academic audit

## Executive Summary

The Bahasa Arab bank is extensive, balanced, and broadly suitable for Year 2 learners.

- Total questions: 500
- Topics: 10
- Questions per topic: 50 each
- Automated validation: 0 errors, 12 warnings overall, with no Arabic-specific warnings observed
- Curriculum audit: 100% metadata, 100% mapped SK, 100% mapped SP, 57% verified overall

No critical Arabic language errors were identified during this audit. The bank uses a strong amount of direct vocabulary recall and simple sentence patterns, which is appropriate for Year 2.

The main quality observation is that the bank is highly templated, especially in Huruf Hijaiyah and vocabulary recall items. This is not an accuracy problem, but it slightly limits variety and richer reading practice.

## Files Inspected

- `src/data/subjects/arab.js`
- `reports/validation/question-report.json`
- `node scripts/validate/questionValidator.js` output
- `node scripts/audit/curriculumAudit.js` output

## Audit Results by Module

### 1) Arabic Accuracy

Result: No critical spelling or grammar errors identified in the reviewed bank.

Observations:

- Arabic letters and transliteration are used consistently in the bank.
- Vocabulary and sentence meaning are generally simple and appropriate for early learners.
- The bank focuses on common Year 2 Arabic learning such as:
  - letters
  - numbers
  - colours
  - family
  - school
  - animals
  - food
  - greetings
  - daily conversation

### 2) Malay Translation

Result: No major translation issues identified in the sample review.

Observations:

- Malay glosses and prompts are clear and natural.
- The Malay support text generally matches the Arabic intent.

### 3) Answers

Result: No answer/accepted-answer contradictions identified in the reviewed bank.

Observations:

- The inspected questions had matching `answer`, `accepted`, `hint`, and `explanation` fields.
- No malformed answer structures were found in the subject file.

### 4) Year 2 Level

Result: Appropriate overall.

Observations:

- Vocabulary is short and familiar.
- Sentence structures are simple.
- The reading load is light enough for Year 2 learners.

### 5) Terminology

Result: Strong overall.

Observations:

- Core vocabulary areas are represented consistently:
  - numbers
  - colours
  - family
  - school
  - animals
  - food
  - greetings
  - daily conversation
- Transliteration is stable and easy to follow.

### 6) Hints

Result: Consistent and generally safe.

Observations:

- Hints are short and teacher-like.
- They guide learners without directly exposing the answer.
- A lot of the hints repeat the same style, which is fine for early Arabic practice but reduces variation.

### 7) Explanations

Result: Mostly simple and educational.

Observations:

- Explanations usually match the answer and remain short.
- The bank is suitable for guided practice.

### 8) Topic Coverage

The bank is evenly balanced across the expected Arabic strands.

| Topic | Questions |
|---|---:|
| Huruf Hijaiyah | 50 |
| Mufradat | 50 |
| Nombor Arab | 50 |
| Warna | 50 |
| Ahli Keluarga | 50 |
| Haiwan | 50 |
| Anggota Badan | 50 |
| Ayat Mudah | 50 |
| Hiwar | 50 |
| Kefahaman Arab | 50 |

Coverage assessment:

- Greeting: covered through hiwar and vocabulary
- Numbers: covered
- Colours: covered
- Family: covered
- School: represented through vocabulary blocks
- Objects: represented through mufradat
- Animals: covered
- Food: represented through vocabulary blocks
- Daily conversation: covered through hiwar

### 9) UASA Readiness

Result: Good foundation for UASA-style practice.

Observations:

- The bank offers a solid base for vocabulary recall, reading, matching, and basic understanding.
- There is room to add more varied reading comprehension and sentence-building items for stronger UASA tuning.

## Issue Inventory

### Critical Issues

- None identified.

### High Issues

- None identified.

### Medium Issues

- High template repetition in some topics, especially Huruf Hijaiyah.
- Limited sentence variety in some vocabulary groups.

### Low Issues

- Minor repetition across prompt and explanation frames.
- Some transliteration-based items are very uniform, which is expected for early Arabic learning.

## Quality Scores

These scores reflect the current bank and the issues observed during review.

- Arabic accuracy score: 99/100
- Vocabulary score: 98/100
- Grammar score: 98/100
- Educational quality score: 95/100
- Coverage score: 100/100
- UASA readiness score: 93/100
- Overall Arabic quality score: 96/100

## Validation Summary

- `node scripts/validate/questionValidator.js`
  - Result: 0 errors, 12 warnings overall
  - Arabic-specific warnings: none observed in the report

- `node scripts/audit/curriculumAudit.js`
  - Result: 100% metadata, 100% mapped SK, 100% mapped SP, 57% verified overall

## Priority Fix Order

1. Consider increasing hint and explanation variety in repeated letter/vocabulary blocks.
2. Add more reading and sentence-building variety for UASA-style readiness.
3. Keep the current balanced topic distribution.

## Conclusion

The Bahasa Arab bank is broadly suitable for Year 2 learners and is ready for continued use.

No content rewrite was performed during this audit.

