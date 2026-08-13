import assert from 'node:assert/strict';
import { recordQuestionResult } from '../../src/ai/adaptive/adaptiveSessionEngine.js';

const baseProfile = {
  xp: 0,
  level: 1,
  streak: 0,
  subjects: {},
  topics: {},
  learningHistory: [],
  questionLog: [],
  sessionHistory: [],
  currentSession: {
    sessionId: 'regression-session',
    subjectId: 'bahasa-melayu',
    topicId: 'ayat',
    questions: [],
    correct: 0,
    wrong: 0
  }
};

const result = recordQuestionResult(baseProfile, {
  sessionId: 'regression-session',
  questionId: 'BM-AYAT-REGRESSION-001',
  subjectId: 'bahasa-melayu',
  topicId: 'ayat',
  correct: true,
  difficulty: 'medium',
  timeSpent: 12,
  answeredAt: '2026-08-14T00:00:00.000Z'
});

assert.equal(result.summary.skipped, undefined, 'A fresh answer must be recorded.');
assert.equal(result.profile.totalQuestions, 1, 'Lifetime question total must increase.');
assert.equal(result.profile.correctQuestions, 1, 'Lifetime correct total must increase.');
assert.equal(result.profile.learningHistory.length, 1, 'Learning history must contain the answer.');
assert.equal(result.profile.learningHistory[0].questionId, 'BM-AYAT-REGRESSION-001');
assert.equal(result.profile.learningHistory[0].masteryAfter, result.summary.topicMastery, 'History and summary must use the same post-answer mastery.');
assert.equal(result.profile.learningHistory[0].confidenceAfter, result.summary.topicConfidence, 'History and summary must use the same post-answer confidence.');
assert.ok(Number.isFinite(result.profile.learningHistory[0].masteryAfter), 'Post-answer mastery must be numeric.');
assert.ok(Number.isFinite(result.profile.learningHistory[0].confidenceAfter), 'Post-answer confidence must be numeric.');

console.log('Adaptive session regression tests passed.');
