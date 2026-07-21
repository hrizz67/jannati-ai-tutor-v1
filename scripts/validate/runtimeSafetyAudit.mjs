import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const files = [];
const walk = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (/\.(?:js|jsx|mjs)$/.test(entry.name)) files.push(full); } };
walk(path.join(root, 'src'));
const text = files.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const checks = {
  noLegacyChatOpen: !/\bchatOpen\b/.test(text) || /const \[chatOpen,\s*setChatOpen\]/.test(text),
  noEval: !/\beval\s*\(/.test(text),
  noDangerousHtml: !/dangerouslySetInnerHTML/.test(text),
  noUndefinedModalLeak: !/\{\s*(undefined|null)\s*\}/.test(text),
  boundariesPresent: /ProductionErrorBoundary|ErrorBoundary/.test(text),
  safeLocalStorage: /try\s*\{|localStorage/.test(text),
  speechCleanup: /speechSynthesis\.cancel|abort\(|clearTimeout/.test(text),
  noStackTraceUi: !/stack\s*\}|error\.stack/i.test(text)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', sourceFiles: files.length, checks, failures };
fs.mkdirSync(path.join(root, 'reports/validation'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/validation/runtime-safety-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
