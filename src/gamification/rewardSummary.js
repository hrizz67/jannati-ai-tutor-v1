import { calculateLevelProgress } from './levelEngine.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildRewardSummary(profile = {}) {
  const totalXp = Math.max(0, toNumber(profile.totalXp ?? profile.xp, 0));
  const level = calculateLevelProgress(totalXp);
  const streak = {
    current: Math.max(0, toNumber(profile.currentStreak, 0)),
    best: Math.max(0, toNumber(profile.bestStreak, 0)),
    lastActivityDate: profile.lastActivityDate || profile.lastRewardDate || ''
  };

  return {
    xp: totalXp,
    level: level.currentLevel,
    nextLevelXP: level.nextLevelXp,
    progressPercent: level.progressPercent,
    streak,
    achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
    rewards: {
      coins: Math.max(0, toNumber(profile.coins, 0)),
      badges: Array.isArray(profile.badges) ? profile.badges : [],
      dailyRewards: Array.isArray(profile.dailyRewards) ? profile.dailyRewards : []
    }
  };
}

export default {
  buildRewardSummary
};
