import { readAdaptiveInsights, buildParentSummary, buildRecommendationSummary, buildRevisionSummary, resolveParentProfile } from '../parentInsights/index.js';
import { buildDailyStudyPlan } from './dailyPlanBuilder.js';
import { buildWeeklyStudyPlan } from './weeklyPlanBuilder.js';
import { buildStudyPriorityMap, getSubjectLabel } from './studyPriority.js';

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRecentActivity(history = []) {
  return (Array.isArray(history) ? history : []).slice(0, 10).map(item => ({
    date: safeText(item?.date, ''),
    subject: getSubjectLabel(item?.subjectId || item?.subject),
    topic: safeText(item?.topic || item?.topicTitle, 'Topik'),
    percent: clamp(safeNumber(item?.percent, 0), 0, 100)
  }));
}

function buildOnboardingSignals(options = {}) {
  return {
    candidates: [
      {
        subjectId: 'math',
        topicId: 'nombor_asas',
        topicLabel: 'Asas Nombor',
        reason: 'Onboarding: asas nombor untuk memulakan sesi.',
        priority: 'high',
        recommendationKey: 'review',
        activityType: 'review',
        mastery: 0,
        isOverdue: false,
        dueInDays: 0,
        overdueDays: 0
      },
      {
        subjectId: 'bm',
        topicId: 'bacaan_asas',
        topicLabel: 'Bacaan Asas',
        reason: 'Onboarding: bacaan ringkas dan ayat mudah.',
        priority: 'high',
        recommendationKey: 'review',
        activityType: 'practice',
        mastery: 0,
        isOverdue: false,
        dueInDays: 0,
        overdueDays: 0
      }
    ],
    recentSubjects: [],
    availableStudyMinutes: safeNumber(options.availableStudyMinutes, 20)
  };
}

function extractDirectSubjectSignals(profile = {}) {
  const subjects = profile?.subjects && typeof profile.subjects === 'object' ? profile.subjects : {};
  const topics = profile?.topics && typeof profile.topics === 'object' ? profile.topics : {};
  const items = [];

  Object.entries(subjects).forEach(([subjectId, subjectData]) => {
    const subjectMastery = clamp(safeNumber(subjectData?.mastery, 0), 0, 100);
    const topicEntries = Object.entries(topics?.[subjectId] || {});
    if (!topicEntries.length) return;

    const strongestTopic = topicEntries.reduce((best, [topicId, topicData]) => {
      const mastery = clamp(safeNumber(topicData?.mastery ?? topicData?.accuracy, 0), 0, 100);
      const candidate = {
        subjectId,
        topicId,
        topicLabel: safeText(topicData?.title || topicId, topicId),
        mastery,
        recommendationKey: mastery >= 85 || subjectMastery >= 85 ? 'increase_difficulty' : mastery < 60 || subjectMastery < 60 ? 'review' : 'normal_practice',
        reason: mastery >= 85 || subjectMastery >= 85
          ? 'Penguasaan kukuh, sesuai untuk cabaran seterusnya.'
          : mastery < 60 || subjectMastery < 60
            ? 'Penguasaan masih rendah, perlu ulang kaji.'
            : 'Latihan seimbang masih sesuai.',
        activityType: mastery >= 85 || subjectMastery >= 85 ? 'challenge' : mastery < 60 || subjectMastery < 60 ? 'review' : 'practice',
        priority: mastery >= 85 || subjectMastery >= 85 ? 'low' : mastery < 60 || subjectMastery < 60 ? 'high' : 'medium',
        isOverdue: false,
        dueInDays: 0,
        overdueDays: 0
      };
      if (!best) return candidate;
      return candidate.mastery > best.mastery ? candidate : best;
    }, null);

    if (strongestTopic) {
      items.push(strongestTopic);
    }
  });

  return items;
}

function collectSignals(profile = {}, options = {}) {
  const parentProfile = resolveParentProfile(profile, { allowMock: false, ...options });
  if (!parentProfile) {
    return {
      parentProfile: null,
      adaptiveInsights: readAdaptiveInsights(null, { allowMock: false }),
      parentSummary: buildParentSummary(null),
      recommendationSummary: buildRecommendationSummary(null),
      revisionSummary: buildRevisionSummary(null),
      recentActivity: [],
      candidates: [],
      recentSubjects: [],
      availableStudyMinutes: safeNumber(options.availableStudyMinutes, 20),
      onboarding: true
    };
  }

  const adaptiveInsights = readAdaptiveInsights(parentProfile, { allowMock: false });
  const parentSummary = buildParentSummary(parentProfile);
  const recommendationSummary = buildRecommendationSummary(parentProfile);
  const revisionSummary = buildRevisionSummary(parentProfile, { now: options.date || new Date() });
  const recentActivity = normalizeRecentActivity(parentProfile.history || []);
  const availableStudyMinutes = clamp(
    safeNumber(
      options.availableStudyMinutes ??
      options.studyMinutes ??
      parentProfile.availableStudyMinutes ??
      parentSummary.studyTime,
      0
    ),
    5,
    60
  );

  const candidates = [
    ...extractDirectSubjectSignals(parentProfile),
    ...(Array.isArray(recommendationSummary.focusTopics) ? recommendationSummary.focusTopics : []).map(topic => ({
      subjectId: topic.subjectId,
      topicId: topic.topicId,
      topicLabel: topic.topicId,
      mastery: safeNumber(topic.mastery, 0),
      recommendationKey: topic.recommendationKey || 'review',
      reason: topic.recommendationKey === 'review'
        ? 'Perlu ulang kaji.'
        : topic.recommendationKey === 'increase_difficulty'
          ? 'Boleh cuba aras lebih mencabar.'
          : 'Teruskan latihan seimbang.',
      activityType: topic.recommendationKey === 'increase_difficulty' ? 'challenge' : topic.recommendationKey === 'review' ? 'review' : 'practice',
      priority: 'medium'
    })),
    ...(Array.isArray(revisionSummary.overdueReviews) ? revisionSummary.overdueReviews : []).map(item => ({
      subjectId: item.subjectId,
      topicId: item.topicId,
      topicLabel: item.topicId,
      mastery: safeNumber(item.mastery, 0),
      recommendationKey: 'review',
      reason: item.reason || 'Perlu ulang segera.',
      activityType: 'revision',
      isOverdue: true,
      overdueDays: safeNumber(item.overdueDays, 0),
      dueInDays: 0,
      priority: 'high'
    })),
    ...(Array.isArray(revisionSummary.upcomingReviewSchedule) ? revisionSummary.upcomingReviewSchedule : []).map(item => ({
      subjectId: item.subjectId,
      topicId: item.topicId,
      topicLabel: item.topicId,
      mastery: safeNumber(item.mastery, 0),
      recommendationKey: 'review',
      reason: item.reason || 'Perlu ulang kaji tidak lama lagi.',
      activityType: 'revision',
      isOverdue: false,
      overdueDays: 0,
      dueInDays: safeNumber(item.dueInDays, 0),
      priority: 'medium'
    })),
    ...(Array.isArray(recommendationSummary.weakestSubjects) ? recommendationSummary.weakestSubjects : []).map(item => ({
      subjectId: item.subjectId,
      topicId: item.topicId,
      topicLabel: item.topicId,
      mastery: safeNumber(item.mastery, 0),
      recommendationKey: 'review',
      reason: 'Penguasaan masih rendah.',
      activityType: 'practice',
      priority: 'high'
    })),
    ...(Array.isArray(recommendationSummary.strongestSubjects) ? recommendationSummary.strongestSubjects : []).map(item => ({
      subjectId: item.subjectId,
      topicId: item.topicId,
      topicLabel: item.topicId,
      mastery: safeNumber(item.mastery, 0),
      recommendationKey: 'increase_difficulty',
      reason: 'Topik ini boleh diberi cabaran baharu.',
      activityType: 'challenge',
      priority: 'low'
    }))
  ];

  return {
    parentProfile,
    adaptiveInsights,
    parentSummary,
    recommendationSummary,
    revisionSummary,
    recentActivity,
    candidates,
    recentSubjects: recentActivity.map(item => item.subject).filter(Boolean),
    availableStudyMinutes,
    onboarding: false
  };
}

export function buildStudyPlanner(profile = null, options = {}) {
  const signals = collectSignals(profile || {}, options);
  const dailyPlan = buildDailyStudyPlan(signals, options);
  const weeklyPlan = buildWeeklyStudyPlan(signals, options);
  const parentSummary = signals.parentSummary || buildParentSummary(null);
  const recommendationSummary = signals.recommendationSummary || buildRecommendationSummary(null);
  const revisionSummary = signals.revisionSummary || buildRevisionSummary(null);
  const dailyBlocks = Array.isArray(dailyPlan.blocks) ? dailyPlan.blocks : [];

  return {
    plannerVersion: 1,
    generatedAt: new Date(options.date || new Date()).toISOString(),
    onboarding: Boolean(signals.onboarding || dailyPlan.onboarding),
    availableStudyMinutes: signals.availableStudyMinutes,
    parentSummary,
    recommendationSummary,
    revisionSummary,
    recentActivity: signals.recentActivity,
    dailyPlan,
    weeklyPlan,
    parentSummaryText: signals.onboarding
      ? 'Pelan permulaan disediakan untuk membantu murid memulakan rutin belajar.'
      : dailyBlocks.length
        ? `Hari ini mengutamakan ${dailyBlocks[0].subject} - ${dailyBlocks[0].topic}.`
        : 'Tiada pelan harian tersedia.',
    signals: {
      candidateCount: signals.candidates.length,
      focusCount: Array.isArray(recommendationSummary.focusTopics) ? recommendationSummary.focusTopics.length : 0,
      overdueCount: Array.isArray(revisionSummary.overdueReviews) ? revisionSummary.overdueReviews.length : 0
    }
  };
}

export function buildDailyPlanner(profile = null, options = {}) {
  return buildStudyPlanner(profile, options).dailyPlan;
}

export function buildWeeklyPlanner(profile = null, options = {}) {
  return buildStudyPlanner(profile, options).weeklyPlan;
}

export function buildPlannerSignals(profile = null, options = {}) {
  return collectSignals(profile || {}, options);
}

export default {
  buildStudyPlanner,
  buildDailyPlanner,
  buildWeeklyPlanner,
  buildPlannerSignals
};
