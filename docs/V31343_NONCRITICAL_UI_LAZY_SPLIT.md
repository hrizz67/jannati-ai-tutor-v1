# v3.13.43 non-critical UI lazy split — independent performance experiment

## Dependency and intent
- Stacked **only** on Draft PR #227 (tagged-build parity and validation-STT isolation), at exact base `da9b3e0946cebc1a0930e0a26571267744266ce3`.
- Do NOT merge/deploy this branch separately to main; keep the validated PR #227 head unchanged.
- Goal: initial JavaScript <= **895.00 kB** under the tagged-production flag build and <=900 kB hard budget for all flavors.

## Strictly non-critical UI split
1. `QuizDiagnosticsPanel.jsx`: internal QDE/QIP debug `<details>` moved into lazy chunk. Rendered only when `isInternalUiSurfaceEnabled()`; no change to public quiz answers, feedback, hints, rewards, speech or Tutor.
2. `BetaFeedbackButton.jsx`: internal owner-beta feedback form and state moved into lazy chunk. Original `saveFeedbackItem` callback continues to persist device-local records. Existing accessibility attributes, Escape behavior, and form validation are preserved.
3. `tests/unit/deferredNonCriticalUi.test.jsx`: DOM and source assertions that the internal fields, dialog semantics, keyboard handling and lazy imports remain intact.

## Acceptance gates
- Exact-head CI: unit tests 0 FAIL, validation **0 errors / 0 warnings**, no bundle budgets raised.
- Three bundle flavors: default CI, tagged-production parity using dummy Supabase config and exact public release flags, isolated QA preview.
- Exact tagged-production <=895 kB is the **recommended robustness target**, but 900 kB remains the hard release gate.
- Synthetic Chrome review needed for internal debug flag path and beta feedback on iOS/Android, plus Year 2/3 profile-switch regression after eventual stacked merge.
- Any lazy chunk failure must not block core quiz progress, offline storage, or child identity; diagnostic/feedback UI does not carry those critical functions.
- Do not change STT activation, remote AI, subject content, auth, Supabase schema, Worker, release metadata or live data.

**Decision before CI: DRAFT / MERGE-HOLD**. No merge, tag or deploy authorised.
