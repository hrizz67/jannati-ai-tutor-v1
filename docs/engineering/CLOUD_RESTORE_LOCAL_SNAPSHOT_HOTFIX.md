# Cloud Restore / Local Snapshot Hotfix

## Status

`PASS_WITH_LIMITATIONS`

This hotfix makes Supabase learning data authoritative during hydration. Browser snapshots are now bounded, best-effort recovery caches; failure to recreate one no longer discards valid server profiles or permits an empty client to overwrite the server.

## Root cause

The previous restore path normalized the active cloud child into two equivalent local representations:

1. the full `jannati_child_snapshot:<child-id>` value; and
2. the active root learning keys extracted from that same snapshot.

It then cleared account-scoped local data, attempted to write every value, restored the child snapshot again, and captured another full account snapshot. For a large learner history this temporarily or permanently required several copies of essentially the same JSON in `localStorage`.

The production active child snapshot was approximately 2,937 KB as JSON, or about 5.734 MB using the UTF-16 browser estimate. A stale other-account account snapshot added about 2.111 MB. Removing those existing local entries did not solve the issue because the old cloud restore immediately attempted to recreate the active child copy, the root copy, and an account copy again.

## Exact former failure path

`restoreCloudLearningSnapshotResult()` called `restoreAccountSnapshot()` with the complete normalized payload. The following paths could return failure:

- explicit account marker did not match the authenticated account;
- any account-key `localStorage.setItem()` threw after active account data had been cleared;
- rollback of the previous snapshot also failed or was incomplete;
- deleted/archive metadata writes threw;
- active-child identity validation rejected the child snapshot;
- active-child scoped persistence threw and returned `false`;
- JSON parsing, storage access, or another exception reached the outer catch.

The caller converted the account-write case to `account-snapshot-restore-failed`, marked cloud sync as failed, and did not hydrate the two valid server profiles. This incorrectly treated a cache/persistence failure as a canonical cloud-read failure.

## New hydration order

The recovery service now performs these operations:

1. validate the authenticated account scope and canonical child metadata in memory;
2. preserve every valid child by ID, without merging same-name profiles;
3. select the valid server `activeChildId`, with a deterministic fallback only if it is invalid;
4. classify orphan and ownership-mismatched snapshots without promoting them to profiles;
5. normalize the active learning projection in memory;
6. persist the active root projection and child metadata;
7. persist bounded child/account recovery caches only as best effort;
8. return a structured result containing hydration, active-state persistence, cache persistence, reason, error name, failed key, profile count, and orphan count.

If active persistence fails, the React session retains the server profile list in memory and enters a write-protected recovery state. It does not upload an empty profile set. If only cache persistence fails, learning remains usable and the UI states:

> Data cloud berjaya dimuatkan, tetapi salinan pemulihan pada peranti tidak dapat disimpan.

## Quota-aware storage

`safeStorageSet()` distinguishes:

- `quota_exceeded`;
- `storage_unavailable` for `SecurityError`/disabled storage;
- `serialization_error`;
- `write_failed`, including a silent readback mismatch.

Each result includes `errorName`, `failedKey`, and an estimated UTF-16 byte count. Payload values and error secrets are never stored in diagnostics.

The new restore does not create a second multi-megabyte rollback copy. It validates first, removes replaceable snapshot caches to release capacity, and performs a deterministic root write list. If a root write is incomplete, server writes remain locked until a successful hydration retry.

## Bounded snapshot policy

- Child recovery snapshot limit: 1 MiB estimated UTF-16 size per snapshot.
- Account recovery snapshot limit: 768 KiB total.
- Account field limit: 256 KiB per whole field.
- Oversized fields are omitted whole; JSON values are never cut or silently truncated.
- The active root projection remains the device working state.
- Oversized child snapshots remain canonical in Supabase and are recreated in memory for sync when required.
- Existing merged/deletion recovery backups are not blindly deleted by this hotfix.

The production-shaped validator uses a multi-megabyte active child, a small second child, and an orphan third snapshot. It verifies that the active root projection loads while the oversized duplicate cache is skipped.

`measureSnapshotStorage()` reports both outer cloud keys and top-level fields inside each child snapshot, sorted by estimated UTF-16 bytes and without returning values. In the production-shaped fixture, `jannati_large_history` is correctly identified as the dominant child field. The storage policy classifies identity/current progress as recovery-required, computed summaries as reproducible, temporary UI data as cache-only, event collections as analytics history, and the active root/account/child representations as duplicated storage. This hotfix excludes only oversized optional local copies; it does not delete or truncate their canonical cloud fields.

## Account, child, and Premium rules

- Snapshot account IDs are normalized with trimming.
- An explicit different account ID is rejected before hydration.
- After authentication, account snapshots owned by another account are pruned; current-account data is untouched.
- Missing legacy account ownership metadata remains readable only in the currently authenticated account scope.
- Orphan cloud snapshots are reported and ignored. They do not create ghost profiles and are not deleted from Supabase.
- The two production `Fayadh / Tahun 2` profiles remain separate because their IDs differ. This hotfix does not guess which one is a duplicate.
- A valid server active child is selected before a stale device preference.
- Expired Premium does not participate in cloud learning recovery or profile hydration.

## Admin route

An initial `#/admin` or `#/admin/premium` session now loads only the authenticated profile/admin status and entitlement required for administration. It does not fetch or restore the multi-megabyte student learning payload. Closing a directly opened Admin route reloads the normal application hydration path before entering the learner dashboard.

## Empty-state overwrite protection

A per-account write guard blocks `queueCloudLearningSave()` when the server has profiles but the active device projection did not persist. The guard is released only by a successful active-state hydration for that account. Existing revision, compare-and-swap, dirty-child, and account-switch sequence protections remain unchanged.

No code in this hotfix clears `profiles.learning_data`, resets `learning_revision`, deletes cloud children/snapshots, or writes to Supabase during recovery.

## Request deduplication and async safety

Existing safeguards were retained and revalidated:

- duplicate auth callbacks share one in-flight hydration;
- account hydration results are sequence checked so account A cannot overwrite account B;
- polling has an in-flight lock;
- cloud autosave remains locked until the current account is hydrated;
- Admin-only hydration does not start the learning request.

## Diagnostics

A small `jannati_last_restore_diagnostic_v1` record stores only timestamp, account ID, booleans, reason code, failed key, profile count, and orphan count. A development or support build may call the side-effect-free helper directly:

```js
createLocalSnapshotDiagnostics(localStorage, accountId)
```

The helper returns per-key estimated sizes, ownership markers, active child, orphan count, and the last structured restore result without returning stored payload contents. It is not exposed as a production `window` global.

## Changed files

- `src/services/cloudSnapshotRecovery.js`
- `src/services/localSnapshotStorage.js`
- `src/services/snapshotStorageSupport.js`
- `src/App.jsx`
- `tests/unit/cloudSnapshotRecovery.test.js`
- `scripts/validate/cloudSnapshotRecoveryRegression.mjs`
- `scripts/validate/loginHydrationRegression.mjs`
- `scripts/validate/learningSyncRegression.mjs`
- `package.json`
- `docs/engineering/CLOUD_RESTORE_LOCAL_SNAPSHOT_HOTFIX.md`

The separate, already-uncommitted Admin premium renewal hotfix files were not modified as part of this recovery implementation.

## Tests and validation

Implemented deterministic coverage for:

- normal cloud hydration;
- missing, unavailable, quota-limited, and failed local storage;
- stale/invalid account snapshots and explicit account mismatch;
- large active child snapshots;
- orphan snapshots;
- two valid same-name children;
- deterministic active child selection;
- expired Premium;
- Admin route bypass;
- cleanup/legacy rollback failure conditions;
- valid cloud plus cache failure;
- empty local state and empty-state write protection;
- bounded account/child snapshots;
- safe diagnostics and silent write drops;
- existing account-switch sequence and request deduplication gates.

Completed locally at implementation time:

- lint: pass;
- 182 unit tests: pass;
- Supabase storage-bloat regression: pass;
- cloud restore production fixture: pass;
- login hydration regression: pass;
- learning sync regression: pass;
- child isolation regression: pass;
- access-control audit: pass;
- Admin Console regression: pass;
- full `npm run validate`: pass with 0 errors and 0 warnings;
- production `npm run build`: pass;
- initial JavaScript: 898.54 kB of the 900 kB budget;
- entry chunk: 336.23 kB of the 350 kB budget.

These checks must remain green before deployment.

## Rollout

1. Deploy the client hotfix; no Supabase schema migration is required.
2. Open the affected account in a fresh browser and verify revision 619 or newer, two child IDs, and server active child `child-ae293f93-494b-44ff-84ee-e323f74c298e`.
3. Confirm the learner dashboard shows both profiles even when the large child cache is skipped.
4. Complete one small learning action, wait for a new acknowledged server revision, and compare desktop/mobile XP.
5. Check the safe restore diagnostic if the device-storage warning appears.

## Rollback plan

Roll back the client deployment to the previous known-good tag. No database rollback is required because this hotfix changes no schema or cloud data. Do not clear or overwrite canonical Supabase learning data during rollback.

## Remaining limitations

- Oversized child recovery caches are intentionally not kept in `localStorage`; an inactive large child may require an online cloud hydration after a cold browser restart.
- The cloud orphan snapshot is reported but not deleted.
- Same-name child records are reported but not auto-merged.
- Existing merged recovery backups are preserved for safety and may require a separately reviewed retention policy later.
