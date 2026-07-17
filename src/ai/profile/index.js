export {
  DEFAULT_STUDENT_ID,
  LEGACY_PROFILE_KEYS,
  PROFILE_VERSION,
  STORAGE_PREFIX,
  cloneStudentProfile,
  createDefaultStudentProfile,
  getStudentProfile,
  listKnownStudentIds,
  loadStudentProfile,
  normalizeStudentProfile,
  resolveStudentId,
  saveStudentProfile
} from './studentProfile.js';

export {
  applyActivityCompletion,
  applyQuestionCompletion,
  applyQuestionCompletions,
  buildStudentProgressSummary
} from './studentMemory.js';

export {
  clampConfidence,
  getConfidenceDelta,
  getTopicStatus,
  getTopicStatusLabel,
  updateConfidence
} from './confidenceEngine.js';

export {
  analyzeStudentProgress,
  getStrongTopics,
  getStudentProfileSummary,
  getSubjectProgress,
  getTopicProgress,
  getWeakTopics
} from './progressAnalyzer.js';

export {
  generateRevisionPlan,
  summarizeRevisionPlan
} from './revisionPlanner.js';
