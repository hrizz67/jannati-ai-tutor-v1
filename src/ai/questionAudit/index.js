import {
  auditQuestionBank,
  analyzeQuestion,
  buildIssueRecord
} from './questionAuditEngine.js';
import {
  classifySeverity,
  countWords,
  detectAnswerQuality,
  detectDifficultyQuality,
  detectLanguageQuality,
  detectQuestionCompleteness,
  detectRepetitionQuality,
  getQuestionText,
  hasContext,
  hasInstruction,
  listAnswers,
  normalizeText,
  qualityScoreFromIssues,
  splitAlternatives
} from './questionAuditRules.js';
import {
  addIssue,
  createEmptyStats,
  finalizeStats,
  increment,
  recordPattern
} from './questionAuditStatistics.js';

export {
  auditQuestionBank,
  analyzeQuestion,
  buildIssueRecord,
  classifySeverity,
  countWords,
  detectAnswerQuality,
  detectDifficultyQuality,
  detectLanguageQuality,
  detectQuestionCompleteness,
  detectRepetitionQuality,
  getQuestionText,
  hasContext,
  hasInstruction,
  listAnswers,
  normalizeText,
  qualityScoreFromIssues,
  splitAlternatives,
  addIssue,
  createEmptyStats,
  finalizeStats,
  increment,
  recordPattern
};

export default {
  auditQuestionBank,
  analyzeQuestion,
  buildIssueRecord
};
