import assert from 'node:assert/strict';
import { loadSubjectData, subjectList } from '../../src/data/subjects/index.js';
import { getTutorResponse } from '../../src/ai/tutorResponseEngine.js';
for (const subject of subjectList) {
  const data = await loadSubjectData(subject.id); const topic = data.topics[0]; const question = topic.questions[0];
  const response = await getTutorResponse({ subject, topic, question, questionText: question.q, intent: 'hint' });
  assert.ok(response.sections.hint && response.sections.steps?.length, `${subject.id}: missing help`);
  assert.doesNotMatch(response.sections.hint, /^Cari kata kunci dan baca ayat penuh\.?$/i);
  assert.doesNotMatch(response.sections.hint, /^Cari perkataan petunjuk dan baca ayat pendek\.?$/i);
  assert.doesNotMatch(response.sections.example || '', /jawapan yang tepat/i, `${subject.id}: placeholder example`);
}
console.log('PASS v31CrossSubjectTutorHelpAudit');
