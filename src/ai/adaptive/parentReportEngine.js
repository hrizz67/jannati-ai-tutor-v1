import { generateRecommendation } from './recommendationEngine.js';
import { rankWeakTopics } from './weakTopicEngine.js';
import { getBestSubject, getAllSubjectAnalytics, getWeakestSubject } from './subjectAnalyticsEngine.js';
import { getWeeklySummary } from './weeklyAnalyticsEngine.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasLearningData(profile = {}) {
  if (!profile || typeof profile !== 'object') return false;
  if (toNumber(profile.totalQuestions, 0) > 0) return true;
  if (toNumber(profile.correctQuestions, 0) > 0) return true;
  if (toNumber(profile.studyMinutes, 0) > 0) return true;
  if (Array.isArray(profile.learningHistory) && profile.learningHistory.length > 0) return true;
  if (Array.isArray(profile.sessionHistory) && profile.sessionHistory.length > 0) return true;
  const topics = Object.values(profile.topics || {});
  return topics.some(subjectTopics => Object.values(subjectTopics || {}).some(record => toNumber(record?.total, 0) > 0));
}

function formatPercent(value) {
  return `${Math.max(0, Math.min(100, Math.round(toNumber(value, 0))))}%`;
}

function getProfileName(profile = {}) {
  return profile.name || 'Murid';
}

function getOverallAccuracy(profile = {}) {
  const total = toNumber(profile.totalQuestions, 0);
  const correct = toNumber(profile.correctQuestions, 0);
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function getStudyMinutes(profile = {}) {
  return Math.max(0, Math.round(toNumber(profile.studyMinutes, 0)));
}

function buildWeeklySummary(profile = {}) {
  const weekly = getWeeklySummary(profile, { days: 7 });
  const trendLabel = weekly.trend?.message || 'Belum cukup data untuk analisis trend.';
  return [
    `${getProfileName(profile)} telah menjawab ${weekly.totals.questions} soalan minggu ini.`,
    `Ketepatan keseluruhan ialah ${weekly.totals.accuracy}%.`,
    trendLabel
  ].join(' ');
}

function buildAchievements(profile = {}) {
  const achievements = [];
  const accuracy = getOverallAccuracy(profile);
  const streak = Math.max(0, Math.round(toNumber(profile.streak, 0)));
  const totalQuestions = Math.max(0, Math.round(toNumber(profile.totalQuestions, 0)));
  const bestSubject = getBestSubject(profile);

  if (bestSubject?.subjectId) {
    achievements.push(`Menguasai ${bestSubject.subjectId}.`);
  }
  if (streak >= 5) {
    achievements.push(`Streak belajar ${streak} hari.`);
  }
  if (accuracy >= 90) {
    achievements.push('Ketepatan melebihi 90%.');
  }
  if (totalQuestions >= 100) {
    achievements.push('Menjawab lebih 100 soalan.');
  }
  if (!achievements.length && totalQuestions > 0) {
    achievements.push('Rekod pembelajaran semakin berkembang.');
  }
  return achievements;
}

function buildImprovementAreas(profile = {}) {
  const weakTopics = rankWeakTopics(profile, { limit: 5 });
  const weakestSubject = getWeakestSubject(profile);
  const areas = [];

  if (weakTopics.length) {
    areas.push(`Perlu meningkatkan penguasaan ${weakTopics[0].title || weakTopics[0].topicId}.`);
  }
  if (weakestSubject?.subjectId) {
    const subjectAnalytics = getAllSubjectAnalytics(profile).find(item => item.subjectId === weakestSubject.subjectId);
    if (subjectAnalytics && subjectAnalytics.totalQuestions > 0) {
      areas.push(`${subjectAnalytics.subjectId} memerlukan lebih latihan.`);
    }
  }
  if (!areas.length) {
    areas.push('Belum cukup data untuk mengenal pasti topik perlu diperbaiki.');
  }
  return areas;
}

function buildStudyAdvice(profile = {}) {
  const recommendation = generateRecommendation(profile, { questionCount: 15, mode: 'daily' });
  const advice = [];
  const minutes = recommendation?.plan?.estimatedMinutes || 0;
  const focus = recommendation?.summary?.recommendedFocus?.[0];

  if (minutes > 0) {
    advice.push(`Disarankan ${minutes} minit latihan setiap hari.`);
  } else {
    advice.push('Disarankan 15 minit latihan setiap hari.');
  }
  if (focus?.topicId) {
    advice.push(`Fokus kepada 2 topik lemah dahulu, termasuk ${focus.topicId}.`);
  } else {
    advice.push('Fokus kepada 2 topik lemah dahulu.');
  }
  advice.push('Ulang kaji sebelum mencuba UASA.');
  return advice;
}

function buildEncouragement(profile = {}) {
  const accuracy = getOverallAccuracy(profile);
  const streak = Math.max(0, Math.round(toNumber(profile.streak, 0)));
  const trend = getWeeklySummary(profile, { days: 7 }).trend?.direction || 'insufficient_data';

  if (accuracy >= 90 && streak >= 5) return 'Teruskan usaha yang baik!';
  if (trend === 'improving') return 'Prestasi semakin meningkat.';
  if (trend === 'declining') return 'Jangan putus asa.';
  if (streak >= 3) return 'Peningkatan kecil setiap hari membawa kejayaan.';
  return 'Teruskan usaha yang baik!';
}

function buildNextGoal(profile = {}) {
  const accuracy = getOverallAccuracy(profile);
  const streak = Math.max(0, Math.round(toNumber(profile.streak, 0)));
  const totalQuestions = Math.max(0, Math.round(toNumber(profile.totalQuestions, 0)));

  if (accuracy < 90) return 'Capai ketepatan 90%.';
  if (totalQuestions < 50) return 'Lengkapkan 50 soalan lagi.';
  if (streak < 5) return 'Belajar 5 hari berturut-turut.';
  return 'Kekalkan prestasi cemerlang ini.';
}

export function generateWeeklySummary(profile = {}) {
  return buildWeeklySummary(profile);
}

export function generateAchievements(profile = {}) {
  return buildAchievements(profile);
}

export function generateImprovementAreas(profile = {}) {
  return buildImprovementAreas(profile);
}

export function generateStudyAdvice(profile = {}) {
  return buildStudyAdvice(profile);
}

export function generateEncouragement(profile = {}) {
  return buildEncouragement(profile);
}

export function generateParentReport(profile = {}, options = {}) {
  const hasData = hasLearningData(profile);
  const generatedAt = new Date().toISOString();

  if (!hasData) {
    return {
      generatedAt,
      summary: 'AI memerlukan lebih banyak data pembelajaran sebelum laporan boleh dijana.',
      achievements: [],
      improvements: [],
      advice: [],
      encouragement: 'AI memerlukan lebih banyak data pembelajaran sebelum laporan boleh dijana.',
      nextGoal: 'Mula mencatat pembelajaran harian.',
      estimatedStudyTime: 0,
      hasData: false,
      weeklySummary: null
    };
  }

  const weeklySummary = generateWeeklySummary(profile, options);
  const achievements = generateAchievements(profile);
  const improvements = generateImprovementAreas(profile);
  const advice = generateStudyAdvice(profile);
  const encouragement = generateEncouragement(profile);
  const nextGoal = buildNextGoal(profile);
  const recommendation = generateRecommendation(profile, { questionCount: options.questionCount || 15, mode: options.mode || 'daily' });

  return {
    generatedAt,
    summary: weeklySummary,
    achievements: clone(achievements),
    improvements: clone(improvements),
    advice: clone(advice),
    encouragement,
    nextGoal,
    estimatedStudyTime: recommendation?.plan?.estimatedMinutes || 0,
    hasData: true,
    weeklySummary
  };
}

export default {
  generateAchievements,
  generateEncouragement,
  generateImprovementAreas,
  generateParentReport,
  generateStudyAdvice,
  generateWeeklySummary
};
