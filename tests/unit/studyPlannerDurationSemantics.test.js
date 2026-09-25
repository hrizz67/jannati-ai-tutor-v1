import { describe, expect, it } from 'vitest';
import { createStudyPlanner, createStudyPlannerPayload } from '../../src/studyPlanner/index.js';

const WEEKDAY = '2026-07-20T08:00:00+08:00';

function buildProfile(studyMinutes = 160, overrides = {}) {
  return {
    studentId: 'duration-semantics-student',
    name: 'Murid Ujian',
    totals: {
      questionsAnswered: 12,
      correct: 7,
      wrong: 5,
      accuracy: 58,
      studyMinutes
    },
    subjects: {
      math: { mastery: 48 }
    },
    topics: {
      math: {
        tambah: {
          attempts: 12,
          correct: 7,
          wrong: 5,
          accuracy: 58,
          mastery: 48,
          lastAnsweredAt: '2026-07-20'
        }
      }
    },
    history: [],
    ...overrides
  };
}

function expectConsistentDuration(planner, minutes) {
  expect(planner.availableStudyMinutes).toBe(minutes);
  expect(planner.dailyPlan.availableMinutes).toBe(minutes);
}

describe('Study Planner duration semantics', () => {
  it('uses the deterministic weekday default for a historical-only profile', () => {
    const planner = createStudyPlannerPayload(buildProfile(160), { date: WEEKDAY });

    expectConsistentDuration(planner, 20);
    expect(planner.availableStudyMinutes).not.toBe(60);
    expect(planner.parentSummary.studyTime).toBe(160);
  });

  it('uses an explicit profile planning preference instead of historical study time', () => {
    const planner = createStudyPlannerPayload(buildProfile(160, { availableStudyMinutes: 45 }), { date: WEEKDAY });

    expectConsistentDuration(planner, 45);
  });

  it('lets an explicit option override the profile planning preference', () => {
    const planner = createStudyPlannerPayload(
      buildProfile(160, { availableStudyMinutes: 45 }),
      { availableStudyMinutes: 30, date: WEEKDAY }
    );

    expectConsistentDuration(planner, 30);
  });

  it('keeps future availability invariant when only historical study time changes', () => {
    const shortHistory = createStudyPlannerPayload(buildProfile(10), { date: WEEKDAY });
    const longHistory = createStudyPlannerPayload(buildProfile(300), { date: WEEKDAY });

    expectConsistentDuration(shortHistory, 20);
    expectConsistentDuration(longHistory, 20);
  });

  it('supports the intentional preferredMinutes planning alias but ignores studyMinutes', () => {
    const preferred = createStudyPlanner(buildProfile(160), { preferredMinutes: 45, date: WEEKDAY });
    const historicalAlias = createStudyPlanner(buildProfile(160), { studyMinutes: 60, date: WEEKDAY });

    expectConsistentDuration(preferred, 45);
    expectConsistentDuration(historicalAlias, 20);
  });

  it('preserves onboarding, weak-topic, strong-topic, and revision behavior', () => {
    const onboarding = createStudyPlanner(null, { date: WEEKDAY });
    const weak = createStudyPlanner(buildProfile(160), { date: WEEKDAY });
    const strong = createStudyPlanner(buildProfile(160, {
      subjects: { math: { mastery: 94 } },
      topics: {
        math: {
          tambah: {
            attempts: 20,
            correct: 19,
            wrong: 1,
            accuracy: 95,
            mastery: 94,
            lastAnsweredAt: '2026-07-20'
          }
        }
      }
    }), { availableStudyMinutes: 30, date: WEEKDAY });
    const revision = createStudyPlanner(buildProfile(160, {
      topics: {
        math: {
          tambah: {
            attempts: 12,
            correct: 7,
            wrong: 5,
            accuracy: 58,
            mastery: 48,
            lastAnsweredAt: '2026-06-20'
          }
        }
      }
    }), { date: WEEKDAY });

    expect(onboarding.onboarding).toBe(true);
    expect(weak.dailyPlan.blocks.some(block => block.recommendationKey === 'review')).toBe(true);
    expect(strong.dailyPlan.blocks.some(block => block.activityType === 'challenge')).toBe(true);
    expect(revision.dailyPlan.blocks.some(block => block.activityType === 'revision')).toBe(true);
  });
});
