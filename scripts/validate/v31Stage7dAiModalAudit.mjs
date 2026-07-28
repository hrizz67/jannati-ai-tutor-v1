import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { __TEST_ONLY__ as modalRuntimeTest } from '../../src/components/ai/modalRuntime.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function indexOfOrThrow(text, search, label) {
  const index = text.indexOf(search);
  assert(index >= 0, `${label}: missing "${search}"`);
  return index;
}

const app = read('src/App.jsx');
const tutor = read('src/components/ai/TutorAIModal.jsx');
const explain = read('src/components/ai/AIExplainModal.jsx');
const teacher = read('src/components/ai/AITeacherModal.jsx');
const modalRuntime = read('src/components/ai/modalRuntime.js');
const styles = read('src/styles/style.css');
const harnessHtml = read('artifacts/stage7d/modal-audit.html');
const harnessJs = read('artifacts/stage7d/modal-audit.js');

const originalWindow = global.window;
const originalDocument = global.document;
const scrollCalls = [];
const focusTargets = [];
const fakeBodyStyles = { overflow: 'auto', position: '', top: '', width: '' };
global.window = {
  scrollY: 180,
  pageYOffset: 180,
  scrollTo: (...args) => scrollCalls.push(args),
  getComputedStyle: () => ({ display: 'block', visibility: 'visible' })
};
global.document = {
  body: { style: fakeBodyStyles }
};

const releaseFirst = modalRuntimeTest.lockBodyScroll();
assert.equal(fakeBodyStyles.overflow, 'hidden', 'Body lock must switch overflow to hidden on first open.');
assert.equal(fakeBodyStyles.position, 'fixed', 'Body lock must fix body position on first open.');
assert.equal(fakeBodyStyles.top, '-180px', 'Body lock must preserve current scroll offset in top style.');
assert.equal(modalRuntimeTest.getActiveModalCount(), 1, 'Body lock must track one active modal after first open.');

const releaseSecond = modalRuntimeTest.lockBodyScroll();
assert.equal(modalRuntimeTest.getActiveModalCount(), 2, 'Body lock must support nested open cycles.');
releaseSecond();
assert.equal(modalRuntimeTest.getActiveModalCount(), 1, 'Closing one modal must preserve the remaining body lock.');
assert.equal(fakeBodyStyles.position, 'fixed', 'Closing one of multiple modals must not restore body styles early.');
releaseFirst();
assert.equal(modalRuntimeTest.getActiveModalCount(), 0, 'Closing the final modal must release the body lock.');
assert.equal(fakeBodyStyles.overflow, 'auto', 'Body lock must restore original overflow after final close.');
assert.deepEqual(scrollCalls.at(-1), [0, 180], 'Body lock must restore scroll position after the final close.');

const focusableA = { tagName: 'BUTTON', focus: () => focusTargets.push('a') };
const focusableB = { tagName: 'BUTTON', focus: () => focusTargets.push('b') };
const fakeContainer = {
  querySelectorAll: () => [focusableA, focusableB]
};
assert.equal(modalRuntimeTest.getFocusableElements(fakeContainer).length, 2, 'Focusable-element scan must return visible focus targets.');

global.window = originalWindow;
global.document = originalDocument;

assert(app.includes("const modalOpen = chatOpen || explainOpen || teacherOpen;"), 'App must keep shared modalOpen state across Tutor, Explain, and Teach.');
assert(app.includes('data-modal-open={modalOpen ? \'true\' : \'false\'}'), 'BetaChrome must expose modal-open state on app-chrome-shell.');
assert(app.includes('aria-hidden={modalOpen ? \'true\' : undefined}'), 'Background shell must be aria-hidden while any AI modal is open.');
assert(app.includes('const feedbackSuppressed = modalOpen ||'), 'Feedback FAB suppression must still depend on shared modalOpen.');

for (const [label, source] of [['Tutor', tutor], ['Explain', explain], ['Teacher', teacher]]) {
  assert(source.includes('renderModalPortal('), `${label}: modal must render through a portal.`);
  assert(source.includes('useModalRuntime({'), `${label}: modal must use shared modal runtime hook.`);
  assert(source.includes('role="dialog"'), `${label}: modal section must expose role=dialog.`);
  assert(source.includes('aria-modal="true"'), `${label}: modal section must expose aria-modal=true.`);
  assert(source.includes('aria-label="Tutup"'), `${label}: close button must expose aria-label.`);
  assert(source.includes('data-modal-footer="true"'), `${label}: footer must be explicitly marked for audit.`);
}

assert(modalRuntime.includes('document.body.style.position = \'fixed\''), 'Shared modal runtime must fix body position during scroll lock.');
assert(modalRuntime.includes('window.scrollTo(0, bodyLockSnapshot.scrollY);'), 'Shared modal runtime must restore scroll position on close.');
assert(modalRuntime.includes('event.key === \'Escape\''), 'Shared modal runtime must support Escape close.');
assert(modalRuntime.includes('event.key !== \'Tab\''), 'Shared modal runtime must explicitly handle Tab focus trapping.');
assert(modalRuntime.includes('event.shiftKey && activeElement === first'), 'Shared modal runtime must wrap Shift+Tab from the first focusable.');
assert(modalRuntime.includes('!event.shiftKey && activeElement === last'), 'Shared modal runtime must wrap Tab from the last focusable.');
assert(modalRuntime.includes('restoreFocusRef.current?.focus?.();'), 'Shared modal runtime must restore focus on cleanup.');
assert(modalRuntime.includes('activeModalCount'), 'Shared modal runtime must coordinate multiple modal instances safely.');

const tutorBodyIndex = indexOfOrThrow(tutor, 'className="ai-chat-body"', 'Tutor');
const tutorFooterIndex = indexOfOrThrow(tutor, 'className="ai-chat-input ai-modal-footer"', 'Tutor');
assert(tutorBodyIndex < tutorFooterIndex, 'Tutor: body must render before footer.');
const tutorActionIndex = indexOfOrThrow(tutor, 'className="tutor-ai-actions"', 'Tutor');
assert(tutorBodyIndex < tutorActionIndex && tutorActionIndex < tutorFooterIndex, 'Tutor: question help block must stay inside the scroll body, above the footer.');
assert(!tutor.includes('autoFocus'), 'Tutor: autoFocus must be removed to avoid forced mobile keyboard jumps.');
assert(tutor.includes('className="ai-chat-context-card"'), 'Tutor: question-specific context card must render inside the modal body.');

assert(explain.includes('id="ai-explain-title"'), 'Explain: heading must provide a labelledby target.');
assert(explain.includes('id="ai-explain-description"'), 'Explain: description must provide a describedby target.');
assert(teacher.includes('id="ai-teacher-title"'), 'Teacher: heading must provide a labelledby target.');
assert(teacher.includes('id="ai-teacher-description"'), 'Teacher: description must provide a describedby target.');
assert.equal((tutor.match(/role="dialog"/g) || []).length, 1, 'Tutor must render exactly one dialog role.');
assert.equal((explain.match(/role="dialog"/g) || []).length, 1, 'Explain must render exactly one dialog role.');
assert.equal((teacher.match(/role="dialog"/g) || []).length, 1, 'Teacher must render exactly one dialog role.');
assert.equal((tutor.match(/className="ai-chat-overlay"/g) || []).length, 1, 'Tutor must render exactly one backdrop.');
assert.equal((explain.match(/className="ai-explain-overlay"/g) || []).length, 1, 'Explain must render exactly one backdrop.');
assert.equal((teacher.match(/className="ai-explain-overlay"/g) || []).length, 1, 'Teacher must render exactly one backdrop.');

assert(styles.includes('.app-chrome-shell[data-modal-open="true"]'), 'Styles must disable background interaction while a modal is open.');
assert(app.includes('inert={modalOpen ? \'\' : undefined}'), 'Background shell must become inert while a modal is open.');
assert(styles.includes('max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 16px);'), 'Mobile modal styles must clamp height against 100dvh safe area.');
assert(/padding:\s*calc\(12px \+ env\(safe-area-inset-top, 0px\)\)/.test(styles), 'Modal overlay must include safe-area aware padding.');
assert(styles.includes('.ai-chat-input,\n+.ai-explain-footer,\n+.ai-teacher-footer'.replace(/\+/g, '')) || styles.includes('.ai-chat-input,\n.ai-explain-footer,\n.ai-teacher-footer'), 'Styles must define a shared modal footer block.');
assert(styles.includes('.tutor-ai-actions,\n.quick-prompts-analytics,\n.explain-details'), 'Accordion blocks must share consistent contained styling.');
const stage7dBlock = styles.slice(styles.lastIndexOf('/* Stage 7D'), styles.length);
const modalSpecificSlice = [
  '.tutor-ai-actions',
  '.quick-prompts-analytics',
  '.explain-details',
  '.ai-chat-input',
  '.ai-explain-footer',
  '.ai-teacher-footer'
].map(selector => {
  const start = stage7dBlock.indexOf(selector);
  return start >= 0 ? stage7dBlock.slice(start, start + 480) : '';
}).join('\n');
assert(!/position:\s*absolute/.test(modalSpecificSlice), 'Stage 7D modal help/footer rules must not use absolute positioning.');
assert(!/margin:\s*-\d/.test(modalSpecificSlice), 'Stage 7D modal help/footer rules must not use negative margins for content positioning.');
assert(/z-index:\s*var\(--z-modal-backdrop\)/.test(styles), 'Modal overlay must stay above switcher and feedback chrome via canonical modal z-index.');

assert(harnessHtml.includes('/artifacts/stage7d/modal-audit.js'), 'Harness HTML must load the Stage 7D modal audit script.');
assert(harnessJs.includes("modal === 'tutor'"), 'Harness must support Tutor AI screenshots.');
assert(harnessJs.includes("modal === 'teacher'"), 'Harness must support Ajar Saya screenshots.');
assert(harnessJs.includes("modal === 'explain'"), 'Harness must support Terangkan screenshots.');
assert(harnessJs.includes("scrollTarget === 'middle'"), 'Harness must support middle-scroll screenshot state.');
assert(harnessJs.includes("scrollTarget === 'bottom'"), 'Harness must support bottom-scroll screenshot state.');
assert(harnessJs.includes("focusTarget === 'input'"), 'Harness must support focused-input screenshot state.');
assert(
  tutor.includes('329') ||
  explain.includes('329') ||
  teacher.includes('329') ||
  app.includes('329 - 1 = 328') ||
  read('src/ai/explainEngine.js').includes('329 - 1 = 328') ||
  read('scripts/validate/v31Stage3CoachUasaAudit.mjs').includes('329 - 1 = 328'),
  'Math 329 regression protection must remain present somewhere in the coach pipeline.'
);
assert(!/(padang|sekolah|hospital|nama orang|nama tempat)/i.test(JSON.stringify({
  explain: explain.match(/padang|sekolah|hospital|nama orang|nama tempat/gi),
  teacher: teacher.match(/padang|sekolah|hospital|nama orang|nama tempat/gi)
})), 'Stage 7D modal rewrite must not introduce BM leakage phrases.');

console.log('v31Stage7dAiModalAudit PASS');
console.log(JSON.stringify({
  audit: {
    sharedModalOpen: true,
    portalizedTutor: true,
    portalizedExplain: true,
    portalizedTeacher: true,
    safeAreaAware: true,
    footerSeparated: true,
    backgroundSuppressed: true,
    stage7dHarness: true
  }
}, null, 2));
