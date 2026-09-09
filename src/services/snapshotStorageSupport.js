import {
  CHILD_ORIGINAL_SNAPSHOT_PREFIX,
  CHILD_SNAPSHOT_PREFIX
} from './learningSync.js';
import {
  ACCOUNT_SNAPSHOT_PREFIX,
  LAST_RESTORE_DIAGNOSTIC_KEY,
  estimateStorageBytes,
  isSnapshotCacheKey,
  normalizeStorageId,
  safeStorageRemove,
  safeStorageSet
} from './localSnapshotStorage.js';

const CHILD_PROFILES_KEY = 'jannati_child_profiles';
const ACTIVE_CHILD_KEY = 'jannati_active_child_id';

export function parseStorageObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return { ok: true, value };
  if (typeof value !== 'string' || !value.trim()) return { ok: false, value: null };
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? { ok: true, value: parsed }
      : { ok: false, value: null };
  } catch {
    return { ok: false, value: null };
  }
}

export function parseStorageArray(value) {
  if (Array.isArray(value)) return { ok: true, value };
  if (typeof value !== 'string' || !value.trim()) return { ok: false, value: null };
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? { ok: true, value: parsed } : { ok: false, value: null };
  } catch {
    return { ok: false, value: null };
  }
}

export function getSnapshotChildId(key = '') {
  if (key.startsWith(CHILD_SNAPSHOT_PREFIX)) return key.slice(CHILD_SNAPSHOT_PREFIX.length);
  if (key.startsWith(CHILD_ORIGINAL_SNAPSHOT_PREFIX)) return key.slice(CHILD_ORIGINAL_SNAPSHOT_PREFIX.length);
  return '';
}

export function isReplaceableSnapshotCacheKey(key = '') {
  return key.startsWith(CHILD_SNAPSHOT_PREFIX)
    || key.startsWith(CHILD_ORIGINAL_SNAPSHOT_PREFIX)
    || key.startsWith(ACCOUNT_SNAPSHOT_PREFIX);
}

export function listStorageKeys(storage) {
  if (!storage || typeof storage.key !== 'function') {
    return { ok: false, keys: [], reason: 'storage_unavailable', errorName: 'StorageUnavailableError' };
  }
  try {
    const keys = [];
    for (let index = 0; index < Number(storage.length || 0); index += 1) {
      const key = storage.key(index);
      if (key) keys.push(key);
    }
    return { ok: true, keys, reason: 'ok', errorName: '' };
  } catch (error) {
    return { ok: false, keys: [], reason: 'write_failed', errorName: String(error?.name || 'Error') };
  }
}

export function pruneForeignAccountSnapshots(storage, currentAccountId = '') {
  const accountId = normalizeStorageId(currentAccountId);
  const listed = listStorageKeys(storage);
  if (!listed.ok || !accountId) return { ok: listed.ok, removedKeys: [], reason: listed.reason, errorName: listed.errorName };
  const removedKeys = [];
  let failure = null;
  listed.keys.forEach(key => {
    if (!key.startsWith(ACCOUNT_SNAPSHOT_PREFIX)) return;
    const owner = normalizeStorageId(key.slice(ACCOUNT_SNAPSHOT_PREFIX.length));
    if (!owner || owner === accountId) return;
    const result = safeStorageRemove(storage, key);
    if (result.ok) removedKeys.push(key);
    else failure ||= result;
  });
  return failure
    ? { ok: false, removedKeys, reason: failure.reason, errorName: failure.errorName }
    : { ok: true, removedKeys, reason: 'ok', errorName: '' };
}

export function shouldBlockEmptyCloudWrite({ serverProfileCount = 0, localProfileCount = 0, activeStatePersisted = true } = {}) {
  return Number(serverProfileCount) > 0 && (!activeStatePersisted || Number(localProfileCount) <= 0);
}

export function persistRestoreDiagnostic(storage, diagnostic) {
  const safe = {
    timestamp: new Date().toISOString(),
    accountId: normalizeStorageId(diagnostic.accountId),
    hydrated: Boolean(diagnostic.hydrated),
    activeStatePersisted: Boolean(diagnostic.activeStatePersisted),
    cachePersisted: Boolean(diagnostic.snapshotPersisted),
    reason: String(diagnostic.reason || 'unknown'),
    failedKey: String(diagnostic.failedKey || ''),
    profileCount: Number(diagnostic.profiles?.length || 0),
    orphanSnapshotCount: Number(diagnostic.orphanSnapshotKeys?.length || 0)
  };
  safeStorageSet(storage, LAST_RESTORE_DIAGNOSTIC_KEY, safe);
  return safe;
}

function declaredSnapshotAccount(raw) {
  const parsed = parseStorageObject(raw);
  return parsed.ok ? normalizeStorageId(parsed.value.__childSnapshotAccountId) : '';
}

export function createLocalSnapshotDiagnostics(storage, currentAccountId = '') {
  const accountId = normalizeStorageId(currentAccountId);
  const listed = listStorageKeys(storage);
  if (!listed.ok) return { ok: false, accountId, reason: listed.reason, errorName: listed.errorName, totalEstimatedBytes: 0, keys: [] };
  const profileIds = new Set();
  try {
    const profiles = JSON.parse(storage.getItem(CHILD_PROFILES_KEY) || '[]');
    if (Array.isArray(profiles)) profiles.forEach(profile => profileIds.add(normalizeStorageId(profile?.id)));
  } catch { /* Invalid metadata is represented by an empty profile set. */ }
  const keys = listed.keys.filter(key => key.startsWith('jannati')).map(key => {
    let raw = '';
    try { raw = String(storage.getItem(key) || ''); } catch { raw = ''; }
    const childId = getSnapshotChildId(key);
    const owner = key.startsWith(ACCOUNT_SNAPSHOT_PREFIX)
      ? normalizeStorageId(key.slice(ACCOUNT_SNAPSHOT_PREFIX.length))
      : declaredSnapshotAccount(raw);
    return {
      key,
      estimatedBytes: estimateStorageBytes(key, raw),
      owner: owner || null,
      childId: childId || null,
      orphan: Boolean(childId && !profileIds.has(childId))
    };
  }).sort((left, right) => right.estimatedBytes - left.estimatedBytes);
  let lastRestore = null;
  try { lastRestore = JSON.parse(storage.getItem(LAST_RESTORE_DIAGNOSTIC_KEY) || 'null'); } catch { lastRestore = null; }
  return {
    ok: true,
    accountId,
    activeChildId: (() => { try { return normalizeStorageId(storage.getItem(ACTIVE_CHILD_KEY)); } catch { return ''; } })(),
    totalEstimatedBytes: keys.reduce((sum, item) => sum + item.estimatedBytes, 0),
    snapshotKeyCount: keys.filter(item => isSnapshotCacheKey(item.key)).length,
    orphanSnapshotCount: keys.filter(item => item.orphan).length,
    keys,
    lastRestore
  };
}

export function shouldLoadStudentLearningForRoute(hash = '') {
  return !['#/admin', '#/admin/premium'].includes(String(hash || '').trim());
}
