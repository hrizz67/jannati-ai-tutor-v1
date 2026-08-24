import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/App.jsx');
const css = read('src/styles/style.css');
const icons = read('src/components/IconGlyph.jsx');
const voiceButton = read('src/components/VoiceButton.jsx');
const packageJson = read('package.json');
const packageLock = fs.existsSync(path.join(root, 'package-lock.json')) ? read('package-lock.json') : '';

const diffNames = execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/)
  .map(value => value.trim())
  .filter(Boolean);

const protectedPathPatterns = [
  /^src\/data\/subjects\//,
  /^src\/ai\/adaptive\//,
  /^src\/ai\/question/,
  /scoring/i,
  /questionBank/i
];

const allowedNonVisualHotfixes = new Set([
  'src/ai/adaptive/adaptiveController.js'
]);

const protectedChanges = diffNames.filter(
  file =>
    protectedPathPatterns.some(pattern => pattern.test(file)) &&
    !allowedNonVisualHotfixes.has(file)
);
assert.deepEqual(protectedChanges, [], `visual pass touched protected files: ${protectedChanges.join(', ')}`);
assert.ok(!diffNames.includes('package.json'), 'visual pass must not change package.json');
assert.ok(!diffNames.includes('package-lock.json'), 'visual pass must not change package-lock.json');
assert.doesNotMatch(packageJson + packageLock, /framer-motion|lottie|lucide|fontawesome/i, 'no new animation or icon dependency');

for (const handler of [
  'startTopic',
  'startResume',
  'restartResume',
  'finishBacaan',
  'finishMendengar',
  'finishBertutur',
  'finishMenulis',
  'openExplain',
  'openTeacher'
]) {
  assert.match(app, new RegExp(`function\\s+${handler}\\b|const\\s+${handler}\\s*=`), `workflow handler ${handler} must remain`);
}

for (const screen of ['dashboard', 'quiz', 'uasa', 'reading', 'listening', 'speaking', 'writing', 'parent']) {
  assert.match(app, new RegExp(`['"]${screen}['"]`), `route/screen id ${screen} must remain`);
}

assert.match(app, /getAcceptedAnswers\(/, 'shared accepted-answer resolver must remain in runtime');
assert.match(app, /(?:hasResult = Boolean\(result && result\.status === 'completed'\)|hasResult = communicationResult\.state === 'assessed'|hasResult = Boolean\(result\))/, 'empty Bacaan attempts must remain guarded');
assert.match(app, /function nextBertutur\(\) \{\s*if \((?:!safeTranscript|!communicationResult\.canAdvance)/, 'Bertutur next guard must remain');
assert.match(app, /function nextMenulis\(\) \{\s*if \((?:!safeResult|!communicationResult\.canAdvance|!currentAnswer\(\)\.trim\(\))/, 'Menulis next guard must remain');
assert.match(app, /subjectId: snapshot\.subjectId/, 'coach snapshot subject contract must remain');
assert.match(app, /topicId: snapshot\.topicId/, 'coach snapshot topic contract must remain');

const sourceDiff = execFileSync('git', ['diff', '-U0', '--', 'src'], { cwd: root, encoding: 'utf8' });
const storageContractChanges = sourceDiff
  .split(/\r?\n/)
  .filter(line => /^[+-](?![+-])/.test(line) && /localStorage|STORAGE_KEY|storageKey/.test(line));
assert.deepEqual(storageContractChanges, [], 'visual pass must not change localStorage contracts');

const primaryUiSources = [
  app,
  read('src/dashboard/HomeDashboard.jsx'),
  read('src/dashboard/StudentDashboard.jsx'),
  read('src/dashboard/ParentDashboard.jsx'),
  read('src/dashboard/AnalyticsDashboard.jsx'),
  voiceButton
].join('\n');
const primaryEmoji = primaryUiSources.match(/[\u{1F300}-\u{1FAFF}]/gu) || [];
assert.ok(primaryEmoji.length <= 1, `primary UI emoji count increased: ${primaryEmoji.length}`);

for (const token of [
  '--jannati-radius-sm',
  '--jannati-radius-md',
  '--jannati-radius-lg',
  '--jannati-shadow-soft',
  '--jannati-shadow-raised',
  '--jannati-border-soft',
  '--jannati-surface',
  '--jannati-surface-muted',
  '--jannati-focus-ring',
  '--jannati-transition-fast',
  '--jannati-transition-normal'
]) {
  assert.ok(css.includes(token), `missing premium design token ${token}`);
}

for (const iconName of [
  'home', 'dashboard', 'chart', 'revision', 'family', 'settings', 'back', 'next', 'close',
  'play', 'pause', 'mic', 'headphones', 'pen', 'bookOpen', 'lightbulb', 'teacher',
  'explain', 'repeat', 'check', 'print', 'download', 'clock', 'fire', 'star', 'trophy',
  'progress', 'lock', 'unlock', 'volume'
]) {
  assert.match(icons, new RegExp(`\\b${iconName}:`), `missing shared icon ${iconName}`);
}

assert.match(voiceButton, /<IconGlyph name="volume"/, 'VoiceButton must use shared IconGlyph');
assert.match(css, /button\s*\{[\s\S]*?min-height:\s*44px/, 'button touch target rule must be at least 44px');
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, 'reduced-motion override must remain');
assert.match(css, /@media print[\s\S]*?box-shadow:\s*none\s*!important/, 'print must remove decorative shadows');
assert.match(css, /@media print[\s\S]*?beta-feedback-fab[\s\S]*?display:\s*none\s*!important/, 'print must hide interactive overlays');

const assetDirectory = path.join(root, 'dist', 'assets');
const mainBundles = fs.existsSync(assetDirectory)
  ? fs.readdirSync(assetDirectory)
    .filter(name => /^index-[\w-]+\.js$/.test(name))
    .map(name => ({ name, size: fs.statSync(path.join(assetDirectory, name)).size, mtime: fs.statSync(path.join(assetDirectory, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  : [];
const latestBundle = mainBundles[0] || null;
const baselineBytes = Math.round(700.57 * 1024);
const limitBytes = baselineBytes + (25 * 1024);
if (latestBundle) {
  assert.ok(latestBundle.size <= limitBytes, `main bundle ${latestBundle.size} exceeds visual budget ${limitBytes}`);
}

console.log(JSON.stringify({
  status: 'PASS',
  protectedWorkflowFilesChanged: protectedChanges,
  packageDependencyChanges: false,
  sharedIconSystem: true,
  primaryUiEmojiCount: primaryEmoji.length,
  reducedMotion: true,
  touchTargetRule: '44px',
  printSafety: true,
  bundle: latestBundle ? {
    file: latestBundle.name,
    bytes: latestBundle.size,
    limitBytes,
    withinBudget: latestBundle.size <= limitBytes
  } : { file: null, note: 'Run npm run build for bundle measurement.' }
}, null, 2));
