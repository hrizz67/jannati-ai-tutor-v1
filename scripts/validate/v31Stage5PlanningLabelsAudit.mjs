import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { isCrossSubjectTarget, formatModeLabel, formatRecommendationKey } from '../../src/utils/displayFormatter.js';

const root = path.resolve(import.meta.dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const weeklyPlanList = read('src/components/studyPlanner/WeeklyPlanList.jsx');
const studyPlannerPanel = read('src/components/studyPlanner/StudyPlannerPanel.jsx');
const studyBlockItem = read('src/components/studyPlanner/StudyBlockItem.jsx');
const home = read('src/dashboard/HomeDashboard.jsx');
const resumeCard = read('src/components/ResumePracticeCard.jsx');
const student = read('src/dashboard/StudentDashboard.jsx');
const parent = read('src/dashboard/ParentDashboard.jsx');
const analytics = read('src/dashboard/AnalyticsDashboard.jsx');
const revision = read('src/dashboard/RevisionDashboard.jsx');
const css = read('src/styles/style.css');
const app = read('src/App.jsx');

const surfaces = {
  weeklyPlanList,
  studyPlannerPanel,
  studyBlockItem,
  home,
  student,
  parent,
  analytics,
  revision
};

assert.ok(weeklyPlanList.includes("const [expandedToday, setExpandedToday] = React.useState(Boolean(todayDay));"), 'Today must be expanded by default');
assert.ok(weeklyPlanList.includes("const [expandedExtraKey, setExpandedExtraKey] = React.useState('');"), 'Non-today days must be collapsed by default');
assert.ok(weeklyPlanList.includes("setExpandedExtraKey(current => (current === dayKey ? '' : dayKey));"), 'Only one optional day may be expanded at a time');
assert.ok(weeklyPlanList.includes('formatSubjectList(blocks.map(block => block?.subjectId || block?.subject))'), 'Weekly row summary must deduplicate subjects');
assert.ok(weeklyPlanList.includes('formatDurationLabel(totalMinutes)'), 'Weekly row summary must show total minutes');
assert.ok(weeklyPlanList.includes('totalBlocks') && weeklyPlanList.includes('blok'), 'Weekly row summary must show block count');
assert.ok(weeklyPlanList.includes('aria-expanded={expanded}') && weeklyPlanList.includes('aria-controls={panelId}'), 'Weekly accordion accessibility attributes missing');
assert.ok(weeklyPlanList.includes("className=\"weekly-plan-summary\""), 'Weekly compact summary class missing');

assert.ok(revision.includes('formatReviewQueueMeta(topic)'), 'Revision queue must use canonical compact review meta');
assert.ok(parent.includes('formatReviewQueueMeta(item)'), 'Parent revision queue must use canonical compact review meta');
assert.ok(!parent.includes('formatRelativeTiming('), 'Legacy duplicate overdue formatter still exists in Parent dashboard');
assert.ok(!parent.includes('safePercent(item.priority)'), 'Parent review queue must not display raw priority percentage');

for (const [name, source] of Object.entries(surfaces)) {
  const forbiddenVisibleLabels = [
    /Starter Plan/,
    /AI:\s*Rendah/i,
    /Hari berturut\s+\d/i,
    /30 Masa/,
    /Ya Pengganti/,
    /Tidak Starter Plan/,
    />\s*review\s*</i,
    /Subjek:\s*<b>\s*Math\s*<\/b>/i,
    /Topik:\s*<b>\s*Nouns\s*<\/b>/i,
    />\s*kata_adjektif\s*</,
    />\s*uasa_kbat\s*</,
    />\s*penjodoh_bilangan\s*</,
    />\s*bm\s*</,
    />\s*math\s*</,
    />\s*english\s*</,
    />\s*arab\s*</
  ];

  for (const pattern of forbiddenVisibleLabels) {
    assert.ok(!pattern.test(source), `Forbidden raw label leaked into ${name}: ${pattern}`);
  }
}

assert.ok(home.includes('formatFallbackState('), 'Home adaptive practice card must use canonical fallback formatter');
assert.ok(home.includes('formatDurationLabel(recommendationMinutes)'), 'Home adaptive practice card must use canonical duration formatter');
assert.ok(home.includes('formatResumeTitle(resume)') || home.includes('formatModeLabel(resume?.mode || \'quiz\')'), 'Home resume card must use formatted mode labels');
assert.ok(home.includes('formatSubjectYearLabel('), 'Home cross-subject cards must use canonical subject-year labels');
assert.ok(home.includes('isCrossSubjectTarget(selectedSubjectId, smartTargetSubjectId)'), 'Home smart lesson card must derive cross-subject state canonically');
assert.ok(home.includes('smartCrossSubject && <span className="badge cross-subject-badge">Cadangan lintas subjek</span>'), 'Cross-subject badge must appear only when target differs');
assert.ok((home.includes('resumeCrossSubject &&') && home.includes('cross-subject-badge')) || (resumeCard.includes('isCrossSubjectTarget(') && resumeCard.includes('cross-subject-badge')), 'Resume card must flag cross-subject sessions');
assert.ok(home.includes('Keyakinan AI {formatPriority('), 'Home recommendation card must use polished AI priority copy');
assert.ok(!home.includes('AI: '), 'Legacy AI priority label leaked into Home dashboard');

assert.ok(student.includes('formatDurationLabel(studyPlan?.estimatedMinutes'), 'Student recommendation card must show canonical duration labels');
assert.ok(student.includes('formatStreakLabel(summaryStreak)'), 'Student dashboard must use canonical streak labels');
assert.ok(analytics.includes('formatResumeTitle(resume)') || analytics.includes('formatModeLabel(resume?.mode || \'quiz\')'), 'Analytics resume card must use formatted mode labels');
assert.ok(analytics.includes('formatDurationLabel(adaptivePracticePreview?.summary?.estimatedMinutes || 0)'), 'Analytics recommendation card must use canonical duration labels');
assert.ok(analytics.includes('formatStreakLabel(canonicalAnalytics.currentStreak)'), 'Analytics recommendation card must use polished streak labels');
assert.ok(parent.includes('formatRecommendationKey('), 'Parent dashboard must use canonical recommendation labels');
assert.ok(parent.includes('formatTopicName(item.topicId || item.topic)'), 'Parent recent activity must use canonical topic labels');

const startResumeMatch = app.match(/async function startResume\(\) \{[\s\S]*?async function restartResume/);
assert.ok(startResumeMatch, 'Unable to locate startResume block');
assert.ok(/syncSelectedSubjectState\(practiceSubject\);[\s\S]*startTopic\(practiceTopic, practiceSubject/.test(startResumeMatch[0]), 'Adaptive resume must switch subject before launch');
assert.ok(/syncSelectedSubjectState\(subject\);[\s\S]*startTopic\(topic, subject/.test(startResumeMatch[0]), 'Question resume must switch subject before launch');

const restartResumeMatch = app.match(/async function restartResume\(\) \{[\s\S]*?async function startAdaptiveLesson/);
assert.ok(restartResumeMatch, 'Unable to locate restartResume block');
assert.ok(/syncSelectedSubjectState\(subject\);[\s\S]*startTopic\(topic, subject/.test(restartResumeMatch[0]), 'Restart resume must switch subject before launch');

const startAdaptiveLessonMatch = app.match(/async function startAdaptiveLesson\(recommendation\) \{[\s\S]*?async function startAdaptivePractice/);
assert.ok(startAdaptiveLessonMatch, 'Unable to locate startAdaptiveLesson block');
assert.ok(/syncSelectedSubjectState\(subject\);[\s\S]*startTopic\(topic, subject/.test(startAdaptiveLessonMatch[0]), 'Adaptive lesson CTA must switch subject before launch');

assert.ok(home.includes('canonicalAnalytics.hasEvidence ? ('), 'Recommendation surfaces must gate empty metrics behind no-data state');
assert.ok(css.includes('.weekly-plan-toggle') && css.includes('.weekly-plan-summary') && css.includes('.revision-queue-item'), 'Stage 5 compact mobile classes are missing');
assert.ok(css.includes('@media (max-width: 650px)') && css.includes('.weekly-plan-day'), 'Mobile density rules for Stage 5 are missing');

for (const validatorFile of [
  'scripts/validate/v31Stage1MobileShellAudit.mjs',
  'scripts/validate/v31Stage2CommunicationAudit.mjs',
  'scripts/validate/v31Stage3CoachUasaAudit.mjs',
  'scripts/validate/v31Stage4DashboardAnalyticsAudit.mjs'
]) {
  assert.ok(fs.existsSync(path.join(root, validatorFile)), `Protected validator missing: ${validatorFile}`);
}

assert.equal(isCrossSubjectTarget('bm', 'math'), true);
assert.equal(isCrossSubjectTarget('math', 'math'), false);
assert.equal(formatModeLabel('adaptive-practice'), 'Latihan Adaptif');
assert.equal(formatRecommendationKey('review'), 'Ulang Kaji');

console.log(JSON.stringify({
  status: 'PASS',
  weeklyPlan: {
    todayExpanded: true,
    oneExtraDayOnly: true,
    compactSummary: true
  },
  reviewQueue: {
    canonicalMeta: true,
    duplicateOverdueRemoved: true
  },
  crossSubject: {
    badgeGuard: true,
    resumeOrdering: true,
    lessonOrdering: true
  },
  formatting: {
    canonicalFormatterCoverage: true,
    rawLabelLeak: false
  }
}, null, 2));
