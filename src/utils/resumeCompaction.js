const RESUME_KEY = 'jannati_v151_resume';
const RESUME_SLOTS_KEY = 'jannati_v152_resume_slots';
const LEGACY_RESUME_KEYS = ['jannati_v150_resume', 'jannati_v140_resume'];
const QUESTION_MODES = ['quiz', 'adaptive-practice', 'adaptive-lesson'];
const COMMUNICATION_MODES = ['reading', 'listening', 'speaking', 'writing'];
const STATIC_MODES = ['quiz', 'adaptive-lesson'];
const TRANSIENT_FIELDS = new Set(['debug', 'diversityDebug', 'qdeDebug', 'qipDebug', 'duplicateIssues']);

function parseObject(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

function bytes(value) {
  return new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value)).byteLength;
}

function clean(value, depth = 0) {
  if (depth > 12 || !value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(item => clean(item, depth + 1));
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !TRANSIENT_FIELDS.has(key))
    .map(([key, item]) => [key, clean(item, depth + 1)]));
}

function omit(value, keys) {
  const next = clean(value && typeof value === 'object' && !Array.isArray(value) ? value : {});
  keys.forEach(key => delete next[key]);
  return next;
}

function compactResume(value) {
  if (!value || typeof value !== 'object') return null;
  const state = parseObject(value.state);
  const sourceSession = parseObject(value.session || state.session);
  const questions = [value.questions, value.questionIds, state.questions, state.questionIds].find(Array.isArray) || [];
  const mode = value.mode || value.screen || state.mode || state.screen || 'quiz';
  const subjectId = value.subjectId || value.subject || state.subjectId || state.subject || null;
  const topicId = value.topicId || value.topic || state.topicId || state.topic || null;
  if ((QUESTION_MODES.includes(mode) && (!subjectId || !topicId || !questions.length)) || (mode === 'uasa' && (!subjectId || !questions.length))) return null;
  if (COMMUNICATION_MODES.includes(mode) && ![state.passageId, state.setId, state.task, state.prompt, state.title].some(Boolean)) return null;
  if (value.completed ?? state.completed ?? false) return null;
  const normalizedQuestions = questions.map(item => typeof item === 'object' ? item : { id: item });
  const ids = (Array.isArray(value.questionIds) ? value.questionIds : Array.isArray(state.questionIds) ? state.questionIds : normalizedQuestions.map(item => item.id).filter(Boolean));
  const idsOnly = STATIC_MODES.includes(mode) && normalizedQuestions.length && ids.length === normalizedQuestions.length;
  const answers = [value.answers, state.answers, sourceSession.answers].find(Array.isArray) || [];
  const sessionId = value.sessionId || sourceSession.adaptiveSessionId || state.sessionId || state.adaptiveSessionId || null;
  const startedAt = value.startedAt || state.startedAt || sourceSession.startedAt || value.updatedAt || state.updatedAt || '1970-01-01T00:00:00.000Z';
  const number = (key, fallback) => Number(value[key] ?? state[key] ?? sourceSession[fallback || key] ?? 0);
  const session = omit({
    ...sourceSession,
    mode,
    adaptiveSessionId: sessionId,
    answers,
    percent: number('score', 'percent'),
    correct: number('correct'),
    wrong: number('wrong'),
    xp: number('xp'),
    coins: number('coins'),
    attemptNumber: number('attemptNumber'),
    startedAt
  }, ['questions', 'questionIds', 'metadata']);
  const resume = {
    resumeStorageVersion: 2,
    version: Number(value.version || state.version || 1),
    questionBankVersion: Number(value.questionBankVersion || state.questionBankVersion || 1),
    mode,
    screen: value.screen || state.screen || mode,
    sessionId,
    subjectId,
    topicId,
    ...(idsOnly ? {} : { questions: clean(normalizedQuestions) }),
    questionIds: ids,
    currentIndex: [value.currentIndex, value.questionIndex, state.currentIndex, state.questionIndex].find(Number.isInteger) ?? 0,
    accountId: value.accountId || state.accountId || '',
    childId: value.childId || state.childId || '',
    studentId: value.studentId || state.studentId || value.childId || state.childId || '',
    learningScope: value.learningScope || state.learningScope || '',
    metadata: clean({ ...(state.metadata || {}), ...(value.metadata || {}) }),
    startedAt,
    updatedAt: value.updatedAt || state.updatedAt || startedAt,
    session,
    state: omit(state, ['session', 'metadata', 'questions', 'questionIds', 'answers', 'accountId', 'childId', 'studentId', 'learningScope'])
  };
  return Object.fromEntries(Object.entries(resume).filter(([, item]) => item !== undefined && item !== null && item !== '' && !(typeof item === 'object' && !Array.isArray(item) && !Object.keys(item).length)));
}

function timestamp(value) {
  const parsed = Date.parse(value?.updatedAt || value?.startedAt || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function scopeKey(resume) {
  const mode = resume.mode || 'quiz';
  const studentId = resume.studentId || resume.childId || 'default';
  if (mode === 'uasa') return `${studentId}::uasa::${resume.subjectId || 'unknown'}`;
  if (QUESTION_MODES.includes(mode)) return `${studentId}::${mode}::${resume.subjectId || 'unknown'}::${resume.topicId || 'unknown'}`;
  if (COMMUNICATION_MODES.includes(mode)) return `${studentId}::${mode}`;
  return `${studentId}::${mode}::${resume.subjectId || 'global'}::${resume.topicId || 'global'}`;
}

function inferIdentity(value, key) {
  if (!value || typeof value !== 'object' || value.studentId || value.childId) return value;
  const [studentId, mode] = key.split('::');
  return studentId && [...QUESTION_MODES, 'uasa', ...COMMUNICATION_MODES].includes(mode)
    ? { ...value, childId: studentId, studentId }
    : value;
}

export function compactResumeSlotCollection(...sources) {
  const candidates = new Map();
  sources.forEach(source => Object.entries(parseObject(source)).forEach(([sourceKey, value]) => {
    const resume = compactResume(inferIdentity(value, sourceKey));
    if (!resume) return;
    const key = scopeKey(resume);
    const previous = candidates.get(key);
    if (!previous || timestamp(resume) > timestamp(previous)) candidates.set(key, resume);
  }));
  const sorted = [...candidates.entries()].sort((left, right) => timestamp(right[1]) - timestamp(left[1]) || left[0].localeCompare(right[0]));
  const bounded = {};
  for (const [key, resume] of sorted) {
    if (Object.keys(bounded).length >= 12 || bytes(resume) > 192 * 1024) continue;
    const next = { ...bounded, [key]: resume };
    if (bytes(next) <= 512 * 1024) bounded[key] = resume;
  }
  return bounded;
}

export function compactResumeStorage(storage) {
  const sources = [parseObject(storage.getItem(RESUME_SLOTS_KEY))];
  for (const key of [RESUME_KEY, ...LEGACY_RESUME_KEYS]) {
    const resume = parseObject(storage.getItem(key));
    if (Object.keys(resume).length) sources.push({ [key]: resume });
  }
  const slots = compactResumeSlotCollection(...sources);
  const entries = Object.values(slots);
  try {
    if (entries.length) {
      const raw = JSON.stringify(slots);
      const latest = JSON.stringify(entries[0]);
      if (storage.getItem(RESUME_SLOTS_KEY) !== raw) storage.setItem(RESUME_SLOTS_KEY, raw);
      if (storage.getItem(RESUME_KEY) !== latest) storage.setItem(RESUME_KEY, latest);
    } else {
      storage.removeItem(RESUME_SLOTS_KEY);
      storage.removeItem(RESUME_KEY);
    }
    LEGACY_RESUME_KEYS.forEach(key => storage.removeItem(key));
    return slots;
  } catch { return false; }
}
