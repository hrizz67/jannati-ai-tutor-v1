# M1-E — Year-scoped resume dry-run and learning-surface inventory

**Status: owner-only, Draft, read-only, no activation.**
**Dependency:** Stacked on M1-D [PR #232](https://github.com/hrizz67/jannati-ai-tutor-v1/pull/232), which is stacked on M1-A [PR #228](https://github.com/hrizz67/jannati-ai-tutor-v1/pull/228). PR #229/#230 remain separate runtime/UI branches; release optimization #227/#231 is also separate.

## Objective and non-goals

Before offering Year 1 KP2027 or Year 3 KSSR learning, expose existing resume collisions and deletion risks without touching the live resume store. A development-only pure inspector accepts **explicitly supplied raw JSON snapshot strings** (from synthetic tests), never opens a Storage object, never calls `localStorage`, never writes/clears a slot, never alters Supabase, and never attempts a migration.

`inspectMultiYearResumeMigration(snapshot, selection)` from `src/services/multiYearResumeMigrationDryRun.js` requires all of `year`, `curriculumId`, `accountId`, and `childId`. It returns only counts and generic finding codes, not names, answers, chat texts, raw JSON or child/account identifiers. All reports force `status: 'hold'`, `readOnly: true`, `canApply: false`, `proposedWrites: 0`, `proposedDeletes: 0` regardless of test results.

## Supported synthetic review inputs

- `jannati_v152_resume_slots` (legacy scoped slot map).
- `jannati_v151_resume` and `jannati_v150_resume` / `jannati_v140_resume` (compatibility aliases).
- `jannati_v152_resume_tombstones` and `jannati_v152_resume_pending_tombstones` (permanent and unacknowledged deletion evidence).

The inspector caps raw blobs at 1 MiB and entry maps at 256. It fails closed on malformed JSON, invalid resume records, noncanonical slot keys, conflicting aliases, contradictory year/curriculum hints, missing or mismatched account/child evidence, and unsupported selection. A tombstoned record is not considered safe for migration; **even a malformed tombstone protects its scope against inadvertent revival**. Other accounts/children are not attributed to the selected identity. A read-ready Year 2 record still cannot be applied, because there is no migration engine.

## Year 2 compatibility and future keys

- Historical Year 2 KSSR resume key format is unchanged and may be examined read-only.
- Year 1 KP2027 and Year 3 KSSR have distinct planning keys with curriculum/year/account/child namespaces, but they remain **planned** and are never readable as active questions.
- The inspector calls the M1-D policy on original records rather than normalizing away the year/curriculum evidence first.
- Orphan and pending tombstones remain evidence for future cloud reconciliation; nothing is deleted from storage. Identical top-level aliases can be recognized; conflicting copies require owner review and no automatic winner selection.

## Independent source audit: other learning-surface blockers

| Surface | Current active behavior / risk | Required gate before another year becomes ready |
| --- | --- | --- |
| Resume save/load | `src/utils/resumeStorage.js` normalizes and re-keys by child/mode/subject/topic, not year/curriculum | Versioned migration with rollback/quarantine, durable tombstones and multi-child isolation |
| Resume compaction | `src/utils/resumeCompaction.js` is yearless and limits slots to 12 with payload caps | Edition-aware compaction must not drop or overwrite future-year entries |
| Tutor context | `src/services/studentIdentity.js` scopes by account, child, subject, topic, session, question but not year | Explicit year/curriculum in session ownership, history persistence and reply validation |
| Progress/mastery | `src/App.jsx` and `src/ai/memoryEngine.js` use `${subjectId}_${topicId}` keys | Year/curriculum-aware progress and mastery maps with legacy Year 2 key parity |
| Rewards / XP | `src/utils/learnerProgressIntegrity.js` deduplicates `reward.eventKey` without adding a curriculum/year namespace | Add upstream edition-scoped idempotency keys; preserve legacy credit to avoid double XP |
| Cloud / child snapshots | `src/services/childScopedStorage.js` and existing cloud merge are child-scoped, not edition-complete | Independent cloud race, tombstone acknowledgement, rollback and offline restore tests |
| School-year content | M1-A catalog marks Year 1 and 3 `planned`; UI only exposes Year 2 | Curriculum verification, authored content and explicit owner approval |

The source-audit tests **document known risks**, not claim they have been fixed. In particular, reusing the same reward event key across grades can cause an incorrect duplicate decision; disabling existing deduplication is NOT an acceptable solution.

## Acceptance gates and later Chrome QA

1. Exact-head CI: all tests PASS; validation **zero errors, zero warnings**; normal, QA preview, and Tutor bundle budgets untouched.
2. Independent review of dry-run privacy, malformed tombstones, missing identity and legacy Year 2 compatibility.
3. Future write-capable migration in a **separate authorized design/PR** with staged snapshots, backup/rollback, account/child/curriculum verifications and repeatable idempotency tests. Never modify stored learning content without authorization.
4. When the owner's Work usage limit clears: Chrome owner-only synthetic tests covering two children, Year 2 resume, Year 1/3 denied content, offline restore, pending deletions, Tutor multi-turn, reward replay prevention, and keyboard/accessibility. These are **deferred but not waived**.
5. No merge, release, deployment, student rollout or paid activation here. Remote generative AI OFF; Quiz STT automatic invocation OFF.

**Decision: DRAFT / MERGE-HOLD.** This PR is infrastructure and evidence-gathering only; its helper must not be imported into App's runtime or the active resume storage module.
