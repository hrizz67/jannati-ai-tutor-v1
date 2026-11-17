# M1-F — Rollback planning and year-scoped learning identity contracts

**Scope:** synthetic read-only policy, no write-capable backup, no migration, no UI activation, no Chrome test in this phase.

## Dependency topology
- This branch is stacked directly on Draft M1-E [PR #233](https://github.com/hrizz67/jannati-ai-tutor-v1/pull/233), on M1-D [PR #232](https://github.com/hrizz67/jannati-ai-tutor-v1/pull/232), on M1-A [PR #228](https://github.com/hrizz67/jannati-ai-tutor-v1/pull/228).
- Separate runtime/UI branches: M1-B #229, M1-C #230. Separate release and bundle branches: #227 and #231.
- No branch in this stack is approved for merge into `main`, tagging, production, or live child-data migration.

## Pure recovery plan and rollback comparison

New `src/services/multiYearMigrationRecoveryPlan.js` provides:

1. `planMultiYearMigrationRecovery(snapshot, selection)`: builds a checklist of **required future controls**. It reports only aggregate counts, generic finding codes and static stage IDs. All results are read-only and **cannot apply or restore** anything. Required controls include pausing child writes/cloud reconciliation, encrypted account/child backup, integrity verification, an isolated restore rehearsal, explicit owner approval, quarantined versioned migration, child/year/tombstone/reward verification, guarded reactivation of sync and rollback on any failure.
2. `compareMultiYearRollbackSnapshots(original, candidate)`: strict raw string comparison of each allowlisted legacy resume slot, resume alias and both deletion tombstone keys. Detects missing key, changed answer/session bytes, altered pending deletion marker, malformed or oversized values and **unrecognized future key families**. It NEVER reveals raw answers, child names or snapshot contents in the report.

These are **not backups**. The helpers neither read browser storage nor capture/encrypt/export/restore any data. Even a byte-perfect comparison reports `status='HOLD'`, `canApply=false` and `canRestore=false`. This is a comparator between two **caller-supplied synthetic snapshot objects**, not evidence that an encrypted backup exists.

This is deliberately narrower than all child-sensitive storage. Real rollback must also protect `jannati_v151_profile`, student core, AI memory, adaptive/gamification, cloud reconciliation, offline save queues, and the complete account/child snapshot. The current allowlist is for validating the resume/tombstone prototype only. It cannot safely restore an actual learner profile.

## Learning key isolation contract (planning only)

New `src/services/yearScopedLearningMigrationKeys.js` provides:

- `planYearScopedProgressKey`: preserves Year 2's `subject_topic` key **exactly**. For future years, the key includes curriculum, year, account, child, subject, topic.
- `planYearScopedTutorScope`: preserves the historical Year 2 scope **exactly**. For future years, it requires explicit account, child, subject, topic, session and question IDs; enforces the existing 320-character Tutor memory scope cap.
- `planYearScopedRewardEventKey`: preserves the Year 2 event ID **exactly**; for future years, namespaces the event by curriculum/year/account/child before existing replay/idempotency handling. It **does not award XP** or invoke any reward service.

This code does not change `src/App.jsx`, the Tutor modal, reward engine, resume normalizer, compactor, Supabase, Worker or persistent storage. The catalog continues to mark Tahun 1 KP2027 and Tahun 3 KSSR as `planned`. Generating a hypothetical future key is not permission to read or credit learning events from that year.

## Acceptance and continuation gates

- Exact-head PR+push CI: tests all PASS, validation **zero errors/warnings**, bundle caps unchanged.
- Synthetic tests must verify rollback byte equivalence, deletion evidence, new key-family rejection, privacy-minimal output, absent identity/year rejection, Year 2 parity and stale cross-year Tutor writes.
- Current critical gap: active per-child snapshots and cloud reconciliation remain yearless; a future data migration needs atomic staging, encrypted backups and **real rollback rehearsal** before learner data is touched.
- When Work usage becomes available, run synthetic owner-only Chrome regression for multi-child switching, Type 1/2/3 blocked routing, offline restore, Tutor late replies, reward replay and keyboard/accessible modal behavior.
- Do not merge, release, tag, deploy, use real child data, enable paid rollout, enable Quiz STT auto or turn on remote generative AI.

**Decision: design-only, DRAFT / MERGE-HOLD until exact-head CI and independent review.**
