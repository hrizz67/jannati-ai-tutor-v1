import assert from 'node:assert/strict';
import englishSubject from '../../src/data/subjects/english.js';
import {
  repairEnglishSentence,
  validateEnglishSentence,
  validateEnglishQuestion,
  validateEnglishOptions,
  normalizeEnglishChildText,
  pickDistinctEnglishEntity
} from '../../src/utils/englishSentenceQuality.js';

const topics = Array.isArray(englishSubject?.topics) ? englishSubject.topics : [];
const sourceQuestions = topics.flatMap(topic => (topic.questions || []).map(question => ({ ...question, topicId: topic.id })));
const failuresByCategory = {};
const repairedExamples = [];
const rejectedExamples = [];

function record(category, detail) {
  failuresByCategory[category] = (failuresByCategory[category] || 0) + 1;
  if (rejectedExamples.length < 20) rejectedExamples.push({ category, detail });
}

const fixtures = [
  'Ali plays with Ali.', 'Sara and Sara read.', 'Mother helps mother.', 'The cat chases the cat.',
  'He run.', 'They runs.', 'Aina play.', 'The boys plays.',
  'a apple', 'an cat', 'a umbrella', 'an book',
  'Aina is reading. He is happy.', 'The boys are running. She is fast.',
  'two cat', 'these book', 'the children is', 'i am Ali.', 'ali goes home.',
  'Where are you.', 'This is my book,', 'Hello , Ali!'
];

for (const sample of fixtures) {
  const result = repairEnglishSentence(sample);
  if (!result.valid) record(result.issues[0] || 'repair_failed', sample);
  else if (result.repairedText !== sample && repairedExamples.length < 20) repairedExamples.push({ before: sample, after: result.repairedText });
}

const optionFixtures = [
  { options: ['cat', 'cat', 'dog'], answer: 'cat' },
  { options: ['', 'dog'], answer: 'dog' },
  { options: ['run', 'go'], answer: 'play' }
];
for (const fixture of optionFixtures) {
  const result = validateEnglishOptions(fixture.options, fixture.answer);
  assert.equal(result.valid, false, `Invalid option fixture should fail: ${fixture.options.join(', ')}`);
}

let sampleCount = 0;
for (let index = 0; index < 2000; index += 1) {
  const question = sourceQuestions[index % Math.max(1, sourceQuestions.length)];
  const text = normalizeEnglishChildText(question.q || question.question || '');
  const result = validateEnglishSentence(text);
  sampleCount += 1;
  if (result.issues.some(issue => ['internal_id', 'duplicate_entities', 'subject_verb_agreement', 'pronoun_mismatch'].includes(issue))) {
    const repaired = repairEnglishSentence(text);
    if (!repaired.valid) record(result.issues[0], { topicId: question.topicId, text });
  }
  const questionResult = validateEnglishQuestion(question);
  if (questionResult.issues.includes('expected_answer_missing')) record('expected_answer_missing', question.id);
}

for (const question of sourceQuestions) {
  const result = validateEnglishQuestion(question);
  for (const issue of result.issues) {
    if (['internal_id', 'expected_answer_missing'].includes(issue)) record(issue, question.id);
  }
}

const distinctChecks = [
  ['Ali', ['Ali', 'Adam']],
  ['Sara', ['Sara', 'Lina']],
  ['Mother', ['Mother', 'Father']]
].map(([exclude, candidates]) => pickDistinctEnglishEntity({ exclude, candidates }));
assert.equal(new Set(distinctChecks.map(value => value.toLowerCase())).size, distinctChecks.length, 'Distinct entity selector returned duplicates');

const highSeverity = Object.entries(failuresByCategory).filter(([category]) => ['internal_id', 'expected_answer_missing', 'duplicate_entities', 'subject_verb_agreement', 'pronoun_mismatch'].includes(category));
assert.equal(highSeverity.length, 0, `High-severity English findings remain: ${JSON.stringify(highSeverity)}`);

const report = {
  status: 'PASS',
  totalGenerated: sampleCount,
  staticQuestionsChecked: sourceQuestions.length,
  templatesChecked: topics.length,
  repairedCount: repairedExamples.length,
  rejectedCount: rejectedExamples.length,
  failuresByCategory,
  representativeRepairs: repairedExamples,
  rejectedExamples,
  topics: topics.map(topic => ({ topicId: topic.id, questions: topic.questions?.length || 0 }))
};
console.log(JSON.stringify(report, null, 2));
