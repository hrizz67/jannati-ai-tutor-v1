# V3 AI Coach Integration

## Summary

Tutor AI modal is now connected to the existing learning engine through the public AI barrel:

- `src/ai/index.js` → `getTutorResponse(...)`
- `src/components/ai/TutorAIModal.jsx`

The modal keeps the existing workflow and only changes the response source, loading states, and fallback handling.

## Public AI Function

Used public entry point:

- `getTutorResponse(options)`

Implemented in:

- `src/ai/tutorResponseEngine.js`

Re-exported from:

- `src/ai/index.js`

## Context Passed Into the Coach

The modal forwards the following context fields:

- student profile
- subject
- topic
- question
- student answer
- correct answer
- correctness flag
- attempt count
- hints used
- weak topics
- strong topics
- learning observation
- prediction profile
- readiness summary
- study plan
- gamification profile
- conversation history
- prompt text
- intent

## Supported Intents

- `general`
- `weak_topic`
- `revision_plan`
- `uasa_summary`
- `hint`
- `question_help`
- `wrong_answer_coaching`
- `correct_answer_reinforcement`

## Fallback Behavior

If the coach engine cannot produce a ready response, the modal now falls back safely to deterministic Malay guidance.

Fallback covers:

- missing subject/topic
- unknown subject
- malformed payloads
- incomplete knowledge output
- engine failure

The UI never shows:

- `undefined`
- `null`
- `[object Object]`

## Accessibility Updates

- dialog semantics with `role="dialog"`
- `aria-modal="true"`
- labelled title and body
- Escape key closes the modal
- focus trap inside the dialog
- focus restoration to the opener
- polite live region for status updates

## Sanitized UASA Wording

`sanitizeAiText(...)` removes the literal acronym `UASA` from generated prose, so the intent still works but the displayed copy may appear as a general progress summary. The audit now checks the summary content instead of the acronym alone.

## Validation Results

- `node scripts/validate/aiTutorIntegrationAudit.mjs` → PASS
- `node scripts/validate/dashboardConsistencyAudit.mjs` → PASS
- `node scripts/validate/compactUiAudit.mjs` → PASS
- `node scripts/validate/productionPolish.mjs` → PASS
- `node scripts/validate/uiAudit.mjs` → PASS
- `node scripts/validate/v3ReleaseCandidateAudit.mjs` → PASS
- `npm run build` → PASS

## Remaining Limitations

- Node still reports module-type warnings for some ES module files because `package.json` does not declare `"type": "module"`.
- The production build still warns about large chunks, which is pre-existing bundle pressure rather than a regression from this modal integration.

