import { pathToFileURL } from 'node:url';
import {
  CHILD_MERGED_BACKUP_PREFIX,
  CHILD_ORIGINAL_SNAPSHOT_PREFIX,
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  mergeCloudLearningPayload
} from '../../src/services/learningSync.js';
import {
  MAX_CLOUD_LEARNING_PAYLOAD_BYTES,
  compactCloudLearningPayload,
  measureCloudLearningPayloadBytes
} from '../../src/services/cloudPayloadCompaction.js';

const ACTIVE_CHILD_ID = 'audit-active-child';
const OTHER_CHILD_ID = 'audit-other-child';
const ARCHIVED_CHILD_ID = 'audit-archived-child';
const ACCOUNT_ID = 'audit-account';

const LEGACY_METADATA_KEYS = new Set([
  'jannati_child_profiles',
  'jannati_active_child_id',
  'jannati_deleted_child_profiles',
  'jannati_archived_child_profiles'
]);
const RESUME_KEY_PATTERN = /^jannati_v(?:140|150|151|152)_resume(?:_slots|_tombstones|_pending_tombstones)?$/;

function record(value) {
  return JSON.stringify(value);
}

function syntheticText(character, length) {
  return character.repeat(length);
}

function childProfile(id, { xp, coins, name }) {
  return {
    id,
    childId: id,
    accountId: ACCOUNT_ID,
    name,
    year: 'Tahun 2',
    xp,
    coins,
    stars: coins,
    updatedAt: '2026-10-08T00:00:00.000Z'
  };
}

function activeLearningProjection(profile) {
  return {
    jannati_v151_profile: record({
      ...profile,
      progress: { bm: { reading: { completed: 35, mastery: 88 } } },
      history: [{ id: 'history-fixture', summary: syntheticText('h', 560_000) }]
    }),
    'jannati.adaptive.studentProfile': record({
      xp: profile.xp,
      totalXp: profile.xp,
      mastery: { bm: 88, math: 74 },
      evidence: syntheticText('a', 310_000)
    }),
    'jannati.gamification.profile': record({
      xp: profile.xp,
      coins: profile.coins,
      stars: profile.stars,
      achievements: [{ id: 'steady-reader', earned: true }],
      ledger: syntheticText('g', 130_000)
    }),
    jannati_v151_ai_memory: record({
      xp: profile.xp,
      notes: [{ id: 'memory-fixture', summary: syntheticText('m', 1_080_000) }]
    }),
    jannati_v152_student_core: record({
      profile: { xp: profile.xp, coins: profile.coins },
      core: { xp: profile.xp, progress: { bm: 88 } },
      evidence: syntheticText('c', 170_000)
    })
  };
}

function otherLearningProjection(profile) {
  return {
    jannati_v151_profile: record({
      ...profile,
      progress: { math: { numbers: { completed: 20, mastery: 81 } } },
      history: [{ id: 'other-history', summary: syntheticText('o', 260_000) }]
    }),
    'jannati.adaptive.studentProfile': record({
      xp: profile.xp,
      mastery: { math: 81 },
      evidence: syntheticText('p', 210_000)
    }),
    'jannati.gamification.profile': record({
      xp: profile.xp,
      coins: profile.coins,
      stars: profile.stars
    })
  };
}

function snapshot(childId, capturedAt, projection) {
  return record({
    __childSnapshotChildId: childId,
    __childSnapshotAccountId: ACCOUNT_ID,
    __childSnapshotCapturedAt: capturedAt,
    ...projection
  });
}

export function buildCloudPayloadBloatFixture() {
  const activeProfile = childProfile(ACTIVE_CHILD_ID, { xp: 1155, coins: 87, name: 'Murid Aktif' });
  const otherProfile = childProfile(OTHER_CHILD_ID, { xp: 640, coins: 44, name: 'Murid Kedua' });
  const archivedProfile = childProfile(ARCHIVED_CHILD_ID, { xp: 280, coins: 19, name: 'Murid Arkib' });
  const profiles = [activeProfile, otherProfile];
  const archivedChildren = {
    [ARCHIVED_CHILD_ID]: {
      profile: archivedProfile,
      archivedAt: 1_791_417_600_000,
      restoredAt: 0
    }
  };
  const deletedChildren = { 'audit-deleted-child': 1_791_331_200_000 };
  const childState = record({
    version: 3,
    profiles,
    activeChildId: ACTIVE_CHILD_ID,
    deletedChildren,
    archivedChildren
  });
  const activeProjection = activeLearningProjection(activeProfile);
  const otherProjection = otherLearningProjection(otherProfile);
  const activeSnapshot = snapshot(ACTIVE_CHILD_ID, 1_791_417_600_000, activeProjection);
  const activeOriginalSnapshot = snapshot(ACTIVE_CHILD_ID, 1_791_331_200_000, activeProjection);
  const otherSnapshot = snapshot(OTHER_CHILD_ID, 1_791_417_600_000, otherProjection);
  const otherOriginalSnapshot = snapshot(OTHER_CHILD_ID, 1_791_331_200_000, otherProjection);
  const mergedBackup = record({
    version: 1,
    aliasId: 'audit-legacy-alias',
    canonicalId: ACTIVE_CHILD_ID,
    mergedAt: '2026-10-08T00:00:00.000Z',
    profile: activeProfile,
    snapshot: activeOriginalSnapshot,
    originalSnapshot: activeOriginalSnapshot
  });
  const cloud = {
    [CLOUD_CHILD_STATE_KEY]: childState,
    jannati_child_profiles: record(profiles),
    jannati_active_child_id: ACTIVE_CHILD_ID,
    jannati_deleted_child_profiles: record(deletedChildren),
    jannati_archived_child_profiles: record(archivedChildren),
    ...activeProjection,
    [`${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`]: activeSnapshot,
    [`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`]: activeOriginalSnapshot,
    [`${CHILD_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`]: otherSnapshot,
    [`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`]: otherOriginalSnapshot,
    [`${CHILD_MERGED_BACKUP_PREFIX}audit-legacy-alias`]: mergedBackup
  };
  const resumeScope = `${ACTIVE_CHILD_ID}::quiz::bm::reading`;
  const local = {
    [CLOUD_CHILD_STATE_KEY]: childState,
    jannati_child_profiles: record(profiles),
    jannati_active_child_id: ACTIVE_CHILD_ID,
    jannati_deleted_child_profiles: record(deletedChildren),
    jannati_archived_child_profiles: record(archivedChildren),
    ...activeProjection,
    [`${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`]: activeSnapshot,
    jannati_v152_resume_slots: record({
      [resumeScope]: {
        version: 1,
        accountId: ACCOUNT_ID,
        childId: ACTIVE_CHILD_ID,
        mode: 'quiz',
        subjectId: 'bm',
        topicId: 'reading',
        questionIds: ['BM-1', 'BM-2'],
        currentIndex: 1,
        updatedAt: '2026-10-08T00:01:00.000Z'
      }
    })
  };
  return {
    accountId: ACCOUNT_ID,
    activeChildId: ACTIVE_CHILD_ID,
    otherChildId: OTHER_CHILD_ID,
    archivedChildId: ARCHIVED_CHILD_ID,
    activeProfile,
    otherProfile,
    archivedProfile,
    local,
    cloud
  };
}

function parseObject(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function topLevelEntryBytes(key, value) {
  return measureCloudLearningPayloadBytes({ [key]: value }) - 2;
}

function safeBreakdown(payload, activeChildId) {
  let otherSnapshotIndex = 0;
  let otherOriginalIndex = 0;
  let backupIndex = 0;
  const entries = Object.entries(payload).map(([key, value]) => {
    let label = `root-learning:${key}`;
    let category = 'root learning projection';
    if (key === `${CHILD_SNAPSHOT_PREFIX}${activeChildId}`) {
      label = 'active child snapshot';
      category = label;
    } else if (key === `${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${activeChildId}`) {
      label = 'active original child snapshot';
      category = label;
    } else if (key.startsWith(CHILD_SNAPSHOT_PREFIX)) {
      otherSnapshotIndex += 1;
      label = `other child snapshot ${otherSnapshotIndex}`;
      category = 'other child snapshots';
    } else if (key.startsWith(CHILD_ORIGINAL_SNAPSHOT_PREFIX)) {
      otherOriginalIndex += 1;
      label = `other original child snapshot ${otherOriginalIndex}`;
      category = 'other original child snapshots';
    } else if (key.startsWith(CHILD_MERGED_BACKUP_PREFIX)) {
      backupIndex += 1;
      label = `merged child backup ${backupIndex}`;
      category = 'merged child backups';
    } else if (key === CLOUD_CHILD_STATE_KEY) {
      label = 'canonical child-state metadata';
      category = 'child-state metadata';
    } else if (LEGACY_METADATA_KEYS.has(key)) {
      label = `legacy metadata:${key}`;
      category = 'profiles/archive/delete metadata';
    } else if (RESUME_KEY_PATTERN.test(key)) {
      label = `resume metadata:${key}`;
      category = 'resume slots/tombstones';
    } else if (key === 'jannati.adaptive.studentProfile') {
      category = 'adaptive profile';
    } else if (key === 'jannati.gamification.profile') {
      category = 'gamification profile';
    } else if (/memory|history/i.test(key)) {
      category = 'AI memory/history';
    }
    return { label, category, bytes: topLevelEntryBytes(key, value) };
  });
  const categories = new Map();
  entries.forEach(entry => categories.set(entry.category, (categories.get(entry.category) || 0) + entry.bytes));
  return {
    categories: [...categories.entries()]
      .map(([category, bytes]) => ({ category, bytes }))
      .sort((left, right) => right.bytes - left.bytes),
    topContributors: entries.sort((left, right) => right.bytes - left.bytes).slice(0, 15)
  };
}

function buildAuditOnlyDeduplicatedCandidate(payload, activeChildId) {
  const next = { ...payload };
  const activeSnapshot = parseObject(next[`${CHILD_SNAPSHOT_PREFIX}${activeChildId}`]) || {};
  Object.keys(next).forEach(key => {
    if (key.startsWith(CHILD_ORIGINAL_SNAPSHOT_PREFIX)) delete next[key];
    else if (LEGACY_METADATA_KEYS.has(key)) delete next[key];
    else if (key.startsWith(CHILD_MERGED_BACKUP_PREFIX)) {
      const backup = parseObject(next[key]);
      if (!backup?.canonicalId || backup.canonicalId !== activeChildId) return;
      delete backup.snapshot;
      delete backup.originalSnapshot;
      next[key] = record(backup);
    } else if (key.startsWith('jannati')
      && !key.startsWith(CHILD_SNAPSHOT_PREFIX)
      && key !== CLOUD_CHILD_STATE_KEY
      && !RESUME_KEY_PATTERN.test(key)
      && Object.hasOwn(activeSnapshot, key)) {
      delete next[key];
    }
  });
  return next;
}

export function auditCloudPayloadBloat() {
  const fixture = buildCloudPayloadBloatFixture();
  const merged = mergeCloudLearningPayload(fixture.local, fixture.cloud, {
    accountId: fixture.accountId,
    localActiveChildId: fixture.activeChildId,
    dirtyChildIds: [fixture.activeChildId],
    mergeDirtySnapshots: true,
    deviceId: 'audit-device'
  });
  const transport = compactCloudLearningPayload(merged, [fixture.local, fixture.cloud], {
    accountId: fixture.accountId,
    childId: fixture.activeChildId
  });
  const candidate = buildAuditOnlyDeduplicatedCandidate(transport, fixture.activeChildId);
  const mergedBytes = measureCloudLearningPayloadBytes(merged);
  const transportBytes = measureCloudLearningPayloadBytes(transport);
  const candidateBytes = measureCloudLearningPayloadBytes(candidate);
  const beforeCompaction = safeBreakdown(merged, fixture.activeChildId);
  const afterCompaction = safeBreakdown(transport, fixture.activeChildId);
  return {
    localBytes: measureCloudLearningPayloadBytes(fixture.local),
    cloudBytes: measureCloudLearningPayloadBytes(fixture.cloud),
    mergedBytes,
    transportBytes,
    maxClientBytes: MAX_CLOUD_LEARNING_PAYLOAD_BYTES,
    overClientLimit: transportBytes > MAX_CLOUD_LEARNING_PAYLOAD_BYTES,
    auditOnlyDeduplicatedCandidateBytes: candidateBytes,
    duplicatedTransportBytes: transportBytes - candidateBytes,
    beforeCompaction,
    afterCompaction,
    ...afterCompaction
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(auditCloudPayloadBloat(), null, 2));
}
