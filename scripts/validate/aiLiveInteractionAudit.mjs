import fs from 'node:fs';
const app = fs.readFileSync('src/App.jsx', 'utf8');
const tutor = fs.readFileSync('src/components/ai/TutorAIModal.jsx', 'utf8');
const engine = fs.readFileSync('src/ai/tutorResponseEngine.js', 'utf8');
const checks = {
  currentQuestionContext: /questionId|questionText|expectedAnswer/.test(app) && /questionId|questionText|expectedAnswer/.test(engine),
  learnerIntent: /help|clue|explanation|example|simpler|greeting/i.test(engine),
  nonEmptyInput: /trim\(\)/.test(tutor),
  boundedInput: /slice\(|maxLength/.test(tutor),
  repeatedSendGuard: /sending|isSending|loading/.test(tutor),
  safeFallback: /fallback|responseUnavailable|tidak dapat/i.test(engine),
  modalResetSignals: /questionId|topicId/.test(tutor),
  noRawMetadata: !/JSON\.stringify/.test(tutor)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, failures };
fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/ai-live-interaction-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
