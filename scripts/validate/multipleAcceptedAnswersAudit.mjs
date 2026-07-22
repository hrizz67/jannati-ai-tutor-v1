import fs from 'node:fs';
import { smartCheck } from '../../src/utils/smartCheck.js';
const sample = { answer: 'doktor', accepted: ['jururawat'] };
const app = fs.readFileSync('src/App.jsx', 'utf8');
const tutor = fs.readFileSync('src/ai/tutorResponseEngine.js', 'utf8');
const adapter = fs.readFileSync('src/ai/coach/coachAdapter.js', 'utf8');
const checks = {
  doctorAccepted: smartCheck('doktor', sample).status === 'correct',
  helperSupportsAccepted: smartCheck('jururawat', sample).status === 'correct',
  helperSupportsAcceptedAnswersAlias: smartCheck('jururawat', { answer: 'doktor', acceptedAnswers: ['jururawat'] }).status === 'correct',
  normalization: smartCheck('  Jururawat! ', sample).status === 'correct',
  appUsesSmartCheck: /smartCheck\(answer,\s*question\)/.test(app),
  sharedResolverInApp: /getAcceptedAnswers/.test(app),
  sharedResolverInTutor: /getAcceptedAnswers/.test(tutor),
  sharedResolverInCoachAdapter: /getAcceptedAnswers/.test(adapter),
  canonicalContextArray: /acceptedAnswers/.test(tutor) && /acceptedAnswers/.test(adapter)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, failures };
fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/multiple-accepted-answers-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
