import fs from 'node:fs';
const app = fs.readFileSync('src/App.jsx', 'utf8');
const dashboard = fs.readFileSync('src/dashboard/HomeDashboard.jsx', 'utf8');
const checks = {
  selectedSubjectState: /selectedSubjectId|activeSubject/.test(app),
  subjectDependentLoad: /loadSubjectData\(selectedSubjectId\)/.test(app),
  subjectMemoDependencies: /selectedSubjectId/.test(app) && /activeSubject\?\.id/.test(app),
  dashboardReceivesSubject: /selectedSubjectId|selectedSubject/.test(dashboard),
  subjectScopedResume: /resume\?\.subjectId\s*===\s*subject\?\.id|subjectScopedKey/.test(app),
  aiSubjectContext: /subjectId:\s*activeSubject\?\.id/.test(app),
  noHardcodedBmForMath: !/subjectId.*math[\s\S]{0,120}Kata Nama Am/i.test(app)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, failures };
fs.mkdirSync('reports/validation', { recursive: true });
fs.writeFileSync('reports/validation/subject-isolation-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
