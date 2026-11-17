# M1-B — Active profile year gating (Draft, no release)

## Stack/dependency

- **Base:** M1 foundation PR #228, currently still DRAFT and unmerged.
- This PR targets `feature/m1-multiyear-foundation-draft`; it must not be separately merged to `main`.
- M1-A already marks Tahun 1 KP2027 and Tahun 3 current KSSR as planned, and Tahun 2 as the only ready bank.

## Changed App behavior

1. Profile years absent in historical stored data retain existing Year 2 compatibility.
2. Any **explicit non-Year-2 profile** is refused access to the Year 2 question screens: a clear unavailable-year message is rendered before loading/quiz/dashboard routes.
3. The normal selected-subject and background preload paths retain the existing Year 2 lazy loaders **only when the profile explicitly permits Year 2**. Both loaders are skipped for planned/unsupported years, and a year-change ref discards stale background preload completions. M1-A's strict year-scoped API remains available for a later migration gate but is intentionally not called from App.jsx yet because the initial-JS budget is already near its limit.
4. Existing direct `loadSubjectData` calls in recovery and adaptive action handlers are not yet changed. These remain reachable for existing Year 2 paths, and must be covered by the next integration gate before a new year can become ready.
5. The selector still exposes **only Year 2**. No new curriculum questions, database changes, migration, parent reports, new reward logic or release changes.

## Risk and acceptance gates

- Need a real mounted browser regression for Year 2 login -> dashboard -> quiz -> Tutor -> resume, and explicit fabricated Year 1 / Tahun 3 profiles to verify no Year 2 leakage.
- Existing legacy year labels in onboarding still require a dedicated migration decision; do not silently rewrite historical Year 1/3 profiles or enable unsupported options.
- Any future feature allowing a different year must first propagate year/curriculum across **resume, adaptive practice, Tutor, quota, rewards, reports, and cloud sync**, not only subject loading.
- Verify behavior on child switch, stale async subject-preload completion and offline/online restore.
- Initial JS and Tutor runtime bundle limits unchanged. Initial attempt exceeded 900 kB (900.31 kB); therefore M1-B deliberately scaled back to the minimal Year 2-only runtime gate. Any further budget failure is **NO-GO**; never raise budgets to force a PASS.

## Test evidence

- Unit test `tests/unit/m1bActiveYearUiBoundary.test.js` asserts source wiring and guarded year-scoped module loading and canonical 4,530 existing records.
- These source contract tests are **not** a substitute for mounted Chrome/browser and physical device acceptance.
- Must pass exact-head PR/push CI, zero validation errors/warnings, all existing budgets and security gates.

**Status: DRAFT / MERGE-HOLD. No deployment, no student rollout; remote AI and Quiz STT automated calling remain OFF.**
