import fs from 'node:fs';
const app = fs.readFileSync('src/App.jsx', 'utf8');
const checks = {
  selectedSubjectSet: /setSelectedSubjectId/.test(app),
  subjectGuardedResume: /resume\?\.mode\s*===\s*'uasa'[\s\S]{0,100}resume\?\.subjectId\s*===\s*subject\?\.id/.test(app),
  freshQuestionSet: /buildUasaSet\(subject,\s*50\)/.test(app),
  stateResetEffect: /setQuestionIndex\(|setAnswer\(|setResult\(|setScore\(/.test(app) && /\[subject\?\.id\]/.test(app),
  transitionWriteGuard: /uasaStateSubjectId\s*!==\s*subject\.id/.test(app),
  completedReset: /completedRef\.current\s*=\s*Boolean\(subjectResume\?\.completed\)/.test(app),
  subjectScopedStorage: /uasaSession|writeSubjectScoped|clearSubjectScoped/.test(app),
  acceptedAnswers: /smartCheck\(answer,\s*normalizedQuestion\)/.test(app),
  completedHistoryPath: /onSave\(\{[\s\S]*subjectId:\s*subject\.id/.test(app)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, failures };
fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/uasa-subject-switch-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
