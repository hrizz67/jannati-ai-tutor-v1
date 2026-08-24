# Adaptive Question Engine 2.0 Report

## Overview

Sprint 2 introduces a new adaptive question layer that ranks candidate questions using student profile data, confidence history, repeated mistakes, revision planning, and session balance signals. The existing quiz and UASA flows remain intact; this sprint only changes ordering and selection priority.

## Architecture

### New modules

- `src/ai/adaptive/questionScoring.js`
- `src/ai/adaptive/questionPriority.js`
- `src/ai/adaptive/adaptiveStatistics.js`
- `src/ai/adaptive/adaptiveSelector.js`
- `src/ai/adaptive/adaptiveQuestionEngine.js`
- `src/ai/adaptive/index.js`

### Integration points

- `src/ai/question/questionSelector.js`
- `src/ai/questionGenerator/questionSelector.js`
- `src/ai/questionGenerator/smartQuestionGenerator.js`

These existing selectors now ask the adaptive layer to rank candidate questions before legacy duplicate/history filtering runs.

## Scoring Formula

Each question is scored from 0 to 100.

Positive factors:

- Weak topic: `+40`
- Repeated mistake: `+35`
- Low confidence: up to `+25`
- Low accuracy: up to `+20`
- Long time not practised: up to `+20`
- Revision plan match: `+15`
- Knowledge gap: up to `+10`

Penalties:

- Recently answered: `-30`
- Same question repeated: `-40`
- Mastered topic: `-50`

Additional soft balance signals are used to prevent the same topic or subject from dominating a session.

## Selection Flow

1. Load student profile and mistake context from existing storage.
2. Build revision and weakness signals.
3. Score every candidate question.
4. Reorder questions greedily to reduce same-topic clustering.
5. Return the ordered question list plus a top-question summary.
6. If anything fails, the selectors fall back to the previous legacy ordering.

## Fallback Strategy

The adaptive layer is designed to fail closed:

- If adaptive scoring throws, the legacy candidate order is kept.
- If a score is unavailable, the existing selector behavior still works.
- No UI changes are required for the fallback path.

## Validation Results

- `node scripts/validate/questionValidator.js` → `0 errors, 12 warnings, 0 info`
- `node scripts/validate/speechRegression.mjs` → passed
- `npm run build` → passed

### Build summary

- Vite production build completed successfully.
- Main bundle after this sprint: `568.28 kB` (gzipped `164.99 kB`).
- Subject bundles continue to be split into separate chunks.

## Risk Assessment

### Low risk

- Ranking changes are deterministic and local to question ordering.
- Legacy behavior remains available if the adaptive path fails.
- Existing UI, scoring, and speech flows are untouched.

### Known considerations

- The adaptive layer depends on the quality of profile and mistake history already stored in local data.
- Session-balance penalties are intentionally light so mastered topics can still appear occasionally.

## Future Improvements

- Add finer-grained topic difficulty calibration per subject.
- Add explicit knowledge-pack signals once the coach knowledge adapter is wired into question selection.
- Surface adaptive selection reasoning in internal debug tooling.
