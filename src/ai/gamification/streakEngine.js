function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function localDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  const a = new Date(`${dateA}T00:00:00`);
  const b = new Date(`${dateB}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function updateGamificationStreak(profile = {}, adaptiveProfile = {}, today = new Date(), context = {}) {
  const next = clone(profile);
  const eventCompleted = context.activityCompleted !== false;
  const currentStreak = Math.max(0, toNumber(next.currentStreak, toNumber(adaptiveProfile.streak, 0)));
  const bestStreak = Math.max(toNumber(next.bestStreak, 0), currentStreak);
  const todayKey = localDayKey(today);
  const lastActive = localDayKey(
    next.lastRewardDate ||
    adaptiveProfile.lastStudyDate ||
    adaptiveProfile.lastAnsweredAt ||
    ''
  );
  const gap = lastActive ? daysBetween(lastActive, todayKey) : 0;
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
