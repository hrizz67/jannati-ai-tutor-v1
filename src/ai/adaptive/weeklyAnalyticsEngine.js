import { loadProfile } from './storageEngine.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : localDateKey(date);
}

function buildDateRange(days = 7) {
  const count = Math.max(1, Math.floor(toNumber(days, 7)));
  const end = new Date();
  const dates = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const current = new Date(end);
    current.setDate(end.getDate() - index);
    dates.push(localDateKey(current));
  }
  return dates;
}

function getLearningEntries(profile = {}) {
  return Array.isArray(profile.learningHistory) ? profile.learningHistory : [];
}

function getSessionEntries(profile = {}) {
  return Array.isArray(profile.sessionHistory) ? profile.sessionHistory : [];
}

function sumLearningMinutes(entries = []) {
  return entries.reduce((sum, entry) => sum + Math.max(0, toNumber(entry.timeSpent, 0)) / 60, 0);
}

function mapEntriesByDate(entries = []) {
  return entries.reduce((acc, entry) => {
    const key = normalizeDate(entry.answeredAt || entry.date || entry.createdAt || entry.updatedAt || entry.startedAt || entry.endedAt);
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});
}

function getDailyEntry(profile = {}, date) {
  const key = normalizeDate(date);
  if (!key) return [];
  const byDate = mapEntriesByDate(getLearningEntries(profile));
  return byDate[key] || [];
}

export function getDailyQuestionCount(profile, date) {
  return getDailyEntry(profile, date).length;
}

export function getDailyAccuracy(profile, date) {
  const entries = getDailyEntry(profile, date);
  const questions = entries.length;
  if (!questions) return 0;
  const correct = entries.reduce((sum, entry) => sum + (entry.correct ? 1 : 0), 0);
  return Math.round((correct / questions) * 100);
}

export function getDailyStudyMinutes(profile, date) {
  const key = normalizeDate(date);
  if (!key) return 0;
  const entries = getDailyEntry(profile, key);
  return Math.max(0, Math.round(sumLearningMinutes(entries) * 10) / 10);
}

export function getLastNDaysActivity(profile = {}, days = 7) {
  const dates = buildDateRange(days);
  return dates.map(date => {
    const entries = getDailyEntry(profile, date);
    const questions = entries.length;
    const correct = entries.reduce((sum, entry) => sum + (entry.correct ? 1 : 0), 0);
    const wrong = Math.max(0, questions - correct);
    const accuracy = questions ? Math.round((correct / questions) * 100) : 0;
    const studyMinutes = Math.max(0, Math.round(sumLearningMinutes(entries) * 10) / 10);
    return {
      date,
      questions,
      correct,
      wrong,
      accuracy,
      studyMinutes,
      active: questions > 0
    };
  });
}

function getTrendDirection(daily = []) {
  const activeDays = daily.filter(day => day.active);
  const evidenceDays = activeDays.length;
  if (evidenceDays < 2) {
    return {
      direction: 'insufficient_data',
      changePercent: 0,
      message: 'Belum cukup data untuk analisis trend.'
    };
  }

  const midpoint = Math.ceil(daily.length / 2);
  const earlier = daily.slice(0, midpoint);
  const recent = daily.slice(midpoint);
  const earlierQuestions = earlier.reduce((sum, day) => sum + day.questions, 0);
  const recentQuestions = recent.reduce((sum, day) => sum + day.questions, 0);
  const earlierAccuracy = earlierQuestions ? earlier.reduce((sum, day) => sum + (day.accuracy * day.questions), 0) / earlierQuestions : 0;
  const recentAccuracy = recentQuestions ? recent.reduce((sum, day) => sum + (day.accuracy * day.questions), 0) / recentQuestions : 0;
  const changePercent = Math.round(recentAccuracy - earlierAccuracy);

  if (evidenceDays < 3) {
    return {
      direction: 'insufficient_data',
      changePercent,
      message: 'Belum cukup data untuk analisis trend.'
    };
  }

  if (Math.abs(changePercent) < 5) {
    return {
      direction: 'stable',
      changePercent,
      message: 'Prestasi stabil.'
    };
  }

  if (changePercent > 0) {
    return {
      direction: 'improving',
      changePercent,
      message: 'Prestasi semakin baik.'
    };
  }

  if (recentQuestions < 2) {
    return {
      direction: 'stable',
      changePercent,
      message: 'Prestasi stabil.'
    };
  }

  return {
    direction: 'declining',
    changePercent,
    message: 'Perlu lebih latihan minggu ini.'
  };
}

export function getWeeklySummary(profile = {}, options = {}) {
  const days = Math.max(1, Math.floor(toNumber(options.days, 7)));
  const daily = getLastNDaysActivity(profile, days);
  const startDate = daily[0]?.date || localDateKey();
  const endDate = daily[daily.length - 1]?.date || localDateKey();
  const totals = daily.reduce((acc, day) => {
    acc.questions += day.questions;
    acc.correct += day.correct;
    acc.wrong += day.wrong;
    acc.studyMinutes += day.studyMinutes;
    if (day.active) acc.activeDays += 1;
    return acc;
  }, {
    questions: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    studyMinutes: 0,
    activeDays: 0
  });

  totals.accuracy = totals.questions ? Math.round((totals.correct / totals.questions) * 100) : 0;

  return {
    range: {
      startDate,
      endDate,
      days
    },
    totals,
    daily,
    trend: getTrendDirection(daily)
  };
}

export function getWeeklyTrend(profile = {}) {
  return getWeeklySummary(profile).trend;
}

export function loadWeeklyAnalyticsProfile() {
  return clone(loadProfile());
}

export default {
  getDailyAccuracy,
  getDailyQuestionCount,
  getDailyStudyMinutes,
  getLastNDaysActivity,
  getWeeklySummary,
  getWeeklyTrend,
  loadWeeklyAnalyticsProfile
};
