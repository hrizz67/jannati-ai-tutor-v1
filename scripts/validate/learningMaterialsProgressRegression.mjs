import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  countCompletedLearningMaterials,
  createEmptyLearningMaterialsProgress,
  isLearningMaterialComplete,
  markLearningMaterialComplete,
  migrateLegacyNoteProgress,
  normalizeLearningMaterialsProgress
} from '../../src/utils/learningMaterialsProgress.js';
import {
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  getLearningSnapshotEvidenceScore,
  mergeCloudLearningPayload,
  mergeConcurrentLearningSnapshots
} from '../../src/services/learningSync.js';

const firstAt = '2026-08-25T01:00:00.000Z';
const secondAt = '2026-08-25T01:05:00.000Z';
let progress = createEmptyLearningMaterialsProgress();

progress = markLearningMaterialComplete(progress, {
  mode: 'nota',
  subjectId: 'bm',
  topicId: 'kata_nama_am',
  completedAt: firstAt
});
assert.equal(isLearningMaterialComplete(progress, 'nota', 'bm', 'kata_nama_am'), true);
assert.equal(isLearningMaterialComplete(progress, 'buku', 'bm', 'kata_nama_am'), false, 'Nota and textbook progress must remain separate.');

progress = markLearningMaterialComplete(progress, {
  mode: 'buku',
  subjectId: 'bm',
  topicId: 'kata_nama_am',
  completedAt: secondAt
});
assert.equal(isLearningMaterialComplete(progress, 'buku', 'bm', 'kata_nama_am'), true);
assert.equal(countCompletedLearningMaterials(progress, 'nota'), 1);
assert.equal(countCompletedLearningMaterials(progress, 'buku'), 1);
assert.equal(normalizeLearningMaterialsProgress(progress).updatedAt, secondAt);

const migrated = migrateLegacyNoteProgress(createEmptyLearningMaterialsProgress(), {
  bm_kata_nama_am: true,
  math_nombor: false
}, firstAt);
assert.equal(isLearningMaterialComplete(migrated, 'nota', 'bm', 'kata_nama_am'), true, 'Legacy note completion must be retained.');
assert.equal(isLearningMaterialComplete(migrated, 'buku', 'bm', 'kata_nama_am'), false, 'Ambiguous legacy completion must not claim textbook review.');

const cloudSnapshot = JSON.stringify({
  __childSnapshotChildId: 'child-fayyadh',
  jannati_v151_profile: JSON.stringify({
    name: 'Fayyadh',
    learningMaterials: markLearningMaterialComplete({}, {
      mode: 'nota', subjectId: 'bm', topicId: 'kata_nama_am', completedAt: firstAt
    })
  })
});
const localSnapshot = JSON.stringify({
  __childSnapshotChildId: 'child-fayyadh',
  jannati_v151_profile: JSON.stringify({
    name: 'Fayyadh',
    learningMaterials: markLearningMaterialComplete({}, {
      mode: 'buku', subjectId: 'math', topicId: 'nombor', completedAt: secondAt
    })
  })
});
assert.ok(getLearningSnapshotEvidenceScore(cloudSnapshot) > 0, 'Reading-only progress must count as recoverable learning evidence.');
const mergedSnapshot = JSON.parse(mergeConcurrentLearningSnapshots(cloudSnapshot, localSnapshot, 'child-fayyadh'));
const mergedProfile = JSON.parse(mergedSnapshot.jannati_v151_profile);
assert.equal(isLearningMaterialComplete(mergedProfile.learningMaterials, 'nota', 'bm', 'kata_nama_am'), true, 'Cloud note progress must survive a concurrent merge.');
assert.equal(isLearningMaterialComplete(mergedProfile.learningMaterials, 'buku', 'math', 'nombor'), true, 'Local textbook progress must survive a concurrent merge.');

const childA = { id: 'child-a', name: 'Aisyah', year: 'Tahun 2' };
const childB = { id: 'child-b', name: 'Bilal', year: 'Tahun 2' };
const isolatedPayload = mergeCloudLearningPayload({
  [CLOUD_CHILD_STATE_KEY]: JSON.stringify({ version: 3, profiles: [childA], activeChildId: childA.id, deletedChildren: {} }),
  [`${CHILD_SNAPSHOT_PREFIX}${childA.id}`]: cloudSnapshot.replaceAll('child-fayyadh', childA.id)
}, {
  [CLOUD_CHILD_STATE_KEY]: JSON.stringify({ version: 3, profiles: [childB], activeChildId: childB.id, deletedChildren: {} }),
  [`${CHILD_SNAPSHOT_PREFIX}${childB.id}`]: localSnapshot.replaceAll('child-fayyadh', childB.id)
}, { dirtyChildIds: [childA.id], localActiveChildId: childA.id, mergeDirtySnapshots: true });
const childAProfile = JSON.parse(JSON.parse(isolatedPayload[`${CHILD_SNAPSHOT_PREFIX}${childA.id}`]).jannati_v151_profile);
const childBProfile = JSON.parse(JSON.parse(isolatedPayload[`${CHILD_SNAPSHOT_PREFIX}${childB.id}`]).jannati_v151_profile);
assert.equal(isLearningMaterialComplete(childAProfile.learningMaterials, 'nota', 'bm', 'kata_nama_am'), true);
assert.equal(isLearningMaterialComplete(childAProfile.learningMaterials, 'buku', 'math', 'nombor'), false, 'Another child textbook progress must not leak into child A.');
assert.equal(isLearningMaterialComplete(childBProfile.learningMaterials, 'buku', 'math', 'nombor'), true);
assert.equal(isLearningMaterialComplete(childBProfile.learningMaterials, 'nota', 'bm', 'kata_nama_am'), false, 'Child A note progress must not leak into child B.');

const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const dashboardSource = fs.readFileSync(new URL('../../src/dashboard/LearningDashboard.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../../src/components/LearningHub.jsx', import.meta.url), 'utf8');
assert.match(appSource, /function markLearningMaterial\(learningMaterials\)[\s\S]{0,300}setProfile\(prev => \(\{ \.\.\.prev, learningMaterials \}\)\)/, 'Material completion must update the active learner profile.');
assert.match(appSource, /onMarkMaterial=\{markLearningMaterial\}/, 'App must wire profile-backed material progress into the learning dashboard.');
assert.match(dashboardSource, /onMarkMaterial=\{onMarkMaterial\}/, 'LearningDashboard must forward the profile-backed mutation only.');
assert.doesNotMatch(hubSource, /localStorage\.(getItem|setItem)\(['"]jannati_learning_notes_v1/, 'LearningHub must not bypass profile and cloud synchronization.');
assert.match(hubSource, /onMarkMaterial\?\.\(markLearningMaterialComplete\(materialProgress/, 'LearningHub must prepare the next immutable material progress state before profile storage.');
assert.match(hubSource, /setTopicId\(item\.id\);\s*selectMode\('nota'\)/, 'Buka Nota must update the parent-controlled tab.');
assert.match(hubSource, /onOpenAi\(\{ subject, topic: activeTopic \}\)/, 'Tanya Janna must receive the visible note or textbook context.');

console.log('Learning materials progress regression: PASS (profile scope, separate modes, concurrent sync, legacy migration)');
