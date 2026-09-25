import fs from 'node:fs';
import { loadSubjectData } from '../../src/data/subjects/index.js';
import { getQuestionAnswerDisplay, isAcceptedQuestionAnswer } from '../../src/utils/acceptedAnswers.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const css = fs.readFileSync('src/styles/style.css', 'utf8');
const outcomeHelper = fs.readFileSync('src/utils/quizSessionOutcome.js', 'utf8');

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
if (!/answerChecked \? onNextQuestion\(\) : onCheckAnswer\(\)/.test(app)) issues.push('enter_checked_guard_missing');
if (!/function nextQuestion\(\) \{\s*if \(!isQuizAnswerChecked\(feedback\)\) return;/.test(app)) issues.push('next_question_guard_missing');
if (!/\{answerChecked && <div className="actions">/.test(app)) issues.push('unchecked_feedback_actions_visible');
if (!/canRetryQuizAnswer\(feedback\)/.test(app)) issues.push('correct_retry_guard_missing');
if (!/getBestCreditedQuizOutcome\(liveSession\.answers, question\.id\) === 'correct'/.test(checkAnswer)) issues.push('correct_resubmit_guard_missing');
if (!/summarizeCreditedQuizOutcomes\(liveSession\.answers, \{ questionIds, totalQuestions: total \}\)/.test(app)) issues.push('finish_unique_outcome_summary_missing');
if (!/Math\.min\(100, Math\.max\(0, Math\.round/.test(outcomeHelper)) issues.push('finish_percent_clamp_missing');
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
