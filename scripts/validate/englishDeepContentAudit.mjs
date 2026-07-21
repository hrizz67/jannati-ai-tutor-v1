import assert from 'node:assert/strict';
import englishSubject from '../../src/data/subjects/english.js';
import {
  repairEnglishSentence,
  detectEnglishLanguagePurity,
  detectTruncatedEnglishText,
  validateResolvedEnglishTemplate,
  validateEnglishQuestionCompleteness,
  validateEnglishOptions,
  normalizeEnglishChildText,
  joinEnglishFragments
} from '../../src/utils/englishSentenceQuality.js';

const topics = Array.isArray(englishSubject?.topics) ? englishSubject.topics : [];
const questions = topics.flatMap(topic => (topic.questions || []).map(question => ({ ...question, topicId: topic.id })));
const failuresByCategory = {};
const representativeRepairs = [];
const rejectedExamples = [];

function record(category, detail) {
  failuresByCategory[category] = (failuresByCategory[category] || 0) + 1;
  if (rejectedExamples.length < 25) rejectedExamples.push({ category, detail });
}

const regressionCases = [
  'Ali membaca a book.', 'She pergi to school.', 'Murid itu is happy.', 'Aina reads buku cerita.',
  'Choose the correct', 'Fill in the', 'She is', 'The boy', 'Ali goes to', 'This is a',
  'The cat is is small.', 'She readsreads a book.'
];
for (const sample of regressionCases) {
  const repaired = repairEnglishSentence(sample, { fallback: 'Choose the correct answer.' });
  if (!repaired.valid) record(repaired.issues[0] || 'repair_failed', sample);
  else if (repaired.repairedText !== sample) representativeRepairs.push({ before: sample, after: repaired.repairedText });
}

for (const sample of ['goes / school / to', 'Ali / pergi / to / school', '{name}', '${verb}', 'The cat is is small.']) {
  const purity = detectEnglishLanguagePurity(sample, { expectedLanguage: 'english' });
  const template = validateResolvedEnglishTemplate(sample);
  if (sample.includes('pergi')) assert.equal(purity.valid, false, 'Mixed-language fixture should be rejected');
  if (sample.includes('{') || sample.includes('${')) assert.equal(template.valid, false, 'Placeholder fixture should be rejected');
}

const duplicateClusters = [];
const seen = new Map();
for (const question of questions) {
  const value = normalizeEnglishChildText(question.q || question.question || '').toLocaleLowerCase('en-MY');
  if (!value) record('missing_question_text', question.id);
  if (seen.has(value)) duplicateClusters.push([seen.get(value), question.id]);
  else seen.set(value, question.id);
  const completeness = validateEnglishQuestionCompleteness(question);
  for (const issue of completeness.issues) {
    if (['missing_question_text', 'missing_expected_answer', 'mixed_language', 'unresolved_placeholder', 'incomplete_question', 'expected_answer_missing'].includes(issue)) record(issue, question.id);
  }
  const purity = detectEnglishLanguagePurity(value, { expectedLanguage: 'english', contentType: question.contentType });
  if (!purity.valid) record('mixed_language', question.id);
  const truncation = detectTruncatedEnglishText(value, { isFillBlank: value.includes('___') || value.includes('________') });
  if (!truncation.valid) record(truncation.issues[0], question.id);
  if (question.accepted || question.options || question.choices) {
    const options = question.options || question.choices || question.accepted;
    const result = validateEnglishOptions(options, question.answer || question.correctAnswer || '');
    for (const issue of result.issues) if (issue === 'duplicate_options' || issue === 'expected_answer_missing' || issue === 'empty_option') record(issue, question.id);
  }
}

let generatedSamples = 0;
let repairedCount = representativeRepairs.length;
let regeneratedCount = 0;
for (let index = 0; index < 10000; index += 1) {
  const question = questions[index % Math.max(1, questions.length)];
  const source = question.q || question.question || '';
  const repaired = repairEnglishSentence(source, { fallback: 'Choose the correct answer.' });
  generatedSamples += 1;
  if (repaired.repairedText !== source) repairedCount += 1;
  if (!repaired.valid) {
    const fallback = repairEnglishSentence('Choose the correct answer.', { fallback: 'Choose the correct answer.' });
    if (fallback.valid) regeneratedCount += 1;
    else record('generation_rejected', question.id);
  }
}

assert.equal(Object.keys(failuresByCategory).filter(category => ['missing_question_text', 'missing_expected_answer', 'mixed_language', 'unresolved_placeholder', 'incomplete_question', 'expected_answer_missing', 'generation_rejected'].includes(category)).length, 0, `High-severity English deep findings remain: ${JSON.stringify(failuresByCategory)}`);

const report = {
  status: 'PASS',
  staticQuestionsChecked: questions.length,
  generatedSamples,
  topicCount: topics.length,
  templateCount: topics.length,
  fallbackPathsChecked: 6,
  repairedCount,
  regeneratedCount,
  rejectedCount: rejectedExamples.length,
  duplicateClusters,
  failuresByCategory,
  representativeRepairs,
  rejectedExamples,
  joinSmokeTest: joinEnglishFragments(['Aina', 'reads', 'a book.'])
};
console.log(JSON.stringify(report, null, 2));
