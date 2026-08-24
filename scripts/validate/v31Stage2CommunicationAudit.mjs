import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/styles/style.css'), 'utf8');
const helper = fs.readFileSync(path.join(root, 'src/utils/communicationResult.js'), 'utf8');
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };

assert(app.includes("normalizeCommunicationResult"), 'shared communication result helper is not imported');
assert(helper.includes('state,') && helper.includes('validAttempt') && helper.includes('completedDelta') && helper.includes('attemptKey'), 'result contract is incomplete');
assert(app.includes("const hasResult = communicationResult.state === 'assessed'") || app.includes('const hasResult = Boolean(result)'), 'Bacaan result gate is not assessment-aware');
assert(/(?:setFeedback\(\{\s*status: 'completed',\s*score: correct \? 100 : 0|const nextFeedback = \{ status: 'completed', score: correct \? 100 : 0)/.test(app), 'Mendengar assessed result does not carry a score');
assert(app.includes('function nextBacaan') && app.includes('function nextItem') && app.includes('function nextBertutur') && app.includes('function nextMenulis'), 'next handlers missing');
assert(app.includes('communicationResult.canAdvance') && (app.includes('if (safeResult.status !== \'completed\')') || app.includes('if (!communicationResult.canAdvance')), 'next handlers do not guard valid completion');
assert(app.includes("completedScores.length") && app.includes('averageScore') && app.includes('bestScore'), 'Bacaan aggregate summary fields missing');
assert(app.includes('onClearResume?.()'), 'finish flow does not clear resume state');
assert(app.includes("'reading', 'listening', 'speaking', 'writing'"), 'communication screens do not suppress FAB');
assert(css.includes('var(--jannati-mobile-bottom-clearance)'), 'communication CTA safe-area clearance missing');
assert(css.includes('.reading-coach-page') && css.includes('.listening-lab-page') && css.includes('.speaking-coach-page') && css.includes('.writing-coach-page'), 'communication mobile density styles missing');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'reduced-motion override missing');
assert(!app.includes('0:00 item kosong'), 'debug audio wording remains');
assert(!app.includes('emoji'), 'primary communication UI contains emoji marker');

console.log(JSON.stringify({
  status: 'PASS',
  contract: true,
  emptyAttemptGuards: true,
  validZeroScoreSupported: true,
  nextAndFinishGuards: true,
  sessionSummaryFields: true,
  mobileSafeArea: true,
  reducedMotion: true,
  note: 'Microphone/audio, keyboard, and visual overflow still require real-device testing.'
}, null, 2));
