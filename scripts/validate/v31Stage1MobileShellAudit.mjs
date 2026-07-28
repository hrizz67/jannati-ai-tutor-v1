import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/App.jsx');
const css = read('src/styles/style.css');

assert.match(app, /className="app-page-shell"/, 'global app-page-shell wrapper is required');
assert.match(css, /\.app-page-shell\s*\{[\s\S]*?width:\s*100%[\s\S]*?min-width:\s*0[\s\S]*?overflow-x:\s*clip/, 'page shell must prevent horizontal overflow');
assert.match(css, /env\(safe-area-inset-top/, 'safe-area top token is required');
assert.match(css, /env\(safe-area-inset-bottom/, 'safe-area bottom token is required');
assert.match(css, /--jannati-mobile-bottom-clearance/, 'mobile bottom clearance token is required');

const switcherRule = css.match(/\.subject-quick-switch-shell\s*\{([\s\S]*?)\}/)?.[1] || '';
assert.doesNotMatch(switcherRule, /position:\s*fixed|position:\s*absolute/, 'subject switcher cannot be an overlay');
assert.doesNotMatch(switcherRule, /(?:margin|top|transform)\s*:\s*-[^;]+/, 'subject switcher cannot use negative layout offsets');
assert.match(css, /\.subject-quick-switch-shell\s*\{[\s\S]*?top:\s*calc\([^;]*safe-area-inset-top/, 'switcher must use safe-area-aware sticky offset');
assert.match(css, /\.subject-quick-switch-shell\.compact/, 'compact sticky state contract is required');
assert.match(css, /\.subject-quick-pill-text\s*\{[\s\S]*?text-overflow:\s*ellipsis/, 'subject labels must truncate safely');
assert.match(css, /\.subject-switch-arrow\s*\{[\s\S]*?min-width:\s*44px/, 'switcher arrows need 44px targets');

assert.equal((app.match(/<BetaFeedbackButton\b/g) || []).length, 1, 'exactly one feedback entry point is expected');
assert.match(app, /function BetaChrome\(\{ children, recoveryMessages = \[\], modalOpen = false, currentScreen = '' \}\)/, 'BetaChrome must receive the resolved screen explicitly');
assert.match(app, /BetaFeedbackButton suppressed=\{feedbackSuppressed\}/, 'feedback FAB must be suppressed through a shared resolved flag');
assert.match(app, /const feedbackSuppressed = modalOpen \|\| \['quiz', 'uasa', 'reading', 'listening', 'speaking', 'writing', 'finish', 'parent'\]\.includes\(currentScreen\);/, 'protected flow suppression list must remain');
assert.match(css, /\.beta-feedback-fab\s*\{[\s\S]*?bottom:\s*calc\(88px\s*\+\s*env\(safe-area-inset-bottom/, 'FAB must use bottom safe-area clearance');
assert.match(css, /@media print[\s\S]*?\.beta-feedback-fab[\s\S]*?display:\s*none/, 'print must hide feedback FAB');

assert.match(app, /<footer className="app-version-footer"/, 'footer must remain in document flow');
assert.doesNotMatch(app, /app-version-footer[\s\S]{0,500}position:\s*fixed/, 'footer cannot be fixed');
assert.doesNotMatch(app, /Butang beta tersedia/, 'footer feedback copy must not return');
assert.doesNotMatch(app, /app-version-footer[\s\S]{0,500}beta-feedback-fab/, 'footer must not contain feedback control');
assert.match(css, /\.app-version-footer\s*\{[\s\S]*?padding-bottom:\s*calc\([^;]*safe-area-inset-bottom/, 'footer needs safe-area padding');

const zIndex = ['--z-content', '--z-sticky', '--z-fab', '--z-dropdown', '--z-modal-backdrop', '--z-modal', '--z-toast'];
for (const token of zIndex) assert.match(css, new RegExp(`${token}:\\s*\\d+`), `missing z-index token ${token}`);
const zValues = zIndex.map(token => Number(css.match(new RegExp(`${token}:\\s*(\\d+)`))?.[1]));
assert.ok(zValues.every((value, index) => index === 0 || value > zValues[index - 1]), 'z-index scale must be strictly ordered');

assert.doesNotMatch(css, /@media\s*\([^)]*max-width[^)]*\)[\s\S]*?\.app-page-shell[\s\S]*?100vw/, 'mobile app shell must not use 100vw');
assert.match(css, /@media\s*\(max-width:\s*650px\)[\s\S]*?button\s*\{[\s\S]*?min-height:\s*44px|button\s*\{[\s\S]*?min-height:\s*44px/, 'primary touch targets must remain at least 44px');

console.log(JSON.stringify({
  status: 'PASS',
  pageShell: true,
  safeArea: true,
  subjectSwitcher: { inFlow: true, safeAreaOffset: true, protectedFlowSuppression: true },
  feedbackEntryPoints: 1,
  footer: { compact: true, feedbackFree: true, safeArea: true },
  zIndexScale: zIndex.reduce((output, token, index) => ({ ...output, [token]: zValues[index] }), {}),
  horizontalOverflowGuard: true,
  touchTargets: '44px'
}, null, 2));
