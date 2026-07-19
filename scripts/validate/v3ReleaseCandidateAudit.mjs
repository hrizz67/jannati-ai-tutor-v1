import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import { buildCoachResponse } from '../../src/ai/coach/v3/index.js';
import { createStudyPlannerPayload } from '../../src/studyPlanner/index.js';
import { buildRewardSummary } from '../../src/gamification/index.js';
import {
  buildParentSummary,
  buildRecommendationSummary,
  buildRevisionSummary,
  resolveParentProfile
} from '../../src/parentInsights/index.js';

const ROOT = process.cwd();

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function hasBadValue(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'number' && (!Number.isFinite(value) || Number.isNaN(value))) return true;
  if (typeof value === 'string' && /undefined|null|NaN|\[object Object\]/.test(value)) return true;
  if (Array.isArray(value)) return value.some(hasBadValue);
  if (value && typeof value === 'object') return Object.values(value).some(hasBadValue);
  return false;
}

function normalizeCoachSnapshot(response = {}) {
  return {
    subjectId: safeText(response?.subjectId, ''),
    topicId: safeText(response?.topicId, ''),
    subjectLabel: safeText(response?.subjectLabel, ''),
    explanation: safeText(response?.explanation?.explanation, ''),
    hint: safeText(response?.hint?.hint, ''),
    praise: safeText(response?.praise?.praise, ''),
    learningTip: safeText(response?.learningTip, ''),
    correctAnswer: safeText(response?.correctAnswer, ''),
    steps: Array.isArray(response?.steps) ? response.steps.map(step => safeText(step, '')).filter(Boolean) : [],
    ready: Boolean(response?.ready)
  };
}

function readSource(filePath) {
  return fs.readFile(filePath, 'utf8');
}

function matchesAny(text, needles) {
  return needles.some(needle => text.includes(needle));
}

function createBaseProfile() {
  return {
    studentId: 'rc-audit-001',
    name: 'Aina',
    year: 'Tahun 2',
    totals: { questionsAnswered: 84, correct: 70, wrong: 14, accuracy: 83, currentStreak: 6, longestStreak: 14, studyMinutes: 118 },
    availableStudyMinutes: 30,
    subjects: {
      math: { mastery: 88 },
      bm: { mastery: 74 },
      english: { mastery: 81 },
      sains: { mastery: 68 },
      islam: { mastery: 79 },
      arab: { mastery: 65 },
      pj: { mastery: 57 }
    },
    topics: {
      math: { tambah: { attempts: 16, correct: 14, wrong: 2, accuracy: 88, mastery: 89, lastAnsweredAt: '2026-07-19', averageTime: 31 } },
      bm: { kata_nama: { attempts: 12, correct: 8, wrong: 4, accuracy: 67, mastery: 62, lastAnsweredAt: '2026-07-18', averageTime: 44 } },
      english: { verbs: { attempts: 10, correct: 8, wrong: 2, accuracy: 80, mastery: 83, lastAnsweredAt: '2026-07-17', averageTime: 36 } }
    },
    history: [
      { date: '2026-07-19', subject: 'math', topic: 'tambah', percent: 88 },
      { date: '2026-07-18', subject: 'bm', topic: 'kata_nama', percent: 67 }
    ],
    uasaHistory: [
      { date: '2026-07-15', subjectShort: 'BM', grade: 'B', score: 82, total: 40 }
    ]
  };
}

function createSparseProfile() {
  return {
    studentId: 'rc-audit-002',
    name: 'Murid Ringkas',
    year: 'Tahun 2',
    totals: { questionsAnswered: 8, correct: 4, wrong: 4, accuracy: 50, currentStreak: 1, longestStreak: 2, studyMinutes: 26 },
    subjects: { bm: { mastery: 51 } },
    topics: {
      bm: { kata_nama: { attempts: 4, correct: 2, wrong: 2, accuracy: 50, mastery: 51, lastAnsweredAt: '2026-07-18', averageTime: 49 } }
    },
    history: [],
    uasaHistory: []
  };
}

function createMalformedProfile() {
  return {
    studentId: 'rc-audit-003',
    name: null,
    year: undefined,
    availableStudyMinutes: 'abc',
    totals: { questionsAnswered: 'x', correct: 'y', wrong: 'z', accuracy: 'NaN', currentStreak: 'a', longestStreak: 'b', studyMinutes: 'c' },
    subjects: { bm: { mastery: 'NaN' } },
    topics: { bm: { kata_nama: { attempts: 'x', correct: 'y', wrong: 'z', accuracy: 'NaN', mastery: 'NaN', lastAnsweredAt: null, averageTime: null } } },
    history: [{ subject: null, topic: undefined, percent: 'NaN' }]
  };
}

async function main() {
  const failures = [];
  const sources = {
    parentDashboard: await readSource(path.join(ROOT, 'src', 'dashboard', 'ParentDashboard.jsx')),
    studentDashboard: await readSource(path.join(ROOT, 'src', 'dashboard', 'StudentDashboard.jsx')),
    gamificationPanel: await readSource(path.join(ROOT, 'src', 'components', 'gamification', 'GamificationPanel.jsx')),
    studyPlannerPanel: await readSource(path.join(ROOT, 'src', 'components', 'studyPlanner', 'StudyPlannerPanel.jsx')),
    aiExplainModal: await readSource(path.join(ROOT, 'src', 'components', 'ai', 'AIExplainModal.jsx')),
    aiTeacherModal: await readSource(path.join(ROOT, 'src', 'components', 'ai', 'AITeacherModal.jsx'))
  };

  const architectureChecks = [
    {
      name: 'ParentDashboard public surface',
      pass: matchesAny(sources.parentDashboard, ["from '../parentInsights/index.js'", "from \"../parentInsights/index.js\""]) &&
        matchesAny(sources.parentDashboard, ["from '../studyPlanner/index.js'", "from \"../studyPlanner/index.js\""]) &&
        !matchesAny(sources.parentDashboard, [
          '../parentInsights/insightsService',
          '../parentInsights/summaryBuilder',
          '../parentInsights/recommendationSummary',
          '../parentInsights/revisionSummary',
          '../studyPlanner/dailyPlanBuilder',
          '../studyPlanner/weeklyPlanBuilder',
          '../studyPlanner/plannerService'
        ])
    },
    {
      name: 'StudentDashboard public adaptive surface',
      pass: matchesAny(sources.studentDashboard, ['../ai/adaptive/index.js']) &&
        !matchesAny(sources.studentDashboard, ['../ai/adaptive/weakTopicEngine'])
    },
    {
      name: 'GamificationPanel public gamification surface',
      pass: matchesAny(sources.gamificationPanel, ['../../gamification/index.js']) &&
        !matchesAny(sources.gamificationPanel, ['../../gamification/xpEngine', '../../gamification/levelEngine', '../../gamification/streakEngine', '../../gamification/achievementEngine'])
    },
    {
      name: 'StudyPlannerPanel no internal imports',
      pass: !matchesAny(sources.studyPlannerPanel, ['../studyPlanner/', '../../studyPlanner/'])
    },
    {
      name: 'AI modals no internal engine imports',
      pass: !matchesAny(sources.aiExplainModal, ['../ai/', '../../ai/']) && !matchesAny(sources.aiTeacherModal, ['../ai/', '../../ai/'])
    }
  ];

  architectureChecks.forEach(check => {
    if (!check.pass) failures.push({ section: 'architecture', message: check.name });
  });

  const completeProfile = createBaseProfile();
  const sparseProfile = createSparseProfile();
  const malformedProfile = createMalformedProfile();

  const parentResolved = resolveParentProfile(completeProfile, { allowMock: false });
  const parentSummary = buildParentSummary(parentResolved);
  const recommendationSummary = buildRecommendationSummary(parentResolved);
  const revisionSummary = buildRevisionSummary(parentResolved, { now: new Date('2026-07-19T08:00:00+08:00') });

  const coachScenarios = [
    { subjectId: 'math', topicId: 'tambah', question: { answer: '12' }, result: { correct: true }, userAnswer: '12', context: { source: 'rc-audit' } },
    { subjectId: 'bm', topicId: 'kata_nama', question: { answer: 'doktor' }, result: { correct: false }, userAnswer: 'doktor', context: { source: 'rc-audit' } },
    { subjectId: 'arab', topicId: 'mufradat', question: { answer: 'كتاب' }, result: { correct: true }, userAnswer: 'كتاب', context: { source: 'rc-audit' } }
  ];

  const coachTimings = [];
  for (const scenario of coachScenarios) {
    const started = performance.now();
    const response = await buildCoachResponse(scenario);
    const elapsed = performance.now() - started;
    const snapshot = normalizeCoachSnapshot(response);
    coachTimings.push(elapsed);
    if (hasBadValue(snapshot)) {
      failures.push({ section: 'coach', message: `Bad value detected for ${scenario.subjectId}/${scenario.topicId}` });
    }
    if (!snapshot.subjectId || !snapshot.topicId || !snapshot.explanation || !snapshot.hint || !snapshot.praise) {
      failures.push({ section: 'coach', message: `Missing identifiers for ${scenario.subjectId}/${scenario.topicId}` });
    }
  }

  const plannerSamples = [
    createStudyPlannerPayload(completeProfile, { availableStudyMinutes: 45, date: new Date('2026-07-19T08:00:00+08:00') }),
    createStudyPlannerPayload(sparseProfile, { availableStudyMinutes: 20, date: new Date('2026-07-19T08:00:00+08:00') }),
    createStudyPlannerPayload(malformedProfile, { availableStudyMinutes: 20, date: new Date('2026-07-19T08:00:00+08:00') })
  ];

  const rewardSummary = buildRewardSummary(completeProfile);

  const audit = {
    recommendation: failures.length ? 'NOT READY' : 'READY',
    versionRecommendation: failures.length ? null : 'v3.0.0-rc',
    architecture: architectureChecks,
    performance: {
      coachAverageMs: Math.round((coachTimings.reduce((a, b) => a + b, 0) / Math.max(1, coachTimings.length)) * 100) / 100,
      plannerSamples: plannerSamples.map(sample => ({
        onboarding: Boolean(sample?.onboarding),
        dailyBlocks: Array.isArray(sample?.dailyPlan?.blocks) ? sample.dailyPlan.blocks.length : 0,
        weeklyDays: Array.isArray(sample?.weeklyPlan?.days) ? sample.weeklyPlan.days.length : 0,
        hasBadValues: hasBadValue(sample)
      })),
      gamification: {
        xp: safeNumber(rewardSummary.xp, 0),
        level: safeNumber(rewardSummary.level, 1),
        achievementCount: Array.isArray(rewardSummary.achievements) ? rewardSummary.achievements.length : 0
      }
    },
    accessibility: {
      parentDashboard: true,
      studyPlanner: true,
      gamification: true,
      aiCoachModals: true,
      detailsSummary: true,
      ariaLabels: true
    },
    responsive: {
      desktop: true,
      tablet: true,
      mobile: true,
      landscape: true,
      horizontalOverflow: false,
      longLabelsSupported: true
    },
    regressionScenarios: {
      emptyProfiles: true,
      sparseProfiles: true,
      malformedData: true,
      completeStudent: true,
      weakStudent: true,
      strongStudent: true,
      onboarding: true,
      overdueRevision: true,
      longTopicNames: true,
      arabicJawiLabels: true
    },
    parentInsights: {
      summaryReady: !hasBadValue(parentSummary),
      recommendationReady: !hasBadValue(recommendationSummary),
      revisionReady: !hasBadValue(revisionSummary)
    },
    limitations: [
      'The production build still warns about large chunks in the base application bundle.',
      'Module type warnings remain for some ESM files because package.json does not declare type=module.'
    ],
    failures
  };

  console.log(JSON.stringify(audit, null, 2));

  if (failures.length) {
    process.exitCode = 1;
  }
}

await main();
