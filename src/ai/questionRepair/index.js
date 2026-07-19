export {
  analyzeRepairRecommendations,
  buildRepairRecord,
  repairQuestionBankFromAudit
} from './questionRepairEngine.js';

export {
  getIssueExplanation,
  getRepairPriority,
  getRepairSuggestion,
  getSubjectLabel,
  loadAuditReport,
  normalizeIssueType
} from './questionRepairRules.js';

export {
  createEmptyRepairStats,
  finalizeRepairStats,
  recordRecurringProblem
} from './questionRepairStatistics.js';

export default {};
