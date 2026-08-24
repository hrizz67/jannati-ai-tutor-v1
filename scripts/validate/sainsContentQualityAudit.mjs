import assert from 'node:assert/strict';
import sainsSubject from '../../src/data/subjects/sains.js';
import { validateSainsQuestionRecord } from '../../src/utils/sainsContentQuality.js';

const topics = Array.isArray(sainsSubject?.topics) ? sainsSubject.topics : [];
const questions = topics.flatMap(topic => (topic.questions || []).map(question => ({ ...question, topicId: topic.id })));
const failures = [];
const seenQuestions = new Map();

for (const question of questions) {
  const validation = validateSainsQuestionRecord(question);
  if (!validation.valid) failures.push({ id: question.id, issues: validation.issues });

  const stemKey = String(question.q || question.question).toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ').trim();
  if (seenQuestions.has(stemKey)) failures.push({ id: question.id, issues: ['duplicate_question'], duplicateOf: seenQuestions.get(stemKey) });
  else seenQuestions.set(stemKey, question.id);

  const acceptedKeys = (question.accepted || []).map(value => String(value).toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ').trim());
  if (new Set(acceptedKeys).size !== acceptedKeys.length) failures.push({ id: question.id, issues: ['duplicate_accepted_answer'] });
}

const noteFailures = topics.filter(topic =>
  !String(topic.note || '').startsWith('Murid ') || !Array.isArray(topic.learningObjectives) || topic.learningObjectives.length < 2
);
const cognitiveDistribution = questions.reduce((counts, question) => {
  counts[question.cognitiveLevel] = (counts[question.cognitiveLevel] || 0) + 1;
  return counts;
}, {});
const questionTypeDistribution = questions.reduce((counts, question) => {
  counts[question.questionType] = (counts[question.questionType] || 0) + 1;
  return counts;
}, {});

assert.equal(topics.length, 10, `Expected 10 Sains topics, received ${topics.length}.`);
assert.equal(questions.length, 500, `Expected 500 Sains questions, received ${questions.length}.`);
assert.equal(failures.length, 0, `Sains quality audit found ${failures.length} issue(s): ${JSON.stringify(failures.slice(0, 20))}`);
assert.equal(noteFailures.length, 0, `Sains learning notes are incomplete: ${JSON.stringify(noteFailures.map(topic => topic.id))}`);
assert.equal(cognitiveDistribution.menilai > 0, true, 'Sains bank must include evaluation questions.');

console.log(JSON.stringify({
  status: 'PASS',
  topicsChecked: topics.length,
  questionsChecked: questions.length,
  issueCount: failures.length,
  noteIssueCount: noteFailures.length,
  cognitiveDistribution,
  questionTypeDistribution
}, null, 2));
