import fs from 'node:fs';
import { createCanonicalProgress, getCanonicalAccuracy } from '../../src/utils/canonicalProgress.js';
const sample = createCanonicalProgress({ name: 'Murid', xp: 330, level: 8, totalQuestions: 47, correctQuestions: 33, streak: 4, history: [{ percent: 100 }] });
const percentOnly = createCanonicalProgress({ totalQuestions: 1, history: [{ percent: 100 }] });
const appSource = fs.readFileSync('src/App.jsx', 'utf8');
const parentSource = fs.readFileSync('src/dashboard/ParentDashboard.jsx', 'utf8');
const checks = {
  canonicalFactory: sample.version === 1 && sample.global.totalAttempts === 47,
  boundedAccuracy: getCanonicalAccuracy(sample) >= 0 && getCanonicalAccuracy(sample) <= 100,
  subjectBuckets: ['bm', 'english', 'math', 'sains', 'arab', 'islam', 'pj', 'pk'].every(id => sample.subjects[id]),
  malformedInputSafe: createCanonicalProgress(null).global.totalAttempts === 0,
  noNaN: !JSON.stringify(sample).includes('NaN'),
  appUsesSubjectScopedStorage: /subjectScopedStorage/.test(appSource),
  runtimeCanonicalImporter: /createCanonicalProgress/.test(appSource) && /createCanonicalProgress/.test(parentSource),
  parentUsesCanonicalModel: /toParentProgressProfile/.test(parentSource) && !/mergeCanonicalParentProfile/.test(parentSource),
  noPercentAsCorrect: !/percent\s*,?\s*50|percent[^\n]*>=\s*50/.test(parentSource),
  percentOnlyDoesNotInventCorrect: percentOnly.global.totalCorrect === 0
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, sampleAccuracy: getCanonicalAccuracy(sample), failures };
fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/canonical-progress-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
