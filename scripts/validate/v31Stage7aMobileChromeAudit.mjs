import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const appSource = read('src/App.jsx');
const homeSource = read('src/dashboard/HomeDashboard.jsx');
const styleSource = read('src/styles/style.css');

const subjectSwitcherMatches = homeSource.match(/subject-quick-switch-shell/g) || [];
assert.equal(subjectSwitcherMatches.length, 1, 'Expected exactly one subject switcher shell render in HomeDashboard.');

const mobileStart = styleSource.lastIndexOf('@media (max-width: 650px) {');
const printStart = styleSource.indexOf('@media print {', mobileStart);
assert.ok(mobileStart >= 0 && printStart > mobileStart, 'Expected a dedicated <=650px mobile shell block.');
const mobileMediaBlock = styleSource.slice(mobileStart, printStart);

assert.ok(mobileMediaBlock.includes('.subject-quick-switch-shell {') && mobileMediaBlock.includes('position: relative;') && mobileMediaBlock.includes('top: auto;'), 'Mobile subject switcher must not remain sticky/fixed.');
const mobileSwitcherSlice = mobileMediaBlock.slice(mobileMediaBlock.indexOf('.subject-quick-switch-shell {'), mobileMediaBlock.indexOf('.subject-quick-switch {'));
assert.ok(!mobileSwitcherSlice.includes('position: fixed;'), 'Mobile subject switcher must not be fixed.');
assert.ok(!mobileSwitcherSlice.includes('position: sticky;'), 'Mobile subject switcher must not remain sticky.');
assert.ok(!/top:\s*-/.test(mobileMediaBlock) && !/margin-(?:top|bottom|inline|left|right):\s*-/.test(mobileMediaBlock), 'Mobile shell block contains a negative offset.');
assert.ok(/--jannati-safe-top:\s*max\(12px,\s*env\(safe-area-inset-top,\s*0px\)\);/.test(styleSource), 'Safe-area top token missing.');
assert.ok(/--jannati-mobile-browser-bottom-clearance:\s*calc\(env\(safe-area-inset-bottom,\s*0px\)\s*\+\s*88px\);/.test(styleSource), 'Safe-area bottom clearance token missing.');
assert.ok(/100dvh/.test(styleSource), 'Expected 100dvh support for mobile overlays or flows.');
assert.ok(/\.beta-feedback-fab\s*\{[\s\S]*?width:\s*50px;[\s\S]*?height:\s*50px;/.test(mobileMediaBlock), 'Mobile FAB is not compact/icon-only sized.');
assert.ok(/\.beta-feedback-fab > span\s*\{[\s\S]*?clip:\s*rect\(0,\s*0,\s*0,\s*0\);/.test(mobileMediaBlock), 'Mobile FAB text is not visually suppressed.');
assert.ok(/aria-label="Maklum Balas Beta"/.test(appSource), 'Feedback FAB accessible label is missing or incorrect.');
assert.ok(/function BetaChrome\(\{ children, recoveryMessages = \[\], modalOpen = false, currentScreen = '' \}\)/.test(appSource), 'BetaChrome must accept the current screen explicitly.');
assert.ok(/const feedbackSuppressed = modalOpen \|\| \['quiz', 'uasa', 'reading', 'listening', 'speaking', 'writing', 'finish', 'parent'\]\.includes\(currentScreen\);/.test(appSource), 'Feedback FAB suppression rules are incomplete.');
assert.ok(/className="app-page-shell" data-screen=\{currentScreen\}/.test(appSource), 'Page shell must expose the current screen for mobile audit/debugging.');
assert.ok(/@media print\{[\s\S]*?\.beta-feedback-fab[\s\S]*?display:none!important/.test(styleSource), 'Print suppression for the FAB is missing.');
assert.ok(/--z-fab:\s*45;/.test(styleSource) && /--z-modal:\s*80;/.test(styleSource), 'Expected z-index scale tokens are missing.');
assert.ok((Number((styleSource.match(/100vw/g) || []).length) || 0) === 0, 'Found 100vw usage that risks mobile overflow.');
assert.ok(!/(iPhone\s*(?:SE|11|12|13|14|15|16)|dynamic-island|notch-offset|iphone-offset)/i.test(styleSource), 'Found hardcoded iPhone-model-specific offsets in CSS.');
assert.ok(/\.app-version-footer\s*\{[\s\S]*?position:\s*relative;/.test(styleSource), 'Footer must remain in document flow.');

const result = {
  status: 'PASS',
  checks: {
    subjectSwitcherInstances: subjectSwitcherMatches.length,
    mobileSwitcherNotSticky: true,
    mobileSwitcherNoNegativeOffset: true,
    safeAreaTopToken: true,
    safeAreaBottomToken: true,
    uses100dvh: true,
    mobileFabIconOnly: true,
    fabAccessibleLabel: true,
    fabSuppressionRules: true,
    fabBelowModal: true,
    footerInFlow: true,
    no100vwOverflowPattern: true,
    noHardcodedIphoneOffsets: true
  }
};

console.log(JSON.stringify(result, null, 2));
