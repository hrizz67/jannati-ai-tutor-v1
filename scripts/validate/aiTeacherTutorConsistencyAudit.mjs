import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/App.jsx');
const tutor = read('src/components/ai/TutorAIModal.jsx');
const explain = read('src/components/ai/AIExplainModal.jsx');
const teacher = read('src/components/ai/AITeacherModal.jsx');
const teacherEngine = read('src/ai/teacherEngine.js');
const checks = {
  tutorWired: /<TutorAIModal/.test(app) && /onOpenAi/.test(app),
  teacherWired: /<AITeacherModal/.test(app) && /openTeacher|onTeach/.test(app),
  explainWired: /<AIExplainModal/.test(app) && /openExplain/.test(app),
  distinctTutorTeacher: /Tanya Guru AI|TutorAIModal/.test(tutor) && /Ajar|teacher|Terangkan/.test(teacher),
  normalizedTeacherFields: /explanation|steps|examples|commonMistakes|memoryTip/i.test(teacherEngine),
  safeTeacherFallback: /fallback|default|cuba|tidak/i.test(teacherEngine),
  noTechnicalLeakInModals: !/(questionId|topicId|subjectId)\s*\}|JSON\.stringify/.test(`${tutor}\n${teacher}\n${explain}`)
};
const failures = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const report = { status: failures.length ? 'FAIL' : 'PASS', checks, failures };
fs.mkdirSync(path.join(root, 'reports/validation'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/validation/ai-teacher-tutor-consistency-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
