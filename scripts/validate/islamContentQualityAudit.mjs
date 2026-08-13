import assert from 'node:assert/strict';
import islamSubject from '../../src/data/subjects/islam.js';
import { validateIslamQuestionRecord } from '../../src/utils/islamContentQuality.js';

const topics = Array.isArray(islamSubject?.topics) ? islamSubject.topics : [];
const questions = topics.flatMap(topic =>
  (topic.questions || []).map(question => ({ ...question, topicId: topic.id }))
);
const failures = [];
const seenQuestions = new Map();

for (const question of questions) {
  const validation = validateIslamQuestionRecord(question, { topicId: question.topicId });
  if (!validation.valid) failures.push({ id: question.id, issues: validation.issues });

  const stemKey = String(question.q || question.question).toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ').trim();
  if (seenQuestions.has(stemKey)) {
    failures.push({ id: question.id, issues: ['duplicate_question'], duplicateOf: seenQuestions.get(stemKey) });
  } else {
    seenQuestions.set(stemKey, question.id);
  }

  const acceptedKeys = (question.accepted || []).map(value => String(value).toLocaleLowerCase('ms-MY').replace(/\s+/g, ' ').trim());
  if (new Set(acceptedKeys).size !== acceptedKeys.length) {
    failures.push({ id: question.id, issues: ['duplicate_accepted_answer'] });
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
  'ISLAM-AQIDAH-023': { answer: 'Allah', evidence: 'berdoa atau memohon perkara ghaib' },
  'ISLAM-AQIDAH-038': { answer: 'Ya, reda kepada ketentuan Allah perlu disertai usaha yang baik.', cognitiveLevel: 'menganalisis' },
  'ISLAM-IBADAH-003': { answer: 'mutlak', accepted: 'air mutlak', evidence: 'suci lagi menyucikan' },
  'ISLAM-IBADAH-016': { answer: 'fardu', evidence: 'selepas azan' },
  'ISLAM-IBADAH-036': { answer: 'Membasuh tangan sebelum muka ialah sunat; rukun wuduk bermula dengan niat dan membasuh muka.', cognitiveLevel: 'menganalisis' },
  'ISLAM-IBADAH-050': { answer: 'Tidak, ibadah mesti dilakukan dengan ikhlas kerana Allah.', cognitiveLevel: 'menilai' },
  'ISLAM-SIRAH-048': { answer: 'Tidak, Rasulullah SAW berniaga dengan jujur dan amanah.', cognitiveLevel: 'menilai' },
  'ISLAM-AKHLAK-015': { answer: 'prihatin', accepted: 'penyayang' },
  'ISLAM-AKHLAK-018': { answer: 'amanah', accepted: 'jujur' },
  'ISLAM-QURAN-007': { answer: "isti'azah", accepted: "ta'awuz" },
  'ISLAM-QURAN-023': { answer: 'basmalah', accepted: 'Bismillah' },
  'ISLAM-QURAN-026': { answer: 'rakaat', evidence: 'setiap' },
  'ISLAM-QURAN-039': { answer: 'berwuduk', evidence: 'mushaf Al-Quran' },
  'ISLAM-QURAN-046': { answer: 'Tidak, ayat Al-Quran ialah kalam Allah yang wajib dihormati.', cognitiveLevel: 'menilai' },
  'ISLAM-HADIS-004': { answer: 'iman', evidence: 'bersuci ialah separuh' },
  'ISLAM-HADIS-044': { answer: 'Tidak, sunnah Nabi mengajar kita bercakap baik dan tidak menyakiti orang lain.', cognitiveLevel: 'menilai' },
  'ISLAM-ADAB-044': { answer: 'Semak kebenaran mesej dan jangan menyebarkannya sebelum pasti.', cognitiveLevel: 'mengaplikasi' },
  'ISLAM-HAFAZAN-021': { answer: 'رَزَقْتَنَا', evidence: 'فِيمَا' },
  'ISLAM-HAFAZAN-025': { answer: 'أَعُوذُ', evidence: 'الْخُبُثِ وَالْخَبَائِثِ' },
  'ISLAM-HAFAZAN-026': { answer: 'غُفْرَانَكَ', accepted: 'ghufranak' },
  'ISLAM-JAWI_PERKATAAN-046': { answer: 'چيقݢو', accepted: 'چيقڬو', evidence: 'cikgu' }
};
const expectationFailures = Object.entries(expectations).flatMap(([id, expected]) => {
  const question = byId.get(id);
  const text = `${question?.q || ''} ${question?.explanation || ''}`;
  const acceptedKeys = (question?.accepted || []).map(value => String(value).toLocaleLowerCase('ms-MY'));
  const valid = question
    && question.answer === expected.answer
    && (!expected.accepted || acceptedKeys.includes(expected.accepted.toLocaleLowerCase('ms-MY')))
    && (!expected.evidence || text.includes(expected.evidence))
    && (!expected.cognitiveLevel || question.cognitiveLevel === expected.cognitiveLevel);
  return valid ? [] : [{ id, actual: question, expected }];
});

const reverseJawiQuestions = questions.filter(question =>
  question.topicId === 'jawi_perkataan' && /Tulisan Jawi bagi perkataan Rumi/u.test(question.q)
);
const residualRiskPatterns = [
  /meminta doa kepada selain/iu,
  /Kebersihan ialah sebahagian daripada iman/iu,
  /Sebelum menyentuh mushaf, tangan hendaklah bersih/iu,
  /Doa (?:masuk|keluar) tandas dibaca (?:sebelum masuk|selepas keluar) _+/iu,
  /چيڬو/u
];
const residualRiskQuestions = questions.filter(question =>
  residualRiskPatterns.some(pattern => pattern.test(`${question.q} ${question.answer} ${question.explanation}`))
);

assert.equal(topics.length, 10, `Expected 10 Pendidikan Islam topics, received ${topics.length}.`);
assert.equal(questions.length, 500, `Expected 500 Pendidikan Islam questions, received ${questions.length}.`);
assert.equal(failures.length, 0, `Pendidikan Islam quality audit found ${failures.length} issue(s): ${JSON.stringify(failures.slice(0, 20))}`);
assert.equal(noteFailures.length, 0, `Pendidikan Islam learning notes are incomplete: ${JSON.stringify(noteFailures.map(topic => topic.id))}`);
assert.equal(expectationFailures.length, 0, `Pendidikan Islam content regressions found: ${JSON.stringify(expectationFailures)}`);
assert.equal(reverseJawiQuestions.length, 17, `Expected 17 productive Jawi-writing questions, received ${reverseJawiQuestions.length}.`);
assert.equal(residualRiskQuestions.length, 0, `Residual factual or trivial patterns remain: ${JSON.stringify(residualRiskQuestions.map(question => question.id))}`);
assert.deepEqual(
  Object.keys(cognitiveDistribution).sort(),
  ['menganalisis', 'mengaplikasi', 'memahami', 'mengingat', 'menilai'].sort(),
  'Pendidikan Islam bank must retain cognitive-level diversity from recall through evaluation.'
);

console.log(JSON.stringify({
  status: 'PASS',
  topicsChecked: topics.length,
  questionsChecked: questions.length,
  issueCount: failures.length,
  noteIssueCount: noteFailures.length,
  contentRegressionCount: expectationFailures.length,
  residualRiskCount: residualRiskQuestions.length,
  productiveJawiQuestions: reverseJawiQuestions.length,
  cognitiveDistribution,
  questionTypeDistribution
}, null, 2));
