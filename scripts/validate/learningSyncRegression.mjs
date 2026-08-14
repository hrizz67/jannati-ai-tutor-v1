import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CHILD_ORIGINAL_SNAPSHOT_PREFIX,
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  loadCloudLearningDataResult,
  mergeCloudLearningPayload
} from '../../src/services/learningSync.js';

function snapshot(childId, capturedAt, name, xp) {
  return JSON.stringify({
    __childSnapshotChildId: childId,
    __childSnapshotCapturedAt: capturedAt,
    jannati_v151_profile: JSON.stringify({ name, xp, updatedAt: new Date(capturedAt).toISOString() })
  });
}

function childState(profiles, activeChildId, deletedChildren = {}) {
  return JSON.stringify({ version: 2, profiles, activeChildId, deletedChildren });
}

const profiles = [
  { id: 'child-a', name: 'Aisyah', createdAt: '2026-08-01T00:00:00.000Z' },
  { id: 'child-b', name: 'Bilal', createdAt: '2026-08-02T00:00:00.000Z' }
];
const localA = snapshot('child-a', 100, 'Aisyah-local-lama', 10);
const cloudA = snapshot('child-a', 200, 'Aisyah-cloud-baharu', 30);
const localB = snapshot('child-b', 100, 'Bilal-local-baharu', 50);
const cloudB = snapshot('child-b', 200, 'Bilal-cloud-lama', 20);
const localPayload = {
  [CLOUD_CHILD_STATE_KEY]: childState(profiles, 'child-b'),
  [`${CHILD_SNAPSHOT_PREFIX}child-a`]: localA,
  [`${CHILD_SNAPSHOT_PREFIX}child-b`]: localB,
  [`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}child-a`]: localA
};
const cloudPayload = {
  [CLOUD_CHILD_STATE_KEY]: childState(profiles, 'child-a'),
  [`${CHILD_SNAPSHOT_PREFIX}child-a`]: cloudA,
  [`${CHILD_SNAPSHOT_PREFIX}child-b`]: cloudB,
  [`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}child-a`]: cloudA
};

const merged = mergeCloudLearningPayload(localPayload, cloudPayload, {
  dirtyChildIds: ['child-b'],
  localActiveChildId: 'child-b',
  deviceId: 'desktop'
});
assert.equal(merged[`${CHILD_SNAPSHOT_PREFIX}child-a`], cloudA, 'Newer cloud data for an untouched profile must be retained.');
assert.equal(merged[`${CHILD_SNAPSHOT_PREFIX}child-b`], localB, 'Dirty active profile data must be uploaded without borrowing another profile.');
assert.equal(JSON.parse(merged[CLOUD_CHILD_STATE_KEY]).activeChildId, 'child-b');

const cloudWinsWithoutDirtyFlag = mergeCloudLearningPayload(localPayload, cloudPayload, {
  localActiveChildId: 'child-a'
});
assert.equal(cloudWinsWithoutDirtyFlag[`${CHILD_SNAPSHOT_PREFIX}child-a`], cloudA, 'A stale local profile must not replace a newer cloud profile.');

const localWinsWhenDirty = mergeCloudLearningPayload(localPayload, cloudPayload, {
  dirtyChildIds: ['child-a'],
  localActiveChildId: 'child-a'
});
assert.equal(localWinsWhenDirty[`${CHILD_SNAPSHOT_PREFIX}child-a`], localA, 'An explicitly dirty profile must survive clock skew while it is being uploaded.');

const deleted = mergeCloudLearningPayload(localPayload, {
  ...cloudPayload,
  [CLOUD_CHILD_STATE_KEY]: childState(profiles, 'child-b', { 'child-a': 300 })
}, { localActiveChildId: 'child-b' });
const deletedState = JSON.parse(deleted[CLOUD_CHILD_STATE_KEY]);
assert.deepEqual(deletedState.profiles.map(profile => profile.id), ['child-b'], 'Deleted profiles must not be resurrected by another device.');
assert.equal(deleted[`${CHILD_SNAPSHOT_PREFIX}child-a`], undefined);
assert.equal(deleted[`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}child-a`], undefined);

const successfulLoad = await loadCloudLearningDataResult({
  rpc: async name => ({ data: name === 'get_learning_data' ? { ok: true } : null, error: null })
});
assert.deepEqual(successfulLoad, { data: { ok: true }, error: null });
const failedLoad = await loadCloudLearningDataResult({
  rpc: async () => ({ data: null, error: new Error('offline') })
});
assert.equal(failedLoad.data, null);
assert.match(failedLoad.error.message, /offline/);

const appSource = fs.readFileSync('src/App.jsx', 'utf8');
const sqlSource = fs.readFileSync('supabase/learning_data.sql', 'utf8');
assert.match(appSource, /cloudHydratedAccountId !== accountUser\.id/, 'Autosave must wait for account cloud hydration.');
assert.match(appSource, /captureChildSnapshot\(activeChildId, \{ force: true \}\)/, 'Cloud saves must refresh the active child snapshot.');
assert.match(appSource, /hasPendingCloudMutation\(accountUser\.id\)/, 'Unsent learning changes must survive reload and reconnect.');
assert.match(appSource, /cloudResult\.error[\s\S]{0,250}pendingOfflineCloudSaveRef\.current = hasPendingLocalData[\s\S]{0,150}if \(!hasPendingLocalData\) skipNextCloudSaveRef\.current = true/, 'A failed initial cloud pull must not turn unchanged device data into an upload.');
assert.match(appSource, /markLocalLearningMutation\(\);[\s\S]{0,500}setTimeout/, 'Learning changes must be marked pending before the debounce timer can be interrupted.');
assert.match(appSource, /reloadCloudLearningState\(restoredChildId\)/, 'A cloud pull must refresh active profile state in React.');
assert.match(appSource, /applyMergedCloudMetadata\(payload, activeChildId\)/, 'A completed upload must not restore an older in-flight payload over newer active learning state.');
assert.match(appSource, /localStorage\.removeItem\(`\$\{CHILD_ORIGINAL_SNAPSHOT_PREFIX\}\$\{target\.id\}`\)/, 'Deleting a profile must remove its original backup.');
assert.match(sqlSource, /where id = auth\.uid\(\)/, 'Cloud learning reads and writes must remain scoped to the authenticated account.');
assert.match(sqlSource, /if auth\.uid\(\) is null then/, 'Anonymous writes must fail closed.');

console.log('Learning sync regression: PASS (multi-device, multi-profile, offline retry, deletion isolation)');
