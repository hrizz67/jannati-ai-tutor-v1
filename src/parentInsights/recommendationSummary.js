import { resolveParentProfile } from './insightsService.js';
import { getStrongTopics, getWeakTopics } from '../ai/profile/index.js';
import { calculateMastery } from '../ai/adaptive/masteryEngine.js';
import { recommendAdaptiveAction } from '../ai/adaptive/recommendationEngine.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function buildTopicSnapshot(profile = {}, subjectId = '', topicId = '') {
  const subjectTopics = profile?.topics?.[subjectId] || {};
  const record = subjectTopics?.[topicId] || {};
  const mastery = calculateMastery({
    total: toNumber(record.attempts ?? record.total, 0),
    correct: toNumber(record.correct, 0),
    wrong: toNumber(record.wrong ?? record.incorrect, 0),
    averageTime: toNumber(record.averageTime, 0),
    usedHintCount: toNumber(record.usedHintCount, 0),
    usedExplainCount: toNumber(record.usedExplainCount, 0),
    lastPlayed: record.lastAnsweredAt || record.lastPlayed || ''
  });
  const recommendation = recommendAdaptiveAction({
    mastery,
    attempts: toNumber(record.attempts ?? record.total, 0),
    correct: toNumber(record.correct, 0),
    incorrect: toNumber(record.wrong ?? record.incorrect, 0),
    averageTime: toNumber(record.averageTime, 0),
    revisionPriority: 0
  });

  return {
    subjectId,
    topicId,
    mastery,
    attempts: toNumber(record.attempts ?? record.total, 0),
    accuracy: toNumber(record.accuracy, mastery),
    recommendation: recommendation.recommendation,
    recommendationKey: recommendation.recommendationKey || recommendation.action || recommendation.recommendation
  };
}

export function buildRecommendationSummary(profile = null) {
  const nextProfile = resolveParentProfile(profile);
  if (!nextProfile) {
    return {
      strongestSubjects: [],
      weakestSubjects: [],
      focusTopics: [],
      aiRecommendations: []
    };
  }
  const weakTopics = getWeakTopics(nextProfile.studentId || 'default', 6, nextProfile);
  const strongTopics = getStrongTopics(nextProfile.studentId || 'default', 6, nextProfile);

  const focusTopics = weakTopics.slice(0, 4).map(topic => buildTopicSnapshot(nextProfile, topic.subjectId, topic.topicId));
  const strongestSubjects = strongTopics.slice(0, 3).map(topic => ({
    subjectId: topic.subjectId,
    topicId: topic.topicId,
    mastery: toNumber(topic.mastery, 0),
    accuracy: toNumber(topic.accuracy, 0)
  }));
  const weakestSubjects = weakTopics.slice(0, 3).map(topic => ({
    subjectId: topic.subjectId,
    topicId: topic.topicId,
    mastery: toNumber(topic.mastery, 0),
    accuracy: toNumber(topic.accuracy, 0)
  }));

  return {
    strongestSubjects,
    weakestSubjects,
    focusTopics,
    aiRecommendations: focusTopics.map(topic => ({
      subjectId: topic.subjectId,
      topicId: topic.topicId,
      recommendation: topic.recommendation,
      recommendationKey: topic.recommendationKey
    }))
  };
}

export default {
  buildRecommendationSummary
};
