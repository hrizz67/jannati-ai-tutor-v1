const ALLOWED_DURATIONS = [10, 15, 20, 30, 45, 60];

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nearestAllowedDuration(value, fallback = 20) {
  const target = clamp(Math.round(toNumber(value, fallback)), 5, 60);
  return ALLOWED_DURATIONS.reduce((best, current) => {
    const bestDelta = Math.abs(best - target);
    const currentDelta = Math.abs(current - target);
    if (currentDelta < bestDelta) return current;
    if (currentDelta === bestDelta && current < best) return current;
    return best;
  }, fallback);
}

function isWeekend(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return false;
  const day = value.getDay();
  return day === 0 || day === 6;
}

export function normalizeDuration(minutes, fallback = 20) {
  return nearestAllowedDuration(minutes, fallback);
}

export function getDefaultStudyDuration(date = new Date()) {
  return isWeekend(date) ? 30 : 20;
}

export function getAvailableStudyDuration(input = {}, date = new Date()) {
  const raw = toNumber(
    input.availableStudyMinutes ??
    input.availableMinutes ??
    input.studyMinutes ??
    input.preferredMinutes,
    0
  );
  const fallback = getDefaultStudyDuration(date);
  return normalizeDuration(raw > 0 ? raw : fallback, fallback);
}

export function allocateDurations(blockCount = 1, availableMinutes = 20) {
  const totalAllowed = normalizeDuration(
    getAvailableStudyDuration({ availableStudyMinutes: availableMinutes }, new Date()),
    getDefaultStudyDuration(new Date())
  );
  const maxBlocksByTime = Math.max(1, Math.floor(totalAllowed / 5));
  const count = Math.max(1, Math.min(4, Math.floor(toNumber(blockCount, 1)), maxBlocksByTime));
  const base = Math.max(5, Math.floor((totalAllowed / count) / 5) * 5);
  const durations = Array.from({ length: count }, () => base);
  let remaining = Math.max(0, totalAllowed - (base * count));
  let index = 0;

  while (remaining >= 5 && durations.length) {
    durations[index % durations.length] += 5;
    remaining -= 5;
    index += 1;
  }

  return durations.map(durationMinutes => clamp(normalizeDuration(durationMinutes, base), 5, 60));
}

export function splitDurationAcrossDays(totalMinutes = 20, dayCount = 7, date = new Date()) {
  const total = normalizeDuration(totalMinutes, getDefaultStudyDuration(date));
  const count = Math.max(1, Math.floor(toNumber(dayCount, 7)));
  const days = Array.from({ length: count }, () => getDefaultStudyDuration(date));
  const lighterDays = isWeekend(date) ? [0, 1] : [5, 6];
  lighterDays.forEach(index => {
    if (index < days.length) days[index] = 10;
  });
  const fixed = days.reduce((sum, value) => sum + value, 0);
  const leftover = Math.max(0, total - fixed);
  const addPerDay = leftover > 0 ? Math.floor(leftover / days.length) : 0;
  return days.map((value, index) => normalizeDuration(value + addPerDay + (index < leftover % days.length ? 1 : 0), value));
}

export default {
  ALLOWED_DURATIONS,
  normalizeDuration,
  getDefaultStudyDuration,
  getAvailableStudyDuration,
  allocateDurations,
  splitDurationAcrossDays
};
