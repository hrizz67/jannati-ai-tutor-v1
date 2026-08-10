export { XP_RULES, calculateXpGain, awardXp } from './xpEngine.js';
export { calculateLevelProgress } from './levelEngine.js';
export { updateStreak } from './streakEngine.js';
export { ACHIEVEMENTS, getAchievementDefinitions, evaluateAchievements } from './achievementEngine.js';
export { buildRewardSummary } from './rewardSummary.js';
export { updateGamification, getRewardSummary, getLevelSummary } from './gamificationController.js';
export { createCanonicalGamification } from '../utils/canonicalGamification.js';
