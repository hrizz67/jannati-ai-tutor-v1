import fs from 'node:fs/promises';
import path from 'node:path';
import { createStudyPlannerPayload } from '../../src/studyPlanner/index.js';

const ROOT = process.cwd();
const PARENT_DASHBOARD_PATH = path.join(ROOT, 'src', 'dashboard', 'ParentDashboard.jsx');
const COMPONENT_PATHS = [
  path.join(ROOT, 'src', 'components', 'studyPlanner', 'StudyPlannerPanel.jsx'),
  path.join(ROOT, 'src', 'components', 'studyPlanner', 'DailyPlanCard.jsx'),
  path.join(ROOT, 'src', 'components', 'studyPlanner', 'WeeklyPlanList.jsx'),
  path.join(ROOT, 'src', 'components', 'studyPlanner', 'StudyBlockItem.jsx')
];

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function assert(condition, message, details = null, failures) {
  if (!condition) failures.push({ message, details });
}

function hasForbiddenValues(value) {
  const serialized = JSON.stringify(value);
  return /undefined|null|\[object Object\]|NaN/.test(serialized);
}

function buildBaseSubjects() {
  return {
    bm: { mastery: 44 },
    math: { mastery: 78 },
    english: { mastery: 92 },
    sains: { mastery: 61 },
    islam: { mastery: 84 },
    arab: { mastery: 69 },
    pj: { mastery: 55 }
  };
}

function mergeProfile(overrides = {}) {
  return {
    studentId: 'study-audit',
    name: 'Murid Audit',
    year: 'Tahun 2',
    availableStudyMinutes: 20,
    subjects: buildBaseSubjects(),
    topics: {
      math: { tambah: { attempts: 22, correct: 20, wrong: 2, accuracy: 91, mastery: 92, lastAnsweredAt: '2026-07-19', averageTime: 34 } },
      bm: { kata_nama: { attempts: 18, correct: 14, wrong: 4, accuracy: 78, mastery: 74, lastAnsweredAt: '2026-07-18', averageTime: 46 } },
      english: { verbs: { attempts: 14, correct: 12, wrong: 2, accuracy: 86, mastery: 88, lastAnsweredAt: '2026-07-17', averageTime: 39 } },
      sains: { haiwan: { attempts: 12, correct: 8, wrong: 4, accuracy: 67, mastery: 63, lastAnsweredAt: '2026-07-16', averageTime: 42 } },
      islam: { akhlak: { attempts: 10, correct: 8, wrong: 2, accuracy: 80, mastery: 82, lastAnsweredAt: '2026-07-15', averageTime: 41 } },
      arab: { mufradat: { attempts: 11, correct: 7, wrong: 4, accuracy: 64, mastery: 68, lastAnsweredAt: '2026-07-14', averageTime: 45 } },
      pj: { lokomotor: { attempts: 9, correct: 6, wrong: 3, accuracy: 67, mastery: 58, lastAnsweredAt: '2026-07-13', averageTime: 44 } }
    },
    history: [
      { subject: 'math', topic: 'tambah', percent: 78, date: '2026-07-18' },
      { subject: 'bm', topic: 'kata_nama', percent: 44, date: '2026-07-17' }
    ],
    adaptivePerformance: {
      totalQuestions: 128,
      correctQuestions: 109,
      incorrectQuestions: 19,
      totalTime: 160
    },
    uasaHistory: [
      { date: '2026-07-10', subjectShort: 'BM', grade: 'B', score: 82, total: 40 }
    ],
    ...overrides
  };
}

function buildSparseProfile() {
  return {
    studentId: 'study-sparse',
    name: 'Murid Ringkas',
    year: 'Tahun 2',
    totals: { questionsAnswered: 5, correct: 3, wrong: 2, accuracy: 60, currentStreak: 1, longestStreak: 2, studyMinutes: 12 },
    subjects: {
      bm: { mastery: 61 }
    },
    topics: {
      bm: { kata_nama: { attempts: 3, correct: 2, wrong: 1, accuracy: 67, mastery: 61, lastAnsweredAt: '2026-07-19', averageTime: 45 } }
    },
    history: [],
    uasaHistory: []
  };
}

function buildEmptyProfile() {
  return null;
}

function buildMalformedProfile() {
  return {
    studentId: 'study-malformed',
    name: null,
    year: null,
    availableStudyMinutes: 'abc',
    totals: { questionsAnswered: 'x', correct: 'y', wrong: 'z', accuracy: 'NaN', currentStreak: 'a', longestStreak: 'b', studyMinutes: 'c' },
    subjects: {
      bm: { mastery: 'NaN' }
    },
    topics: {
      bm: { kata_nama: { attempts: 'x', correct: 'y', wrong: 'z', accuracy: 'NaN', mastery: 'NaN', lastAnsweredAt: null, averageTime: null } }
    },
    history: [{ subject: null, topic: undefined, percent: 'NaN' }]
  };
}

function getDailyTopics(payload) {
  return (payload?.dailyPlan?.blocks || []).map(block => safeText(block.topic, ''));
}

function hasChallengeBlock(payload) {
  return Array.isArray(payload?.dailyPlan?.blocks)
    && payload.dailyPlan.blocks.some(block => block.activityType === 'challenge' || block.recommendationKey === 'increase_difficulty');
}

async function main() {
  const failures = [];
  const parentSource = await fs.readFile(PARENT_DASHBOARD_PATH, 'utf8');

  assert(parentSource.includes('StudyPlannerPanel') && parentSource.includes('createStudyPlannerPayload'), 'ParentDashboard should use the public Study Planner surface.', null, failures);
  assert(!parentSource.includes('../studyPlanner/dailyPlanBuilder') && !parentSource.includes('../studyPlanner/weeklyPlanBuilder'), 'ParentDashboard must not import internal planner modules directly.', null, failures);

  for (const componentPath of COMPONENT_PATHS) {
    const source = await fs.readFile(componentPath, 'utf8');
    if (componentPath.endsWith('StudyPlannerPanel.jsx')) {
      assert(source.includes('Pelan Belajar') && source.includes('Starter Plan'), 'StudyPlannerPanel should expose the parent-facing planner heading and starter state.', null, failures);
    }
    if (componentPath.endsWith('DailyPlanCard.jsx')) {
      assert(source.includes('Pelan Hari Ini') && source.includes('Pelan Permulaan Hari Ini'), 'DailyPlanCard should label the daily plan and onboarding state clearly.', null, failures);
    }
    if (componentPath.endsWith('WeeklyPlanList.jsx')) {
      assert(source.includes('<details') && source.includes('<summary'), 'WeeklyPlanList should support compact expansion with native disclosure controls.', null, failures);
      assert(source.includes('Pelan Mingguan'), 'WeeklyPlanList should label the weekly plan clearly.', null, failures);
    }
    if (componentPath.endsWith('StudyBlockItem.jsx')) {
      assert(source.includes('Ulang kaji') && source.includes('Cabaran') && source.includes('Keutamaan tinggi'), 'StudyBlockItem should map technical values to friendly labels.', null, failures);
    }
  }

  const scenarios = [
    { name: 'complete profile', profile: mergeProfile() },
    {
      name: 'weak student',
      profile: mergeProfile({
        subjects: {
          ...buildBaseSubjects(),
          bm: { topics: { penjodoh_bilangan: { mastery: 35, attempts: 6, lastPractised: '2026-07-17' } } },
          math: { topics: { tambah: { mastery: 52, attempts: 10, lastPractised: '2026-07-16' } } }
        }
      })
    },
    {
      name: 'strong student',
      profile: mergeProfile({
        subjects: {
          ...buildBaseSubjects(),
          math: {
            topics: {
              tambah: { mastery: 92, attempts: 18, lastPractised: '2026-07-18' },
              darab: { mastery: 88, attempts: 16, lastPractised: '2026-07-17' }
            }
          },
          bm: { topics: { kata_hubung: { mastery: 90, attempts: 14, lastPractised: '2026-07-16' } } }
        }
      })
    },
    {
      name: 'overdue revision',
      profile: mergeProfile({
        subjects: {
          ...buildBaseSubjects(),
          arab: { topics: { mufradat: { mastery: 51, attempts: 5, lastPractised: '2026-06-30' } } },
          islam: { topics: { akhlak: { mastery: 63, attempts: 9, lastPractised: '2026-06-29' } } }
        }
      })
    },
    { name: 'sparse profile', profile: buildSparseProfile() },
    { name: 'empty profile', profile: buildEmptyProfile() },
    { name: 'malformed blocks', profile: buildMalformedProfile() },
    {
      name: 'partial weekly plan',
      profile: mergeProfile({
        subjects: {
          ...buildBaseSubjects(),
          bm: { topics: { kata_nama: { mastery: 42, attempts: 3, lastPractised: '2026-07-17' } } }
        }
      })
    },
    {
      name: 'long topic labels',
      profile: mergeProfile({
        subjects: {
          ...buildBaseSubjects(),
          english: {
            topics: {
              reading_comprehension: {
                mastery: 47,
                attempts: 4,
                title: 'Reading comprehension with a very long topic label for responsive testing',
                lastPractised: '2026-07-15'
              }
            }
          }
        }
      })
    },
    { name: 'onboarding state', profile: buildEmptyProfile() }
  ];

  const results = [];
  for (const scenario of scenarios) {
    const payload = createStudyPlannerPayload(scenario.profile, {
      availableStudyMinutes: 45,
      date: new Date('2026-07-19T08:00:00+08:00')
    });

    const hasBadValues = hasForbiddenValues(payload);
    results.push({
      scenario: scenario.name,
      onboarding: Boolean(payload.onboarding),
      dailyBlocks: Array.isArray(payload?.dailyPlan?.blocks) ? payload.dailyPlan.blocks.length : 0,
      weeklyDays: Array.isArray(payload?.weeklyPlan?.days) ? payload.weeklyPlan.days.length : 0,
      focusTopic: safeText(payload.focusTopic, ''),
      hasBadValues,
      hasChallengeBlock: hasChallengeBlock(payload),
      dailyTopics: getDailyTopics(payload),
      weeklySubjects: Array.isArray(payload?.weeklyPlan?.days)
        ? payload.weeklyPlan.days.map(day => {
            const firstBlock = Array.isArray(day?.blocks) ? day.blocks[0] : null;
            return safeText(firstBlock?.subject, '');
          }).filter(Boolean)
        : []
    });

    assert(!hasBadValues, `Planner payload should not leak forbidden values for ${scenario.name}.`, payload, failures);
    assert(Array.isArray(payload?.weeklyPlan?.days), `Weekly plan should be an array of days for ${scenario.name}.`, payload?.weeklyPlan, failures);
    assert((payload?.weeklyPlan?.days || []).length === 7, `Weekly plan should contain 7 days for ${scenario.name}.`, payload?.weeklyPlan, failures);

    if (scenario.name === 'empty profile') {
      assert(Boolean(payload.onboarding), 'Empty profile should produce onboarding state.', payload, failures);
    }

    if (scenario.name === 'strong student') {
      assert(hasChallengeBlock(payload), 'Strong student should surface a challenge or progression block.', payload?.dailyPlan, failures);
    }

    if (scenario.name === 'sparse profile') {
      assert((payload?.dailyPlan?.blocks || []).length >= 1, 'Sparse profile should still generate at least one study block.', payload?.dailyPlan, failures);
    }
  }

  const report = {
    dashboardSurface: 'Parent Dashboard',
    integrationSections: ['Pelan Hari Ini', 'Pelan Mingguan'],
    scenarios: results,
    results: {
      noForbiddenValues: results.every(result => !result.hasBadValues),
      weeklyPlanSevenDays: results.every(result => result.weeklyDays === 7),
      onboardingDetected: results.some(result => result.scenario === 'empty profile' && result.onboarding),
      strongStudentChallenge: results.some(result => result.scenario === 'strong student' && result.hasChallengeBlock)
    },
    failures
  };

  console.log(JSON.stringify(report, null, 2));

  if (failures.length) {
    process.exitCode = 1;
  }
}

await main();
