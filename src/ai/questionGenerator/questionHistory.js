export const SMART_QUESTION_STORAGE_KEY = 'jannati.smartQuestion';
export const SMART_QUESTION_VERSION = 1;
export const SMART_QUESTION_HISTORY_LIMIT = 50;

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function hasStorage() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function uniqueByKey(items = [], keySelector = item => item?.key || item?.questionId || JSON.stringify(item)) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter(item => {
    const key = keySelector(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function createDefaultSmartQuestionState(overrides = {}) {
  return {
    version: SMART_QUESTION_VERSION,
    history: [],
    revisionQueue: [],
    variationSeed: 0,
    lastQuestions: [],
    updatedAt: '',
    ...overrides
  };
}

export function loadSmartQuestionState() {
  if (!hasStorage()) return clone(createDefaultSmartQuestionState());
  try {
    const raw = localStorage.getItem(SMART_QUESTION_STORAGE_KEY);
    if (!raw) return clone(createDefaultSmartQuestionState());
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return clone(createDefaultSmartQuestionState());
    return migrateSmartQuestionState(parsed);
  } catch {
    return clone(createDefaultSmartQuestionState());
  }
}

export function migrateSmartQuestionState(rawState = {}) {
  const base = createDefaultSmartQuestionState();
  const merged = {
    ...base,
    ...rawState,
    history: uniqueByKey(Array.isArray(rawState.history) ? rawState.history : base.history, item => item?.key || `${item?.questionId || ''}:${item?.timestamp || ''}`),
    revisionQueue: uniqueByKey(Array.isArray(rawState.revisionQueue) ? rawState.revisionQueue : base.revisionQueue, item => item?.key || `${item?.subjectId || ''}:${item?.topicId || ''}`),
    lastQuestions: uniqueByKey(Array.isArray(rawState.lastQuestions) ? rawState.lastQuestions : base.lastQuestions, item => item?.key || item?.questionId || JSON.stringify(item))
  };

  merged.version = SMART_QUESTION_VERSION;
  merged.updatedAt = toIso(rawState.updatedAt) || base.updatedAt;
  merged.variationSeed = Number.isFinite(Number(merged.variationSeed)) ? Number(merged.variationSeed) : 0;
  return merged;
}

export function saveSmartQuestionState(state = createDefaultSmartQuestionState()) {
  const safeState = migrateSmartQuestionState(state);
  if (hasStorage()) {
    try {
      const currentRaw = localStorage.getItem(SMART_QUESTION_STORAGE_KEY);
      if (currentRaw) {
        try {
          const current = migrateSmartQuestionState(JSON.parse(currentRaw));
          if (new Date(current.updatedAt || 0).getTime() > new Date(safeState.updatedAt || 0).getTime()) {
            return current;
          }
        } catch {
          // Ignore corrupted stored state and overwrite.
        }
      }
      localStorage.setItem(SMART_QUESTION_STORAGE_KEY, JSON.stringify(safeState));
    } catch {
      // Silent fallback.
    }
  }
  return safeState;
}

export function resetSmartQuestionState() {
  const fresh = clone(createDefaultSmartQuestionState());
  if (hasStorage()) {
    try {
      localStorage.removeItem(SMART_QUESTION_STORAGE_KEY);
    } catch {
      // Ignore cleanup failure.
    }
  }
  return fresh;
}

export function buildSmartEventKey(decision = {}, context = {}) {
  const questionId = String(decision.questionId || decision.question?.id || context.questionId || '');
  const subjectId = String(decision.subjectId || decision.question?.subjectId || context.subjectId || '');
  const topicId = String(decision.topicId || decision.question?.topicId || context.topicId || '');
  const difficulty = String(decision.difficulty || decision.question?.difficulty || context.difficulty || '');
  const mode = String(context.mode || decision.mode || 'quiz');
  const variant = String(decision.variationSeed || context.variationSeed || '');
  const revision = String(context.revisionPriority || decision.revisionPriority || '');
  return [mode, subjectId, topicId, questionId, difficulty, variant, revision].filter(Boolean).join('::');
}

export function recordSmartQuestionState(state = loadSmartQuestionState(), decision = {}, context = {}) {
  const current = migrateSmartQuestionState(state);
  const eventKey = buildSmartEventKey(decision, context);
  const history = Array.isArray(current.history) ? [...current.history] : [];
  const lastQuestions = Array.isArray(current.lastQuestions) ? [...current.lastQuestions] : [];
  const revisionQueue = Array.isArray(context.revisionQueue)
    ? [...context.revisionQueue]
    : Array.isArray(decision.revisionQueue)
      ? [...decision.revisionQueue]
      : Array.isArray(current.revisionQueue)
        ? [...current.revisionQueue]
        : [];
  const entry = {
    key: eventKey,
    questionId: decision.questionId || decision.question?.id || '',
    subjectId: decision.subjectId || decision.question?.subjectId || context.subjectId || '',
    topicId: decision.topicId || decision.question?.topicId || context.topicId || '',
    difficulty: decision.difficulty || decision.question?.difficulty || context.difficulty || '',
    revisionPriority: Number(decision.revisionPriority) || 0,
    repeatScore: Number(decision.repeatScore) || 0,
    variationSeed: Number(decision.variationSeed) || 0,
    selectionReason: decision.selectionReason || '',
    uasaWeight: Number(decision.uasaWeight) || 0,
    mode: context.mode || decision.mode || 'quiz',
    timestamp: toIso(context.timestamp || new Date())
  };

  if (!history.some(item => item?.key === eventKey)) {
    history.unshift(entry);
  }

  if (!lastQuestions.some(item => item?.key === eventKey)) {
    lastQuestions.unshift(entry);
  }

  const next = {
    ...current,
    history: history.slice(0, SMART_QUESTION_HISTORY_LIMIT),
    revisionQueue: revisionQueue.slice(0, SMART_QUESTION_HISTORY_LIMIT),
    lastQuestions: lastQuestions.slice(0, SMART_QUESTION_HISTORY_LIMIT),
    variationSeed: Number(decision.variationSeed || context.variationSeed || current.variationSeed || 0) || 0,
    updatedAt: new Date().toISOString()
  };

  return saveSmartQuestionState(next);
}

export default {
  SMART_QUESTION_STORAGE_KEY,
  SMART_QUESTION_VERSION,
  createDefaultSmartQuestionState,
  loadSmartQuestionState,
  migrateSmartQuestionState,
  recordSmartQuestionState,
  resetSmartQuestionState,
  saveSmartQuestionState
};
