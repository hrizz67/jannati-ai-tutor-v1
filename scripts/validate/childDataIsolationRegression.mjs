import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyScopedLearningSnapshot,
  scopeChildLearningSnapshot
} from '../../src/services/childScopedStorage.js';
import { migrateLegacyStudentData, LEARNING_IDENTITY_MIGRATION_PREFIX } from '../../src/services/legacyStudentMigration.js';
import {
  createChildLineageId,
  createTutorConversationScope,
  getLearningStorageScope,
  stampLearningIdentity
} from '../../src/services/studentIdentity.js';
import {
  CHILD_MERGED_BACKUP_PREFIX,
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  mergeCloudLearningPayload,
  recoverOrphanedCloudOutbox,
  sanitizeLearningPayloadOwnership
} from '../../src/services/learningSync.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

class MemoryStorage {
  constructor(seed = {}) {
    this.values = new Map(Object.entries(seed));
  }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

function record(value) {
  return JSON.stringify(value);
}

function learningSurface(name, xp, marker) {
  const isAina = name === 'Aina';
  const accuracy = isAina ? 90 : 30;
  const weakTopics = isAina ? [] : ['subtraction'];
  return {
    jannati_v151_profile: record({ name, year: 'Tahun 2', xp, streak: marker, progress: { math_subtraction: { attempts: 10, best: accuracy } }, recommendations: { math: isAina ? 'pengayaan' : 'ulang subtraction' }, uasaHistory: [{ subjectId: 'math', score: accuracy }] }),
    jannati_v152_student_core: record({ profile: { name, year: 'Tahun 2', xp }, core: { xp, level: Math.max(1, Math.ceil(xp / 100)) } }),
    jannati_v151_ai_memory: record({ xp, weakTopics, strongTopics: isAina ? ['addition'] : [], recommendations: [isAina ? 'pengayaan' : 'subtraction'], listeningHistory: [{ score: accuracy }], speakingHistory: [{ score: accuracy }] }),
    'jannati.memory.student': record({ xp, topics: { bm: { [marker]: { masterySnapshot: xp } } }, mistakes: { bm: { [marker]: { totalMistakes: marker } } } }),
    'jannati.adaptive.studentProfile': record({ xp, totalQuestions: 10, correctQuestions: isAina ? 9 : 3, topics: { math: { subtraction: { mastery: accuracy } } } }),
    'jannati.gamification.profile': record({ xp, currentStreak: marker, achievements: [`achievement-${marker}`] }),
    'jannati.smartQuestion': record({ history: [{ questionId: `q-${marker}` }], revisionQueue: [`revision-${marker}`] }),
    jannati_v152_resume_slots: record({
      [`quiz::bm::topic-${marker}`]: {
        mode: 'quiz',
        subjectId: 'bm',
        topicId: `topic-${marker}`,
        questions: [{ id: `q-${marker}` }],
        currentIndex: marker
      }
    }),
    'jannati.smartPersonalTutor.profile:default': record({ name, mastery: accuracy, recommendations: [isAina ? 'pengayaan' : 'subtraction'], tutorMessages: [`${name} context`] })
  };
}

function parseSurface(snapshot, key) {
  return JSON.parse(snapshot[key]);
}

const accountId = 'account-family';
const aina = { id: 'child-aina', lineageId: createChildLineageId('child-aina'), name: 'Aina', year: 'Tahun 2' };
const ali = { id: 'child-ali', lineageId: createChildLineageId('child-ali'), name: 'Ali', year: 'Tahun 2' };
const ainaIdentity = getLearningStorageScope({ accountId, childId: aina.id });
const aliIdentity = getLearningStorageScope({ accountId, childId: ali.id });

const ainaScoped = scopeChildLearningSnapshot(learningSurface('Aina', 310, 5), ainaIdentity);
const aliScoped = scopeChildLearningSnapshot(learningSurface('Ali', 70, 1), aliIdentity);
assert.equal(ainaScoped.ok, true);
assert.equal(aliScoped.ok, true);

for (const key of [
  'jannati_v151_profile',
  'jannati_v152_student_core',
  'jannati_v151_ai_memory',
  'jannati.memory.student',
  'jannati.adaptive.studentProfile',
  'jannati.gamification.profile',
  'jannati.smartQuestion'
]) {
  assert.equal(parseSurface(ainaScoped.snapshot, key).childId, aina.id, `${key} must be stamped for Aina.`);
  assert.equal(parseSurface(aliScoped.snapshot, key).childId, ali.id, `${key} must be stamped for Ali.`);
  assert.equal(parseSurface(ainaScoped.snapshot, key).accountId, accountId, `${key} must be account-scoped.`);
}

const activeStorage = new MemoryStorage();
assert.equal(applyScopedLearningSnapshot(activeStorage, ainaScoped.snapshot, ainaIdentity).ok, true);
assert.equal(JSON.parse(activeStorage.getItem('jannati_v151_profile')).xp, 310);
assert.equal(applyScopedLearningSnapshot(activeStorage, aliScoped.snapshot, aliIdentity).ok, true);
assert.equal(JSON.parse(activeStorage.getItem('jannati_v151_profile')).xp, 70, 'Aina -> Ali must show only Ali data.');
assert.equal(JSON.parse(activeStorage.getItem('jannati_v151_profile')).name, 'Ali');
assert.equal(JSON.parse(activeStorage.getItem('jannati_v151_profile')).streak, 1);
assert.equal(JSON.parse(activeStorage.getItem('jannati.adaptive.studentProfile')).correctQuestions, 3);
assert.deepEqual(JSON.parse(activeStorage.getItem('jannati_v151_ai_memory')).weakTopics, ['subtraction']);
assert.equal(JSON.parse(activeStorage.getItem('jannati_v151_profile')).recommendations.math, 'ulang subtraction');
assert.equal(JSON.parse(activeStorage.getItem('jannati_v151_profile')).uasaHistory[0].score, 30);
assert.equal(applyScopedLearningSnapshot(activeStorage, ainaScoped.snapshot, ainaIdentity).ok, true);
assert.equal(JSON.parse(activeStorage.getItem('jannati_v151_profile')).xp, 310, 'Aina -> Ali -> Aina must restore Aina data.');
assert.equal(JSON.parse(activeStorage.getItem('jannati_v151_profile')).name, 'Aina');
assert.equal(JSON.parse(activeStorage.getItem('jannati_v151_profile')).streak, 5);
assert.equal(JSON.parse(activeStorage.getItem('jannati.adaptive.studentProfile')).correctQuestions, 9);
assert.deepEqual(JSON.parse(activeStorage.getItem('jannati_v151_ai_memory')).weakTopics, []);
assert.equal(JSON.parse(activeStorage.getItem('jannati_v151_profile')).uasaHistory[0].score, 90);

const reloadedAina = JSON.parse(JSON.stringify(ainaScoped.snapshot));
assert.equal(scopeChildLearningSnapshot(reloadedAina, ainaIdentity).ok, true, 'Serialized reload must preserve scope.');
const childConflict = scopeChildLearningSnapshot(ainaScoped.snapshot, aliIdentity);
assert.equal(childConflict.ok, false, 'A snapshot stamped for Aina must fail closed for Ali.');
assert.ok(childConflict.issues.some(issue => issue.reason === 'child-scope-mismatch'));
const accountConflict = scopeChildLearningSnapshot(ainaScoped.snapshot, { accountId: 'account-other', childId: aina.id });
assert.equal(accountConflict.ok, false, 'An account mismatch must fail closed.');

const ainaTutor = createTutorConversationScope(ainaIdentity, { subjectId: 'bm', topicId: 'kata-nama', sessionId: 's1' });
const aliTutor = createTutorConversationScope(aliIdentity, { subjectId: 'bm', topicId: 'kata-nama', sessionId: 's1' });
assert.notEqual(ainaTutor, aliTutor, 'Tutor memory must not cross child IDs.');
assert.equal(
  ainaTutor,
  createTutorConversationScope({ accountId, childId: aina.id, name: 'Aina Baharu' }, { subjectId: 'bm', topicId: 'kata-nama', sessionId: 's1' }),
  'Renaming a child must not change Tutor identity.'
);

const sameNameOne = { id: 'child-same-1', lineageId: createChildLineageId('child-same-1'), name: 'Aina', year: 'Tahun 2' };
const sameNameTwo = { id: 'child-same-2', lineageId: createChildLineageId('child-same-2'), name: 'Aina', year: 'Tahun 2' };
const sameNamePayload = mergeCloudLearningPayload({
  [CLOUD_CHILD_STATE_KEY]: record({ profiles: [sameNameOne], activeChildId: sameNameOne.id }),
  [`${CHILD_SNAPSHOT_PREFIX}${sameNameOne.id}`]: record({ ...scopeChildLearningSnapshot(learningSurface('Aina', 10, 1), { accountId, childId: sameNameOne.id }).snapshot, __childSnapshotChildId: sameNameOne.id, __childSnapshotAccountId: accountId })
}, {
  [CLOUD_CHILD_STATE_KEY]: record({ profiles: [sameNameTwo], activeChildId: sameNameTwo.id }),
  [`${CHILD_SNAPSHOT_PREFIX}${sameNameTwo.id}`]: record({ ...scopeChildLearningSnapshot(learningSurface('Aina', 200, 2), { accountId, childId: sameNameTwo.id }).snapshot, __childSnapshotChildId: sameNameTwo.id, __childSnapshotAccountId: accountId })
}, { accountId, dirtyChildIds: [sameNameOne.id], localActiveChildId: sameNameOne.id });
assert.equal(JSON.parse(sameNamePayload[CLOUD_CHILD_STATE_KEY]).profiles.length, 2, 'Same-name siblings must remain separate without shared lineage.');

const archivedAt = Date.now();
const archivedPayload = mergeCloudLearningPayload({
  [CLOUD_CHILD_STATE_KEY]: record({ profiles: [ali], activeChildId: ali.id, archivedChildren: { [aina.id]: { profile: aina, archivedAt, restoredAt: 0 } } }),
  [`${CHILD_SNAPSHOT_PREFIX}${aina.id}`]: record({ ...ainaScoped.snapshot, __childSnapshotChildId: aina.id, __childSnapshotAccountId: accountId }),
  [`${CHILD_SNAPSHOT_PREFIX}${ali.id}`]: record({ ...aliScoped.snapshot, __childSnapshotChildId: ali.id, __childSnapshotAccountId: accountId })
}, {}, { accountId, dirtyChildIds: [aina.id], localActiveChildId: ali.id });
const archivedState = JSON.parse(archivedPayload[CLOUD_CHILD_STATE_KEY]);
assert.deepEqual(archivedState.profiles.map(item => item.id), [ali.id]);
assert.equal(typeof archivedPayload[`${CHILD_SNAPSHOT_PREFIX}${aina.id}`], 'string', 'Archive must retain the child snapshot.');
assert.equal(archivedState.archivedChildren[aina.id].profile.id, aina.id);

const restoredPayload = mergeCloudLearningPayload({
  ...archivedPayload,
  [CLOUD_CHILD_STATE_KEY]: record({ ...archivedState, profiles: [ali, aina], activeChildId: aina.id, archivedChildren: { [aina.id]: { profile: aina, archivedAt, restoredAt: archivedAt + 1 } } })
}, archivedPayload, { accountId, dirtyChildIds: [aina.id], localActiveChildId: aina.id });
assert.ok(JSON.parse(restoredPayload[CLOUD_CHILD_STATE_KEY]).profiles.some(item => item.id === aina.id), 'Undo archive must restore the same stable child ID.');
assert.equal(JSON.parse(JSON.parse(restoredPayload[`${CHILD_SNAPSHOT_PREFIX}${aina.id}`]).jannati_v151_profile).xp, 310);

const recoveredOutbox = recoverOrphanedCloudOutbox({
  [CLOUD_CHILD_STATE_KEY]: record({ profiles: [aina], activeChildId: aina.id }),
  [`${CHILD_SNAPSHOT_PREFIX}${aina.id}`]: record({ ...ainaScoped.snapshot, __childSnapshotChildId: aina.id, __childSnapshotAccountId: accountId })
}, {}, { accountId, pending: true, dirtyChildIds: [], localActiveChildId: aina.id });
assert.equal(recoveredOutbox.recovered, true, 'A crash before child outbox persistence must recover the explicit active child.');
assert.deepEqual(recoveredOutbox.dirtyChildIds, [aina.id]);

const contaminated = sanitizeLearningPayloadOwnership({
  [`${CHILD_SNAPSHOT_PREFIX}${aina.id}`]: record({ ...ainaScoped.snapshot, __childSnapshotChildId: ali.id, __childSnapshotAccountId: accountId })
}, { accountId });
assert.equal(contaminated[`${CHILD_SNAPSHOT_PREFIX}${aina.id}`], undefined);
assert.ok(Object.keys(contaminated).some(key => key.startsWith(CHILD_MERGED_BACKUP_PREFIX)), 'Wrong-child cloud data must be quarantined, not applied.');

const legacyStorage = new MemoryStorage(learningSurface('Aina', 55, 2));
const legacyProfiles = [aina, ali];
const migratedAina = migrateLegacyStudentData({ storage: legacyStorage, accountId, child: aina, profiles: legacyProfiles });
assert.equal(migratedAina.migrated, true, 'Only the first evidenced child receives legacy data.');
assert.ok(legacyStorage.getItem(migratedAina.backupKey), 'Legacy migration must create a backup first.');
assert.equal(migrateLegacyStudentData({ storage: legacyStorage, accountId, child: aina, profiles: legacyProfiles }).reason, 'already-complete');
assert.equal(migrateLegacyStudentData({ storage: legacyStorage, accountId, child: ali, profiles: legacyProfiles }).reason, 'insufficient-evidence');
assert.equal(JSON.parse(legacyStorage.getItem('jannati_v151_profile')).childId, aina.id);
assert.equal(legacyStorage.getItem(`${LEARNING_IDENTITY_MIGRATION_PREFIX}${aliIdentity.scopeKey}`), null);

const stamped = stampLearningIdentity({ xp: 1 }, ainaIdentity);
assert.equal(stamped.learningScope, ainaIdentity.scopeKey);

const appSource = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const dashboardSource = fs.readFileSync(path.join(root, 'src/dashboard/HomeDashboard.jsx'), 'utf8');
const parentBoundarySource = fs.readFileSync(path.join(root, 'src/components/parent/ParentModeBoundary.jsx'), 'utf8');
assert.match(appSource, /function clearTransientChildState[\s\S]{0,900}setChatOpen\(false\)[\s\S]{0,900}setAnswer\(''\)/, 'Child switch must clear transient Tutor and answer state.');
assert.match(appSource, /function handleSelectChild[\s\S]{0,900}captureChildSnapshot\(currentChildId, \{ force: true \}\)[\s\S]{0,1500}restoreChildSnapshot\(snapshot, target\.id\)/, 'Switching must capture current child before restoring target child.');
assert.match(appSource, /function handleArchiveChild[\s\S]{0,1800}archivedAt[\s\S]{0,1800}function handleRestoreArchivedChild/, 'Archive and Undo must be implemented as reversible metadata operations.');
assert.doesNotMatch(appSource.slice(appSource.indexOf('function handleArchiveChild'), appSource.indexOf('function handleRestoreArchivedChild')), /removeItem\(`\$\{CHILD_(?:SNAPSHOT|ORIGINAL_SNAPSHOT)_PREFIX\}/, 'Archive must not delete learning snapshots.');
assert.match(dashboardSource, /Tukar nama[\s\S]{0,800}Arkib profil[\s\S]{0,500}Undo arkib/, 'Safe child management controls must be visible.');
assert.match(parentBoundarySource, /\[accountId, activeChildId\]/, 'Parent access must relock when the selected child changes.');
assert.match(appSource, /createTutorConversationScope\(learningIdentity/, 'Tutor conversation keys must use account and child identity.');

console.log('Child data isolation regression: PASS (Aina/Ali, same name, reload, offline, account, legacy, Tutor, archive/undo)');
