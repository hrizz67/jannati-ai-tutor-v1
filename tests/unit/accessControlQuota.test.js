import { describe, expect, it } from 'vitest';
import { buildAdaptivePracticeSession } from '../../src/ai/adaptive/adaptivePracticeEngine.js';
import {
  FREE_DAILY_QUESTION_LIMIT,
  canStartFreeQuestionSession,
  canSubmitFreeQuestion,
  capQuestionCountToRemainingQuota,
  getDailyQuestionCount,
  resolveQuestionQuotaSubjectId,
  resolveSessionResumeSubjectId
} from '../../src/services/accessControl.js';

const today = '2026-09-06';

function attempt(overrides = {}) {
  return {
    sessionId: 'session-1',
    questionId: 'math-1',
    subjectId: 'math',
    topicId: 'numbers',
    attemptNumber: 1,
    answeredAt: `${today}T01:00:00.000Z`,
    ...overrides
  };
}

function count(records, subjectId = 'math', profileHistory = []) {
  return getDailyQuestionCount(
    { history: profileHistory },
    { learningHistory: records },
    today,
    subjectId
  );
}

describe('Free daily question occurrence identity', () => {
  it('counts two attempts for the same session and question as one unit', () => {
    expect(count([
      attempt(),
      attempt({ attemptNumber: 2, answeredAt: `${today}T01:01:00.000Z` })
    ])).toBe(1);
  });

  it('counts wrong, wrong, then correct retries as one unit', () => {
    expect(count([
      attempt({ correct: false }),
      attempt({ attemptNumber: 2, correct: false, answeredAt: `${today}T01:01:00.000Z` }),
      attempt({ attemptNumber: 3, correct: true, answeredAt: `${today}T01:02:00.000Z` })
    ])).toBe(1);
  });

  it('counts the same question in two different sessions twice', () => {
    expect(count([
      attempt({ sessionId: 'session-1' }),
      attempt({ sessionId: 'session-2', answeredAt: `${today}T02:00:00.000Z` })
    ])).toBe(2);
  });

  it('counts two distinct questions in the same session twice', () => {
    expect(count([
      attempt({ questionId: 'math-1' }),
      attempt({ questionId: 'math-2', answeredAt: `${today}T02:00:00.000Z` })
    ])).toBe(2);
  });

  it('preserves subject-scoped BM and Math filtering', () => {
    const records = [
      attempt({ questionId: 'math-1', subjectId: 'math' }),
      attempt({ questionId: 'bm-1', subjectId: 'bm', topicId: 'ayat', answeredAt: `${today}T02:00:00.000Z` })
    ];
    expect(count(records, 'math')).toBe(1);
    expect(count(records, 'bm')).toBe(1);
  });

  it('excludes prior-day attempts', () => {
    expect(count([
      attempt(),
      attempt({ questionId: 'math-old', answeredAt: '2026-09-05T10:00:00.000Z' })
    ])).toBe(1);
  });

  it('uses a deterministic conservative fallback for legacy records without sessionId', () => {
    expect(count([
      attempt({ sessionId: null, attemptNumber: 1 }),
      attempt({ sessionId: null, attemptNumber: 2, answeredAt: `${today}T03:00:00.000Z` })
    ])).toBe(1);
  });

  it('does not inflate a logical record mirrored across profile and adaptive history', () => {
    const profileRecord = attempt({ eventId: 'shared-event', answeredAt: `${today}T04:00:00.000Z` });
    const adaptiveRecord = attempt({ eventId: 'shared-event', answeredAt: `${today}T04:00:01.000Z` });
    expect(count([adaptiveRecord], 'math', [profileRecord])).toBe(1);
  });
});

describe('Free answer-time quota decisions', () => {
  const wrongAttempt = {
    sessionId: 'session-10',
    questionId: 'math-10',
    status: 'wrong',
    answeredAt: `${today}T05:00:00.000Z`
  };

  it('allows retry of the already-counted current question at the limit', () => {
    expect(canSubmitFreeQuestion({
      dailyQuestionCount: FREE_DAILY_QUESTION_LIMIT,
      questionId: 'math-10',
      sessionId: 'session-10',
      sessionAnswers: [wrongAttempt],
      dateKey: today
    })).toBe(true);
  });

  it('blocks a new current question at the limit', () => {
    expect(canSubmitFreeQuestion({
      dailyQuestionCount: FREE_DAILY_QUESTION_LIMIT,
      questionId: 'math-11',
      sessionId: 'session-10',
      sessionAnswers: [wrongAttempt],
      dateKey: today
    })).toBe(false);
  });

  it('allows an existing interactive resume at the limit but blocks restart as fresh work', () => {
    expect(canStartFreeQuestionSession({
      dailyQuestionCount: FREE_DAILY_QUESTION_LIMIT,
      restoreFromResume: true,
      resumeExistingSession: true
    })).toBe(true);
    expect(canStartFreeQuestionSession({
      dailyQuestionCount: FREE_DAILY_QUESTION_LIMIT,
      restoreFromResume: true,
      resumeExistingSession: false
    })).toBe(false);
  });

  it('prefers the real question subject over a synthetic adaptive fallback', () => {
    expect(resolveQuestionQuotaSubjectId({ subjectId: 'math' }, 'adaptive', 'bm')).toBe('math');
    expect(resolveQuestionQuotaSubjectId({}, 'adaptive', 'bm')).toBe('bm');
  });

  it('uses the persisted resume subject before other completion fallbacks', () => {
    expect(resolveSessionResumeSubjectId(
      { resumeSubjectId: 'math', quotaSubjectId: 'bm' },
      { subjectId: 'science' },
      'adaptive'
    )).toBe('math');
    expect(resolveSessionResumeSubjectId(
      { resumeSubjectId: 'adaptive', quotaSubjectId: 'math' },
      { subjectId: 'science' },
      'adaptive'
    )).toBe('math');
  });
});

describe('Adaptive practice remaining quota', () => {
  it('caps the planned session to the exact remaining subject quota', () => {
    expect(capQuestionCountToRemainingQuota(10, 7)).toBe(3);
    const subject = {
      id: 'math',
      title: 'Matematik',
      topics: [{
        id: 'numbers',
        title: 'Nombor',
        questions: Array.from({ length: 6 }, (_, index) => ({
          id: `math-${index + 1}`,
          q: `Soalan ${index + 1}`,
          answer: String(index + 1)
        }))
      }]
    };
    const session = buildAdaptivePracticeSession({}, [subject], {
      questionCount: capQuestionCountToRemainingQuota(10, 7),
      subjectId: 'math',
      seed: 'remaining-quota'
    });
    expect(session.requestedQuestions).toBe(3);
    expect(session.questions).toHaveLength(3);
  });
});
