function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function localDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function createAchievement(id, label, reason, earnedAt) {
  return { id, label, reason, earnedAt };
}

function uniqueById(rows = []) {
  const seen = new Set();
  return rows.filter(item => {
    const id = item?.id || '';
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function sortByEarnedAtDesc(rows = []) {
  return [...rows].sort((a, b) => `${b.earnedAt || ''}`.localeCompare(`${a.earnedAt || ''}`) || `${a.id || ''}`.localeCompare(`${b.id || ''}`));
}

function getDistinctSessionCount(profile = {}) {
  const sessions = Array.isArray(profile.sessionHistory) ? profile.sessionHistory : [];
  return new Set(sessions.map(session => session?.sessionId).filter(Boolean)).size;
}

function estimateXP(profile = {}, memory = {}, context = {}) {
  const totalQuestions = toNumber(profile.totalQuestions, 0);
  const correctQuestions = toNumber(profile.correctQuestions, 0);
  const studyMinutes = toNumber(profile.studyMinutes, 0);
  const currentStreak = toNumber(profile.streak, 0);
  const bestStreak = toNumber(context.gamificationProfile?.bestStreak, currentStreak);
  const sessionCount = getDistinctSessionCount(profile);

  let xp = 0;
  xp += correctQuestions * 10;
  xp += totalQuestions * 2;
  xp += Math.round(studyMinutes * 1.5);
  xp += sessionCount * 12;
  xp += currentStreak * 6;
  xp += Math.max(0, bestStreak - currentStreak) * 2;

  if (context.dailyMissionCompleted) xp += 20;
  if (context.learningObservation?.improvingTopic || `${context.learningObservation?.learningTrend || ''}`.includes('semakin baik')) xp += 10;
  if (context.narrativeBundle?.achievement || context.narrativeBundle?.journeySummary || context.narrativeBundle?.progress) xp += 6;
  if (context.studyPlan?.estimatedMinutes) xp += Math.min(15, Math.round(Number(context.studyPlan.estimatedMinutes) || 0));

  return Math.max(0, Math.round(xp));
}

export function buildAchievements(profile = {}, memory = {}, context = {}) {
  const today = localDayKey(context.today || new Date());
  const rows = [];
  const totalQuestions = toNumber(profile.totalQuestions, 0);
  const xp = toNumber(context.projectedXP, estimateXP(profile, memory, context));
  const streak = toNumber(profile.streak, 0);
  const topics = profile.topics || {};
  const masteredCount = Object.values(topics).reduce((count, subjectTopics) => {
    return count + Object.values(subjectTopics || {}).filter(topic => toNumber(topic?.mastery, 0) >= 80).length;
  }, 0);
  const hasMastery = masteredCount > 0;

  if (totalQuestions >= 100) {
    rows.push(createAchievement('soalan-100', '100 Soalan Dijawab', 'Kamu telah menjawab 100 soalan.', today));
  }

  if (xp >= 1000) {
    rows.push(createAchievement('xp-1000', '1000 XP', 'Kamu berjaya mengumpul 1000 XP.', today));
  }

  if (streak >= 7) {
    rows.push(createAchievement('streak-7', '7 Hari Berturut-turut', 'Kamu belajar tujuh hari berturut-turut.', today));
  }

  if (hasMastery) {
    rows.push(createAchievement('penguasaan-pertama', 'Penguasaan Pertama', 'Sekurang-kurangnya satu topik telah dikuasai.', today));
  }

  if (context.dailyMissionCompleted) {
    rows.push(createAchievement('misi-harian', 'Misi Selesai', 'Misi harian berjaya diselesaikan.', today));
  }

  if ((Array.isArray(memory.learningHistory) ? memory.learningHistory.length : 0) >= 50) {
    rows.push(createAchievement('pengembara-pembelajaran', 'Pengembara Pembelajaran', 'Kamu telah mencatat banyak sesi pembelajaran.', today));
  }

  return sortByEarnedAtDesc(uniqueById(rows));
}

export default {
  buildAchievements
};
