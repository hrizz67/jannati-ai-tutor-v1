import { describe, expect, it } from 'vitest';
import { createCanonicalProgress, toParentProgressProfile } from '../../src/utils/canonicalProgress.js';
import { getCanonicalAnalytics } from '../../src/utils/canonicalAnalytics.js';

const subjects = {
  math: { tambah: { attempts: 5, correct: 3, wrong: 2 } }
};

describe('P1-I complete history zero-count evidence and Parent consistency', () => {
  it('preserves a counted history with zero correct, rather than borrowing three from topic totals', () => {
    const progress = createCanonicalProgress({
      history: [{ attempts: 2, correct: 0, wrong: 2 }],
      topics: subjects
    });
    expect(progress.global.totalAttempts).toBe(2);
    expect(progress.global.totalCorrect).toBe(0);
    expect(progress.global.totalWrong).toBe(2);
    expect(getCanonicalAnalytics({ canonicalProgress: progress }).accuracy).toBe(0);
    expect(toParentProgressProfile(progress).totals).toMatchObject({ questionsAnswered: 2, correct: 0, wrong: 2, accuracy: 0 });
  });

  it('preserves a counted history with zero wrong, rather than borrowing two from topic totals', () => {
    const progress = createCanonicalProgress({
      history: [{ attempts: 2, correct: 2, wrong: 0 }],
      topics: subjects
    });
    expect(progress.global.totalAttempts).toBe(2);
    expect(progress.global.totalCorrect).toBe(2);
    expect(progress.global.totalWrong).toBe(0);
  });

  it('falls back to per-subject correct/wrong when counted history has incomplete zero evidence', () => {
    const progress = createCanonicalProgress({
      history: [
        { attempts: 2, correct: 0, wrong: 0 },
        { attempts: 3 }
      ],
      topics: subjects
    });
    expect(progress.global.totalAttempts).toBe(5);
    expect(progress.global.totalCorrect).toBe(3);
    expect(progress.global.totalWrong).toBe(2);
  });

  it('still respects explicit lifetime totals, including an explicit global zero', () => {
    const progress = createCanonicalProgress({
      totalQuestions: 12,
      correctQuestions: 0,
      incorrectQuestions: 12,
      history: [{ attempts: 2, correct: 2, wrong: 0 }],
      topics: subjects
    });
    expect(progress.global).toMatchObject({ totalAttempts: 12, totalCorrect: 0, totalWrong: 12 });
  });

  it('does not fabricate zero correctness evidence from score-only history', () => {
    const progress = createCanonicalProgress({
      history: [{ subjectId: 'math', score: 70 }],
      topics: subjects
    });
    expect(progress.global).toMatchObject({ totalAttempts: 5, totalCorrect: 3, totalWrong: 2 });
  });

  it('keeps current streak and best streak distinct but identical across Student/Parent projections', () => {
    const progress = createCanonicalProgress({
      streak: 1,
      bestStreak: 8,
      totalQuestions: 5,
      correctQuestions: 3,
      topics: subjects
    });
    const student = getCanonicalAnalytics({ canonicalProgress: progress });
    const parent = toParentProgressProfile(progress).totals;
    expect(student.currentStreak).toBe(1);
    expect(student.bestStreak).toBe(8);
    expect(parent.currentStreak).toBe(student.currentStreak);
    expect(parent.longestStreak).toBe(student.bestStreak);
    expect(parent.questionsAnswered).toBe(student.totalQuestions);
  });
});
