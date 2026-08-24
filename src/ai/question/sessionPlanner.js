import { createDuplicateState } from './duplicateDetector.js';
import { applyContextIntelligenceToSession } from './contextEngine.js';
import { applyNumberIntelligenceToSession } from './numberEngine.js';
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
  const numbered = options.featureFlags?.QUESTION_NUMBER_ENGINE === true
    ? applyNumberIntelligenceToSession(selected.questions, options)
    : selected.questions;
  return {
    questions: numbered,
    rejected: selected.rejected,
    plan: {
      requested: options.count || registered.length,
      candidates: registered.length,
      selected: selected.questions.length,
      stemEngine: options.featureFlags?.QUESTION_STEM_ENGINE !== false,
      contextEngine: options.featureFlags?.QUESTION_CONTEXT_ENGINE !== false,
      numberEngine: options.featureFlags?.QUESTION_NUMBER_ENGINE === true,
      topicBalance: true,
      difficultyBalance: true
    }
  };
}
