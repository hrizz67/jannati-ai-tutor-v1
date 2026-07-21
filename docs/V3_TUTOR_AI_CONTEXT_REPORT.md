# Tutor AI Context & Explain Flow Rebuild Report

## Summary

This pass tightened Tutor AI so it behaves more like a real exercise coach and less like a generic fallback.

What changed:

- Current question context now takes priority in Tutor AI responses.
- Hidden IDs / slug-like tokens are filtered from child-facing text.
- Hint responses no longer expose the exact answer.
- Explain and Ajar Saya flows now render structured sections progressively.
- AI modals now use public utility facades instead of importing internal AI files directly.
- Fallback-state messaging is present for QA/dev visibility, while production continues to use child-safe wording.
- Topic labels are normalized into human-readable names, including Malay, English, Science, PJK, and internal adaptive labels.
- The feedback FAB is suppressed while modals are open.

## Files changed

- `src/ai/tutorResponseEngine.js`
- `src/ai/explainEngine.js`
- `src/ai/teacherEngine.js`
- `src/ai/learningCopy.js`
- `src/ai/coach/coachAdapter.js`
- `src/components/ai/AIExplainModal.jsx`
- `src/components/ai/AITeacherModal.jsx`
- `src/components/ai/TutorAIModal.jsx`
- `src/parentInsights/insightsService.js`
- `src/studyPlanner/studyPriority.js`
- `src/styles/style.css`
- `src/utils/displayFormatter.js`
- `src/utils/childText.js` *(new)*
- `src/utils/tutorResponseService.js` *(new)*
- `scripts/validate/aiContextQualityAudit.mjs` *(new)*
- `scripts/validate/aiTutorIntegrationAudit.mjs`

## Key behaviour improvements

### Context priority

Tutor AI now prefers:

1. current question
2. current answer attempt
3. current topic
4. current subject
5. learner mastery
6. weak / strong topic summaries
7. general study plan

### Human-readable topic labels

Examples now resolve to friendly labels such as:

- `adaptive_adaptive_practice_338109144_v5znxc` → `Latihan Adaptif`
- `bm_kata_nama_khas` → `Kata Nama Khas`
- `english_nouns_common` → `Common Nouns`
- unresolved topics → `topik semasa`

### Child-safe rendering

The response layer now sanitizes:

- internal IDs
- UUID-like tokens
- snake_case technical slugs
- `[object Object]`
- `undefined`
- `null`

### Modal improvements

- Progressive disclosure in Explain / Ajar Saya
- Explicit step-by-step section wording
- Mobile-safe modal scroll behavior
- Close button stays accessible and keyboard-friendly

### Fallback and intent handling

- Hint mode avoids revealing the exact answer
- Weak-topic, revision-plan, UASA-summary, and wrong-answer coaching now produce clearer intent-aware text
- The Tutor AI fallback state is visible in QA/dev but remains child-safe in production

## Validation results

All of the following passed:

- `node scripts/validate/aiContextQualityAudit.mjs`
- `node scripts/validate/aiTutorIntegrationAudit.mjs`
- `node scripts/validate/v3ReleaseCandidateAudit.mjs`
- `npm run build`

## Notes

- The production build still reports large bundle chunks, which is a pre-existing performance warning rather than a functional regression.
- Node still prints module-type warnings for some ESM files because `package.json` does not declare `type: module`.

## Final status

Tutor AI contextual responses and the Explain flow are now rebuilt around the current question context and are release-candidate ready.
