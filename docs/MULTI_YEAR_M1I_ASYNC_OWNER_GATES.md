# M1-I — Year 2 async subject load ownership hardening

**Status:** owner-only integration, Draft and unmerged. Chrome/Work device tests deferred by owner due usage limit, not waived.

## Branch lineage and non-goals

- This PR is stacked only on M1-H [PR #236](https://github.com/hrizz67/jannati-ai-tutor-v1/pull/236), exact baseline `3ce553968b5b24a5dbadb043d104f99740c71c18`.
- Parent chain: #236 → #235 → #234 → #233 → #232 → #228. The standalone UI #229/#230 and release performance #227/#231 remain Draft, unchanged.
- No migration, Supabase/Worker/schema, quiz-bank content, reward/XP credit, parent report, authentication or deployment change.
- **Year 2 KSSR** is the only bank whose learning loads can continue. Tahun 1 KP2027 and Tahun 3 KSSR remain `planned` and inaccessible for lessons.
- Remote generative AI OFF; automatic Quiz STT OFF; no real student or paid rollout.

## New ownership lease

`src/services/yearOwnedAsyncSubjectGate.js` exports `createYear2AsyncOwnerGate`, a tiny dependency-free guard:

- Owner identity: active account, active child, year.
- Each capture retains an epoch. Changing owner or invalidating on a requested child switch revokes every old token, **even if the user later returns to the same owner** (prevents ABA/replay).
- A current token is accepted only when the year is `Tahun 2`.
- No session, question, chat, answer or profile is stored in the guard; no network/storage calls.

## App integration (limited Year2 only)

- `App.jsx` maintains the live ownership gate and resets the cached bulk-loader promise when owner changes.
- The selected subject effect is now scoped to selected subject, account, child and year. It clears old subject state before mounting the new one and rejects stale `loadSubjectData` completions.
- Bulk `loadAllSubjects` promises refuse stale completion and do not display an outdated error after switching profiles.
- All existing **direct subject loads** in interactive resume, ordinary quiz resume, UASA resume, restart and adaptive lesson now use a single `loadYear2SubjectForLease` wrapper. No other `loadSubjectData` calls remain in App outside that wrapper.
- Interactive practice holds the token across the dynamic composer import; ordinary/adaptive resume paths check the token after awaits and before `syncSelectedSubjectState` or starting quiz.
- The child switch handler invalidates old requests before attempting snapshot handling. Even a failed switch cancels pending learning operations, a safe fail-closed tradeoff.
- `startTopic` and subject selection also refuse an explicitly unsupported year.
- **No storage key formats, Year2 content, XP or Tutor behavior are modified.**

## Synthetic and source-level regression

`tests/unit/m1iAsyncYearOwnership.test.js` covers unchanged lease, account change, child change, unsupported grade, immediate invalidation, child-away-and-back ABA case, pending Promise resolving after switch, and source-level enforcement on all legacy direct subject-load paths.

Legacy M1-B and M1-H source tests have been updated to assert stronger ownership semantics instead of outdated unscoped direct loader patterns. Their Year2 content and Year1/3 rejection tests remain in force.

## Remaining gates

1. Require exact-head push/PR CI success, 0 validation errors/warnings and **all** initial-JS, QA and Tutor budgets. M1-H's tagged-production parity build must still pass. Do not raise budgets.
2. **Not a complete runtime security boundary:** outside App's subject and quiz-entry paths, child snapshot persistence, Supabase cloud reconciliation, Tutor response ownership, progress and rewards still require edition-aware migration and backup/rollback before other grades become ready.
3. The async guard is designed for selected App handlers; it does not cancel the underlying network/task—only suppresses stale results. All future async call sites must opt in.
4. When Work/Chrome usage returns, run synthetic Year2 login, child A→B during slow loads, blocked Year1/3 profile, B→A replay, offline resume, interactive quiz, UASA, adaptive practice, device keyboard/accessibility. Browser acceptance **required**, not optional.
5. No merge, tag, release or deployment. All existing branches and production remain unchanged.

**Review status: DRAFT / MERGE-HOLD until independent CI and browser acceptance.**
