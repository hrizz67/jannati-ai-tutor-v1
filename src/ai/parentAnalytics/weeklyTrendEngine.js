import { getWeeklySummary } from '../adaptive/weeklyAnalyticsEngine.js';

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

function countMissions(profile = {}, dateRange = []) {
  const rewards = Array.isArray(profile.dailyRewards) ? profile.dailyRewards : [];
  const activeDays = new Set(dateRange.filter(Boolean));
  return rewards.filter(item => activeDays.has(String(item?.date || '').slice(0, 10))).length;
}

export function buildWeeklyTrend(profile = {}, context = {}) {
  const days = Math.max(1, Math.floor(toNumber(context.days, 7)));
  const weekly = getWeeklySummary(profile, { days });
  const missionsCompleted = countMissions(context.gamificationProfile || {}, weekly.daily.map(day => day.date));
  const hasData = weekly.totals.questions > 0 || weekly.totals.studyMinutes > 0 || weekly.totals.activeDays > 0;

  const summary = hasData
    ? `Minggu ini anak anda menjawab ${weekly.totals.questions} soalan dengan ketepatan ${weekly.totals.accuracy}%.`
    : 'Belum ada aktiviti dalam 7 hari terakhir.';

  return {
    range: weekly.range,
    totals: weekly.totals,
    daily: weekly.daily,
    trend: weekly.trend,
    missionsCompleted,
    hasData,
    summary,
    compact: {
      questionsLabel: `${weekly.totals.questions} soalan`,
      accuracyLabel: `${weekly.totals.accuracy}% ketepatan`,
      studyMinutesLabel: `${Math.max(0, Math.round(toNumber(weekly.totals.studyMinutes, 0)))} minit`,
      missionsLabel: `${missionsCompleted} misi`,
      trendLabel: weekly.trend?.message || 'Belum cukup data untuk analisis trend.'
    },
    today: localDayKey()
  };
}

export default {
  buildWeeklyTrend
};
