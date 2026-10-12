import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { recordQuestionResult } from '../../src/ai/adaptive/adaptiveSessionEngine.js';
import MetricCard, { getMetricValueKind, MetricValue } from '../../src/components/MetricCard.jsx';
import AnalyticsDashboard from '../../src/dashboard/AnalyticsDashboard.jsx';
import StudentDashboard from '../../src/dashboard/StudentDashboard.jsx';
import pkSubject from '../../src/data/subjects/pk.js';
import { getCanonicalAnalytics } from '../../src/utils/canonicalAnalytics.js';
import { createCanonicalProgress } from '../../src/utils/canonicalProgress.js';
import { formatDuration } from '../../src/utils/displayFormatter.js';

const stylesheet = fs.readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');

function createAnalytics(overrides = {}) {
  return {
    scopeLabel: 'Keseluruhan',
    hasEvidence: true,
    totalQuestions: 5,
    correctQuestions: 4,
    accuracy: 80,
    masteryPercent: 80,
    masteredTopics: [],
    learningTopics: [],
    weakTopics: [],
    strongTopics: [],
    availableTopics: [],
    subjectRows: [],
    currentStreak: 1,
    bestStreak: 1,
    studySeconds: 60,
    studyMinutes: 1,
    status: 'Berkembang Baik',
    ...overrides
  };
}

function renderAnalyticsDashboard(overrides = {}) {
  return renderToStaticMarkup(React.createElement(AnalyticsDashboard, {
    selectedSubject: { id: 'bm', title: 'Bahasa Melayu', topics: [] },
    selectedSubjectId: 'bm',
    smartSubject: { id: 'math', title: 'Matematik', topics: [] },
    smartLesson: { nextSubject: 'math', nextTopic: 'tambah', nextQuestionId: 'MATH-1' },
    smartTopic: { id: 'tambah', title: 'Tambah' },
    learningJourney: {
      blockedTopics: [],
      recommendedReview: null,
      nextLesson: null,
      todayLesson: { subjectId: 'math', subject: 'Matematik', title: 'Tambah', masteryStatus: 'ready' }
    },
    canonicalAnalytics: createAnalytics(),
    dailyChallenge: [],
    subjectList: [],
    allSubjects: [],
    statsCards: [],
    onStartAdaptivePractice: () => {},
    onStartAdaptiveLesson: () => {},
    ...overrides
  }));
}

describe('P1.15D mobile choice and metric presentation', () => {
  it('keeps plain mobile choices in one full-width natural-wrapping column', () => {
    const mobileBlock = stylesheet.match(/@media \(max-width: 650px\) \{[\s\S]*?\.type-choice \.interactive-choice \{([\s\S]*?)\n  \}/)?.[1] || '';
    expect(mobileBlock).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(mobileBlock).toContain('width: 100%');
    expect(mobileBlock).toContain('min-height: 58px');
    expect(mobileBlock).toContain('overflow-wrap: break-word');
    expect(mobileBlock).toContain('word-break: normal');
    expect(mobileBlock).not.toContain('86px');
  });

  it('preserves the visual-choice mobile layout independently', () => {
    expect(stylesheet).toMatch(/\.interactive-choice\s*\{\s*grid-template-columns:\s*86px 1fr;/);
    expect(stylesheet).toMatch(/\.visual-math-layout \.interactive-choice\s*\{[\s\S]{0,140}grid-template-columns:\s*1fr;/);
  });

  it('marks numeric KPI values for centered large-number presentation', () => {
    const markup = renderToStaticMarkup(React.createElement(MetricCard, { value: 42, label: 'Soalan' }));
    expect(markup).toContain('metric-value--numeric');
    expect(markup).toContain('data-value-kind="numeric"');
  });

  it('marks long KPI copy for compact left-aligned presentation', () => {
    const markup = renderToStaticMarkup(React.createElement(MetricValue, { value: 'Sedang Membina Asas Dengan Baik' }));
    expect(markup).toContain('metric-value--long-text');
    expect(markup).toContain('data-value-kind="long-text"');
  });

  it('renders Status Semasa with explicit text-safe typography without changing global classification', () => {
    const markup = renderToStaticMarkup(React.createElement(StudentDashboard, {
      profile: { name: 'Aina' },
      adaptiveProfile: {},
      canonicalAnalytics: createAnalytics({ status: 'Hampir Menguasai', accuracy: 81 }),
      onStartAdaptivePractice: () => {}
    }));

    expect(markup).toMatch(/metric-value--long-text[^>]*>Hampir Menguasai<\/b><span>Status Semasa<\/span>/);
    expect(getMetricValueKind('Hampir Menguasai')).toBe('text');
    for (const value of ['81%', 4, 1320]) {
      const numericMarkup = renderToStaticMarkup(React.createElement(MetricValue, { value }));
      expect(numericMarkup).toContain('metric-value--numeric');
    }
    expect(stylesheet).toMatch(/\.metric-value--numeric\s*\{[\s\S]{0,120}text-align:\s*center;/);
  });
});

describe('P1.15D canonical subject performance and study time', () => {
  it('derives evidence-backed subject rows from canonical topic records', () => {
    const analytics = getCanonicalAnalytics({
      adaptiveProfile: {
        topics: {
          math: { tambah: { total: 5, correct: 4, totalTime: 75, mastery: 80 } },
          bm: { ayat: { total: 2, correct: 1, totalTime: 45, mastery: 50 } }
        }
      }
    });
    expect(analytics.subjectRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'math', total: 5, correct: 4, accuracy: 80, studySeconds: 75 }),
      expect.objectContaining({ id: 'bm', total: 2, correct: 1, accuracy: 50, studySeconds: 45 })
    ]));
  });

  it('renders canonical subject rows instead of an empty recommendation placeholder', () => {
    const markup = renderToStaticMarkup(React.createElement(StudentDashboard, {
      profile: { name: 'Aina' },
      adaptiveProfile: {},
      canonicalAnalytics: createAnalytics({ subjectRows: [{ id: 'math', total: 5, correct: 4, accuracy: 80 }] }),
      adaptiveRecommendation: { subjectRows: [], plan: {}, summary: {} },
      onStartAdaptivePractice: () => {}
    }));
    expect(markup).toContain('Prestasi Subjek');
    expect(markup).toContain('Matematik');
    expect(markup).toContain('5 soalan dicuba');
    expect(markup).not.toContain('Belum ada prestasi subjek.');
  });

  it('retains the empty subject-performance state when canonical evidence is absent', () => {
    const analytics = getCanonicalAnalytics({ canonicalProgress: createCanonicalProgress({}) });
    expect(analytics.subjectRows).toEqual([]);
    const markup = renderToStaticMarkup(React.createElement(StudentDashboard, {
      canonicalAnalytics: analytics,
      onStartAdaptivePractice: () => {}
    }));
    expect(markup).toContain('Belum ada prestasi subjek.');
  });

  it('keeps zero-time subjects empty without inventing minutes', () => {
    const analytics = getCanonicalAnalytics({
      canonicalProgress: createCanonicalProgress({ topics: { math: { tambah: { total: 1, correct: 1, totalTime: 0 } } } }),
      subjectId: 'math'
    });
    expect(analytics.studySeconds).toBe(0);
    expect(formatDuration(analytics.studyMinutes, { unit: 'minutes' })).toBe('Belum ada masa belajar direkodkan');
  });

  it('shows real sub-minute timing without inventing a full minute', () => {
    const analytics = getCanonicalAnalytics({
      canonicalProgress: createCanonicalProgress({ topics: { math: { tambah: { total: 1, correct: 1, totalTime: 24 } } } }),
      subjectId: 'math'
    });
    expect(analytics.studySeconds).toBe(24);
    expect(analytics.studyMinutes).toBe(0.4);
    expect(formatDuration(analytics.studyMinutes, { unit: 'minutes' })).toBe('Kurang daripada 1 minit');
  });

  it('keeps subject study time isolated from other subjects', () => {
    const progress = createCanonicalProgress({
      topics: {
        math: { tambah: { total: 1, correct: 1, totalTime: 70 } },
        bm: { ayat: { total: 1, correct: 1, totalTime: 20 } }
      }
    });
    expect(getCanonicalAnalytics({ canonicalProgress: progress, subjectId: 'math' }).studySeconds).toBe(70);
    expect(getCanonicalAnalytics({ canonicalProgress: progress, subjectId: 'bm' }).studySeconds).toBe(20);
    expect(getCanonicalAnalytics({ canonicalProgress: progress }).studySeconds).toBe(90);
  });

  it('records timed answers once and remains stable across a reload-equivalent clone', () => {
    const result = recordQuestionResult({}, {
      sessionId: 'session-1', questionId: 'MATH-1', attemptNumber: 1,
      subjectId: 'math', topicId: 'tambah', correct: true, timeSpent: 42, awardXp: false
    });
    const reloaded = JSON.parse(JSON.stringify(result.profile));
    expect(result.profile.subjects.math.studySeconds).toBe(42);
    expect(getCanonicalAnalytics({ adaptiveProfile: reloaded, subjectId: 'math' }).studySeconds).toBe(42);

    const replay = recordQuestionResult(reloaded, {
      sessionId: 'session-1', questionId: 'MATH-1', attemptNumber: 1,
      subjectId: 'math', topicId: 'tambah', correct: true, timeSpent: 42, awardXp: false
    });
    expect(replay.summary.duplicate).toBe(true);
    expect(replay.profile.subjects.math.studySeconds).toBe(42);
  });
});

describe('P1.15D cross-subject recommendation clarity', () => {
  it('labels a cross-subject target with a readable subject name', () => {
    const markup = renderAnalyticsDashboard();
    expect(markup).toContain('Cadangan lintas subjek');
    expect(markup).toContain('Sasaran: Matematik Tahun 2');
    expect(markup).not.toContain('Sasaran: math');
  });

  it('does not show the cross-subject warning for the selected subject', () => {
    const markup = renderAnalyticsDashboard({
      smartSubject: { id: 'bm', title: 'Bahasa Melayu', topics: [] },
      smartLesson: { nextSubject: 'bm', nextTopic: 'ayat', nextQuestionId: 'BM-1' },
      smartTopic: { id: 'ayat', title: 'Ayat' },
      learningJourney: {
        blockedTopics: [], recommendedReview: null, nextLesson: null,
        todayLesson: { subjectId: 'bm', subject: 'Bahasa Melayu', title: 'Ayat', masteryStatus: 'ready' }
      }
    });
    expect(markup).not.toContain('Cadangan lintas subjek');
    expect(markup).toContain('Sasaran: Bahasa Melayu Tahun 2');
  });
});

describe('P1.15D PK content preservation', () => {
  it('keeps the long PK safety option canonical answer unchanged', () => {
    const question = pkSubject.topics
      .flatMap(topic => topic.questions)
      .find(item => item.id === 'PK-KESELAMATAN_DIRI-046');
    expect(question?.question).toBe('Apakah tindakan paling selamat jika rakan mengajak keluar kawasan sekolah?');
    expect(question?.answer).toBe('Jika rakan mengajak keluar kawasan sekolah, tindakan paling selamat ialah "jangan ikut tanpa izin".');
    expect(question?.accepted).toContain('jangan ikut tanpa izin');
  });
});
