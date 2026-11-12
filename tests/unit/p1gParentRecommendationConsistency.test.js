import { describe, expect, it } from 'vitest';
import { buildRecommendationKey } from '../../src/dashboard/ParentDashboard.jsx';
import { getCanonicalAnalytics } from '../../src/utils/canonicalAnalytics.js';
import { createCanonicalProgress } from '../../src/utils/canonicalProgress.js';

const topic = (mastery, attempts = 1) => ({
  mastery,
  attempts,
  correct: mastery >= 60 ? attempts : 0,
  wrong: mastery >= 60 ? 0 : attempts
});

describe('P1-G parent recommendation consistency', () => {
  it('prioritizes revision when the overall average is high but one attempted topic remains weak', () => {
    const strongTopics = Object.fromEntries(
      Array.from({ length: 8 }, (_, i) => [`strong_${i + 1}`, topic(95)])
    );
    const progress = createCanonicalProgress({
      totalQuestions: 9,
      correctQuestions: 8,
      topics: {
        math: strongTopics,
        bm: { kata_kerja: topic(20) }
      }
    });
    const analytics = getCanonicalAnalytics({ canonicalProgress: progress });
    expect(analytics.masteryPercent).toBeGreaterThanOrEqual(85);
    expect(analytics.weakTopics.map(item => item.topicId)).toContain('kata_kerja');
    expect(buildRecommendationKey(analytics)).toBe('review');
  });

  it('retains increased difficulty when mastery is high and there are no weak topics', () => {
    const progress = createCanonicalProgress({
      totalQuestions: 3,
      correctQuestions: 3,
      topics: { bm: { kata_nama_am: topic(95), kata_kerja: topic(96), ayat: topic(92) } }
    });
    const analytics = getCanonicalAnalytics({ canonicalProgress: progress });
    expect(analytics.weakTopics).toEqual([]);
    expect(buildRecommendationKey(analytics)).toBe('increase_difficulty');
  });

  it('does not recommend learning actions before evidence exists', () => {
    expect(buildRecommendationKey(getCanonicalAnalytics({ canonicalProgress: createCanonicalProgress({}) }))).toBeNull();
  });

  it('keeps the existing moderate and low mastery recommendations', () => {
    expect(buildRecommendationKey({ hasEvidence: true, masteryPercent: 65, weakTopics: [] })).toBe('normal_practice');
    expect(buildRecommendationKey({ hasEvidence: true, masteryPercent: 35, weakTopics: [] })).toBe('review');
    expect(buildRecommendationKey({ hasEvidence: true, masteryPercent: 95 })).toBe('increase_difficulty');
  });

  it('does not treat a weak but never-attempted topic as an evidenced revision target', () => {
    const strongTopics = Object.fromEntries(
      Array.from({ length: 8 }, (_, i) => [`strong_${i + 1}`, topic(95)])
    );
    const progress = createCanonicalProgress({
      totalQuestions: 8,
      correctQuestions: 8,
      topics: {
        math: strongTopics,
        bm: { kata_kerja: topic(10, 0) }
      }
    });
    const analytics = getCanonicalAnalytics({ canonicalProgress: progress });
    expect(analytics.masteryPercent).toBeGreaterThanOrEqual(85);
    expect(analytics.weakTopics).toEqual([]);
    expect(buildRecommendationKey(analytics)).toBe('increase_difficulty');
  });
});
