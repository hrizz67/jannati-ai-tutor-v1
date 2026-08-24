import { getAdaptivePerformanceSummary, getSubjectPerformance, getTopicPerformance } from '../ai/adaptive/performanceTracker.js';
import { calculateMastery } from '../ai/adaptive/masteryEngine.js';
import { recommendAdaptiveAction } from '../ai/adaptive/recommendationEngine.js';
import { buildSpacedRevisionSchedule } from '../ai/adaptive/spacedRevision.js';
import { getStudentDisplayName } from '../utils/displayFormatter.js';

export function createMockParentProfile(baseProfile = null) {
  return {
    studentId: 'mock-parent-insights',
    name: getStudentDisplayName(baseProfile, 'Murid'),
    totals: {
      questionsAnswered: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      studyMinutes: 0
    },
    topics: {},
    subjects: {},
    adaptivePerformance: {
      version: 1,
      totalQuestions: 0,
      correctQuestions: 0,
      incorrectQuestions: 0,
      totalTime: 0,
      averageTime: 0,
      subjects: {},
      events: [],
      updatedAt: ''
    }
  };
}

function hasEnoughData(profile = {}) {
  const totals = profile?.totals || {};
  const totalQuestions = Number(totals.questionsAnswered || totals.totalQuestions || 0);
  const subjectCount = Object.keys(profile?.topics || {}).length + Object.keys(profile?.subjects || {}).length;
  const hasIdentity = Boolean(
    profile?.studentId ||
    profile?.name ||
    profile?.fullName ||
    profile?.displayName
  );
  return hasIdentity || totalQuestions > 0 || subjectCount > 0;
}

function isDevelopmentMode(options = {}) {
  if (typeof options.allowMock === 'boolean') return options.allowMock;
  return Boolean(
    options.dev ||
    options.development ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV)
  );
}

export function resolveParentProfile(profile = null, options = {}) {
  if (profile && typeof profile === 'object' && hasEnoughData(profile)) {
    return profile;
  }
  if (isDevelopmentMode(options)) {
    return createMockParentProfile(profile);
  }
  return null;
}

export function readAdaptiveInsights(profile = null, options = {}) {
  const nextProfile = resolveParentProfile(profile, options);
  if (!nextProfile) {
    return {
      profile: {},
      performance: {
        version: 1,
        totalQuestions: 0,
        correctQuestions: 0,
        incorrectQuestions: 0,
        totalTime: 0,
        averageTime: 0,
        subjects: {},
        events: [],
        updatedAt: ''
      },
      revisionSchedule: {
        generatedAt: new Date().toISOString(),
        schedule: []
      }
    };
  }
  const summary = getAdaptivePerformanceSummary(nextProfile);
  const revisionSchedule = buildSpacedRevisionSchedule(nextProfile, { now: new Date() });

  return {
    profile: {
      studentId: nextProfile.studentId || '',
      name: getStudentDisplayName(nextProfile, 'Murid'),
      year: nextProfile.year || 'Tahun 2'
    },
    performance: summary,
    revisionSchedule
  };
}

export function readSubjectInsight(profile = null, subjectId = '', options = {}) {
  const nextProfile = resolveParentProfile(profile, options);
  if (!nextProfile) {
    return {
      subjectId,
      performance: {
        attempts: 0,
        correct: 0,
        incorrect: 0,
        totalTime: 0,
        averageTime: 0,
        usedHintCount: 0,
        usedExplainCount: 0,
        lastAnsweredAt: '',
        events: []
      },
      topics: []
    };
  }
  const subjectPerformance = getSubjectPerformance(nextProfile, subjectId);
  const topicKeys = Object.keys(subjectPerformance?.topics || {});
  const topicSummaries = topicKeys.map(topicId => {
    const topicPerformance = getTopicPerformance(nextProfile, subjectId, topicId);
    const mastery = calculateMastery({
      total: topicPerformance.attempts,
      correct: topicPerformance.correct,
      wrong: topicPerformance.incorrect,
      averageTime: topicPerformance.averageTime,
      usedHintCount: topicPerformance.usedHintCount,
      usedExplainCount: topicPerformance.usedExplainCount,
      lastPlayed: topicPerformance.lastAnsweredAt
    });
    const recommendation = recommendAdaptiveAction({
      mastery,
      attempts: topicPerformance.attempts,
      correct: topicPerformance.correct,
      incorrect: topicPerformance.incorrect,
      averageTime: topicPerformance.averageTime,
      revisionPriority: 0
    });

    return {
      subjectId,
      topicId,
      mastery,
      recommendation: recommendation.recommendation,
      recommendationKey: recommendation.recommendationKey || recommendation.action || recommendation.recommendation,
      performance: topicPerformance
    };
  });

  return {
    subjectId,
    performance: subjectPerformance,
    topics: topicSummaries
  };
}

export default {
  createMockParentProfile,
  readAdaptiveInsights,
  readSubjectInsight,
  resolveParentProfile
};
