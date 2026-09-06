import assert from 'node:assert/strict';
import fs from 'node:fs';
import './loginHydrationRegression.mjs';

function read(path) {
  return fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
}

const app = read('src/App.jsx');
const main = read('src/main.jsx');
const serviceWorker = read('public/service-worker.js');
const modalRuntime = read('src/components/ai/modalRuntime.js');
const interactive = read('src/components/questions/InteractiveQuestionEngine.jsx');
const subjectLanguage = read('src/components/SubjectLanguageText.jsx');
const studentDashboard = read('src/dashboard/StudentDashboard.jsx');
const styles = read('src/styles/style.css');
const finishStyles = read('src/styles/features/finish-screen.css');

assert.match(app, /usePremiumAccess\(\{ accountUser, accessProfile \}\)/, 'Premium access must use its dedicated hook.');
assert.doesNotMatch(main, /service-worker\.js\?v=\d+/, 'Service worker registration must not contain a manual version.');
assert.match(main, /registerAppServiceWorker/, 'Main entry must use the service worker registration service.');
assert.match(serviceWorker, /new URL\(self\.location\.href\)\.searchParams\.get\('v'\)/, 'Cache namespace must derive from the app version.');
assert.doesNotMatch(serviceWorker, /device-v\d+/, 'Service worker cache must not use a hand-maintained suffix.');
assert.match(serviceWorker, /key\.startsWith\(CACHE_PREFIX\) && key !== CACHE_NAME/, 'Cache cleanup must not delete unrelated origin caches.');
assert.match(modalRuntime, /event\.key !== 'Tab'/, 'AI modals must retain a keyboard focus trap.');
assert.match(interactive, /Gerakkan \$\{item\?\.label\} ke atas/, 'Vertical ordering controls must say ke atas.');
assert.match(interactive, /Gerakkan \$\{item\?\.label\} ke bawah/, 'Vertical ordering controls must say ke bawah.');
assert.match(subjectLanguage, /lang="ar" dir="rtl"/, 'Arabic runs must retain explicit language and direction semantics.');
assert.match(studentDashboard, /role="progressbar"[\s\S]{0,220}aria-valuenow=\{summaryAccuracy\}/, 'Student progress must expose numeric semantics.');
assert.doesNotMatch(styles, /\.finish\.reward-card/, 'Finish-screen styles should leave the global stylesheet.');
assert.match(finishStyles, /\.finish\.reward-card/, 'Finish-screen styles must remain available after extraction.');

console.log('Architecture hardening regression: PASS');
