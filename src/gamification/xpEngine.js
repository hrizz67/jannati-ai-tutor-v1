export const XP_RULES = {
  correctAnswer: 10,
  completedSession: 15,
  streakBonus: 5,
  perfectScore: 20,
  aiAssistedRecovery: 8
};

function toBoolean(value) {
  return value === true || value === 'true' || value === 1;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function calculateXpGain(event = {}) {
  const gain = {
    correctAnswer: toBoolean(event.correct) ? XP_RULES.correctAnswer : 0,
    completedSession: toBoolean(event.sessionCompleted) ? XP_RULES.completedSession : 0,
    streakBonus: Math.max(0, toNumber(event.streakBonus, 0)) * XP_RULES.streakBonus,
    perfectScore: toBoolean(event.perfectScore) ? XP_RULES.perfectScore : 0,
    aiAssistedRecovery: toBoolean(event.aiAssistedRecovery) ? XP_RULES.aiAssistedRecovery : 0
  };

  return {
    total: Object.values(gain).reduce((sum, value) => sum + value, 0),
    breakdown: gain
  };
}

export function awardXp(profile = {}, event = {}) {
  const currentXp = Math.max(0, toNumber(profile.totalXp ?? profile.xp, 0));
  const gain = calculateXpGain(event);
  return {
    totalXp: currentXp + gain.total,
    xpGained: gain.total,
    breakdown: gain.breakdown
  };
}

export default {
  XP_RULES,
  calculateXpGain,
  awardXp
};
