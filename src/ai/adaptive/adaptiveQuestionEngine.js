import { rankAdaptiveQuestions, selectAdaptiveQuestion } from './adaptiveSelector.js';
import { buildAdaptiveStatistics } from './adaptiveStatistics.js';

export function buildAdaptiveQuestionDecision(candidates = [], options = {}) {
  const statistics = buildAdaptiveStatistics(candidates, options);
  const ranked = rankAdaptiveQuestions(candidates, { ...options }, statistics);
  const selectedQuestion = ranked.questions[0] || null;
  const meta = selectedQuestion?.smartQuestion || selectedQuestion?.adaptiveQuestion || {};

  return {
    selectedQuestion,
    question: selectedQuestion,
    selectionReason: meta.selectionReason || 'Latihan dipilih secara seimbang.',
    confidenceLevel: meta.confidenceLevel || 'medium',
    mistakeReason: meta.mistakeReason || '',
    priorityScore: meta.priorityScore || 0,
    questions: ranked.questions,
    statistics: ranked.statistics || statistics,
    revisionQueue: Array.isArray(statistics.revisionPlan?.subjects)
      ? statistics.revisionPlan.subjects.flatMap(subject => subject?.topics || [])
      : [],
    ranked: ranked.questions,
    fallbackUsed: false
  };
}

export function selectAdaptiveQuestionWithFallback(candidates = [], options = {}) {
  try {
    return selectAdaptiveQuestion(candidates, options);
  } catch {
    return Array.isArray(candidates) ? candidates[0] || null : null;
  }
}

export default {
  buildAdaptiveQuestionDecision,
  selectAdaptiveQuestionWithFallback
};
