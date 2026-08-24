import assert from 'node:assert/strict';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { repairBMSentence, validateBMSentence } from '../../src/utils/bmSentenceQuality.js';
import { splitQuestionPresentationLines } from '../../src/utils/questionPresentation.js';

const screenshotPrompt = 'Ayah membeli ikan di pasar. Apakah kata nama am bagi haiwan dalam ayat itu?';
assert.deepEqual(splitQuestionPresentationLines(screenshotPrompt), [
  'Ayah membeli ikan di pasar.',
  'Apakah kata nama am bagi haiwan dalam ayat itu?'
]);
assert.deepEqual(splitQuestionPresentationLines('Apakah warna bunga itu?'), ['Apakah warna bunga itu?']);
assert.deepEqual(
  splitQuestionPresentationLines('Baca petikan: Aina pergi ke sekolah. Apakah kenderaan yang dinaikinya?'),
  ['Baca petikan:', 'Aina pergi ke sekolah.', 'Apakah kenderaan yang dinaikinya?']
);

const genericRepeatedWords = 'Rumah itu ialah tempat tetap dan tempat asal keluarganya.';
assert.equal(repairBMSentence(genericRepeatedWords).repairedSentence, genericRepeatedWords, 'Perkataan biasa selepas “dan” tidak boleh ditukar menjadi nama orang.');
const stationery = 'Ali membeli satu kertas dan satu pensel.';
assert.equal(repairBMSentence(stationery).repairedSentence, stationery, 'Pengulangan penjodoh bilangan yang sah mesti dikekalkan.');
const duplicatePerson = repairBMSentence('Ali bermain dengan Ali di taman.', { candidates: ['Ali', 'Abu'] });
assert.notEqual(duplicatePerson.repairedSentence, 'Ali bermain dengan Ali di taman.');
assert.equal(validateBMSentence(duplicatePerson.repairedSentence).valid, true);

const subjects = await loadAllSubjects();
let questionsChecked = 0;
const presentationFailures = [];
const contentRegressions = [];

for (const subject of subjects) {
  for (const topic of subject.topics || []) {
    for (const question of topic.questions || []) {
      questionsChecked += 1;
      const text = String(question.q || question.question || '').replace(/\s+/g, ' ').trim();
      const lines = splitQuestionPresentationLines(text);
      if (!lines.length || lines.some(line => !line.trim()) || lines.join(' ') !== text) {
        presentationFailures.push({ subjectId: subject.id, topicId: topic.id, id: question.id, text, lines });
      }
      for (const field of ['q', 'question', 'hint', 'explanation']) {
        const value = String(question[field] || '');
        if (/\bdan\s+(?:Ali|Abu)\s+(?:asal|pensel)\b/i.test(value)) {
          contentRegressions.push({ subjectId: subject.id, topicId: topic.id, id: question.id, field, value });
        }
        if (subject.id === 'bm' && /haiwan atau makanan/i.test(value)) {
          contentRegressions.push({ subjectId: subject.id, topicId: topic.id, id: question.id, field, value });
        }
      }
    }
  }
}

assert.equal(presentationFailures.length, 0, JSON.stringify(presentationFailures.slice(0, 5)));
assert.equal(contentRegressions.length, 0, JSON.stringify(contentRegressions.slice(0, 5)));
assert.ok(questionsChecked >= 4500, `Audit penuh dijangka memeriksa sekurang-kurangnya 4,500 soalan; sebenar ${questionsChecked}.`);

console.log(`Question presentation regression: PASS (${questionsChecked} soalan)`);
