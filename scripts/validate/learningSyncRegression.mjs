import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CHILD_MERGED_BACKUP_PREFIX,
  CHILD_ORIGINAL_SNAPSHOT_PREFIX,
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  hasRecoverableChildProfileDuplicates,
  hasRecoverableActiveProfileDuplicate,
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

const anonymousId = 'child-anonymous-aisyah';
const premiumId = 'child-premium-aisyah';
const anonymousEmpty = snapshot(anonymousId, 300, 'Aisyah', 0);
const premiumLearning = snapshot(premiumId, 200, 'Aisyah', 80);
const anonymousPayload = {
  [CLOUD_CHILD_STATE_KEY]: childState([
    { id: anonymousId, name: 'Aisyah', year: 'Tahun 2', createdAt: '2026-08-20T00:00:00.000Z' }
  ], anonymousId),
  [`${CHILD_SNAPSHOT_PREFIX}${anonymousId}`]: anonymousEmpty,
  jannati_v151_profile: JSON.stringify({ name: 'Aisyah', xp: 0 })
};
const premiumPayload = {
  [CLOUD_CHILD_STATE_KEY]: childState([
    { id: premiumId, name: 'Aisyah', year: 'Tahun 2', createdAt: '2026-07-01T00:00:00.000Z' }
  ], premiumId),
  [`${CHILD_SNAPSHOT_PREFIX}${premiumId}`]: premiumLearning,
  jannati_v151_profile: JSON.stringify({ name: 'Aisyah', xp: 80 })
};

const isolatedWithoutLoginReconciliation = mergeCloudLearningPayload(anonymousPayload, premiumPayload, {
  dirtyChildIds: [anonymousId],
  localActiveChildId: anonymousId
});
assert.equal(JSON.parse(isolatedWithoutLoginReconciliation[CLOUD_CHILD_STATE_KEY]).profiles.length, 2, 'Normal sync must not merge profiles by display name.');

const reconciledLogin = mergeCloudLearningPayload(anonymousPayload, premiumPayload, {
  dirtyChildIds: [anonymousId],
  localActiveChildId: anonymousId,
  reconcileChildIdentity: true
});
const reconciledState = JSON.parse(reconciledLogin[CLOUD_CHILD_STATE_KEY]);
assert.deepEqual(reconciledState.profiles.map(profile => profile.id), [premiumId], 'Login migration must reuse the existing Premium child ID.');
assert.equal(reconciledState.activeChildId, premiumId, 'The existing Premium child must become active after reconciliation.');
assert.equal(reconciledState.profiles[0].createdAt, '2026-07-01T00:00:00.000Z', 'Premium profile metadata must remain canonical.');
assert.equal(reconciledLogin[`${CHILD_SNAPSHOT_PREFIX}${anonymousId}`], undefined, 'The anonymous alias snapshot must be removed.');
assert.equal(JSON.parse(reconciledLogin.jannati_v151_profile).xp, 80, 'An empty anonymous profile must not hide richer Premium learning data.');

const corruptedCloudPayload = {
  ...premiumPayload,
  [CLOUD_CHILD_STATE_KEY]: childState([
    { id: premiumId, name: 'Aisyah', year: 'Tahun 2', createdAt: '2026-07-01T00:00:00.000Z' },
    { id: anonymousId, name: 'Aisyah', year: 'Tahun 2', createdAt: '2026-08-20T00:00:00.000Z' }
  ], anonymousId),
  [`${CHILD_SNAPSHOT_PREFIX}${anonymousId}`]: anonymousEmpty
};
assert.equal(hasRecoverableActiveProfileDuplicate(corruptedCloudPayload), true, 'An active empty duplicate already stored in cloud must be detected.');
const repairedCloudDuplicate = mergeCloudLearningPayload(corruptedCloudPayload, corruptedCloudPayload, {
  dirtyChildIds: [anonymousId],
  localActiveChildId: anonymousId,
  reconcileChildIdentity: true
});
const repairedCloudState = JSON.parse(repairedCloudDuplicate[CLOUD_CHILD_STATE_KEY]);
assert.deepEqual(repairedCloudState.profiles.map(profile => profile.id), [premiumId], 'A previously stored empty duplicate must collapse into the richer Premium profile.');
assert.equal(repairedCloudState.activeChildId, premiumId);
assert.equal(repairedCloudState.profiles[0].createdAt, '2026-07-01T00:00:00.000Z');

const premiumSplitLearning = JSON.stringify({
  __childSnapshotChildId: premiumId,
  __childSnapshotCapturedAt: 200,
  jannati_v151_profile: JSON.stringify({
    name: 'Fayyadh',
    year: 'Tahun 2',
    xp: 80,
    progress: { bm_kata_nama: { best: 80, attempts: 2 } },
    history: [{ id: 'bm-session', subjectId: 'bm', score: 80 }]
  })
});
const duplicateSplitLearning = JSON.stringify({
  __childSnapshotChildId: anonymousId,
  __childSnapshotCapturedAt: 300,
  jannati_v151_profile: JSON.stringify({
    name: 'Fayyadh',
    year: 'Tahun 2',
    xp: 35,
    progress: { math_tambah: { best: 90, attempts: 1 } },
    history: [{ id: 'math-session', subjectId: 'math', score: 90 }]
  })
});
const meaningfulDuplicatePayload = {
  [CLOUD_CHILD_STATE_KEY]: childState([
    { id: premiumId, name: 'Fayyadh', year: 'Tahun 2', createdAt: '2026-07-01T00:00:00.000Z' },
    { id: anonymousId, name: 'Fayyadh', year: 'Tahun 2', createdAt: '2026-08-20T00:00:00.000Z' }
  ], anonymousId),
  [`${CHILD_SNAPSHOT_PREFIX}${premiumId}`]: premiumSplitLearning,
  [`${CHILD_SNAPSHOT_PREFIX}${anonymousId}`]: duplicateSplitLearning
};
assert.equal(hasRecoverableChildProfileDuplicates(meaningfulDuplicatePayload), true, 'Same-name/year cloud duplicates must be detected even when both contain learning.');
const mergedMeaningfulDuplicate = mergeCloudLearningPayload(meaningfulDuplicatePayload, meaningfulDuplicatePayload, {
  dirtyChildIds: [anonymousId],
  localActiveChildId: anonymousId,
  reconcileChildIdentity: true
});
const mergedMeaningfulState = JSON.parse(mergedMeaningfulDuplicate[CLOUD_CHILD_STATE_KEY]);
const mergedMeaningfulSnapshot = JSON.parse(mergedMeaningfulDuplicate[`${CHILD_SNAPSHOT_PREFIX}${premiumId}`]);
const mergedMeaningfulProfile = JSON.parse(mergedMeaningfulSnapshot.jannati_v151_profile);
assert.deepEqual(mergedMeaningfulState.profiles.map(profile => profile.id), [premiumId], 'Two meaningful duplicate profiles must become one canonical Premium profile.');
assert.equal(mergedMeaningfulState.activeChildId, premiumId);
assert.equal(mergedMeaningfulProfile.xp, 80, 'XP must use a conservative maximum instead of double counting.');
assert.deepEqual(Object.keys(mergedMeaningfulProfile.progress).sort(), ['bm_kata_nama', 'math_tambah'], 'Topic progress from both duplicate profiles must be retained.');
assert.deepEqual(mergedMeaningfulProfile.history.map(item => item.id).sort(), ['bm-session', 'math-session'], 'Distinct learning history from both profiles must be retained.');
assert.ok(mergedMeaningfulState.deletedChildren[anonymousId] > 0, 'The duplicate ID needs a tombstone so an older device cannot resurrect it.');
assert.equal(mergedMeaningfulDuplicate[`${CHILD_SNAPSHOT_PREFIX}${anonymousId}`], undefined);
assert.ok(mergedMeaningfulDuplicate[`${CHILD_MERGED_BACKUP_PREFIX}${anonymousId}`], 'The removed duplicate must remain recoverable from a hidden account backup.');

const differentYearPayload = {
  ...anonymousPayload,
  [CLOUD_CHILD_STATE_KEY]: childState([
    { id: anonymousId, name: 'Aisyah', year: 'Tahun 3', createdAt: '2026-08-20T00:00:00.000Z' }
  ], anonymousId)
};
const differentYearMerge = mergeCloudLearningPayload(differentYearPayload, premiumPayload, {
  dirtyChildIds: [anonymousId],
  localActiveChildId: anonymousId,
  reconcileChildIdentity: true
});
assert.equal(JSON.parse(differentYearMerge[CLOUD_CHILD_STATE_KEY]).profiles.length, 2, 'Same-name children in different years must remain isolated.');

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
const dashboardSource = fs.readFileSync('src/dashboard/HomeDashboard.jsx', 'utf8');
const sqlSource = fs.readFileSync('supabase/learning_data.sql', 'utf8');
assert.match(appSource, /cloudHydratedAccountId !== accountUser\.id/, 'Autosave must wait for account cloud hydration.');
assert.match(appSource, /captureChildSnapshot\(activeChildId, \{ force: true \}\)/, 'Cloud saves must refresh the active child snapshot.');
assert.match(appSource, /hasPendingCloudMutation\(accountUser\.id\)/, 'Unsent learning changes must survive reload and reconnect.');
assert.match(appSource, /cloudResult\.error[\s\S]{0,250}pendingOfflineCloudSaveRef\.current = hasPendingLocalData[\s\S]{0,150}if \(!hasPendingLocalData\) skipNextCloudSaveRef\.current = true/, 'A failed initial cloud pull must not turn unchanged device data into an upload.');
assert.match(appSource, /function scheduleCloudLearningSave[\s\S]{0,300}markLocalLearningMutation\(childId\)[\s\S]{0,300}cloudSaveTimerRef\.current = window\.setTimeout/, 'Learning changes must be marked pending before the persistent debounce timer starts.');
assert.match(appSource, /autoSave\(questionIndex, nextSession\);\s*scheduleCloudLearningSave\(\{ delay: 500 \}\)/, 'Every checked answer must explicitly schedule an account cloud save.');
assert.match(appSource, /captureAccountSnapshot\(nextId\);\s*setPendingCloudMutation\(nextId, true\);/, 'First-account migration must upload existing anonymous learning instead of replacing it.');
assert.match(appSource, /existingSnapshot && anonymousDirtyChildIds\.length[\s\S]{0,500}mergeCloudLearningPayload\(anonymousPayload, existingSnapshot[\s\S]{0,400}setPendingCloudMutation\(nextId, true\)/, 'Returning account login must merge meaningful local learning before cloud hydration.');
assert.match(appSource, /if \(!accountUser\?\.id\)[\s\S]{0,200}captureChildSnapshot\(currentChildId, \{ force: true \}\)[\s\S]{0,100}setShowAccountLogin\(true\)/, 'Opening account login from local mode must preserve the current learning snapshot.');
assert.match(appSource, /window\.setInterval\(pullLatestCloudData, 5000\)/, 'Visible devices must check for newer cloud learning promptly.');
assert.match(appSource, /Disimpan pada peranti ini sahaja\. Log masuk akaun yang sama/, 'Anonymous quiz storage must not be described as cross-device cloud sync.');
assert.match(dashboardSource, /Cloud tidak aktif/, 'The dashboard must disclose when cloud sync is inactive.');
assert.match(dashboardSource, /Log masuk untuk Sync/, 'The dashboard must give local-only users a clear cloud sign-in action.');
assert.match(appSource, /reloadCloudLearningState\(restoredChildId\)/, 'A cloud pull must refresh active profile state in React.');
assert.match(appSource, /applyMergedCloudMetadata\(payload, activeChildId\)/, 'A completed upload must not restore an older in-flight payload over newer active learning state.');
assert.match(appSource, /localStorage\.removeItem\(`\$\{CHILD_ORIGINAL_SNAPSHOT_PREFIX\}\$\{target\.id\}`\)/, 'Deleting a profile must remove its original backup.');
assert.match(appSource, /!key\.startsWith\(CHILD_MERGED_BACKUP_PREFIX\)/, 'A merged-profile recovery backup must never be copied recursively into a child snapshot.');
assert.match(appSource, /const duplicateProfile = existingProfiles\.find[\s\S]{0,450}Profil \$\{duplicateProfile\.name\}[\s\S]{0,150}return true;/, 'Creating the same child name and year must reuse the existing profile.');
assert.match(sqlSource, /where id = auth\.uid\(\)/, 'Cloud learning reads and writes must remain scoped to the authenticated account.');
assert.match(sqlSource, /if auth\.uid\(\) is null then/, 'Anonymous writes must fail closed.');

console.log('Learning sync regression: PASS (multi-device, multi-profile, offline retry, deletion isolation)');
