export const MASTERY_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  LEARNING: 'LEARNING',
  NEEDS_PRACTICE: 'NEEDS_PRACTICE',
  MASTERED: 'MASTERED'
};

import { calculateXP } from './xpEngine.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function todayString() {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const local = new Date(now.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function ensureTopicStore(profile = {}) {
  if (!profile.topics || typeof profile.topics !== 'object') {
    profile.topics = {};
  }
  return profile.topics;
}

function ensureSubjectStore(profile = {}, subjectId) {
  const topics = ensureTopicStore(profile);
  if (!topics[subjectId] || typeof topics[subjectId] !== 'object') {
    topics[subjectId] = {};
  }
  return topics[subjectId];
}

function createEmptyRecord() {
  return {
    total: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    mastery: 0,
    confidence: 0,
    averageTime: 0,
    totalTime: 0,
    xp: 0,
    lastPlayed: null
  };
}

function difficultyWeight(difficulty) {
  const map = {
    easy: 0.85,
    medium: 1,
    hard: 1.25
  };
  return map[String(difficulty || 'medium').toLowerCase()] ?? 1;
}

function recentTrend(record = {}) {
  const total = record.total || 0;
  const accuracy = record.accuracy || 0;
  const attemptsBoost = clamp(total * 2.5, 0, 20);
  const consistencyBoost = clamp((accuracy - 50) * 0.45, 0, 22);
  const penalty = total < 3 ? 10 : 0;
  return attemptsBoost + consistencyBoost - penalty;
}

function loadTopicRecord(profile = {}, subjectId, topicId) {
  const subjectStore = ensureSubjectStore(profile, subjectId);
  if (!subjectStore[topicId] || typeof subjectStore[topicId] !== 'object') {
    subjectStore[topicId] = createEmptyRecord();
  }
  return subjectStore[topicId];
}

function topicHistory(profile = {}, subjectId, topicId, topicTitle) {
  return (profile.history || []).filter(item => {
    return (item.subjectId === subjectId || item.subject === subjectId) &&
      (item.topicId === topicId || item.topic === topicId || item.topic === topicTitle);
  });
}

function resolveStatus({ attempts, accuracy, masteryScore }) {
  if (!attempts) return MASTERY_STATUS.NOT_STARTED;
  if (masteryScore >= 82 && accuracy >= 80 && attempts >= 1) return MASTERY_STATUS.MASTERED;
  if (accuracy < 65 || masteryScore < 58) return MASTERY_STATUS.NEEDS_PRACTICE;
  return MASTERY_STATUS.LEARNING;
}

function reviewDays(status, confidence) {
  if (status === MASTERY_STATUS.MASTERED) return confidence >= 80 ? 14 : 7;
  if (status === MASTERY_STATUS.LEARNING) return 3;
  if (status === MASTERY_STATUS.NEEDS_PRACTICE) return 1;
  return 0;
}

export function createTopicRecord() {
  return createEmptyRecord();
}

export function calculateAccuracy(record = {}) {
  const total = toNumber(record.total, 0);
  const correct = toNumber(record.correct, 0);
  if (!total) return 0;
  return clamp(Math.round((correct / total) * 100), 0, 100);
}

export function calculateMastery(record = {}) {
  const accuracy = calculateAccuracy(record);
  const total = toNumber(record.total, 0);
  const wrong = toNumber(record.wrong, 0);
  const averageTime = toNumber(record.averageTime, 0);
  const xp = toNumber(record.xp, 0);
  const difficultyScore = difficultyWeight(record.difficulty);
  const attemptFloor = clamp(total * 2.5, 0, 20);
  const errorPenalty = clamp(wrong * 5.5, 0, 22);
  const speedBonus = averageTime > 0 ? clamp(18 - Math.floor(averageTime / 15), 0, 18) : 0;
  const xpBonus = clamp(Math.floor(xp / 18), 0, 20);
  const recencyBonus = record.lastPlayed ? 4 : 0;
  const minimumAttemptsBonus = total >= 3 ? 8 : total * 2;

  return Math.round(clamp(
    accuracy * 0.45 +
    attemptFloor +
    minimumAttemptsBonus +
    speedBonus +
    xpBonus +
    recencyBonus +
    recentTrend(record) * 0.35 +
    (difficultyScore - 1) * 12 -
    errorPenalty,
    0,
    100
  ));
}

export function calculateConfidence(record = {}) {
  const total = toNumber(record.total, 0);
  const accuracy = calculateAccuracy(record);
  const mastery = toNumber(record.mastery, calculateMastery(record));
  const streakFactor = clamp(total * 6, 0, 30);
  const certaintyFactor = clamp(accuracy * 0.22 + mastery * 0.22, 0, 44);
  const experienceFactor = clamp(Math.max(0, total - 1) * 4, 0, 24);
  const timeFactor = record.averageTime ? clamp(18 - Math.floor(record.averageTime / 18), 0, 12) : 0;

  return Math.round(clamp(
    streakFactor + certaintyFactor + experienceFactor + timeFactor,
    0,
    100
  ));
}

export function getTopicMastery(profile = {}, subjectId, topicId) {
  return loadTopicRecord(profile, subjectId, topicId);
}

export function recordAnswer(profile = {}, {
  subjectId,
  topicId,
  correct,
  difficulty = 'medium',
  timeSpent = 0
} = {}) {
  if (!subjectId || !topicId) {
    return profile;
  }

  const nextProfile = profile;
  const record = getTopicMastery(nextProfile, subjectId, topicId);
  const before = {
    total: record.total || 0,
    correct: record.correct || 0,
    wrong: record.wrong || 0
  };
  const isCorrect = Boolean(correct);
  const safeTime = Math.max(0, toNumber(timeSpent, 0));
  const weightedXP = calculateXP(isCorrect ? 1 : 0, difficulty);

  record.total += 1;
  if (isCorrect) {
    record.correct += 1;
  } else {
    record.wrong += 1;
  }

  record.totalTime += safeTime;
  record.averageTime = record.total ? Math.round(record.totalTime / record.total) : 0;
  record.accuracy = calculateAccuracy(record);
  record.xp = Math.max(0, (record.xp || 0) + weightedXP);
  record.mastery = calculateMastery({
    ...record,
    difficulty
  });
  record.confidence = calculateConfidence(record);
  record.lastPlayed = todayString();
  return nextProfile;
}

export function getSubjectMastery(profile = {}, subjectId) {
  const topicRecords = Object.entries(ensureSubjectStore(profile, subjectId))
    .map(([topicId, record]) => ({
      topicId,
      ...record
    }));

  const totalTopics = topicRecords.length;
  const averageMastery = totalTopics
    ? Math.round(topicRecords.reduce((sum, record) => sum + (record.mastery || 0), 0) / totalTopics)
    : 0;
  const accuracy = totalTopics
    ? Math.round(topicRecords.reduce((sum, record) => sum + (record.accuracy || 0), 0) / totalTopics)
    : 0;
  const weakTopics = topicRecords.filter(record => (record.mastery || 0) < 60).map(record => record.topicId);
  const strongTopics = topicRecords.filter(record => (record.mastery || 0) >= 80).map(record => record.topicId);

  return {
    totalTopics,
    averageMastery,
    weakTopics,
    strongTopics,
    accuracy
  };
}

export function calculateTopicMastery({
  accuracy = 0,
  attempts = 0,
  studyHistory = [],
  streak = 0,
  lastLesson = null,
  xp = 0
} = {}) {
  const recentScores = studyHistory.slice(0, 5).map(item => item.percent || item.score || 0);
  const historyAverage = recentScores.length
    ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
    : accuracy;
  const recencyBonus = lastLesson ? 4 : 0;
  const attemptWeight = clamp(attempts * 7, 0, 21);
  const streakWeight = clamp(streak * 2, 0, 12);
  const xpWeight = clamp(Math.floor((xp || 0) / 120), 0, 10);

  const masteryScore = Math.round(clamp(
    accuracy * 0.52 +
    historyAverage * 0.22 +
    attemptWeight +
    streakWeight +
    xpWeight +
    recencyBonus,
    0,
    100
  ));
  const confidence = Math.round(clamp(
    35 +
    attempts * 12 +
    recentScores.length * 5 +
    (lastLesson ? 8 : 0) +
    clamp(streak, 0, 5) * 3,
    0,
    100
  ));
  const status = resolveStatus({ attempts, accuracy, masteryScore });

  return {
    masteryLevel: status === MASTERY_STATUS.MASTERED ? 'Lanjutan' : status === MASTERY_STATUS.NOT_STARTED ? 'Permulaan' : 'Berkembang',
    masteryScore,
    status,
    nextReviewDate: addDays(new Date(), reviewDays(status, confidence)),
    confidence
  };
}

export function buildMasteryMap(profile = {}, subjects = [], previousMemory = {}) {
  const lastLesson = previousMemory.lastLesson || null;
  const topicMastery = {};

  (subjects || []).forEach(subject => {
    (subject?.topics || []).forEach(topic => {
      const key = `${subject.id}_${topic.id}`;
      const progress = profile.progress?.[key] || {};
      const history = topicHistory(profile, subject.id, topic.id, topic.title);
      topicMastery[key] = {
        subjectId: subject.id,
        subject: subject.short || subject.title,
        topicId: topic.id,
        title: topic.title,
        attempts: progress.attempts || 0,
        accuracy: progress.last || progress.best || 0,
        best: progress.best || 0,
        ...calculateTopicMastery({
          accuracy: progress.last || progress.best || 0,
          attempts: progress.attempts || 0,
          studyHistory: history,
          streak: profile.streak || previousMemory.studyStreak || 0,
          lastLesson: lastLesson?.subjectId === subject.id && lastLesson?.topicId === topic.id ? lastLesson : null,
          xp: profile.xp || previousMemory.xp || 0
        })
      };
    });
  });

  return topicMastery;
}

export function summarizeMastery(topicMastery = {}) {
  const rows = Object.values(topicMastery);
  const total = rows.length;
  const statusCounts = rows.reduce((counts, row) => {
    counts[row.status] = (counts[row.status] || 0) + 1;
    return counts;
  }, {
    [MASTERY_STATUS.NOT_STARTED]: 0,
    [MASTERY_STATUS.LEARNING]: 0,
    [MASTERY_STATUS.NEEDS_PRACTICE]: 0,
    [MASTERY_STATUS.MASTERED]: 0
  });
  const masteryScore = total
    ? Math.round(rows.reduce((sum, row) => sum + (row.masteryScore || 0), 0) / total)
    : 0;

  return {
    total,
    masteryScore,
    mastered: statusCounts[MASTERY_STATUS.MASTERED] || 0,
    learning: statusCounts[MASTERY_STATUS.LEARNING] || 0,
    needsPractice: statusCounts[MASTERY_STATUS.NEEDS_PRACTICE] || 0,
    notStarted: statusCounts[MASTERY_STATUS.NOT_STARTED] || 0
  };
}
