function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function levelThreshold(level) {
  if (level <= 1) return 0;
  let threshold = 0;
  for (let current = 2; current <= level; current += 1) {
    threshold += 100 + ((current - 2) * 50);
  }
  return threshold;
}

export function calculateLevelProgress(totalXp = 0) {
  const xp = Math.max(0, toNumber(totalXp, 0));
  let level = 1;

  while (xp >= levelThreshold(level + 1) && level < 999) {
    level += 1;
  }

  const currentLevelXp = levelThreshold(level);
  const nextLevelXp = levelThreshold(level + 1);
  const xpIntoLevel = Math.max(0, xp - currentLevelXp);
  const span = Math.max(1, nextLevelXp - currentLevelXp);
  const progressPercent = clamp(Math.round((xpIntoLevel / span) * 100), 0, 100);

  return {
    currentLevel: level,
    totalXp: xp,
    nextLevelXp,
    progressPercent,
    currentLevelXp,
    xpIntoLevel,
    xpNeeded: Math.max(0, nextLevelXp - xp)
  };
}

export default {
  calculateLevelProgress
};
