import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { subjectList, loadSubjectData } from '../../src/data/subjects/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const required = ['bm', 'english', 'math', 'sains', 'arab', 'islam', 'pj', 'pk'];
const results = [];
let failures = 0;
for (const id of required) {
  const meta = subjectList.find(item => item.id === id);
  const subject = await loadSubjectData(id);
  const topics = Array.isArray(subject?.topics) ? subject.topics : [];
  const questions = topics.flatMap(topic => Array.isArray(topic.questions) ? topic.questions : []);
  const ids = questions.map(q => q.id).filter(Boolean);
  const uniqueIds = new Set(ids).size;
  const missing = questions.filter(q => !q.id || !(q.q || q.question) || (q.answer === undefined && !Array.isArray(q.accepted))).length;
  const pass = Boolean(meta && topics.length && questions.length && uniqueIds === ids.length && missing === 0);
  if (!pass) failures += 1;
  results.push({ id, title: meta?.title || subject?.title || id, topics: topics.length, questions: questions.length, uniqueQuestionIds: uniqueIds, missingCoreFields: missing, pass });
}
const report = { status: failures ? 'FAIL' : 'PASS', requiredSubjects: required.length, subjects: results };
fs.mkdirSync(path.join(root, 'reports', 'validation'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/validation/full-subject-coverage-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures) process.exitCode = 1;
