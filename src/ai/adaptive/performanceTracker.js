export const ADAPTIVE_PERFORMANCE_VERSION = 1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function createEmptyTopicState() {
  return {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    totalTime: 0,
    averageTime: 0,
    usedHintCount: 0,
    usedExplainCount: 0,
    lastAnsweredAt: '',
    events: []
  };
}

function createEmptySubjectState() {
  return {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    totalTime: 0,
    averageTime: 0,
    usedHintCount: 0,
    usedExplainCount: 0,
    topics: {}
  };
}

export function createAdaptivePerformanceState(overrides = {}) {
  return {
    version: ADAPTIVE_PERFORMANCE_VERSION,
    totalQuestions: 0,
    correctQuestions: 0,
    incorrectQuestions: 0,
    totalTime: 0,
    averageTime: 0,
    subjects: {},
    events: [],
    updatedAt: '',
    ...overrides
  };
}

export function normalizeAdaptiveEvent(event = {}) {
  const subjectId = String(event.subjectId || event.subject || '').trim();
  const topicId = String(event.topicId || event.topic || '').trim();
  const correct = Boolean(event.correct ?? (!event.incorrect && event.isCorrect !== false));
  const incorrect = Boolean(event.incorrect ?? !correct);
  const timeTaken = Math.max(0, toNumber(event.timeTaken ?? event.timeSpent ?? event.duration, 0));

  return {
    subjectId,
    topicId,
    correct,
    incorrect,
    timeTaken,
    usedHint: Boolean(event.usedHint),
    usedExplain: Boolean(event.usedExplain),
    timestamp: toIso(event.timestamp || new Date()),
    questionId: String(event.questionId || event.id || '').trim(),
    difficulty: String(event.difficulty || '').trim()
  };
}

function ensureProfileStores(profile = {}) {
  if (!profile.adaptivePerformance || typeof profile.adaptivePerformance !== 'object') {
    profile.adaptivePerformance = createAdaptivePerformanceState();
  }
  if (!profile.adaptivePerformance.subjects || typeof profile.adaptivePerformance.subjects !== 'object') {
    profile.adaptivePerformance.subjects = {};
  }
  if (!Array.isArray(profile.adaptivePerformance.events)) {
    profile.adaptivePerformance.events = [];
  }
  return profile.adaptivePerformance;
}

function normalizeLegacyTopicRecord(record = {}) {
  return {
    attempts: toNumber(record.attempts ?? record.total, 0),
    correct: toNumber(record.correct, 0),
    incorrect: toNumber(record.incorrect ?? record.wrong, 0),
    totalTime: toNumber(record.totalTime, 0),
    averageTime: toNumber(record.averageTime ?? record.avgTime, 0),
    usedHintCount: toNumber(record.usedHintCount ?? record.hintsUsed, 0),
    usedExplainCount: toNumber(record.usedExplainCount ?? record.explanationsUsed, 0),
    lastAnsweredAt: String(record.lastAnsweredAt || record.lastPlayed || record.updatedAt || '').trim(),
    events: Array.isArray(record.events) ? [...record.events] : []
  };
}

function getLegacyTopicRecord(profile = {}, subjectId = '', topicId = '') {
  const byTopics = profile?.topics?.[subjectId]?.[topicId];
  if (byTopics && typeof byTopics === 'object') {
    return normalizeLegacyTopicRecord(byTopics);
  }
  const bySubjects = profile?.subjects?.[subjectId]?.topics?.[topicId];
  if (bySubjects && typeof bySubjects === 'object') {
    return normalizeLegacyTopicRecord(bySubjects);
  }
  return null;
}

function ensureSubjectState(state = {}, subjectId) {
  if (!state.subjects[subjectId] || typeof state.subjects[subjectId] !== 'object') {
    state.subjects[subjectId] = createEmptySubjectState();
  }
  const subject = state.subjects[subjectId];
  if (!subject.topics || typeof subject.topics !== 'object') {
    subject.topics = {};
  }
  return subject;
}

function ensureTopicState(subjectState = {}, topicId) {
  if (!subjectState.topics[topicId] || typeof subjectState.topics[topicId] !== 'object') {
    subjectState.topics[topicId] = createEmptyTopicState();
  }
  return subjectState.topics[topicId];
}

function updateAverages(record = {}) {
  record.averageTime = record.attempts ? Math.round(record.totalTime / record.attempts) : 0;
  return record;
}

export function recordAdaptiveAnswer(profile = {}, event = {}) {
  const state = ensureProfileStores(profile);
  const normalized = normalizeAdaptiveEvent(event);
  if (!normalized.subjectId || !normalized.topicId) {
    return profile;
  }

  const subjectState = ensureSubjectState(state, normalized.subjectId);
  const topicState = ensureTopicState(subjectState, normalized.topicId);
  const eventRecord = {
    ...normalized
  };

  state.totalQuestions += 1;
  state.totalTime += normalized.timeTaken;
  state.correctQuestions += normalized.correct ? 1 : 0;
  state.incorrectQuestions += normalized.incorrect ? 1 : 0;
  state.averageTime = state.totalQuestions ? Math.round(state.totalTime / state.totalQuestions) : 0;

  subjectState.attempts += 1;
  subjectState.correct += normalized.correct ? 1 : 0;
  subjectState.incorrect += normalized.incorrect ? 1 : 0;
  subjectState.totalTime += normalized.timeTaken;
  subjectState.usedHintCount += normalized.usedHint ? 1 : 0;
  subjectState.usedExplainCount += normalized.usedExplain ? 1 : 0;
  updateAverages(subjectState);

  topicState.attempts += 1;
  topicState.correct += normalized.correct ? 1 : 0;
  topicState.incorrect += normalized.incorrect ? 1 : 0;
  topicState.totalTime += normalized.timeTaken;
  topicState.usedHintCount += normalized.usedHint ? 1 : 0;
  topicState.usedExplainCount += normalized.usedExplain ? 1 : 0;
  topicState.lastAnsweredAt = normalized.timestamp;
  topicState.events.unshift(eventRecord);
  topicState.events = topicState.events.slice(0, 30);
  updateAverages(topicState);

  if (!profile.topics || typeof profile.topics !== 'object') {
    profile.topics = {};
  }
  if (!profile.topics[normalized.subjectId] || typeof profile.topics[normalized.subjectId] !== 'object') {
    profile.topics[normalized.subjectId] = {};
  }
  profile.topics[normalized.subjectId][normalized.topicId] = {
    ...(profile.topics[normalized.subjectId][normalized.topicId] || {}),
    attempts: topicState.attempts,
    total: topicState.attempts,
    correct: topicState.correct,
    wrong: topicState.incorrect,
    incorrect: topicState.incorrect,
    totalTime: topicState.totalTime,
    averageTime: topicState.averageTime,
    usedHintCount: topicState.usedHintCount,
    usedExplainCount: topicState.usedExplainCount,
    lastAnsweredAt: topicState.lastAnsweredAt,
    lastPlayed: topicState.lastAnsweredAt
  };

  if (!profile.subjects || typeof profile.subjects !== 'object') {
    profile.subjects = {};
  }
  if (!profile.subjects[normalized.subjectId] || typeof profile.subjects[normalized.subjectId] !== 'object') {
    profile.subjects[normalized.subjectId] = createEmptySubjectState();
  }
  profile.subjects[normalized.subjectId].attempts = subjectState.attempts;
  profile.subjects[normalized.subjectId].correct = subjectState.correct;
  profile.subjects[normalized.subjectId].incorrect = subjectState.incorrect;
  profile.subjects[normalized.subjectId].totalTime = subjectState.totalTime;
  profile.subjects[normalized.subjectId].averageTime = subjectState.averageTime;
  profile.subjects[normalized.subjectId].usedHintCount = subjectState.usedHintCount;
  profile.subjects[normalized.subjectId].usedExplainCount = subjectState.usedExplainCount;

  state.events.unshift(eventRecord);
  state.events = state.events.slice(0, 100);
  state.updatedAt = normalized.timestamp;
  return profile;
}

export function getAdaptivePerformanceSummary(profile = {}) {
  const state = ensureProfileStores(profile);
  return {
    version: state.version || ADAPTIVE_PERFORMANCE_VERSION,
    totalQuestions: state.totalQuestions || 0,
    correctQuestions: state.correctQuestions || 0,
    incorrectQuestions: state.incorrectQuestions || 0,
    totalTime: state.totalTime || 0,
    averageTime: state.averageTime || 0,
    updatedAt: state.updatedAt || '',
    subjects: state.subjects || {},
    events: state.events || []
  };
}

export function getSubjectPerformance(profile = {}, subjectId = '') {
  const state = ensureProfileStores(profile);
  const normalizedSubjectId = String(subjectId || '').trim();
  const adaptiveSubject = state.subjects[normalizedSubjectId];
  if (adaptiveSubject) return adaptiveSubject;

  const legacyTopics = profile?.topics?.[normalizedSubjectId];
  const fallback = createEmptySubjectState();
  if (legacyTopics && typeof legacyTopics === 'object') {
    Object.entries(legacyTopics).forEach(([topicId, topicRecord]) => {
      fallback.topics[topicId] = normalizeLegacyTopicRecord(topicRecord);
      fallback.attempts += fallback.topics[topicId].attempts;
      fallback.correct += fallback.topics[topicId].correct;
      fallback.incorrect += fallback.topics[topicId].incorrect;
      fallback.totalTime += fallback.topics[topicId].totalTime;
      fallback.usedHintCount += fallback.topics[topicId].usedHintCount;
      fallback.usedExplainCount += fallback.topics[topicId].usedExplainCount;
    });
    fallback.averageTime = fallback.attempts ? Math.round(fallback.totalTime / fallback.attempts) : 0;
    return fallback;
  }

  return fallback;
}

export function getTopicPerformance(profile = {}, subjectId = '', topicId = '') {
  const normalizedSubjectId = String(subjectId || '').trim();
  const normalizedTopicId = String(topicId || '').trim();
  const subject = getSubjectPerformance(profile, normalizedSubjectId);
  if (subject.topics[normalizedTopicId]) {
    return subject.topics[normalizedTopicId];
  }
  const legacy = getLegacyTopicRecord(profile, normalizedSubjectId, normalizedTopicId);
  if (legacy) {
    return legacy;
  }
  return createEmptyTopicState();
}

export function listTrackedTopics(profile = {}) {
  const state = ensureProfileStores(profile);
  const adaptiveTopics = Object.entries(state.subjects).flatMap(([subjectId, subjectState]) =>
    Object.entries(subjectState?.topics || {}).map(([topicId, record]) => ({
      subjectId,
      topicId,
      ...record
    }))
  );
  if (adaptiveTopics.length) {
    return adaptiveTopics;
  }
  return Object.entries(profile?.topics || {}).flatMap(([subjectId, subjectTopics]) =>
    Object.entries(subjectTopics || {}).map(([topicId, record]) => ({
      subjectId,
      topicId,
      ...normalizeLegacyTopicRecord(record)
    }))
  );
}

export default {
  createAdaptivePerformanceState,
  getAdaptivePerformanceSummary,
  getSubjectPerformance,
  getTopicPerformance,
  listTrackedTopics,
  normalizeAdaptiveEvent,
  recordAdaptiveAnswer
};
