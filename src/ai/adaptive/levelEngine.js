const BASE_XP_PER_LEVEL = 120;
const GROWTH_RATE = 0.18;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function levelRequirement(level) {
  if (level <= 1) {
    return 0;
  }

  let requirement = BASE_XP_PER_LEVEL;
  for (let currentLevel = 2; currentLevel < level; currentLevel += 1) {
    requirement = Math.round(requirement * (1 + GROWTH_RATE));
  }
  return requirement;
}

export function calculateLevel(xp = 0) {
  const safeXP = Math.max(0, Number(xp) || 0);
  let level = 1;
  let remainingXP = safeXP;

  while (remainingXP >= levelRequirement(level + 1)) {
    level += 1;
    if (level > 999) {
      break;
    }
  }

  return level;
}

export function calculateProgress(xp = 0) {
  const safeXP = Math.max(0, Number(xp) || 0);
  const currentLevel = calculateLevel(safeXP);
  const currentLevelXP = levelRequirement(currentLevel);
  const nextLevelXP = levelRequirement(currentLevel + 1);
  const xpIntoLevel = Math.max(0, safeXP - currentLevelXP);
  const xpToNextLevel = Math.max(0, nextLevelXP - safeXP);
  const span = Math.max(1, nextLevelXP - currentLevelXP);
  const progressPercent = clamp(Math.round((xpIntoLevel / span) * 100), 0, 100);

  return {
    level: currentLevel,
    currentLevelXP,
    nextLevelXP,
    xpIntoLevel,
    xpToNextLevel,
    progressPercent
  };
}

