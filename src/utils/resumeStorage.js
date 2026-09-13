import { getLearningStorageScope, stampLearningIdentity } from '../services/studentIdentity.js';

export const RESUME_KEY = 'jannati_v151_resume';
export const RESUME_SLOTS_KEY = 'jannati_v152_resume_slots';
export const RESUME_TOMBSTONES_KEY = 'jannati_v152_resume_tombstones';
export const RESUME_PENDING_TOMBSTONES_KEY = 'jannati_v152_resume_pending_tombstones';
export const LEGACY_RESUME_KEYS = ['jannati_v150_resume', 'jannati_v140_resume'];

const QUESTION_MODES = new Set(['quiz', 'adaptive-practice', 'adaptive-lesson']);
const COMMUNICATION_MODES = new Set(['reading', 'listening', 'speaking', 'writing']);
let resumeCompactor;

function readTombstones(storage, key) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeTombstones(storage, key, tombstones, limit = Infinity) {
  const entries = Object.entries(tombstones)
    .sort(([, left], [, right]) => Date.parse(right?.clearedAt || 0) - Date.parse(left?.clearedAt || 0));
  const next = Object.fromEntries(Number.isFinite(limit) ? entries.slice(0, limit) : entries);
  if (Object.keys(next).length) storage.setItem(key, JSON.stringify(next));
  else storage.removeItem(key);
}

function updateResumeTombstones(storage, records = [], remove = false) {
  const target = getStorage(storage);
  if (!target) return;
  try {
    const tombstones = readTombstones(target, RESUME_TOMBSTONES_KEY);
    const pending = readTombstones(target, RESUME_PENDING_TOMBSTONES_KEY);
    records.forEach(({ scope, resume }) => {
      if (remove) {
        delete tombstones[scope];
        delete pending[scope];
        return;
      }
      const previousClearedAt = Math.max(
        Date.parse(tombstones[scope]?.clearedAt || 0) || 0,
        Date.parse(pending[scope]?.clearedAt || 0) || 0
      );
      const record = {
        accountId: resume.accountId || '',
        childId: resume.childId || resume.studentId || scope.split('::')[0] || '',
        clearedAt: new Date(Math.max(Date.now(), previousClearedAt + 1)).toISOString()
      };
      tombstones[scope] = record;
      pending[scope] = record;
    });
    writeTombstones(target, RESUME_PENDING_TOMBSTONES_KEY, pending);
    writeTombstones(target, RESUME_TOMBSTONES_KEY, tombstones, 64);
  } catch {
    // Resume deletion must not block the completed learning flow.
  }
}

export function acknowledgeResumeTombstones(acknowledged = {}, storage, accountId = '') {
  const target = getStorage(storage);
  if (!target) return true;
  try {
    const pending = readTombstones(target, RESUME_PENDING_TOMBSTONES_KEY);
    Object.entries(acknowledged && typeof acknowledged === 'object' ? acknowledged : {}).forEach(([scope, record]) => {
      const current = pending[scope];
      if (!current
        || (current.accountId && record?.accountId && current.accountId !== record.accountId)
        || (current.childId && record?.childId && current.childId !== record.childId)
        || Date.parse(current.clearedAt || 0) > Date.parse(record?.clearedAt || 0)) return;
      delete pending[scope];
    });
    writeTombstones(target, RESUME_PENDING_TOMBSTONES_KEY, pending);
    return Object.values(pending).some(record => !accountId || !record?.accountId || record.accountId === accountId);
  } catch {
    return true;
  }
}

function getStorage(storage) {
  if (storage) return storage;
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function compactStoredResumes(storage) {
  const target = getStorage(storage);
  if (!target) return Promise.resolve(false);
  resumeCompactor ||= import('./resumeCompaction.js');
  return resumeCompactor.then(module => module.compactResumeStorage(target)).catch(() => false);
}

export function normalizeResumeData(value) {
  if (!value || typeof value !== 'object') return null;
  const state = value.state && typeof value.state === 'object' ? value.state : {};
  const session = value.session && typeof value.session === 'object'
    ? value.session
    : state.session && typeof state.session === 'object'
      ? state.session
      : null;
  const questionSource = Array.isArray(value.questions)
    ? value.questions
    : Array.isArray(value.questionIds)
      ? value.questionIds
      : Array.isArray(state.questions)
        ? state.questions
        : Array.isArray(state.questionIds)
          ? state.questionIds
          : null;
  const questions = questionSource?.map(item => typeof item === 'object' ? item : { id: item }) || null;
  const subjectId = value.subjectId || value.subject || state.subjectId || state.subject || null;
  const topicId = value.topicId || value.topic || state.topicId || state.topic || null;
  const mode = value.mode || value.screen || state.mode || state.screen || 'quiz';
  const questionIndexValue = Number.isInteger(value.currentIndex)
    ? value.currentIndex
    : Number.isInteger(value.questionIndex)
      ? value.questionIndex
      : Number.isInteger(state.currentIndex)
        ? state.currentIndex
        : Number.isInteger(state.questionIndex)
          ? state.questionIndex
          : 0;
  const answers = Array.isArray(value.answers)
    ? [...value.answers]
    : Array.isArray(state.answers)
      ? [...state.answers]
      : Array.isArray(session?.answers)
        ? [...session.answers]
        : [];
  const metadata = { ...(state.metadata || {}), ...(value.metadata || {}) };
  const accountId = value.accountId || state.accountId || '';
  const childId = value.childId || state.childId || '';
  const studentId = value.studentId || state.studentId || childId || '';
  const normalized = {
    version: Number(value.version || state.version || 1),
    questionBankVersion: Number(value.questionBankVersion || state.questionBankVersion || 1),
    mode,
    screen: value.screen || state.screen || mode,
    sessionId: value.sessionId || session?.adaptiveSessionId || state.sessionId || state.adaptiveSessionId || null,
    subjectId,
    topicId,
    questions,
    questionIds: Array.isArray(value.questionIds)
      ? [...value.questionIds]
      : Array.isArray(state.questionIds)
        ? [...state.questionIds]
        : questions?.map(item => item?.id).filter(Boolean) || [],
    currentIndex: questionIndexValue,
    questionIndex: questionIndexValue,
    answers,
    score: Number(value.score ?? state.score ?? session?.percent ?? 0),
    correct: Number(value.correct ?? state.correct ?? session?.correct ?? 0),
    wrong: Number(value.wrong ?? state.wrong ?? session?.wrong ?? 0),
    xp: Number(value.xp ?? state.xp ?? session?.xp ?? 0),
    coins: Number(value.coins ?? state.coins ?? session?.coins ?? 0),
    attemptNumber: Number(value.attemptNumber ?? state.attemptNumber ?? session?.attemptNumber ?? 0),
    accountId,
    childId,
    studentId,
    learningScope: value.learningScope || state.learningScope || '',
    metadata,
    startedAt: value.startedAt || state.startedAt || session?.startedAt || new Date().toISOString(),
    updatedAt: value.updatedAt || state.updatedAt || new Date().toISOString(),
    completed: Boolean(value.completed ?? state.completed ?? false),
    session,
    state: { ...state, ...value.state, accountId, childId, studentId, session, metadata }
  };

  if (QUESTION_MODES.has(mode) && (!subjectId || !topicId || !normalized.questions?.length)) return null;
  if (mode === 'uasa' && (!subjectId || !normalized.questions?.length)) return null;
  if (COMMUNICATION_MODES.has(mode)) {
    const hasState = Boolean(normalized.state?.passageId || normalized.state?.setId || normalized.state?.task || normalized.state?.prompt || normalized.state?.title);
    if (!hasState) return null;
  }
  return normalized;
}

export function getResumeScopeKey(value = {}) {
  const resume = normalizeResumeData(value) || value || {};
  const mode = String(resume.mode || 'quiz');
  const studentId = String(resume.studentId || resume.childId || 'default');
  if (mode === 'uasa') return `${studentId}::uasa::${resume.subjectId || 'unknown'}`;
  if (QUESTION_MODES.has(mode)) return `${studentId}::${mode}::${resume.subjectId || 'unknown'}::${resume.topicId || 'unknown'}`;
  if (COMMUNICATION_MODES.has(mode)) return `${studentId}::${mode}`;
  return `${studentId}::${mode}::${resume.subjectId || 'global'}::${resume.topicId || 'global'}`;
}

export function resumeMatchesCriteria(resume, criteria = {}) {
  if (!resume) return false;
  return (!criteria.mode || resume.mode === criteria.mode)
    && (!criteria.subjectId || resume.subjectId === criteria.subjectId)
    && (!criteria.topicId || resume.topicId === criteria.topicId)
    && (!criteria.sessionId || resume.sessionId === criteria.sessionId)
    && (!criteria.studentId || resume.studentId === criteria.studentId)
    && (!criteria.childId || resume.childId === criteria.childId)
    && (!criteria.accountId || resume.accountId === criteria.accountId);
}

function readResumeSlots(storage) {
  const target = getStorage(storage);
  if (!target) return {};
  let slots = {};
  try {
    const parsed = JSON.parse(target.getItem(RESUME_SLOTS_KEY) || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) slots = parsed;
  } catch {
    slots = {};
  }

  const normalizedSlots = {};
  Object.values(slots).forEach(value => {
    const normalized = normalizeResumeData(value);
    if (normalized) normalizedSlots[getResumeScopeKey(normalized)] = normalized;
  });
  if (Object.keys(normalizedSlots).length) {
    void compactStoredResumes(target);
    return normalizedSlots;
  }

  for (const key of [RESUME_KEY, ...LEGACY_RESUME_KEYS]) {
    try {
      const normalized = normalizeResumeData(JSON.parse(target.getItem(key) || 'null'));
      if (!normalized) continue;
      normalizedSlots[getResumeScopeKey(normalized)] = normalized;
      target.setItem(RESUME_SLOTS_KEY, JSON.stringify(normalizedSlots));
      LEGACY_RESUME_KEYS.forEach(legacyKey => target.removeItem(legacyKey));
      void compactStoredResumes(target);
      break;
    } catch {
      // Continue to the next backward-compatible key.
    }
  }
  return normalizedSlots;
}

function writeResumeSlots(slots, storage) {
  const target = getStorage(storage);
  if (!target) return false;
  const entries = Object.values(slots)
    .map(normalizeResumeData)
    .filter(item => item && !item.completed)
    .sort((a, b) => Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0));
  const normalizedSlots = Object.fromEntries(entries.map(item => [getResumeScopeKey(item), item]));
  try {
    if (entries.length) {
      target.setItem(RESUME_SLOTS_KEY, JSON.stringify(normalizedSlots));
      target.setItem(RESUME_KEY, JSON.stringify(entries[0]));
    } else {
      target.removeItem(RESUME_SLOTS_KEY);
      target.removeItem(RESUME_KEY);
    }
    LEGACY_RESUME_KEYS.forEach(key => target.removeItem(key));
    void compactStoredResumes(target);
    return true;
  } catch {
    return false;
  }
}

export function loadResume(criteria = {}, storage) {
  const entries = Object.values(readResumeSlots(storage))
    .map(normalizeResumeData)
    .filter(item => item && !item.completed && resumeMatchesCriteria(item, criteria))
    .sort((a, b) => Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0));
  return entries[0] || null;
}

export function saveResume(data, storage, identityInput = data) {
  const normalizedInput = normalizeResumeData(data);
  const identity = getLearningStorageScope(identityInput);
  const normalized = identity.explicit
    ? normalizeResumeData(stampLearningIdentity(normalizedInput || {}, identity))
    : normalizedInput;
  if (!normalized) return null;
  const slots = readResumeSlots(storage);
  const scope = getResumeScopeKey(normalized);
  slots[scope] = normalized;
  if (writeResumeSlots(slots, storage)) updateResumeTombstones(storage, [{ scope, resume: normalized }], true);
  return normalized;
}

export function clearResume(targetResume = undefined, storage) {
  const target = getStorage(storage);
  if (!target) return;
  if (targetResume === undefined || targetResume === null) {
    try {
      target.removeItem(RESUME_SLOTS_KEY);
      target.removeItem(RESUME_KEY);
      LEGACY_RESUME_KEYS.forEach(key => target.removeItem(key));
    } catch {
      // Storage restrictions must not block the learning flow.
    }
    return;
  }
  const slots = readResumeSlots(target);
  const cleared = [];
  Object.entries(slots).forEach(([key, value]) => {
    if (!resumeMatchesCriteria(value, targetResume)) return;
    cleared.push({ scope: key, resume: value });
    delete slots[key];
  });
  if (!cleared.length) cleared.push({ scope: getResumeScopeKey(targetResume), resume: targetResume });
  if (writeResumeSlots(slots, target)) updateResumeTombstones(target, cleared);
}

export default {
  clearResume,
  getResumeScopeKey,
  loadResume,
  normalizeResumeData,
  resumeMatchesCriteria,
  saveResume
};
