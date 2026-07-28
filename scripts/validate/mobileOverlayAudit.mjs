import fs from 'node:fs';
const app = fs.readFileSync('src/App.jsx', 'utf8');
const css = fs.readFileSync('src/styles/style.css', 'utf8');
const checks = {
  feedbackSuppressedByModal: /const feedbackSuppressed = modalOpen \|\| \['quiz', 'uasa', 'reading', 'listening', 'speaking', 'writing', 'finish', 'parent'\]\.includes\(currentScreen\);/.test(app) && /BetaFeedbackButton suppressed=\{feedbackSuppressed\}/.test(app),
  safeAreaInsets: /safe-area-inset-bottom|safe-area-inset-top/.test(css),
  modalZIndex: /modal|overlay/i.test(css) && /z-index/.test(css),
  mobileModalHeight: /dvh|svh|max-height/.test(css),
  noPrintFeedback: /@media print[\s\S]*beta|beta[\s\S]*display:\s*none/i.test(css),
  largeInputFont: /font-size:\s*(?:1[6-9]|[2-9]\d)px/.test(css)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, failures };
fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/mobile-overlay-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
