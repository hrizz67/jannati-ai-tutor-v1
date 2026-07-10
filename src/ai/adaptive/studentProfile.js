export const PROFILE_VERSION = 1;

export const SUBJECT_KEYS = ['bm', 'math', 'english', 'sains', 'islam', 'arab', 'pj'];

function buildSubjectState() {
  return SUBJECT_KEYS.reduce((state, subjectId) => {
    state[subjectId] = {
      accuracy: 0,
      correct: 0,
      total: 0
    };
    return state;
  }, {});
}

function buildTopicState() {
  return SUBJECT_KEYS.reduce((state, subjectId) => {
    state[subjectId] = {};
    return state;
  }, {});
}

export function createDefaultProfile(overrides = {}) {
  return {
    version: PROFILE_VERSION,
    studentId: '',
    name: '',
    xp: 0,
    level: 1,
    streak: 0,
    lastStudyDate: '',
    totalQuestions: 0,
    correctQuestions: 0,
    studyMinutes: 0,
    subjects: buildSubjectState(),
    topics: buildTopicState(),
    ...overrides
  };
}

export const DEFAULT_PROFILE = createDefaultProfile();

