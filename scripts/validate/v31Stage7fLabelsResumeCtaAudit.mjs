import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const formatterModule = await import(pathToFileURL(path.join(root, 'src/utils/displayFormatter.js')).href + `?t=${Date.now()}`);
const {
  formatDuration,
  formatModeName,
  formatPriority,
  formatRecommendationCta,
  formatResumeTitle,
  formatReviewQueueMeta,
  formatScopeLabel,
  formatSubjectName,
  formatTopicName
} = formatterModule;

const failures = [];

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    failures.push(`${label}: expected "${expected}" but received "${actual}"`);
  }
}

function assert(condition, label) {
  if (!condition) failures.push(label);
}

const fixtureResults = {
  priority70: formatPriority(70),
  priority54: formatPriority(54),
  priority20: formatPriority(20),
  reviewQueue: formatReviewQueueMeta({ isOverdue: true, overdueDays: 3, priority: 70 }),
  resumeSubject: formatSubjectName('bm_bertutur_2'),
  resumeTopic: formatTopicName('bm_intro', { subjectId: 'bm_bertutur_2' }),
  resumeModeReview: formatResumeTitle({ subjectId: 'bm_bertutur_2', topicId: 'bm_intro', mode: 'review' }),
  resumeModeAdaptive: formatResumeTitle({ mode: 'adaptive' }),
  resumeModeUasa: formatResumeTitle({ mode: 'uasa' }),
  newTopicCta: formatRecommendationCta({ reason: 'Cuba topik baharu: Haiwan.', isNewTopic: true }),
  reviewCta: formatRecommendationCta({ reason: 'Ulang Haiwan kerana skor terbaik masih 60%.', isReview: true }),
  resumeCta: formatRecommendationCta({ isIncompleteSession: true }),
  zeroDuration: formatDuration(0, { unit: 'seconds' }),
  shortDuration: formatDuration(30, { unit: 'seconds' }),
  oneMinute: formatDuration(60, { unit: 'seconds' }),
  twoMinutes: formatDuration(120, { unit: 'seconds' }),
  topicLabel: formatTopicName('kata_adjektif'),
  subjectYear: formatSubjectName('English Year 2'),
  scopeLabel: formatScopeLabel('Subjek dipilih: English Year 2'),
  crossSubjectCta: formatRecommendationCta({ isCrossSubject: true, subjectId: 'math' }),
  modeReview: formatModeName('review'),
  modeAdaptive: formatModeName('adaptive'),
  modeUasa: formatModeName('uasa')
};

assertEqual(fixtureResults.priority70, 'Tinggi', 'Priority 70');
assertEqual(fixtureResults.priority54, 'Sederhana', 'Priority 54');
assertEqual(fixtureResults.priority20, 'Rendah', 'Priority 20');
assertEqual(fixtureResults.reviewQueue, 'Lewat 3 hari · Keutamaan Tinggi', 'Review queue wording');
assertEqual(fixtureResults.resumeSubject, 'Bertutur Bahasa Melayu Tahun 2', 'Resume subject label');
assertEqual(fixtureResults.resumeTopic, 'Pengenalan Bertutur', 'Resume topic label');
assertEqual(fixtureResults.resumeModeReview, 'Ulang Kaji', 'Resume mode review');
assertEqual(fixtureResults.resumeModeAdaptive, 'Latihan Adaptif', 'Resume mode adaptive');
assertEqual(fixtureResults.resumeModeUasa, 'Pentaksiran Sumatif', 'Resume mode uasa');
assertEqual(fixtureResults.newTopicCta, 'Mula Latihan', 'New-topic CTA');
assertEqual(fixtureResults.reviewCta, 'Latih Semula', 'Weak-topic CTA');
assertEqual(fixtureResults.resumeCta, 'Sambung Latihan', 'Incomplete-session CTA');
assertEqual(fixtureResults.zeroDuration, 'Belum ada masa belajar direkodkan', 'Zero-duration copy');
assertEqual(fixtureResults.shortDuration, 'Kurang daripada 1 minit', 'Short-duration copy');
assertEqual(fixtureResults.oneMinute, '1 minit', 'One-minute copy');
assertEqual(fixtureResults.twoMinutes, '2 minit', 'Two-minute copy');
assertEqual(fixtureResults.topicLabel, 'Kata Adjektif', 'Topic label mapping');
assertEqual(fixtureResults.subjectYear, 'Bahasa Inggeris Tahun 2', 'English Year 2 mapping');
assertEqual(fixtureResults.scopeLabel, 'Subjek dipilih: Bahasa Inggeris Tahun 2', 'Scope label mapping');
assertEqual(fixtureResults.crossSubjectCta, 'Mula Matematik', 'Cross-subject CTA');
assertEqual(fixtureResults.modeReview, 'Ulang Kaji', 'Mode review mapping');
assertEqual(fixtureResults.modeAdaptive, 'Latihan Adaptif', 'Mode adaptive mapping');
assertEqual(fixtureResults.modeUasa, 'Pentaksiran Sumatif', 'Mode uasa mapping');

const stageFiles = [
  'src/dashboard/HomeDashboard.jsx',
  'src/dashboard/StudentDashboard.jsx',
  'src/dashboard/ParentDashboard.jsx',
  'src/dashboard/AnalyticsDashboard.jsx',
  'src/dashboard/RevisionDashboard.jsx',
  'src/components/studyPlanner/StudyBlockItem.jsx'
].map(file => ({
  file,
  text: fs.readFileSync(path.join(root, file), 'utf8')
}));

const homeText = stageFiles.find(item => item.file.endsWith('HomeDashboard.jsx')).text;
const analyticsText = stageFiles.find(item => item.file.endsWith('AnalyticsDashboard.jsx')).text;
const parentText = stageFiles.find(item => item.file.endsWith('ParentDashboard.jsx')).text;
const studentText = stageFiles.find(item => item.file.endsWith('StudentDashboard.jsx')).text;
const revisionText = stageFiles.find(item => item.file.endsWith('RevisionDashboard.jsx')).text;
const studyBlockText = stageFiles.find(item => item.file.endsWith('StudyBlockItem.jsx')).text;
const appText = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const resumeStorageText = fs.readFileSync(path.join(root, 'src/utils/resumeStorage.js'), 'utf8');

assert(homeText.includes('formatResumeTitle('), 'HomeDashboard should use shared formatResumeTitle');
assert(homeText.includes('formatRecommendationCta('), 'HomeDashboard should use shared formatRecommendationCta');
assert(homeText.includes('Sambung lintas subjek'), 'HomeDashboard should show the canonical cross-subject resume badge');
assert(homeText.includes('recommendationUsesResume ? onResume()'), 'HomeDashboard recommendation CTA should genuinely resume when labelled as resume');

assert(analyticsText.includes('formatResumeTitle('), 'AnalyticsDashboard should use shared formatResumeTitle');
assert(analyticsText.includes('formatRecommendationCta('), 'AnalyticsDashboard should use shared formatRecommendationCta');

assert(parentText.includes('formatScopeLabel('), 'ParentDashboard should use shared formatScopeLabel');
assert(studentText.includes('formatScopeLabel('), 'StudentDashboard should use shared formatScopeLabel');
assert(homeText.includes('formatScopeLabel('), 'HomeDashboard should use shared formatScopeLabel');
assert(analyticsText.includes('formatScopeLabel('), 'AnalyticsDashboard should use shared formatScopeLabel');
assert(revisionText.includes('formatReviewQueueMeta('), 'RevisionDashboard should use shared formatReviewQueueMeta');
assert(studyBlockText.includes('formatPriority('), 'StudyBlockItem should use shared formatPriority');
assert(!studyBlockText.includes('.replace(/^Keutamaan'), 'StudyBlockItem should not rebuild priority labels manually');

for (const { file, text } of stageFiles) {
  assert(!/\b0s\b/.test(text), `${file} should not contain the old 0s label`);
}

assert(!/Keutamaan\s+\d+/.test(homeText), 'HomeDashboard should not contain raw numeric priority copy');
assert(!/Keutamaan\s+\d+/.test(parentText), 'ParentDashboard should not contain raw numeric priority copy');
assert(!/Keutamaan\s+\d+/.test(revisionText), 'RevisionDashboard should not contain raw numeric priority copy');

assert(resumeStorageText.includes("RESUME_KEY = 'jannati_v151_resume';"), 'Resume storage key should remain unchanged');
assert(appText.includes("const PROFILE_KEY = 'jannati_v151_profile';"), 'Profile storage key should remain unchanged');

if (failures.length) {
  console.error('Stage 7F labels/resume/CTA audit FAILED');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Stage 7F labels/resume/CTA audit PASS');
console.log(JSON.stringify(fixtureResults, null, 2));
