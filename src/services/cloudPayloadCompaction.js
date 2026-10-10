import { compactResumeSlotCollection } from '../utils/resumeCompaction.js';
import {
  CHILD_MERGED_BACKUP_PREFIX,
  CHILD_ORIGINAL_SNAPSHOT_PREFIX,
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  CLOUD_SYNC_META_KEY,
  mergeConcurrentLearningSnapshots
} from './learningSync.js';

export const MAX_CLOUD_LEARNING_PAYLOAD_BYTES = 7 * 1024 * 1024;
const RESUME_SLOTS_KEY = 'jannati_v152_resume_slots';
const RESUME_TOMBSTONES_KEY = 'jannati_v152_resume_tombstones';
const RESUME_PENDING_TOMBSTONES_KEY = 'jannati_v152_resume_pending_tombstones';
const CHILD_PROFILES_KEY = 'jannati_child_profiles';
const ACTIVE_CHILD_KEY = 'jannati_active_child_id';
const DELETED_CHILDREN_KEY = 'jannati_deleted_child_profiles';
const ARCHIVED_CHILDREN_KEY = 'jannati_archived_child_profiles';
const PARENT_SECURITY_STORAGE_PREFIX = 'jannati_parent_security:';
const LEGACY_CHILD_METADATA_KEYS = new Set([
  CHILD_PROFILES_KEY,
  ACTIVE_CHILD_KEY,
  DELETED_CHILDREN_KEY,
  ARCHIVED_CHILDREN_KEY
]);
const isResumeStorageKey = key => /^jannati_v(?:140|150|151|152)_resume(?:_slots)?$/.test(key);
const CLOUD_TRANSIENT_FIELDS = new Set([
  'audio',
  'audioBlob',
  'audioUrl',
  'diagnostic',
  'diagnostics',
  'speechCandidate',
  'speechTranscript',
  'transcript'
]);

const SNAPSHOT_PREFIXES = [
  CHILD_SNAPSHOT_PREFIX,
  CHILD_ORIGINAL_SNAPSHOT_PREFIX,
  CHILD_MERGED_BACKUP_PREFIX
];

function parseObject(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw !== 'string' || raw[0] !== '{') return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function addResume(resumes, value, sourceKey = '', identity = {}) {
  const record = parseObject(value) || value;
  if (!record || typeof record !== 'object' || Array.isArray(record)) return;
  const keyStudentId = sourceKey.includes('::') ? sourceKey.split('::')[0] : '';
  const childId = record.childId || record.studentId || identity.childId || (keyStudentId !== 'default' ? keyStudentId : '');
  resumes.push({
    key: sourceKey || `${resumes.length}`,
    value: {
      ...record,
      ...(identity.accountId && !record.accountId ? { accountId: identity.accountId } : {}),
      ...(childId && !record.childId ? { childId } : {}),
      ...(childId && !record.studentId ? { studentId: childId } : {})
    }
  });
}

function collectResumeCache(resumes, key, raw, identity) {
  if (key === RESUME_SLOTS_KEY) {
    Object.entries(parseObject(raw) || {}).forEach(([slotKey, value]) => addResume(resumes, value, slotKey, identity));
  } else {
    addResume(resumes, raw, key, identity);
  }
}

function collectResumeTombstones(tombstones, raw, identity) {
  Object.entries(parseObject(raw) || {}).forEach(([scope, record]) => {
    const value = typeof record === 'string' ? { clearedAt: record } : record;
    const clearedAt = String(value?.clearedAt || '');
    if (!Number.isFinite(Date.parse(clearedAt))) return;
    const next = {
      accountId: value.accountId || identity.accountId || '',
      childId: value.childId || scope.split('::')[0] || '',
      clearedAt
    };
    const previous = tombstones.get(scope);
    if (!previous || Date.parse(next.clearedAt) > Date.parse(previous.clearedAt)) tombstones.set(scope, next);
  });
}

function cleanNested(value, depth = 0) {
  if (depth > 20 || value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const parsed = parseObject(value);
    return parsed ? JSON.stringify(cleanNested(parsed, depth + 1)) : value;
  }
  if (Array.isArray(value)) return value.map(item => cleanNested(item, depth + 1));
  if (typeof value !== 'object') return value;
  const next = {};
  Object.entries(value).forEach(([key, raw]) => {
    if (CLOUD_TRANSIENT_FIELDS.has(key) || isResumeStorageKey(key) || key === RESUME_TOMBSTONES_KEY || key === RESUME_PENDING_TOMBSTONES_KEY) return;
    next[key] = cleanNested(raw, depth + 1);
  });
  return next;
}

function childIdFromOriginalSnapshotKey(key = '') {
  return key.startsWith(CHILD_ORIGINAL_SNAPSHOT_PREFIX)
    ? key.slice(CHILD_ORIGINAL_SNAPSHOT_PREFIX.length)
    : '';
}

function mergeSnapshotIntoCanonical(next, childId, rawSnapshot) {
  if (!childId || typeof rawSnapshot !== 'string' || !parseObject(rawSnapshot)) return false;
  const snapshotKey = `${CHILD_SNAPSHOT_PREFIX}${childId}`;
  const merged = mergeConcurrentLearningSnapshots(next[snapshotKey], rawSnapshot, childId);
  if (typeof merged !== 'string' || !parseObject(merged)) return false;
  next[snapshotKey] = merged;
  return true;
}

function collapseOriginalChildSnapshots(next, metadata = {}) {
  Object.keys(next).filter(key => key.startsWith(CHILD_ORIGINAL_SNAPSHOT_PREFIX)).forEach(key => {
    const childId = childIdFromOriginalSnapshotKey(key);
    if (metadata.deletedChildren?.[childId]) return;
    if (mergeSnapshotIntoCanonical(next, childId, next[key])) delete next[key];
  });
}

function isKnownCanonicalChild(metadata = {}, childId = '', next = {}) {
  if (!childId || metadata.deletedChildren?.[childId]) return false;
  if (Array.isArray(metadata.profiles) && metadata.profiles.some(profile => profile?.id === childId)) return true;
  if (metadata.archivedChildren?.[childId]?.profile) return true;
  return Boolean(parseObject(next[`${CHILD_SNAPSHOT_PREFIX}${childId}`]));
}

function collapseMergedChildBackups(next, metadata = {}) {
  Object.keys(next).filter(key => key.startsWith(CHILD_MERGED_BACKUP_PREFIX)).forEach(key => {
    const backup = parseObject(next[key]);
    const canonicalId = String(backup?.canonicalId || '').trim();
    if (!backup || !isKnownCanonicalChild(metadata, canonicalId, next)) return;
    const snapshotFields = ['snapshot', 'originalSnapshot'].filter(field => typeof backup[field] === 'string');
    if (!snapshotFields.length) return;
    const preserved = snapshotFields.every(field => mergeSnapshotIntoCanonical(next, canonicalId, backup[field]));
    if (!preserved) return;
    const compactBackup = { ...backup };
    snapshotFields.forEach(field => delete compactBackup[field]);
    next[key] = JSON.stringify(compactBackup);
  });
}

function isRootLearningProjectionKey(key = '') {
  return String(key).startsWith('jannati')
    && !isResumeStorageKey(key)
    && key !== RESUME_TOMBSTONES_KEY
    && key !== RESUME_PENDING_TOMBSTONES_KEY
    && !LEGACY_CHILD_METADATA_KEYS.has(key)
    && key !== CLOUD_CHILD_STATE_KEY
    && key !== CLOUD_SYNC_META_KEY
    && !key.startsWith(PARENT_SECURITY_STORAGE_PREFIX)
    && !SNAPSHOT_PREFIXES.some(prefix => key.startsWith(prefix));
}

function collapseActiveRootProjection(next, metadata = {}, identity = {}) {
  const childId = String(metadata.activeChildId || identity.childId || '').trim();
  const snapshotKey = `${CHILD_SNAPSHOT_PREFIX}${childId}`;
  const current = parseObject(next[snapshotKey]);
  if (!childId || !current) return;
  const rootEntries = Object.entries(next).filter(([key, value]) => (
    isRootLearningProjectionKey(key) && typeof value === 'string'
  ));
  if (!rootEntries.length) return;
  const rootSnapshot = JSON.stringify({
    __childSnapshotChildId: childId,
    __childSnapshotCapturedAt: Number(current.__childSnapshotCapturedAt) || Date.now(),
    ...(identity.accountId || current.__childSnapshotAccountId
      ? { __childSnapshotAccountId: identity.accountId || current.__childSnapshotAccountId }
      : {}),
    ...Object.fromEntries(rootEntries)
  });
  if (!mergeSnapshotIntoCanonical(next, childId, rootSnapshot)) return;
  rootEntries.forEach(([key]) => delete next[key]);
}

function removeRedundantLegacyMetadata(next, metadata = {}) {
  if (!Array.isArray(metadata.profiles)) return;
  LEGACY_CHILD_METADATA_KEYS.forEach(key => delete next[key]);
}

function compactRedundantTransportState(next, identity = {}) {
  const metadata = parseObject(next[CLOUD_CHILD_STATE_KEY]) || {};
  collapseOriginalChildSnapshots(next, metadata);
  collapseMergedChildBackups(next, metadata);
  collapseActiveRootProjection(next, metadata, identity);
  removeRedundantLegacyMetadata(next, metadata);
}

function collectAccountResumeState(payload, resumes, tombstones, identity = {}) {
  Object.entries(payload && typeof payload === 'object' ? payload : {}).forEach(([key, raw]) => {
    if (isResumeStorageKey(key)) collectResumeCache(resumes, key, raw, identity);
    else if (key === RESUME_TOMBSTONES_KEY || key === RESUME_PENDING_TOMBSTONES_KEY) collectResumeTombstones(tombstones, raw, identity);
  });
}

export function getPendingResumeTombstones(payload = {}, identityInput = {}) {
  const identity = typeof identityInput === 'string' ? { accountId: identityInput } : identityInput;
  const accountId = String(identity.accountId || '');
  const pending = new Map();
  collectResumeTombstones(pending, payload?.[RESUME_PENDING_TOMBSTONES_KEY], identity);
  return Object.fromEntries([...pending.entries()].filter(([, value]) => (
    !accountId || !value.accountId || value.accountId === accountId
  )));
}

export function compactCloudLearningPayload(payload = {}, resumeSources = [], identityInput = {}) {
  const identity = typeof identityInput === 'string' ? { accountId: identityInput } : identityInput;
  const accountId = String(identity.accountId || '');
  const resumes = [];
  const tombstones = new Map();
  const next = { ...payload };
  Object.entries(next).forEach(([key, raw]) => {
    if (isResumeStorageKey(key)) {
      collectResumeCache(resumes, key, raw, identity);
      delete next[key];
    } else if (key === RESUME_TOMBSTONES_KEY || key === RESUME_PENDING_TOMBSTONES_KEY) {
      collectResumeTombstones(tombstones, raw, identity);
      delete next[key];
    } else if (SNAPSHOT_PREFIXES.some(prefix => key.startsWith(prefix))) {
      const parsed = parseObject(raw);
      next[key] = typeof raw === 'string'
        ? parsed ? JSON.stringify(cleanNested(parsed)) : raw
        : cleanNested(raw);
    }
  });
  compactRedundantTransportState(next, identity);
  resumeSources.forEach(source => collectAccountResumeState(source, resumes, tombstones, identity));
  const eligible = resumes.filter(item => !accountId || !item.value.accountId || item.value.accountId === accountId);
  const slots = cleanNested(compactResumeSlotCollection(...eligible.map(item => ({ [item.key]: item.value }))));
  const eligibleTombstones = [...tombstones.entries()]
    .filter(([, value]) => !accountId || !value.accountId || value.accountId === accountId)
    .sort((left, right) => Date.parse(right[1].clearedAt) - Date.parse(left[1].clearedAt) || left[0].localeCompare(right[0]));
  eligibleTombstones.forEach(([scope, tombstone]) => {
    const resume = slots[scope];
    if (resume && Date.parse(resume.updatedAt || resume.startedAt || 0) > Date.parse(tombstone.clearedAt)) {
      tombstones.delete(scope);
    } else if (resume) {
      delete slots[scope];
    }
  });
  const boundedTombstones = Object.fromEntries(eligibleTombstones
    .filter(([scope]) => tombstones.has(scope))
    .slice(0, 64));
  if (Object.keys(slots).length) next[RESUME_SLOTS_KEY] = JSON.stringify(slots);
  if (Object.keys(boundedTombstones).length) next[RESUME_TOMBSTONES_KEY] = JSON.stringify(boundedTombstones);
  return next;
}

export function measureCloudLearningPayloadBytes(payload = {}) {
  return new TextEncoder().encode(JSON.stringify(payload)).byteLength;
}

export function getCloudLearningPayloadSizeError(payload) {
  const payloadBytes = measureCloudLearningPayloadBytes(payload);
  if (payloadBytes <= MAX_CLOUD_LEARNING_PAYLOAD_BYTES) return null;
  return Object.assign(new Error('cloud_learning_payload_exceeds_client_limit'), {
    code: 'CLIENT_PAYLOAD_TOO_LARGE',
    payloadBytes,
    maxPayloadBytes: MAX_CLOUD_LEARNING_PAYLOAD_BYTES,
    retryable: false
  });
}
