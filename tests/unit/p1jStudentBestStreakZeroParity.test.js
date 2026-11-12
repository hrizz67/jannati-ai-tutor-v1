import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import StudentDashboard from '../../src/dashboard/StudentDashboard.jsx';
import { getCanonicalAnalytics } from '../../src/utils/canonicalAnalytics.js';
import { createCanonicalProgress, toParentProgressProfile } from '../../src/utils/canonicalProgress.js';

const renderStreak = ({ profile = {}, adaptiveProfile = {}, streakBest, canonicalProgress }) => {
  const analytics = canonicalProgress ? getCanonicalAnalytics({ canonicalProgress }) : null;
  const html = renderToStaticMarkup(React.createElement(StudentDashboard, {
    profile,
    adaptiveProfile,
    canonicalAnalytics: analytics,
    streakBest,
    onStartAdaptivePractice: () => {}
  }));
  return html.slice(html.indexOf('Streak Pembelajaran'));
};

describe('P1-J Student best streak canonical zero parity', () => {
  it('keeps an authoritative zero best streak even when a stale prop and adaptive cache say eight', () => {
    const progress = createCanonicalProgress({ totalQuestions: 1, correctQuestions: 1, streak: 0, bestStreak: 0 });
    const html = renderStreak({
      canonicalProgress: progress,
      streakBest: 8,
      adaptiveProfile: { bestStreak: 8, streak: 8, totalQuestions: 1 }
    });
    expect(html).toMatch(/Streak: 0 hari<\/b><span>Streak Semasa<\/span>/);
    expect(html).toMatch(/Streak: 0 hari<\/b><span>Streak Terbaik<\/span>/);
    expect(toParentProgressProfile(progress).totals).toMatchObject({ currentStreak: 0, longestStreak: 0 });
  });

  it('keeps current one and best eight as intentionally different metrics', () => {
    const progress = createCanonicalProgress({ totalQuestions: 3, correctQuestions: 3, streak: 1, bestStreak: 8 });
    const html = renderStreak({
      canonicalProgress: progress,
      streakBest: 99,
      adaptiveProfile: { bestStreak: 99, streak: 99 }
    });
    expect(html).toMatch(/Streak: 1 hari<\/b><span>Streak Semasa<\/span>/);
    expect(html).toMatch(/Streak: 8 hari<\/b><span>Streak Terbaik<\/span>/);
    expect(toParentProgressProfile(progress).totals).toMatchObject({ currentStreak: 1, longestStreak: 8 });
  });

  it('does not remove the adaptive best streak when canonical analytics is not supplied', () => {
    const html = renderStreak({ adaptiveProfile: { streak: 2, bestStreak: 6, totalQuestions: 1 } });
    expect(html).toMatch(/Streak: 6 hari<\/b><span>Streak Terbaik<\/span>/);
  });
});
