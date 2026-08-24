import { rankAdaptiveQuestionPriorities } from './questionPriority.js';
import { buildAdaptiveStatistics, getSessionBalancePenalty, updateSessionCounts } from './adaptiveStatistics.js';

function buildSignature(question = {}) {
  return [
    question?.id || question?.questionId || '',
    question?.subjectId || question?.qip?.metadata?.subject || '',
    question?.topicId || question?.qip?.metadata?.topic || '',
    question?.q || question?.question || question?.stem || ''
  ].join('::');
}

function cloneQuestion(question = {}) {
  return JSON.parse(JSON.stringify(question ?? {}));
}

function compareQuestions(left = {}, right = {}) {
  const a = left.smartQuestion || left.adaptiveQuestion || {};
  const b = right.smartQuestion || right.adaptiveQuestion || {};
  if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
  if (b.score !== a.score) return b.score - a.score;
  if (b.sessionBalancePenalty !== a.sessionBalancePenalty) return a.sessionBalancePenalty - b.sessionBalancePenalty;
  if (a.subjectId !== b.subjectId) return String(a.subjectId || '').localeCompare(String(b.subjectId || ''));
  if (a.topicId !== b.topicId) return String(a.topicId || '').localeCompare(String(b.topicId || ''));
  if (a.questionId !== b.questionId) return String(a.questionId || '').localeCompare(String(b.questionId || ''));
  return String(left.q || left.question || '').localeCompare(String(right.q || right.question || ''));
}

function applySelectionPenalty(question = {}, statistics = {}, selected = []) {
  const adaptive = question.smartQuestion || question.adaptiveQuestion || {};
  const sessionPenalty = getSessionBalancePenalty(statistics, question);
  const selectedTopicCount = selected.filter(item => {
    const meta = item.smartQuestion || item.adaptiveQuestion || {};
    return meta.subjectId === adaptive.subjectId && meta.topicId === adaptive.topicId;
  }).length;
  const selectedSubjectCount = selected.filter(item => {
    const meta = item.smartQuestion || item.adaptiveQuestion || {};
    return meta.subjectId === adaptive.subjectId;
  }).length;
  const subjectPenalty = Math.max(0, selectedSubjectCount - 3) * 4;
  const topicPenalty = Math.max(0, selectedTopicCount - 1) * 8;
  return sessionPenalty + subjectPenalty + topicPenalty;
}

export function rankAdaptiveQuestions(candidates = [], options = {}, providedStatistics = null) {
  const baseStatistics = providedStatistics && typeof providedStatistics === 'object'
    ? providedStatistics
    : buildAdaptiveStatistics(candidates, options);
  const ranked = rankAdaptiveQuestionPriorities(candidates, options, baseStatistics);
  const remaining = ranked.map(cloneQuestion);
  const ordered = [];

  while (remaining.length) {
    let bestIndex = 0;
    let bestAdjustedScore = Number.NEGATIVE_INFINITY;
    let bestPriority = null;

    remaining.forEach((candidate, index) => {
      const priority = candidate.smartQuestion || candidate.adaptiveQuestion || {};
      const balancePenalty = applySelectionPenalty(candidate, baseStatistics, ordered);
      const adjustedScore = (priority.priorityScore || 0) - balancePenalty;
      if (adjustedScore > bestAdjustedScore) {
        bestIndex = index;
        bestAdjustedScore = adjustedScore;
        bestPriority = priority;
        return;
      }
      if (adjustedScore === bestAdjustedScore && compareQuestions(candidate, remaining[bestIndex]) < 0) {
        bestIndex = index;
        bestAdjustedScore = adjustedScore;
        bestPriority = priority;
      }
    });

    const [chosen] = remaining.splice(bestIndex, 1);
    const nextStatistics = updateSessionCounts(baseStatistics, chosen);
    ordered.push({
      ...chosen,
      smartQuestion: {
        ...(chosen.smartQuestion || {}),
        selectionReason: bestPriority?.selectionReason || chosen.smartQuestion?.selectionReason || 'Latihan dipilih secara seimbang.',
        confidenceLevel: bestPriority?.confidenceLevel || chosen.smartQuestion?.confidenceLevel || 'medium',
        mistakeReason: bestPriority?.mistakeReason || chosen.smartQuestion?.mistakeReason || '',
        priorityScore: bestPriority?.priorityScore || chosen.smartQuestion?.priorityScore || 0,
        sessionBalancePenalty: applySelectionPenalty(chosen, nextStatistics, ordered)
      },
      adaptiveQuestion: {
        ...(chosen.adaptiveQuestion || {}),
        selectionReason: bestPriority?.selectionReason || chosen.adaptiveQuestion?.selectionReason || 'Latihan dipilih secara seimbang.',
        confidenceLevel: bestPriority?.confidenceLevel || chosen.adaptiveQuestion?.confidenceLevel || 'medium',
        mistakeReason: bestPriority?.mistakeReason || chosen.adaptiveQuestion?.mistakeReason || '',
        priorityScore: bestPriority?.priorityScore || chosen.adaptiveQuestion?.priorityScore || 0,
        sessionBalancePenalty: applySelectionPenalty(chosen, nextStatistics, ordered)
      }
    });
  }

  return {
    questions: ordered,
    statistics: baseStatistics
  };
}

export function selectAdaptiveQuestion(candidates = [], options = {}) {
  const result = rankAdaptiveQuestions(candidates, options);
  return result.questions[0] || null;
}

export default {
  rankAdaptiveQuestions,
  selectAdaptiveQuestion
};
