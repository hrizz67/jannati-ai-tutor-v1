import { formatStudyMinutes } from '../../utils/displayFormatter.js';
import { getWeeklySummary } from '../adaptive/weeklyAnalyticsEngine.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function averageSessionMinutes(profile = {}) {
  const sessions = Array.isArray(profile.sessionHistory) ? profile.sessionHistory : [];
  if (!sessions.length) return 0;
  const totalSeconds = sessions.reduce((sum, session) => sum + Math.max(0, toNumber(session.durationSeconds, 0)), 0);
  return totalSeconds > 0 ? Math.round((totalSeconds / sessions.length / 60) * 10) / 10 : 0;
}

export function buildStudyHabit(profile = {}, context = {}) {
  const weekly = getWeeklySummary(profile, { days: context.days || 7 });
  const activeDays = weekly.totals.activeDays;
  const averageMinutes = averageSessionMinutes(profile);
  const consistencyScore = activeDays >= 5 ? 'Konsisten' : activeDays >= 3 ? 'Sederhana' : activeDays > 0 ? 'Rendah' : 'Belum Ada';
  const summary = activeDays > 0
    ? `Konsisten belajar ${activeDays} hari minggu ini.`
    : 'Belum ada tabiat belajar yang mencukupi.';

  return {
    activeDays,
    averageSessionMinutes: averageMinutes,
    averageSessionLabel: averageMinutes > 0 ? `${formatStudyMinutes(averageMinutes)} / sesi` : 'Belum cukup data',
    consistencyScore,
    studyFrequency: activeDays > 0 ? `${activeDays} hari aktif` : 'Belum cukup data',
    summary,
    hasData: activeDays > 0 || averageMinutes > 0,
    weekly
  };
}

export default {
  buildStudyHabit
};
