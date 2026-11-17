import {
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY
} from './learningSync.js';
import {
  RESUME_SLOTS_KEY,
  RESUME_TOMBSTONES_KEY,
  RESUME_PENDING_TOMBSTONES_KEY
} from '../utils/resumeStorage.js';
import { resolveCurriculumBank } from '../config/curriculumBankCatalog.js';

const ROOT_PROFILE_KEY = 'jannati_v151_profile';
const MAX_RAW_BYTES = 1024 * 1024;
const MAX_RECORDS = 256;

function plainData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return (proto === Object.prototype || proto === null)
    && Object.values(Object.getOwnPropertyDescriptors(value)).every(descriptor => Object.hasOwn(descriptor, 'value'));
}

function safeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readJsonObject(value) {
  if (typeof value !== 'string' || value.length > MAX_RAW_BYTES) return null;
  try {
    const parsed = JSON.parse(value);
    return plainData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function hints(record, key) {
  if (!plainData(record)) return [];
  const nested = [record, record.state, record.metadata];
  return [...new Set(nested
    .filter(plainData)
    .map(item => safeText(item[key]))
    .filter(Boolean))];
}

function hasMismatch(record, selection) {
  const pairings = [
    ['accountId', selection.accountId],
    ['childId', selection.childId],
    ['studentId', selection.childId],
    ['year', selection.year],
    ['curriculumId', selection.curriculumId]
  ];
  return pairings.some(([field, expected]) => hints(record, field).some(actual => actual !== expected));
}

function countObject(value) {
  return plainData(value) && Object.keys(value).length <= MAX_RECORDS;
}

/**
 * M1-G pure, read-only diagnostic. Caller provides synthetic local/cloud
 * JSON string maps and an explicit selected child + edition. This cannot read
 * storage, send network traffic, apply cloud writes, or authorize migration.
 * It returns only fixed codes and aggregate counts: never raw child data.
 */
export function auditMultiYearCloudBoundary(request = {}) {
  const findings = new Set();
  const counts = {
    localChildSnapshots: 0,
    cloudChildSnapshots: 0,
    localPendingTombstones: 0,
    cloudPendingTombstones: 0,
    localResumeSlots: 0,
    cloudResumeSlots: 0,
    dirtyChildren: 0
  };
  const finish = () => ({
    reportVersion: 1,
    status: 'HOLD',
    readOnly: true,
    canHydrate: false,
    canMerge: false,
    canApply: false,
    canRelease: false,
    proposedWrites: 0,
    proposedDeletes: 0,
    counts: { ...counts },
    findings: [...findings].sort()
  });

  if (!plainData(request)) {
    findings.add('invalid_input_object');
    return finish();
  }
  const localPayload = request.localPayload ?? {};
  const cloudPayload = request.cloudPayload ?? {};
  const selection = request.selection ?? {};
  const syncState = request.syncState ?? {};
  if (![localPayload, cloudPayload, selection, syncState].every(plainData)) {
    findings.add('invalid_input_object');
    return finish();
  }
  const accountId = safeText(selection.accountId);
  const childId = safeText(selection.childId);
  const year = safeText(selection.year);
  const curriculumId = safeText(selection.curriculumId);
  const bank = resolveCurriculumBank({ year, curriculumId });
  if (!accountId || !childId || accountId === 'default' || childId === 'default'
    || !year || !curriculumId || !bank) {
    findings.add('missing_or_unsupported_selection');
    return finish();
  }
  if (bank.status !== 'ready') findings.add('unready_curriculum_bank');

  const snapshotKey = CHILD_SNAPSHOT_PREFIX + childId;

  const metadata = readJsonObject(cloudPayload[CLOUD_CHILD_STATE_KEY]);
  if (!metadata) {
    findings.add('missing_or_invalid_cloud_child_metadata');
  } else {
    const profiles = Array.isArray(metadata.profiles) ? metadata.profiles : null;
    if (!profiles || profiles.length > MAX_RECORDS || profiles.some(profile => !plainData(profile))) {
      findings.add('invalid_cloud_profile_collection');
    } else {
      const matching = profiles.filter(profile => safeText(profile.id) === childId);
      if (matching.length !== 1) findings.add('selected_child_not_unique_in_cloud');
      else {
        const profile = matching[0];
        const profileYear = safeText(profile.year);
        if ((!profileYear && year !== 'Tahun 2') || (profileYear && profileYear !== year)) {
          findings.add('cloud_child_year_mismatch');
        }
        const profileCurriculum = safeText(profile.curriculumId);
        if (profileCurriculum && profileCurriculum !== curriculumId) findings.add('cloud_child_curriculum_mismatch');
      }
    }
    const deleted = plainData(metadata.deletedChildren) ? metadata.deletedChildren : {};
    const archived = plainData(metadata.archivedChildren) ? metadata.archivedChildren : {};
    if (Object.hasOwn(deleted, childId) || (
      plainData(archived[childId]) &&
      Number(archived[childId].archivedAt) > Number(archived[childId].restoredAt)
    )) findings.add('selected_child_deleted_or_archived');
    const cloudActive = safeText(metadata.activeChildId);
    if (cloudActive && cloudActive !== childId) findings.add('cloud_active_child_diverged');
  }

  const localMeta = Object.hasOwn(localPayload, CLOUD_CHILD_STATE_KEY)
    ? readJsonObject(localPayload[CLOUD_CHILD_STATE_KEY]) : null;
  if (Object.hasOwn(localPayload, CLOUD_CHILD_STATE_KEY) && !localMeta) findings.add('invalid_local_child_metadata');
  if (localMeta) {
    const localProfiles = Array.isArray(localMeta.profiles) ? localMeta.profiles : [];
    const active = localProfiles.filter(profile => plainData(profile) && safeText(profile.id) === childId);
    if (active.length !== 1) findings.add('selected_child_not_unique_locally');
    else if (safeText(active[0].year) && safeText(active[0].year) !== year) findings.add('local_child_year_mismatch');
  }

  for (const [label, payload] of [['local', localPayload], ['cloud', cloudPayload]]) {
    const countField = label === 'local' ? 'localChildSnapshots' : 'cloudChildSnapshots';
    const keys = Object.keys(payload).filter(key => key.startsWith(CHILD_SNAPSHOT_PREFIX));
    counts[countField] = keys.length;
    if (keys.length > MAX_RECORDS) {
      findings.add(label + '_too_many_child_snapshots');
      continue;
    }
    if (!Object.hasOwn(payload, snapshotKey)) {
      findings.add(label + '_missing_selected_child_snapshot');
    } else {
      const snapshot = readJsonObject(payload[snapshotKey]);
      if (!snapshot) findings.add(label + '_malformed_selected_child_snapshot');
      else {
        const declaredAccount = safeText(snapshot.__childSnapshotAccountId);
        const declaredChild = safeText(snapshot.__childSnapshotChildId);
        if (!declaredAccount || !declaredChild) findings.add(label + '_unverifiable_snapshot_owner');
        else if (declaredAccount !== accountId || declaredChild !== childId) {
          findings.add(label + '_snapshot_owner_mismatch');
        }
        const innerProfile = readJsonObject(snapshot[ROOT_PROFILE_KEY]);
        if (innerProfile && hasMismatch(innerProfile, { accountId, childId, year, curriculumId })) {
          findings.add(label + '_embedded_profile_identity_mismatch');
        }
      }
    }

    const rootProfile = Object.hasOwn(payload, ROOT_PROFILE_KEY)
      ? readJsonObject(payload[ROOT_PROFILE_KEY]) : null;
    if (Object.hasOwn(payload, ROOT_PROFILE_KEY) && !rootProfile) findings.add(label + '_malformed_root_profile');
    if (rootProfile && hasMismatch(rootProfile, { accountId, childId, year, curriculumId })) {
      findings.add(label + '_root_identity_mismatch');
    }

    const rawSlots = payload[RESUME_SLOTS_KEY];
    if (rawSlots !== undefined) {
      const slots = readJsonObject(rawSlots);
      if (!countObject(slots)) findings.add(label + '_invalid_resume_slots');
      else {
        counts[label === 'local' ? 'localResumeSlots' : 'cloudResumeSlots'] = Object.keys(slots).length;
        for (const record of Object.values(slots)) {
          if (!plainData(record)) { findings.add(label + '_invalid_resume_record'); continue; }
          if (hasMismatch(record, { accountId, childId, year, curriculumId })) {
            findings.add(label + '_resume_identity_or_edition_mismatch');
          }
          if (year !== 'Tahun 2' && (!hints(record, 'year').length || !hints(record, 'curriculumId').length)) {
            findings.add(label + '_unlabelled_future_resume');
          }
        }
      }
    }
  }

  const localPending = readJsonObject(localPayload[RESUME_PENDING_TOMBSTONES_KEY]);
  const cloudPending = readJsonObject(cloudPayload[RESUME_PENDING_TOMBSTONES_KEY]);
  const localCleared = readJsonObject(localPayload[RESUME_TOMBSTONES_KEY]);
  const cloudCleared = readJsonObject(cloudPayload[RESUME_TOMBSTONES_KEY]);
  for (const [label, payload, parsed] of [
    ['local', localPayload, localPending],
    ['cloud', cloudPayload, cloudPending]
  ]) {
    if (Object.hasOwn(payload, RESUME_PENDING_TOMBSTONES_KEY) && !countObject(parsed)) {
      findings.add(label + '_invalid_pending_tombstones');
    } else if (parsed) {
      counts[label === 'local' ? 'localPendingTombstones' : 'cloudPendingTombstones'] = Object.keys(parsed).length;
      if (Object.keys(parsed).length) findings.add(label + '_pending_deletions');
    }
    if (Object.hasOwn(payload, RESUME_TOMBSTONES_KEY) && !countObject(readJsonObject(payload[RESUME_TOMBSTONES_KEY]))) {
      findings.add(label + '_invalid_cleared_tombstones');
    }
  }
  if (localPending && cloudPending && countObject(localPending) && countObject(cloudPending)) {
    const localKeys = Object.keys(localPending).sort();
    const cloudKeys = Object.keys(cloudPending).sort();
    if (JSON.stringify(localKeys) !== JSON.stringify(cloudKeys)
      || localKeys.some(key => JSON.stringify(localPending[key]) !== JSON.stringify(cloudPending[key]))) {
      findings.add('pending_tombstone_drift');
    }
  }

  if (localCleared && cloudCleared && countObject(localCleared) && countObject(cloudCleared)) {
    const left = Object.keys(localCleared).sort();
    const right = Object.keys(cloudCleared).sort();
    if (JSON.stringify(left) !== JSON.stringify(right)
      || left.some(key => JSON.stringify(localCleared[key]) !== JSON.stringify(cloudCleared[key]))) {
      findings.add('cleared_tombstone_drift');
    }
  }

  const dirtyChildIds = Array.isArray(syncState.dirtyChildIds) ? syncState.dirtyChildIds : [];
  counts.dirtyChildren = Math.min(MAX_RECORDS + 1, dirtyChildIds.length);
  if (dirtyChildIds.length > MAX_RECORDS) findings.add('too_many_dirty_children');
  if (dirtyChildIds.length || syncState.pending === true) findings.add('unsynced_child_mutations');
  if (dirtyChildIds.some(id => safeText(id) !== childId)) findings.add('outbox_contains_foreign_child');
  const requestChild = safeText(syncState.requestChildId);
  if (requestChild && requestChild !== childId) findings.add('stale_request_child');
  const requestYear = safeText(syncState.requestYear);
  if (requestYear && requestYear !== year) findings.add('stale_request_year');
  const requestCurriculum = safeText(syncState.requestCurriculumId);
  if (requestCurriculum && requestCurriculum !== curriculumId) findings.add('stale_request_curriculum');
  const expectedVersion = syncState.submittedMutationVersion;
  const currentVersion = syncState.currentMutationVersion;
  if (Number.isSafeInteger(expectedVersion) && Number.isSafeInteger(currentVersion)
    && expectedVersion !== currentVersion) findings.add('stale_mutation_acknowledgement');
  const localRevision = syncState.localRevision;
  const serverRevision = syncState.serverRevision;
  if (Number.isSafeInteger(localRevision) && Number.isSafeInteger(serverRevision)
    && localRevision !== serverRevision) findings.add('cloud_revision_conflict');

  return finish();
}
