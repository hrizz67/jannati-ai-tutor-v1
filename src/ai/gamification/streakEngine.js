import { getCalendarDayDifference, getLocalDateKey } from '../../utils/localDate.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function updateGamificationStreak(profile = {}, adaptiveProfile = {}, today = new Date(), context = {}) {
  const next = clone(profile);
  const eventCompleted = context.activityCompleted !== false;
  const currentStreak = Math.max(0, toNumber(next.currentStreak, toNumber(adaptiveProfile.streak, 0)));
  const bestStreak = Math.max(toNumber(next.bestStreak, 0), currentStreak);
  const todayKey = getLocalDateKey(today);
  const lastActive = getLocalDateKey(
    next.lastRewardDate ||
    adaptiveProfile.lastStudyDate ||
    adaptiveProfile.lastAnsweredAt ||
    ''
  );
  const gap = lastActive ? getCalendarDayDifference(lastActive, todayKey) : 0;
  const previousCurrent = Math.max(0, toNumber(next.currentStreak, 0));

  if (!eventCompleted) {
    next.currentStreak = currentStreak;
    next.bestStreak = bestStreak;
    return next;
  }

  if (!lastActive) {
    next.currentStreak = Math.max(1, currentStreak || 1);
    next.bestStreak = Math.max(bestStreak, next.currentStreak);
    next.lastRewardDate = todayKey;
    return next;
  }

  if (lastActive === todayKey) {
    next.currentStreak = Math.max(currentStreak, 1);
    next.bestStreak = Math.max(bestStreak, next.currentStreak);
    next.lastRewardDate = todayKey;
    return next;
  }

  next.currentStreak = gap === 1 ? currentStreak + 1 : 1;
  next.bestStreak = bestStreak;

  if (previousCurrent > 0 && currentStreak === 0 && gap > 1) {
    next.brokenStreak = previousCurrent;
  }

  if (previousCurrent === 0 && currentStreak > 0 && toNumber(next.brokenStreak, 0) > 0) {
    next.recoveryStreak = currentStreak;
  }

  next.bestStreak = Math.max(bestStreak, next.currentStreak);
  next.lastRewardDate = todayKey;

  return next;
}

export function resetGamificationStreak(profile = {}) {
  const next = clone(profile);
  next.currentStreak = 0;
  next.brokenStreak = 0;
  next.recoveryStreak = 0;
  return next;
}

export default {
  updateGamificationStreak,
  resetGamificationStreak
};
