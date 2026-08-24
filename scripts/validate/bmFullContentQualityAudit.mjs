import assert from 'node:assert/strict';
import bmSubject from '../../src/data/subjects/bm.js';
import {
  repairBMSentence,
  validateBMSentence,
  validateBmSemantics,
  validateBmQuestionObject,
  validateBmOptions,
  validateBmInstruction,
  pickDistinctEntity
} from '../../src/utils/bmSentenceQuality.js';

const topics = Array.isArray(bmSubject?.topics) ? bmSubject.topics : [];
const sourceQuestions = topics.flatMap(topic => (topic.questions || []).map(question => ({ ...question, topicId: topic.id })));
const failuresByCategory = {};
const representativeRepairs = [];
const rejectedExamples = [];

function record(category, detail) {
  failuresByCategory[category] = (failuresByCategory[category] || 0) + 1;
  if (rejectedExamples.length < 20) rejectedExamples.push({ category, detail });
}

const explicitFailures = [
  'Di dalam kelas, Aina membaca pensel cerita bersama rakannya.',
  'Datuk berkebun bersama datuk.',
  'Ibu minum gelas air.',
  'Aina menulis pensel.',
  'Abu memakai meja.',
  'Siti membaca kasut.',
  'Datuk menaiki sekolah.',
  'Kakak menyiram buku.',
  'Ali bermain bola dengan pensel.',
  'Murid makan sudu di kantin.',
  'Adik menggosok nasi.',
  'Ibu memasak di dalam bas.',
  'Pada waktu malam, murid menghadiri perhimpunan pagi.',
  'Bunga itu lapar.',
  'Seekor pensel.',
  'Sebatang kucing.'
];

for (const sample of explicitFailures) {
  const repaired = repairBMSentence(sample);
  if (!repaired.valid) record(repaired.semanticIssues?.[0] || repaired.issues[0] || 'repair_failed', sample);
  else if (repaired.repairedSentence !== sample) representativeRepairs.push({ before: sample, after: repaired.repairedSentence });
}

let generatedSamples = 0;
let regeneratedCount = representativeRepairs.length;
for (let index = 0; index < 5000; index += 1) {
  const question = sourceQuestions[index % Math.max(1, sourceQuestions.length)];
  const sentence = question.q || question.question || question.answer || '';
  const validation = validateBMSentence(sentence);
  generatedSamples += 1;
  if (validation.severity === 'high') {
    const repaired = repairBMSentence(sentence);
    if (!repaired.valid) record(repaired.semanticIssues?.[0] || validation.issues[0] || 'unrepaired_sentence', question.id);
    else regeneratedCount += 1;
  }
  const questionResult = validateBmQuestionObject(question);
  if (questionResult.severity === 'high' && !repairBMSentence(sentence).valid) record(questionResult.issues[0], question.id);
}

for (const question of sourceQuestions) {
  const sentence = question.q || question.question || '';
  const result = validateBMSentence(sentence);
  if (result.issues.includes('internal_id')) record('internal_id', question.id);
  if (question.options || question.choices) {
    const optionResult = validateBmOptions(question.options || question.choices, question.answer || question.correctAnswer || '');
    for (const issue of optionResult.issues) if (issue === 'duplicate_options' || issue === 'expected_answer_missing') record(issue, question.id);
  }
  const instructionResult = validateBmInstruction(question.instruction || '');
  if (question.instruction && !instructionResult.valid) record(instructionResult.issues[0], question.id);
}

const roleCheck = ['Datuk', 'Datuk'].map(value => value);
assert.equal(pickDistinctEntity({ exclude: roleCheck[0], candidates: ['Datuk', 'Nenek'] }).toLocaleLowerCase('ms-MY'), 'nenek');
assert.equal(validateBmSemantics('Aina membaca buku cerita bersama rakannya.').valid, true);
assert.equal(validateBmSemantics('Aina membaca pensel cerita bersama rakannya.').valid, false);

const highSeverity = Object.keys(failuresByCategory).filter(category => ['invalid_verb_object', 'invalid_verb_place', 'invalid_compound_noun', 'classifier_mismatch', 'time_context_mismatch', 'internal_id', 'expected_answer_missing'].includes(category));
assert.equal(highSeverity.length, 0, `High-severity BM findings remain: ${JSON.stringify(highSeverity)}`);

const report = {
  status: 'PASS',
  staticQuestionsChecked: sourceQuestions.length,
  generatedSamples,
  templatesChecked: topics.length,
  repairedCount: representativeRepairs.length,
  regeneratedCount,
  rejectedCount: rejectedExamples.length,
  failuresByCategory,
  representativeRepairs,
  rejectedExamples,
  topics: topics.map(topic => ({ topicId: topic.id, questions: topic.questions?.length || 0 }))
};
console.log(JSON.stringify(report, null, 2));
