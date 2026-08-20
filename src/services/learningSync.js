export const CHILD_SNAPSHOT_PREFIX = 'jannati_child_snapshot:';
export const CHILD_ORIGINAL_SNAPSHOT_PREFIX = 'jannati_child_original_snapshot:';
export const CLOUD_CHILD_STATE_KEY = 'jannati_cloud_child_state';
export const CLOUD_SYNC_META_KEY = 'jannati_cloud_sync_meta';
export const CLOUD_SYNC_VERSION = 2;

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

function getProfileIdentity(profile = {}) {
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
    const identity = getProfileIdentity(profile);
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
  if (firstScore !== secondScore) return firstScore > secondScore ? firstRaw : secondRaw;
  return getLearningSnapshotTimestamp(firstRaw) >= getLearningSnapshotTimestamp(secondRaw) ? firstRaw : secondRaw;
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

function remapPayloadProfiles(payload = {}, metadata = {}, aliases = new Map(), canonicalProfiles = new Map()) {
  const next = { ...payload };
  const mappedProfiles = listProfiles(metadata).map(profile => {
    const targetId = resolveAlias(aliases, profile.id);
    if (targetId === profile.id) return profile;
    const canonical = canonicalProfiles.get(targetId);
    return canonical ? { ...profile, ...canonical, id: targetId } : { ...profile, id: targetId };
  });

  for (const [aliasId, targetId] of aliases) {
    [CHILD_SNAPSHOT_PREFIX, CHILD_ORIGINAL_SNAPSHOT_PREFIX].forEach(prefix => {
      const aliasKey = `${prefix}${aliasId}`;
      const targetKey = `${prefix}${targetId}`;
      const selected = chooseRicherSnapshot(next[aliasKey], next[targetKey]);
      if (typeof selected === 'string') next[targetKey] = rewriteSnapshotChildId(selected, targetId);
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

  // Repair the already-corrupted shape produced by older releases: a newer,
  // empty duplicate is active while the same named/year profile still owns the
  // learning history. Only an evidence-free active duplicate is auto-collapsed.
  const requestedActiveId = String(options.localActiveChildId || localMeta.activeChildId || cloudMeta.activeChildId || '').trim();
  const resolvedActiveId = resolveAlias(aliases, requestedActiveId);
  const combinedProfiles = new Map([...cloudProfiles, ...localProfiles].map(profile => [profile.id, profile]));
  const activeProfile = combinedProfiles.get(resolvedActiveId);
  const activeIdentity = getProfileIdentity(activeProfile);
  const activeScore = Math.max(
    snapshotScoreForChild(localPayload, resolvedActiveId),
    snapshotScoreForChild(cloudPayload, resolvedActiveId)
  );
  if (activeIdentity && activeScore === 0) {
    const candidates = [...combinedProfiles.values()]
      .filter(profile => profile.id !== resolvedActiveId && getProfileIdentity(profile) === activeIdentity)
      .map(profile => ({
        profile,
        score: Math.max(snapshotScoreForChild(localPayload, profile.id), snapshotScoreForChild(cloudPayload, profile.id))
      }))
      .filter(candidate => candidate.score > 0)
      .sort((left, right) => right.score - left.score);
    if (candidates.length === 1 || candidates[0]?.score > candidates[1]?.score) {
      aliases.set(resolvedActiveId, resolveAlias(aliases, candidates[0].profile.id));
    }
  }

  const canonicalProfiles = buildCanonicalProfileMap([...localProfiles, ...cloudProfiles], aliases);
  const local = remapPayloadProfiles(localPayload, localMeta, aliases, canonicalProfiles);
  const cloud = remapPayloadProfiles(cloudPayload, cloudMeta, aliases, canonicalProfiles);
  const dirtyChildIds = new Set((options.dirtyChildIds || [])
    .filter(Boolean)
    .map(childId => resolveAlias(aliases, childId)));

  // A meaningful Premium snapshot must not be replaced by an empty anonymous
  // snapshot merely because the anonymous profile was marked dirty at login.
  for (const [aliasId, targetId] of aliases) {
    const localScore = Math.max(snapshotScoreForChild(local, targetId), snapshotScoreForChild(localPayload, aliasId));
    const cloudScore = snapshotScoreForChild(cloud, targetId);
    if (cloudScore > localScore) {
      dirtyChildIds.delete(targetId);
      [CHILD_SNAPSHOT_PREFIX, CHILD_ORIGINAL_SNAPSHOT_PREFIX].forEach(prefix => {
        const targetKey = `${prefix}${targetId}`;
        if (getLearningSnapshotEvidenceScore(cloud[targetKey]) > getLearningSnapshotEvidenceScore(local[targetKey])) {
          delete local[targetKey];
        }
      });
    }
  }

  return {
    local,
    cloud,
    dirtyChildIds,
    localActiveChildId: resolveAlias(aliases, options.localActiveChildId || localMeta.activeChildId),
    aliases
  };
}

export function hasRecoverableActiveProfileDuplicate(payload = {}) {
  const metadata = parseObject(payload[CLOUD_CHILD_STATE_KEY]);
  const deletedChildren = normalizeDeletedChildren(metadata.deletedChildren);
  const profiles = listProfiles(metadata, deletedChildren);
  const activeProfile = profiles.find(profile => profile.id === metadata.activeChildId);
  const identity = getProfileIdentity(activeProfile);
  if (!identity || snapshotScoreForChild(payload, activeProfile.id) > 0) return false;
  return profiles.some(profile => profile.id !== activeProfile.id
    && getProfileIdentity(profile) === identity
    && snapshotScoreForChild(payload, profile.id) > 0);
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
  if (preferLocal && typeof localRaw === 'string') return localRaw;
  if (typeof localRaw !== 'string') return cloudRaw;
  if (typeof cloudRaw !== 'string') return localRaw;
  const localTimestamp = getLearningSnapshotTimestamp(localRaw);
  const cloudTimestamp = getLearningSnapshotTimestamp(cloudRaw);
  if (localTimestamp > cloudTimestamp) return localRaw;
  return cloudRaw;
}

export function mergeCloudLearningPayload(localPayload = {}, cloudPayload = {}, options = {}) {
  let local = isObject(localPayload) ? localPayload : {};
  let cloud = isObject(cloudPayload) ? cloudPayload : {};
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
    const selected = chooseSnapshot(local[key], cloud[key], dirtyChildIds.has(childId));
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

  const activeSnapshot = chooseRicherSnapshot(
    merged[`${CHILD_SNAPSHOT_PREFIX}${activeChildId}`],
    merged[`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${activeChildId}`]
  );
  Object.entries(parseObject(activeSnapshot)).forEach(([key, value]) => {
    if (!key.startsWith('__') && typeof value === 'string') merged[key] = value;
  });
  merged[CLOUD_SYNC_META_KEY] = JSON.stringify({
    version: CLOUD_SYNC_VERSION,
    activeChildId,
    deviceId: String(options.deviceId || '').trim() || null,
    updatedAt: new Date().toISOString()
  });
  return merged;
}

export async function loadCloudLearningDataResult(client) {
  if (!client) return { data: null, error: new Error('cloud_client_unavailable') };
  try {
    const { data, error } = await client.rpc('get_learning_data');
    if (error) return { data: null, error };
    return { data: isObject(data) ? data : {}, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function loadCloudLearningData(client) {
  const result = await loadCloudLearningDataResult(client);
  return result.error ? null : result.data;
}

export async function saveCloudLearningData(client, payload = {}) {
  if (!client || !payload || typeof payload !== 'object') return false;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { error } = await client.rpc('save_learning_data', { payload });
      if (!error) return true;
    } catch {
      // Retry once for a transient mobile/network failure.
    }
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  return false;
}
