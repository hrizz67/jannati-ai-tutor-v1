import { compactResumeSlotCollection } from '../utils/resumeCompaction.js';

export const MAX_CLOUD_LEARNING_PAYLOAD_BYTES = 7 * 1024 * 1024;
const RESUME_SLOTS_KEY = 'jannati_v152_resume_slots';
const RESUME_TOMBSTONES_KEY = 'jannati_v152_resume_tombstones';
const RESUME_PENDING_TOMBSTONES_KEY = 'jannati_v152_resume_pending_tombstones';
const isResumeStorageKey = key => /^jannati_v(?:140|150|151|152)_resume(?:_slots)?$/.test(key);

const SNAPSHOT_PREFIXES = [
  'jannati_child_snapshot:',
  'jannati_child_original_snapshot:',
  'jannati_merged_child_backup:'
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
    if (isResumeStorageKey(key) || key === RESUME_TOMBSTONES_KEY || key === RESUME_PENDING_TOMBSTONES_KEY) return;
    next[key] = cleanNested(raw, depth + 1);
  });
  return next;
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
  resumeSources.forEach(source => collectAccountResumeState(source, resumes, tombstones, identity));
  const eligible = resumes.filter(item => !accountId || !item.value.accountId || item.value.accountId === accountId);
  const slots = compactResumeSlotCollection(...eligible.map(item => ({ [item.key]: item.value })));
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

export function getCloudLearningPayloadSizeError(payload) {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).byteLength;
  if (payloadBytes <= MAX_CLOUD_LEARNING_PAYLOAD_BYTES) return null;
  return Object.assign(new Error('cloud_learning_payload_exceeds_client_limit'), {
    code: 'CLIENT_PAYLOAD_TOO_LARGE',
    payloadBytes,
    maxPayloadBytes: MAX_CLOUD_LEARNING_PAYLOAD_BYTES,
    retryable: false
  });
}
