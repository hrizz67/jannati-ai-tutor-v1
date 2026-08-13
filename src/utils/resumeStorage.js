export const RESUME_KEY = 'jannati_v151_resume';
export const RESUME_SLOTS_KEY = 'jannati_v152_resume_slots';
export const LEGACY_RESUME_KEYS = ['jannati_v150_resume', 'jannati_v140_resume'];

const QUESTION_MODES = new Set(['quiz', 'adaptive-practice', 'adaptive-lesson']);
const COMMUNICATION_MODES = new Set(['reading', 'listening', 'speaking', 'writing']);

function getStorage(storage) {
  if (storage) return storage;
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function normalizeResumeData(value) {
  if (!value || typeof value !== 'object') return null;
  const state = value.state && typeof value.state === 'object' ? value.state : {};
  const session = value.session && typeof value.session === 'object'
    ? value.session
    : state.session && typeof state.session === 'object'
      ? state.session
      : null;
  const questions = Array.isArray(value.questions)
    ? [...value.questions]
    : Array.isArray(value.questionIds)
      ? [...value.questionIds]
      : Array.isArray(state.questions)
        ? [...state.questions]
        : Array.isArray(state.questionIds)
          ? [...state.questionIds]
          : null;
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
    metadata,
    startedAt: value.startedAt || state.startedAt || session?.startedAt || new Date().toISOString(),
    updatedAt: value.updatedAt || state.updatedAt || new Date().toISOString(),
    completed: Boolean(value.completed ?? state.completed ?? false),
    session,
    state: { ...state, ...value.state, session, metadata }
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
  if (mode === 'uasa') return `uasa::${resume.subjectId || 'unknown'}`;
  if (QUESTION_MODES.has(mode)) return `${mode}::${resume.subjectId || 'unknown'}::${resume.topicId || 'unknown'}`;
  if (COMMUNICATION_MODES.has(mode)) return mode;
  return `${mode}::${resume.subjectId || 'global'}::${resume.topicId || 'global'}`;
}

export function resumeMatchesCriteria(resume, criteria = {}) {
  if (!resume) return false;
  return (!criteria.mode || resume.mode === criteria.mode)
    && (!criteria.subjectId || resume.subjectId === criteria.subjectId)
    && (!criteria.topicId || resume.topicId === criteria.topicId)
    && (!criteria.sessionId || resume.sessionId === criteria.sessionId);
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
  if (Object.keys(normalizedSlots).length) return normalizedSlots;

  for (const key of [RESUME_KEY, ...LEGACY_RESUME_KEYS]) {
    try {
      const normalized = normalizeResumeData(JSON.parse(target.getItem(key) || 'null'));
      if (!normalized) continue;
      normalizedSlots[getResumeScopeKey(normalized)] = normalized;
      target.setItem(RESUME_SLOTS_KEY, JSON.stringify(normalizedSlots));
      LEGACY_RESUME_KEYS.forEach(legacyKey => target.removeItem(legacyKey));
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

export function saveResume(data, storage) {
  const normalized = normalizeResumeData(data);
  if (!normalized) return null;
  const slots = readResumeSlots(storage);
  slots[getResumeScopeKey(normalized)] = normalized;
  writeResumeSlots(slots, storage);
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
  Object.entries(slots).forEach(([key, value]) => {
    if (resumeMatchesCriteria(value, targetResume)) delete slots[key];
  });
  writeResumeSlots(slots, target);
}

export default {
  clearResume,
  getResumeScopeKey,
  loadResume,
  normalizeResumeData,
  resumeMatchesCriteria,
  saveResume
};
