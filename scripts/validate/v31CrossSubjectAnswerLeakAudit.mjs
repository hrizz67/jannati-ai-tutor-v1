import assert from 'node:assert/strict';
import { loadSubjectData, subjectList } from '../../src/data/subjects/index.js';
import { getTutorResponse } from '../../src/ai/tutorResponseEngine.js';
for (const subject of subjectList) {
  const data = await loadSubjectData(subject.id);
  const topic = data.topics[0]; const question = topic.questions[0];
  const expected = String(question.answer || question.correctAnswer || '').trim();
  const response = await getTutorResponse({ subject, topic, question, questionText: question.q, learnerAnswer: '', intent: 'hint', attemptCount: 0, explanationMode: '' });
  assert.equal(response.sections.correctAnswer, '', `${subject.id}: active correct answer field populated`);
  if (expected && expected.length > 2) {
    assert.doesNotMatch(`${response.shortText} ${response.sections.hint}`, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${subject.id}: active hint leaks answer`);
  }
}
console.log('PASS v31CrossSubjectAnswerLeakAudit');
