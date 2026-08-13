import { loadProfile, saveProfile } from './storageEngine.js';
import { addXP, calculateXP } from './xpEngine.js';
import { calculateLevel } from './levelEngine.js';
import { updateStreak } from './streakEngine.js';
import { recordAnswer } from './masteryEngine.js';
import { saveMemory, hasProcessedAnswer, markProcessedAnswer } from '../memory/memoryStorage.js';
import { getStudentMemory } from '../memory/studentMemory.js';
import { updateTopicMemory } from '../memory/topicMemory.js';
import { recordMistake } from '../memory/mistakeMemory.js';
import { createDailySnapshot } from '../memory/dailySnapshot.js';
import { getRecommendationScores } from '../memory/recommendationEngine.js';

const MAX_SESSION_HISTORY = 20;
const MAX_QUESTION_LOG = 200;
const isDev = typeof import.meta !== 'undefined' ? Boolean(import.meta.env?.DEV) : false;

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function nowIso() {
  return new Date().toISOString();
}

function localDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function createSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ensureArrays(profile) {
  if (!Array.isArray(profile.sessionHistory)) profile.sessionHistory = [];
  if (!Array.isArray(profile.questionLog)) profile.questionLog = [];
  if (!Array.isArray(profile.learningHistory)) profile.learningHistory = [];
  return profile;
}

function ensureSessionState(profile) {
  ensureArrays(profile);
  if (!profile.currentSession || typeof profile.currentSession !== 'object') {
    profile.currentSession = null;
  }
  return profile;
}

function normalizeSessionInfo(sessionInfo = {}) {
  const startedAt = sessionInfo.startedAt || nowIso();
  const sessionId = sessionInfo.sessionId || createSessionId();
  const questions = Array.isArray(sessionInfo.questions) ? [...sessionInfo.questions] : [];
  return {
    sessionId,
    startedAt,
    endedAt: sessionInfo.endedAt || null,
    subjectId: sessionInfo.subjectId || null,
    topicId: sessionInfo.topicId || null,
    questions,
    plannedQuestionCount: Number.isFinite(sessionInfo.plannedQuestionCount)
      ? Math.max(0, Math.floor(sessionInfo.plannedQuestionCount))
      : questions.length,
    correct: Number.isFinite(sessionInfo.correct) ? sessionInfo.correct : 0,
    wrong: Number.isFinite(sessionInfo.wrong) ? sessionInfo.wrong : 0,
    durationSeconds: Number.isFinite(sessionInfo.durationSeconds) ? sessionInfo.durationSeconds : 0,
    completed: sessionInfo.completed === true
  };
}

function getQuestionKey({ sessionId, questionId, attemptNumber }) {
  return `${sessionId || 'no-session'}::${questionId || 'no-question'}::${attemptNumber || 1}`;
}

function getNextAttemptNumber(profile, sessionId, questionId) {
  const prefix = `${sessionId || 'no-session'}::${questionId || 'no-question'}::`;
  return (profile.questionLog || []).filter(item => typeof item.key === 'string' && item.key.startsWith(prefix)).length + 1;
}

function hasRecordedQuestion(profile, sessionId, questionId, attemptNumber) {
  const key = getQuestionKey({ sessionId, questionId, attemptNumber });
  return (profile.questionLog || []).some(item => item.key === key);
}

function pushQuestionLog(profile, entry) {
  profile.questionLog = [entry, ...(profile.questionLog || [])].slice(0, MAX_QUESTION_LOG);
  return profile;
}

function pushSessionHistory(profile, session) {
  profile.sessionHistory = [session, ...(profile.sessionHistory || [])].slice(0, MAX_SESSION_HISTORY);
  return profile;
}

function applyLifetimeTotals(profile, { correct, timeSpent, correctAnswer }) {
  profile.totalQuestions = Number.isFinite(profile.totalQuestions) ? profile.totalQuestions + 1 : 1;
  if (correct) profile.correctQuestions = Number.isFinite(profile.correctQuestions) ? profile.correctQuestions + 1 : 1;
  else profile.correctQuestions = Number.isFinite(profile.correctQuestions) ? profile.correctQuestions : 0;
  const studyMinutes = Number.isFinite(profile.studyMinutes) ? profile.studyMinutes : 0;
  const addedMinutes = Number.isFinite(timeSpent) && timeSpent > 0 ? timeSpent / 60 : 0;
  profile.studyMinutes = Math.max(0, Math.round((studyMinutes + addedMinutes) * 10) / 10);
  profile.lastStudyDate = localDayKey();
  profile.lastAnsweredAt = nowIso();
  return profile;
}

function applySubjectTotals(profile, subjectId, correct) {
  if (!subjectId) return profile;
  if (!profile.subjects || typeof profile.subjects !== 'object') profile.subjects = {};
  const topicRecords = Object.values(profile.topics?.[subjectId] || {});
  const total = topicRecords.reduce((sum, record) => sum + (Number(record?.total) || 0), 0);
  const correctTotal = topicRecords.reduce((sum, record) => sum + (Number(record?.correct) || 0), 0);
  const existingSubject = profile.subjects[subjectId] && typeof profile.subjects[subjectId] === 'object'
    ? profile.subjects[subjectId]
    : {};
  profile.subjects[subjectId] = {
    ...existingSubject,
    accuracy: total ? Math.round((correctTotal / total) * 100) : 0,
    correct: correctTotal,
    total
  };
  return profile;
}

function syncMemoryAfterAnswer(profile, result, summary = {}) {
  try {
    const answerKey = `${result.sessionId || profile.currentSession?.sessionId || 'no-session'}::${result.questionId || 'no-question'}::${Number.isFinite(result.attemptNumber) ? Math.floor(result.attemptNumber) : 1}`;
    if (hasProcessedAnswer(undefined, answerKey)) {
      if (isDev) {
        console.warn?.('[adaptiveSessionEngine] Skipped memory sync for duplicate answer identity.', { answerKey });
      }
      return;
    }

    let memory = getStudentMemory(profile);
    memory = updateTopicMemory(memory, profile, result);
    memory = recordMistake(memory, profile, result);
    memory = createDailySnapshot(profile, memory, result?.answeredAt ? new Date(result.answeredAt) : new Date());
    memory.recommendationScores = getRecommendationScores(memory, profile);
    memory.updatedAt = profile.lastAnsweredAt || memory.updatedAt || new Date().toISOString();
    memory.lastResult = {
      questionId: result.questionId || null,
      subjectId: result.subjectId || null,
      topicId: result.topicId || null,
      correct: Boolean(result.correct),
      difficulty: result.difficulty || null,
      xpEarned: summary.xpEarned || 0,
      answeredAt: profile.lastAnsweredAt || null
    };
    memory.learningHistory = [
      {
        answerKey,
        sessionId: result.sessionId || profile.currentSession?.sessionId || null,
        questionId: result.questionId || null,
        subjectId: result.subjectId || null,
        topicId: result.topicId || null,
        correct: Boolean(result.correct),
        difficulty: result.difficulty || null,
        timeSpent: Number.isFinite(result.timeSpent) ? result.timeSpent : 0,
        answeredAt: profile.lastAnsweredAt || null
      },
      ...(Array.isArray(memory.learningHistory) ? memory.learningHistory : [])
    ].slice(0, 300);
    memory = markProcessedAnswer(memory, answerKey);
    saveMemory(memory);
  } catch {
    // Memory updates must never block adaptive learning.
  }
}

function updateCurrentSession(profile, result, sessionId) {
  ensureSessionState(profile);
  const current = profile.currentSession;
  if (!current || current.sessionId !== sessionId) {
    return profile;
  }

  const questions = Array.isArray(current.questions) ? current.questions : [];
  current.questions = questions.includes(result.questionId) ? questions : [...questions, result.questionId];
  current.correct = (current.correct || 0) + (result.correct ? 1 : 0);
  current.wrong = (current.wrong || 0) + (result.correct ? 0 : 1);
  current.subjectId = current.subjectId || result.subjectId || null;
  current.topicId = current.topicId || result.topicId || null;
  current.updatedAt = nowIso();
  current.lastQuestionId = result.questionId || null;
  return profile;
}

function finalizeSession(profile, sessionInfo = {}) {
  ensureSessionState(profile);
  const current = profile.currentSession;
  const candidate = current && (!sessionInfo.sessionId || current.sessionId === sessionInfo.sessionId)
    ? current
    : null;
  const endedAt = sessionInfo.endedAt || nowIso();
  const startedAt = candidate?.startedAt || sessionInfo.startedAt || endedAt;
  const durationSeconds = sessionInfo.durationSeconds || candidate?.durationSeconds || Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  const endedSession = {
    sessionId: candidate?.sessionId || sessionInfo.sessionId || createSessionId(),
    startedAt,
    endedAt,
    subjectId: candidate?.subjectId || sessionInfo.subjectId || null,
    topicId: candidate?.topicId || sessionInfo.topicId || null,
    questions: Array.isArray(candidate?.questions) ? [...candidate.questions] : Array.isArray(sessionInfo.questions) ? [...sessionInfo.questions] : [],
    plannedQuestionCount: Number.isFinite(sessionInfo.plannedQuestionCount)
      ? Math.max(0, Math.floor(sessionInfo.plannedQuestionCount))
      : candidate?.plannedQuestionCount || (Array.isArray(candidate?.questions) ? candidate.questions.length : 0),
    correct: Number.isFinite(sessionInfo.correct) ? sessionInfo.correct : candidate?.correct || 0,
    wrong: Number.isFinite(sessionInfo.wrong) ? sessionInfo.wrong : candidate?.wrong || 0,
    durationSeconds,
    completed: sessionInfo.completed === true || candidate?.completed === true
  };

  profile.sessionHistory = [endedSession, ...(profile.sessionHistory || [])].slice(0, MAX_SESSION_HISTORY);
  if (current && candidate && current.sessionId === candidate.sessionId) {
    profile.currentSession = null;
  }
  return profile;
}

/**
 * Returns the adaptive profile from storage.
 */
export function getAdaptiveProfile() {
  return loadProfile();
}

/**
 * Saves the adaptive profile safely.
 */
export function saveAdaptiveProfile(profile) {
  return saveProfile(profile);
}

/**
 * Records the start of a learning session.
 */
export function recordSessionStart(profile, sessionInfo = {}) {
  const nextProfile = ensureSessionState(clone(profile));
  const session = normalizeSessionInfo(sessionInfo);
  const current = nextProfile.currentSession;

  if (current && current.sessionId && current.sessionId !== session.sessionId) {
    finalizeSession(nextProfile, {
      sessionId: current.sessionId,
      subjectId: current.subjectId,
      topicId: current.topicId,
      durationSeconds: current.durationSeconds || 0,
      completed: false,
      endedAt: nowIso()
    });
  }

  const existing = nextProfile.currentSession && nextProfile.currentSession.sessionId === session.sessionId
    ? nextProfile.currentSession
    : null;

  nextProfile.currentSession = {
    ...(existing || {}),
    ...session,
    startedAt: existing?.startedAt || session.startedAt,
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: nowIso()
  };

  return saveAdaptiveProfile(nextProfile);
}

/**
 * Records one answered question into the adaptive profile.
 */
export function recordQuestionResult(profile, result = {}) {
  const nextProfile = ensureSessionState(clone(profile));
  const {
    questionId,
    subjectId,
    topicId,
    correct,
    difficulty = 'medium',
    timeSpent = 0,
    answeredAt = nowIso(),
    sessionId,
    usedHint = false,
    usedExplain = false,
    misconceptionType = ''
  } = result || {};

  if (!questionId || !subjectId || !topicId) {
    return {
      profile: saveAdaptiveProfile(nextProfile),
      summary: {
        skipped: true,
        xpEarned: 0,
        levelBefore: calculateLevel(nextProfile.xp || 0),
        levelAfter: calculateLevel(nextProfile.xp || 0),
        levelUp: false,
        streak: nextProfile.streak || 0,
        topicMastery: 0,
        topicConfidence: 0
      }
    };
  }

  const activeSessionId = sessionId || nextProfile.currentSession?.sessionId || createSessionId();
  const attemptNumber = Number.isFinite(result.attemptNumber) && result.attemptNumber > 0
    ? Math.floor(result.attemptNumber)
    : getNextAttemptNumber(nextProfile, activeSessionId, questionId);
  if (hasRecordedQuestion(nextProfile, activeSessionId, questionId, attemptNumber)) {
    return {
      profile: saveAdaptiveProfile(nextProfile),
      summary: {
        skipped: true,
        duplicate: true,
        xpEarned: 0,
        levelBefore: calculateLevel(nextProfile.xp || 0),
        levelAfter: calculateLevel(nextProfile.xp || 0),
        levelUp: false,
        streak: nextProfile.streak || 0,
        topicMastery: nextProfile.topics?.[subjectId]?.[topicId]?.mastery || 0,
        topicConfidence: nextProfile.topics?.[subjectId]?.[topicId]?.confidence || 0
      }
    };
  }

  const levelBefore = calculateLevel(nextProfile.xp || 0);
  const safeCorrect = Boolean(correct);
  const xpEarned = calculateXP(safeCorrect ? 1 : 0, difficulty);
  const topicBefore = nextProfile.topics?.[subjectId]?.[topicId] || {};
  const masteryBefore = Number.isFinite(topicBefore.mastery) ? topicBefore.mastery : 0;
  const confidenceBefore = Number.isFinite(topicBefore.confidence) ? topicBefore.confidence : 0;

  recordAnswer(nextProfile, {
    subjectId,
    topicId,
    correct: safeCorrect,
    difficulty,
    timeSpent,
    usedHint: Boolean(usedHint),
    usedExplain: Boolean(usedExplain)
  });

  const afterXPProfile = addXP(nextProfile, xpEarned);
  Object.assign(nextProfile, afterXPProfile);

  const beforeStreak = nextProfile.streak || 0;
  const streakProfile = updateStreak(nextProfile);
  Object.assign(nextProfile, streakProfile);

  nextProfile.level = calculateLevel(nextProfile.xp || 0);
  nextProfile.lastAnsweredAt = answeredAt || nowIso();

  applyLifetimeTotals(nextProfile, { correct: safeCorrect, timeSpent });
  applySubjectTotals(nextProfile, subjectId, safeCorrect);
  const topicMastery = nextProfile.topics?.[subjectId]?.[topicId] || {};

  nextProfile.learningHistory = [
    {
      questionId,
      subjectId,
      topicId,
      attemptNumber,
      correct: safeCorrect,
      difficulty,
      xpEarned,
      timeSpent: Number.isFinite(timeSpent) ? timeSpent : 0,
      usedHint: Boolean(usedHint),
      usedExplain: Boolean(usedExplain),
      misconceptionType: safeCorrect ? '' : String(misconceptionType || 'UNCLASSIFIED'),
      masteryBefore,
      masteryAfter: Number.isFinite(topicMastery.mastery) ? topicMastery.mastery : null,
      confidenceBefore,
      confidenceAfter: Number.isFinite(topicMastery.confidence) ? topicMastery.confidence : null,
      answeredAt: nextProfile.lastAnsweredAt,
      sessionId: activeSessionId
    },
    ...(nextProfile.learningHistory || [])
  ].slice(0, 100);

  pushQuestionLog(nextProfile, {
    key: getQuestionKey({ sessionId: activeSessionId, questionId, attemptNumber }),
    sessionId: activeSessionId,
    questionId,
    attemptNumber,
    subjectId,
    topicId,
    answeredAt: nextProfile.lastAnsweredAt
  });

  updateCurrentSession(nextProfile, { questionId, subjectId, topicId, correct: safeCorrect }, activeSessionId);

  nextProfile.correctQuestions = Number.isFinite(nextProfile.correctQuestions) ? nextProfile.correctQuestions : 0;
  nextProfile.totalQuestions = Number.isFinite(nextProfile.totalQuestions) ? nextProfile.totalQuestions : 0;
  const savedProfile = saveAdaptiveProfile(nextProfile);
  syncMemoryAfterAnswer(savedProfile, {
    sessionId: activeSessionId,
    questionId,
    subjectId,
    topicId,
    correct: safeCorrect,
    difficulty,
    timeSpent,
    answeredAt,
    attemptNumber,
    usedHint: Boolean(usedHint),
    usedExplain: Boolean(usedExplain),
    misconceptionType: safeCorrect ? '' : String(misconceptionType || 'UNCLASSIFIED')
  }, {
    xpEarned
  });
  return {
    profile: savedProfile,
    summary: {
      xpEarned,
      levelBefore,
      levelAfter: savedProfile.level || calculateLevel(savedProfile.xp || 0),
      levelUp: (savedProfile.level || 0) > levelBefore,
      streak: savedProfile.streak || 0,
      streakChanged: (savedProfile.streak || 0) !== beforeStreak,
      topicMastery: topicMastery.mastery || 0,
      topicConfidence: topicMastery.confidence || 0
    }
  };
}

/**
 * Records the end of a learning session.
 */
export function recordSessionEnd(profile, sessionInfo = {}) {
  const nextProfile = ensureSessionState(clone(profile));
  finalizeSession(nextProfile, sessionInfo);
  return saveAdaptiveProfile(nextProfile);
}

export default {
  getAdaptiveProfile,
  recordQuestionResult,
  recordSessionEnd,
  recordSessionStart,
  saveAdaptiveProfile
};
