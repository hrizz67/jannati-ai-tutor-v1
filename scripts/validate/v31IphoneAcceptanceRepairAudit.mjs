import fs from 'node:fs';
import assert from 'node:assert/strict';
import { smartCheck } from '../../src/utils/smartCheck.js';
import { createCanonicalProgress } from '../../src/utils/canonicalProgress.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const css = fs.readFileSync('src/styles/style.css', 'utf8');
const formatter = fs.readFileSync('src/utils/displayFormatter.js', 'utf8');
const home = fs.readFileSync('src/dashboard/HomeDashboard.jsx', 'utf8');

assert.match(app, /function BetaChrome\(\{ children, recoveryMessages = \[\], modalOpen = false, currentScreen = '' \}\)/);
assert.match(app, /BetaFeedbackButton suppressed=\{feedbackSuppressed\}/);
assert.match(app, /const feedbackSuppressed = modalOpen \|\| \['quiz', 'uasa', 'reading', 'listening', 'speaking', 'writing', 'finish', 'parent'\]\.includes\(currentScreen\);/);
assert.match(css, /env\(safe-area-inset-top/);
assert.match(css, /env\(safe-area-inset-bottom/);
assert.match(css, /beta-feedback-fab/);
assert.match(app, /(?:hasResult = Boolean\(result && result\.status === 'completed'\)|hasResult = communicationResult\.state === 'assessed'|hasResult = Boolean\(result\))/);
assert.match(app, /Belum ada percubaan yang sah/);
assert.match(app, /if \(!currentAnswer\(\)\.trim\(\)\)/);
assert.match(app, /function nextBertutur\(\) \{\s*if \((?:!safeTranscript|!communicationResult\.canAdvance)/);
assert.match(app, /function nextMenulis\(\) \{\s*if \((?:!safeResult|!communicationResult\.canAdvance|!currentAnswer\(\)\.trim\(\))/);
assert.match(app, /sourceQuestionId/);
assert.match(formatter, /kata_adjektif|penjodoh_bilangan/);
assert.match(home, /Data liputan kurikulum belum tersedia untuk subjek ini/);
assert.match(app, /Hak Cipta.*Jannati AI Tutor/);
assert.doesNotMatch(app, /Butang beta tersedia/);
assert.match(css, /@media print[\s\S]*beta-feedback-fab[\s\S]*display: none/);
assert.match(app, /subjectId: snapshot\.subjectId/);
assert.match(app, /topicId: snapshot\.topicId/);
assert.equal((app.match(/communication-hero-icon/g) || []).length, 4, 'all communication heroes must use the shared SVG container');
assert.doesNotMatch(app, /<div className="bot medium">[📚🗣️]/, 'communication hero emoji must not remain');

const uasa = { answer: 'ayat tanya', acceptedAnswers: ['Ayat Tanya'] };
for (const answer of ['ayat tanya', 'Ayat Tanya', ' AYAT TANYA ']) assert.equal(smartCheck(answer, uasa).status, 'correct');
const progress = createCanonicalProgress({ streak: 3, bestStreak: 0 });
assert.ok(progress.global.streakBest >= progress.global.streakCurrent);

console.log(JSON.stringify({
  status: 'PASS',
  acceptedAnswers: true,
  emptyAttemptGuards: true,
  feedbackSuppression: true,
  safeAreaRules: true,
  canonicalStreak: { current: progress.global.streakCurrent, best: progress.global.streakBest }
}, null, 2));
