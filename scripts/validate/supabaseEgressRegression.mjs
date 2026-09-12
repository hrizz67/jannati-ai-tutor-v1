import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadCloudLearningDataIfChanged,
  loadCloudLearningRevisionResult,
  startCloudLearningRevisionSync
} from '../../src/services/learningSyncEgress.js';
import {
  saveRevisionedCloudLearningData,
  syncRevisionedCloudLearning
} from '../../src/services/learningSync.js';

const migrationPath = 'supabase/migrations/20260912130000_learning_sync_egress_optimization.sql';
const functionPath = 'supabase/schemas/public/functions/learning_data_v3.sql';
const appPath = 'src/App.jsx';
const egressServicePath = 'src/services/learningSyncEgress.js';
const migration = fs.readFileSync(migrationPath, 'utf8');
const functionSql = fs.readFileSync(functionPath, 'utf8');
const appSource = fs.readFileSync(appPath, 'utf8');
const egressServiceSource = fs.readFileSync(egressServicePath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

function functionBody(source, name, nextName = '') {
  const start = source.indexOf(`create or replace function public.${name}`);
  const end = nextName ? source.indexOf(`create or replace function public.${nextName}`, start) : source.length;
  assert.ok(start >= 0 && end > start, `${name} function body must exist`);
  return source.slice(start, end);
}

function countCalls(calls, name) {
  return calls.filter(call => call.name === name).length;
}

function createReadClient({ revision = 4, payload = { lesson: 'cloud' } } = {}) {
  const calls = [];
  return {
    calls,
    client: {
      async rpc(name, args = {}) {
        calls.push({ name, args });
        if (name === 'get_learning_revision_v1') {
          return { data: { protocolVersion: 3, revision, serverUpdatedAt: `revision-${revision}` }, error: null };
        }
        if (name === 'get_learning_data_v3') {
          return { data: { protocolVersion: 3, payload, revision, serverUpdatedAt: `revision-${revision}` }, error: null };
        }
        return { data: null, error: new Error(`unexpected_rpc:${name}`) };
      }
    }
  };
}

const revisionOnly = createReadClient({ revision: 7 });
const revisionResult = await loadCloudLearningRevisionResult(revisionOnly.client);
assert.equal(revisionResult.revision, 7);
assert.equal(countCalls(revisionOnly.calls, 'get_learning_revision_v1'), 1);
assert.equal(countCalls(revisionOnly.calls, 'get_learning_data_v3'), 0, 'A revision check must not call the full-payload RPC.');

const unchangedRead = createReadClient({ revision: 7 });
const unchangedResult = await loadCloudLearningDataIfChanged(unchangedRead.client, { knownRevision: 7 });
assert.equal(unchangedResult.changed, false);
assert.equal(countCalls(unchangedRead.calls, 'get_learning_data_v3'), 0, 'An unchanged revision must perform zero full-payload reads.');

const changedRead = createReadClient({ revision: 8, payload: { lesson: 'newer-cloud' } });
const changedResult = await loadCloudLearningDataIfChanged(changedRead.client, { knownRevision: 7 });
assert.equal(changedResult.changed, true);
assert.deepEqual(changedResult.data, { lesson: 'newer-cloud' });
assert.equal(countCalls(changedRead.calls, 'get_learning_revision_v1'), 1);
assert.equal(countCalls(changedRead.calls, 'get_learning_data_v3'), 1, 'A changed revision must fetch the full payload exactly once.');

const unchangedRealtime = createReadClient({ revision: 8 });
await loadCloudLearningDataIfChanged(unchangedRealtime.client, { knownRevision: 8, signaledRevision: 8 });
assert.equal(unchangedRealtime.calls.length, 0, 'An unchanged reliable Realtime revision must not query PostgREST.');

const newerRealtime = createReadClient({ revision: 9 });
await loadCloudLearningDataIfChanged(newerRealtime.client, { knownRevision: 8, signaledRevision: 9 });
assert.equal(countCalls(newerRealtime.calls, 'get_learning_revision_v1'), 0, 'A reliable Realtime revision must not need a second metadata query.');
assert.equal(countCalls(newerRealtime.calls, 'get_learning_data_v3'), 1, 'A newer Realtime revision must fetch full state once.');

const submittedPayload = { device: 'local', progress: 12 };
const compactSaveCalls = [];
const compactSaveClient = {
  async rpc(name, args) {
    compactSaveCalls.push({ name, args });
    return {
      data: {
        ok: true,
        unchanged: false,
        duplicate: false,
        conflict: false,
        revision: 2,
        serverUpdatedAt: 'revision-2'
      },
      error: null
    };
  }
};
const compactSave = await saveRevisionedCloudLearningData(compactSaveClient, {
  payload: submittedPayload,
  expectedRevision: 1,
  operationId: '11111111-1111-4111-8111-111111111111',
  deviceId: 'desktop'
});
assert.equal(compactSave.ok, true);
assert.equal(compactSave.payload, null, 'A compact successful response must not be normalized into an empty object.');

const cachedSync = await syncRevisionedCloudLearning(compactSaveClient, submittedPayload, {
  cloudEnvelope: {
    data: { cloudOnly: true },
    revision: 1,
    protocolVersion: 3,
    serverUpdatedAt: 'revision-1',
    error: null
  },
  deviceId: 'desktop'
});
assert.equal(cachedSync.ok, true);
assert.equal(countCalls(compactSaveCalls, 'get_learning_data_v3'), 0, 'A normal save with a valid cached envelope must not pre-read full cloud state.');
assert.equal(countCalls(compactSaveCalls, 'save_learning_data_v4'), 2, 'The optimized frontend must prefer save_learning_data_v4.');
assert.equal(countCalls(compactSaveCalls, 'save_learning_data_v3'), 0, 'The compatible v3 RPC must not be used when v4 is available.');
assert.equal(cachedSync.payload.device, 'local');
assert.equal(cachedSync.payload.cloudOnly, true, 'The submitted merged state must remain authoritative when a success response omits payload.');

const compatibleV3Payload = { legacyClient: 'safe' };
const fallbackCalls = [];
const fallbackResult = await saveRevisionedCloudLearningData({
  async rpc(name) {
    fallbackCalls.push(name);
    if (name === 'save_learning_data_v4') {
      return {
        data: null,
        error: { code: 'PGRST202', message: 'Could not find the function public.save_learning_data_v4 in the schema cache' }
      };
    }
    return {
      data: { ok: true, unchanged: false, duplicate: false, conflict: false, payload: compatibleV3Payload, revision: 2 },
      error: null
    };
  }
}, {
  payload: submittedPayload,
  expectedRevision: 1,
  operationId: '33333333-3333-4333-8333-333333333333',
  deviceId: 'desktop',
  transportMaxAttempts: 1
});
assert.deepEqual(fallbackCalls, ['save_learning_data_v4', 'save_learning_data_v3'], 'Only a genuinely missing v4 RPC may fall back to v3.');
assert.deepEqual(fallbackResult.payload, compatibleV3Payload, 'A v3 fallback must retain its backward-compatible response payload.');
const oldClientParsedPayload = fallbackResult.payload && typeof fallbackResult.payload === 'object'
  ? fallbackResult.payload
  : {};
assert.deepEqual(oldClientParsedPayload, compatibleV3Payload, 'An old-client v3 parser must still receive an object payload.');

const rejectedV4Calls = [];
const rejectedV4Result = await saveRevisionedCloudLearningData({
  async rpc(name) {
    rejectedV4Calls.push(name);
    return { data: null, error: { code: '42501', message: 'permission denied for function save_learning_data_v4' } };
  }
}, {
  payload: submittedPayload,
  expectedRevision: 1,
  operationId: '44444444-4444-4444-8444-444444444444',
  deviceId: 'desktop',
  transportMaxAttempts: 1
});
assert.equal(rejectedV4Result.ok, false);
assert.deepEqual(rejectedV4Calls, ['save_learning_data_v4'], 'Auth, permission and other non-missing v4 errors must never fall back to v3.');

const networkFailureCalls = [];
await saveRevisionedCloudLearningData({
  async rpc(name) {
    networkFailureCalls.push(name);
    return { data: null, error: { status: 0, message: 'Failed to fetch' } };
  }
}, {
  payload: submittedPayload,
  operationId: '55555555-5555-4555-8555-555555555555',
  deviceId: 'desktop',
  transportMaxAttempts: 1
});
assert.deepEqual(networkFailureCalls, ['save_learning_data_v4'], 'A v4 network failure must not silently fall back to v3.');

let conflictAttempt = 0;
const conflictPayload = { otherDevice: 'preserved' };
const conflictClient = {
  async rpc(name, args) {
    assert.equal(name, 'save_learning_data_v4');
    conflictAttempt += 1;
    if (conflictAttempt === 1) {
      return {
        data: {
          ok: false,
          unchanged: false,
          duplicate: false,
          conflict: true,
          payload: conflictPayload,
          revision: 2,
          serverUpdatedAt: 'revision-2'
        },
        error: null
      };
    }
    return {
      data: {
        ok: true,
        unchanged: false,
        duplicate: false,
        conflict: false,
        revision: 3,
        serverUpdatedAt: 'revision-3'
      },
      error: null
    };
  }
};
const reconciled = await syncRevisionedCloudLearning(conflictClient, submittedPayload, {
  cloudEnvelope: { data: {}, revision: 1, protocolVersion: 3, serverUpdatedAt: '', error: null },
  deviceId: 'desktop'
});
assert.equal(reconciled.ok, true);
assert.equal(reconciled.conflictCount, 1);
assert.equal(reconciled.payload.otherDevice, 'preserved', 'Conflict retry must merge the authoritative server payload.');
assert.equal(reconciled.payload.device, 'local', 'Conflict retry must retain the pending local state.');

const duplicateResult = await saveRevisionedCloudLearningData({
  rpc: async () => ({
    data: { ok: true, unchanged: false, duplicate: true, conflict: false, revision: 4 },
    error: null
  })
}, {
  payload: submittedPayload,
  expectedRevision: 3,
  operationId: '22222222-2222-4222-8222-222222222222',
  deviceId: 'desktop'
});
assert.equal(duplicateResult.ok, true);
assert.equal(duplicateResult.duplicate, true);
assert.equal(duplicateResult.payload, null, 'Successful duplicate replay must remain compact and idempotent.');

function createEventTarget(initial = {}) {
  const listeners = new Map();
  return {
    ...initial,
    intervalMs: 0,
    intervalCallback: null,
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) {
      if (listeners.get(name) === callback) listeners.delete(name);
    },
    emit(name, payload) { listeners.get(name)?.(payload); },
    setInterval(callback, milliseconds) {
      this.intervalCallback = callback;
      this.intervalMs = milliseconds;
      return 1;
    },
    clearInterval() { this.intervalCallback = null; }
  };
}

const windowTarget = createEventTarget();
const documentTarget = createEventTarget({ visibilityState: 'visible' });
const navigatorTarget = { onLine: true };
let realtimeCallback = null;
let realtimeFilter = null;
let knownRevision = 10;
let fullReads = 0;
let revisionReads = 0;
let appliedCloudResults = 0;
const lifecycleClient = {
  async rpc(name) {
    if (name === 'get_learning_revision_v1') {
      revisionReads += 1;
      return { data: { protocolVersion: 3, revision: knownRevision, serverUpdatedAt: `revision-${knownRevision}` }, error: null };
    }
    if (name === 'get_learning_data_v3') {
      fullReads += 1;
      const revision = Math.max(knownRevision + 1, 11);
      return { data: { protocolVersion: 3, payload: { revision }, revision, serverUpdatedAt: `revision-${revision}` }, error: null };
    }
    throw new Error(`unexpected_rpc:${name}`);
  },
  channel() {
    return {
      on(_event, filter, callback) {
        realtimeFilter = filter;
        realtimeCallback = callback;
        return this;
      },
      subscribe() { return this; }
    };
  },
  removeChannel() {}
};
const controller = startCloudLearningRevisionSync({
  client: lifecycleClient,
  accountId: 'account-1',
  getKnownRevision: () => knownRevision,
  hasPendingChanges: () => false,
  isWritePending: () => false,
  getLastMutationAt: () => 0,
  isCurrentAccount: () => true,
  onCloudData(result) {
    appliedCloudResults += 1;
    knownRevision = result.revision;
  },
  windowTarget,
  documentTarget,
  navigatorTarget,
  now: () => 10000
});
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

assert.ok(windowTarget.intervalMs >= 60000, 'Fallback polling must be revision-only and no more frequent than once per minute.');
assert.deepEqual(realtimeFilter?.select, ['id', 'learning_revision', 'updated_at'], 'Realtime must receive only compact revision-signalling columns.');
assert.equal(realtimeFilter.select.includes('learning_data'), false, 'Realtime must never select the full learning_data payload.');
assert.equal(revisionReads, 0, 'Starting the watcher after hydration must not immediately repeat a network read.');
windowTarget.emit('focus');
await settle();
assert.equal(revisionReads, 1, 'Focus must check revision metadata first.');
assert.equal(fullReads, 0);

documentTarget.visibilityState = 'hidden';
documentTarget.emit('visibilitychange');
windowTarget.intervalCallback?.();
await settle();
assert.equal(revisionReads, 1, 'Hidden tabs must not continually query PostgREST.');

documentTarget.visibilityState = 'visible';
navigatorTarget.onLine = false;
windowTarget.emit('online');
windowTarget.intervalCallback?.();
await settle();
assert.equal(revisionReads, 1, 'Offline tabs must not continually query PostgREST.');

navigatorTarget.onLine = true;
realtimeCallback?.({ new: { id: 'account-1', learning_revision: knownRevision } });
await settle();
assert.equal(fullReads, 0, 'An unchanged Realtime notification must not fetch full state.');

realtimeCallback?.({ new: { id: 'account-1', learning_revision: knownRevision + 1 } });
realtimeCallback?.({ new: { id: 'account-1', learning_revision: knownRevision + 1 } });
await settle();
assert.equal(fullReads, 1, 'Concurrent newer Realtime signals must cause at most one full-state fetch.');
assert.equal(appliedCloudResults, 1);
controller.dispose();

assert.doesNotMatch(appSource, /setInterval\(pullLatestCloudData,\s*5000\)/, 'The five-second full-payload poll must be impossible.');
assert.doesNotMatch(appSource, /setTimeout\(pullLatestCloudData,\s*1500\)/, 'Hydration must not be followed by an automatic full-payload reread.');
assert.match(appSource, /import\('\.\/services\/learningSyncEgress\.js'\)/, 'Revision watching must remain deferred from the initial bundle.');
assert.match(appSource, /cloudEnvelope:\s*knownCloudEnvelope/, 'Normal App saves must provide their latest known cloud envelope.');
for (const lifecycleEvent of ["'focus'", "'online'", "'visibilitychange'"]) {
  assert.ok(egressServiceSource.includes(lifecycleEvent), `${lifecycleEvent} must use revision-first lifecycle synchronization.`);
}
assert.match(egressServiceSource, /visibilityState !== 'hidden'/, 'Hidden-tab revision polling must be paused.');
assert.match(egressServiceSource, /onLine !== false/, 'Offline revision polling must be paused.');
assert.match(egressServiceSource, /Math\.max\(60000,/, 'Fallback revision polling must be at least 60 seconds.');

const revisionSql = functionBody(functionSql, 'get_learning_revision_v1', 'prune_learning_sync_history_v1');
const getDataSql = functionBody(functionSql, 'get_learning_data_v3', 'get_learning_revision_v1');
const saveCoreSql = functionBody(functionSql, '_save_learning_data_v4_impl', 'save_learning_data_v4');
const saveV4Sql = functionBody(functionSql, 'save_learning_data_v4', 'save_learning_data_v3');
const saveV3Sql = functionBody(functionSql, 'save_learning_data_v3', 'append_learning_event_v1');
assert.doesNotMatch(revisionSql, /learning_data/, 'The revision RPC must never expose learning_data.');
assert.match(revisionSql, /auth\.uid\(\)/, 'Revision metadata must be scoped to the authenticated account.');
assert.match(revisionSql, /where profile_row\.id = caller_id/, 'Revision metadata must read only the caller profile.');
assert.match(revisionSql, /security definer[\s\S]{0,80}set search_path to ''/, 'Revision RPC must lock its security-definer search path.');
assert.match(functionSql, /revoke all on function public\.get_learning_revision_v1\(\) from public, anon, authenticated/, 'Anon/public execution must be revoked.');
assert.match(functionSql, /grant execute on function public\.get_learning_revision_v1\(\) to authenticated/, 'Authenticated execution must be explicit.');
assert.ok(getDataSql.indexOf('select coalesce') < getDataSql.indexOf('if not found then'));
assert.ok(getDataSql.indexOf('if not found then') < getDataSql.indexOf('insert into public.profiles'), 'Profile creation must be a missing-row compatibility fallback, not normal read work.');

const appliedReplay = saveCoreSql.slice(saveCoreSql.indexOf("if prior_status = 'applied'"), saveCoreSql.indexOf("if prior_status = 'conflict'"));
const conflictReplay = saveCoreSql.slice(saveCoreSql.indexOf("if prior_status = 'conflict'"), saveCoreSql.indexOf('if current_revision <> $2'));
const revisionConflict = saveCoreSql.slice(saveCoreSql.indexOf('if current_revision <> $2'), saveCoreSql.indexOf('if current_payload = incoming_payload'));
const unchangedSave = saveCoreSql.slice(saveCoreSql.indexOf('if current_payload = incoming_payload'), saveCoreSql.indexOf('insert into public.learning_data_backups'));
const changedSaveReturn = saveCoreSql.slice(saveCoreSql.lastIndexOf('return jsonb_build_object'));
assert.doesNotMatch(appliedReplay, /'payload'/, 'Successful duplicate replay must not return full payload.');
assert.match(conflictReplay, /'payload', current_payload/, 'Duplicate conflict must return authoritative payload.');
assert.match(revisionConflict, /'payload', current_payload/, 'Revision conflict must return authoritative payload.');
assert.doesNotMatch(unchangedSave, /'payload'/, 'No-op success must not return full payload.');
assert.doesNotMatch(changedSaveReturn, /'payload'/, 'Changed success must not return full payload.');
assert.match(saveV4Sql, /return public\._save_learning_data_v4_impl\(\$1, \$2, \$3, \$4, \$5\)/, 'V4 must use the single hardened save implementation.');
assert.doesNotMatch(saveV4Sql, /'payload'/, 'The public v4 success wrapper must remain compact.');
assert.match(saveV3Sql, /public\._save_learning_data_v4_impl[\s\S]{0,180}result ->> 'ok'[\s\S]{0,500}'payload', current_payload/, 'V3 must add the authoritative payload to every successful helper result.');
assert.match(appliedReplay, /'ok', true/, 'V3 duplicate success must pass through the payload-restoring compatibility wrapper.');
assert.match(unchangedSave, /'ok', true[\s\S]{0,180}'unchanged', true/, 'V3 no-op success must pass through the payload-restoring compatibility wrapper.');
assert.match(changedSaveReturn, /'ok', true/, 'V3 changed success must pass through the payload-restoring compatibility wrapper.');
assert.match(saveCoreSql, /8388608/, 'The 8 MB payload guard must remain.');
assert.match(saveCoreSql, /for update;/, 'Revision decisions must retain row locking.');
assert.match(saveCoreSql, /operation_id_account_mismatch/, 'Operation IDs must remain account scoped.');
assert.match(saveCoreSql, /learning_data_backups[\s\S]{0,300}'pre-write'/, 'Pre-write recovery backups must remain available.');
assert.match(saveCoreSql, /auth\.uid\(\)/, 'The shared save implementation must remain scoped to the authenticated caller.');
assert.match(saveCoreSql, /security definer[\s\S]{0,80}set search_path to ''/, 'The shared save implementation must retain a locked search path.');
assert.match(functionSql, /revoke all on function public\.save_learning_data_v4\(jsonb, bigint, uuid, text, text\[\]\) from public, anon, authenticated/, 'Anon/public execution of v4 must be revoked.');
assert.match(functionSql, /grant execute on function public\.save_learning_data_v4\(jsonb, bigint, uuid, text, text\[\]\) to authenticated/, 'Authenticated execution of v4 must be explicit.');
assert.match(functionSql, /revoke all on function public\._save_learning_data_v4_impl\(jsonb, bigint, uuid, text, text\[\]\) from public, anon, authenticated/, 'The shared save helper must not be exposed as a client RPC.');
assert.match(migration, /create or replace function public\.save_learning_data_v3[\s\S]{0,1200}'payload', current_payload/, 'The undeployed migration must preserve the backward-compatible v3 payload contract.');
assert.match(migration, /create or replace function public\.save_learning_data_v4[\s\S]{0,400}_save_learning_data_v4_impl/, 'The undeployed migration must expose the compact v4 wrapper.');
assert.doesNotMatch(migration, /^\s*vacuum\s+full\b/im, 'The migration must not run VACUUM FULL.');

const frontendSources = [];
function collectFrontendSources(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFrontendSources(entryPath);
    else if (/\.(?:js|jsx|mjs)$/.test(entry.name)) frontendSources.push(fs.readFileSync(entryPath, 'utf8'));
  }
}
collectFrontendSources('src');
assert.doesNotMatch(frontendSources.join('\n'), /service_role/i, 'Frontend source must never contain service_role credentials or access.');

assert.equal(packageJson.scripts?.['validate:supabase-egress'], 'node scripts/validate/supabaseEgressRegression.mjs');
assert.ok(packageJson.scripts?.prevalidate.includes('node scripts/validate/supabaseEgressRegression.mjs'), 'The egress incident guard must run in full validation.');

console.log('Supabase PostgREST egress regression: PASS (revision-first reads, compact saves, conflict-only payloads)');
