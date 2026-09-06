import { getCalendarDayDifference, getLocalDateKey } from '../utils/localDate.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function updateStreak(profile = {}, event = {}) {
  const todayKey = getLocalDateKey(event.activityDate || event.lastActivityDate || new Date());
  const lastActivityDate = getLocalDateKey(profile.lastActivityDate || profile.lastRewardDate || '');
  const currentStreak = Math.max(0, toNumber(profile.currentStreak, 0));
  const bestStreak = Math.max(0, toNumber(profile.bestStreak, 0), currentStreak);
  const active = event.activityCompleted !== false;

  if (!active) {
    return {
      currentStreak,
      bestStreak,
      lastActivityDate
    };
  }

  if (!lastActivityDate) {
    return {
      currentStreak: 1,
      bestStreak: Math.max(bestStreak, 1),
      lastActivityDate: todayKey
    };
  }

  if (lastActivityDate === todayKey) {
    return {
      currentStreak: Math.max(currentStreak, 1),
      bestStreak: Math.max(bestStreak, currentStreak || 1),
      lastActivityDate: todayKey
    };
  }

  const dayGap = getCalendarDayDifference(lastActivityDate, todayKey);
  const nextCurrent = dayGap === 1 ? currentStreak + 1 : 1;

  return {
    currentStreak: nextCurrent,
    bestStreak: Math.max(bestStreak, nextCurrent),
    lastActivityDate: todayKey,
    brokenStreak: dayGap > 1 && currentStreak > 0 ? currentStreak : Math.max(0, toNumber(profile.brokenStreak, 0))
  };
}

export default {
  updateStreak
};
