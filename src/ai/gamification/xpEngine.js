function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getDistinctSessionCount(profile = {}) {
  const sessions = Array.isArray(profile.sessionHistory) ? profile.sessionHistory : [];
  return new Set(sessions.map(session => session?.sessionId).filter(Boolean)).size;
}

function hasObservationImprovement(context = {}) {
  const observation = context.learningObservation || context.observation || {};
  return Boolean(
    observation.improvingTopic ||
    `${observation.learningTrend || ''}`.includes('semakin baik') ||
    `${observation.learningTrend || ''}`.includes('stabil')
  );
}

function hasNarrativeMilestone(context = {}) {
  const narrative = context.narrativeBundle || {};
  return Boolean(narrative.achievement || narrative.journeySummary || narrative.progress);
}

export function calculateGamificationXP(profile = {}, memory = {}, context = {}) {
  const totalQuestions = toNumber(profile.totalQuestions, 0);
  const correctQuestions = toNumber(profile.correctQuestions, 0);
  const studyMinutes = toNumber(profile.studyMinutes, 0);
  const currentStreak = toNumber(profile.streak, 0);
  const bestStreak = toNumber(context.gamificationProfile?.bestStreak, currentStreak);
  const sessionCount = getDistinctSessionCount(profile);
  const dailyRewardsCount = Array.isArray(context.gamificationProfile?.dailyRewards) ? context.gamificationProfile.dailyRewards.length : 0;
  const badgeCount = Array.isArray(context.gamificationProfile?.badges) ? context.gamificationProfile.badges.length : 0;
  const achievementCount = Array.isArray(context.gamificationProfile?.achievements) ? context.gamificationProfile.achievements.length : 0;

  let xp = 0;
  xp += correctQuestions * 10;
  xp += totalQuestions * 2;
  xp += Math.round(studyMinutes * 1.5);
  xp += sessionCount * 12;
  xp += currentStreak * 6;
  xp += Math.max(0, bestStreak - currentStreak) * 2;
  xp += badgeCount * 4;
  xp += achievementCount * 6;
  xp += dailyRewardsCount * 5;

  if (context.dailyMissionCompleted) xp += 20;
  if (hasObservationImprovement(context)) xp += 10;
  if (hasNarrativeMilestone(context)) xp += 6;
  if (context.studyPlan?.estimatedMinutes) xp += Math.min(15, Math.round(Number(context.studyPlan.estimatedMinutes) || 0));

  return Math.max(0, Math.round(xp));
}

export default {
  calculateGamificationXP
};
