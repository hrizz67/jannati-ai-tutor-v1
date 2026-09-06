import { getCalendarDayDifference, getLocalDateKey } from '../../utils/localDate.js';

function cloneProfile(profile) {
  return JSON.parse(JSON.stringify(profile || {}));
}

export function updateStreak(profile = {}) {
  const nextProfile = cloneProfile(profile);
  const today = getLocalDateKey();
  const lastStudyDate = nextProfile.lastStudyDate || '';

  if (!lastStudyDate) {
    nextProfile.streak = 1;
    nextProfile.lastStudyDate = today;
    return nextProfile;
  }

  if (lastStudyDate === today) {
    nextProfile.lastStudyDate = today;
    return nextProfile;
  }

  const gap = getCalendarDayDifference(lastStudyDate, today);
  if (gap === 1) {
    nextProfile.streak = (nextProfile.streak || 0) + 1;
  } else if (gap > 1) {
    nextProfile.streak = 1;
  }

  nextProfile.lastStudyDate = today;
  return nextProfile;
}

export function resetStreak(profile = {}) {
  const nextProfile = cloneProfile(profile);
  nextProfile.streak = 0;
  nextProfile.lastStudyDate = '';
  return nextProfile;
}

