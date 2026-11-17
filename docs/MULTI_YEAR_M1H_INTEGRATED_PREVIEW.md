# M1-H — Owner-only integrated branch: Year 2 routing, sibling recovery and cloud safety

**Status: Draft. This branch is an integration experiment; not a merge into main, an activation of Year 1/3, or a production release.**

## Exact dependency plan

The PR graph at branch creation:

```
main 86a09d7526...
├── release #227 (build parity) → #231 (deferred owner UI, smaller tagged bundle)
└── M1-A #228 (catalog; Year 2 only ready)
    ├── M1-B #229 (Year 2-only App routing) → M1-C #230 (safe sibling selector)
    └── M1-D #232 → M1-E #233 → M1-F #234 → M1-G #235
                                    → M1-H integration (this Draft PR)
```

The M1-H **integration branch** is based on exact M1-G head `6cd68199997dfda9ada50146d09d599813521b4a`. It imports **source behavior** from M1-B/M1-C and the safe noncritical lazy UI optimization from PR #231. It does **not** merge, close or mutate those original PRs. M1-B/C source tests are also copied, so integration CI can verify the combined behavior.

### Included in this branch

- M1-A/G contracts (from ancestry): future banks planned-only; pure resume/migration/backup/cloud inspectors remain read-only and NOT wired to app.
- App-level M1-B Year 2 readiness gate: historical missing-year profiles remain Year 2, explicit unsupported years never reach Year 2 questions/dashboard/quiz routes; subject preload ignores stale year completions.
- M1-C lazy `UnsupportedYearScreen`: parents can select **existing sibling Year 2 profiles**, retaining the current `handleSelectChild` snapshot-safety handler. No profile invention or year coercion.
- PR #231's `QuizDiagnosticsPanel` and `BetaFeedbackButton` lazy modules, plus `QuizSpeechConsent` deferred until microphone consent is requested. Internal tools remain gated by `isInternalUiSurfaceEnabled()`. Existing beta feedback save callback is preserved.
- Existing public-surface containment source tests updated, with DOM regression for the deferred UI. New `tests/unit/m1hIntegratedYearBoundary.test.js` asserts Year 2 routing, future-year subject denial, no premature cloud activation, synthetic wrong-year cloud rejection, and no remote generative AI/automatic STT gate changes.
- CI gains the **tagged-production feature-flag bundle build** (dummy Supabase config, exact public STT flags, automatic Quiz STT OFF, remote Tutor AI OFF) *in addition to* normal and QA-preview build. No real credentials or secret variables.

### Deliberately excluded

- Release-prep workflows, package version bumps, tag creation, GitHub Pages deployment, Worker/SQL/auth/sync edits and stored child/profile migrations from release PR #227. The CI parity build checks **size**, not permission to deploy.
- Wiring M1-D/G audit helpers into live browser storage or cloud, because encrypted backup, atomic migration, year-aware compaction, tombstone reconciliation and real restore are not yet proven.
- New Year 1 KP2027 or Year 3 KSSR questions. Years remain `planned`; the active selector continues Year 2 only.
- Changes to remote AI, Quiz STT auto, subscription/payments, paid rollout, student onboarding, or real learner records.

## Independent acceptance and unresolved risks

1. **Exact-head CI:** complete push and PR runs SUCCESS, all unit/synthetic DOM suites PASS, validation **0 errors / 0 warnings**; initial JS <=900 kB across default, tagged-production parity and QA preview, Tutor runtime <=125000 bytes. Recommended target <=895 kB tagged parity if feasible without weakening offline reliability.
2. **Runtime risk:** M1-B guards selected/bulk lazy subject load and UI return, but direct subject loads in older recovery/adaptive callbacks may still be reachable from Year 2 code. Do not enable another year until every loader, state transition and async callback owns an explicit year+child+curriculum context.
3. **Data risk:** M1-G auditor is pure and never reads actual cloud, so it cannot guard live cloud restore, tombstones, queued writes, rewards, progress or Tutor replies. Those need separate reviewed and fully migrated runtime changes with full backups/rollback.
4. **Device acceptance:** Work/Chrome is on hold at owner's request due to usage limit, **not waived**. Later test with synthetic child profiles Year2 and blocked Year1/3, guest/auth, offline/local restoration, quiz, Tutor multi-turn, delayed response, mid-request child switch, parent reports, beta diagnostic accessibility, mobile and 200% zoom.
5. **Review:** independently review exact diff, seek owner permission for an eventual coordinated merge sequence, and re-run full CI after any rebase; none of the current Draft PRs is automatically approved for merge.

**Owner-only, DRAFT / MERGE-HOLD. No merge, tag, release or deployment. Production unchanged.**
