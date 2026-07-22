# Jannati AI Tutor v3 Live Mobile Release-Blocker Audit

## Executive result

**READY WITH NON-BLOCKING WARNINGS** for automated validation. No automated critical blocker remains. Real iPhone Safari, audio hardware, keyboard and print-preview checks remain outstanding and must be completed before publishing.

## Root causes repaired

1. UASA state was shared across subjects; it now resets on subject change, generates 50 questions from the selected subject and persists under a subject/year key.
2. Parent aggregation read sparse ordinary-profile totals while adaptive history contained activity; the dashboard now merges canonical/adaptive totals safely.
3. Accepted-answer checking was split between `accepted` and `acceptedAnswers`; `smartCheck` now normalizes and checks both.
4. Communication content had a mojibake Arabic sample and prototype-sized pools; Arabic source text is corrected and deterministic per-language pools are declared for reading, listening, speaking and writing.
5. Live Tutor duplicate-send auditing now recognises the existing `loading` guard.

## Files changed

- `src/App.jsx`
- `src/dashboard/ParentDashboard.jsx`
- `src/utils/smartCheck.js`
- `src/utils/canonicalProgress.js`
- `src/utils/subjectScopedStorage.js`

## Validators created/updated

`liveMobileReleaseBlockerAudit.mjs`, `subjectIsolationAudit.mjs`, `uasaSubjectSwitchAudit.mjs`, `canonicalProgressAudit.mjs`, `parentAnalyticsAggregationAudit.mjs`, `aiLiveInteractionAudit.mjs`, `communicationModulesAudit.mjs`, `multipleAcceptedAnswersAudit.mjs`, `mobileOverlayAudit.mjs`, and `audioContentAudit.mjs` all pass in the current workspace.

## Coverage summary

| Area | Result |
|---|---|
| Subject isolation | PASS |
| UASA switching/resume | PASS |
| Canonical progress and parent aggregation | PASS |
| Tutor live interaction and accepted answers | PASS |
| Communication content integrity | PASS (pool metadata) |
| Mobile overlay/safe-area/static layout | PASS |
| Audio/speech static safety | PASS |
| Production build | PASS; Vite reports the existing large main chunk (~648 kB minified) |

## Remaining warnings

- physical iPhone Safari microphone/speech and keyboard testing;
- five-session non-repeat behavior should be exercised through the UI, not only pool metadata;
- print preview and long Arabic/Jawi labels require device/browser confirmation;
- Vite large-chunk warning remains a performance opportunity, not a correctness blocker.

## Release recommendation

**READY WITH NON-BLOCKING WARNINGS** after the manual checklist is completed. Do not claim `READY` until the real-device checklist is signed off.
