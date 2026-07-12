const BASE_LEVEL_XP = 100;
const GROWTH_STEP = 50;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function levelThreshold(level) {
  if (level <= 1) return 0;

  let total = 0;
  for (let current = 2; current <= level; current += 1) {
    total += BASE_LEVEL_XP + ((current - 2) * GROWTH_STEP);
  }
  return total;
}

export function calculateLevel(xp = 0) {
  const safeXP = Math.max(0, Number(xp) || 0);
  let level = 1;

  while (safeXP >= levelThreshold(level + 1) && level < 999) {
    level += 1;
  }

  return level;
}

export function calculateProgress(xp = 0) {
  const safeXP = Math.max(0, Number(xp) || 0);
  const level = calculateLevel(safeXP);
  const currentLevelXP = levelThreshold(level);
  const nextLevelXP = levelThreshold(level + 1);
  const xpIntoLevel = Math.max(0, safeXP - currentLevelXP);
  const xpToNextLevel = Math.max(0, nextLevelXP - safeXP);
  const span = Math.max(1, nextLevelXP - currentLevelXP);

  return {
    level,
    currentLevelXP,
    nextLevelXP,
    xpIntoLevel,
    xpToNextLevel,
    progressPercent: clamp(Math.round((xpIntoLevel / span) * 100), 0, 100)
  };
}

export default {
  calculateLevel,
  calculateProgress
};
