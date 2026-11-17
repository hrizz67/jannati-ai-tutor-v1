# M1-G — Multi-year cloud / child snapshot / resume integration boundary audit

**Decision before CI:** Draft / MERGE-HOLD. This is a pure, read-only synthetic inspection and source audit. No live learner data, no cloud access, no migrations or activation.

## Dependencies

Stacked directly on M1-F [PR #234](https://github.com/hrizz67/jannati-ai-tutor-v1/pull/234), which depends on M1-E #233 → M1-D #232 → M1-A #228. M1-B #229 and M1-C #230 are separate UI/runtime branches. Tagged-release performance PRs #227 and #231 remain separate. **Nothing here is approved for main, deployment, Year 1/3 content, remote generative AI or automatic Quiz STT.**

The owner postponed Chrome/Work synthetic browser testing because of the usage limit. It is **deferred, not waived**.

## What has been added

- `src/services/multiYearCloudBoundaryAudit.js`: A **pure read-only** auditor accepting only caller-supplied synthetic local/cloud maps, an explicit year/curriculum/account/child selection and an optional synthetic mutation state. It never reads browser storage, calls Supabase, performs a fetch, writes, deletes, retries or creates a real cloud operation. Every report is `status: 'HOLD'`, `canHydrate=false`, `canMerge=false`, `canApply=false`, `canRelease=false`, proposed writes/deletes zero.
- The auditor checks canonical `CLOUD_CHILD_STATE_KEY` metadata for selected child and grade, deleted/archived state, declared child snapshot ownership, inner/root profile account/child/year hints, legacy resume slots, cleared/pending tombstones, outbox dirty children, request child/year/curriculum mismatch, stale mutation acknowledgement and revision disagreement.
- The report consists solely of **fixed generic finding codes and counters**. It does not include user identifiers, child names, question text, answers, chat transcripts or raw snapshot values.
- `tests/unit/m1gCloudBoundaryAudit.test.js` exercises Year 2 compatibility, unready Year 1 KP2027 / Year 3 KSSR, cross-child and cross-account ownership, pending deletion disagreement, malformed payloads, old cloud response races, bounded input and source-only no-writes assertions.

## Independent active-code findings — not remediated in this PR

1. **Child snapshot scoping:** `src/services/childScopedStorage.js` stamps the existing child identity onto supported records and resume slots. It does **not** supply a year/curriculum boundary on the active storage path. Before enabling another year, every resume, memory and progress record must be validated against the selected curriculum edition, not just the child.
2. **Cloud restore:** `src/services/cloudSnapshotRecovery.js` reads canonical child metadata and chooses a valid active child, then projects snapshots into account storage. The active restore contract is not an edition-aware authorization boundary, even though it already screens mismatched declared account/child ownership.
3. **Deletion evidence:** `src/utils/resumeStorage.js` and `src/services/cloudPayloadCompaction.js` maintain pending/cleared resume tombstones. Any future edition migration must preserve them and reconcile pending acknowledgements before replay; deleting an old tombstone would risk resurrecting a completed/cleared session.
4. **Cloud mutation races:** `src/services/cloudMutationOutbox.js` already protects a child mutation version from an old acknowledgement. The *future* grade-aware boundary needs selected year/curriculum + account/child provenance on the request and on the state accepting a response, including offline restore and profile switching.
5. **Cloud and snapshot size/compaction:** active `src/utils/resumeCompaction.js` still uses legacy yearless resume keys and the 12-slot limit. No current field-level compaction or cloud merging can be assumed safe for cross-year collisions.

## Security and correctness gates still blocking activation

- A read-only inspector is **not a permission to hydrate, merge or deploy**. It is not wired into `App.jsx`, cloud restore, mutation outbox, Supabase RPC, or student-facing learning.
- A future separate integration PR must preserve byte-for-byte Tahun 2 keys, require explicit approved year/curriculum, refuse old child/year replies and compare/reconcile child snapshots and pending tombstones atomically, with rollback.
- There is no encrypted full-child/account backup and restore rehearsal yet (M1-F only compares synthetic resume snapshot strings); real migration remains NO-GO.
- A complete multi-year cloud audit must also cover archived/deleted child list races, Supabase RPC revision semantics, a real quota-failure restore path, cloud collection compaction, offline outbox replay, screen-reader focus, and live device testing with synthetic accounts.
- For later Work/Chrome testing: two synthetic child profiles (Tahun 2 and unsupported Tahun 1/3), account switch, refresh/offline recovery, Tutor delayed response, quiz resume/deletion, XP replay, parent reports, keyboard/accessibility, and QA preview smoke. No real student credentials/data.
- Require exact-head push & PR CI SUCCESS, **0 errors / 0 warnings**, and unchanged default/QA/Tutor bundle budgets. The performance branch #231 size improvement is **not inherited** by this multi-year branch.

**Final decision after CI still requires independent review. Keep Draft / MERGE-HOLD, no tag/release/deploy and no Year 1/3 bank activation.**
