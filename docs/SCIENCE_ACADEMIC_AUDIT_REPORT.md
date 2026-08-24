# Science Academic Audit Report

Project: Jannati AI Tutor v1

Scope: Year 2 Science question bank only

Audit type: Read-only academic audit

## Executive Summary

The Science bank is structurally strong and highly consistent.

- Total questions: 500
- Topics: 10
- Questions per topic: 50 each
- Automated validation: 0 errors, 12 warnings overall, with no Science-specific warnings
- Curriculum audit: 100% metadata, 100% mapped SK, 100% mapped SP, 57% verified overall

No critical scientific errors were identified during this audit. The bank is broadly suitable for Year 2 learners and is evenly distributed across the core Science strands.

The main quality note is editorial rather than scientific: the Kemahiran Saintifik set reuses a very similar hint/explanation frame across multiple items, and a few explanations are slightly generic. These do not appear to break correctness, but they reduce variety and instructional richness.

## Files Inspected

- `src/data/subjects/sains.js`
- `reports/validation/question-report.json`
- `node scripts/validate/questionValidator.js` output
- `node scripts/audit/curriculumAudit.js` output

## Audit Results by Module

### 1) Scientific Facts

Result: No factual errors identified from automated checks and spot review.

Observations:

- Topic set is well-scoped to Year 2 Science.
- Question patterns are simple and concrete.
- Explanations generally match the target answer.
- No contradictory science statements were found in the sampled review.

### 2) Answers

Result: No answer/accepted-answer contradictions identified in the reviewed bank.

Observations:

- Questions inspected had matching `answer`, `accepted`, `hint`, and `explanation` fields.
- No malformed answer structures were found in the Science subject file.

### 3) Terminology

Result: Strong overall, with minor editorial softness in a few “kemahiran saintifik” explanations.

Observations:

- Core Science terms are age-appropriate and aligned to Year 2:
  - haiwan
  - tumbuhan
  - manusia
  - air
  - cahaya
  - bunyi
  - bumi
  - bahan
  - teknologi
  - kemahiran saintifik
- The wording is generally natural Malaysian Malay.
- A few items in Kemahiran Saintifik use a repeated “memerhati” explanation frame even when the sense involved would read more naturally as “mengenal”, “menghidu”, “mendengar”, or “merasa”.

### 4) Year 2 Level

Result: Appropriate overall.

Observations:

- Sentence length is mostly short and accessible.
- Vocabulary is mostly concrete and familiar.
- Items are simple enough for Year 2 learners.
- The bank is not overloaded with complex syntax.

### 5) Hints

Result: Consistent and generally safe.

Observations:

- Hints are short and typically guide without revealing the answer directly.
- The repeated hint frame in Kemahiran Saintifik is functional but somewhat repetitive.

### 6) Explanations

Result: Mostly accurate and teacher-like.

Observations:

- Explanations usually state the reason in one short sentence.
- Some Kemahiran Saintifik explanations are a little generic and could be more specific, but they remain scientifically acceptable.

### 7) Topic Coverage

Science strand coverage is balanced and complete for the current bank.

| Topic | Questions |
|---|---:|
| Haiwan | 50 |
| Tumbuhan | 50 |
| Manusia | 50 |
| Air | 50 |
| Cahaya | 50 |
| Bunyi | 50 |
| Bumi | 50 |
| Bahan | 50 |
| Teknologi | 50 |
| Kemahiran Saintifik | 50 |

Coverage assessment:

- Living things: covered
- Plants: covered
- Animals: covered
- Human body: covered
- Matter/materials: covered
- Energy/light/sound: covered
- Earth/weather/environment: partially represented through Bumi
- Technology: covered
- Scientific skills: covered

### 8) UASA Readiness

Result: Good foundation for UASA-style practice.

Observations:

- Topic balance is even.
- Difficulty distribution is reasonably balanced:
  - mudah: 200
  - sederhana: 200
  - sukar: 100
- The bank is suitable for practice and review.
- There is room to add more varied reasoning and application prompts if UASA complexity is to be increased later.

## Issue Inventory

### Critical Issues

- None identified.

### High Issues

- None identified.

### Medium Issues

1. Repetitive hint/explanation frame in Kemahiran Saintifik.
2. A few explanation sentences are slightly generic rather than richly instructive.

### Low Issues

- Minor editorial repetition in some topic blocks.
- Some learning prompts are very templated, which lowers variety but not correctness.

## Quality Scores

These are audit scores based on the current bank and the issues observed during review.

- Scientific accuracy score: 99/100
- Terminology score: 98/100
- Educational quality score: 95/100
- Coverage score: 100/100
- UASA readiness score: 93/100
- Overall Science quality score: 96/100

## Validation Summary

- `node scripts/validate/questionValidator.js`
  - Result: 0 errors, 12 warnings overall
  - Science-specific warnings: none observed in the report

- `node scripts/audit/curriculumAudit.js`
  - Result: 100% metadata, 100% mapped SK, 100% mapped SP, 57% verified overall

## Priority Fix Order

1. Improve the Kemahiran Saintifik hint/explanation variety.
2. Refine a few generic explanation lines to sound more teacher-like.
3. Keep the current balanced topic and difficulty structure.

## Conclusion

The Science bank is ready for continued use and is broadly suitable for Year 2 learners.

No content rewrite was performed during this audit.

