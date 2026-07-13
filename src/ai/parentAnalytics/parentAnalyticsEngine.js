import { buildWeeklyTrend } from './weeklyTrendEngine.js';
import { buildSubjectComparison } from './subjectComparisonEngine.js';
import { buildStudyHabit } from './studyHabitEngine.js';
import { buildImprovement } from './improvementEngine.js';
import { buildParentRecommendation } from './parentRecommendationEngine.js';
import { buildLearningTimeline } from './learningTimelineEngine.js';
import { formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';

function countByType(items = [], type) {
  return items.filter(item => item.type === type).length;
}

function buildSummary({ weeklyTrend, subjectComparison, studyHabit, recommendation, improvement }) {
  const parts = [];

  if (weeklyTrend.hasData) {
    parts.push(`${weeklyTrend.totals.questions} soalan minggu ini, ${weeklyTrend.totals.accuracy}% tepat.`);
  }

  if (subjectComparison.strongest?.subjectId) {
    parts.push(`${formatSubjectName(subjectComparison.strongest.subjectId)} paling kukuh.`);
  }

  if (recommendation.topicId) {
    parts.push(`Fokus: ${formatTopicName(recommendation.topicName || recommendation.topicId)}.`);
  } else if (studyHabit.hasData) {
    parts.push(studyHabit.summary);
  } else if (improvement.summary) {
    parts.push(improvement.summary);
  }

  return parts.slice(0, 3).join(' ');
}

export function buildParentAnalytics(profile = {}, context = {}) {
  const weeklyTrend = buildWeeklyTrend(profile, context);
  const subjectComparison = buildSubjectComparison(profile, context);
  const studyHabit = buildStudyHabit(profile, context);
  const improvement = buildImprovement(profile, context);
  const recommendation = buildParentRecommendation(profile, context);
  const timeline = buildLearningTimeline(profile, context);
  const summary = buildSummary({
    weeklyTrend,
    subjectComparison,
    studyHabit,
    recommendation,
    improvement
  });

  return {
    generatedAt: new Date().toISOString(),
    weeklyTrend: {
      ...weeklyTrend,
      summary: weeklyTrend.summary,
      compact: weeklyTrend.compact
    },
    subjectComparison,
    studyHabit,
    improvement,
    recommendation,
    timeline,
    summary: summary || 'Belum cukup data untuk analisis ibu bapa.'
  };
}

export function buildParentAnalyticsOverview(profile = {}, context = {}) {
  const analytics = buildParentAnalytics(profile, context);
  return {
    summary: analytics.summary,
    weeklyTrend: analytics.weeklyTrend,
    subjectComparison: analytics.subjectComparison,
    studyHabit: analytics.studyHabit,
    improvement: analytics.improvement,
    recommendation: analytics.recommendation,
    timeline: analytics.timeline,
    metrics: {
      weeklyQuestions: analytics.weeklyTrend.totals.questions,
      weeklyAccuracy: analytics.weeklyTrend.totals.accuracy,
      weeklyMissions: analytics.weeklyTrend.missionsCompleted,
      subjectCount: analytics.subjectComparison.ranking.length,
      timelineCount: analytics.timeline.items.length,
      rewardCount: countByType(analytics.timeline.items, 'lencana') + countByType(analytics.timeline.items, 'pencapaian')
    }
  };
}

export default {
  buildParentAnalytics,
  buildParentAnalyticsOverview
};
