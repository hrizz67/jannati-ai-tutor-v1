import {
  evaluateQuestionQuality,
  improveQuestionQuality,
  rankQuestionQuality,
  selectQualityQuestions
} from './questionQualityEngine.js';
import {
  alignDifficulty,
  buildAcceptedAnswers,
  countWords,
  detectMalayLanguageIssues,
  hasInstruction,
  hasSentenceContext,
  inferAnswerType,
  inferDifficulty,
  inferQuestionStyle,
  normalizeDifficultyLabel,
  normalizeText,
  scoreDiversity,
  splitWords
} from './questionQualityRules.js';
import {
  classifyDifficultyFromStyle,
  evaluateDifficulty
} from './questionDifficulty.js';

export {
  evaluateQuestionQuality,
  improveQuestionQuality,
  rankQuestionQuality,
  selectQualityQuestions
};

export {
  alignDifficulty,
  buildAcceptedAnswers,
  countWords,
  detectMalayLanguageIssues,
  hasInstruction,
  hasSentenceContext,
  inferAnswerType,
  inferDifficulty,
  inferQuestionStyle,
  normalizeDifficultyLabel,
  normalizeText,
  scoreDiversity,
  splitWords,
  classifyDifficultyFromStyle,
  evaluateDifficulty
};

export default {
  evaluateQuestionQuality,
  improveQuestionQuality,
  rankQuestionQuality,
  selectQualityQuestions
};
