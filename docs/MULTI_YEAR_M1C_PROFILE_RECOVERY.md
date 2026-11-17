# M1-C — Recovery from an unsupported active child year

This is a **stacked Draft PR**, based on M1-B #229; it must not merge to `main` or deploy independently.

## Purpose

M1-B fails closed when a selected child's grade has no approved question bank. Its recovery button took parents to the generic Login screen rather than to their existing child picker. That may strand an authenticated family who has a Year 2 child alongside Year 1/3 profiles.

## Behavior

- The unsupported-year screen is split behind `React.lazy` to avoid eagerly including its markup and selection logic in initial JavaScript.
- Display an informative, labelled unavailable-year screen. No Year 2 question content renders for the unsupported profile.
- List **only existing other Year 2 child profiles** (including a legacy child without a stored year). A profile is never invented, changed from Year 1/3 to Year 2, or unarchived.
- Selecting a profile invokes existing `App.handleSelectChild(child.id)`, which already performs child snapshot checks, cache/migration handling and scoped reload. This component never touches localStorage or cloud.
- A separate “Log masuk atau gunakan profil lain” action retains account/guest recovery when no eligible sibling exists.
- Malformed profile arrays are tolerated; name text is escaped as normal React children.

## Tests

- New mounted jsdom tests cover Year 3 -> existing Year 2 sibling callback, Year 1 -> legacy child, no sibling/login fallback, malformed profiles and literal HTML display, and App's route wiring.
- Tests are **not proof** that the full app has been browser-tested. A synthetic Chrome/physical QA pass is still needed for actual `handleSelectChild` snapshot failures and account rehydration.

## Gate

- Exact-head CI: full tests 0 failures, validation 0 errors / 0 warnings, and all bundle budgets (production, QA preview, Tutor runtime).
- Keep initial JS budget 900kB and Tutor runtime 125kB unchanged. Baseline M1-B had only ~29 bytes initial JS margin in QA, so optimization may still be needed.
- Verify Year 2 login, quiz, Tutor, resume, sibling switching, unsupported-year denial, guest + authenticated offline restore. Real child data forbidden.
- M1-A #228 and M1-B #229 remain unmerged. No production changes, no new Year 1/3 question content, no remote generative AI or automatic Quiz STT.

**Decision: DRAFT / MERGE-HOLD until exact-head CI and mounted browser/device acceptance.**
