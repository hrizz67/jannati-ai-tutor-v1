import { resolveParentProfile } from './insightsService.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildParentSummary(profile = null) {
  const nextProfile = resolveParentProfile(profile);
  const totals = nextProfile?.totals || {};
  const questionsAnswered = toNumber(totals.questionsAnswered ?? totals.totalQuestions, 0);
  const correct = toNumber(totals.correct ?? totals.correctQuestions, 0);
  const wrong = toNumber(totals.wrong ?? totals.incorrectQuestions, 0);
  const studyMinutes = toNumber(totals.studyMinutes ?? 0, 0);
  const accuracy = questionsAnswered > 0 ? Math.round((correct / questionsAnswered) * 100) : toNumber(totals.accuracy, 0);

  return {
    studentId: nextProfile?.studentId || '',
    name: nextProfile?.name || '',
    questionsAnswered,
    correct,
    wrong,
    accuracy: Math.max(0, Math.min(100, accuracy)),
    studyTime: studyMinutes,
    streak: {
      current: toNumber(totals.currentStreak, 0),
      longest: toNumber(totals.longestStreak, 0)
    }
  };
}

export default {
  buildParentSummary
};
