function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function calculateGamificationCoins(profile = {}, context = {}) {
  const currentStreak = toNumber(profile.currentStreak, 0);
  const bestStreak = toNumber(profile.bestStreak, currentStreak);
  const badgeCount = Array.isArray(profile.badges) ? profile.badges.length : 0;
  const achievementCount = Array.isArray(profile.achievements) ? profile.achievements.length : 0;
  const rewardCount = Array.isArray(profile.dailyRewards) ? profile.dailyRewards.length : 0;

  let coins = 0;
  coins += badgeCount * 4;
  coins += achievementCount * 8;
  coins += rewardCount * 5;
  coins += currentStreak * 2;
  coins += Math.max(0, bestStreak - currentStreak);

  if (context.dailyMissionCompleted) coins += 10;
  if (context.newLevel) coins += 10;

  return Math.max(0, Math.round(coins));
}

export default {
  calculateGamificationCoins
};
