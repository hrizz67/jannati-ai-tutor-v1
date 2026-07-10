function cloneProfile(profile) {
  return JSON.parse(JSON.stringify(profile || {}));
}

function todayString() {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const localTime = new Date(now.getTime() + offsetMinutes * 60 * 1000);
  return localTime.toISOString().slice(0, 10);
}

function daysBetween(dateA, dateB) {
  const a = new Date(`${dateA}T00:00:00`);
  const b = new Date(`${dateB}T00:00:00`);
  const diff = b.getTime() - a.getTime();
  return Math.round(diff / 86400000);
}

export function updateStreak(profile = {}) {
  const nextProfile = cloneProfile(profile);
  const today = todayString();
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

  const gap = daysBetween(lastStudyDate, today);
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

