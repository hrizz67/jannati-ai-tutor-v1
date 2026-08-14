export const CHILD_SNAPSHOT_PREFIX = 'jannati_child_snapshot:';
export const CHILD_ORIGINAL_SNAPSHOT_PREFIX = 'jannati_child_original_snapshot:';
export const CLOUD_CHILD_STATE_KEY = 'jannati_cloud_child_state';
export const CLOUD_SYNC_META_KEY = 'jannati_cloud_sync_meta';
export const CLOUD_SYNC_VERSION = 2;

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
  const local = isObject(localPayload) ? localPayload : {};
  const cloud = isObject(cloudPayload) ? cloudPayload : {};
  const dirtyChildIds = new Set((options.dirtyChildIds || []).filter(Boolean).map(String));
  const localMeta = parseObject(local[CLOUD_CHILD_STATE_KEY]);
  const cloudMeta = parseObject(cloud[CLOUD_CHILD_STATE_KEY]);
  const deletedChildren = mergeDeletedChildren(localMeta.deletedChildren, cloudMeta.deletedChildren);
  const profiles = mergeChildProfiles(localMeta.profiles, cloudMeta.profiles, deletedChildren);
  const requestedActiveId = String(options.localActiveChildId || localMeta.activeChildId || '').trim();
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
