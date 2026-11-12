import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getCanonicalAnalytics } from '../../src/utils/canonicalAnalytics.js';
import { createCanonicalProgress, toParentProgressProfile } from '../../src/utils/canonicalProgress.js';
import { reconcileCumulativeLearnerProfile } from '../../src/utils/learnerProgressIntegrity.js';

const appCode = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const homeCode = fs.readFileSync(new URL('../../src/dashboard/HomeDashboard.jsx', import.meta.url), 'utf8');

function syntheticSnapshot() {
  // Lifetime source is one answer ahead of subject breakdown; do not invent
  // the missing question's attribution or overwrite either stored counter.
  const profile = { totalQuestions: 242, correctQuestions: 200, streak: 1, bestStreak: 8, history: [] };
  const adaptiveProfile = {
    totalQuestions: 241, correctQuestions: 199, streak: 1, bestStreak: 8,
    subjects: { bm: { total: 241, correct: 199 } },
    topics: { bm: { kata_nama_am: { total: 241, correct: 199, wrong: 42, mastery: 75 } } }
  };
  const progress = createCanonicalProgress({
    ...adaptiveProfile,
    ...reconcileCumulativeLearnerProfile({ profile, adaptiveProfile }),
    history: [],
    subjects: adaptiveProfile.subjects,
    topics: adaptiveProfile.topics
  });
  return { profile, adaptiveProfile, progress };
}

describe('P1-K Parent/Home canonical progress source and scope parity', () => {
  it('demonstrates why independently recomputing from raw profile/adaptive store can hide a lifetime answer', () => {
    const { profile, adaptiveProfile, progress } = syntheticSnapshot();
    const formerHomeOverall = getCanonicalAnalytics({ profile, adaptiveProfile });
    const sharedOverall = getCanonicalAnalytics({ canonicalProgress: progress });
    expect(formerHomeOverall.totalQuestions).toBe(241);
    expect(sharedOverall.totalQuestions).toBe(242);
    expect(sharedOverall.correctQuestions).toBe(200);
    expect(toParentProgressProfile(progress).totals.questionsAnswered).toBe(sharedOverall.totalQuestions);
    expect(toParentProgressProfile(progress).totals.correct).toBe(sharedOverall.correctQuestions);
  });

  it('keeps selected-subject questions distinct from overall lifetime questions, with a clear scope label', () => {
    const { progress } = syntheticSnapshot();
    const bm = getCanonicalAnalytics({
      canonicalProgress: progress, selectedSubject: { id: 'bm', title: 'Bahasa Melayu' }
    });
    const overall = getCanonicalAnalytics({ canonicalProgress: progress });
    expect(bm.scope).toBe('subject');
    expect(bm.totalQuestions).toBe(241);
    expect(bm.scopeLabel).toContain('Subjek dipilih');
    expect(overall.scope).toBe('overall');
    expect(overall.totalQuestions).toBe(242);
    expect(overall.subjectRows.reduce((n, item) => n + item.total, 0)).toBe(241);
  });

  it('preserves distinct current and longest streak for the same canonical snapshot', () => {
    const { progress } = syntheticSnapshot();
    const overall = getCanonicalAnalytics({ canonicalProgress: progress });
    const parent = toParentProgressProfile(progress).totals;
    expect(overall).toMatchObject({ currentStreak: 1, bestStreak: 8 });
    expect(parent).toMatchObject({ currentStreak: 1, longestStreak: 8 });
  });

  it('wires the shared App snapshot into Home while keeping subject and overall analytics separate', () => {
    expect(appCode).toContain('<HomeDashboard profile={profile} canonicalProgress={canonicalProgress}');
    expect(appCode).toContain('canonicalProgress={canonicalProgress} aiMemory={aiMemory}');
    expect(homeCode).toContain('canonicalProgress = null');
    expect(homeCode).toContain('getCanonicalAnalytics({ canonicalProgress, profile, adaptiveProfile: adaptiveStore, selectedSubject })');
    expect(homeCode).toContain('getCanonicalAnalytics({ canonicalProgress, profile, adaptiveProfile: adaptiveStore })');
    expect(homeCode).toContain("value: overallCanonicalAnalytics.totalQuestions");
    expect(homeCode).toContain("clampPercent(overallCanonicalAnalytics.accuracy)");
    expect(homeCode).toContain("formatDuration(overallCanonicalAnalytics.studyMinutes");
    expect(homeCode).toContain("value: overallCanonicalAnalytics.currentStreak");
  });

  it('does not invent a Parent count from an empty profile without evidence', () => {
    const progress = createCanonicalProgress({});
    const parent = toParentProgressProfile(progress).totals;
    expect(getCanonicalAnalytics({ canonicalProgress: progress }).totalQuestions).toBe(0);
    expect(parent.questionsAnswered).toBe(0);
  });
});
