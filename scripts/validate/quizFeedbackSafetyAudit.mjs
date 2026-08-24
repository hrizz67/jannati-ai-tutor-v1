import fs from 'node:fs';
import { loadSubjectData } from '../../src/data/subjects/index.js';
import { getQuestionAnswerDisplay, isAcceptedQuestionAnswer } from '../../src/utils/acceptedAnswers.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const css = fs.readFileSync('src/styles/style.css', 'utf8');

const checkStart = app.indexOf('function checkAnswer()');
const checkEnd = app.indexOf('\n  function ', checkStart + 20);
const checkAnswer = app.slice(checkStart, checkEnd > checkStart ? checkEnd : checkStart + 2500);

const issues = [];
if (checkStart < 0) issues.push('check_answer_missing');
if (!/if \(!String\(answer \|\| ''\)\.trim\(\)\)/.test(checkAnswer)) issues.push('empty_guard_missing');
if (!/status: 'empty'/.test(checkAnswer)) issues.push('empty_status_missing');
if (!/setFeedback\(\{[\s\S]*?status: 'empty'[\s\S]*?message: 'Tulis jawapan dahulu ya\.'/m.test(checkAnswer)) {
  issues.push('empty_feedback_copy_missing');
}
if (!/\.finish-summary-card b\s*\{[\s\S]*?word-break: normal;[\s\S]*?hyphens: none;/.test(css)) {
  issues.push('dashboard_word_break_guard_missing');
}

const bm = await loadSubjectData('bm');
const classifierQuestions = (bm.topics || [])
  .flatMap(topic => topic.questions || [])
  .filter(question => /\bpilih penjodoh bilangan\b/i.test(String(question.q || '')));
for (const question of classifierQuestions) {
  const classifier = String(question.answer || '').trim().split(/\s+/)[0];
  if (!classifier || !isAcceptedQuestionAnswer(classifier, question)) {
    issues.push(`classifier_answer_rejected:${question.id}`);
  }
  if (getQuestionAnswerDisplay(question) !== classifier) {
    issues.push(`classifier_display_mismatch:${question.id}`);
  }
}

const result = { status: issues.length ? 'FAIL' : 'PASS', issueCount: issues.length, issues };
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exit(1);
