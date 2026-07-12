function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function localDayKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function getDaysSinceLastStudy(profile = {}, memory = {}) {
  const lastStudy = profile.lastStudyDate || profile.lastAnsweredAt || memory.adaptive?.lastStudyDate || memory.lastAnsweredAt || null;
  if (!lastStudy) return null;
  const today = localDayKey(new Date());
  const last = localDayKey(lastStudy);
  if (!today || !last) return null;
  const diff = new Date(`${today}T00:00:00`).getTime() - new Date(`${last}T00:00:00`).getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

function getTimeGreeting(timeOfDay = new Date()) {
  const hour = new Date(timeOfDay).getHours();
  if (hour < 12) return 'Selamat pagi';
  if (hour < 18) return 'Selamat tengah hari';
  return 'Selamat malam';
}

export function buildDailyGreetingNarrative(profile = {}, memory = {}, observation = {}, context = {}) {
  const streak = toNumber(profile.streak, 0);
  const consistency = toNumber(observation.studyConsistency, 0);
  const daysSinceLastStudy = getDaysSinceLastStudy(profile, memory);
  const timeGreeting = getTimeGreeting(context.timeOfDay || new Date());

  if (daysSinceLastStudy !== null && daysSinceLastStudy >= 4) {
    return 'Selamat datang semula. Jom kita sambung belajar.';
  }

  if (streak >= 3 && consistency >= 70) {
    return 'Hebat! Kamu hadir belajar dengan baik minggu ini.';
  }

  if (timeGreeting === 'Selamat pagi') {
    return 'Selamat pagi! Jom kita mulakan hari ini.';
  }

  if (timeGreeting === 'Selamat tengah hari') {
    return 'Selamat tengah hari! Jom kita teruskan langkah hari ini.';
  }

  return 'Selamat malam! Jom belajar dengan tenang.';
}

export default {
  buildDailyGreetingNarrative
};
