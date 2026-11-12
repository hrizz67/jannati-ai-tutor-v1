import { describe, expect, it } from 'vitest';
import { createCanonicalProgress, toParentProgressProfile } from '../../src/utils/canonicalProgress.js';
import { getCanonicalAnalytics } from '../../src/utils/canonicalAnalytics.js';

const topicRecords = {
  math: { tambah: { attempts: 3, correct: 2, wrong: 1 } },
  bm: { kata_nama_am: { attempts: 2, correct: 1, wrong: 1 } }
};

describe('P1-H canonical total-attempt fallback from topic evidence', () => {
  it('does not let an empty history mask five actual subject/topic attempts', () => {
    const progress = createCanonicalProgress({ topics: topicRecords, history: [] });
    expect(progress.global.totalAttempts).toBe(5);
    expect(progress.global.totalCorrect).toBe(3);
    expect(progress.global.totalWrong).toBe(2);
    expect(getCanonicalAnalytics({ canonicalProgress: progress }).totalQuestions).toBe(5);
    expect(getCanonicalAnalytics({ canonicalProgress: progress }).subjectRows
      .reduce((total, row) => total + row.total, 0)).toBe(5);
    expect(toParentProgressProfile(progress).totals.questionsAnswered).toBe(5);
  });

  it('falls back to topic attempts when historical entries lack numerical attempt counts', () => {
    const progress = createCanonicalProgress({
      topics: topicRecords,
      history: [{ date: '2026-11-12', subjectId: 'math', score: 80 }]
    });
    expect(progress.global.totalAttempts).toBe(5);
    expect(progress.activities).toHaveLength(1);
  });

  it('preserves explicit global lifetime totals even when subject rows do not yet reconcile', () => {
    const progress = createCanonicalProgress({
      totalQuestions: 242,
      correctQuestions: 200,
      topics: {
        bm: { kata_nama_am: { attempts: 241, correct: 200, wrong: 41 } }
      }
    });
    expect(progress.global.totalAttempts).toBe(242);
    expect(getCanonicalAnalytics({ canonicalProgress: progress }).subjectRows[0].total).toBe(241);
    expect(toParentProgressProfile(progress).totals.questionsAnswered).toBe(242);
  });

  it('preserves explicit history attempt totals before subject-derived totals', () => {
    const progress = createCanonicalProgress({
      topics: topicRecords,
      history: [{ attempts: 7, correct: 3, wrong: 4 }]
    });
    expect(progress.global.totalAttempts).toBe(7);
    expect(progress.global.totalCorrect).toBe(3);
    expect(progress.global.totalWrong).toBe(4);
  });

  it('keeps zero totals when there is no attempt evidence anywhere', () => {
    const progress = createCanonicalProgress({});
    expect(progress.global.totalAttempts).toBe(0);
    expect(getCanonicalAnalytics({ canonicalProgress: progress }).hasEvidence).toBe(false);
  });
});
