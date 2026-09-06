import { getLearningIdentityMismatch, getLearningStorageScope, stampLearningIdentity } from '../../services/studentIdentity.js';

const MEMORY_STORAGE_KEY = 'jannati.memory.student';
const MEMORY_VERSION = 1;

function hasStorage() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function safeDateValue(value, fallback = '') {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

export function createDefaultMemory() {
  return {
    version: MEMORY_VERSION,
    studentId: null,
    name: '',
    updatedAt: '',
    processedAnswerKeys: [],
    adaptive: {
      version: null,
      totalQuestions: 0,
      correctQuestions: 0,
      level: 1,
      streak: 0,
      studyMinutes: 0,
      lastStudyDate: null
    },
    topics: {},
    mistakes: {},
    dailySnapshots: [],
    recommendationScores: {},
    learningHistory: [],
    lastAnsweredAt: null
  };
}

function migrateMemory(rawMemory = {}) {
  const base = createDefaultMemory();
  const processedAnswerKeys = Array.isArray(rawMemory.processedAnswerKeys)
    ? [...new Set(rawMemory.processedAnswerKeys.filter(key => typeof key === 'string' && key))]
    : base.processedAnswerKeys;
  const merged = {
    ...base,
    ...rawMemory,
    adaptive: {
      ...base.adaptive,
      ...(rawMemory.adaptive || {})
    },
    topics: {
      ...base.topics,
      ...(rawMemory.topics || {})
    },
    mistakes: {
      ...base.mistakes,
      ...(rawMemory.mistakes || {})
    },
    dailySnapshots: Array.isArray(rawMemory.dailySnapshots) ? [...rawMemory.dailySnapshots] : base.dailySnapshots,
    recommendationScores: {
      ...base.recommendationScores,
      ...(rawMemory.recommendationScores || {})
    },
    processedAnswerKeys,
    learningHistory: Array.isArray(rawMemory.learningHistory) ? [...rawMemory.learningHistory] : base.learningHistory
  };

  merged.version = MEMORY_VERSION;
  merged.updatedAt = safeDateValue(rawMemory.updatedAt, base.updatedAt);
  merged.lastAnsweredAt = safeDateValue(rawMemory.lastAnsweredAt, base.lastAnsweredAt);
  return merged;
}

function toEpoch(value) {
  const date = new Date(value || 0);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
}

function createScopedDefault(identityInput = {}) {
  const identity = getLearningStorageScope(identityInput);
  const fresh = clone(createDefaultMemory());
  return identity.explicit ? stampLearningIdentity(fresh, identity) : fresh;
}

export function loadMemory(identityInput = {}) {
  const identity = getLearningStorageScope(identityInput);
  if (!hasStorage()) {
    return createScopedDefault(identity);
  }

  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) return createScopedDefault(identity);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createScopedDefault(identity);
    if (getLearningIdentityMismatch(parsed, identity)) return createScopedDefault(identity);
    const migrated = migrateMemory(parsed);
    return identity.explicit ? stampLearningIdentity(migrated, identity) : migrated;
  } catch {
    return createScopedDefault(identity);
  }
}

export function saveMemory(memory = createDefaultMemory(), identityInput = memory) {
  const identity = getLearningStorageScope(identityInput);
  if (getLearningIdentityMismatch(memory, identity)) return loadMemory(identity);
  const migrated = migrateMemory(memory);
  const safeMemory = identity.explicit ? stampLearningIdentity(migrated, identity) : migrated;

  if (hasStorage()) {
    try {
      const currentRaw = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (currentRaw) {
        try {
          const currentParsed = JSON.parse(currentRaw);
          if (getLearningIdentityMismatch(currentParsed, identity)) return safeMemory;
          const current = migrateMemory(currentParsed);
          if (toEpoch(current.updatedAt) > toEpoch(safeMemory.updatedAt)) {
            return current;
          }
        } catch {
          // Corrupted memory is repaired by overwriting it below.
        }
      }
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(safeMemory));
    } catch {
      // Keep learning stable even when storage is unavailable.
    }
  }

  return safeMemory;
}

export function getProcessedAnswerKeys(memory = loadMemory()) {
  const safeMemory = migrateMemory(memory);
  return Array.isArray(safeMemory.processedAnswerKeys) ? [...safeMemory.processedAnswerKeys] : [];
}

export function hasProcessedAnswer(memory = loadMemory(), answerKey = '') {
  if (!answerKey) return false;
  return getProcessedAnswerKeys(memory).includes(answerKey);
}

export function markProcessedAnswer(memory = loadMemory(), answerKey = '', identityInput = memory) {
  const safeKey = typeof answerKey === 'string' ? answerKey.trim() : '';
  if (!safeKey) return migrateMemory(memory);

  const safeMemory = migrateMemory(memory);
  const processed = new Set(getProcessedAnswerKeys(safeMemory));
  processed.add(safeKey);
  safeMemory.processedAnswerKeys = Array.from(processed).slice(-500);
  safeMemory.updatedAt = new Date().toISOString();
  return saveMemory(safeMemory, identityInput);
}

export function resetMemory() {
  const fresh = clone(createDefaultMemory());
  if (hasStorage()) {
    try {
      localStorage.removeItem(MEMORY_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }
  return fresh;
}

export { MEMORY_STORAGE_KEY, MEMORY_VERSION };
