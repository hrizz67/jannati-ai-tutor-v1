import { buildBadges } from './badgeEngine.js';
import { buildAchievements } from './achievementEngine.js';
import { buildDailyReward } from './dailyRewardEngine.js';
import { calculateGamificationXP } from './xpEngine.js';
import { calculateGamificationCoins } from './coinEngine.js';
import { updateGamificationStreak } from './streakEngine.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function localDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function buildGamificationReward(profile = {}, memory = {}, context = {}, existingProfile = {}) {
  const next = clone(existingProfile);
  const streakProfile = updateGamificationStreak(next, profile, context.today || new Date(), {
    activityCompleted: Boolean(context.activityCompleted !== false || context.dailyMissionCompleted || context.sessionCompleted)
  });
  const badges = buildBadges(profile, memory, {
    ...context,
    gamificationProfile: streakProfile
  });
  const dailyRewards = buildDailyReward(profile, context, streakProfile.dailyRewards || []);
  const today = localDayKey(context.today || new Date());
  const currentReward = dailyRewards.find(item => item?.date === today) || null;
  const provisionalContext = {
    ...context,
    gamificationProfile: {
      ...streakProfile,
      badges,
      achievements: [],
      dailyRewards
    },
    dailyMissionCompleted: Boolean(context.dailyMissionCompleted || currentReward)
  };
  const projectedXP = calculateGamificationXP(profile, memory, provisionalContext);
  const achievements = buildAchievements(profile, memory, {
    ...provisionalContext,
    projectedXP
  });
  const rewardContext = {
    ...context,
    gamificationProfile: {
      ...streakProfile,
      badges,
      achievements,
      dailyRewards
    },
    dailyMissionCompleted: Boolean(context.dailyMissionCompleted || currentReward)
  };

  const xp = calculateGamificationXP(profile, memory, rewardContext);
  const coins = calculateGamificationCoins({
    ...streakProfile,
    badges,
    achievements,
    dailyRewards
  }, rewardContext);

  return {
    ...streakProfile,
    xp,
    coins,
    badges,
    achievements,
    dailyRewards,
    lastRewardDate: currentReward?.date || streakProfile.lastRewardDate || '',
    updatedAt: new Date().toISOString()
  };
}

export function buildGamificationEventKey(event = {}, context = {}) {
  if (event.key) return String(event.key);

  const eventType = String(event.type || 'event').trim();
  const sessionId = String(event.sessionId || context.sessionId || context.session?.adaptiveSessionId || context.profile?.currentSession?.sessionId || 'session');
  const questionId = String(event.questionId || context.questionId || 'question');
  const attemptNumber = Number.isFinite(event.attemptNumber) ? Math.max(1, Math.floor(event.attemptNumber)) : Math.max(1, Math.floor(Number(context.attemptNumber) || 1));
  const date = event.date || event.answeredAt || context.today || context.endedAt || context.completedAt || '';
  const datePart = date ? new Date(date).toISOString().slice(0, 10) : '';

  if (eventType === 'daily-reward') {
    return `daily-reward::${datePart || 'today'}`;
  }
  if (eventType === 'daily-mission') {
    return `daily-mission::${datePart || 'today'}`;
  }
  if (eventType === 'session-complete') {
    return `session-complete::${sessionId}::${datePart || 'today'}`;
  }
  if (eventType === 'quiz-answer') {
    return `quiz-answer::${sessionId}::${questionId}::${attemptNumber}`;
  }
  return `${eventType}::${sessionId}::${questionId}::${attemptNumber}::${datePart || 'date'}`;
}

export function applyGamificationEvent(profile = {}, memory = {}, context = {}, event = {}) {
  const current = clone(profile);
  const eventKey = buildGamificationEventKey(event, context);
  const processed = new Set(Array.isArray(current.processedEventKeys) ? current.processedEventKeys : []);
  if (processed.has(eventKey)) {
    return current;
  }

  const next = buildGamificationReward(profile, memory, context, current);
  next.processedEventKeys = [...processed, eventKey].slice(-500);
  next.updatedAt = new Date().toISOString();
  return next;
}

export default {
  applyGamificationEvent,
  buildGamificationReward
};
