import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const app = read('src/App.jsx');
const css = read('src/styles/style.css');
const home = read('src/dashboard/HomeDashboard.jsx');
const student = read('src/dashboard/StudentDashboard.jsx');
const parent = read('src/dashboard/ParentDashboard.jsx');
const analytics = read('src/dashboard/AnalyticsDashboard.jsx');
const revision = read('src/dashboard/RevisionDashboard.jsx');
const weeklyPlan = read('src/components/studyPlanner/WeeklyPlanList.jsx');
const explainModal = read('src/components/ai/AIExplainModal.jsx');
const teacherModal = read('src/components/ai/AITeacherModal.jsx');
const packageJson = read('package.json');
const packageLockPath = path.join(root, 'package-lock.json');
const packageLock = fs.existsSync(packageLockPath) ? fs.readFileSync(packageLockPath, 'utf8') : '';

const surfaces = { app, home, student, parent, analytics, revision, weeklyPlan, explainModal, teacherModal };
const diffNames = execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/)
  .map(value => value.trim())
  .filter(Boolean);
const sourceDiff = execFileSync('git', ['diff', '-U0', '--', 'src', 'package.json', 'package-lock.json'], { cwd: root, encoding: 'utf8' });

for (const validatorFile of [
  'scripts/validate/v31CoachContextIconAudit.mjs',
  'scripts/validate/v3CoachPayloadAudit.mjs',
  'scripts/validate/communicationModulesAudit.mjs',
  'scripts/validate/audioContentAudit.mjs',
  'scripts/validate/v31IphoneAcceptanceRepairAudit.mjs',
  'scripts/validate/v31VisualWowSafetyAudit.mjs',
  'scripts/validate/v31Stage1MobileShellAudit.mjs',
  'scripts/validate/v31Stage2CommunicationAudit.mjs',
  'scripts/validate/v31Stage3CoachUasaAudit.mjs',
  'scripts/validate/v31Stage4DashboardAnalyticsAudit.mjs',
  'scripts/validate/v31Stage5PlanningLabelsAudit.mjs'
]) {
  assert.ok(fs.existsSync(path.join(root, validatorFile)), `Missing prerequisite validator: ${validatorFile}`);
}

assert.equal((app.match(/<BetaFeedbackButton\b/g) || []).length, 1, 'duplicate feedback entry detected');
assert.doesNotMatch([app, home, student, parent, analytics].join('\n'), /<div className="bot|[🌟👍📘🔥🏆🎯🎖️]/u, 'primary hero/action emoji must not remain');

for (const source of Object.values(surfaces)) {
  assert.doesNotMatch(source, /Starter Plan|AI:\s*Rendah|30 Masa|Ya Pengganti|Tidak Starter Plan/, 'raw Stage 5 label leaked');
  assert.doesNotMatch(source, /Ã¢â‚¬â€|Ã¢â‚¬Å“|Ã¢â‚¬|Â·|â€¢/, 'mojibake leaked into runtime source');
}

assert.ok(home.includes('canonicalAnalytics.scopeLabel'), 'Home must use canonical analytics');
assert.ok(student.includes('analytics.scopeLabel'), 'Student must use canonical analytics');
assert.ok(parent.includes('canonicalAnalytics.scopeLabel'), 'Parent must use canonical analytics');
assert.ok(analytics.includes('canonicalAnalytics.scopeLabel'), 'Analytics must use canonical analytics');

assert.ok(home.includes('smartCrossSubject && <span className="badge cross-subject-badge">Cadangan lintas subjek</span>'), 'cross-subject badge guard missing');
const startAdaptiveLessonMatch = app.match(/async function startAdaptiveLesson\(recommendation\) \{[\s\S]*?async function startAdaptivePractice/);
assert.ok(startAdaptiveLessonMatch, 'startAdaptiveLesson block missing');
assert.ok(/syncSelectedSubjectState\(subject\);[\s\S]*startTopic\(topic, subject/.test(startAdaptiveLessonMatch[0]), 'cross-subject CTA ordering incorrect');

assert.ok(app.includes('if (result) return;'), 'UASA duplicate guard missing');
assert.ok(app.includes('disabled={!result}'), 'UASA next-disabled guard missing');
assert.ok(app.includes('aria-live="polite"'), 'UASA polite live region missing');

assert.ok(
  app.includes("const hasResult = communicationResult.state === 'assessed'")
  || app.includes('const hasResult = Boolean(result)'),
  'communication assessed-result guard missing'
);
assert.ok(app.includes('if (!currentAnswer().trim())'), 'manual empty-attempt guard missing');
assert.ok(app.includes('function nextBertutur() {') && app.includes('!communicationResult.canAdvance'), 'speaking next guard missing');
assert.ok(app.includes('function nextMenulis() {') && app.includes('!communicationResult.canAdvance'), 'writing next guard missing');

assert.ok(app.includes('subjectId: snapshot.subjectId') && app.includes('topicId: snapshot.topicId'), 'coach snapshot contract missing');
assert.ok(app.includes("isCurrentCoachResponse(snapshot, nextData, 'explain')"), 'explain stale-response protection missing');
assert.ok(app.includes("isCurrentCoachResponse(snapshot, nextData, 'teach')"), 'teach stale-response protection missing');

assert.ok(!parent.includes('formatRelativeTiming('), 'duplicate overdue text helper still present');
assert.ok(revision.includes('formatReviewQueueMeta(topic)'), 'review queue compact formatter missing');

assert.match(css, /@media print[\s\S]*beta-feedback-fab[\s\S]*display:\s*none!important/, 'print must hide feedback FAB');
assert.match(css, /@media print[\s\S]*subject-quick-switch-shell[\s\S]*display:\s*none!important/, 'print must hide subject switcher');
assert.match(css, /@media print[\s\S]*button\{display:none!important\}|@media print[\s\S]*button\s*\{[\s\S]*display:\s*none!important/, 'print must hide interactive controls');
assert.match(css, /@media print[\s\S]*box-shadow:\s*none!important/, 'print must remove decorative shadows');
assert.match(css, /break-inside:\s*avoid|page-break-inside:\s*avoid/, 'print must avoid card splitting');

assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/, 'reduced-motion support missing');
assert.match(weeklyPlan, /aria-expanded=\{expanded\}/, 'weekly plan aria-expanded missing');
assert.match(explainModal, /role="dialog"/, 'Explain modal dialog semantics missing');
assert.match(teacherModal, /role="dialog"/, 'Teacher modal dialog semantics missing');
assert.match(explainModal, /aria-label="Tutup"/, 'Explain modal close label missing');
assert.match(teacherModal, /aria-label="Tutup"/, 'Teacher modal close label missing');

assert.ok(!diffNames.includes('package-lock.json'), 'new runtime dependency lockfile change detected');
if (diffNames.includes('package.json')) {
  const baselinePackage = JSON.parse(execFileSync('git', ['show', 'HEAD:package.json'], { cwd: root, encoding: 'utf8' }));
  const currentPackage = JSON.parse(packageJson);
  assert.deepEqual(currentPackage.dependencies, baselinePackage.dependencies, 'runtime dependencies changed');
  assert.deepEqual(currentPackage.devDependencies, baselinePackage.devDependencies, 'development dependencies changed');
}
assert.doesNotMatch(packageJson + packageLock, /framer-motion|lottie|lucide|fontawesome/i, 'unexpected runtime dependency present');

for (const screenId of ['dashboard', 'quiz', 'uasa', 'reading', 'listening', 'speaking', 'writing', 'parent', 'finish']) {
  assert.match(app, new RegExp(`['"]${screenId}['"]`), `route id missing: ${screenId}`);
}

const storageKeyChanges = sourceDiff
  .split(/\r?\n/)
  .filter(line => /^[+-](?![+-])/.test(line))
  .filter(line => /localStorage|STORAGE_KEY|storageKey|resumeKey/i.test(line));
assert.deepEqual(storageKeyChanges, [], 'localStorage/storage key contract changed during Stage 6 window');

console.log(JSON.stringify({
  status: 'PASS',
  validatorsPresent: true,
  rawLabelsCleared: true,
  mojibakeFree: true,
  duplicateFeedbackEntry: false,
  printSafety: true,
  reducedMotion: true,
  noRuntimeDependencyChange: true
}, null, 2));
