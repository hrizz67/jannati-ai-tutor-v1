import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CHILD_MERGED_BACKUP_PREFIX,
  CHILD_ORIGINAL_SNAPSHOT_PREFIX,
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  CLOUD_SYNC_PROTOCOL_VERSION,
  hasRecoverableChildProfileDuplicates,
  hasRecoverableActiveProfileDuplicate,
  loadCloudLearningDataResult,
  mergeCloudLearningPayload,
  normalizeActiveLearningProjection,
  recoverMonotonicCloudGap,
  recoverOrphanedCloudOutbox,
  saveRevisionedCloudLearningData,
  syncRevisionedCloudLearning
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

const emptyLocalAfterDelete = snapshot('child-a', 500, 'Aisyah-local-kosong', 0);
const protectedAfterDelete = mergeCloudLearningPayload({
  ...localPayload,
  [`${CHILD_SNAPSHOT_PREFIX}child-a`]: emptyLocalAfterDelete
}, cloudPayload, {
  localActiveChildId: 'child-a'
});
assert.equal(
  protectedAfterDelete[`${CHILD_SNAPSHOT_PREFIX}child-a`],
  cloudA,
  'Profil tempatan kosong yang baru diwujudkan selepas delete tidak boleh memadam pembelajaran cloud.'
);

const originalChild = { id: 'child-original', name: 'Fayyadh', year: 'Tahun 2' };
const temporaryChild = { id: 'child-temporary', name: 'Anak Baharu', year: 'Tahun 2' };
const staleOriginalLocal = snapshot(originalChild.id, 500, 'Fayyadh-local-lama', 5);
const currentOriginalCloud = snapshot(originalChild.id, 400, 'Fayyadh-cloud-semasa', 100);
const deleteTemporaryPayload = mergeCloudLearningPayload({
  [CLOUD_CHILD_STATE_KEY]: childState([originalChild], originalChild.id, { [temporaryChild.id]: 600 }),
  [`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]: staleOriginalLocal
}, {
  [CLOUD_CHILD_STATE_KEY]: childState([originalChild, temporaryChild], temporaryChild.id),
  [`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]: currentOriginalCloud,
  [`${CHILD_SNAPSHOT_PREFIX}${temporaryChild.id}`]: snapshot(temporaryChild.id, 450, temporaryChild.name, 0)
}, {
  dirtyChildIds: [temporaryChild.id],
  localActiveChildId: originalChild.id
});
assert.equal(
  deleteTemporaryPayload[`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`],
  currentOriginalCloud,
  'Memadam profil baharu tidak boleh menandakan profil asal dirty atau menggantikan data cloud semasanya.'
);
assert.equal(
  deleteTemporaryPayload[`${CHILD_SNAPSHOT_PREFIX}${temporaryChild.id}`],
  undefined,
  'Snapshot profil baharu yang dipadam mesti dikeluarkan tanpa menyentuh profil asal.'
);

const localWinsWhenDirty = mergeCloudLearningPayload(localPayload, cloudPayload, {
  dirtyChildIds: ['child-a'],
  localActiveChildId: 'child-a'
});
assert.equal(localWinsWhenDirty[`${CHILD_SNAPSHOT_PREFIX}child-a`], localA, 'An explicitly dirty profile must survive clock skew while it is being uploaded.');

const currentResumeSnapshot = snapshot('child-current', 500, 'Fayyadh-semasa', 40);
const olderRicherBackup = snapshot('child-current', 100, 'Fayyadh-backup-lama', 100);
const currentResumePayload = mergeCloudLearningPayload({
  [CLOUD_CHILD_STATE_KEY]: childState([
    { id: 'child-current', name: 'Fayyadh', year: 'Tahun 2' }
  ], 'child-current'),
  [`${CHILD_SNAPSHOT_PREFIX}child-current`]: currentResumeSnapshot,
  [`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}child-current`]: olderRicherBackup
}, {}, { localActiveChildId: 'child-current' });
assert.equal(
  JSON.parse(currentResumePayload.jannati_v151_profile).name,
  'Fayyadh-semasa',
  'Snapshot semasa yang lebih baharu mesti menentukan resume walaupun backup lama mempunyai XP lebih tinggi.'
);

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

const mobileZeroPayload = {
  [CLOUD_CHILD_STATE_KEY]: childState([originalChild], originalChild.id),
  [`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]: snapshot(originalChild.id, 900, 'Fayyadh', 0)
};
const desktopXp140Payload = {
  [CLOUD_CHILD_STATE_KEY]: childState([originalChild], originalChild.id),
  [`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]: snapshot(originalChild.id, 800, 'Fayyadh', 140)
};

const splitProjectionPayload = {
  [CLOUD_CHILD_STATE_KEY]: childState([originalChild], originalChild.id),
  [`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]: snapshot(originalChild.id, 900, 'Fayyadh', 40),
  jannati_v151_profile: JSON.stringify({ name: 'Fayyadh', xp: 140, streak: 1 }),
  'jannati.gamification.profile': JSON.stringify({ xp: 140, currentStreak: 1 })
};
const normalizedProjection = normalizeActiveLearningProjection(splitProjectionPayload, originalChild.id);
assert.equal(JSON.parse(normalizedProjection.jannati_v151_profile).xp, 140, 'A richer root XP must repair the active child snapshot before hydration.');
assert.equal(
  JSON.parse(JSON.parse(normalizedProjection[`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]).jannati_v151_profile).xp,
  140,
  'The root projection and active child snapshot must converge on the monotonic XP maximum.'
);

const crossChildProjection = normalizeActiveLearningProjection({
  [CLOUD_CHILD_STATE_KEY]: childState([
    originalChild,
    { id: 'child-other', name: 'Aisyah', year: 'Tahun 2' }
  ], originalChild.id),
  [`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]: snapshot(originalChild.id, 900, 'Fayyadh', 40),
  jannati_v151_profile: JSON.stringify({ name: 'Aisyah', year: 'Tahun 2', xp: 999 })
}, originalChild.id);
assert.equal(
  JSON.parse(JSON.parse(crossChildProjection[`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]).jannati_v151_profile).xp,
  40,
  'A root projection identified as another child must never be merged into the active learner snapshot.'
);

const cloudXp40Payload = {
  [CLOUD_CHILD_STATE_KEY]: childState([originalChild], originalChild.id),
  [`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]: snapshot(originalChild.id, 1000, 'Fayyadh', 40),
  jannati_v151_profile: JSON.stringify({ name: 'Fayyadh', xp: 40, streak: 1 })
};
const recoverDesktopXp = recoverMonotonicCloudGap(desktopXp140Payload, cloudXp40Payload, {
  localActiveChildId: originalChild.id
});
assert.equal(recoverDesktopXp.recovered, true, 'Desktop XP 140 must be recovered before cloud XP 40 is allowed to hydrate over it.');
assert.deepEqual(recoverDesktopXp.dirtyChildIds, [originalChild.id]);

const repairSplitCloudProjection = recoverMonotonicCloudGap(splitProjectionPayload, splitProjectionPayload, {
  localActiveChildId: originalChild.id
});
assert.equal(
  repairSplitCloudProjection.recovered,
  true,
  'Cloud root XP 140 with an active child snapshot XP 40 must schedule one repair write even after read-time normalization.'
);
const repairedSplitCloudPayload = mergeCloudLearningPayload(splitProjectionPayload, splitProjectionPayload, {
  dirtyChildIds: repairSplitCloudProjection.dirtyChildIds,
  localActiveChildId: originalChild.id,
  mergeDirtySnapshots: true
});
assert.equal(
  JSON.parse(JSON.parse(repairedSplitCloudPayload[`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]).jannati_v151_profile).xp,
  140,
  'The repair write must persist XP 140 into the canonical active child snapshot.'
);
assert.equal(
  recoverMonotonicCloudGap(repairedSplitCloudPayload, repairedSplitCloudPayload, {
    localActiveChildId: originalChild.id
  }).recovered,
  false,
  'A converged cloud projection must not create an endless revision loop.'
);

const mergedXpConflict = mergeCloudLearningPayload(cloudXp40Payload, splitProjectionPayload, {
  dirtyChildIds: [originalChild.id],
  localActiveChildId: originalChild.id,
  mergeDirtySnapshots: true
});
assert.equal(JSON.parse(mergedXpConflict.jannati_v151_profile).xp, 140, 'A lower dirty device XP must never reduce the cloud account projection.');
assert.equal(
  JSON.parse(JSON.parse(mergedXpConflict[`${CHILD_SNAPSHOT_PREFIX}${originalChild.id}`]).jannati_v151_profile).xp,
  140,
  'A lower dirty device XP must never reduce the canonical child snapshot.'
);

const staleMobilePending = recoverOrphanedCloudOutbox(mobileZeroPayload, desktopXp140Payload, {
  pending: true,
  dirtyChildIds: [],
  localActiveChildId: originalChild.id
});
assert.equal(staleMobilePending.clearPending, true, 'An empty mobile outbox must stop blocking the richer XP 140 cloud snapshot.');
assert.deepEqual(staleMobilePending.dirtyChildIds, []);

const interruptedDesktopPending = recoverOrphanedCloudOutbox(desktopXp140Payload, mobileZeroPayload, {
  pending: true,
  dirtyChildIds: [],
  localActiveChildId: originalChild.id
});
assert.equal(interruptedDesktopPending.recovered, true, 'Meaningful XP must recover a missing child-level outbox after an interrupted save.');
assert.deepEqual(interruptedDesktopPending.dirtyChildIds, [originalChild.id]);

const localAliasPending = recoverOrphanedCloudOutbox({
  [CLOUD_CHILD_STATE_KEY]: childState([
    { id: anonymousId, name: 'Fayyadh', year: 'Tahun 2' }
  ], anonymousId),
  [`${CHILD_SNAPSHOT_PREFIX}${anonymousId}`]: snapshot(anonymousId, 900, 'Fayyadh', 30)
}, desktopXp140Payload, {
  pending: true,
  dirtyChildIds: [],
  localActiveChildId: anonymousId
});
assert.equal(localAliasPending.recovered, true);
assert.equal(localAliasPending.reconcileChildIdentity, true, 'Recovered outbox must reconcile the same learner instead of creating another Fayyadh profile.');

const deleted = mergeCloudLearningPayload(localPayload, {
  ...cloudPayload,
  [CLOUD_CHILD_STATE_KEY]: childState(profiles, 'child-b', { 'child-a': 300 })
}, { localActiveChildId: 'child-b' });
const deletedState = JSON.parse(deleted[CLOUD_CHILD_STATE_KEY]);
assert.deepEqual(deletedState.profiles.map(profile => profile.id), ['child-b'], 'Deleted profiles must not be resurrected by another device.');
assert.equal(deleted[`${CHILD_SNAPSHOT_PREFIX}child-a`], undefined);
assert.equal(deleted[`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}child-a`], undefined);

const successfulLoad = await loadCloudLearningDataResult({
  rpc: async name => ({
    data: name === 'get_learning_data_v3'
      ? { protocolVersion: 3, payload: { ok: true }, revision: 7, serverUpdatedAt: '2026-08-23T00:00:00.000Z' }
      : null,
    error: null
  })
});
assert.deepEqual(successfulLoad, {
  data: { ok: true },
  revision: 7,
  protocolVersion: 3,
  serverUpdatedAt: '2026-08-23T00:00:00.000Z',
  error: null
});
const malformedV3Load = await loadCloudLearningDataResult({
  rpc: async () => ({ data: { payload: {} }, error: null })
});
assert.equal(malformedV3Load.protocolVersion, 0, 'A malformed v3 envelope must fail closed instead of enabling writes.');
const legacyLoad = await loadCloudLearningDataResult({
  rpc: async name => name === 'get_learning_data_v3'
    ? { data: null, error: { code: 'PGRST202', message: 'function missing from schema cache' } }
    : { data: { legacy: true }, error: null }
});
assert.equal(legacyLoad.protocolVersion, 2, 'A project without the v3 migration must be detected as read-only legacy cloud.');
assert.deepEqual(legacyLoad.data, { legacy: true });
const failedLoad = await loadCloudLearningDataResult({
  rpc: async () => ({ data: null, error: new Error('offline') })
});
assert.equal(failedLoad.data, null);
assert.match(failedLoad.error.message, /offline/);

function createRevisionedServer(initialPayload = {}) {
  let revision = 0;
  let payload = initialPayload;
  const operations = new Map();
  return {
    get state() { return { revision, payload, operationCount: operations.size }; },
    client: {
      async rpc(name, args = {}) {
        if (name === 'get_learning_data_v3') {
          return { data: { protocolVersion: 3, payload, revision, serverUpdatedAt: `revision-${revision}` }, error: null };
        }
        if (name !== 'save_learning_data_v3') return { data: null, error: new Error(`unexpected_rpc:${name}`) };
        const existing = operations.get(args.operation_id);
        if (existing) return { data: { ...existing, duplicate: true, payload, revision }, error: null };
        if (args.expected_revision !== revision) {
          return { data: { ok: false, conflict: true, duplicate: false, payload, revision }, error: null };
        }
        revision += 1;
        payload = args.payload;
        const result = { ok: true, conflict: false, duplicate: false, payload, revision };
        operations.set(args.operation_id, result);
        return { data: result, error: null };
      }
    }
  };
}

const concurrentProfile = { id: 'child-concurrent', name: 'Fayyadh', year: 'Tahun 2' };
const concurrentPayload = (historyId, xp, deviceId) => ({
  [CLOUD_CHILD_STATE_KEY]: childState([concurrentProfile], concurrentProfile.id),
  [`${CHILD_SNAPSHOT_PREFIX}${concurrentProfile.id}`]: JSON.stringify({
    __childSnapshotChildId: concurrentProfile.id,
    __childSnapshotAccountId: 'account-1',
    __childSnapshotCapturedAt: Date.now(),
    jannati_v151_profile: JSON.stringify({ xp, history: [{ id: historyId }] })
  }),
  jannati_v151_profile: JSON.stringify({ xp, history: [{ id: historyId }], deviceId })
});
const revisionedServer = createRevisionedServer();
const sharedEnvelope = await loadCloudLearningDataResult(revisionedServer.client);
const [desktopSync, mobileSync] = await Promise.all([
  syncRevisionedCloudLearning(revisionedServer.client, concurrentPayload('desktop-answer', 20, 'desktop'), {
    cloudEnvelope: sharedEnvelope,
    dirtyChildIds: [concurrentProfile.id],
    localActiveChildId: concurrentProfile.id,
    deviceId: 'desktop'
  }),
  syncRevisionedCloudLearning(revisionedServer.client, concurrentPayload('mobile-answer', 30, 'mobile'), {
    cloudEnvelope: sharedEnvelope,
    dirtyChildIds: [concurrentProfile.id],
    localActiveChildId: concurrentProfile.id,
    deviceId: 'mobile'
  })
]);
assert.equal(desktopSync.ok, true);
assert.equal(mobileSync.ok, true);
assert.ok(desktopSync.conflictCount + mobileSync.conflictCount >= 1, 'One same-revision writer must conflict and retry.');
const concurrentSnapshot = JSON.parse(revisionedServer.state.payload[`${CHILD_SNAPSHOT_PREFIX}${concurrentProfile.id}`]);
const concurrentLearning = JSON.parse(concurrentSnapshot.jannati_v151_profile);
assert.deepEqual(concurrentLearning.history.map(item => item.id).sort(), ['desktop-answer', 'mobile-answer'], 'Conflict retry must retain evidence from both devices.');
assert.equal(concurrentLearning.xp, 30, 'Concurrent numeric projections must use a conservative maximum instead of double counting.');

const idempotentOperationId = '11111111-1111-4111-8111-111111111111';
const idempotentRevision = revisionedServer.state.revision;
const idempotentRequest = {
  payload: revisionedServer.state.payload,
  expectedRevision: idempotentRevision,
  operationId: idempotentOperationId,
  deviceId: 'desktop',
  dirtyChildIds: [concurrentProfile.id]
};
const firstIdempotent = await saveRevisionedCloudLearningData(revisionedServer.client, idempotentRequest);
const repeatedIdempotent = await saveRevisionedCloudLearningData(revisionedServer.client, idempotentRequest);
assert.equal(firstIdempotent.ok, true);
assert.equal(repeatedIdempotent.duplicate, true, 'Repeating an operation ID must not create another revision.');
assert.equal(revisionedServer.state.revision, idempotentRevision + 1);

let legacyWriteCalls = 0;
const legacyOnlyClient = {
  rpc: async name => {
    if (name === 'get_learning_data_v3') return { data: null, error: { code: 'PGRST202', message: 'missing' } };
    if (name === 'get_learning_data') return { data: {}, error: null };
    legacyWriteCalls += 1;
    return { data: null, error: null };
  }
};
const blockedLegacySync = await syncRevisionedCloudLearning(legacyOnlyClient, concurrentPayload('blocked', 1, 'desktop'), {
  dirtyChildIds: [concurrentProfile.id],
  localActiveChildId: concurrentProfile.id,
  deviceId: 'desktop'
});
assert.equal(blockedLegacySync.ok, false);
assert.match(blockedLegacySync.error.message, /migration_required/);
assert.equal(legacyWriteCalls, 0, 'A v3 client must never fall back to the blind legacy write RPC.');

const appSource = fs.readFileSync('src/App.jsx', 'utf8');
const dashboardSource = fs.readFileSync('src/dashboard/HomeDashboard.jsx', 'utf8');
const legacySqlSource = fs.readFileSync('supabase/learning_data.sql', 'utf8');
const integritySqlSource = fs.readFileSync('supabase/migrations/20260823090000_learning_data_integrity_v3.sql', 'utf8');
assert.match(appSource, /cloudHydratedAccountId !== accountUser\.id/, 'Autosave must wait for account cloud hydration.');
assert.match(appSource, /captureChildSnapshot\(activeChildId, \{ force: true \}\)/, 'Cloud saves must refresh the active child snapshot.');
assert.match(appSource, /hasPendingCloudMutation\(accountUser\.id\)/, 'Unsent learning changes must survive reload and reconnect.');
assert.match(appSource, /submittedMutationVersions[\s\S]{0,2500}childMutationVersionRef\.current\.get\(childId\)[\s\S]{0,350}dirtyChildIdsRef\.current\.delete\(childId\)/, 'A newer mutation for the same child must remain pending when an older in-flight save completes.');
assert.match(appSource, /cloudResult\.error[\s\S]{0,250}pendingOfflineCloudSaveRef\.current = hasPendingLocalData[\s\S]{0,150}if \(!hasPendingLocalData\) skipNextCloudSaveRef\.current = true/, 'A failed initial cloud pull must not turn unchanged device data into an upload.');
assert.match(appSource, /shouldBootstrapCloud[\s\S]{0,1800}dirtyChildIdsRef\.current\.add\(childState\.activeId\)[\s\S]{0,500}skipNextCloudSaveRef\.current = true/, 'Account hydration must suppress generic autosave and explicitly bootstrap only a genuinely empty v3 cloud.');
assert.match(appSource, /recoverOrphanedCloudOutbox\(localLearningData, cloudLearningData[\s\S]{0,800}setPendingCloudMutation\(user\.id, false\)/, 'A stale pending marker must either recover meaningful local learning or stop blocking a richer cloud pull.');
assert.match(appSource, /recoverMonotonicCloudGap\(localLearningData, cloudLearningData[\s\S]{0,700}dirtyChildIdsRef\.current\.add\(childId\)/, 'Initial hydration must recover richer same-child learning before applying a lower cloud projection.');
assert.match(appSource, /recoverMonotonicCloudGap\(localLearningData, cloudResult\.data[\s\S]{0,1000}queueCloudLearningSave\(\{ markMutation: false \}\)/, 'Polling must upload a richer same-child projection instead of overwriting it with a lower revision.');
assert.match(appSource, /normalizeActiveLearningProjection\(cloudData, active\.id\)[\s\S]{0,200}restoreAccountSnapshot\(normalizedCloudData, accountScopeId\)/, 'Cloud hydration must normalize the account projection and active child snapshot before storage replacement.');
assert.match(appSource, /function scheduleCloudLearningSave[\s\S]{0,300}markLocalLearningMutation\(childId\)[\s\S]{0,300}cloudSaveTimerRef\.current = window\.setTimeout/, 'Learning changes must be marked pending before the persistent debounce timer starts.');
assert.match(appSource, /autoSave\(questionIndex, nextSession\);\s*scheduleCloudLearningSave\(\{ delay: 500 \}\)/, 'Every checked answer must explicitly schedule an account cloud save.');
const accountActivationSource = appSource.slice(
  appSource.indexOf('function activateAccountStorage'),
  appSource.indexOf('function getEmailRedirectUrl')
);
assert.match(accountActivationSource, /if \(currentId\) captureAccountSnapshot\(currentId\);\s*else captureGuestSnapshot\(\);/, 'Switching from Free mode must preserve a separate guest backup.');
assert.match(accountActivationSource, /if \(existingSnapshot && !restoreAccountSnapshot\(existingSnapshot, nextId\)\) clearAccountData\(\);\s*else if \(!existingSnapshot\) clearAccountData\(\);/, 'An authenticated account must restore only its own account-scoped snapshot and fail closed when restore cannot complete.');
assert.doesNotMatch(accountActivationSource, /mergeCloudLearningPayload|anonymousDirtyChildIds|reconcileChildIdentity/, 'Free learning must never be merged automatically into a different authenticated account.');
const accountSubmitSource = appSource.slice(
  appSource.indexOf('async function handleAccountSubmit'),
  appSource.indexOf('return <main className="app login-page"')
);
assert.doesNotMatch(accountSubmitSource, /onStart\(/, 'Successful Supabase authentication must wait for account hydration instead of creating a Free profile.');
assert.match(appSource, /const GUEST_SNAPSHOT_KEY = 'jannati_guest_snapshot_v1'/, 'Free mode must have a dedicated recoverable snapshot.');
assert.match(appSource, /function resumeGuestProfile[\s\S]{0,500}restoreAccountSnapshot\(snapshot, 'guest'\)/, 'A Free learner must be able to resume only the preserved guest profile.');
assert.match(appSource, /function exitLocalProfile[\s\S]{0,300}captureGuestSnapshot\(\)[\s\S]{0,200}clearAccountData\(\)/, 'Exiting Free mode must preserve learning before clearing the active surface.');
assert.match(appSource, /captureGuestSnapshot\(\);\s*localStorage\.setItem\(ONBOARDING_KEY, 'done'\)/, 'A newly created Free profile must reopen on the same learning dashboard after the browser is closed.');
assert.match(appSource, /writePendingDirtyChildIds\(accountId, dirtyChildIdsRef\.current\)/, 'Offline dirty child IDs must be persisted per account.');
assert.doesNotMatch(appSource, /if \(activeChildId\) dirtyChildIdsRef\.current\.add\(activeChildId\)/, 'A stale pending flag must not mark an untouched account snapshot as current learning.');
assert.match(appSource, /if \(!accountUser\?\.id\)[\s\S]{0,200}captureChildSnapshot\(currentChildId, \{ force: true \}\)[\s\S]{0,100}setShowAccountLogin\(true\)/, 'Opening account login from local mode must preserve the current learning snapshot.');
assert.match(appSource, /window\.setInterval\(pullLatestCloudData, 5000\)/, 'Visible devices must check for newer cloud learning promptly.');
assert.match(appSource, /\.channel\(`learning-revision:\$\{accountUser\.id\}`\)[\s\S]{0,500}postgres_changes[\s\S]{0,300}pullLatestCloudData/, 'Realtime revision changes must trigger an immediate safe pull.');
assert.match(appSource, /window\.addEventListener\('pagehide', persistBeforePageExit\)/, 'Page exit must persist the account-scoped recovery snapshot and pending outbox.');
assert.match(appSource, /window\.addEventListener\('storage', receiveSameOriginOutbox\)/, 'Same-origin tabs must share pending outbox notifications without force-pushing stale state.');
assert.match(appSource, /Disimpan pada peranti ini sahaja\. Log masuk akaun yang sama/, 'Anonymous quiz storage must not be described as cross-device cloud sync.');
assert.match(dashboardSource, /Cloud tidak aktif/, 'The dashboard must disclose when cloud sync is inactive.');
assert.match(dashboardSource, /Log masuk untuk Sync/, 'The dashboard must give local-only users a clear cloud sign-in action.');
assert.match(dashboardSource, /Keluar Free/, 'The dashboard must provide an explicit exit action for a local Free profile.');
assert.match(appSource, /setCloudSyncInfo\(\{[\s\S]{0,120}revision: Number\(syncResult\.revision\)/, 'An acknowledged upload must expose its exact server revision.');
assert.match(appSource, /!cloudResult\.error && Number\(cloudResult\.protocolVersion\) < CLOUD_SYNC_PROTOCOL_VERSION/, 'A network or RPC error must not be mislabeled as a migration problem.');
assert.match(dashboardSource, /Revision server:/, 'The dashboard must show a comparable server revision for desktop/mobile verification.');
assert.match(appSource, /reloadCloudLearningState\(restoredChildId\)/, 'A cloud pull must refresh active profile state in React.');
assert.match(appSource, /preserveLocalChildIds = dirtyChildIds\.filter[\s\S]{0,500}applyMergedCloudMetadata\(payload, activeChildId, preserveLocalChildIds\)[\s\S]{0,350}reloadCloudLearningState\(resolvedActiveChildId\)/, 'A server-acknowledged merge must hydrate the active device unless a newer local mutation is still pending.');
const selectChildSource = appSource.slice(
  appSource.indexOf('function handleSelectChild'),
  appSource.indexOf('function handleCreateChild')
);
assert.match(selectChildSource, /skipNextCloudSaveRef\.current = true[\s\S]{0,120}reloadActiveChildState\(target\)/, 'Selecting a child must suppress the generic state autosave.');
assert.doesNotMatch(selectChildSource, /markLocalLearningMutation|queueCloudLearningSave/, 'Selecting a child is device-local and must not create a cloud mutation.');
assert.match(appSource, /activeChildHasNewerMutation[\s\S]{0,500}restoreChildSnapshot\(mergedActiveSnapshot, activeChildId\)/, 'An acknowledged active profile must restore its correctly scoped merged snapshot unless a newer mutation exists.');
assert.match(appSource, /function backupChildBeforeDeletion[\s\S]{0,500}reason: 'manual-delete'/, 'Manual child deletion must create a recoverable hidden backup first.');
const deleteChildSource = appSource.slice(
  appSource.indexOf('function handleDeleteChild'),
  appSource.indexOf('function resetSignedOutAccountState')
);
assert.match(deleteChildSource, /Pemadaman profil[\s\S]{0,200}dinyahaktifkan sementara[\s\S]{0,200}return false/, 'Client-side child deletion must fail closed until server archive and undo are available.');
assert.doesNotMatch(deleteChildSource, /removeItem|markLocalLearningMutation|queueCloudLearningSave/, 'A disabled deletion path must not mutate or sync learning data.');
assert.match(appSource, /!key\.startsWith\(CHILD_MERGED_BACKUP_PREFIX\)/, 'A merged-profile recovery backup must never be copied recursively into a child snapshot.');
assert.match(appSource, /const duplicateProfile = existingProfiles\.find[\s\S]{0,450}Profil \$\{duplicateProfile\.name\}[\s\S]{0,150}return true;/, 'Creating the same child name and year must reuse the existing profile.');
assert.match(appSource, /__childSnapshotAccountId: getActiveStorageScopeId\(\)/, 'Every new child snapshot must carry an account/guest scope marker.');
assert.match(appSource, /snapshotAccountId && expectedAccountId && snapshotAccountId !== String\(expectedAccountId\)/, 'A mismatched account snapshot must be rejected before active storage is cleared.');
assert.match(appSource, /function restoreAccountSnapshot[\s\S]{0,450}const previousSnapshot = readLocalAccountData\(\)[\s\S]{0,800}Object\.entries\(previousSnapshot\)/, 'A partial account restore must roll back to the previous active snapshot.');
assert.match(appSource, /function restoreChildSnapshot[\s\S]{0,650}const previousSnapshot = readChildScopedData\(\)[\s\S]{0,1400}Object\.entries\(previousSnapshot\)/, 'A partial child restore must roll back instead of mixing two learner profiles.');
assert.match(appSource, /Import terus ke akaun dinyahaktifkan sementara/, 'Raw imports must not directly overwrite an authenticated cloud account.');
assert.match(appSource, /Reset akaun dinyahaktifkan/, 'Authenticated profile reset must fail closed.');
assert.match(appSource, /hasUnacknowledgedChanges[\s\S]{0,600}queueCloudLearningSave\(\{ markMutation: false \}\)[\s\S]{0,500}Log keluar juga/, 'Logout must attempt pending sync and warn before leaving unacknowledged data.');
assert.match(dashboardSource, /Profil dilindungi · tidak boleh dipadam/, 'The child switcher must disclose that destructive deletion is disabled.');
assert.match(integritySqlSource, /learning_revision bigint not null default 0/, 'The server must maintain a revision for optimistic concurrency.');
assert.match(integritySqlSource, /for update;/, 'Revision checks and writes must lock the account row atomically.');
assert.match(integritySqlSource, /current_revision <> expected_revision/, 'Stale device writes must return a conflict instead of replacing cloud data.');
assert.match(integritySqlSource, /learning_data_backups[\s\S]{0,3000}'pre-write'/, 'Every accepted replacement must preserve a pre-write server backup.');
assert.match(integritySqlSource, /revoke all on function public\.save_learning_data\(jsonb\) from public, anon, authenticated/, 'The migration must revoke the legacy blind-write endpoint from browsers.');
assert.doesNotMatch(legacySqlSource, /grant execute on function public\.save_learning_data\(jsonb\) to authenticated/, 'Manual schema setup must not re-enable the legacy browser write.');
assert.match(integritySqlSource, /archive_learner_profile_v1/, 'Future deletion must use revisioned server-side archive, not hard delete.');
assert.match(integritySqlSource, /alter publication supabase_realtime add table public\.profiles/, 'Account revision updates must be published for cross-device Realtime notification.');

assert.equal(CLOUD_SYNC_PROTOCOL_VERSION, 3);
console.log('Learning sync regression: PASS (CAS conflicts, idempotency, account scoping, safe logout, deletion containment)');
