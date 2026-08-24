import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createCanonicalProgress } from '../../src/utils/canonicalProgress.js';
import { deriveAnalyticsStatus, getAnalyticsNoData, getCanonicalAnalytics } from '../../src/utils/canonicalAnalytics.js';

const root = path.resolve(import.meta.dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const home = read('src/dashboard/HomeDashboard.jsx');
const student = read('src/dashboard/StudentDashboard.jsx');
const parent = read('src/dashboard/ParentDashboard.jsx');
const analytics = read('src/dashboard/AnalyticsDashboard.jsx');
const css = read('src/styles/style.css');
const app = read('src/App.jsx');

assert.ok(home.includes('canonicalAnalytics.scopeLabel'), 'Home dashboard must render the canonical scope label');
assert.ok(home.includes('canonicalAnalytics.masteryPercent'), 'Home mastery card must read canonical mastery percent');
assert.ok(home.includes('canonicalAnalytics.weakTopics.length'), 'Home AI recommendation must use canonical weak topics');
assert.ok(!home.includes('<div><b>{clampPercent(masterySummary.masteryScore)}%</b><span>Skor Penguasaan</span></div>'), 'Home mastery card still renders legacy masterySummary score');
assert.ok(!home.includes('<div><b>{masterySummary.dikuasai}</b><span>Dikuasai</span></div>'), 'Home mastery card still renders legacy mastered count');
assert.ok(!home.includes('<div><b>{masterySummary.learning}</b><span>Sedang Belajar</span></div>'), 'Home mastery card still renders legacy learning count');
assert.ok(!home.includes('<div><b>{masterySummary.needsPractice}</b><span>Perlu Latihan</span></div>'), 'Home mastery card still renders legacy weak count');
assert.ok(!home.includes('<span>Penguasaan {clampPercent(aiMemory.mastery)}%</span>'), 'Home AI recommendation still renders aiMemory mastery');
assert.ok(!home.includes('<span>Hari berturut {aiMemory.studyStreak}</span>'), 'Home AI recommendation still renders aiMemory streak');
assert.ok(!home.includes('{aiMemory.weakTopics.length || aiRecommendation.weakTopics.length} topik lemah'), 'Home AI recommendation still renders aiMemory weak count');
assert.ok(!home.includes('{aiMemory.strongTopics.length} topik kuat'), 'Home AI recommendation still renders aiMemory strong count');
assert.ok(home.includes('canonicalAnalytics.bestStreak'), 'Home dashboard must surface canonical best streak');
assert.ok(home.includes('canonicalAnalytics.latestScore'), 'Home dashboard must surface canonical latest score');
assert.ok(home.includes('canonicalAnalytics.latestTopic'), 'Home dashboard must surface canonical latest topic');

assert.ok(student.includes('const topWeak = analytics.hasEvidence ? analytics.weakTopics.slice(0, 5)'), 'Student dashboard weak topics are not canonical-first');
assert.ok(student.includes('const topStrong = analytics.hasEvidence ? analytics.strongTopics.slice(0, 5)'), 'Student dashboard strong topics are not canonical-first');
assert.ok(student.includes('const summaryAccuracy = clampPercent(analytics.accuracy ?? overallAccuracy);'), 'Student summary accuracy must derive from canonical analytics');
assert.ok(student.includes('analytics.scopeLabel'), 'Student dashboard must render the canonical scope label');

assert.ok(parent.includes('const strongestSubject = [...subjectInsights].filter(subject => subject.hasData).sort((left, right) => right.mastery - left.mastery)[0] || null;'), 'Parent strongest subject must derive from canonical subject analytics');
assert.ok(parent.includes('const weakestSubject = [...subjectInsights].filter(subject => subject.hasData).sort((left, right) => left.mastery - right.mastery)[0] || null;'), 'Parent weakest subject must derive from canonical subject analytics');
assert.ok(parent.includes('const focusTopics = canonicalAnalytics.weakTopics.slice(0, 4);'), 'Parent focus topics must derive from canonical analytics');
assert.ok(parent.includes('MetricCard value={canonicalAnalytics.totalQuestions} label="Soalan Dijawab"'), 'Parent total questions must come from canonical analytics');
assert.ok(parent.includes('MetricCard value={canonicalAnalytics.correctQuestions} label="Jawapan Betul"'), 'Parent correct count must come from canonical analytics');
assert.ok(parent.includes('MetricCard value={`${safePercent(canonicalAnalytics.accuracy)}%`} label="Ketepatan"'), 'Parent accuracy must come from canonical analytics');
assert.ok(parent.includes('MetricCard value={`${safePercent(canonicalAnalytics.masteryPercent)}%`} label="Penguasaan"'), 'Parent mastery must come from canonical analytics');
assert.ok(parent.includes('MetricCard value={formatStudyMinutes(canonicalAnalytics.studyMinutes || 0)} label="Masa Belajar"'), 'Parent study time must come from canonical analytics');
assert.ok(!parent.includes('history.filter(item => item.percent >= 50).length'), 'Parent dashboard still derives correct counts from session percent');

assert.ok(analytics.includes('canonicalAnalytics.scopeLabel'), 'Analytics dashboard must render the canonical scope label');
assert.ok(analytics.includes('canonicalAnalytics.hasEvidence ? ('), 'Analytics dashboard must gate mastery/AI cards on canonical evidence');
assert.ok(analytics.includes('<EmptyState'), 'Analytics dashboard must render intentional no-data cards');
assert.ok(!analytics.includes("canonicalAnalytics.hasEvidence ? '—'"), 'Analytics dashboard still renders dash-only no-data metrics');
assert.ok(!analytics.includes('aiMemory.studyStreak'), 'Analytics dashboard still uses legacy AI memory streak');

for (const [surfaceName, source] of Object.entries({ home, student, parent, analytics })) {
  const forbiddenVisibleLabels = [
    /['"`]kata_adjektif['"`]/,
    /['"`]uasa_kbat['"`]/,
    /['"`]penjodoh_bilangan['"`]/,
    />\s*review\s*</i,
    /['"`]Math['"`]/,
    /['"`]Nouns['"`]/,
    /['"`]Starter Plan['"`]/,
    /AI:\s*Rendah/i
  ];
  for (const pattern of forbiddenVisibleLabels) {
    assert.ok(!pattern.test(source), `Forbidden visible label leaked into ${surfaceName}: ${pattern}`);
  }
}

const fixture = {
  xp: 120,
  level: 3,
  streak: 3,
  bestStreak: 1,
  history: [
    { subjectId: 'math', topicId: 'darab', score: 98, correct: 8, attempts: 10, timestamp: '2026-07-25T09:00:00.000Z' },
    { subjectId: 'bm', topicId: 'kata_nama', score: 61, correct: 6, attempts: 10, timestamp: '2026-07-26T09:00:00.000Z' }
  ],
  topics: {
    math: {
      darab: { attempts: 3, correct: 1, masteryScore: 47, confidence: 47 },
      tambah: { attempts: 8, correct: 7, masteryScore: 90, confidence: 90 }
    },
    bm: {
      kata_nama: { attempts: 4, correct: 3, masteryScore: 61, confidence: 61 }
    }
  }
};

const canonicalProgress = createCanonicalProgress(fixture);
const overall = getCanonicalAnalytics({ canonicalProgress });
const math = getCanonicalAnalytics({ canonicalProgress, subjectId: 'math', selectedSubject: { id: 'math', title: 'Matematik' } });
const bm = getCanonicalAnalytics({ canonicalProgress, selectedSubject: { id: 'bm', title: 'Bahasa Melayu' } });
const empty = getCanonicalAnalytics({ canonicalProgress: createCanonicalProgress({}) });
const noData = getAnalyticsNoData('subject-not-started');

assert.equal(overall.scope, 'overall');
assert.equal(overall.scopeLabel, 'Keseluruhan');
assert.equal(math.scope, 'subject');
assert.equal(math.scopeLabel, 'Subjek dipilih: Matematik');
assert.equal(math.masteryPercent, 69);
assert.equal(math.strongTopics.length, 1);
assert.equal(math.weakTopics.length, 1);
assert.equal(math.latestScore, 98);
assert.equal(math.latestTopic, 'darab');
assert.equal(math.totalQuestions, 11);
assert.equal(bm.latestScore, 61);
assert.equal(overall.bestStreak, 3);
assert.ok(overall.bestStreak >= overall.currentStreak);
assert.equal(empty.hasEvidence, false);
assert.equal(deriveAnalyticsStatus(empty), 'Belum Bermula');
assert.equal(noData.title, 'Subjek belum bermula');
assert.ok(noData.message.length > 10);

assert.ok(css.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'), 'Mobile dashboard metric density rule missing');
assert.ok(app.includes('createCanonicalProgress'), 'Runtime does not import canonical progress');

console.log(JSON.stringify({
  status: 'PASS',
  fixture: {
    overallScope: overall.scope,
    mathScope: math.scope,
    mathLatestScore: math.latestScore,
    mathMasteryPercent: math.masteryPercent,
    mathStrongTopics: math.strongTopics.length,
    mathWeakTopics: math.weakTopics.length,
    bestStreak: overall.bestStreak
  },
  noDataContract: {
    emptyHasEvidence: empty.hasEvidence,
    subjectTitle: noData.title
  },
  sourceChecks: {
    homeCanonical: true,
    studentCanonical: true,
    parentCanonical: true,
    analyticsCanonical: true
  }
}, null, 2));
