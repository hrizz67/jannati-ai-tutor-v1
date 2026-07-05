import { diversifyQuestions } from '../diversity/questionDiversityEngine.js';
import { applyContextIntelligence } from './contextEngine.js';
import { applyDistractorIntelligence } from './distractorEngine.js';
import { applyNumberIntelligence } from './numberEngine.js';
import { applyStemIntelligence } from './stemEngine.js';
import { applyTemplateIntelligence } from './templateEngine.js';

export function createQuestionSessionState(seed = Date.now()) {
  return {
    seed,
    usedStems: new Set(),
    usedTemplates: new Set(),
    usedContexts: new Set(),
    usedNumbers: new Set(),
    usedDistractors: new Set(),
    usedAnswerPositions: new Set()
  };
}

export function enhanceQuestion(question = {}, state, index = 0, options = {}) {
  state.index = index;
  const withStem = applyStemIntelligence(question, state);
  const withContext = applyContextIntelligence(withStem, state);
  const withNumbers = applyNumberIntelligence(withContext, state);
  const withTemplate = applyTemplateIntelligence(withNumbers, state);
  const withDistractors = applyDistractorIntelligence(withTemplate, state);
  return {
    ...withDistractors,
    qip: {
      ...(withDistractors.qip || {}),
      reasonSelected: options.allowReinforcement ? 'Adaptive review retained, QIP varied surface form' : 'Balanced QIP session selection',
      adaptiveTrigger: options.allowReinforcement || options.allowAdaptiveOverride ? 'allowed' : 'none',
      difficulty: withDistractors.difficulty || withDistractors.qde?.difficulty || 'mudah'
    }
  };
}

export function buildBalancedBaseSession(options = {}) {
  return diversifyQuestions(options);
}
