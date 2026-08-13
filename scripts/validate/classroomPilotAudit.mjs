import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildClassroomPilotReport } from '../../src/analytics/classroomPilotEngine.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const generatedAt = '2026-08-13T12:00:00.000Z';

function entry(overrides = {}) {
  return {
    sessionId: 's1',
    questionId: 'q1',
    subjectId: 'math',
    topicId: 'tambah',
    attemptNumber: 1,
    correct: true,
    timeSpent: 30,
    usedHint: false,
    usedExplain: false,
    misconceptionType: '',
    masteryBefore: 40,
    masteryAfter: 45,
    confidenceBefore: 40,
    confidenceAfter: 45,
    answeredAt: '2026-08-12T04:00:00.000Z',
    answer: 'DATA_MENTAH_TIDAK_BOLEH_DIEKSPORT',
    ...overrides
  };
}

const learningHistory = [
  entry({ questionId: 'q1', correct: false, misconceptionType: 'OPERATION_CONFUSION', masteryAfter: 35 }),
  entry({ questionId: 'q1', attemptNumber: 2, correct: true, usedHint: true, masteryBefore: 35, masteryAfter: 45, answeredAt: '2026-08-12T04:01:00.000Z' }),
  entry({ questionId: 'q2', masteryBefore: 45, masteryAfter: 50, answeredAt: '2026-08-12T04:02:00.000Z' }),
  entry({ questionId: 'q3', correct: false, usedHint: true, misconceptionType: 'PLACE_VALUE_CONFUSION', masteryBefore: 50, masteryAfter: 44, answeredAt: '2026-08-12T04:03:00.000Z' }),
  entry({ questionId: 'q4', masteryBefore: 44, masteryAfter: 52, answeredAt: '2026-08-12T04:04:00.000Z' }),
  entry({ questionId: 'q5', masteryBefore: 52, masteryAfter: 60, answeredAt: '2026-08-12T04:05:00.000Z' }),
  entry({ sessionId: 's2', questionId: 'q6', subjectId: 'sains', topicId: 'tumbuhan', correct: false, misconceptionType: 'PLANT_MISCONCEPTION', masteryBefore: 50, masteryAfter: 45, answeredAt: '2026-08-13T04:00:00.000Z' }),
  entry({ sessionId: 's2', questionId: 'q6', subjectId: 'sains', topicId: 'tumbuhan', attemptNumber: 2, usedExplain: true, masteryBefore: 45, masteryAfter: 54, answeredAt: '2026-08-13T04:01:00.000Z' }),
  entry({ sessionId: 's2', questionId: 'q7', subjectId: 'sains', topicId: 'tumbuhan', masteryBefore: 54, masteryAfter: 57, answeredAt: '2026-08-13T04:02:00.000Z' }),
  entry({ sessionId: 's2', questionId: 'q8', subjectId: 'sains', topicId: 'tumbuhan', masteryBefore: 57, masteryAfter: 60, answeredAt: '2026-08-13T04:03:00.000Z' }),
  entry({ sessionId: 's2', questionId: 'q9', subjectId: 'sains', topicId: 'tumbuhan', correct: false, misconceptionType: 'CONCEPT_MISCONCEPTION', masteryBefore: 60, masteryAfter: 55, answeredAt: '2026-08-13T04:04:00.000Z' }),
  entry({ sessionId: 's2', questionId: 'q10', subjectId: 'sains', topicId: 'tumbuhan', masteryBefore: 55, masteryAfter: 62, answeredAt: '2026-08-13T04:05:00.000Z' })
];

const adaptiveProfile = {
  name: 'Aina Rahsia',
  email: 'aina@example.test',
  accountId: 'account-secret',
  learningHistory,
  sessionHistory: [
    { sessionId: 's2', startedAt: '2026-08-13T04:00:00.000Z', endedAt: '2026-08-13T04:10:00.000Z', completed: true, plannedQuestionCount: 5, correct: 4, wrong: 2, durationSeconds: 600 },
    { sessionId: 's1', startedAt: '2026-08-12T04:00:00.000Z', endedAt: '2026-08-12T04:10:00.000Z', completed: true, plannedQuestionCount: 5, correct: 4, wrong: 2, durationSeconds: 600 },
    { sessionId: 's0', startedAt: '2026-08-11T04:00:00.000Z', endedAt: '2026-08-11T04:02:00.000Z', completed: false, plannedQuestionCount: 5, correct: 1, wrong: 0, durationSeconds: 120 }
  ]
};

const report = buildClassroomPilotReport({
  adaptiveProfile,
  participantCode: 'pilot-ab12cd34',
  options: { generatedAt, windowDays: 14 }
});

const checks = [];

function check(label, condition, detail = '') {
  checks.push({ label, pass: Boolean(condition), detail });
}

check('report uses aggregate classroom-pilot schema', report.reportType === 'classroom-pilot-aggregate' && report.schemaVersion === 1);
check('participant code is normalized without exposing identity', report.metadata.participantCode === 'PILOT-AB12CD34');
check('attempt and unique-question counts are deterministic', report.summary.activity.attempts === 12 && report.summary.comprehension.uniqueQuestions === 10, JSON.stringify(report.summary.comprehension));
check('first-attempt and final-answer comprehension are separated', report.summary.comprehension.firstAttemptAccuracy === 60 && report.summary.comprehension.finalAnswerAccuracy === 80, JSON.stringify(report.summary.comprehension));
check('hint and explanation use are measured per attempt', report.summary.support.hintAttempts === 2 && report.summary.support.explainAttempts === 1 && report.summary.support.hintUseRate === 17, JSON.stringify(report.summary.support));
check('explicit session completion excludes abandoned sessions', report.summary.sessions.completed === 2 && report.summary.sessions.abandoned === 1 && report.summary.sessions.completionRate === 67, JSON.stringify(report.summary.sessions));
check('misconceptions are classified without raw responses', report.summary.misconceptions.wrongAttempts === 4 && report.summary.misconceptions.classificationCoverage === 100 && report.misconceptions.topCategories.length === 4);
check('mastery change uses first-before and last-after snapshots', report.summary.mastery.baselineAverage === 45 && report.summary.mastery.currentAverage === 61 && report.summary.mastery.averageChange === 16, JSON.stringify(report.summary.mastery));
check('minimum pilot evidence produces ready status', report.readiness.ready === true && report.readiness.status === 'ready', JSON.stringify(report.readiness));

const forbiddenKeys = new Set(['name', 'email', 'accountId', 'studentId', 'questionId', 'answer', 'correctAnswer', 'userAnswer', 'transcript', 'learningData', 'feedback']);
const discoveredForbiddenKeys = [];
function scan(value, trail = 'report') {
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, child]) => {
    if (forbiddenKeys.has(key)) discoveredForbiddenKeys.push(`${trail}.${key}`);
    scan(child, `${trail}.${key}`);
  });
}
scan(report);
const serialized = JSON.stringify(report);
check('export contains no direct identifiers or raw response payloads', discoveredForbiddenKeys.length === 0 && !serialized.includes('Aina Rahsia') && !serialized.includes('aina@example.test') && !serialized.includes('DATA_MENTAH_TIDAK_BOLEH_DIEKSPORT'), discoveredForbiddenKeys.join(', '));

const appSource = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const adaptiveSessionSource = fs.readFileSync(path.join(root, 'src/ai/adaptive/adaptiveSessionEngine.js'), 'utf8');
const analyticsSource = fs.readFileSync(path.join(root, 'src/dashboard/AnalyticsDashboard.jsx'), 'utf8');
const settingsSource = fs.readFileSync(path.join(root, 'src/dashboard/dashboardHelpers.jsx'), 'utf8');
check('quiz events persist support, misconception and mastery evidence', ['usedHint', 'usedExplain', 'misconceptionType'].every(token => appSource.includes(token)) && ['masteryBefore', 'masteryAfter'].every(token => adaptiveSessionSource.includes(token)));
check('completed sessions are explicit', appSource.includes('completed: true') && appSource.includes('plannedQuestionCount: total'));
check('teacher-facing pilot surface and anonymous export are wired', analyticsSource.includes('Ringkasan Bukti 14 Hari') && analyticsSource.includes("reportType: 'classroom-pilot'") && analyticsSource.includes('Eksport Laporan Pilot Tanpa Nama'));
check('raw export is clearly labeled as a private backup', settingsSource.includes('Backup Data Pembelajaran JSON') && settingsSource.includes('data pembelajaran mentah'));

console.log('\nClassroom Pilot P2 Audit');
console.log('========================');
checks.forEach(item => console.log(`${item.pass ? 'PASS' : 'FAIL'}  ${item.label}${item.detail && !item.pass ? `\n      ${item.detail}` : ''}`));
const failures = checks.filter(item => !item.pass);
console.log(`\n${checks.length - failures.length}/${checks.length} checks passed.`);
if (failures.length) process.exit(1);
