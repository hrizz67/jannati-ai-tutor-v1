import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  RESUME_KEY,
  RESUME_PENDING_TOMBSTONES_KEY,
  RESUME_SLOTS_KEY,
  RESUME_TOMBSTONES_KEY,
  acknowledgeResumeTombstones,
  clearResume,
  compactStoredResumes,
  loadResume,
  saveResume
} from '../../src/utils/resumeStorage.js';
import {
  CHILD_MERGED_BACKUP_PREFIX,
  CHILD_ORIGINAL_SNAPSHOT_PREFIX,
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  saveRevisionedCloudLearningData,
  syncRevisionedCloudLearning
} from '../../src/services/learningSync.js';
import { compactCloudLearningPayload } from '../../src/services/cloudPayloadCompaction.js';

const MIB = 1024 * 1024;
const MAX_RESUME_BYTES = 512 * 1024;
const MAX_RESUME_SLOTS = 12;
const MAX_CLOUD_BYTES = 7 * MIB;
const utf8Bytes = value => new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value)).byteLength;

class MemoryStorage {
  constructor(initial = {}) { this.values = new Map(Object.entries(initial)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

function oldStaticResume(index, childId = 'child-a') {
  const updatedAt = new Date(Date.UTC(2026, 7, index + 1)).toISOString();
  return {
    version: 1,
    mode: 'quiz',
    accountId: 'account-a',
    childId,
    studentId: childId,
    subjectId: 'math',
    topicId: `topic-${index}`,
    questions: [{ id: `MATH-${index}`, q: `Soalan ${index}`, answer: String(index), debug: 'x'.repeat(190_000) }],
    questionIds: [`MATH-${index}`],
    currentIndex: 0,
    answers: [{ questionId: `MATH-${index - 1}`, correct: true }],
    metadata: { displayTitle: `Topik ${index}`, diversityDebug: ['x'.repeat(2_000)] },
    session: { answers: [{ questionId: `MATH-${index - 1}`, correct: true }], questions: ['duplicate'] },
    state: { answer: '', session: { questions: ['duplicate'] }, metadata: { duplicate: true } },
    startedAt: updatedAt,
    updatedAt
  };
}

const historicalSlots = Object.fromEntries(Array.from({ length: 18 }, (_, index) => [
  `child-a::quiz::math::topic-${index}`,
  oldStaticResume(index)
]));
const historicalRaw = JSON.stringify(historicalSlots);
assert.ok(utf8Bytes(historicalRaw) > 3.2 * MIB && utf8Bytes(historicalRaw) < 3.5 * MIB, 'Fixture mesti meniru resume_slots produksi kira-kira 3.3 MiB.');

const storage = new MemoryStorage({
  [RESUME_SLOTS_KEY]: historicalRaw,
  [RESUME_KEY]: JSON.stringify(oldStaticResume(17))
});
loadResume({ accountId: 'account-a', childId: 'child-a' }, storage);
await compactStoredResumes(storage);
const newest = loadResume({ accountId: 'account-a', childId: 'child-a' }, storage);
const compactRaw = storage.getItem(RESUME_SLOTS_KEY);
const compactSlots = JSON.parse(compactRaw);
assert.equal(newest?.topicId, 'topic-17', 'Sesi semasa/terbaharu mesti kekal selepas migrasi.');
assert.ok(utf8Bytes(compactRaw) <= MAX_RESUME_BYTES, 'Resume slots mesti dibatasi kepada 512 KiB.');
assert.ok(Object.keys(compactSlots).length <= MAX_RESUME_SLOTS, 'Bilangan resume slots mesti dibatasi.');
assert.equal(loadResume({ childId: 'child-a', topicId: 'topic-0' }, storage), null, 'Slot paling lama mesti dibuang dahulu secara deterministik.');
assert.deepEqual(compactSlots['child-a::quiz::math::topic-17'].questionIds, ['MATH-17']);
assert.equal(compactSlots['child-a::quiz::math::topic-17'].questions, undefined, 'Soalan bank statik mesti disimpan sebagai ID sahaja.');
assert.equal(compactSlots['child-a::quiz::math::topic-17'].metadata.diversityDebug, undefined, 'Debug kepelbagaian bukan state resume kanonik.');
const compactAfterMigration = storage.getItem(RESUME_SLOTS_KEY);
loadResume({ childId: 'child-a' }, storage);
assert.equal(storage.getItem(RESUME_SLOTS_KEY), compactAfterMigration, 'Pembacaan berulang mesti idempotent dan tidak mengubah representasi storan.');

const restoredStatic = loadResume({ childId: 'child-a', topicId: 'topic-17' }, storage);
const staticBank = [{ id: 'MATH-17', q: 'Berapakah 17 + 1?', answer: '18', hint: 'Tambah satu.' }];
const bankById = new Map(staticBank.map(question => [question.id, question]));
const rehydrated = restoredStatic.questions.map(saved => bankById.get(saved.id) || saved);
assert.equal(rehydrated[0].q, staticBank[0].q, 'Resume statik mesti dipulihkan tepat melalui ID bank soalan semasa.');
assert.equal(restoredStatic.session.answers[0].questionId, 'MATH-16', 'Sejarah jawapan mesti dihidrat semula tanpa salinan bersiri berganda.');

const adaptive = {
  ...oldStaticResume(30, 'child-b'),
  mode: 'adaptive-practice',
  topicId: 'adaptive-generated',
  questions: [{ id: 'GEN-1', q: 'Ali ada 5 epal dan menerima 3 lagi. Berapa?', answer: '8', options: ['7', '8', '9'] }],
  questionIds: ['GEN-1'],
  state: { answer: '8', feedback: { status: 'correct' } },
  session: { answers: [{ questionId: 'GEN-1', answer: '8', correct: true }], requestedQuestions: 10 }
};
saveResume(adaptive, storage, adaptive);
await compactStoredResumes(storage);
const restoredAdaptive = loadResume({ childId: 'child-b', mode: 'adaptive-practice' }, storage);
assert.equal(restoredAdaptive.questions[0].q, adaptive.questions[0].q, 'Soalan adaptif/janaan mesti mengekalkan stem minimum.');
assert.equal(restoredAdaptive.questions[0].answer, '8', 'Soalan adaptif/janaan mesti mengekalkan jawapan kanonik.');
assert.equal(restoredAdaptive.state.feedback.status, 'correct', 'State semakan mesti menghalang XP berganda selepas resume.');
assert.equal(loadResume({ childId: 'child-a', mode: 'adaptive-practice' }, storage), null, 'Resume anak lain tidak boleh bocor.');
saveResume({
  ...adaptive,
  childId: 'child-c', studentId: 'child-c', topicId: 'pathological',
  questions: [{ id: 'GEN-HUGE', q: 'q'.repeat(220_000), answer: '1' }],
  questionIds: ['GEN-HUGE'],
  updatedAt: '2026-09-30T00:00:00.000Z'
}, storage);
await compactStoredResumes(storage);
assert.equal(loadResume({ childId: 'child-c', topicId: 'pathological' }, storage), null, 'Slot tunggal patologikal melebihi 192 KiB mesti ditolak tanpa memadam progress.');

const childProfiles = [{ id: 'child-a', name: 'Aisyah', year: 'Tahun 2' }, { id: 'child-b', name: 'Bilal', year: 'Tahun 2' }];
const deletedChildren = { 'child-deleted': 1_788_000_000_000 };
const archivedChildren = { 'child-archived': { archivedAt: 1_788_000_000_001, profile: { id: 'child-archived', name: 'Hana' } } };
const canonicalProfile = {
  accountId: 'account-a', childId: 'child-a', studentId: 'child-a', name: 'Aisyah', xp: 321,
  totalQuestions: 48, correctQuestions: 39,
  progress: { math_tambah: { best: 95, attempts: 4, mastery: 88 } },
  history: [{ id: 'session-canonical', score: 95 }]
};
const canonicalMemory = { xp: 321, mastery: { math_tambah: 88 }, notes: 'm'.repeat(1_150_000) };
const childState = JSON.stringify({ version: 3, profiles: childProfiles, activeChildId: 'child-a', deletedChildren, archivedChildren });
const localPayload = {
  [CLOUD_CHILD_STATE_KEY]: childState,
  jannati_child_profiles: JSON.stringify(childProfiles),
  jannati_active_child_id: 'child-a',
  jannati_deleted_child_profiles: JSON.stringify(deletedChildren),
  jannati_archived_child_profiles: JSON.stringify(archivedChildren),
  jannati_v151_profile: JSON.stringify(canonicalProfile),
  jannati_v151_ai_memory: JSON.stringify(canonicalMemory),
  [RESUME_SLOTS_KEY]: historicalRaw,
  [RESUME_KEY]: JSON.stringify(oldStaticResume(17))
};
assert.ok(utf8Bytes(localPayload) > 4.3 * MIB && utf8Bytes(localPayload) < 4.8 * MIB, 'Sumber tempatan mesti meniru diagnostik produksi kira-kira 4.5 MiB.');

const completedScope = 'child-a::quiz::math::topic-17';
const completionStorage = new MemoryStorage();
saveResume(oldStaticResume(17), completionStorage, { accountId: 'account-a', childId: 'child-a' });
clearResume({ accountId: 'account-a', childId: 'child-a', mode: 'quiz', subjectId: 'math', topicId: 'topic-17' }, completionStorage);
const completedTombstones = completionStorage.getItem(RESUME_TOMBSTONES_KEY);
const completedPendingTombstones = completionStorage.getItem(RESUME_PENDING_TOMBSTONES_KEY);
assert.equal(loadResume({ accountId: 'account-a', childId: 'child-a', topicId: 'topic-17' }, completionStorage), null, 'Completion tempatan mesti membuang resume scope A.');
assert.equal(JSON.parse(completedTombstones || '{}')[completedScope]?.childId, 'child-a', 'clearResume mesti menulis tombstone account/child/scope yang eksplisit.');
assert.equal(JSON.parse(completedPendingTombstones || '{}')[completedScope]?.childId, 'child-a', 'clearResume mesti menulis niat padam pending mengikut account/child/scope.');
saveResume({ ...oldStaticResume(17), updatedAt: '2026-10-01T00:00:00.000Z' }, completionStorage, { accountId: 'account-a', childId: 'child-a' });
assert.equal(JSON.parse(completionStorage.getItem(RESUME_TOMBSTONES_KEY) || '{}')[completedScope], undefined, 'Resume baharu tempatan mesti memprun tombstone scope yang sama.');
assert.equal(JSON.parse(completionStorage.getItem(RESUME_PENDING_TOMBSTONES_KEY) || '{}')[completedScope], undefined, 'Resume baharu tempatan mesti membatalkan pending delete scope yang sama.');
const boundedTombstoneStorage = new MemoryStorage();
for (let index = 0; index < 70; index += 1) {
  clearResume({ accountId: 'account-a', childId: 'child-a', mode: 'quiz', subjectId: 'math', topicId: `offline-${index}` }, boundedTombstoneStorage);
}
assert.ok(Object.keys(JSON.parse(boundedTombstoneStorage.getItem(RESUME_TOMBSTONES_KEY) || '{}')).length <= 64, 'Tombstone resume mesti dibatasi.');
const pendingOfflineTombstones = JSON.parse(boundedTombstoneStorage.getItem(RESUME_PENDING_TOMBSTONES_KEY) || '{}');
assert.equal(Object.keys(pendingOfflineTombstones).length, 70, 'Lebih 64 clear offline mesti kekal dalam outbox pending tanpa pruning senyap.');
const previouslyPrunedScope = Object.keys(pendingOfflineTombstones).find(scope => (
  !Object.hasOwn(JSON.parse(boundedTombstoneStorage.getItem(RESUME_TOMBSTONES_KEY) || '{}'), scope)
));
assert.ok(previouslyPrunedScope, 'Fixture mesti memilih scope yang akan diprun oleh polisi tombstone 64 lama.');
const repeatedClearStorage = new MemoryStorage();
const repeatedClearTarget = { accountId: 'account-a', childId: 'child-a', mode: 'reading' };
clearResume(repeatedClearTarget, repeatedClearStorage);
const firstPendingClear = JSON.parse(repeatedClearStorage.getItem(RESUME_PENDING_TOMBSTONES_KEY) || '{}');
clearResume(repeatedClearTarget, repeatedClearStorage);
acknowledgeResumeTombstones(firstPendingClear, repeatedClearStorage, 'account-a');
assert.ok(JSON.parse(repeatedClearStorage.getItem(RESUME_PENDING_TOMBSTONES_KEY) || '{}')['child-a::reading'], 'Acknowledgement lama tidak boleh memadam clear baharu untuk scope yang sama.');
const completedLocalPayload = {
  ...Object.fromEntries(Object.entries(localPayload).filter(([key]) => ![RESUME_KEY, RESUME_SLOTS_KEY].includes(key))),
  [RESUME_TOMBSTONES_KEY]: completedTombstones
};
const syncCapture = async (local, cloud, responses = []) => {
  const sent = [];
  const result = await syncRevisionedCloudLearning({ rpc: async (_name, args) => {
    sent.push(args.payload);
    return responses.shift() || { data: { ok: true, revision: 30 }, error: null };
  } }, local, {
    accountId: 'account-a',
    localActiveChildId: 'child-a',
    dirtyChildIds: ['child-a'],
    cloudEnvelope: { data: cloud, revision: 20, protocolVersion: 3, serverUpdatedAt: '', error: null },
    transportMaxAttempts: 1,
    retryBaseDelayMs: 0
  });
  return { result, sent };
};

const staleCloudRoot = {
  ...completedLocalPayload,
  [RESUME_SLOTS_KEY]: JSON.stringify({ [completedScope]: oldStaticResume(17) })
};
delete staleCloudRoot[RESUME_TOMBSTONES_KEY];
const staleRootSync = await syncCapture(completedLocalPayload, staleCloudRoot);
assert.equal(JSON.parse(staleRootSync.sent.at(-1)?.[RESUME_SLOTS_KEY] || '{}')[completedScope], undefined, 'Explicit completion tempatan mesti membuang resume root cloud yang stale.');
assert.equal(JSON.parse(staleRootSync.sent.at(-1).jannati_v151_profile).xp, canonicalProfile.xp, 'Clear resume tidak boleh mengubah XP kanonik.');
assert.deepEqual(JSON.parse(staleRootSync.sent.at(-1).jannati_v151_profile).progress, canonicalProfile.progress, 'Clear resume tidak boleh mengubah progress/mastery kanonik.');
assert.deepEqual(JSON.parse(staleRootSync.sent.at(-1).jannati_v151_profile).history, canonicalProfile.history, 'Clear resume tidak boleh mengubah sejarah pembelajaran.');
assert.deepEqual(JSON.parse(staleRootSync.sent.at(-1).jannati_v151_ai_memory), canonicalMemory, 'Clear resume tidak boleh mengubah memori AI.');

const staleLegacyCloudRoot = {
  ...staleCloudRoot,
  [RESUME_KEY]: JSON.stringify(oldStaticResume(17))
};
delete staleLegacyCloudRoot[RESUME_SLOTS_KEY];
const staleLegacySync = await syncCapture(completedLocalPayload, staleLegacyCloudRoot);
assert.equal(JSON.parse(staleLegacySync.sent.at(-1)?.[RESUME_SLOTS_KEY] || '{}')[completedScope], undefined, 'Explicit completion tempatan mesti membuang legacy root resume cloud yang stale.');

const crossDeviceResume = {
  ...oldStaticResume(18, 'child-b'),
  topicId: 'cross-device-current',
  questionIds: ['CROSS-DEVICE-B'],
  questions: [{ id: 'CROSS-DEVICE-B', q: 'Soalan peranti B', answer: '18' }],
  updatedAt: '2026-09-13T01:00:00.000Z'
};
const crossDeviceScope = 'child-b::quiz::math::cross-device-current';
const offlineTopicId = previouslyPrunedScope.split('::').at(-1);
const stalePreviouslyPrunedResume = {
  ...oldStaticResume(1),
  topicId: offlineTopicId,
  questionIds: ['STALE-PRUNED'],
  questions: [{ id: 'STALE-PRUNED', q: 'Resume stale sebelum offline clear', answer: '1' }],
  updatedAt: '2026-01-01T00:00:00.000Z'
};
const offlineCloudPayload = {
  ...Object.fromEntries(Object.entries(completedLocalPayload).filter(([key]) => ![RESUME_SLOTS_KEY, RESUME_TOMBSTONES_KEY, RESUME_PENDING_TOMBSTONES_KEY].includes(key))),
  [RESUME_SLOTS_KEY]: JSON.stringify({
    [previouslyPrunedScope]: stalePreviouslyPrunedResume,
    [crossDeviceScope]: crossDeviceResume
  })
};
const offlineLocalPayload = {
  ...Object.fromEntries(Object.entries(completedLocalPayload).filter(([key]) => ![RESUME_TOMBSTONES_KEY, RESUME_PENDING_TOMBSTONES_KEY].includes(key))),
  [RESUME_TOMBSTONES_KEY]: boundedTombstoneStorage.getItem(RESUME_TOMBSTONES_KEY),
  [RESUME_PENDING_TOMBSTONES_KEY]: boundedTombstoneStorage.getItem(RESUME_PENDING_TOMBSTONES_KEY)
};

const failedStorage = new MemoryStorage(Object.fromEntries(boundedTombstoneStorage.values));
const failedRpcSync = await syncRevisionedCloudLearning({ rpc: async () => ({
  data: null,
  error: { code: 'PGRST000', status: 503, message: 'network unavailable' }
}) }, offlineLocalPayload, {
  accountId: 'account-a', localActiveChildId: 'child-a', dirtyChildIds: ['child-a'],
  cloudEnvelope: { data: offlineCloudPayload, revision: 20, protocolVersion: 3, serverUpdatedAt: '', error: null },
  transportMaxAttempts: 1, retryBaseDelayMs: 0
});
assert.equal(failedRpcSync.ok, false, 'RPC gagal tidak boleh dianggap acknowledgement.');
assert.equal(failedRpcSync.acknowledgedResumeTombstones, undefined, 'RPC gagal tidak boleh mengembalikan tombstone yang diakui.');
assert.equal(Object.keys(JSON.parse(failedStorage.getItem(RESUME_PENDING_TOMBSTONES_KEY) || '{}')).length, 70, 'RPC gagal mesti mengekalkan semua pending delete.');

const conflictStorage = new MemoryStorage(Object.fromEntries(boundedTombstoneStorage.values));
const unresolvedConflictSync = await syncRevisionedCloudLearning({ rpc: async () => ({
  data: { ok: false, conflict: true, payload: offlineCloudPayload, revision: 21, serverUpdatedAt: '2026-09-13T01:01:00.000Z' },
  error: null
}) }, offlineLocalPayload, {
  accountId: 'account-a', localActiveChildId: 'child-a', dirtyChildIds: ['child-a'], maxAttempts: 1,
  cloudEnvelope: { data: offlineCloudPayload, revision: 20, protocolVersion: 3, serverUpdatedAt: '', error: null },
  transportMaxAttempts: 1, retryBaseDelayMs: 0
});
assert.equal(unresolvedConflictSync.ok, false, 'Konflik yang belum selesai tidak boleh dianggap acknowledgement.');
assert.equal(unresolvedConflictSync.acknowledgedResumeTombstones, undefined, 'Konflik tidak boleh mengakui pending delete sebelum retry berjaya.');
assert.equal(Object.keys(JSON.parse(conflictStorage.getItem(RESUME_PENDING_TOMBSTONES_KEY) || '{}')).length, 70, 'Konflik mesti mengekalkan semua pending delete.');

const offlineReconnectSync = await syncCapture(offlineLocalPayload, offlineCloudPayload);
const offlineReconnectSlots = JSON.parse(offlineReconnectSync.sent.at(-1)?.[RESUME_SLOTS_KEY] || '{}');
assert.equal(offlineReconnectSlots[previouslyPrunedScope], undefined, 'Stale cloud resume bagi pending tombstone melebihi had 64 tidak boleh hidup semula.');
assert.deepEqual(offlineReconnectSlots[crossDeviceScope]?.questionIds, ['CROSS-DEVICE-B'], 'Resume silang peranti yang tidak berkaitan mesti kekal semasa pending clears digunakan.');
assert.equal(offlineReconnectSync.sent.at(-1)?.[RESUME_PENDING_TOMBSTONES_KEY], undefined, 'Outbox pending setempat tidak boleh memasuki payload cloud.');
assert.ok(Object.keys(JSON.parse(offlineReconnectSync.sent.at(-1)?.[RESUME_TOMBSTONES_KEY] || '{}')).length <= 64, 'Payload cloud mesti mengekalkan had 64 tombstone.');
assert.equal(Object.keys(offlineReconnectSync.result.acknowledgedResumeTombstones || {}).length, 70, 'Save V4 berjaya mesti mengakui setiap pending delete yang digunakan dalam payload.');
const hasPendingAfterAck = acknowledgeResumeTombstones(
  offlineReconnectSync.result.acknowledgedResumeTombstones,
  boundedTombstoneStorage,
  'account-a'
);
assert.equal(hasPendingAfterAck, false, 'Acknowledgement berjaya mesti membenarkan outbox pending diprun.');
assert.equal(boundedTombstoneStorage.getItem(RESUME_PENDING_TOMBSTONES_KEY), null, 'Outbox mesti kosong selepas semua clear diakui.');

const acknowledgedLocalPayload = {
  ...Object.fromEntries(Object.entries(offlineLocalPayload).filter(([key]) => key !== RESUME_PENDING_TOMBSTONES_KEY)),
  [RESUME_TOMBSTONES_KEY]: boundedTombstoneStorage.getItem(RESUME_TOMBSTONES_KEY)
};
const repeatedOfflineSync = await syncCapture(acknowledgedLocalPayload, offlineReconnectSync.sent.at(-1));
const repeatedOfflineSlots = JSON.parse(repeatedOfflineSync.sent.at(-1)?.[RESUME_SLOTS_KEY] || '{}');
assert.equal(repeatedOfflineSlots[previouslyPrunedScope], undefined, 'Sync selepas acknowledgement mesti kekal idempotent tanpa resurrection.');
assert.deepEqual(repeatedOfflineSlots[crossDeviceScope]?.questionIds, ['CROSS-DEVICE-B'], 'Sync berulang mesti mengekalkan resume silang peranti.');

const unrelatedCrossDeviceSync = await syncCapture(
  Object.fromEntries(Object.entries(completedLocalPayload).filter(([key]) => key !== RESUME_TOMBSTONES_KEY)),
  { ...staleCloudRoot, [RESUME_SLOTS_KEY]: JSON.stringify({ [crossDeviceScope]: crossDeviceResume }) }
);
assert.deepEqual(JSON.parse(unrelatedCrossDeviceSync.sent.at(-1)?.[RESUME_SLOTS_KEY] || '{}')[crossDeviceScope]?.questionIds, ['CROSS-DEVICE-B'], 'Ketiadaan resume/tombstone tempatan tidak boleh memadam resume sah peranti lain.');

const restartedResume = {
  ...oldStaticResume(17),
  questionIds: ['RESTARTED-A'],
  questions: [{ id: 'RESTARTED-A', q: 'Sesi baharu A', answer: '17' }],
  updatedAt: '2026-10-01T00:00:00.000Z'
};
const restartedSync = await syncCapture({
  ...Object.fromEntries(Object.entries(completedLocalPayload).filter(([key]) => key !== RESUME_TOMBSTONES_KEY)),
  [RESUME_SLOTS_KEY]: JSON.stringify({ [completedScope]: restartedResume })
}, completedLocalPayload);
assert.deepEqual(JSON.parse(restartedSync.sent.at(-1)?.[RESUME_SLOTS_KEY] || '{}')[completedScope]?.questionIds, ['RESTARTED-A'], 'Resume baharu yang lebih lewat daripada tombstone mesti dikekalkan.');
assert.equal(JSON.parse(restartedSync.sent.at(-1)?.[RESUME_TOMBSTONES_KEY] || '{}')[completedScope], undefined, 'Tombstone mesti diprun apabila resume baharu menggantikannya.');

const conflictCloudPayload = {
  ...staleCloudRoot,
  [RESUME_SLOTS_KEY]: JSON.stringify({
    [completedScope]: oldStaticResume(17),
    [crossDeviceScope]: crossDeviceResume
  })
};
const conflictSync = await syncCapture(completedLocalPayload, staleCloudRoot, [{
  data: { ok: false, conflict: true, payload: conflictCloudPayload, revision: 21, serverUpdatedAt: '2026-09-13T01:01:00.000Z' },
  error: null
}]);
const conflictSlots = JSON.parse(conflictSync.sent.at(-1)?.[RESUME_SLOTS_KEY] || '{}');
assert.equal(conflictSlots[completedScope], undefined, 'Conflict retry mesti mengekalkan clear A.');
assert.deepEqual(conflictSlots[crossDeviceScope]?.questionIds, ['CROSS-DEVICE-B'], 'Conflict retry mesti mengekalkan resume B yang tidak berkaitan.');

const repeatedClearSync = await syncCapture(completedLocalPayload, conflictSync.sent.at(-1));
const repeatedSlots = JSON.parse(repeatedClearSync.sent.at(-1)?.[RESUME_SLOTS_KEY] || '{}');
assert.equal(repeatedSlots[completedScope], undefined, 'Clear A mesti kekal idempotent pada sync berulang.');
assert.deepEqual(repeatedSlots[crossDeviceScope]?.questionIds, ['CROSS-DEVICE-B'], 'Sync berulang tidak boleh mengubah resume B.');
assert.equal(JSON.parse(repeatedClearSync.sent.at(-1)?.[RESUME_TOMBSTONES_KEY] || '{}')[completedScope]?.childId, 'child-a', 'Tombstone scope A mesti kekal account/child scoped.');

const historicalChildSnapshot = JSON.stringify({
  __childSnapshotChildId: 'child-a',
  __childSnapshotAccountId: 'account-a',
  __childSnapshotCapturedAt: Date.UTC(2026, 7, 20),
  jannati_v151_profile: JSON.stringify(canonicalProfile),
  [RESUME_SLOTS_KEY]: historicalRaw,
  [RESUME_KEY]: JSON.stringify(oldStaticResume(16))
});
const cloudPayload = {
  [CLOUD_CHILD_STATE_KEY]: childState,
  [RESUME_KEY]: JSON.stringify({ ...oldStaticResume(40, 'foreign-child'), accountId: 'foreign-account' }),
  [`${CHILD_SNAPSHOT_PREFIX}child-a`]: historicalChildSnapshot,
  [`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}child-a`]: historicalChildSnapshot,
  [`${CHILD_MERGED_BACKUP_PREFIX}child-a`]: JSON.stringify({ reason: 'recovery', snapshot: historicalChildSnapshot, evidence: { xp: 321 } }),
  [`${CHILD_MERGED_BACKUP_PREFIX}invalid`]: 'recovery-data-that-is-not-json'
};
assert.ok(utf8Bytes({ ...localPayload, [`${CHILD_SNAPSHOT_PREFIX}child-a`]: historicalChildSnapshot }) > 8 * MIB, 'Salinan root + child sejarah mesti membuktikan bagaimana sumber 4.5 MiB melampaui 8 MiB.');

const nestedResumeSnapshot = JSON.stringify({
  __childSnapshotChildId: 'child-a',
  __childSnapshotAccountId: 'account-a',
  [RESUME_KEY]: JSON.stringify(oldStaticResume(5)),
  [RESUME_TOMBSTONES_KEY]: completedTombstones,
  [RESUME_PENDING_TOMBSTONES_KEY]: completedPendingTombstones
});
const nestedOnlyOutput = compactCloudLearningPayload({
  [`${CHILD_SNAPSHOT_PREFIX}child-a`]: nestedResumeSnapshot
}, [], { accountId: 'account-a', childId: 'child-a' });
assert.equal(nestedOnlyOutput[RESUME_SLOTS_KEY], undefined, 'Resume stale yang hanya wujud dalam child snapshot tidak boleh dipromosikan ke root.');
assert.equal(nestedOnlyOutput[RESUME_TOMBSTONES_KEY], undefined, 'Tombstone nested tidak boleh dipromosikan ke root.');
assert.equal(JSON.parse(nestedOnlyOutput[`${CHILD_SNAPSHOT_PREFIX}child-a`])[RESUME_KEY], undefined, 'Resume stale mesti dibuang daripada child snapshot.');
assert.equal(JSON.parse(nestedOnlyOutput[`${CHILD_SNAPSHOT_PREFIX}child-a`])[RESUME_TOMBSTONES_KEY], undefined, 'Metadata deletion tidak boleh memasuki child learning snapshot.');
assert.equal(JSON.parse(nestedOnlyOutput[`${CHILD_SNAPSHOT_PREFIX}child-a`])[RESUME_PENDING_TOMBSTONES_KEY], undefined, 'Outbox deletion pending tidak boleh memasuki child learning snapshot.');

const completedResumeOutput = compactCloudLearningPayload({
  [`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}child-a`]: nestedResumeSnapshot,
  [`${CHILD_MERGED_BACKUP_PREFIX}child-a`]: JSON.stringify({
    reason: 'completed-resume-recovery',
    snapshot: nestedResumeSnapshot,
    evidence: { xp: 321 }
  })
}, [], { accountId: 'account-a', childId: 'child-a' });
assert.equal(completedResumeOutput[RESUME_SLOTS_KEY], undefined, 'Resume yang telah dibersihkan selepas completion tidak boleh dihidupkan semula daripada recovery.');
assert.deepEqual(JSON.parse(completedResumeOutput[`${CHILD_MERGED_BACKUP_PREFIX}child-a`]).evidence, { xp: 321 }, 'Bukti recovery bukan resume mesti dikekalkan.');

const rootCurrentResume = {
  ...oldStaticResume(6),
  topicId: 'root-current',
  questions: [{ id: 'ROOT-CURRENT', q: 'Soalan semasa', answer: '6' }],
  questionIds: ['ROOT-CURRENT'],
  updatedAt: '2026-08-06T00:00:00.000Z'
};
const nestedNewerResume = {
  ...rootCurrentResume,
  questions: [{ id: 'NESTED-STALE', q: 'Soalan stale', answer: '6' }],
  questionIds: ['NESTED-STALE'],
  updatedAt: '2026-09-30T00:00:00.000Z'
};
const rootScope = 'child-a::quiz::math::root-current';
const rootPrecedenceOutput = compactCloudLearningPayload({
  [RESUME_SLOTS_KEY]: JSON.stringify({ [rootScope]: rootCurrentResume }),
  [`${CHILD_SNAPSHOT_PREFIX}child-a`]: JSON.stringify({
    __childSnapshotChildId: 'child-a',
    __childSnapshotAccountId: 'account-a',
    [RESUME_SLOTS_KEY]: JSON.stringify({ [rootScope]: nestedNewerResume })
  })
}, [], { accountId: 'account-a', childId: 'child-a' });
assert.deepEqual(JSON.parse(rootPrecedenceOutput[RESUME_SLOTS_KEY])[rootScope].questionIds, ['ROOT-CURRENT'], 'Resume root semasa mesti mengatasi salinan nested walaupun nested mempunyai updatedAt lebih baharu.');

const legitimateRootOutput = compactCloudLearningPayload({
  [RESUME_KEY]: JSON.stringify(rootCurrentResume),
  [`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}child-a`]: JSON.stringify({ [RESUME_KEY]: JSON.stringify(rootCurrentResume) })
}, [], { accountId: 'account-a', childId: 'child-a' });
const legitimateRootSlots = JSON.parse(legitimateRootOutput[RESUME_SLOTS_KEY]);
assert.equal(Object.keys(legitimateRootSlots).length, 1, 'Resume root yang sah mesti kekal tepat sekali.');
assert.ok(utf8Bytes(legitimateRootOutput[RESUME_SLOTS_KEY]) <= MAX_RESUME_BYTES, 'Resume root yang sah mesti kekal dibatasi.');
assert.doesNotMatch(legitimateRootOutput[`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}child-a`], /jannati_v151_resume/, 'Salinan nested resume root mesti dibuang.');

const foreignTombstoneOutput = compactCloudLearningPayload({
  [RESUME_SLOTS_KEY]: JSON.stringify({ [rootScope]: rootCurrentResume }),
  [RESUME_TOMBSTONES_KEY]: JSON.stringify({
    [rootScope]: { accountId: 'foreign-account', childId: 'child-a', clearedAt: '2026-12-01T00:00:00.000Z' }
  })
}, [], { accountId: 'account-a', childId: 'child-a' });
assert.deepEqual(JSON.parse(foreignTombstoneOutput[RESUME_SLOTS_KEY])[rootScope].questionIds, ['ROOT-CURRENT'], 'Tombstone akaun lain tidak boleh memadam resume akaun semasa.');
assert.equal(foreignTombstoneOutput[RESUME_TOMBSTONES_KEY], undefined, 'Tombstone akaun lain tidak boleh dibawa ke payload semasa.');

const excessiveTombstones = Object.fromEntries(Array.from({ length: 70 }, (_, index) => [
  `child-${index}::reading`,
  { accountId: 'account-a', childId: `child-${index}`, clearedAt: new Date(Date.UTC(2026, 8, 1, 0, index)).toISOString() }
]));
const boundedCloudTombstones = compactCloudLearningPayload({
  [RESUME_TOMBSTONES_KEY]: JSON.stringify(excessiveTombstones)
}, [], { accountId: 'account-a' });
assert.ok(Object.keys(JSON.parse(boundedCloudTombstones[RESUME_TOMBSTONES_KEY])).length <= 64, 'Tombstone cloud mesti dibatasi secara deterministik.');

let saveCalls = 0;
let outgoingPayload = null;
const client = { rpc: async (name, args) => {
  assert.equal(name, 'save_learning_data_v4');
  saveCalls += 1;
  outgoingPayload = args.payload;
  return { data: { ok: true, revision: 11, unchanged: false, conflict: false }, error: null };
} };
const syncResult = await syncRevisionedCloudLearning(client, localPayload, {
  accountId: 'account-a', localActiveChildId: 'child-a', dirtyChildIds: ['child-a'], deviceId: 'test-device',
  cloudEnvelope: { data: cloudPayload, revision: 10, protocolVersion: 3, serverUpdatedAt: '', error: null },
  transportMaxAttempts: 3, retryBaseDelayMs: 0
});
assert.equal(syncResult.ok, true, 'Payload produksi sintetik mesti berjaya disediakan untuk V4.');
assert.equal(saveCalls, 1, 'Save normal mesti membuat satu V4 tanpa retry tersembunyi.');
assert.ok(utf8Bytes(outgoingPayload) < MAX_CLOUD_BYTES, 'Payload selepas compaction mesti di bawah ambang keselamatan 7 MiB.');
assert.ok(utf8Bytes(outgoingPayload[RESUME_SLOTS_KEY]) <= MAX_RESUME_BYTES, 'Cloud mesti menerima resume account-level yang dibatasi.');
assert.ok(Object.values(JSON.parse(outgoingPayload[RESUME_SLOTS_KEY])).every(item => item.accountId === 'account-a'), 'Resume akaun lain tidak boleh memasuki payload semasa.');
assert.equal(outgoingPayload[`${CHILD_MERGED_BACKUP_PREFIX}invalid`], 'recovery-data-that-is-not-json', 'Recovery tidak sah yang bukan resume mesti dikekalkan tanpa ditukar.');

for (const key of [`${CHILD_SNAPSHOT_PREFIX}child-a`, `${CHILD_ORIGINAL_SNAPSHOT_PREFIX}child-a`, `${CHILD_MERGED_BACKUP_PREFIX}child-a`]) {
  assert.doesNotMatch(outgoingPayload[key] || '', /jannati_v15[012]_resume/, `${key} tidak boleh menyimpan salinan resume transit.`);
}
assert.equal(JSON.parse(outgoingPayload.jannati_v151_profile).xp, 321, 'XP kanonik tidak boleh dibuang.');
assert.deepEqual(JSON.parse(outgoingPayload.jannati_v151_profile).progress, canonicalProfile.progress, 'Progress/mastery kanonik tidak boleh berubah.');
assert.deepEqual(JSON.parse(outgoingPayload.jannati_v151_profile).history, canonicalProfile.history, 'Sejarah pembelajaran kanonik tidak boleh berubah.');
assert.equal(JSON.parse(outgoingPayload.jannati_v151_ai_memory).notes.length, canonicalMemory.notes.length, 'Memori pembelajaran kanonik tidak boleh dipotong.');
assert.deepEqual(JSON.parse(outgoingPayload.jannati_child_profiles), childProfiles, 'Profil anak tidak boleh dibuang.');
assert.deepEqual(JSON.parse(outgoingPayload.jannati_deleted_child_profiles), deletedChildren, 'Metadata delete tidak boleh dibuang.');
const outgoingArchive = JSON.parse(outgoingPayload.jannati_archived_child_profiles);
assert.equal(outgoingArchive['child-archived'].archivedAt, archivedChildren['child-archived'].archivedAt, 'Masa arkib tidak boleh dibuang.');
assert.deepEqual(outgoingArchive['child-archived'].profile, archivedChildren['child-archived'].profile, 'Profil arkib tidak boleh dibuang.');

let secondPayload = null;
await syncRevisionedCloudLearning({ rpc: async (_name, args) => {
  secondPayload = args.payload;
  return { data: { ok: true, revision: 12 }, error: null };
} }, outgoingPayload, {
  accountId: 'account-a', localActiveChildId: 'child-a', dirtyChildIds: ['child-a'],
  cloudEnvelope: { data: outgoingPayload, revision: 11, protocolVersion: 3, serverUpdatedAt: '', error: null }
});
assert.deepEqual(secondPayload, outgoingPayload, 'Merge + compaction berulang mesti idempotent.');

let oversizedCalls = 0;
const oversizedResult = await saveRevisionedCloudLearningData({ rpc: async () => {
  oversizedCalls += 1;
  return { data: { ok: true }, error: null };
} }, { payload: { canonical: 'z'.repeat(MAX_CLOUD_BYTES + 1024) } });
assert.equal(oversizedResult.ok, false);
assert.equal(oversizedResult.error?.code, 'CLIENT_PAYLOAD_TOO_LARGE');
assert.equal(oversizedCalls, 0, 'Preflight mesti menyekat POST yang sudah diketahui terlalu besar.');

let p0001Calls = 0;
const p0001Result = await saveRevisionedCloudLearningData({ rpc: async () => {
  p0001Calls += 1;
  return { data: null, error: { code: 'P0001', status: 500, message: 'learning_payload_too_large' } };
} }, { payload: { safe: true }, transportMaxAttempts: 3, retryBaseDelayMs: 0 });
assert.equal(p0001Result.ok, false);
assert.equal(p0001Calls, 1, 'P0001 deterministik tidak boleh dicuba semula seperti ralat transport.');

const app = fs.readFileSync('src/App.jsx', 'utf8');
const learningSync = fs.readFileSync('src/services/learningSync.js', 'utf8');
const learningSyncCoordinator = fs.readFileSync('src/services/learningSyncCoordinator.js', 'utf8');
assert.match(app, /else \{[\s\S]{0,180}setPendingCloudMutation\(accountUser\.id, true\)/, 'Mutasi pending mesti kekal selepas save ditolak.');
assert.match(app, /if \(ok\) \{[\s\S]{0,180}acknowledgeResumeTombstones\(/, 'App hanya boleh mengakui pending resume delete selepas save V4 berjaya.');
assert.match(app, /resume\(\?:_slots\|_tombstones\|_pending_tombstones\)/, 'Outbox pending resume tidak boleh disalin ke child snapshot.');
assert.match(learningSyncCoordinator, /save_learning_data_v4/);
assert.match(learningSyncCoordinator, /if \(result\.ok\)[\s\S]{0,260}acknowledgedResumeTombstones/, 'Coordinator hanya boleh mengembalikan acknowledgement pada hasil save yang berjaya.');
assert.match(learningSyncCoordinator, /isMissingRevisionedRpc[\s\S]{0,500}save_learning_data_v3/, 'Fallback V3 hanya boleh berlaku apabila V4 benar-benar tiada.');
assert.doesNotMatch(learningSync, /select\([^)]*learning_data/i, 'Realtime tidak boleh memilih learning_data penuh.');

console.log('Resume/cloud payload bloat regression: PASS');
