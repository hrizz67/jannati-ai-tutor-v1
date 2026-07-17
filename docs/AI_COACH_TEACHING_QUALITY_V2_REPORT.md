# AI Coach Teaching Quality v2 Report

Branch: `feature/ai-coach-teaching-quality-v2`

## Summary

This sprint improved the teaching consistency of AI Explain and Ajar Saya by:

- standardising the visible teaching structure across the modal flows
- adding subject-aware encouragement and practice tone
- upgrading Arabic pronunciation and reading scaffolds
- strengthening English with meaning, example sentence, and speaking support
- adding Science KBAT-style prompts for reasoning and real-life application

The Knowledge Engine fallback remains intact.

## Before vs After Score

| Subject | Before | After (estimated) | Change |
|---|---:|---:|---:|
| BM | 93 | 93 | 0 |
| Math | 97 | 97 | 0 |
| English | 91 | 95 | +4 |
| Science | 95 | 97 | +2 |
| Arabic | 84 | 92 | +8 |
| Islam | 88 | 88 | 0 |
| PJ | 86 | 86 | 0 |
| PK | 87 | 87 | 0 |

**Overall teaching quality score:** 90 → 93 (estimated)

## Subject score table

| Subject | Score | Status | Notes |
|---|---:|---|---|
| BM | 93 | Excellent | Stable; subject tone now feels more consistent in the adapter |
| Math | 97 | Excellent | No content rewrite needed; retained strong step-by-step teaching |
| English | 95 | Excellent | Added word meaning, example sentence, and guided speaking support |
| Science | 97 | Excellent | Added why / prediction / comparison / real-life application prompts |
| Arabic | 92 | Excellent | Added pronunciation, reading, letter breakdown, and listening scaffolding |
| Islam | 88 | Good | Stable; fallback and pack structure remain strong |
| PJ | 86 | Good | Stable; practical coaching remains safe and age-appropriate |
| PK | 87 | Good | Stable; practical health guidance remains safe and age-appropriate |

## Teaching improvements

### Standard teaching structure

The adapter and modals now support a clearer teaching flow:
1. Concept explanation
2. Simple explanation
3. Step-by-step guidance
4. Examples
5. Common mistakes
6. Memory technique
7. Practice guidance

### Subject personality

The teaching voice now feels more distinct by subject:
- Math: calculation-first guidance
- BM: sentence-building guidance
- English: sentence practice guidance
- Science: scientist-style reasoning
- Arabic: pronunciation-focused support
- Islam: adab and reflection tone
- PJ: safe movement coaching
- PK: healthy habit coaching

### Arabic upgrade

Added support fields for:
- `pronunciationGuide`
- `readingSteps`
- `letterBreakdown`
- `listeningTips`

Focused on:
- `huruf_hijaiyah`
- `mufradat`
- `ayat_mudah_arab`
- `hiwar`

### English upgrade

Added:
- `wordMeaning`
- `exampleSentences`
- `problemSolvingSteps`

Applied to:
- `nouns`
- `verbs`
- `adjectives`
- `prepositions`
- `reading`

### Science KBAT upgrade

Added:
- `whyQuestions`
- `predictionQuestions`
- `comparisonQuestions`
- `realLifeApplications`

Applied to:
- `haiwan`
- `tumbuhan`
- `manusia`
- `cahaya`
- `bunyi`

## Files changed

- `src/ai/coach/knowledge/schemas/knowledgeSchema.js`
- `src/ai/coach/knowledge/knowledgeAdapter.js`
- `src/components/ai/AIExplainModal.jsx`
- `src/components/ai/AITeacherModal.jsx`
- `src/ai/coach/knowledge/subjects/english/nouns.js`
- `src/ai/coach/knowledge/subjects/english/verbs.js`
- `src/ai/coach/knowledge/subjects/english/adjectives.js`
- `src/ai/coach/knowledge/subjects/english/prepositions.js`
- `src/ai/coach/knowledge/subjects/english/reading.js`
- `src/ai/coach/knowledge/subjects/arab/huruf_hijaiyah.js`
- `src/ai/coach/knowledge/subjects/arab/mufradat.js`
- `src/ai/coach/knowledge/subjects/arab/ayat_mudah_arab.js`
- `src/ai/coach/knowledge/subjects/arab/hiwar.js`
- `src/ai/coach/knowledge/subjects/sains/haiwan.js`
- `src/ai/coach/knowledge/subjects/sains/tumbuhan.js`
- `src/ai/coach/knowledge/subjects/sains/manusia.js`
- `src/ai/coach/knowledge/subjects/sains/cahaya.js`
- `src/ai/coach/knowledge/subjects/sains/bunyi.js`

Generated outputs during validation/build:
- `reports/validation/question-report.json`
- `dist/index.html`

## Validation results

- `node scripts/validate/knowledgeValidator.mjs` ✅
  - Critical: 0
  - High: 0
  - Medium: 0
  - Low: 0
  - Duplicate findings: 193
  - Harmful duplicates: 0
  - Acceptable shared wording: 187
  - Template reuse signals: 6
- `node scripts/validate/questionValidator.js` ✅
  - 0 errors, 12 warnings, 0 info
- `node scripts/validate/speechRegression.mjs` ✅
  - speech regression tests passed
- `npm run build` ✅
  - build passed successfully
  - main bundle remains above 500 kB, but behaviour is unchanged

## Risk assessment

Low risk.

Why:
- no architecture rewrite
- fallback remains intact
- no question bank or scoring changes
- no speech flow changes
- no adaptive engine changes

Main remaining risks:
- Arabic still benefits from future pronunciation-rich content expansion
- some teaching tone is still adapter-generated rather than deeply bespoke per topic
- bundle size warning remains outside this sprint’s scope

## Release note

The AI Coach now feels more consistent as a teacher across subjects, with the biggest gains in Arabic, English, and Science.

