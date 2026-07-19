# V3 Smart Question Generator Regression Report

## Executive Summary

The failing repeat-guard assertion was reproducible and deterministic.

- Exact failure: `AssertionError [ERR_ASSERTION]: Repeat guard should avoid the most recent question.`
- Actual value: `Q1`
- Expected: not `Q1`
- Failure location: `scripts/validate/smartQuestionGeneratorRegression.mjs:150`

Root cause: the smart question selection path was not consistently carrying the recent-question history into the final quality-selection stage, so the most recent question could still be chosen when it remained the highest-ranked item after quality sorting.

Classification: `repeat-guard boundary condition` with a selection-layer integration defect.

AI Coach v3 was not involved in this failure path. The issue is inside the smart question generator stack only.

## Reproduction Details

Test case involved:

- Subject: `bm`
- Topic: `kata_kerja`
- Profile: default profile + weak kata kerja history in the regression fixture
- Recent history: `Q1` was already present in `smartState.lastQuestions` and `smartState.history`
- Candidate sequence: `Q1`, `Q2`, `Q3`

Before the fix, the regression script failed because `repeatDecision.question?.id` resolved to `Q1`.

After the fix, the deterministic trace shows:

- Candidate IDs: `["Q1","Q2","Q3"]`
- Final selected ID: `Q2`
- Selected order: `["Q2","Q3","Q1"]`
- Recent history snapshot still contained `Q1`

I also ran the regression 10 times in a row with the same deterministic fixture, and all 10 runs passed.

## Root Cause

The repeat guard score existed, but the final selection stage was able to reorder candidates without reliably excluding the most recent question ID from the effective selection pool.

In practical terms:

1. `smartState.lastQuestions` / `smartState.history` contained `Q1`
2. The adaptive layer penalized repeats
3. The quality-selection layer still allowed `Q1` to remain selectable if it ranked first after quality sorting
4. The regression’s repeat-guard assertion then observed `Q1` as the final result

## Fix Applied

Files changed:

- `src/ai/questionGenerator/questionSelector.js`
- `src/ai/questionQuality/questionQualityEngine.js`
- `scripts/validate/smartQuestionGeneratorRegression.mjs`

What changed:

- Recent question IDs are now collected from `smartState.history` and `smartState.lastQuestions` as well as any direct `recentQuestionIds` input.
- The quality-selection stage now prioritizes non-recent candidates first.
- If every candidate is recent, the selection still falls back gracefully instead of crashing or returning an empty result.
- Added a test-only trace helper in the regression script, gated by `SMART_GENERATOR_TRACE=1`, to print:
  - seed
  - requested profile
  - candidate IDs
  - rejected candidate IDs
  - rejection reasons
  - retry count
  - final selected ID
  - recent-history snapshot

## Before / After Behaviour

### Before

- Regression selected `Q1`
- Assertion failed: the most recent question was not avoided
- Repeat protection was present in scoring, but not consistently enforced in the final chosen item

### After

- Regression selects `Q2`
- Recent `Q1` is pushed behind non-recent alternatives
- Repeat guard remains intact
- Fallback still works if all candidates are recent

## Repeat-Guard Guarantees

- Recent question history is honored in the final selection path
- Non-recent alternatives are preferred when available
- The guard does not get bypassed by the quality ranking stage
- If the candidate pool is exhausted, the system still falls back safely rather than crashing
- Deterministic regression runs remain stable across repeated executions

## Validation Results

- `node scripts/validate/smartQuestionGeneratorRegression.mjs` ✅
- `node scripts/validate/questionBankAuditValidator.js` ✅
  - Reported: `Total questions scanned: 4560`, `Critical: 0`, `High: 90`, `Medium: 180`, `Low: 4290`
- `node scripts/validate/questionValidator.js` ✅
  - Reported: `0 errors, 39 warnings, 0 info`
- `node scripts/validate/speechRegression.mjs` ✅
- `node scripts/validate/v3CoachPayloadAudit.mjs` ✅
- `npm run build` ✅

Deterministic stress check:

- 10 consecutive regression runs passed

## Remaining Risks

- The repository still has unrelated content-quality audit findings in the broader question bank validators.
- The build still emits a large-chunk warning, but no build errors.
- Node emits a module-type warning for several ESM files because `package.json` does not declare `"type": "module"`.

These are existing hygiene issues, not regressions from this fix.

## Final Classification

`repeat-guard boundary condition`

This was a genuine generator regression in the question-selection path, not a flaky test and not an AI Coach defect.
