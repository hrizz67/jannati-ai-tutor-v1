import { calculateMastery } from './masteryEngine.js';
import { buildSpacedRevisionEntry, calculateRevisionPriority } from './spacedRevision.js';
import { getTopicPerformance, recordAdaptiveAnswer } from './performanceTracker.js';
import { recommendAdaptiveAction } from './recommendationEngine.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isDebugEnabled(options = {}) {
  return Boolean(
    options.debug ||
    options.adaptiveDebug ||
    process.env.ADAPTIVE_DEBUG === '1' ||
    process.env.NODE_ENV === 'development'
  );
}

function logDebug(options, payload) {
  if (!isDebugEnabled(options)) return;
  console.debug('[adaptive-controller]', payload);
}

export function buildAdaptiveLearningSnapshot(profile = {}, subjectId = '', topicId = '', options = {}) {
  const performance = getTopicPerformance(profile, subjectId, topicId);
  const mastery = calculateMastery({
    total: performance.attempts,
    correct: performance.correct,
    wrong: performance.incorrect,
    averageTime: performance.averageTime,
    usedHintCount: performance.usedHintCount,
    usedExplainCount: performance.usedExplainCount,
    lastPlayed: performance.lastAnsweredAt
  });
  const revision = buildSpacedRevisionEntry(subjectId, topicId, {
    attempts: performance.attempts,
    correct: performance.correct,
    incorrect: performance.incorrect,
    averageTime: performance.averageTime,
    usedHintCount: performance.usedHintCount,
    usedExplainCount: performance.usedExplainCount,
    lastAnsweredAt: performance.lastAnsweredAt
  }, {
    mastery,
    now: options.now || new Date()
  });
  const recommendation = recommendAdaptiveAction({
    mastery,
    attempts: performance.attempts,
    correct: performance.correct,
    incorrect: performance.incorrect,
    averageTime: performance.averageTime,
    revisionPriority: revision.priority
  });

  const snapshot = {
    subjectId,
    topicId,
    mastery,
    recommendation: recommendation.recommendation,
    recommendationKey: recommendation.recommendationKey || recommendation.action || recommendation.recommendation,
    reviewPriority: revision.priority,
    reviewLevel: revision.reviewLevel,
    nextReviewAt: revision.nextReviewAt,
    reason: recommendation.reason,
    performance
  };

  logDebug(options, {
    subjectId,
    topicId,
    mastery,
    recommendation: recommendation.recommendation,
    reviewPriority: revision.priority
  });

  return snapshot;
}

export function requestNextAdaptiveQuestion(candidates = [], profile = {}, options = {}) {
  const source = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
  if (!source.length) {
    return {
      selectedQuestion: null,
      question: null,
      mastery: 0,
      recommendation: 'review',
      reviewPriority: 0,
      reason: 'Tiada calon soalan.'
    };
  }

  const ranked = source.map((question, index) => {
    const subjectId = String(question.subjectId || question?.qip?.metadata?.subject || options.subjectId || '').trim();
    const topicId = String(question.topicId || question?.qip?.metadata?.topic || options.topicId || '').trim();
    const performance = getTopicPerformance(profile, subjectId, topicId);
    const mastery = calculateMastery({
      total: performance.attempts,
      correct: performance.correct,
      wrong: performance.incorrect,
      averageTime: performance.averageTime,
      usedHintCount: performance.usedHintCount,
      usedExplainCount: performance.usedExplainCount,
      lastPlayed: performance.lastAnsweredAt
    });
    const revision = calculateRevisionPriority(performance, mastery, options);
    const recommendation = recommendAdaptiveAction({
      mastery,
      attempts: performance.attempts,
      correct: performance.correct,
      incorrect: performance.incorrect,
      averageTime: performance.averageTime,
      revisionPriority: revision.priority
    });

    const score = clamp(
      Math.round(
        revision.priority * 0.45 +
        (100 - mastery) * 0.4 +
        (question.smartQuestion?.score || question.adaptiveQuestion?.priorityScore || 0) * 0.15
      ),
      0,
      100
    );

    return {
      ...question,
      adaptiveLearning: {
        subjectId,
        topicId,
        mastery,
        recommendation: recommendation.recommendation,
        recommendationKey: recommendation.recommendationKey || recommendation.action || recommendation.recommendation,
        reviewPriority: revision.priority,
        reviewLevel: revision.reviewLevel,
        reason: recommendation.reason,
        index
      },
      score
    };
  });

  ranked.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if ((right.adaptiveLearning?.reviewPriority || 0) !== (left.adaptiveLearning?.reviewPriority || 0)) {
      return (right.adaptiveLearning?.reviewPriority || 0) - (left.adaptiveLearning?.reviewPriority || 0);
    }
    if ((left.adaptiveLearning?.mastery || 0) !== (right.adaptiveLearning?.mastery || 0)) {
      return (left.adaptiveLearning?.mastery || 0) - (right.adaptiveLearning?.mastery || 0);
    }
    return String(left.id || '').localeCompare(String(right.id || ''));
  });

  const selectedQuestion = ranked[0] || null;
  const selectedMeta = selectedQuestion?.adaptiveLearning || {};
  const subjectId = String(selectedQuestion?.subjectId || options.subjectId || '').trim();
  const topicId = String(selectedQuestion?.topicId || options.topicId || '').trim();

  return {
    selectedQuestion,
    question: selectedQuestion,
    mastery: selectedMeta.mastery || 0,
    recommendation: selectedMeta.recommendation || 'review',
    recommendationKey: selectedMeta.recommendationKey || selectedMeta.recommendation || 'review',
    reviewPriority: selectedMeta.reviewPriority || 0,
    reviewLevel: selectedMeta.reviewLevel || 'review',
    reason: selectedMeta.reason || 'Latihan disusun mengikut tahap semasa.',
    subjectId,
    topicId,
    ranked
  };
}

export function recordAdaptiveResponse(profile = {}, event = {}) {
  return recordAdaptiveAnswer(profile, event);
}

export function buildAdaptiveLearningDecision(candidates = [], profile = {}, options = {}) {
  const decision = requestNextAdaptiveQuestion(candidates, profile, options);
  return {
    ...decision,
    debug: isDebugEnabled(options)
      ? {
          subjectId: decision.subjectId,
          topicId: decision.topicId,
          mastery: decision.mastery,
          recommendation: decision.recommendation,
          recommendationKey: decision.recommendationKey,
          reviewPriority: decision.reviewPriority
        }
      : null
  };
}

export default {
  buildAdaptiveLearningDecision,
  buildAdaptiveLearningSnapshot,
  recordAdaptiveResponse,
  requestNextAdaptiveQuestion
};
