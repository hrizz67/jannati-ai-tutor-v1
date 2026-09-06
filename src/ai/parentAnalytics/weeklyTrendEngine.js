import { getWeeklySummary } from '../adaptive/weeklyAnalyticsEngine.js';
import { getLocalDateKey } from '../../utils/localDate.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function countMissions(profile = {}, dateRange = []) {
  const rewards = Array.isArray(profile.dailyRewards) ? profile.dailyRewards : [];
  const activeDays = new Set(dateRange.filter(Boolean));
  return rewards.filter(item => activeDays.has(getLocalDateKey(item?.date))).length;
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
    today: getLocalDateKey()
  };
}

export default {
  buildWeeklyTrend
};
