import { describe, expect, it } from 'vitest';
import {
  appendCreditedQuizAttempt,
  canRetryQuizAnswer,
  isQuizAnswerChecked,
  reconcileQuizSessionCredits,
  summarizeCreditedQuizOutcomes
} from '../../src/utils/quizSessionOutcome.js';

function emptySession(overrides = {}) {
  return { correct: 0, almost: 0, wrong: 0, xp: 0, coins: 0, answers: [], ...overrides };
}

function submit(session, questionId, status, attemptNumber) {
  return appendCreditedQuizAttempt(session, { questionId, status, attemptNumber });
}

describe('quiz navigation feedback contract', () => {
  it('does not treat blank or hint feedback as an answered question', () => {
    expect(isQuizAnswerChecked(null)).toBe(false);
    expect(isQuizAnswerChecked({ status: 'empty' })).toBe(false);
    expect(isQuizAnswerChecked({ status: 'hint' })).toBe(false);
    expect(canRetryQuizAnswer({ status: 'empty' })).toBe(false);
    expect(canRetryQuizAnswer({ status: 'hint' })).toBe(false);
  });

  it('makes correct terminal while retaining retry for wrong and almost', () => {
    expect(isQuizAnswerChecked({ status: 'correct' })).toBe(true);
    expect(canRetryQuizAnswer({ status: 'correct' })).toBe(false);
    expect(canRetryQuizAnswer({ status: 'wrong' })).toBe(true);
    expect(canRetryQuizAnswer({ status: 'almost' })).toBe(true);
  });
});

describe('credited quiz outcome semantics', () => {
  it('credits one direct correct answer with the capped reward and score', () => {
    const result = submit(emptySession(), 'q1', 'correct', 1);
    const summary = summarizeCreditedQuizOutcomes(result.session.answers, { totalQuestions: 1 });

    expect(result.accepted).toBe(true);
    expect(result.rewardDelta).toEqual({ xp: 10, coins: 5 });
    expect(result.session).toMatchObject({ correct: 1, almost: 0, wrong: 0, xp: 10, coins: 5 });
    expect(summary.percent).toBe(100);
  });

  it('rejects a defensive resubmit after correct with zero extra credit or reward', () => {
    const first = submit(emptySession(), 'q1', 'correct', 1);
    const second = submit(first.session, 'q1', 'correct', 2);

    expect(second.accepted).toBe(false);
    expect(second.rewardDelta).toEqual({ xp: 0, coins: 0 });
    expect(second.session.answers).toHaveLength(1);
    expect(second.session).toMatchObject({ correct: 1, almost: 0, wrong: 0, xp: 10, coins: 5 });
  });

  it('upgrades wrong to correct instead of counting two questions', () => {
    const wrong = submit(emptySession(), 'q1', 'wrong', 1);
    const correct = submit(wrong.session, 'q1', 'correct', 2);

    expect(correct.rewardDelta).toEqual({ xp: 10, coins: 5 });
    expect(correct.session).toMatchObject({ correct: 1, almost: 0, wrong: 0, xp: 10, coins: 5 });
    expect(correct.session.answers.map(item => item.attemptNumber)).toEqual([1, 2]);
  });

  it('upgrades almost to correct using only the reward delta', () => {
    const almost = submit(emptySession(), 'q1', 'almost', 1);
    const correct = submit(almost.session, 'q1', 'correct', 2);

    expect(almost.rewardDelta).toEqual({ xp: 5, coins: 2 });
    expect(correct.rewardDelta).toEqual({ xp: 5, coins: 3 });
    expect(correct.session).toMatchObject({ correct: 1, almost: 0, wrong: 0, xp: 10, coins: 5 });
    expect(summarizeCreditedQuizOutcomes(correct.session.answers, { totalQuestions: 1 }).percent).toBe(100);
  });

  it('retains repeated wrong attempts but credits only one wrong outcome', () => {
    const first = submit(emptySession(), 'q1', 'wrong', 1);
    const second = submit(first.session, 'q1', 'wrong', 2);

    expect(second.accepted).toBe(true);
    expect(second.rewardDelta).toEqual({ xp: 0, coins: 0 });
    expect(second.session.answers).toHaveLength(2);
    expect(second.session).toMatchObject({ correct: 0, almost: 0, wrong: 1, xp: 0, coins: 0 });
  });

  it('does not let a lower later attempt worsen or duplicate an almost outcome', () => {
    const almost = submit(emptySession(), 'q1', 'almost', 1);
    const wrong = submit(almost.session, 'q1', 'wrong', 2);

    expect(wrong.accepted).toBe(true);
    expect(wrong.rewardDelta).toEqual({ xp: 0, coins: 0 });
    expect(wrong.session).toMatchObject({ correct: 0, almost: 1, wrong: 0, xp: 5, coins: 2 });
  });

  it('summarizes a multi-question mixture as unique outcomes and caps percent', () => {
    let session = submit(emptySession(), 'q1', 'correct', 1).session;
    session = submit(session, 'q2', 'almost', 1).session;
    session = submit(session, 'q3', 'wrong', 1).session;
    session = submit(session, 'q3', 'wrong', 2).session;
    const summary = summarizeCreditedQuizOutcomes(session.answers, {
      questionIds: ['q1', 'q2', 'q3'],
      totalQuestions: 3
    });

    expect(summary).toMatchObject({ correct: 1, almost: 1, wrong: 1, answered: 3, score: 1.5, xp: 15, coins: 7, percent: 50 });
    expect(summary.correct + summary.almost + summary.wrong).toBe(3);
    expect(summary.percent).toBeLessThanOrEqual(100);
  });

  it('filters unplanned attempts and clamps even a polluted answer history to 100', () => {
    const answers = [
      { questionId: 'q1', status: 'correct' },
      { questionId: 'q1', status: 'correct' },
      { questionId: 'legacy-extra', status: 'correct' }
    ];
    const summary = summarizeCreditedQuizOutcomes(answers, { questionIds: ['q1'], totalQuestions: 1 });

    expect(summary).toMatchObject({ correct: 1, almost: 0, wrong: 0, answered: 1, percent: 100 });
  });

  it('does not reintroduce unplanned legacy credit when appending a valid attempt', () => {
    const polluted = emptySession({
      correct: 1,
      xp: 10,
      coins: 5,
      answers: [{ questionId: 'legacy-extra', status: 'correct', attemptNumber: 1 }]
    });
    const result = appendCreditedQuizAttempt(
      polluted,
      { questionId: 'q1', status: 'wrong', attemptNumber: 1 },
      { questionIds: ['q1'] }
    );

    expect(result.session).toMatchObject({ correct: 0, almost: 0, wrong: 1, xp: 0, coins: 0 });
    expect(result.session.answers).toHaveLength(2);
  });

  it('reconciles resumed counters while preserving answer attempts and checked feedback', () => {
    const resume = {
      state: { answer: '4', feedback: { status: 'correct' } },
      session: emptySession({
        correct: 2,
        xp: 20,
        coins: 10,
        answers: [{ questionId: 'q1', status: 'correct', attemptNumber: 1 }]
      })
    };
    const restoredSession = reconcileQuizSessionCredits(resume.session, { questionIds: ['q1'] });

    expect(restoredSession).toMatchObject({ correct: 1, almost: 0, wrong: 0, xp: 10, coins: 5 });
    expect(restoredSession.answers).toEqual(resume.session.answers);
    expect(resume.state.answer).toBe('4');
    expect(isQuizAnswerChecked(resume.state.feedback)).toBe(true);
    expect(canRetryQuizAnswer(resume.state.feedback)).toBe(false);
  });
});
