import { clampConfidence, getTopicStatus, getTopicStatusLabel, updateConfidence } from './confidenceEngine.js';
import { cloneStudentProfile, resolveStudentId } from './studentProfile.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeIsoDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureShape(profile = {}) {
  const next = cloneStudentProfile(profile);
  if (!next.totals || !isObject(next.totals)) {
    next.totals = {};
  }
  if (!next.subjects || !isObject(next.subjects)) {
    next.subjects = {};
  }
  if (!next.topics || !isObject(next.topics)) {
    next.topics = {};
  }
  return next;
}

function ensureSubject(profile, subjectId = '') {
  if (!profile.subjects[subjectId] || !isObject(profile.subjects[subjectId])) {
    profile.subjects[subjectId] = {
      subjectId,
      title: '',
      short: '',
      attempts: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      averageResponseTimeMs: 0,
      totalResponseTimeMs: 0,
      strongestTopic: null,
      weakestTopic: null,
      lastPractised: null,
      topicCount: 0,
      topics: {}
    };
  }
  if (!profile.subjects[subjectId].topics || !isObject(profile.subjects[subjectId].topics)) {
    profile.subjects[subjectId].topics = {};
  }
  return profile.subjects[subjectId];
}

function ensureTopic(profile, subjectId = '', topicId = '') {
  const subject = ensureSubject(profile, subjectId);
  if (!subject.topics[topicId] || !isObject(subject.topics[topicId])) {
    subject.topics[topicId] = {
      subjectId,
      topicId,
      title: '',
      attempts: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      confidence: 50,
      status: getTopicStatus(50),
      statusLabel: getTopicStatusLabel(50),
      lastPractised: null,
      lastAttemptAt: null,
      averageResponseTimeMs: 0,
      totalResponseTimeMs: 0,
      firstTryCorrect: 0,
      repeatedWrong: 0
    };
  }
  if (!profile.topics[subjectId] || !isObject(profile.topics[subjectId])) {
    profile.topics[subjectId] = {};
  }
  profile.topics[subjectId][topicId] = subject.topics[topicId];
  return subject.topics[topicId];
}

function recalcSubject(profile, subjectId = '') {
  const subject = ensureSubject(profile, subjectId);
  const topicList = Object.values(subject.topics || {});
  subject.topicCount = topicList.length;
  subject.attempts = topicList.reduce((sum, topic) => sum + toNumber(topic.attempts, 0), 0);
  subject.correct = topicList.reduce((sum, topic) => sum + toNumber(topic.correct, 0), 0);
  subject.wrong = topicList.reduce((sum, topic) => sum + toNumber(topic.wrong, 0), 0);
  subject.totalResponseTimeMs = topicList.reduce((sum, topic) => sum + toNumber(topic.totalResponseTimeMs, 0), 0);
  subject.averageResponseTimeMs = subject.attempts > 0 ? Math.round(subject.totalResponseTimeMs / subject.attempts) : 0;
  subject.accuracy = subject.attempts > 0 ? Math.round((subject.correct / subject.attempts) * 100) : 0;
  subject.lastPractised = topicList.reduce((latest, topic) => {
    const date = topic.lastPractised || topic.lastAttemptAt || null;
    if (!date) return latest;
    if (!latest) return date;
    return String(date) > String(latest) ? date : latest;
  }, subject.lastPractised || null);

  const strongest = topicList.slice().sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.attempts !== a.attempts) return b.attempts - a.attempts;
    return `${a.topicId}`.localeCompare(`${b.topicId}`);
  })[0] || null;
  const weakest = topicList.slice().sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence - b.confidence;
    if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
    if (a.attempts !== b.attempts) return a.attempts - b.attempts;
    return `${a.topicId}`.localeCompare(`${b.topicId}`);
  })[0] || null;

  subject.strongestTopic = strongest
    ? {
      topicId: strongest.topicId,
      title: strongest.title || strongest.topicId,
      confidence: strongest.confidence,
      accuracy: strongest.accuracy,
      status: strongest.status,
      statusLabel: strongest.statusLabel
    }
    : null;
  subject.weakestTopic = weakest
    ? {
      topicId: weakest.topicId,
      title: weakest.title || weakest.topicId,
      confidence: weakest.confidence,
      accuracy: weakest.accuracy,
      status: weakest.status,
      statusLabel: weakest.statusLabel
    }
    : null;
}

function recalcTotals(profile) {
  const subjects = Object.values(profile.subjects || {});
  profile.totals.questionsAnswered = subjects.reduce((sum, subject) => sum + toNumber(subject.attempts, 0), 0);
  profile.totals.correct = subjects.reduce((sum, subject) => sum + toNumber(subject.correct, 0), 0);
  profile.totals.wrong = subjects.reduce((sum, subject) => sum + toNumber(subject.wrong, 0), 0);
  profile.totals.accuracy = profile.totals.questionsAnswered > 0
    ? Math.round((profile.totals.correct / profile.totals.questionsAnswered) * 100)
    : 0;
  profile.totals.totalResponseTimeMs = subjects.reduce((sum, subject) => sum + toNumber(subject.totalResponseTimeMs, 0), 0);
  profile.totals.averageResponseTimeMs = profile.totals.questionsAnswered > 0
    ? Math.round(profile.totals.totalResponseTimeMs / profile.totals.questionsAnswered)
    : 0;
  profile.totals.longestStreak = Math.max(
    toNumber(profile.totals.longestStreak, 0),
    toNumber(profile.totals.currentStreak, 0)
  );
}

function updateStudyStreak(profile, activityDate = new Date()) {
  const today = localDateKey(activityDate);
  const lastStudyDate = profile.totals.lastStudyDate || '';
  if (!today) return;

  if (!lastStudyDate) {
    profile.totals.currentStreak = Math.max(1, toNumber(profile.totals.currentStreak, 0) || 1);
  } else if (lastStudyDate === today) {
    profile.totals.currentStreak = Math.max(1, toNumber(profile.totals.currentStreak, 0));
  } else {
    const previous = new Date(lastStudyDate);
    const current = new Date(today);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / 86400000);
    profile.totals.currentStreak = diffDays === 1 ? Math.max(1, toNumber(profile.totals.currentStreak, 0) + 1) : 1;
  }

  profile.totals.longestStreak = Math.max(toNumber(profile.totals.longestStreak, 0), toNumber(profile.totals.currentStreak, 0));
  profile.totals.lastStudyDate = today;
}

export function applyQuestionCompletion(profile = {}, completion = {}) {
  const studentId = resolveStudentId(profile, completion.studentId);
  const next = ensureShape({ ...profile, studentId });
  const subjectId = completion.subjectId || '';
  const topicId = completion.topicId || '';
  if (!subjectId || !topicId) {
    return next;
  }

  const subject = ensureSubject(next, subjectId);
  subject.title = completion.subjectTitle || subject.title || '';
  subject.short = completion.subjectShort || subject.short || '';
  const topic = ensureTopic(next, subjectId, topicId);
  topic.title = completion.topicTitle || topic.title || '';

  const attemptNumber = Math.max(1, toNumber(completion.attemptNumber, topic.attempts + 1 || 1));
  const correct = Boolean(completion.correct);
  const repeatedWrong = !correct && topic.wrong > 0;
  const firstTry = correct && (attemptNumber <= 1 || topic.attempts === 0);
  const responseTimeMs = Math.max(0, toNumber(completion.responseTimeMs ?? completion.timeSpentMs ?? completion.timeSpent, 0));
  const answeredAt = safeIsoDate(completion.answeredAt || completion.date || new Date()) || new Date().toISOString();

  topic.attempts += 1;
  topic.correct += correct ? 1 : 0;
  topic.wrong += correct ? 0 : 1;
  topic.totalResponseTimeMs += responseTimeMs;
  topic.averageResponseTimeMs = topic.attempts > 0 ? Math.round(topic.totalResponseTimeMs / topic.attempts) : 0;
  topic.lastPractised = answeredAt;
  topic.lastAttemptAt = answeredAt;
  topic.firstTryCorrect += firstTry ? 1 : 0;
  topic.repeatedWrong += repeatedWrong ? 1 : 0;
  topic.confidence = clampConfidence(updateConfidence(topic.confidence, { correct, firstTry, repeatedWrong }));
  topic.status = getTopicStatus(topic.confidence);
  topic.statusLabel = getTopicStatusLabel(topic.confidence);

  updateStudyStreak(next, answeredAt);
  next.totals.lastAnsweredAt = answeredAt;
  recalcSubject(next, subjectId);
  recalcTotals(next);
  next.updatedAt = answeredAt;
  return next;
}

export function applyQuestionCompletions(profile = {}, completions = []) {
  const rows = Array.isArray(completions) ? completions : [completions];
  return rows.reduce((state, row) => applyQuestionCompletion(state, row), profile);
}

export function applyActivityCompletion(profile = {}, activity = {}) {
  const studentId = resolveStudentId(profile, activity.studentId);
  const next = ensureShape({ ...profile, studentId });
  const completedAt = safeIsoDate(activity.completedAt || activity.date || new Date()) || new Date().toISOString();
  const studySeconds = Math.max(0, toNumber(activity.studySeconds || activity.durationSeconds || 0, 0));
  next.totals.totalStudySeconds += studySeconds;
  next.totals.activitiesCompleted += 1;
  updateStudyStreak(next, completedAt);
  next.totals.lastAnsweredAt = completedAt;
  next.updatedAt = completedAt;
  recalcTotals(next);
  return next;
}

export function buildStudentProgressSummary(profile = {}) {
  const next = ensureShape(profile);
  recalcTotals(next);
  const subjects = Object.values(next.subjects || {});
  const strongTopics = subjects
    .flatMap(subject => Object.values(subject.topics || {}).map(topic => ({
      subjectId: subject.subjectId,
      subjectTitle: subject.title || subject.short || subject.subjectId,
      topicId: topic.topicId,
      topicTitle: topic.title || topic.topicId,
      confidence: topic.confidence,
      accuracy: topic.accuracy,
      status: topic.status,
      statusLabel: topic.statusLabel,
      attempts: topic.attempts,
      lastPractised: topic.lastPractised
    })))
    .filter(topic => topic.attempts > 0)
    .sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return `${a.subjectId}_${a.topicId}`.localeCompare(`${b.subjectId}_${b.topicId}`);
    });

  const weakTopics = strongTopics
    .slice()
    .sort((a, b) => {
      if (a.confidence !== b.confidence) return a.confidence - b.confidence;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return `${a.subjectId}_${a.topicId}`.localeCompare(`${b.subjectId}_${b.topicId}`);
    });

  return {
    studentId: next.studentId,
    name: next.name,
    year: next.year,
    avatar: next.avatar,
    totals: { ...next.totals },
    subjects,
    strongTopics,
    weakTopics,
    summary: {
      accuracy: next.totals.accuracy,
      streak: next.totals.currentStreak,
      totalQuestions: next.totals.questionsAnswered,
      totalStudySeconds: next.totals.totalStudySeconds
    }
  };
}

export default {
  applyQuestionCompletion,
  applyQuestionCompletions,
  applyActivityCompletion,
  buildStudentProgressSummary
};
