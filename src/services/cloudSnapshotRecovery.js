import {
  CHILD_MERGED_BACKUP_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  normalizeActiveLearningProjection
} from './learningSync.js';
import {
  ACCOUNT_SNAPSHOT_PREFIX,
  MAX_LOCAL_CHILD_SNAPSHOT_BYTES,
  buildCompactAccountSnapshot,
  captureCompactAccountSnapshot,
  estimateStorageBytes,
  isObject,
  isRecoverableAccountDataKey,
  isSnapshotCacheKey,
  normalizeStorageId,
  persistBoundedChildSnapshot,
  safeStorageRemove,
  safeStorageSet
} from './localSnapshotStorage.js';
import {
  getSnapshotChildId,
  isReplaceableSnapshotCacheKey,
  listStorageKeys,
  parseStorageArray,
  parseStorageObject,
  persistRestoreDiagnostic,
  shouldBlockEmptyCloudWrite
} from './snapshotStorageSupport.js';

export {
  ACCOUNT_SNAPSHOT_PREFIX,
  LAST_RESTORE_DIAGNOSTIC_KEY,
  MAX_LOCAL_ACCOUNT_SNAPSHOT_BYTES,
  MAX_LOCAL_CHILD_SNAPSHOT_BYTES,
  buildCompactAccountSnapshot,
  captureCompactAccountSnapshot,
  estimateStorageBytes,
  isRecoverableAccountDataKey,
  persistBoundedChildSnapshot,
  safeStorageRemove,
  safeStorageSet
} from './localSnapshotStorage.js';

export {
  createLocalSnapshotDiagnostics,
  pruneForeignAccountSnapshots,
  shouldBlockEmptyCloudWrite,
  shouldLoadStudentLearningForRoute
} from './snapshotStorageSupport.js';

const CHILD_PROFILES_KEY = 'jannati_child_profiles';
const ACTIVE_CHILD_KEY = 'jannati_active_child_id';
const DELETED_CHILDREN_KEY = 'jannati_deleted_child_profiles';
const ARCHIVED_CHILDREN_KEY = 'jannati_archived_child_profiles';

function isArchived(record = {}) {
  return Number(record?.archivedAt) > Number(record?.restoredAt);
}

function normalizeCloudProfiles(metadata = {}) {
  const deletedChildren = isObject(metadata.deletedChildren) ? metadata.deletedChildren : {};
  const archivedChildren = isObject(metadata.archivedChildren) ? metadata.archivedChildren : {};
  const seen = new Set();
  const profiles = [];
  for (const candidate of Array.isArray(metadata.profiles) ? metadata.profiles : []) {
    const id = normalizeStorageId(candidate?.id);
    const name = normalizeStorageId(candidate?.name);
    if (!id || !name || seen.has(id) || deletedChildren[id] || isArchived(archivedChildren[id])) continue;
    seen.add(id);
    profiles.push({ ...candidate, id, name });
  }
  return { profiles, deletedChildren, archivedChildren };
}

function getDeclaredSnapshotOwnership(raw) {
  const parsed = parseStorageObject(raw);
  if (!parsed.ok) return { valid: false, childId: '', accountId: '' };
  return {
    valid: true,
    childId: normalizeStorageId(parsed.value.__childSnapshotChildId),
    accountId: normalizeStorageId(parsed.value.__childSnapshotAccountId)
  };
}

function findDuplicateNameGroups(profiles = []) {
  const groups = new Map();
  profiles.forEach(profile => {
    const key = `${normalizeStorageId(profile.name).toLocaleLowerCase('ms')}|${normalizeStorageId(profile.year).toLocaleLowerCase('ms')}`;
    if (!key.startsWith('|')) groups.set(key, [...(groups.get(key) || []), profile.id]);
  });
  return [...groups.values()].filter(ids => ids.length > 1);
}

export function buildCloudRestorePlan(cloudData = {}, options = {}) {
  const accountId = normalizeStorageId(options.accountId);
  if (!accountId || !isObject(cloudData)) {
    return { ok: false, hydrated: false, snapshotPersisted: false, reason: 'cloud_payload_invalid', errorName: '', failedKey: '' };
  }

  const rootProfile = parseStorageObject(cloudData.jannati_v151_profile);
  const rootAccountId = rootProfile.ok ? normalizeStorageId(rootProfile.value.accountId) : '';
  if (rootAccountId && rootAccountId !== accountId) {
    return { ok: false, hydrated: false, snapshotPersisted: false, reason: 'account_mismatch', errorName: '', failedKey: 'jannati_v151_profile' };
  }

  let metadataResult = parseStorageObject(cloudData[CLOUD_CHILD_STATE_KEY]);
  if (!metadataResult.ok) {
    const legacyProfiles = parseStorageArray(cloudData[CHILD_PROFILES_KEY]);
    if (!legacyProfiles.ok) {
      return {
        ok: false,
        hydrated: false,
        snapshotPersisted: false,
        reason: cloudData[CLOUD_CHILD_STATE_KEY] ? 'cloud_payload_invalid' : 'missing_snapshot',
        errorName: '',
        failedKey: CLOUD_CHILD_STATE_KEY
      };
    }
    metadataResult = {
      ok: true,
      value: {
        profiles: legacyProfiles.value,
        activeChildId: cloudData[ACTIVE_CHILD_KEY] || '',
        deletedChildren: parseStorageObject(cloudData[DELETED_CHILDREN_KEY]).value || {},
        archivedChildren: parseStorageObject(cloudData[ARCHIVED_CHILDREN_KEY]).value || {}
      }
    };
  }

  const { profiles, deletedChildren, archivedChildren } = normalizeCloudProfiles(metadataResult.value);
  const validIds = new Set(profiles.map(profile => profile.id));
  const activeChildId = [
    normalizeStorageId(metadataResult.value.activeChildId),
    normalizeStorageId(options.preferredChildId),
    normalizeStorageId(options.currentActiveChildId),
    profiles[0]?.id
  ].find(id => id && validIds.has(id)) || '';
  const normalizedCloudData = activeChildId
    ? normalizeActiveLearningProjection(cloudData, activeChildId, { accountId })
    : { ...cloudData };
  const projection = {};
  const snapshotEntries = {};
  const orphanSnapshotKeys = [];
  const rejectedSnapshotKeys = [];
  const skippedLargeSnapshotKeys = [];

  Object.entries(normalizedCloudData).forEach(([key, value]) => {
    const childId = getSnapshotChildId(key);
    if (childId) {
      if (!validIds.has(childId)) {
        orphanSnapshotKeys.push(key);
        return;
      }
      const ownership = getDeclaredSnapshotOwnership(value);
      if (!ownership.valid
        || (ownership.childId && ownership.childId !== childId)
        || (ownership.accountId && ownership.accountId !== accountId)) {
        rejectedSnapshotKeys.push(key);
        return;
      }
      if (typeof value !== 'string') return;
      if (estimateStorageBytes(key, value) > (Number(options.maxChildSnapshotBytes) || MAX_LOCAL_CHILD_SNAPSHOT_BYTES)) {
        skippedLargeSnapshotKeys.push(key);
        return;
      }
      snapshotEntries[key] = value;
      return;
    }
    if (key.startsWith(CHILD_MERGED_BACKUP_PREFIX) || key.startsWith(ACCOUNT_SNAPSHOT_PREFIX)) return;
    if (isRecoverableAccountDataKey(key) && typeof value === 'string') projection[key] = value;
  });

  projection[CLOUD_CHILD_STATE_KEY] = JSON.stringify({
    ...metadataResult.value,
    profiles,
    activeChildId,
    deletedChildren,
    archivedChildren
  });
  projection[CHILD_PROFILES_KEY] = JSON.stringify(profiles);
  projection[ACTIVE_CHILD_KEY] = activeChildId;
  projection[DELETED_CHILDREN_KEY] = JSON.stringify(deletedChildren);
  projection[ARCHIVED_CHILDREN_KEY] = JSON.stringify(archivedChildren);

  return {
    ok: true,
    hydrated: true,
    reason: 'ok',
    accountId,
    profiles,
    activeChildId,
    activeProfile: profiles.find(profile => profile.id === activeChildId) || null,
    archivedChildren,
    deletedChildren,
    projection,
    snapshotEntries,
    orphanSnapshotKeys,
    rejectedSnapshotKeys,
    skippedLargeSnapshotKeys,
    duplicateNameGroups: findDuplicateNameGroups(profiles)
  };
}

export function hydrateCloudLearningState(storage, cloudData = {}, options = {}) {
  let plan;
  try {
    plan = buildCloudRestorePlan(cloudData, options);
  } catch (error) {
    const result = {
      ok: false,
      hydrated: false,
      activeStatePersisted: false,
      snapshotPersisted: false,
      reason: 'unknown',
      errorName: String(error?.name || 'Error'),
      failedKey: ''
    };
    persistRestoreDiagnostic(storage, result);
    return result;
  }
  if (!plan.ok) {
    persistRestoreDiagnostic(storage, plan);
    return plan;
  }

  const listed = listStorageKeys(storage);
  const cleanupFailures = [];
  if (listed.ok) {
    listed.keys.forEach(key => {
      if (isReplaceableSnapshotCacheKey(key) || (isRecoverableAccountDataKey(key) && !(key in plan.projection))) {
        const result = safeStorageRemove(storage, key);
        if (!result.ok) cleanupFailures.push(result);
      }
    });
  } else cleanupFailures.push(listed);

  const projectionFailures = [];
  Object.entries(plan.projection).forEach(([key, value]) => {
    const result = safeStorageSet(storage, key, value);
    if (!result.ok) projectionFailures.push(result);
  });

  const cacheFailures = [];
  Object.entries(plan.snapshotEntries).forEach(([key, value]) => {
    const result = persistBoundedChildSnapshot(storage, key, value, {
      maxBytes: options.maxChildSnapshotBytes,
      removeExistingOnLimit: true
    });
    if (!result.persisted) cacheFailures.push(result);
  });
  const accountSnapshot = captureCompactAccountSnapshot(storage, plan.accountId, plan.projection, {
    maxBytes: options.maxAccountSnapshotBytes
  });
  if (!accountSnapshot.persisted) cacheFailures.push(accountSnapshot);

  const activeStatePersisted = projectionFailures.length === 0;
  const snapshotPersisted = cleanupFailures.length === 0
    && cacheFailures.length === 0
    && plan.skippedLargeSnapshotKeys.length === 0;
  const primaryFailure = projectionFailures[0]
    || cacheFailures[0]
    || cleanupFailures[0]
    || (plan.skippedLargeSnapshotKeys.length
      ? { reason: 'size_limit_exceeded', errorName: '', failedKey: plan.skippedLargeSnapshotKeys[0] }
      : null);
  const result = {
    ...plan,
    ok: true,
    hydrated: true,
    activeStatePersisted,
    snapshotPersisted,
    readOnly: shouldBlockEmptyCloudWrite({
      serverProfileCount: plan.profiles.length,
      localProfileCount: activeStatePersisted ? plan.profiles.length : 0,
      activeStatePersisted
    }),
    reason: primaryFailure?.reason || 'ok',
    errorName: primaryFailure?.errorName || '',
    failedKey: primaryFailure?.failedKey || '',
    cleanupFailureCount: cleanupFailures.length,
    projectionFailureCount: projectionFailures.length,
    cacheFailureCount: cacheFailures.length + plan.skippedLargeSnapshotKeys.length
  };
  persistRestoreDiagnostic(storage, result);
  return result;
}

export function measureSnapshotStorage(payload = {}, accountId = '') {
  const breakdown = Object.entries(isObject(payload) ? payload : {})
    .map(([key, value]) => ({ key, estimatedBytes: estimateStorageBytes(key, typeof value === 'string' ? value : JSON.stringify(value)) }))
    .sort((left, right) => right.estimatedBytes - left.estimatedBytes);
  const childFieldBreakdown = Object.entries(isObject(payload) ? payload : {}).flatMap(([snapshotKey, raw]) => {
    const childId = getSnapshotChildId(snapshotKey);
    if (!childId) return [];
    const parsed = parseStorageObject(raw);
    if (!parsed.ok) return [];
    return Object.entries(parsed.value).map(([key, value]) => ({
      snapshotKey,
      childId,
      key,
      estimatedBytes: estimateStorageBytes(key, typeof value === 'string' ? value : JSON.stringify(value))
    }));
  }).sort((left, right) => right.estimatedBytes - left.estimatedBytes);
  const compact = buildCompactAccountSnapshot(payload, accountId);
  return {
    canonicalCloudBytes: breakdown.reduce((sum, item) => sum + item.estimatedBytes, 0),
    projectedAccountSnapshotBytes: compact.estimatedBytes,
    childSnapshotBytes: breakdown.filter(item => getSnapshotChildId(item.key)).reduce((sum, item) => sum + item.estimatedBytes, 0),
    totalProjectedLocalBytes: compact.estimatedBytes + breakdown
      .filter(item => !isSnapshotCacheKey(item.key))
      .reduce((sum, item) => sum + item.estimatedBytes, 0),
    breakdown,
    childFieldBreakdown
  };
}
