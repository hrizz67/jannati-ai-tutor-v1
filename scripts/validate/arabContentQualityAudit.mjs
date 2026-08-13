import assert from 'node:assert/strict';
import arabSubject from '../../src/data/subjects/arab.js';
import { validateArabQuestionRecord } from '../../src/utils/arabContentQuality.js';

const ARABIC = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
const topics = Array.isArray(arabSubject?.topics) ? arabSubject.topics : [];
const questions = topics.flatMap(topic =>
  (topic.questions || []).map(question => ({ ...question, topicId: topic.id }))
);
const failures = [];
const seenQuestions = new Map();

for (const question of questions) {
  const validation = validateArabQuestionRecord(question);
  if (!validation.valid) failures.push({ id: question.id, issues: validation.issues });

  const stemKey = String(question.q || question.question).toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ').trim();
  if (seenQuestions.has(stemKey)) {
    failures.push({ id: question.id, issues: ['duplicate_question'], duplicateOf: seenQuestions.get(stemKey) });
  } else {
    seenQuestions.set(stemKey, question.id);
  }

  const accepted = question.accepted || [];
  const acceptedKeys = accepted.map(value => String(value).toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ').trim());
  if (new Set(acceptedKeys).size !== acceptedKeys.length) {
    failures.push({ id: question.id, issues: ['duplicate_accepted_answer'] });
  }
  if (accepted.some(value => ARABIC.test(String(value)) !== ARABIC.test(String(question.answer)))) {
    failures.push({ id: question.id, issues: ['accepted_answer_language_mismatch'] });
  }
}

const noteFailures = topics.filter(topic =>
  !String(topic.note || '').startsWith('Murid ')
  || !Array.isArray(topic.learningObjectives)
  || topic.learningObjectives.length < 3
);
const cognitiveDistribution = questions.reduce((counts, question) => {
  counts[question.cognitiveLevel] = (counts[question.cognitiveLevel] || 0) + 1;
  return counts;
}, {});
const questionTypeDistribution = questions.reduce((counts, question) => {
  counts[question.questionType] = (counts[question.questionType] || 0) + 1;
  return counts;
}, {});
const byId = new Map(questions.map(question => [question.id, question]));

const expectations = {
  'ARAB-HURUF_HIJAIYAH-004': { answer: 'tha', accepted: 'sa', evidence: 'ث' },
  'ARAB-HURUF_HIJAIYAH-031': { answer: 'ب', evidence: 'satu titik di bawah' },
  'ARAB-HURUF_HIJAIYAH-046': { answer: 'fathah', evidence: 'بَ' },
  'ARAB-MUFRADAT-002': { answer: 'pen', accepted: 'pensel', evidence: 'قَلَمٌ' },
  'ARAB-MUFRADAT-047': { answer: 'ini (maskulin)', accepted: 'ini', evidence: 'هَذَا' },
  'ARAB-ANGGOTA_BADAN-015': { answer: 'jantung', accepted: 'hati', evidence: 'قَلْبٌ' },
  'ARAB-AYAT_MUDAH_ARAB-026': { answer: 'هَذَا كِتَابٌ', absent: 'Rujukan ayat' },
  'ARAB-HIWAR-003': { answer: 'Apakah nama kamu?', evidence: 'مَا اسْمُكَ؟' },
  'ARAB-HIWAR-026': { answer: 'السَّلَامُ عَلَيْكُمْ', absent: 'Contoh hiwar' },
  'ARAB-KEFAHAMAN_ARAB-022': { answer: 'Saya ada buku', evidence: 'Apakah maksud ayat ini?' },
  'ARAB-KEFAHAMAN_ARAB-024': { answer: 'pemadam', evidence: 'benda yang ada di dalam beg' },
  'ARAB-KEFAHAMAN_ARAB-047': { answer: 'كِتَابٌ', evidence: 'Salin perkataan Arab' }
};
const expectationFailures = Object.entries(expectations).flatMap(([id, expected]) => {
  const question = byId.get(id);
  const text = `${question?.q || ''} ${question?.explanation || ''}`;
  const acceptedKeys = (question?.accepted || []).map(value => String(value).toLocaleLowerCase('ms-MY'));
  const valid = question
    && question.answer === expected.answer
    && (!expected.accepted || acceptedKeys.includes(expected.accepted.toLocaleLowerCase('ms-MY')))
    && (!expected.evidence || text.includes(expected.evidence))
    && (!expected.absent || !text.includes(expected.absent));
  return valid ? [] : [{ id, actual: question, expected }];
});

const reverseTranslationLeakage = questions.filter(question =>
  ['ayat_mudah_arab', 'hiwar'].includes(question.topicId)
  && ARABIC.test(String(question.answer))
  && String(question.q || question.question).includes(String(question.answer))
);

assert.equal(topics.length, 10, `Expected 10 Bahasa Arab topics, received ${topics.length}.`);
assert.equal(questions.length, 500, `Expected 500 Bahasa Arab questions, received ${questions.length}.`);
assert.equal(failures.length, 0, `Bahasa Arab quality audit found ${failures.length} issue(s): ${JSON.stringify(failures.slice(0, 20))}`);
assert.equal(noteFailures.length, 0, `Bahasa Arab learning notes are incomplete: ${JSON.stringify(noteFailures.map(topic => topic.id))}`);
assert.equal(expectationFailures.length, 0, `Bahasa Arab content regressions found: ${JSON.stringify(expectationFailures)}`);
assert.equal(reverseTranslationLeakage.length, 0, `Reverse-translation answers leaked into stems: ${JSON.stringify(reverseTranslationLeakage.slice(0, 10).map(question => question.id))}`);
assert.deepEqual(
  Object.keys(cognitiveDistribution).sort(),
  ['menganalisis', 'mengaplikasi', 'memahami', 'mengingat'].sort(),
  'Bahasa Arab bank must retain appropriate cognitive-level diversity.'
);

console.log(JSON.stringify({
  status: 'PASS',
  topicsChecked: topics.length,
  questionsChecked: questions.length,
  issueCount: failures.length,
  noteIssueCount: noteFailures.length,
  contentRegressionCount: expectationFailures.length,
  answerLeakageCount: reverseTranslationLeakage.length,
  cognitiveDistribution,
  questionTypeDistribution
}, null, 2));
