import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '../..');

async function read(relativePath) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

function assertIncludes(source, expected, message) {
  assert.equal(source.includes(expected), true, message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getRuleBlocks(css, selector) {
  const expression = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, 'g');
  return [...css.matchAll(expression)].map(match => match[1]);
}

function pxValues(blocks, property) {
  const expression = new RegExp(`${escapeRegExp(property)}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`, 'g');
  return blocks.flatMap(block => [...block.matchAll(expression)].map(match => Number(match[1])));
}

const [
  app,
  styles,
  indexHtml,
  modalRuntime,
  explainModal,
  teacherModal,
  tutorModal,
  errorBoundary,
  voiceButton
] = await Promise.all([
  read('src/App.jsx'),
  read('src/styles/style.css'),
  read('index.html'),
  read('src/components/ai/modalRuntime.js'),
  read('src/components/ai/AIExplainModal.jsx'),
  read('src/components/ai/AITeacherModal.jsx'),
  read('src/components/ai/TutorAIModal.jsx'),
  read('src/components/ProductionErrorBoundary.jsx'),
  read('src/components/VoiceButton.jsx')
]);

const checks = [];
function check(name, assertion) {
  assertion();
  checks.push(name);
}

check('document-language-and-viewport', () => {
  assert.match(indexHtml, /<html\s+lang=['"]ms['"]/i, 'Document language must remain Malay.');
  assert.match(indexHtml, /name=['"]viewport['"][^>]+width=device-width/i, 'Responsive viewport metadata is required.');
});

check('onboarding-and-core-actions', () => {
  for (const label of ['Mula Belajar Free', 'Papan Utama', 'Pusat Belajar', 'Semak Jawapan', 'Petunjuk', 'Terangkan', 'Cuba Lagi', 'Seterusnya']) {
    assertIncludes(app, label, `Core action label is missing: ${label}`);
  }
});

check('free-premium-recovery', () => {
  for (const copy of ['Akses pembelajaran', 'ialah ciri Premium', 'Kembali belajar']) {
    assertIncludes(app, copy, `Access recovery copy is missing: ${copy}`);
  }
});

check('modal-accessibility-runtime', () => {
  assertIncludes(modalRuntime, "event.key === 'Escape'", 'Modal runtime must support Escape.');
  assertIncludes(modalRuntime, "event.key !== 'Tab'", 'Modal runtime must trap Tab navigation.');
  assertIncludes(modalRuntime, 'restoreFocusRef.current?.focus?.()', 'Modal runtime must restore focus.');
  assertIncludes(modalRuntime, "document.body.style.overflow = 'hidden'", 'Modal runtime must lock background scroll.');
  for (const [name, source] of [['explain', explainModal], ['teacher', teacherModal], ['tutor', tutorModal]]) {
    assert.match(source, /role="dialog"/, `${name} modal must expose dialog semantics.`);
    assert.match(source, /aria-modal="true"/, `${name} modal must be marked modal.`);
  }
});

check('background-inert-contract', () => {
  assertIncludes(app, "inert={modalOpen ? true : undefined}", 'Background inert state must use a React boolean.');
  assert.equal(/inert=\{[^}]*\?\s*['"]{2}/.test(app), false, 'Empty-string inert attributes are forbidden.');
});

check('bidirectional-answer-contract', () => {
  assertIncludes(app, '<h1 className="question" dir="auto">', 'Question text must use automatic bidi direction.');
  assert.match(app, /<input\s+value=\{answer\}\s+dir="auto"/, 'Answer input must use automatic bidi direction.');
  assertIncludes(app, '<b dir="auto">{feedback.correctAnswer}</b>', 'Correct-answer feedback must preserve bidi direction.');
});

check('live-status-and-voice-fallback', () => {
  assertIncludes(app, 'aria-live="polite"', 'Quiz speech status must be announced politely.');
  assertIncludes(voiceButton, 'role="status"', 'Voice fallback status must be exposed to assistive technology.');
});

check('error-recovery-surfaces', () => {
  assertIncludes(errorBoundary, 'componentDidCatch', 'Production error boundary must capture render failures.');
  for (const copy of ['Soalan tidak dapat dipaparkan.', 'Papan Utama tidak dapat dipaparkan.', 'Kembali ke Papan Utama']) {
    assertIncludes(app, copy, `Recovery surface is missing: ${copy}`);
  }
});

check('mobile-touch-targets', () => {
  const arrowValues = pxValues(getRuleBlocks(styles, '.subject-switch-arrow'), 'min-height');
  const accountValues = pxValues(getRuleBlocks(styles, '.header-account-action'), 'min-height');
  assert.ok(arrowValues.length > 0, 'Subject switch arrow requires an explicit minimum height.');
  assert.ok(accountValues.length > 0, 'Account action requires an explicit minimum height.');
  assert.equal(arrowValues.every(value => value >= 44), true, `Subject arrows below 44px remain: ${arrowValues.join(', ')}`);
  assert.equal(accountValues.every(value => value >= 44), true, `Account actions below 44px remain: ${accountValues.join(', ')}`);
});

console.log(JSON.stringify({
  status: 'PASS',
  audit: 'Browser & Device Acceptance V1',
  checks: checks.length,
  coverage: {
    onboardingAndCoreFlow: true,
    responsiveViewport: true,
    keyboardAndModal: true,
    arabicBidi: true,
    accessAndErrorRecovery: true,
    touchTargets: true
  }
}, null, 2));
