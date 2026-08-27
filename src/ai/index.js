export { buildExplanation, buildHint, buildPraise, buildLearningTips, getSubjectStrategy, getSubjectStrategyFields, buildCoachResponse, getCoachPreview } from './coach/v3/index.js';

export { buildAdaptiveRecommendation } from './adaptiveEngine.js';
export { formatStudyTime, loadAIMemory } from './memoryEngine.js';
export { buildStudentIntelligence, getStudentLevel } from './studentIntelligence.js';
export { buildMasteryMap, summarizeMastery } from './adaptive/masteryEngine.js';
export { MASTERY_STATUS } from './adaptive/masteryEngine.js';
export { buildLessonPlan } from './adaptive/lessonPlanner.js';
export { buildAdaptiveLearningSnapshot, recordAdaptiveResponse, requestNextAdaptiveQuestion } from './adaptive/adaptiveController.js';
export { getTutorResponse } from './tutorResponseEngine.js';
export { getBlockedPrerequisites, getDependencyArrow, isTopicUnlockedByGraph } from './adaptive/knowledgeGraph.js';
export { rankStrongTopics, rankWeakTopics, explainWeakness } from './adaptive/weakTopicEngine.js';
export { generateRecommendation } from './adaptive/recommendationEngine.js';
export { isWeakTopic, buildRecommendation } from './recommendationEngine.js';
export { getWeeklySummary } from './adaptive/weeklyAnalyticsEngine.js';
export { getAllSubjectAnalytics, getBestSubject, getWeakestSubject, getSubjectAttentionSummary } from './adaptive/subjectAnalyticsEngine.js';
export { generateParentReport } from './adaptive/parentReportEngine.js';
export { getTodayRevision } from './revision/revisionPlannerEngine.js';
export { getReviewQueue } from './revision/spacedRepetitionEngine.js';
export { getRecommendedDifficulty, buildDifficultyPlan } from './revision/difficultyEngine.js';
export { buildMixedRevisionSession } from './revision/mixedRevisionEngine.js';
export { buildRevisionCalendar } from './revision/revisionCalendarEngine.js';
export { speak, stop, pause, resume, replay, isSpeaking, getAvailableVoices, getVoiceAvailability, getVoiceStatus } from './voice/voiceEngine.js';
export { supportsVoice } from './voice/voiceCapability.js';

export default {};
