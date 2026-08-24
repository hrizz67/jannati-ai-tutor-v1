import {
  alignDifficulty,
  inferDifficulty,
  inferQuestionStyle,
  normalizeDifficultyLabel
} from './questionQualityRules.js';

export function evaluateDifficulty(question = {}, context = {}) {
  const text = String(question.q || question.question || context.text || '');
  const inferredDifficulty = inferDifficulty(question, text);
  const providedDifficulty = normalizeDifficultyLabel(question.difficulty || question.qip?.metadata?.difficulty || '');
  const alignmentScore = alignDifficulty(providedDifficulty, inferredDifficulty);
  const style = inferQuestionStyle(question, text);

  return {
    providedDifficulty,
    inferredDifficulty,
    alignmentScore,
    questionStyle: style,
    qualityDifficulty: inferredDifficulty
  };
}

export function classifyDifficultyFromStyle(questionStyle = 'identify', question = {}) {
  const provided = normalizeDifficultyLabel(question.difficulty || question.qip?.metadata?.difficulty || '');
  if (questionStyle === 'KBAT') return 'KBAT';
  if (questionStyle === 'scenario' || questionStyle === 'application' || questionStyle === 'fill_blank') return provided || 'medium';
  if (questionStyle === 'matching') return provided || 'medium';
  return provided || 'easy';
}

export default {
  classifyDifficultyFromStyle,
  evaluateDifficulty
};
