# AI Coach Knowledge Engine Integration Report

Version: feature/coach-knowledge-engine

## Overview

Sprint 10 integrates the production-ready AI Coach Knowledge Engine into the learner-facing coach surfaces while preserving the existing hardcoded coach logic as a fallback.

The integration is intentionally safe:

- Knowledge packs are used when available.
- Existing BM-centric fallback copy remains active when a pack is missing.
- No scoring, speech, adaptive logic, or question bank behavior was changed.

## Components Migrated

| Component | Knowledge Engine Usage | Fallback |
| --- | --- | --- |
| Quiz hint flow | Uses topic knowledge hint/tip content through the adapter | Existing coaching decision / question hint |
| AI Explain modal | Uses knowledge pack explanations, examples, tips, memory tips, mistakes, and follow-up prompts | `explainAnswer(...)` |
| Ajar Saya modal | Uses knowledge pack explanations, examples, subject-specific learning supports, and practice prompts | `teachAnswer(...)` |

## Knowledge Engine Usage

The new adapter layer lives at:

`src/ai/coach/knowledge/knowledgeAdapter.js`

It exposes:

- `getKnowledgePack(subjectId, topicId)`
- `getTeacherExplanation(subjectId, topicId)`
- `getExamples(subjectId, topicId)`
- `getExtraExamples(subjectId, topicId)`
- `getTips(subjectId, topicId)`
- `getMemoryTips(subjectId, topicId)`
- `getCommonMistakes(subjectId, topicId)`
- `getEncouragement(subjectId, topicId)`
- `getFollowUpQuestions(subjectId, topicId)`

It also builds a topic-aware coach payload for the modal surfaces and rotates repeated content so the same entry is not shown back-to-back.

## Fallback Usage

Fallbacks remain in place at the app layer:

- If a knowledge pack cannot be loaded, the app falls back to `explainAnswer(...)` for Explain mode.
- If a knowledge pack cannot be loaded, the app falls back to `teachAnswer(...)` for Teach Me mode.
- If a pack is unavailable for quiz hints, the existing coaching decision / question hint path remains active.

Development-only logs were added for:

- knowledge pack loaded
- fallback used
- missing topic

## Regression Results

| Validation | Result |
| --- | --- |
| `node scripts/validate/knowledgeValidator.mjs` | Passed |
| `node scripts/validate/questionValidator.js` | Passed with 0 errors, 12 warnings |
| `node scripts/validate/speechRegression.mjs` | Passed |
| `npm run build` | Passed |

## Integration Risks

- The app still contains legacy coach copy, but it is now a fallback path rather than the primary source.
- The remaining question validator warnings are non-blocking and unrelated to the coach integration.
- Large bundle warnings still exist in Vite output; they are performance-related, not functional.

## Performance Impact

Expected impact is small and controlled:

- One new adapter module.
- Slightly larger coach modal payloads when packs are present.
- No change to quiz scoring or speech timing.

The build remains successful and the new coach content is loaded only when the learner opens the relevant surfaces.

