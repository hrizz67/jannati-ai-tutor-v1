import { createDuplicateState } from './duplicateDetector.js';
import { applyContextIntelligenceToSession } from './contextEngine.js';
import { registerQuestionBank } from './questionRegistry.js';
import { selectQuestions } from './questionSelector.js';
import { applyStemIntelligenceToSession } from './stemEngine.js';

export function planQuestionSession(baseQuestions = [], options = {}) {
  const registered = registerQuestionBank(baseQuestions, options);
  const stemmed = options.featureFlags?.QUESTION_STEM_ENGINE === false
    ? registered
    : applyStemIntelligenceToSession(registered, options);
  const candidates = options.featureFlags?.QUESTION_CONTEXT_ENGINE === false
    ? stemmed
    : applyContextIntelligenceToSession(stemmed, options);
  const duplicateState = createDuplicateState();
  const selected = selectQuestions(candidates, {
    ...options,
    duplicateState,
    count: options.count || candidates.length
  });
  return {
    questions: selected.questions,
    rejected: selected.rejected,
    plan: {
      requested: options.count || registered.length,
      candidates: registered.length,
      selected: selected.questions.length,
      stemEngine: options.featureFlags?.QUESTION_STEM_ENGINE !== false,
      contextEngine: options.featureFlags?.QUESTION_CONTEXT_ENGINE !== false,
      topicBalance: true,
      difficultyBalance: true
    }
  };
}
