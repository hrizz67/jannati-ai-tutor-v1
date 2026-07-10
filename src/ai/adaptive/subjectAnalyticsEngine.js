import { getWeakTopicsBySubject, getStrongTopicsBySubject } from './weakTopicEngine.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSubjectEntries(profile = {}, subjectId) {
  return Object.entries(profile.topics?.[subjectId] || {}).map(([topicId, record]) => ({
    topicId,
    record: record && typeof record === 'object' ? { ...record } : {}
  }));
}

function getAttemptCount(profile = {}, subjectId) {
  return getSubjectEntries(profile, subjectId).reduce((sum, entry) => sum + toNumber(entry.record.total, 0), 0);
}

function getCorrectCount(profile = {}, subjectId) {
  return getSubjectEntries(profile, subjectId).reduce((sum, entry) => sum + toNumber(entry.record.correct, 0), 0);
}

function getWrongCount(profile = {}, subjectId) {
  return getSubjectEntries(profile, subjectId).reduce((sum, entry) => sum + toNumber(entry.record.wrong, 0), 0);
}

function getStudyMinutes(profile = {}, subjectId) {
  return Math.max(0, Math.round(getSubjectEntries(profile, subjectId).reduce((sum, entry) => sum + toNumber(entry.record.totalTime, 0), 0) / 60));
}

function getSubjectStatus(accuracy, attempts) {
  if (attempts < 2) return 'no_data';
  if (accuracy >= 90) return 'excellent';
  if (accuracy >= 75) return 'good';
  if (accuracy >= 50) return 'developing';
  return 'needs_attention';
}

function getAttentionLevel(status, weakTopics, confidence, mastery, trendDirection, attempts) {
  if (status === 'no_data') return 'none';
  if (status === 'excellent' && weakTopics.length === 0 && confidence >= 70 && mastery >= 80) return 'low';
  if (status === 'good' && weakTopics.length <= 1 && trendDirection !== 'declining') return 'low';
  if (status === 'developing' || weakTopics.length >= 2 || mastery < 60 || confidence < 60) return 'medium';
  if (status === 'needs_attention' || trendDirection === 'declining' || attempts >= 5 && confidence < 65) return 'high';
  return 'medium';
}

function buildTrend(entries = [], options = {}) {
  const attempts = entries.filter(entry => toNumber(entry.record.total, 0) > 0);
  if (attempts.length < 2) {
    return {
      direction: 'insufficient_data',
      changePercent: 0,
      message: 'Belum cukup data untuk analisis trend.'
    };
  }

  const ordered = [...attempts].sort((a, b) => String(a.record.lastPlayed || '').localeCompare(String(b.record.lastPlayed || '')));
  const midpoint = Math.max(1, Math.floor(ordered.length / 2));
  const earlier = ordered.slice(0, midpoint);
  const recent = ordered.slice(midpoint);
  const earlyQuestions = earlier.reduce((sum, entry) => sum + toNumber(entry.record.total, 0), 0);
  const recentQuestions = recent.reduce((sum, entry) => sum + toNumber(entry.record.total, 0), 0);
  const earlyCorrect = earlier.reduce((sum, entry) => sum + toNumber(entry.record.correct, 0), 0);
  const recentCorrect = recent.reduce((sum, entry) => sum + toNumber(entry.record.correct, 0), 0);
  const earlyAccuracy = earlyQuestions ? (earlyCorrect / earlyQuestions) * 100 : 0;
  const recentAccuracy = recentQuestions ? (recentCorrect / recentQuestions) * 100 : 0;
  const changePercent = Math.round(recentAccuracy - earlyAccuracy);
  if (Math.abs(changePercent) < 5) {
    return { direction: 'stable', changePercent, message: 'Prestasi stabil.' };
  }
  if (changePercent > 0) {
    return { direction: 'improving', changePercent, message: 'Prestasi semakin baik.' };
  }
  if (recentQuestions < 2) {
    return { direction: 'stable', changePercent, message: 'Prestasi stabil.' };
  }
  return { direction: 'declining', changePercent, message: 'Perlu lebih latihan minggu ini.' };
}

export function getSubjectTrend(profile, subjectId, options = {}) {
  const entries = getSubjectEntries(profile, subjectId);
  return buildTrend(entries, options);
}

export function getSubjectAttentionSummary(profile, subjectId) {
  const analytics = getSubjectAnalytics(profile, subjectId);
  return {
    subjectId,
    attentionLevel: analytics.attentionLevel,
    weakTopics: analytics.weakTopics,
    strongTopics: analytics.strongTopics,
    trend: analytics.trend,
    message: analytics.trend.message
  };
}

export function getSubjectAnalytics(profile = {}, subjectId, options = {}) {
  const subjectRecord = profile.subjects?.[subjectId] || {};
  const entries = getSubjectEntries(profile, subjectId);
  const totalQuestions = getAttemptCount(profile, subjectId);
  const correct = getCorrectCount(profile, subjectId);
  const wrong = getWrongCount(profile, subjectId);
  const accuracy = totalQuestions ? Math.round((correct / totalQuestions) * 100) : 0;
  const mastery = entries.length
    ? Math.round(entries.reduce((sum, entry) => sum + toNumber(entry.record.mastery, 0), 0) / entries.length)
    : 0;
  const confidence = entries.length
    ? Math.round(entries.reduce((sum, entry) => sum + toNumber(entry.record.confidence, 0), 0) / entries.length)
    : 0;
  const activeTopics = entries.filter(entry => toNumber(entry.record.total, 0) > 0).length;
  const weakTopics = getWeakTopicsBySubject(profile, subjectId, { limit: options.weakLimit || 5 });
  const strongTopics = getStrongTopicsBySubject(profile, subjectId, { limit: options.strongLimit || 5 });
  const trend = getSubjectTrend(profile, subjectId, options);
  const status = getSubjectStatus(accuracy, totalQuestions);
  const attentionLevel = getAttentionLevel(status, weakTopics, confidence, mastery, trend.direction, totalQuestions);

  return {
    subjectId,
    accuracy,
    totalQuestions,
    correct,
    wrong,
    mastery,
    confidence,
    studyMinutes: getStudyMinutes(profile, subjectId),
    activeTopics,
    weakTopics,
    strongTopics,
    trend,
    status,
    attentionLevel,
    subjectSummary: clone(subjectRecord)
  };
}

export function rankSubjects(profile = {}, options = {}) {
  const subjectIds = Object.keys(profile.subjects || {});
  const analytics = subjectIds.map(subjectId => getSubjectAnalytics(profile, subjectId, options));
  return [...analytics].sort((a, b) => {
    const attentionOrder = { high: 3, medium: 2, low: 1, none: 0 };
    if (attentionOrder[b.attentionLevel] !== attentionOrder[a.attentionLevel]) {
      return attentionOrder[b.attentionLevel] - attentionOrder[a.attentionLevel];
    }
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.mastery !== a.mastery) return b.mastery - a.mastery;
    return a.subjectId.localeCompare(b.subjectId);
  });
}

export function getAllSubjectAnalytics(profile = {}, options = {}) {
  return rankSubjects(profile, options);
}

export function getBestSubject(profile = {}, options = {}) {
  return rankSubjects(profile, options)[0] || null;
}

export function getWeakestSubject(profile = {}, options = {}) {
  const ranked = rankSubjects(profile, options);
  return ranked[ranked.length - 1] || null;
}

export default {
  getAllSubjectAnalytics,
  getBestSubject,
  getSubjectAnalytics,
  getSubjectAttentionSummary,
  getSubjectTrend,
  getWeakestSubject,
  rankSubjects
};
