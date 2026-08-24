function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeTimeOfDay(date = new Date()) {
  const hour = date instanceof Date ? date.getHours() : new Date(date).getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 20) return 'evening';
  return 'night';
}

export function getPersonalityProfile(profile = {}, memory = null, context = {}) {
  const stats = {
    xp: toNumber(profile.xp, 0),
    level: toNumber(profile.level, 1),
    streak: toNumber(profile.streak, 0),
    totalQuestions: toNumber(profile.totalQuestions, 0),
    correctQuestions: toNumber(profile.correctQuestions, 0),
    accuracy: toNumber(
      context.accuracy,
      toNumber(profile.totalQuestions, 0) > 0
        ? Math.round((toNumber(profile.correctQuestions, 0) / toNumber(profile.totalQuestions, 0)) * 100)
        : 0
    ),
    studyMinutes: toNumber(profile.studyMinutes, 0)
  };
  const readiness = context.readiness || context.readinessProfile || context.predictionProfile?.readiness || {};
  const timeOfDay = context.timeOfDay || normalizeTimeOfDay(context.now || new Date());
  const streak = toNumber(context.streak, stats.streak);
  const mastery = toNumber(context.mastery, context.predictionProfile?.evidence?.mastery || 0);
  const topicStrength = toNumber(context.topicStrength, 0);
  const readinessLevel =
    context.readinessLevel ||
    readiness.level ||
    (toNumber(readiness.score, 0) >= 80 ? 'ready' : toNumber(readiness.score, 0) >= 55 ? 'developing' : 'needs_support');

  const persona = mastery >= 75 && streak >= 3 ? 'jati' : 'janna';

  return {
    persona,
    timeOfDay,
    streak,
    mastery,
    readiness: readinessLevel,
    topicStrength,
    adaptive: profile,
    memory: memory,
    coachingDecision: context.coachDecision || null,
    predictionProfile: context.predictionProfile || null,
    stats
  };
}

export default {
  getPersonalityProfile
};
