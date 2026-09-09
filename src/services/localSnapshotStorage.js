import {
  CHILD_MERGED_BACKUP_PREFIX,
  CHILD_ORIGINAL_SNAPSHOT_PREFIX,
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  CLOUD_SYNC_META_KEY
} from './learningSync.js';

export const ACCOUNT_SNAPSHOT_PREFIX = 'jannati_account_snapshot:';
export const LAST_RESTORE_DIAGNOSTIC_KEY = 'jannati_last_restore_diagnostic_v1';
export const MAX_LOCAL_CHILD_SNAPSHOT_BYTES = 1024 * 1024;
export const MAX_LOCAL_ACCOUNT_SNAPSHOT_BYTES = 768 * 1024;

const CHILD_PROFILES_KEY = 'jannati_child_profiles';
const ACTIVE_CHILD_KEY = 'jannati_active_child_id';
const ACCOUNT_SNAPSHOT_PRIORITY_KEYS = Object.freeze([
  CLOUD_CHILD_STATE_KEY,
  CHILD_PROFILES_KEY,
  ACTIVE_CHILD_KEY,
  'jannati_deleted_child_profiles',
  'jannati_archived_child_profiles',
  CLOUD_SYNC_META_KEY,
  'jannati_v151_profile',
  'jannati_v152_student_core',
  'jannati.adaptive.studentProfile',
  'jannati.gamification.profile'
]);

export function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeStorageId(value = '') {
  return String(value || '').trim();
}

export function isSnapshotCacheKey(key = '') {
  return key.startsWith(CHILD_SNAPSHOT_PREFIX)
    || key.startsWith(CHILD_ORIGINAL_SNAPSHOT_PREFIX)
    || key.startsWith(CHILD_MERGED_BACKUP_PREFIX)
    || key.startsWith(ACCOUNT_SNAPSHOT_PREFIX);
}

export function isRecoverableAccountDataKey(key = '') {
  const normalized = String(key || '');
  return normalized.startsWith('jannati')
    && normalized !== 'jannati_active_account_id'
    && normalized !== 'jannati_account_storage_migrated_v1'
    && normalized !== 'jannati_guest_snapshot_v1'
    && normalized !== 'jannati_sync_device_id'
    && normalized !== LAST_RESTORE_DIAGNOSTIC_KEY
    && !normalized.startsWith('jannati_learning_identity_migration:')
    && !normalized.startsWith('jannati_cloud_sync_pending:')
    && !normalized.startsWith('jannati_cloud_dirty_children:')
    && !normalized.startsWith('jannati_profile_reconciliation_pending:')
    && !normalized.startsWith('jannati_parent_security:')
    && !normalized.startsWith(ACCOUNT_SNAPSHOT_PREFIX);
}

export function estimateStorageBytes(key = '', value = '') {
  return (String(key).length + String(value).length) * 2;
}

function storageErrorReason(error) {
  const name = String(error?.name || 'Error');
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') return 'quota_exceeded';
  if (name === 'SecurityError' || name === 'InvalidStateError') return 'storage_unavailable';
  return 'write_failed';
}

export function safeStorageSet(storage, key, value) {
  const failedKey = String(key || '');
  if (!storage || typeof storage.setItem !== 'function') {
    return { ok: false, reason: 'storage_unavailable', errorName: 'StorageUnavailableError', failedKey, estimatedBytes: 0 };
  }
  let serialized;
  try {
    serialized = typeof value === 'string' ? value : JSON.stringify(value);
  } catch (error) {
    return { ok: false, reason: 'serialization_error', errorName: String(error?.name || 'Error'), failedKey, estimatedBytes: 0 };
  }
  const estimatedBytes = estimateStorageBytes(failedKey, serialized);
  try {
    storage.setItem(failedKey, serialized);
    if (typeof storage.getItem === 'function' && storage.getItem(failedKey) !== serialized) {
      return { ok: false, reason: 'write_failed', errorName: 'StorageReadbackError', failedKey, estimatedBytes };
    }
    return { ok: true, reason: 'ok', errorName: '', failedKey: '', estimatedBytes };
  } catch (error) {
    return { ok: false, reason: storageErrorReason(error), errorName: String(error?.name || 'Error'), failedKey, estimatedBytes };
  }
}

export function safeStorageRemove(storage, key) {
  if (!storage || typeof storage.removeItem !== 'function') {
    return { ok: false, reason: 'storage_unavailable', errorName: 'StorageUnavailableError', failedKey: String(key || '') };
  }
  try {
    storage.removeItem(String(key || ''));
    return { ok: true, reason: 'ok', errorName: '', failedKey: '' };
  } catch (error) {
    return { ok: false, reason: storageErrorReason(error), errorName: String(error?.name || 'Error'), failedKey: String(key || '') };
  }
}

export function buildCompactAccountSnapshot(localData = {}, accountId = '', options = {}) {
  const normalizedAccountId = normalizeStorageId(accountId);
  const maxBytes = Number(options.maxBytes) || MAX_LOCAL_ACCOUNT_SNAPSHOT_BYTES;
  const maxEntryBytes = Math.min(maxBytes, Number(options.maxEntryBytes) || 256 * 1024);
  const snapshot = {
    __accountSnapshotVersion: 2,
    __accountSnapshotAccountId: normalizedAccountId,
    __accountSnapshotCapturedAt: Date.now()
  };
  let estimatedBytes = estimateStorageBytes(`${ACCOUNT_SNAPSHOT_PREFIX}${normalizedAccountId}`, JSON.stringify(snapshot));
  const omittedKeys = [];
  const orderedKeys = [...ACCOUNT_SNAPSHOT_PRIORITY_KEYS, ...Object.keys(isObject(localData) ? localData : {}).sort()];
  const seen = new Set();
  for (const key of orderedKeys) {
    if (seen.has(key) || isSnapshotCacheKey(key) || !isRecoverableAccountDataKey(key)) continue;
    seen.add(key);
    const value = localData[key];
    if (typeof value !== 'string') continue;
    const entryBytes = estimateStorageBytes(key, value);
    if (entryBytes > maxEntryBytes || estimatedBytes + entryBytes > maxBytes) {
      omittedKeys.push(key);
      continue;
    }
    snapshot[key] = value;
    estimatedBytes += entryBytes;
  }
  return { snapshot, estimatedBytes, omittedKeys, bounded: omittedKeys.length > 0 };
}

export function captureCompactAccountSnapshot(storage, accountId, localData = {}, options = {}) {
  const normalizedAccountId = normalizeStorageId(accountId);
  if (!normalizedAccountId) return { ok: false, persisted: false, reason: 'account_mismatch', errorName: '', failedKey: '' };
  const compact = buildCompactAccountSnapshot(localData, normalizedAccountId, options);
  const result = safeStorageSet(storage, `${ACCOUNT_SNAPSHOT_PREFIX}${normalizedAccountId}`, compact.snapshot);
  return { ...result, persisted: result.ok, omittedKeys: compact.omittedKeys, bounded: compact.bounded };
}

export function persistBoundedChildSnapshot(storage, key, snapshot, options = {}) {
  let serialized;
  try {
    serialized = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
  } catch (error) {
    return { ok: false, persisted: false, reason: 'serialization_error', errorName: String(error?.name || 'Error'), failedKey: String(key || ''), estimatedBytes: 0 };
  }
  const estimatedBytes = estimateStorageBytes(key, serialized);
  if (estimatedBytes > (Number(options.maxBytes) || MAX_LOCAL_CHILD_SNAPSHOT_BYTES)) {
    if (options.removeExistingOnLimit) safeStorageRemove(storage, key);
    return { ok: true, persisted: false, reason: 'size_limit_exceeded', errorName: '', failedKey: String(key || ''), estimatedBytes };
  }
  const result = safeStorageSet(storage, key, serialized);
  return { ...result, persisted: result.ok };
}
