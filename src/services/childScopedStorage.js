import {
  LEGACY_STUDENT_ID,
  getLearningIdentityMismatch,
  getLearningStorageScope,
  stampLearningIdentity
} from './studentIdentity.js';

export const STUDENT_PROFILE_STORAGE_PREFIX = 'jannati.smartPersonalTutor.profile:';

const CHILD_SENSITIVE_KEYS = new Set([
  'jannati_v151_profile',
  'jannati_v150_profile',
  'jannati_v140_profile',
  'jannati_v152_student_core',
  'jannati_v151_ai_memory',
  'jannati_v150_ai_memory',
  'jannati_v140_ai_memory',
  'jannati.adaptive.studentProfile',
  'jannati.gamification.profile',
  'jannati.memory.student',
  'jannati.smartQuestion',
  'jannati_v151_resume',
  'jannati_v152_resume_slots',
  'jannati_v150_resume',
  'jannati_v140_resume'
]);

export function isChildSensitiveStorageKey(key = '') {
  return CHILD_SENSITIVE_KEYS.has(String(key))
    || String(key).startsWith(STUDENT_PROFILE_STORAGE_PREFIX);
}

function parseJsonObject(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function scopeResumeSlots(slots = {}, identity) {
  const next = {};
  Object.entries(slots).forEach(([key, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const mismatch = getLearningIdentityMismatch(value, identity);
    if (mismatch) throw new Error(mismatch);
    const scoped = stampLearningIdentity(value, identity);
    const prefix = `${identity.studentId}::`;
    const unscopedKey = key.startsWith(prefix) ? key.slice(prefix.length) : key;
    next[`${prefix}${unscopedKey}`] = scoped;
  });
  return next;
}

function scopeStudentCore(core = {}, identity) {
  const mismatch = getLearningIdentityMismatch(core, identity);
  if (mismatch) throw new Error(mismatch);
  return stampLearningIdentity({
    ...core,
    ...(core.profile && typeof core.profile === 'object'
      ? { profile: stampLearningIdentity(core.profile, identity) }
      : {}),
    ...(core.core && typeof core.core === 'object'
      ? { core: stampLearningIdentity(core.core, identity) }
      : {})
  }, identity);
}

function scopeStoredRecord(key, record, identity) {
  if (key === 'jannati_v152_resume_slots') return scopeResumeSlots(record, identity);
  if (key === 'jannati_v152_student_core') return scopeStudentCore(record, identity);
  const mismatch = getLearningIdentityMismatch(record, identity);
  if (mismatch) throw new Error(mismatch);
  return stampLearningIdentity(record, identity);
}

export function scopeChildLearningSnapshot(snapshot = {}, identityInput = {}) {
  const identity = getLearningStorageScope(identityInput);
  const source = snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) ? snapshot : {};
  const next = { ...source };
  const issues = [];

  if (!identity.explicit) return { ok: true, snapshot: next, identity, issues };

  Object.entries(source).forEach(([key, raw]) => {
    if (!isChildSensitiveStorageKey(key)) return;
    if (key.startsWith(STUDENT_PROFILE_STORAGE_PREFIX)) {
      const keyStudentId = key.slice(STUDENT_PROFILE_STORAGE_PREFIX.length);
      if (keyStudentId && keyStudentId !== LEGACY_STUDENT_ID && keyStudentId !== identity.studentId) {
        delete next[key];
        return;
      }
    }
    const record = parseJsonObject(raw);
    if (!record) return;
    try {
      next[key] = JSON.stringify(scopeStoredRecord(key, record, identity));
    } catch (error) {
      issues.push({ key, reason: error?.message || 'identity-mismatch' });
    }
  });

  return {
    ok: issues.length === 0,
    snapshot: next,
    identity,
    issues
  };
}

export function applyScopedLearningSnapshot(storage, snapshot = {}, identityInput = {}) {
  if (!storage) return { ok: false, issues: [{ key: '', reason: 'storage-unavailable' }] };
  const result = scopeChildLearningSnapshot(snapshot, identityInput);
  if (!result.ok) return result;
  const identity = result.identity;
  const writes = new Map(Object.entries(result.snapshot).filter(([, raw]) => typeof raw === 'string'));
  const previousValues = new Map();

  try {
    const legacyKey = `${STUDENT_PROFILE_STORAGE_PREFIX}${LEGACY_STUDENT_ID}`;
    const scopedKey = `${STUDENT_PROFILE_STORAGE_PREFIX}${identity.studentId}`;
    if (identity.explicit && !storage.getItem(scopedKey) && storage.getItem(legacyKey)) {
      const legacyProfile = parseJsonObject(storage.getItem(legacyKey));
      if (legacyProfile && !getLearningIdentityMismatch(legacyProfile, identity)) {
        writes.set(scopedKey, JSON.stringify(stampLearningIdentity(legacyProfile, identity)));
      }
    }

    writes.forEach((_raw, key) => previousValues.set(key, storage.getItem(key)));
    writes.forEach((raw, key) => storage.setItem(key, raw));
    return result;
  } catch (error) {
    [...previousValues.entries()].reverse().forEach(([key, previous]) => {
      try {
        if (previous === null) storage.removeItem(key);
        else storage.setItem(key, previous);
      } catch {
        // The source snapshot remains available for a later recovery attempt.
      }
    });
    return {
      ...result,
      ok: false,
      issues: [...result.issues, {
        key: '',
        reason: error?.name === 'QuotaExceededError' ? 'storage-quota-exceeded' : 'storage-write-failed'
      }]
    };
  }
}

export default {
  STUDENT_PROFILE_STORAGE_PREFIX,
  applyScopedLearningSnapshot,
  isChildSensitiveStorageKey,
  scopeChildLearningSnapshot
};
