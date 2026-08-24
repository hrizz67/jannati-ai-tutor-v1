import { scoreAdaptiveQuestion } from './questionScoring.js';

function compareAdaptive(left = {}, right = {}) {
  if (right.priorityScore !== left.priorityScore) return right.priorityScore - left.priorityScore;
  if (right.weakTopicBoost !== left.weakTopicBoost) return right.weakTopicBoost - left.weakTopicBoost;
  if (right.repeatedMistakeBoost !== left.repeatedMistakeBoost) return right.repeatedMistakeBoost - left.repeatedMistakeBoost;
  if (right.lowConfidenceBoost !== left.lowConfidenceBoost) return right.lowConfidenceBoost - left.lowConfidenceBoost;
  if (right.lowAccuracyBoost !== left.lowAccuracyBoost) return right.lowAccuracyBoost - left.lowAccuracyBoost;
  if (right.longTimeNotPractisedBoost !== left.longTimeNotPractisedBoost) return right.longTimeNotPractisedBoost - left.longTimeNotPractisedBoost;
  if (right.revisionPlanMatchBoost !== left.revisionPlanMatchBoost) return right.revisionPlanMatchBoost - left.revisionPlanMatchBoost;
  if (right.knowledgeGapBoost !== left.knowledgeGapBoost) return right.knowledgeGapBoost - left.knowledgeGapBoost;
  if (left.subjectId !== right.subjectId) return String(left.subjectId || '').localeCompare(String(right.subjectId || ''));
  if (left.topicId !== right.topicId) return String(left.topicId || '').localeCompare(String(right.topicId || ''));
  if (left.questionId !== right.questionId) return String(left.questionId || '').localeCompare(String(right.questionId || ''));
  return String(left.stem || '').localeCompare(String(right.stem || ''));
}

export function calculateAdaptiveQuestionPriority(question = {}, options = {}, statistics = {}) {
  const priority = scoreAdaptiveQuestion(question, options, statistics);
  return {
    ...priority,
    question
  };
}

export function rankAdaptiveQuestionPriorities(candidates = [], options = {}, statistics = {}) {
  return (Array.isArray(candidates) ? candidates : []).map((question, index) => {
    const priority = calculateAdaptiveQuestionPriority(question, {
      ...options,
      index
    }, statistics);
    return {
      ...question,
      subjectId: priority.subjectId,
      topicId: priority.topicId,
      smartQuestion: priority,
      adaptiveQuestion: priority
    };
  }).sort((left, right) => compareAdaptive(left.smartQuestion || {}, right.smartQuestion || {}));
}

export default {
  calculateAdaptiveQuestionPriority,
  rankAdaptiveQuestionPriorities
};
