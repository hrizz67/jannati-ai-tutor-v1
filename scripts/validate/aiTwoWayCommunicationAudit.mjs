import fs from 'node:fs';
import path from 'node:path';
const read = file => fs.readFileSync(file, 'utf8');
const root = process.cwd();
const modal = read(path.join(root, 'src/components/ai/TutorAIModal.jsx'));
const app = read(path.join(root, 'src/App.jsx'));
const engine = read(path.join(root, 'src/ai/tutorResponseEngine.js'));
const checks = {
  inputCapture: /onChange|setInput|inputValue/.test(modal),
  whitespaceGuard: /trim\(\).*length|trim\(\)/.test(modal),
  boundedInput: /slice\(|MAX_|maxLength/.test(modal),
  enterHandling: /onKeyDown|event\.key.*Enter/.test(modal),
  sendGuard: /sending|isSending|sendMessage/.test(modal),
  contextReset: /questionId|reset|history/i.test(modal) && /questionId|topicId/.test(engine),
  subjectContext: /subject|topic/.test(engine) && /subject|topic/.test(app),
  safeFallback: /fallback|safe|tidak dapat|cuba/i.test(engine),
  modalEntryPoint: /onOpenAi|setChatOpen\(true\)/.test(app)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, failures };
fs.mkdirSync(path.join(root, 'reports/validation'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/validation/ai-two-way-communication-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
