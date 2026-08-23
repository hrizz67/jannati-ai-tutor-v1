export const CHILD_SNAPSHOT_PREFIX = 'jannati_child_snapshot:';
export const CHILD_ORIGINAL_SNAPSHOT_PREFIX = 'jannati_child_original_snapshot:';
export const CHILD_MERGED_BACKUP_PREFIX = 'jannati_merged_child_backup:';
export const CLOUD_CHILD_STATE_KEY = 'jannati_cloud_child_state';
export const CLOUD_SYNC_META_KEY = 'jannati_cloud_sync_meta';
export const CLOUD_SYNC_VERSION = 3;
export const CLOUD_SYNC_PROTOCOL_VERSION = 3;

const CHILD_PROFILES_KEY = 'jannati_child_profiles';
const ACTIVE_CHILD_KEY = 'jannati_active_child_id';
const DELETED_CHILDREN_KEY = 'jannati_deleted_child_profiles';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseObject(value) {
  if (isObject(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseTimestamp(value) {
  if (Number.isFinite(Number(value))) return Number(value);
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getNestedTimestamp(snapshot = {}) {
  let latest = parseTimestamp(snapshot.__childSnapshotCapturedAt);
  Object.values(snapshot).forEach(raw => {
    if (typeof raw !== 'string' || !raw.trim().startsWith('{')) return;
    const value = parseObject(raw);
    latest = Math.max(
      latest,
      parseTimestamp(value.updatedAt),
      parseTimestamp(value.lastAnsweredAt),
      parseTimestamp(value.lastPractised),
      parseTimestamp(value.startedAt)
    );
  });
  return latest;
}

export function getLearningSnapshotTimestamp(rawSnapshot) {
  return getNestedTimestamp(parseObject(rawSnapshot));
}

function scoreLearningValue(value, depth = 0) {
  if (!value || depth > 5) return 0;
  if (Array.isArray(value)) {
    return value.length * 3 + value.slice(0, 100).reduce((sum, item) => sum + scoreLearningValue(item, depth + 1), 0);
  }
  if (!isObject(value)) return 0;
  const directScore = (Number(value.xp) || 0) * 10
    + (Number(value.streak) || 0) * 10
    + (Number(value.studyStreak) || 0) * 10
    + (Number(value.totalQuestions) || 0)
    + (Number(value.correctQuestions) || 0) * 2
    + Object.keys(isObject(value.progress) ? value.progress : {}).length * 5
    + (Array.isArray(value.history) ? value.history.length * 5 : 0)
    + (Array.isArray(value.events) ? value.events.length * 3 : 0);
  return directScore + Object.entries(value).reduce((sum, [key, nested]) => {
    if (['xp', 'streak', 'studyStreak', 'totalQuestions', 'correctQuestions', 'progress', 'history', 'events'].includes(key)) return sum;
    return sum + scoreLearningValue(nested, depth + 1);
  }, 0);
}

export function getLearningSnapshotEvidenceScore(rawSnapshot) {
  const snapshot = parseObject(rawSnapshot);
  return Object.values(snapshot).reduce((score, raw) => {
    if (isObject(raw) || Array.isArray(raw)) return score + scoreLearningValue(raw);
    if (typeof raw !== 'string') return score;
    try {
      return score + scoreLearningValue(JSON.parse(raw));
    } catch {
      return score;
    }
  }, 0);
}

function childIdFromSnapshotKey(key = '') {
  if (key.startsWith(CHILD_SNAPSHOT_PREFIX)) return key.slice(CHILD_SNAPSHOT_PREFIX.length);
  if (key.startsWith(CHILD_ORIGINAL_SNAPSHOT_PREFIX)) return key.slice(CHILD_ORIGINAL_SNAPSHOT_PREFIX.length);
  return '';
}

function normalizeDeletedChildren(value = {}) {
  if (Array.isArray(value)) {
    return Object.fromEntries(value.filter(Boolean).map(id => [String(id), 1]));
  }
  return Object.fromEntries(Object.entries(isObject(value) ? value : {})
    .filter(([id]) => id)
    .map(([id, deletedAt]) => [id, Math.max(1, parseTimestamp(deletedAt))]));
}

function mergeDeletedChildren(localValue, cloudValue) {
  const local = normalizeDeletedChildren(localValue);
  const cloud = normalizeDeletedChildren(cloudValue);
  const ids = new Set([...Object.keys(cloud), ...Object.keys(local)]);
  return Object.fromEntries([...ids].map(id => [id, Math.max(cloud[id] || 0, local[id] || 0)]));
}

function profileTimestamp(profile = {}) {
  return Math.max(parseTimestamp(profile.updatedAt), parseTimestamp(profile.createdAt));
}

function normalizeProfileIdentityPart(value = '') {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ms')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getChildProfileIdentity(profile = {}) {
  const name = normalizeProfileIdentityPart(profile.name);
  const year = normalizeProfileIdentityPart(profile.year);
  if (!name || !year || ['anak', 'murid', 'pelajar', 'demo murid'].includes(name)) return '';
  return `${name}|${year}`;
}

function listProfiles(metadata = {}, deletedChildren = {}) {
  return (Array.isArray(metadata.profiles) ? metadata.profiles : [])
    .filter(profile => profile?.id && !deletedChildren[profile.id]);
}

function buildUniqueIdentityMap(profiles = []) {
  const groups = new Map();
  profiles.forEach(profile => {
    const identity = getChildProfileIdentity(profile);
    if (!identity) return;
    const current = groups.get(identity) || [];
    current.push(profile);
    groups.set(identity, current);
  });
  return new Map([...groups.entries()]
    .filter(([, matches]) => matches.length === 1)
    .map(([identity, matches]) => [identity, matches[0]]));
}

function resolveAlias(aliases, childId = '') {
  let resolved = String(childId || '').trim();
  const visited = new Set();
  while (resolved && aliases.has(resolved) && !visited.has(resolved)) {
    visited.add(resolved);
    resolved = aliases.get(resolved);
  }
  return resolved;
}

function snapshotScoreForChild(payload = {}, childId = '') {
  return Math.max(
    getLearningSnapshotEvidenceScore(payload[`${CHILD_SNAPSHOT_PREFIX}${childId}`]),
    getLearningSnapshotEvidenceScore(payload[`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${childId}`])
  );
}

function chooseRicherSnapshot(firstRaw, secondRaw) {
  if (typeof firstRaw !== 'string') return secondRaw;
  if (typeof secondRaw !== 'string') return firstRaw;
  const firstScore = getLearningSnapshotEvidenceScore(firstRaw);
  const secondScore = getLearningSnapshotEvidenceScore(secondRaw);
  if (firstScore <= 0) return secondScore > 0 ? secondRaw : firstRaw;
  if (secondScore <= 0) return firstRaw;
  const firstTimestamp = getLearningSnapshotTimestamp(firstRaw);
  const secondTimestamp = getLearningSnapshotTimestamp(secondRaw);
  // The first value is the current child snapshot and the second is its
  // original recovery backup. A larger old backup must not replace a newer
  // resume position unless the current snapshot is severely truncated.
  if (firstTimestamp >= secondTimestamp || firstScore >= secondScore * 0.35) return firstRaw;
  return secondRaw;
}

function rewriteSnapshotChildId(rawSnapshot, childId) {
  if (typeof rawSnapshot !== 'string') return rawSnapshot;
  try {
    const snapshot = JSON.parse(rawSnapshot);
    if (!isObject(snapshot)) return rawSnapshot;
    return JSON.stringify({
      ...snapshot,
      __childSnapshotChildId: childId
    });
  } catch {
    return rawSnapshot;
  }
}

const CANONICAL_PROFILE_FIELDS = new Set([
  'name',
  'year',
  'avatar',
  'email',
  'accountId',
  'accessStatus',
  'accessLabel',
  'accessExpiresAt',
  'isPremium',
  'isDemo'
]);

function isDateLikeField(key = '', value = '') {
  if (!value || typeof value !== 'string') return false;
  return /(at|date|day|laststudy|lastplayed|lastpractised)$/i.test(key)
    && parseTimestamp(value) > 0;
}

function arrayItemKey(item) {
  if (!isObject(item)) return `${typeof item}:${String(item)}`;
  if (item.id) return `id:${item.id}`;
  if (item.key) return `key:${item.key}`;
  if (item.eventKey) return `event:${item.eventKey}`;
  if (item.sessionId) return `session:${item.sessionId}`;
  if (item.questionId) {
    return `question:${item.questionId}:${item.answeredAt || item.timestamp || item.date || item.attemptNumber || ''}`;
  }
  try {
    return `json:${JSON.stringify(item)}`;
  } catch {
    return '';
  }
}

function mergeLearningArrays(canonical = [], duplicate = [], depth = 0) {
  const merged = [];
  const indexByKey = new Map();
  [...canonical, ...duplicate].forEach(item => {
    const key = arrayItemKey(item);
    if (!key || !indexByKey.has(key)) {
      if (key) indexByKey.set(key, merged.length);
      merged.push(item);
      return;
    }
    const index = indexByKey.get(key);
    merged[index] = mergeLearningValue(merged[index], item, '', depth + 1);
  });
  return merged.slice(0, 500);
}

function mergeLearningValue(canonical, duplicate, key = '', depth = 0) {
  if (duplicate === undefined || duplicate === null) return canonical;
  if (canonical === undefined || canonical === null) return duplicate;
  if (depth > 12) return canonical;
  if (Array.isArray(canonical) && Array.isArray(duplicate)) {
    return mergeLearningArrays(canonical, duplicate, depth + 1);
  }
  if (isObject(canonical) && isObject(duplicate)) {
    const merged = { ...canonical };
    Object.entries(duplicate).forEach(([nestedKey, value]) => {
      merged[nestedKey] = mergeLearningValue(merged[nestedKey], value, nestedKey, depth + 1);
    });
    return merged;
  }
  if (typeof canonical === 'number' && typeof duplicate === 'number') return Math.max(canonical, duplicate);
  if (typeof canonical === 'boolean' && typeof duplicate === 'boolean') {
    return CANONICAL_PROFILE_FIELDS.has(key) ? canonical : canonical || duplicate;
  }
  if (typeof canonical === 'string' && typeof duplicate === 'string') {
    if (CANONICAL_PROFILE_FIELDS.has(key)) return canonical || duplicate;
    if (isDateLikeField(key, canonical) || isDateLikeField(key, duplicate)) {
      return parseTimestamp(duplicate) > parseTimestamp(canonical) ? duplicate : canonical;
    }
    return canonical || duplicate;
  }
  return canonical;
}

function mergeStoredLearningValue(canonicalRaw, duplicateRaw, storageKey = '') {
  if (typeof canonicalRaw !== 'string') return duplicateRaw;
  if (typeof duplicateRaw !== 'string') return canonicalRaw;
  try {
    const canonical = JSON.parse(canonicalRaw);
    const duplicate = JSON.parse(duplicateRaw);
    if (storageKey === 'jannati_v151_resume') {
      return parseTimestamp(duplicate?.updatedAt) > parseTimestamp(canonical?.updatedAt) ? duplicateRaw : canonicalRaw;
    }
    return JSON.stringify(mergeLearningValue(canonical, duplicate));
  } catch {
    return canonicalRaw || duplicateRaw;
  }
}

function mergeLearningSnapshots(canonicalRaw, duplicateRaw, childId) {
  if (typeof canonicalRaw !== 'string') return rewriteSnapshotChildId(duplicateRaw, childId);
  if (typeof duplicateRaw !== 'string') return rewriteSnapshotChildId(canonicalRaw, childId);
  const canonical = parseObject(canonicalRaw);
  const duplicate = parseObject(duplicateRaw);
  const merged = { ...canonical };
  Object.entries(duplicate).forEach(([key, value]) => {
    if (key.startsWith('__')) return;
    merged[key] = mergeStoredLearningValue(merged[key], value, key);
  });
  const accountId = canonical.__childSnapshotAccountId || duplicate.__childSnapshotAccountId || '';
  const deviceId = canonical.__childSnapshotDeviceId || duplicate.__childSnapshotDeviceId || '';
  return JSON.stringify({
    ...merged,
    __childSnapshotChildId: childId,
    __childSnapshotCapturedAt: Math.max(
      parseTimestamp(canonical.__childSnapshotCapturedAt),
      parseTimestamp(duplicate.__childSnapshotCapturedAt)
    ) || Date.now(),
    ...(accountId ? { __childSnapshotAccountId: accountId } : {}),
    ...(deviceId ? { __childSnapshotDeviceId: deviceId } : {})
  });
}

export function mergeConcurrentLearningSnapshots(cloudRaw, localRaw, childId) {
  return mergeLearningSnapshots(cloudRaw, localRaw, childId);
}

function remapPayloadProfiles(payload = {}, metadata = {}, aliases = new Map(), canonicalProfiles = new Map()) {
  const next = { ...payload };
  const mappedProfiles = listProfiles(metadata).map(profile => {
    const targetId = resolveAlias(aliases, profile.id);
    if (targetId === profile.id) return profile;
    const canonical = canonicalProfiles.get(targetId);
    return canonical ? { ...profile, ...canonical, id: targetId } : { ...profile, id: targetId };
  });

  for (const [aliasId, targetId] of aliases) {
    const aliasProfile = (Array.isArray(metadata.profiles) ? metadata.profiles : [])
      .find(profile => profile?.id === aliasId);
    const aliasSnapshot = next[`${CHILD_SNAPSHOT_PREFIX}${aliasId}`];
    const aliasOriginalSnapshot = next[`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${aliasId}`];
    const backupKey = `${CHILD_MERGED_BACKUP_PREFIX}${aliasId}`;
    if (!next[backupKey] && (aliasProfile || aliasSnapshot || aliasOriginalSnapshot)) {
      next[backupKey] = JSON.stringify({
        version: 1,
        aliasId,
        canonicalId: targetId,
        mergedAt: new Date().toISOString(),
        profile: aliasProfile || null,
        snapshot: aliasSnapshot || null,
        originalSnapshot: aliasOriginalSnapshot || null
      });
    }
    [CHILD_SNAPSHOT_PREFIX, CHILD_ORIGINAL_SNAPSHOT_PREFIX].forEach(prefix => {
      const aliasKey = `${prefix}${aliasId}`;
      const targetKey = `${prefix}${targetId}`;
      const selected = mergeLearningSnapshots(next[targetKey], next[aliasKey], targetId);
      if (typeof selected === 'string') next[targetKey] = selected;
      delete next[aliasKey];
    });
  }

  const activeChildId = resolveAlias(aliases, metadata.activeChildId);
  next[CLOUD_CHILD_STATE_KEY] = JSON.stringify({
    ...metadata,
    profiles: mergeChildProfiles(mappedProfiles, [], metadata.deletedChildren),
    activeChildId
  });
  return next;
}

function buildCanonicalProfileMap(profiles = [], aliases = new Map()) {
  const canonicalProfiles = new Map();
  profiles.forEach(profile => {
    const targetId = resolveAlias(aliases, profile.id);
    if (!canonicalProfiles.has(targetId) || profile.id === targetId) canonicalProfiles.set(targetId, profile);
  });
  return canonicalProfiles;
}

function chooseCanonicalChildProfile(profiles = [], localPayload = {}, cloudPayload = {}) {
  return [...profiles].sort((left, right) => {
    const leftCreatedAt = parseTimestamp(left.createdAt);
    const rightCreatedAt = parseTimestamp(right.createdAt);
    if (leftCreatedAt && rightCreatedAt && leftCreatedAt !== rightCreatedAt) return leftCreatedAt - rightCreatedAt;
    if (leftCreatedAt !== rightCreatedAt) return leftCreatedAt ? -1 : 1;
    const leftScore = Math.max(snapshotScoreForChild(localPayload, left.id), snapshotScoreForChild(cloudPayload, left.id));
    const rightScore = Math.max(snapshotScoreForChild(localPayload, right.id), snapshotScoreForChild(cloudPayload, right.id));
    if (leftScore !== rightScore) return rightScore - leftScore;
    return String(left.id).localeCompare(String(right.id));
  })[0] || null;
}

function buildProfileReconciliation(localPayload = {}, cloudPayload = {}, options = {}) {
  const localMeta = parseObject(localPayload[CLOUD_CHILD_STATE_KEY]);
  const cloudMeta = parseObject(cloudPayload[CLOUD_CHILD_STATE_KEY]);
  const deletedChildren = mergeDeletedChildren(localMeta.deletedChildren, cloudMeta.deletedChildren);
  const localProfiles = listProfiles(localMeta, deletedChildren);
  const cloudProfiles = listProfiles(cloudMeta, deletedChildren);
  const localUnique = buildUniqueIdentityMap(localProfiles);
  const cloudUnique = buildUniqueIdentityMap(cloudProfiles);
  const aliases = new Map();

  for (const [identity, localProfile] of localUnique) {
    const cloudProfile = cloudUnique.get(identity);
    if (cloudProfile && localProfile.id !== cloudProfile.id) aliases.set(localProfile.id, cloudProfile.id);
  }

  const combinedProfiles = new Map([...cloudProfiles, ...localProfiles].map(profile => [profile.id, profile]));
  const identityGroups = new Map();
  [...combinedProfiles.values()].forEach(profile => {
    const identity = getChildProfileIdentity(profile);
    const resolvedId = resolveAlias(aliases, profile.id);
    if (!identity || resolvedId !== profile.id) return;
    const group = identityGroups.get(identity) || [];
    group.push(profile);
    identityGroups.set(identity, group);
  });
  identityGroups.forEach(group => {
    if (group.length < 2) return;
    const canonical = chooseCanonicalChildProfile(group, localPayload, cloudPayload);
    group.forEach(profile => {
      if (canonical && profile.id !== canonical.id) aliases.set(profile.id, canonical.id);
    });
  });

  const reconciliationAt = Date.now();
  const reconciledDeletedChildren = { ...deletedChildren };
  aliases.forEach((targetId, aliasId) => {
    if (resolveAlias(aliases, aliasId) !== aliasId) {
      reconciledDeletedChildren[aliasId] = Math.max(reconciledDeletedChildren[aliasId] || 0, reconciliationAt);
    }
  });
  const canonicalProfiles = buildCanonicalProfileMap([...localProfiles, ...cloudProfiles], aliases);
  const local = remapPayloadProfiles(localPayload, {
    ...localMeta,
    deletedChildren: reconciledDeletedChildren
  }, aliases, canonicalProfiles);
  const cloud = remapPayloadProfiles(cloudPayload, {
    ...cloudMeta,
    deletedChildren: reconciledDeletedChildren
  }, aliases, canonicalProfiles);
  const dirtyChildIds = new Set((options.dirtyChildIds || [])
    .filter(Boolean)
    .map(childId => resolveAlias(aliases, childId)));

  new Set([...aliases.values()].map(childId => resolveAlias(aliases, childId))).forEach(targetId => {
    [CHILD_SNAPSHOT_PREFIX, CHILD_ORIGINAL_SNAPSHOT_PREFIX].forEach(prefix => {
      const targetKey = `${prefix}${targetId}`;
      const selected = mergeLearningSnapshots(cloud[targetKey], local[targetKey], targetId);
      if (typeof selected === 'string') local[targetKey] = selected;
    });
    dirtyChildIds.add(targetId);
  });

  return {
    local,
    cloud,
    dirtyChildIds,
    localActiveChildId: resolveAlias(aliases, options.localActiveChildId || localMeta.activeChildId),
    aliases
  };
}

export function hasRecoverableChildProfileDuplicates(payload = {}) {
  const metadata = parseObject(payload[CLOUD_CHILD_STATE_KEY]);
  const deletedChildren = normalizeDeletedChildren(metadata.deletedChildren);
  const profiles = listProfiles(metadata, deletedChildren);
  const identities = new Set();
  return profiles.some(profile => {
    const identity = getChildProfileIdentity(profile);
    if (!identity) return false;
    if (identities.has(identity)) return true;
    identities.add(identity);
    return false;
  });
}

export function hasRecoverableActiveProfileDuplicate(payload = {}) {
  return hasRecoverableChildProfileDuplicates(payload);
}

export function recoverOrphanedCloudOutbox(localPayload = {}, cloudPayload = {}, options = {}) {
  const pending = Boolean(options.pending);
  const dirtyChildIds = [...new Set((options.dirtyChildIds || []).map(String).filter(Boolean))];
  const base = {
    dirtyChildIds,
    recovered: false,
    clearPending: false,
    reconcileChildIdentity: false
  };
  if (!pending || dirtyChildIds.length) return base;

  const local = isObject(localPayload) ? localPayload : {};
  const cloud = isObject(cloudPayload) ? cloudPayload : {};
  const localMeta = parseObject(local[CLOUD_CHILD_STATE_KEY]);
  const cloudMeta = parseObject(cloud[CLOUD_CHILD_STATE_KEY]);
  const localDeletedChildren = normalizeDeletedChildren(localMeta.deletedChildren);
  const cloudDeletedChildren = normalizeDeletedChildren(cloudMeta.deletedChildren);
  const localProfiles = listProfiles(localMeta, localDeletedChildren);
  const cloudProfiles = listProfiles(cloudMeta, cloudDeletedChildren);
  const requestedChildId = String(options.localActiveChildId || localMeta.activeChildId || '').trim();
  const activeProfile = localProfiles.find(profile => profile.id === requestedChildId) || localProfiles[0] || null;

  // A pending marker without a child-level outbox can be left behind by an
  // interrupted older client. It must not block a meaningful cloud snapshot
  // forever, but a recoverable local learner still deserves one conservative
  // merge attempt before the marker is cleared.
  if (!activeProfile) return { ...base, clearPending: true };
  const activeChildId = activeProfile.id;
  const localSnapshot = chooseRicherSnapshot(
    local[`${CHILD_SNAPSHOT_PREFIX}${activeChildId}`],
    local[`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${activeChildId}`]
  );
  const localEvidence = getLearningSnapshotEvidenceScore(localSnapshot);
  const cloudHasData = Object.keys(cloud).length > 0;
  if (cloudHasData && localEvidence <= 0) return { ...base, clearPending: true };

  const localIdentity = getChildProfileIdentity(activeProfile);
  const matchingCloudProfile = localIdentity
    ? cloudProfiles.find(profile => getChildProfileIdentity(profile) === localIdentity)
    : null;
  return {
    dirtyChildIds: [activeChildId],
    recovered: true,
    clearPending: false,
    reconcileChildIdentity: Boolean(matchingCloudProfile && matchingCloudProfile.id !== activeChildId)
  };
}

function isRootLearningProjectionKey(key = '') {
  return String(key).startsWith('jannati')
    && key !== CHILD_PROFILES_KEY
    && key !== ACTIVE_CHILD_KEY
    && key !== DELETED_CHILDREN_KEY
    && key !== CLOUD_CHILD_STATE_KEY
    && key !== CLOUD_SYNC_META_KEY
    && !key.startsWith(CHILD_SNAPSHOT_PREFIX)
    && !key.startsWith(CHILD_ORIGINAL_SNAPSHOT_PREFIX)
    && !key.startsWith(CHILD_MERGED_BACKUP_PREFIX);
}

function rootProjectionMatchesChild(payload = {}, childId = '') {
  const metadata = parseObject(payload[CLOUD_CHILD_STATE_KEY]);
  const childProfile = listProfiles(metadata, normalizeDeletedChildren(metadata.deletedChildren))
    .find(profile => profile.id === childId);
  const rootProfile = parseObject(payload.jannati_v151_profile);
  const childIdentity = getChildProfileIdentity(childProfile);
  const rootIdentity = getChildProfileIdentity(rootProfile);
  return !childIdentity || !rootIdentity || childIdentity === rootIdentity;
}

/**
 * Keep the account-level learning surface and its active child snapshot as one
 * monotonic projection. Older clients stored both copies independently, so a
 * newer revision could still contain lower XP in one copy and overwrite the
 * richer copy during hydration.
 */
export function normalizeActiveLearningProjection(payload = {}, activeChildId = '', options = {}) {
  const childId = String(activeChildId || '').trim();
  const next = isObject(payload) ? { ...payload } : {};
  if (!childId) return next;

  const snapshotKey = `${CHILD_SNAPSHOT_PREFIX}${childId}`;
  const originalSnapshotKey = `${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${childId}`;
  const combinedRaw = mergeLearningSnapshots(next[snapshotKey], next[originalSnapshotKey], childId);
  const combined = parseObject(combinedRaw);
  let hasLearningData = Object.keys(combined).some(key => !key.startsWith('__'));

  if (options.mergeRoot !== false && rootProjectionMatchesChild(next, childId)) {
    Object.entries(next).forEach(([key, value]) => {
      if (!isRootLearningProjectionKey(key) || typeof value !== 'string') return;
      combined[key] = mergeStoredLearningValue(combined[key], value, key);
      hasLearningData = true;
    });
  }
  if (!hasLearningData) return next;

  const accountId = combined.__childSnapshotAccountId || '';
  const deviceId = combined.__childSnapshotDeviceId || '';
  const normalizedSnapshot = {
    ...combined,
    __childSnapshotChildId: childId,
    __childSnapshotCapturedAt: parseTimestamp(combined.__childSnapshotCapturedAt) || Date.now(),
    ...(accountId ? { __childSnapshotAccountId: accountId } : {}),
    ...(deviceId ? { __childSnapshotDeviceId: deviceId } : {})
  };
  const normalizedRaw = JSON.stringify(normalizedSnapshot);
  next[snapshotKey] = normalizedRaw;

  // Root learning keys are only a view of the selected child. Remove the old
  // projection first so data from another active child cannot leak through.
  Object.keys(next).forEach(key => {
    if (isRootLearningProjectionKey(key)) delete next[key];
  });
  Object.entries(normalizedSnapshot).forEach(([key, value]) => {
    if (!key.startsWith('__') && typeof value === 'string') next[key] = value;
  });
  return next;
}

export function recoverMonotonicCloudGap(localPayload = {}, cloudPayload = {}, options = {}) {
  const base = {
    dirtyChildIds: [],
    recovered: false,
    reconcileChildIdentity: false
  };
  const local = isObject(localPayload) ? localPayload : {};
  const cloud = isObject(cloudPayload) ? cloudPayload : {};
  const localMeta = parseObject(local[CLOUD_CHILD_STATE_KEY]);
  const cloudMeta = parseObject(cloud[CLOUD_CHILD_STATE_KEY]);
  const localProfiles = listProfiles(localMeta, normalizeDeletedChildren(localMeta.deletedChildren));
  const cloudProfiles = listProfiles(cloudMeta, normalizeDeletedChildren(cloudMeta.deletedChildren));
  const localActiveChildId = String(options.localActiveChildId || localMeta.activeChildId || '').trim();
  const localProfile = localProfiles.find(profile => profile.id === localActiveChildId);
  if (!localProfile) return base;

  let cloudProfile = cloudProfiles.find(profile => profile.id === localProfile.id) || null;
  if (!cloudProfile) {
    const identity = getChildProfileIdentity(localProfile);
    const identityMatches = identity
      ? cloudProfiles.filter(profile => getChildProfileIdentity(profile) === identity)
      : [];
    if (identityMatches.length === 1) cloudProfile = identityMatches[0];
  }
  if (!cloudProfile) return base;

  const normalizedLocal = normalizeActiveLearningProjection(local, localProfile.id);
  const normalizedCloud = normalizeActiveLearningProjection(cloud, cloudProfile.id);
  const localRaw = normalizedLocal[`${CHILD_SNAPSHOT_PREFIX}${localProfile.id}`];
  const cloudRaw = normalizedCloud[`${CHILD_SNAPSHOT_PREFIX}${cloudProfile.id}`];
  const mergedRaw = mergeLearningSnapshots(cloudRaw, rewriteSnapshotChildId(localRaw, cloudProfile.id), cloudProfile.id);
  if (getLearningSnapshotEvidenceScore(mergedRaw) <= getLearningSnapshotEvidenceScore(cloudRaw)) return base;

  return {
    dirtyChildIds: [localProfile.id],
    recovered: true,
    reconcileChildIdentity: localProfile.id !== cloudProfile.id
  };
}

function mergeChildProfiles(localProfiles = [], cloudProfiles = [], deletedChildren = {}) {
  const merged = new Map();
  for (const profile of Array.isArray(cloudProfiles) ? cloudProfiles : []) {
    if (profile?.id) merged.set(profile.id, profile);
  }
  for (const profile of Array.isArray(localProfiles) ? localProfiles : []) {
    if (!profile?.id) continue;
    const cloudProfile = merged.get(profile.id);
    if (!cloudProfile || profileTimestamp(profile) >= profileTimestamp(cloudProfile)) merged.set(profile.id, profile);
  }
  return [...merged.values()].filter(profile => !deletedChildren[profile.id]);
}

function chooseSnapshot(localRaw, cloudRaw, preferLocal) {
  if (typeof localRaw !== 'string') return cloudRaw;
  if (typeof cloudRaw !== 'string') return localRaw;
  const localScore = getLearningSnapshotEvidenceScore(localRaw);
  const cloudScore = getLearningSnapshotEvidenceScore(cloudRaw);
  // A newly-created empty local surface must never erase meaningful cloud
  // learning, including immediately after a duplicate child is deleted.
  if (localScore <= 0 && cloudScore > 0) return cloudRaw;
  if (preferLocal) return localRaw;
  if (cloudScore <= 0) return localRaw;
  const localTimestamp = getLearningSnapshotTimestamp(localRaw);
  const cloudTimestamp = getLearningSnapshotTimestamp(cloudRaw);
  if (localTimestamp > cloudTimestamp && localScore >= cloudScore * 0.35) return localRaw;
  return cloudRaw;
}

export function mergeCloudLearningPayload(localPayload = {}, cloudPayload = {}, options = {}) {
  let local = isObject(localPayload) ? localPayload : {};
  let cloud = isObject(cloudPayload) ? cloudPayload : {};
  const initialLocalMeta = parseObject(local[CLOUD_CHILD_STATE_KEY]);
  const initialCloudMeta = parseObject(cloud[CLOUD_CHILD_STATE_KEY]);
  local = normalizeActiveLearningProjection(
    local,
    options.localActiveChildId || initialLocalMeta.activeChildId || listProfiles(initialLocalMeta)[0]?.id
  );
  cloud = normalizeActiveLearningProjection(
    cloud,
    initialCloudMeta.activeChildId || listProfiles(initialCloudMeta)[0]?.id
  );
  let dirtyChildIds = new Set((options.dirtyChildIds || []).filter(Boolean).map(String));
  let localActiveChildId = options.localActiveChildId;
  if (options.reconcileChildIdentity) {
    const reconciled = buildProfileReconciliation(local, cloud, options);
    local = reconciled.local;
    cloud = reconciled.cloud;
    dirtyChildIds = reconciled.dirtyChildIds;
    localActiveChildId = reconciled.localActiveChildId;
  }
  const localMeta = parseObject(local[CLOUD_CHILD_STATE_KEY]);
  const cloudMeta = parseObject(cloud[CLOUD_CHILD_STATE_KEY]);
  const deletedChildren = mergeDeletedChildren(localMeta.deletedChildren, cloudMeta.deletedChildren);
  const profiles = mergeChildProfiles(localMeta.profiles, cloudMeta.profiles, deletedChildren);
  const requestedActiveId = String(localActiveChildId || localMeta.activeChildId || '').trim();
  const activeChildId = [requestedActiveId, cloudMeta.activeChildId, profiles[0]?.id]
    .find(id => id && profiles.some(profile => profile.id === id)) || '';
  const merged = { ...cloud, ...local };

  const snapshotKeys = new Set([
    ...Object.keys(cloud).filter(key => childIdFromSnapshotKey(key)),
    ...Object.keys(local).filter(key => childIdFromSnapshotKey(key))
  ]);
  snapshotKeys.forEach(key => {
    const childId = childIdFromSnapshotKey(key);
    if (!childId || deletedChildren[childId]) {
      delete merged[key];
      return;
    }
    const selected = dirtyChildIds.has(childId) && options.mergeDirtySnapshots
      ? mergeConcurrentLearningSnapshots(cloud[key], local[key], childId)
      : chooseSnapshot(local[key], cloud[key], dirtyChildIds.has(childId));
    if (typeof selected === 'string') merged[key] = selected;
    else delete merged[key];
  });

  merged[CLOUD_CHILD_STATE_KEY] = JSON.stringify({
    version: CLOUD_SYNC_VERSION,
    profiles,
    activeChildId,
    deletedChildren
  });
  merged[CHILD_PROFILES_KEY] = JSON.stringify(profiles);
  merged[ACTIVE_CHILD_KEY] = activeChildId;
  merged[DELETED_CHILDREN_KEY] = JSON.stringify(deletedChildren);

  merged[CLOUD_SYNC_META_KEY] = JSON.stringify({
    version: CLOUD_SYNC_VERSION,
    activeChildId,
    deviceId: String(options.deviceId || '').trim() || null,
    updatedAt: new Date().toISOString()
  });
  return normalizeActiveLearningProjection(merged, activeChildId, { mergeRoot: false });
}

function normalizeEnvelope(value = {}) {
  const envelope = isObject(value) ? value : {};
  return {
    data: isObject(envelope.payload) ? envelope.payload : {},
    revision: Number.isFinite(Number(envelope.revision)) ? Number(envelope.revision) : 0,
    protocolVersion: Number(envelope.protocolVersion) || 0,
    serverUpdatedAt: String(envelope.serverUpdatedAt || ''),
    error: null
  };
}

function isMissingRevisionedRpc(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || error || '');
  return code === 'PGRST202' || code === '42883' || /get_learning_data_v3|schema cache|does not exist/i.test(message);
}

function createOperationId() {
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, token => {
      const value = Math.floor(Math.random() * 16);
      return (token === 'x' ? value : (value & 0x3) | 0x8).toString(16);
    });
  }
}

export async function loadCloudLearningDataResult(client) {
  if (!client) return { data: null, revision: 0, protocolVersion: 0, serverUpdatedAt: '', error: new Error('cloud_client_unavailable') };
  try {
    const revisioned = await client.rpc('get_learning_data_v3');
    if (!revisioned?.error) return normalizeEnvelope(revisioned?.data);
    if (!isMissingRevisionedRpc(revisioned.error)) {
      return { data: null, revision: 0, protocolVersion: 0, serverUpdatedAt: '', error: revisioned.error };
    }

    // Read-only compatibility allows a coordinated rollout without risking a
    // blind legacy write. The client keeps mutations pending until migration
    // v3 is available on the linked Supabase project.
    const legacy = await client.rpc('get_learning_data');
    if (legacy?.error) return { data: null, revision: 0, protocolVersion: 0, serverUpdatedAt: '', error: legacy.error };
    return {
      data: isObject(legacy?.data) ? legacy.data : {},
      revision: 0,
      protocolVersion: 2,
      serverUpdatedAt: '',
      error: null
    };
  } catch (error) {
    return { data: null, revision: 0, protocolVersion: 0, serverUpdatedAt: '', error };
  }
}

export async function loadCloudLearningData(client) {
  const result = await loadCloudLearningDataResult(client);
  return result.error ? null : result.data;
}

export async function saveRevisionedCloudLearningData(client, {
  payload = {},
  expectedRevision = 0,
  operationId = createOperationId(),
  deviceId = '',
  dirtyChildIds = []
} = {}) {
  if (!client || !isObject(payload)) {
    return { ok: false, conflict: false, error: new Error('invalid_revisioned_sync_request') };
  }
  try {
    const { data, error } = await client.rpc('save_learning_data_v3', {
      payload,
      expected_revision: Number(expectedRevision) || 0,
      operation_id: operationId,
      device_id: String(deviceId || ''),
      dirty_child_ids: [...new Set((dirtyChildIds || []).map(String).filter(Boolean))]
    });
    if (error) return { ok: false, conflict: false, error };
    const result = isObject(data) ? data : {};
    return {
      ok: Boolean(result.ok),
      conflict: Boolean(result.conflict),
      duplicate: Boolean(result.duplicate),
      payload: isObject(result.payload) ? result.payload : {},
      revision: Number(result.revision) || 0,
      serverUpdatedAt: String(result.serverUpdatedAt || ''),
      operationId,
      error: null
    };
  } catch (error) {
    return { ok: false, conflict: false, operationId, error };
  }
}

export async function syncRevisionedCloudLearning(client, localPayload = {}, options = {}) {
  const maxAttempts = Math.max(1, Math.min(5, Number(options.maxAttempts) || 4));
  let envelope = options.cloudEnvelope || await loadCloudLearningDataResult(client);
  if (envelope.error) return { ok: false, conflict: false, error: envelope.error };
  if (envelope.protocolVersion < CLOUD_SYNC_PROTOCOL_VERSION) {
    return {
      ok: false,
      conflict: false,
      protocolVersion: envelope.protocolVersion,
      error: new Error('cloud_sync_migration_required')
    };
  }

  let conflictCount = 0;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const payload = mergeCloudLearningPayload(localPayload, envelope.data, {
      ...options,
      mergeDirtySnapshots: true
    });
    const result = await saveRevisionedCloudLearningData(client, {
      payload,
      expectedRevision: envelope.revision,
      operationId: createOperationId(),
      deviceId: options.deviceId,
      dirtyChildIds: options.dirtyChildIds
    });
    if (result.ok) {
      return {
        ...result,
        payload: result.payload,
        protocolVersion: CLOUD_SYNC_PROTOCOL_VERSION,
        conflictCount
      };
    }
    if (!result.conflict) return { ...result, conflictCount };
    conflictCount += 1;
    envelope = {
      data: result.payload,
      revision: result.revision,
      protocolVersion: CLOUD_SYNC_PROTOCOL_VERSION,
      serverUpdatedAt: result.serverUpdatedAt,
      error: null
    };
  }
  return {
    ok: false,
    conflict: true,
    conflictCount,
    error: new Error('cloud_sync_conflict_retry_exhausted')
  };
}

// Kept only for legacy imports. Application writes must use the revisioned
// coordinator above so an older device can never blindly replace cloud data.
export async function saveCloudLearningData() {
  return false;
}
