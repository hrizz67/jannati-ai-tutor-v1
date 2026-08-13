import fs from 'node:fs';
import path from 'node:path';
import { subjectList } from '../../src/data/subjects/index.js';
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/App.jsx');
const resumeStorage = read('src/utils/resumeStorage.js');
const packageJson = JSON.parse(read('package.json'));
const checks = {
  subjectSelection: /onSelectSubject|startTopic/.test(app),
  quizAnswerFlow: /onCheckAnswer|checkAnswer|onNextQuestion/.test(app),
  resumeFlow: /startResume|persistResumeData/.test(app) && /RESUME_KEY|RESUME_SLOTS_KEY/.test(resumeStorage),
  dashboards: /HomeDashboard|ParentDashboardPage|AnalyticsDashboard|RevisionDashboard/.test(app),
  speechSurfaces: /BacaanCoach|MendengarLab|BertuturCoach|MenulisCoach/.test(app),
  aiSurfaces: /TutorAIModal|AIExplainModal|AITeacherModal/.test(app),
  adaptive: /adaptive|startAdaptive/i.test(app),
  persistence: /localStorage/.test(app),
  githubPagesBase: /base:|homepage/.test(read('vite.config.js')) || Boolean(packageJson.homepage),
  buildScript: packageJson.scripts?.build === 'vite build',
  allSubjectsRegistered: subjectList.length === 8 && ['bm','english','math','sains','arab','islam','pj','pk'].every(id => subjectList.some(item => item.id === id)),
  noUndefinedLegacyReference: !/\bchatOpen\b/.test(app) || /const \[chatOpen,\s*setChatOpen\]/.test(app)
};
const routes = [...app.matchAll(/screen === ['"]([^'"]+)['"]/g)].map(match => match[1]);
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', routes: [...new Set(routes)], subjectCount: subjectList.length, checks, failures, knownWarnings: ['main bundle remains above Vite 500 kB warning threshold', 'manual browser/device validation is not represented by static checks'] };
fs.mkdirSync(path.join(root, 'reports/validation'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/validation/full-system-workflow-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
