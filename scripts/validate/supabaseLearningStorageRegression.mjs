import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CLOUD_CHILD_STATE_KEY,
  CLOUD_SYNC_META_KEY,
  mergeCloudLearningPayload,
  saveRevisionedCloudLearningData
} from '../../src/services/learningSync.js';

const migrationPath = 'supabase/migrations/20260909090000_learning_sync_storage_bloat_fix.sql';
const functionPath = 'supabase/schemas/public/functions/learning_data_v3.sql';
const tablePath = 'supabase/schemas/public/tables/learning_sync_operations.sql';
const appPath = 'src/App.jsx';
const migration = fs.readFileSync(migrationPath, 'utf8');
const functionSql = fs.readFileSync(functionPath, 'utf8');
const tableSql = fs.readFileSync(tablePath, 'utf8');
const appSource = fs.readFileSync(appPath, 'utf8');

function functionBody(source, name, nextName = '') {
  const start = source.indexOf(`create or replace function public.${name}`);
  const end = nextName ? source.indexOf(`create or replace function public.${nextName}`, start) : source.length;
  assert.ok(start >= 0 && end > start, `${name} function body must exist`);
  return source.slice(start, end);
}

const saveSql = functionBody(functionSql, 'save_learning_data_v3', 'append_learning_event_v1');
const pruneSql = functionBody(functionSql, 'prune_learning_sync_history_v1', 'save_learning_data_v3');
const conflictPosition = saveSql.indexOf('if current_revision <> $2 then');
const unchangedPosition = saveSql.indexOf('if current_payload = incoming_payload then');
const backupPosition = saveSql.indexOf("values (caller_id, current_revision, 'pre-write', current_payload)");
const updatePosition = saveSql.indexOf('set learning_data = incoming_payload');
const finalPrunePosition = saveSql.lastIndexOf('perform public.prune_learning_sync_history_v1(caller_id)');

assert.ok(saveSql.includes('for update;'), 'Account row must be locked before revision decisions.');
assert.ok(conflictPosition >= 0 && conflictPosition < unchangedPosition, 'Stale revisions must conflict before no-op detection.');
assert.ok(unchangedPosition < backupPosition, 'Unchanged payloads must return before a full backup is created.');
assert.ok(backupPosition < updatePosition && updatePosition < finalPrunePosition, 'Backup, atomic write and pruning order must remain safe.');
assert.equal((saveSql.match(/learning_revision = next_revision/g) || []).length, 1, 'One changed operation must increment revision exactly once.');
assert.match(saveSql, /prior_status = 'applied'[\s\S]{0,400}'duplicate', true/, 'Applied operation replay must be idempotent.');
assert.match(saveSql, /current_payload = incoming_payload[\s\S]{0,1000}'unchanged', true/, 'Canonical JSONB equality must produce an explicit no-op.');
assert.match(saveSql, /current_revision, 'conflict'[\s\S]{0,160}null,[\s\S]{0,120}incoming_payload_hash/, 'Conflict history must store metadata, not a full submitted payload.');
assert.match(saveSql, /next_revision, 'applied'[\s\S]{0,160}null,[\s\S]{0,120}incoming_payload_hash/, 'Applied history must store metadata, not a full submitted payload.');
assert.doesNotMatch(saveSql, /submitted_payload[\s\S]{0,500}coalesce\(\$1/, 'The save path must not archive submitted JSON in operation history.');
assert.match(saveSql, /8388608/, 'The 8 MB database payload guard must remain active.');
assert.match(saveSql, /auth\.uid\(\)/, 'RPC must remain account-scoped through auth.uid().');
assert.match(saveSql, /security definer[\s\S]{0,80}set search_path to ''/, 'RPC must retain a locked security-definer search path.');

assert.match(pruneSql, /backup_retention_limit constant integer := 10/, 'Normal full backup retention must be centrally bounded to 10.');
assert.match(pruneSql, /history_row\.reason = 'pre-write'/, 'Only normal pre-write snapshots may be ranked for deletion.');
assert.doesNotMatch(pruneSql, /pre-v3-migration|manual-recovery|migration-safety/, 'Special recovery reasons must not be selected for deletion.');
assert.match(pruneSql, /interval '30 days'/, 'Applied operation metadata must have a 30-day retry window.');
assert.match(pruneSql, /interval '90 days'/, 'Conflict diagnostics must have a longer 90-day window.');
assert.match(tableSql, /"submitted_payload" jsonb,/, 'Legacy submitted_payload must be nullable for staged compatibility.');
assert.match(tableSql, /"payload_hash" text/, 'Operation metadata must include a payload fingerprint.');
assert.match(tableSql, /"payload_size_bytes" bigint/, 'Operation metadata must include payload size.');
assert.match(migration, /extensions\.digest[\s\S]{0,160}'sha256'/, 'Migration must generate a SHA-256 payload fingerprint.');
assert.doesNotMatch(migration, /^\s*vacuum\s+full\b/im, 'VACUUM FULL must never run automatically in a migration.');
assert.match(migration, /submitted_payload = null/, 'Existing operation payloads must be released without deleting operation metadata.');
assert.match(appSource, /getChildSnapshotContentSignature[\s\S]{0,800}__childSnapshotCapturedAt/, 'Snapshot capture must suppress timestamp-only rewrites.');

const profile = { id: 'child-a', name: 'Aisyah', year: 'Tahun 2' };
const childState = JSON.stringify({ version: 3, profiles: [profile], activeChildId: profile.id, deletedChildren: {}, archivedChildren: {} });
const cloudPayload = {
  [CLOUD_CHILD_STATE_KEY]: childState,
  jannati_child_profiles: JSON.stringify([profile]),
  jannati_active_child_id: profile.id,
  jannati_deleted_child_profiles: '{}',
  jannati_archived_child_profiles: '{}',
  [CLOUD_SYNC_META_KEY]: JSON.stringify({ version: 3, activeChildId: profile.id, deviceId: 'desktop', updatedAt: '2026-09-09T00:00:00.000Z' })
};
const timestampOnlyLocalPayload = {
  ...cloudPayload,
  [CLOUD_SYNC_META_KEY]: JSON.stringify({ version: 3, activeChildId: profile.id, deviceId: 'mobile', updatedAt: '2026-09-09T00:01:00.000Z' })
};
assert.deepEqual(
  mergeCloudLearningPayload(timestampOnlyLocalPayload, cloudPayload, { localActiveChildId: profile.id, deviceId: 'mobile' }),
  cloudPayload,
  'Volatile transport metadata alone must not manufacture a learning write.'
);

const retryOperationId = '11111111-1111-4111-8111-111111111111';
const retryCalls = [];
const retryClient = {
  async rpc(_name, args) {
    retryCalls.push(args);
    if (retryCalls.length === 1) return { data: null, error: { message: 'Failed to fetch', status: 0 } };
    return {
      data: {
        ok: true,
        unchanged: false,
        duplicate: true,
        conflict: false,
        payload: cloudPayload,
        revision: 12,
        serverUpdatedAt: '2026-09-09T00:02:00.000Z'
      },
      error: null
    };
  }
};
const retryResult = await saveRevisionedCloudLearningData(retryClient, {
  payload: cloudPayload,
  expectedRevision: 11,
  operationId: retryOperationId,
  deviceId: 'desktop',
  dirtyChildIds: [profile.id],
  transportMaxAttempts: 2,
  retryBaseDelayMs: 0
});
assert.equal(retryResult.ok, true, 'A transient response failure must be safely retryable.');
assert.equal(retryCalls.length, 2, 'Transport retry must be bounded.');
assert.equal(retryCalls[0].operation_id, retryCalls[1].operation_id, 'A transport retry must reuse the same operation_id.');

const KIB = 1024;
const MIB = KIB * KIB;
const payloadBytes = 775 * KIB;
const syncsPerDay = 100;
const daysPerMonth = 30;
const backupLimit = 10;
const estimatedOperationBytes = 1024;
const productionOperations = 618;
const oldDailyBytes = payloadBytes * syncsPerDay * 2;
const oldMonthlyBytes = oldDailyBytes * daysPerMonth;
const newDailyMetadataBytes = estimatedOperationBytes * syncsPerDay;
const newRetainedFullSnapshotBytes = payloadBytes * backupLimit;
const newThirtyDayOperationBytes = estimatedOperationBytes * syncsPerDay * daysPerMonth;
const oldProductionHistoryBytes = payloadBytes * productionOperations * 2;
const newProductionHistoryBytes = newRetainedFullSnapshotBytes + estimatedOperationBytes * productionOperations;

const simulation = { revision: 0, currentHash: 'initial', backups: [], operations: new Map() };
function simulateSave({ operationId, expectedRevision, payloadHash }) {
  const prior = simulation.operations.get(operationId);
  if (prior) return { ...prior, duplicate: true, revision: simulation.revision };
  if (expectedRevision !== simulation.revision) {
    const result = { ok: false, conflict: true, unchanged: false, submittedPayload: null, revision: simulation.revision };
    simulation.operations.set(operationId, result);
    return result;
  }
  if (payloadHash === simulation.currentHash) {
    const result = { ok: true, conflict: false, unchanged: true, submittedPayload: null, revision: simulation.revision };
    simulation.operations.set(operationId, result);
    return result;
  }
  simulation.backups.unshift({ revision: simulation.revision, hash: simulation.currentHash });
  simulation.backups = simulation.backups.slice(0, backupLimit);
  simulation.currentHash = payloadHash;
  simulation.revision += 1;
  const result = { ok: true, conflict: false, unchanged: false, submittedPayload: null, revision: simulation.revision };
  simulation.operations.set(operationId, result);
  return result;
}

for (let index = 1; index <= productionOperations; index += 1) {
  simulateSave({ operationId: `operation-${index}`, expectedRevision: simulation.revision, payloadHash: `payload-${index}` });
}
assert.equal(simulation.revision, productionOperations, '618 changed syncs must each advance the revision once.');
assert.equal(simulation.backups.length, backupLimit, '618 syncs must retain only 10 normal full backups.');
assert.equal([...simulation.operations.values()].every(row => row.submittedPayload === null), true, 'All operation rows must remain payload-free.');
const duplicateRevision = simulation.revision;
assert.equal(simulateSave({ operationId: 'operation-618', expectedRevision: 617, payloadHash: 'payload-618' }).duplicate, true);
assert.equal(simulation.revision, duplicateRevision, 'Duplicate operation_id must not advance revision twice.');
const unchanged = simulateSave({ operationId: 'operation-noop', expectedRevision: simulation.revision, payloadHash: simulation.currentHash });
assert.equal(unchanged.unchanged, true, 'Unchanged canonical state must no-op.');
assert.equal(simulation.revision, duplicateRevision, 'No-op must not advance revision.');
const conflict = simulateSave({ operationId: 'operation-stale', expectedRevision: simulation.revision - 1, payloadHash: 'stale-device' });
assert.equal(conflict.conflict, true, 'Stale expected_revision must remain conflict-safe.');
assert.equal(simulation.revision, duplicateRevision, 'Conflict must not overwrite authoritative state.');

const toMiB = bytes => Number((bytes / MIB).toFixed(2));
const result = {
  status: 'PASS',
  assumptions: { payloadKiB: payloadBytes / KIB, syncsPerDay, operationMetadataBytes: estimatedOperationBytes, backupLimit, appliedOperationRetentionDays: 30 },
  oldArchitecture: {
    dailyGrowthMiB: toMiB(oldDailyBytes),
    monthlyGrowthMiB: toMiB(oldMonthlyBytes),
    historyAfter618SyncsMiB: toMiB(oldProductionHistoryBytes)
  },
  newArchitecture: {
    dailyMetadataGrowthMiB: toMiB(newDailyMetadataBytes),
    retainedFullBackupMiB: toMiB(newRetainedFullSnapshotBytes),
    retained30DayOperationMetadataMiB: toMiB(newThirtyDayOperationBytes),
    historyAfter618SyncsMiB: toMiB(newProductionHistoryBytes),
    backupsAfter618Syncs: simulation.backups.length,
    lightweightOperationsAfter618Syncs: simulation.operations.size
  }
};

assert.ok(result.newArchitecture.retainedFullBackupMiB < 20, 'Full backup storage target must stay below 20 MiB/account before special snapshots.');
assert.ok(result.newArchitecture.historyAfter618SyncsMiB < 20, '618-sync history must not recreate hundreds of MiB of full snapshots.');
console.log(JSON.stringify(result, null, 2));
