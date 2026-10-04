import { applyGamificationEvent, buildGamificationReward } from './rewardEngine.js';
import { calculateLevel, calculateProgress } from './levelEngine.js';
import {
  createDefaultGamificationProfile,
  loadGamificationProfile,
  resetGamificationProfile,
  saveGamificationProfile
} from './gamificationProfile.js';
import { reconcileCumulativeLearnerProfile } from '../../utils/learnerProgressIntegrity.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getBadgeLabel(badge) {
  if (!badge) return 'Belum ada lencana';
  if (typeof badge === 'string') return badge;
  return badge.label || badge.name || badge.title || 'Belum ada lencana';
}

export function buildGamificationProfile(profile = {}, memory = {}, context = {}, existingProfile = loadGamificationProfile()) {
  const current = clone(existingProfile);
  const reward = buildGamificationReward(profile, memory, context, current);
  const cumulativeReward = reconcileCumulativeLearnerProfile({
    identity: context.studentIdentity || profile,
    profile: reward,
    adaptiveProfile: profile,
    gamificationProfile: current,
    aiMemory: memory
  });
  const next = createDefaultGamificationProfile(cumulativeReward);
  next.xp = cumulativeReward.xp;
  next.level = calculateLevel(cumulativeReward.xp);
  next.coins = cumulativeReward.coins;
  next.currentStreak = reward.currentStreak || 0;
  next.bestStreak = Math.max(toNumber(current.bestStreak, 0), toNumber(reward.bestStreak, 0), next.currentStreak);
  next.brokenStreak = reward.brokenStreak || 0;
  next.recoveryStreak = reward.recoveryStreak || 0;
  next.badges = cumulativeReward.badges || [];
  next.achievements = cumulativeReward.achievements || [];
  next.dailyRewards = cumulativeReward.dailyRewards || [];
  next.processedEventKeys = cumulativeReward.processedEventKeys || [];
  next.lastRewardDate = reward.lastRewardDate || current.lastRewardDate || '';
  next.updatedAt = reward.updatedAt || new Date().toISOString();
  return next;
}

export function summarizeGamificationProfile(profile = loadGamificationProfile()) {
  const safeProfile = profile || {};
  const badges = Array.isArray(safeProfile.badges) ? safeProfile.badges : [];
  const achievements = Array.isArray(safeProfile.achievements) ? safeProfile.achievements : [];
  const dailyRewards = Array.isArray(safeProfile.dailyRewards) ? safeProfile.dailyRewards : [];
  const newestBadge = getBadgeLabel(badges[0]);
  const progress = calculateProgress(safeProfile.xp || 0);

  return {
    xp: toNumber(safeProfile.xp, 0),
    level: toNumber(safeProfile.level, 1),
    coins: toNumber(safeProfile.coins, 0),
    currentStreak: toNumber(safeProfile.currentStreak, 0),
    bestStreak: toNumber(safeProfile.bestStreak, 0),
    newestBadge,
    badgeCount: badges.length,
    achievementCount: achievements.length,
    dailyRewardCount: dailyRewards.length,
    levelProgress: progress.progressPercent,
    nextLevelXP: progress.nextLevelXP
  };
}

export function recordGamificationEvent(profile = loadGamificationProfile(), memory = {}, context = {}, event = {}) {
  const identityInput = context.studentIdentity || context.profile || profile;
  const current = loadGamificationProfile(identityInput);
  const incomingTime = new Date(profile?.updatedAt || 0).getTime();
  const currentTime = new Date(current.updatedAt || 0).getTime();
  const baseProfile = currentTime >= incomingTime ? current : profile;
  const next = applyGamificationEvent(baseProfile, memory, context, event);
  return saveGamificationProfile(next, identityInput);
}

export {
  createDefaultGamificationProfile,
  loadGamificationProfile,
  resetGamificationProfile,
  saveGamificationProfile
};

export default {
  buildGamificationProfile,
  recordGamificationEvent,
  summarizeGamificationProfile,
  createDefaultGamificationProfile,
  loadGamificationProfile,
  resetGamificationProfile,
  saveGamificationProfile
};
