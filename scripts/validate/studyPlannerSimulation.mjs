import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import {
  createStudyPlanner,
  createDailyPlan,
  createWeeklyPlan,
  inspectStudyPlanner,
  createStudyPlannerPayload
} from '../../src/studyPlanner/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const reportPath = path.join(repoRoot, 'docs', 'V3_STUDY_PLANNER_ARCHITECTURE.md');

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
  if (typeof value === 'string' && (value.includes('undefined') || value.includes('null') || value.includes('NaN') || value.includes('[object Object]'))) return true;
  if (Array.isArray(value)) return value.some(hasBadValue);
  if (value && typeof value === 'object') return Object.values(value).some(hasBadValue);
  return false;
}

function buildCompleteProfile() {
  return {
    studentId: 'study-complete',
    name: 'Aina',
    year: 'Tahun 2',
    totals: { questionsAnswered: 128, correct: 109, wrong: 19, accuracy: 85, currentStreak: 9, longestStreak: 17, studyMinutes: 160 },
    history: [
      { date: '2026-07-19', subject: 'math', topic: 'Tambah nombor hingga 1000', percent: 90 },
      { date: '2026-07-18', subject: 'bm', topic: 'Kata Kerja', percent: 78 },
      { date: '2026-07-17', subject: 'english', topic: 'Verbs', percent: 82 }
    ],
    topics: {
      math: { tambah: { attempts: 22, correct: 20, wrong: 2, accuracy: 91, mastery: 92, lastAnsweredAt: '2026-07-19', averageTime: 34 } },
      bm: { kata_kerja: { attempts: 18, correct: 14, wrong: 4, accuracy: 78, mastery: 74, lastAnsweredAt: '2026-07-18', averageTime: 46 } },
      english: { verbs: { attempts: 14, correct: 12, wrong: 2, accuracy: 86, mastery: 88, lastAnsweredAt: '2026-07-17', averageTime: 39 } }
    },
    subjects: {
      math: { mastery: 92 },
      bm: { mastery: 74 },
      english: { mastery: 88 },
      sains: { mastery: 69 }
    },
    adaptivePerformance: {
      totalQuestions: 128,
      correctQuestions: 109,
      incorrectQuestions: 19,
      totalTime: 160
    },
    availableStudyMinutes: 30
  };
}

function buildWeakProfile() {
  return {
    studentId: 'study-weak',
    name: 'Murid',
    year: 'Tahun 2',
    totals: { questionsAnswered: 22, correct: 9, wrong: 13, accuracy: 41, currentStreak: 1, longestStreak: 3, studyMinutes: 58 },
    history: [
      { date: '2026-07-19', subject: 'math', topic: 'Tolak', percent: 35 },
      { date: '2026-07-18', subject: 'math', topic: 'Bahagi', percent: 30 },
      { date: '2026-07-17', subject: 'bm', topic: 'Penjodoh Bilangan', percent: 40 }
    ],
    topics: {
      math: {
        tolak: { attempts: 8, correct: 2, wrong: 6, accuracy: 25, mastery: 28, lastAnsweredAt: '2026-07-19', averageTime: 72, usedHintCount: 4 },
        bahagi: { attempts: 6, correct: 2, wrong: 4, accuracy: 33, mastery: 37, lastAnsweredAt: '2026-07-18', averageTime: 80, usedHintCount: 3 }
      },
      bm: {
        penjodoh_bilangan: { attempts: 8, correct: 5, wrong: 3, accuracy: 62, mastery: 55, lastAnsweredAt: '2026-07-17', averageTime: 51, usedExplainCount: 2 }
      }
    },
    subjects: {
      math: { mastery: 33 },
      bm: { mastery: 55 },
      english: { mastery: 48 },
      sains: { mastery: 44 }
    },
    availableStudyMinutes: 20
  };
}

function buildStrongProfile() {
  return {
    studentId: 'study-strong',
    name: 'Lina',
    year: 'Tahun 2',
    totals: { questionsAnswered: 210, correct: 190, wrong: 20, accuracy: 90, currentStreak: 12, longestStreak: 21, studyMinutes: 240 },
    history: [
      { date: '2026-07-19', subject: 'english', topic: 'Reading Comprehension', percent: 96 },
      { date: '2026-07-18', subject: 'sains', topic: 'Haiwan', percent: 94 },
      { date: '2026-07-17', subject: 'math', topic: 'Tambah', percent: 98 }
    ],
    topics: {
      english: { reading_comprehension: { attempts: 40, correct: 38, wrong: 2, accuracy: 95, mastery: 96, lastAnsweredAt: '2026-07-19', averageTime: 28 } },
      sains: { haiwan: { attempts: 30, correct: 29, wrong: 1, accuracy: 97, mastery: 94, lastAnsweredAt: '2026-07-18', averageTime: 24 } },
      math: { tambah: { attempts: 42, correct: 41, wrong: 1, accuracy: 98, mastery: 97, lastAnsweredAt: '2026-07-17', averageTime: 20 } }
    },
    subjects: {
      math: { mastery: 97 },
      bm: { mastery: 89 },
      english: { mastery: 96 },
      sains: { mastery: 94 }
    },
    availableStudyMinutes: 45
  };
}

function buildOverdueProfile() {
  return {
    studentId: 'study-overdue',
    name: 'Rafi',
    year: 'Tahun 2',
    totals: { questionsAnswered: 66, correct: 42, wrong: 24, accuracy: 64, currentStreak: 2, longestStreak: 8, studyMinutes: 92 },
    history: [
      { date: '2026-07-12', subject: 'islam', topic: 'Akhlak', percent: 58 },
      { date: '2026-07-11', subject: 'arab', topic: 'Mufradat', percent: 52 },
      { date: '2026-07-10', subject: 'bm', topic: 'Kata Hubung', percent: 61 }
    ],
    topics: {
      islam: { akhlak: { attempts: 16, correct: 9, wrong: 7, accuracy: 56, mastery: 48, lastAnsweredAt: '2026-07-12', averageTime: 58 } },
      arab: { mufradat: { attempts: 14, correct: 7, wrong: 7, accuracy: 50, mastery: 44, lastAnsweredAt: '2026-07-11', averageTime: 64 } },
      bm: { kata_hubung: { attempts: 18, correct: 11, wrong: 7, accuracy: 61, mastery: 59, lastAnsweredAt: '2026-07-10', averageTime: 49 } }
    },
    subjects: {
      islam: { mastery: 48 },
      arab: { mastery: 44 },
      bm: { mastery: 59 },
      math: { mastery: 62 }
    },
    availableStudyMinutes: 30
  };
}

function buildSparseProfile() {
  return {
    studentId: 'study-sparse',
    name: 'Murid',
    year: 'Tahun 2',
    totals: { questionsAnswered: 5, correct: 3, wrong: 2, accuracy: 60, currentStreak: 1, longestStreak: 2, studyMinutes: 12 },
    topics: {
      bm: { kata_nama: { attempts: 3, correct: 2, wrong: 1, accuracy: 67, mastery: 61, lastAnsweredAt: '2026-07-19', averageTime: 45 } }
    },
    subjects: {
      bm: { mastery: 61 }
    }
  };
}

function buildMalformedProfile() {
  return {
    studentId: 'study-malformed',
    name: null,
    year: null,
    totals: { questionsAnswered: '15', correct: '10', wrong: '5', accuracy: '66', currentStreak: '2', longestStreak: '4', studyMinutes: 'NaN' },
    history: [{ date: null, subject: null, topic: null, percent: 'null' }],
    topics: {
      math: { tambah: { attempts: '7', correct: '5', wrong: '2', accuracy: '71', mastery: '73', lastAnsweredAt: 'bad-date', averageTime: '45' } }
    },
    subjects: {
      math: { mastery: '73' }
    },
    availableStudyMinutes: 'abc'
  };
}

function summarizePlan(plan = {}) {
  return {
    onboarding: Boolean(plan.onboarding),
    dailyBlocks: Array.isArray(plan.dailyPlan?.blocks) ? plan.dailyPlan.blocks.length : 0,
    weeklyDays: Array.isArray(plan.weeklyPlan?.days) ? plan.weeklyPlan.days.length : 0,
    firstDayBlocks: Array.isArray(plan.weeklyPlan?.days?.[0]?.blocks) ? plan.weeklyPlan.days[0].blocks.length : 0
  };
}

function extractSubjectSequence(weeklyPlan = {}) {
  return (Array.isArray(weeklyPlan.days) ? weeklyPlan.days : []).map(day => {
    const block = Array.isArray(day.blocks) ? day.blocks[0] : null;
    return safeText(block?.subject, '');
  }).filter(Boolean);
}

function maxRunLength(sequence = []) {
  let max = 0;
  let current = 0;
  let previous = null;
  sequence.forEach(item => {
    if (item === previous) {
      current += 1;
    } else {
      current = 1;
      previous = item;
    }
    if (current > max) max = current;
  });
  return max;
}

function validateDurationShape(blocks = []) {
  const allowed = new Set([10, 15, 20, 30, 45, 60]);
  blocks.forEach(block => {
    assert(allowed.has(safeNumber(block.durationMinutes, 0)), 'Duration must be from the allowed set.');
    assert(safeNumber(block.durationMinutes, 0) >= 5 && safeNumber(block.durationMinutes, 0) <= 60, 'Duration must stay within clamp.');
  });
}

const scenarios = [
  { name: 'complete profile', profile: buildCompleteProfile() },
  { name: 'weak student', profile: buildWeakProfile() },
  { name: 'strong student', profile: buildStrongProfile() },
  { name: 'overdue revisions', profile: buildOverdueProfile() },
  { name: 'sparse profile', profile: buildSparseProfile() },
  { name: 'empty profile', profile: null },
  { name: 'malformed data', profile: buildMalformedProfile() }
];

const results = scenarios.map(scenario => {
  const started = performance.now();
  const plan = createStudyPlanner(scenario.profile, {
    availableStudyMinutes: safeNumber(scenario.profile?.availableStudyMinutes, 0),
    date: '2026-07-19T00:00:00Z'
  });
  const elapsed = Number((performance.now() - started).toFixed(2));

  assert.equal(hasBadValue(plan), false, `${scenario.name} should not contain undefined/null/NaN/[object Object].`);
  assert(plan.dailyPlan && Array.isArray(plan.dailyPlan.blocks), `${scenario.name} should include a daily plan.`);
  assert(plan.weeklyPlan && Array.isArray(plan.weeklyPlan.days), `${scenario.name} should include a weekly plan.`);
  assert.equal(plan.weeklyPlan.days.length, 7, `${scenario.name} should build a 7-day weekly plan.`);
  validateDurationShape(plan.dailyPlan.blocks);
  plan.weeklyPlan.days.forEach(day => validateDurationShape(day.blocks));

  return {
    scenario: scenario.name,
    elapsedMs: elapsed,
    dailyBlocks: plan.dailyPlan.blocks.length,
    weeklyDays: plan.weeklyPlan.days.length,
    onboarding: Boolean(plan.onboarding),
    firstDailySubject: safeText(plan.dailyPlan.blocks?.[0]?.subject, '-'),
    firstDailyTopic: safeText(plan.dailyPlan.blocks?.[0]?.topic, '-')
  };
});

const weakPlan = createStudyPlanner(buildWeakProfile(), { availableStudyMinutes: 20, date: '2026-07-19T00:00:00Z' });
assert(weakPlan.dailyPlan.blocks.some(block => block.priority === 'high' || block.recommendationKey === 'review'), 'Weak student should prioritize review.');

const strongPlan = createStudyPlanner(buildStrongProfile(), { availableStudyMinutes: 45, date: '2026-07-19T00:00:00Z' });
assert(strongPlan.dailyPlan.blocks.some(block => block.activityType === 'challenge' || block.recommendationKey === 'increase_difficulty'), 'Strong student should allow challenge or progression.');

const overduePlan = createStudyPlanner(buildOverdueProfile(), { availableStudyMinutes: 30, date: '2026-07-19T00:00:00Z' });
assert(overduePlan.dailyPlan.blocks[0].priority === 'high', 'Overdue revisions should be high priority.');
assert(overduePlan.dailyPlan.blocks[0].activityType === 'revision', 'Overdue revisions should use revision activity.');

const emptyPlan = createStudyPlanner(null, { date: '2026-07-19T00:00:00Z' });
assert(emptyPlan.onboarding, 'Empty profile should use onboarding mode.');
assert(emptyPlan.dailyPlan.blocks.length >= 2, 'Empty profile should still provide starter blocks.');
assert(emptyPlan.dailyPlan.blocks[0].topic.includes('Mathematics') || emptyPlan.dailyPlan.blocks[0].topic.includes('basics'), 'Empty onboarding should include mathematics basics.');
assert(emptyPlan.dailyPlan.blocks[1].topic.includes('Bahasa Melayu') || emptyPlan.dailyPlan.blocks[1].topic.includes('reading'), 'Empty onboarding should include Bahasa Melayu reading.');

const sparsePlan = createStudyPlanner(buildSparseProfile(), { availableStudyMinutes: 10, date: '2026-07-19T00:00:00Z' });
assert(sparsePlan.dailyPlan.blocks.length >= 1, 'Sparse profile should return a daily plan.');

const daily10 = createDailyPlan(buildCompleteProfile(), { availableStudyMinutes: 10, date: '2026-07-19T00:00:00Z' });
const daily60 = createDailyPlan(buildCompleteProfile(), { availableStudyMinutes: 60, date: '2026-07-19T00:00:00Z' });
assert(daily10.blocks.every(block => block.durationMinutes === 10), '10-minute plan should stay at 10 minutes.');
assert(daily60.blocks.every(block => block.durationMinutes <= 60), '60-minute plan should stay within bounds.');

const weeklyPlan = createWeeklyPlan(buildCompleteProfile(), { availableStudyMinutes: 30, date: '2026-07-19T00:00:00Z' });
const subjectSequence = extractSubjectSequence(weeklyPlan);
assert.equal(weeklyPlan.days.length, 7, 'Weekly plan must cover 7 days.');
assert(maxRunLength(subjectSequence) <= 2, 'Weekly plan should avoid repeating the same subject excessively.');

const payload = createStudyPlannerPayload(buildCompleteProfile(), { availableStudyMinutes: 30, date: '2026-07-19T00:00:00Z' });
assert.equal(hasBadValue(payload), false, 'Planner payload should stay normalized.');

const inspection = inspectStudyPlanner(buildCompleteProfile(), { availableStudyMinutes: 30, date: '2026-07-19T00:00:00Z' });
assert(Array.isArray(inspection.candidates), 'Inspector should expose candidate list.');

const averageLatency = Number((results.reduce((sum, row) => sum + row.elapsedMs, 0) / results.length).toFixed(2));

const report = `# V3 Study Planner Architecture

## Architecture

- Adaptive Learning signals weak topics and mastery levels.
- Parent Insights supplies weakest subjects, focus topics, and revision summaries.
- Revision Schedule supplies overdue and upcoming review items.
- Study Planner Service combines read-only signals into a daily and weekly plan.
- Planner Controller normalizes the final payload for future UI integration.

## Data Sources

- weakest subjects
- focus topics
- recommendationKey
- mastery values
- overdue reviews
- upcoming reviews
- recent activity
- available study time

## Priority Rules

1. overdue revision
2. mastery below 60
3. recommendationKey = review
4. upcoming revision
5. normal practice
6. increase difficulty

Priority output: high / medium / low.

## Duration Rules

- Supported durations: 10, 15, 20, 30, 45, 60 minutes
- Weekday default: 20 minutes
- Weekend default: 30 minutes
- Durations are clamped to 5-60 minutes and never return NaN

## Onboarding Behaviour

- Brand-new students receive a starter plan.
- No fake weakness or revision is fabricated.
- Starter examples include Mathematics basics and Bahasa Melayu reading.

## Future UI Integration

- Daily plan card
- Weekly calendar view
- Parent-friendly summary section

## Limitations

- The planner is read-only and does not change mastery or scoring.
- Subject balance is heuristic and intentionally lightweight.
- It prefers safe, bounded study blocks over aggressive optimization.

## Validation Snapshot

- Scenarios tested: ${results.length}
- Average latency: ${averageLatency} ms
- Weekly plan days: ${weeklyPlan.days.length}
- Subject repetition guard: PASS
- Duration allocation: PASS

## Scenario Results

| Scenario | Latency (ms) | Daily Blocks | Weekly Days | Onboarding |
| --- | ---: | ---: | ---: | --- |
${results.map(row => `| ${row.scenario} | ${row.elapsedMs} | ${row.dailyBlocks} | ${row.weeklyDays} | ${row.onboarding ? 'Yes' : 'No'} |`).join('\n')}

## Daily Plan Examples

| Scenario | First Block |
| --- | --- |
${results.map(row => `| ${row.scenario} | ${row.firstDailySubject} - ${row.firstDailyTopic} |`).join('\n')}

## Weekly Plan Summary

- Seven-day plan generated successfully.
- Subject repetition guard limited long consecutive runs.
- Lighter days were included for balance.
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report, 'utf8');

console.log(JSON.stringify({
  averageLatencyMs: averageLatency,
  results,
  weeklySubjectSequence: subjectSequence,
  maxRunLength: maxRunLength(subjectSequence)
}, null, 2));
