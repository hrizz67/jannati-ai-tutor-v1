# M1-D — Resume scope safety and migration policy (draft only)

## Background

This is a **read-only foundation** stacked directly on M1-A [PR #228](https://github.com/hrizz67/jannati-ai-tutor-v1/pull/228). M1-B #229 and M1-C #230 are sibling branches also depending on M1-A; no merge order is implied by this PR.

The current `getResumeScopeKey` in `src/utils/resumeStorage.js` distinguishes child, mode, subject and topic, **but not year or curriculum edition**. It also currently normalizes sessions without carrying the year/curriculum hints forward. Existing Year 2 saves and restores must not be rewritten or re-keyed merely to prepare support for additional years.

## Implemented opt-in (not student-facing) helpers

`src/services/yearScopedResumePolicy.js` introduces:

- `getYearScopedResumeScopeKey(record, { year, curriculumId, childId, accountId })` for deliberate future namespace planning. `year` must be explicitly selected. Existing Tahun 2 KSSR keys remain **byte-for-byte** identical to `getResumeScopeKey`. Any known mismatched year/curriculum hints refuse key derivation. For future bank editions, a key is namespaced by encoded curriculum, year, **account**, **child**, and historic-format resume scope.
- `isYearScopedResumeReadable(record, selection)` for **read-only**, fail-closed decision checks. A bank must have `status: ready`. Currently only Tahun 2 is ready. Year 1 KP2027 and Year 3 KSSR are **planned** and return false even with otherwise valid synthetic records.
- Conflicting top-level / nested / metadata year or curriculum fields and contradictory child/account identities are rejected instead of silently preferring one value.
- Legacy Tahun 2 records with no explicit year/curriculum retain their accepted identity and slot key; explicit non-Year-2 records are never silently treated as Tahun 2.

## Safety properties

- No changes to `src/App.jsx`, `src/utils/resumeStorage.js`, child snapshots, `localStorage`, Supabase, account login, cloud sync, tutor or quiz routing.
- New scope APIs are **not called** by any active save, load, resume, reward or cloud path. They are planning and future migration primitives, not an activation switch.
- A year selection that is omitted, unsupported, or mismatched is refused.
- A future key cannot share a namespace with another child/account, or the historical Year 2 resume key.
- No Year 1/3 question banks or profile options are enabled.

## Regression and acceptance

- `tests/unit/m1dYearScopedResumePolicy.test.js` checks exact legacy key parity, planned-year denial, unknown/mismatched values, cross-child/account separation, conflicting nested hints, planning-only status and no change to active storage.
- This **does not** resolve actual migration: `normalizeResumeData` discards curriculum/year hints and `readResumeSlots` re-keys active slots using legacy rules. Before enabling any future year, the owner must review a versioned migration that preserves old Year 2 history, resumes and tombstones, supports rollback/quarantine, and validates cloud reconciliation.
- Once Work/Chrome usage is available again, perform synthetic tests for Year 2 quiz resume, cross-child switch, a preexisting labelled Year 1/3 profile, offline restore and failed cloud/snapshot reconciliation.
- Require exact-head CI, validation zero errors/warnings and all bundle caps. No threshold changes, release creation or deployment.

**Acceptance policy: DRAFT / MERGE-HOLD for activation. Remote AI OFF, Quiz STT auto OFF; real-child and paid rollout still NO-GO.**
