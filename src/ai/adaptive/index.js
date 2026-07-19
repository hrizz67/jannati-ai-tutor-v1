export {
  buildAdaptiveQuestionDecision,
  selectAdaptiveQuestionWithFallback
} from './adaptiveQuestionEngine.js';

export {
  buildAdaptiveLearningDecision,
  buildAdaptiveLearningSnapshot,
  recordAdaptiveResponse,
  requestNextAdaptiveQuestion
} from './adaptiveController.js';

export {
  rankAdaptiveQuestions,
  selectAdaptiveQuestion
} from './adaptiveSelector.js';

export {
  ADAPTIVE_PERFORMANCE_VERSION,
  createAdaptivePerformanceState,
  getAdaptivePerformanceSummary,
  getSubjectPerformance,
  getTopicPerformance,
  listTrackedTopics,
  normalizeAdaptiveEvent,
  recordAdaptiveAnswer
} from './performanceTracker.js';

export {
  buildAdaptiveStatistics,
  getSessionBalancePenalty,
  updateSessionCounts
} from './adaptiveStatistics.js';

export {
  calculateAdaptiveQuestionPriority,
  rankAdaptiveQuestionPriorities
} from './questionPriority.js';

export {
  scoreAdaptiveQuestion
} from './questionScoring.js';

export {
  recommendAdaptiveAction
} from './recommendationEngine.js';

export {
  calculateRevisionPriority,
  buildSpacedRevisionEntry,
  buildSpacedRevisionSchedule
} from './spacedRevision.js';

export default {};
