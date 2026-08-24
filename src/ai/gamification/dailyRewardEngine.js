function localDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildDailyReward(profile = {}, context = {}, existingRewards = []) {
  const today = localDayKey(context.today || new Date());
  const rewards = Array.isArray(existingRewards) ? [...existingRewards] : [];
  const alreadyRewarded = rewards.some(item => item?.date === today);
  const activityDay = localDayKey(profile.lastAnsweredAt || profile.lastStudyDate || '');
  const hasTodayActivity = activityDay === today && (toNumber(profile.totalQuestions, 0) > 0 || toNumber(profile.studyMinutes, 0) > 0);
  const hasEvidence = hasTodayActivity || Boolean(context.dailyMissionCompleted || context.sessionCompleted);

  if (!hasEvidence || alreadyRewarded) {
    return rewards;
  }

  rewards.unshift({
    date: today,
    xp: 15,
    coins: 5,
    label: 'Ganjaran Harian',
    reason: 'Kamu belajar hari ini.'
  });

  return rewards;
}

export default {
  buildDailyReward
};
