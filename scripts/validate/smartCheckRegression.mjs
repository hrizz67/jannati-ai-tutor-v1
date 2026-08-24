import assert from 'node:assert/strict';
import { smartCheck, normalizeAnswer } from '../../src/utils/smartCheck.js';
import { getAcceptedAnswers, isAcceptedQuestionAnswer } from '../../src/utils/acceptedAnswers.js';
import { loadAllSubjects } from '../../src/data/subjects/index.js';

const makeQuestion = (answer, accepted = []) => ({ answer, accepted });

const cases = [
  ['mereka', true],
  [' Mereka  ', true],
  ['mereka.', true],
  ['me', false],
  ['mer', false],
  ['merek', false],
  ['dia', false],
  ['kami', false],
  ['mereka semua', false]
];

for (const [answer, expected] of cases) {
  const result = smartCheck(answer, makeQuestion('mereka'));
  assert.equal(result.status === 'correct', expected, `Case failed for ${answer}`);
}

assert.equal(smartCheck('pa', makeQuestion('padang')).status, 'wrong');
assert.equal(smartCheck('pad', makeQuestion('padang')).status, 'wrong');
assert.equal(smartCheck('padang', makeQuestion('padang')).status, 'correct');

assert.equal(smartCheck('bu', makeQuestion('buku')).status, 'wrong');
assert.equal(smartCheck('buku', makeQuestion('buku')).status, 'correct');

assert.equal(normalizeAnswer(' Mereka. '), 'mereka');

const punctuationCases = [
  ['.', 'Sila duduk dengan tertib.'],
  ['?', 'Siapakah nama kamu?'],
  ['!', 'Wah, cantiknya bunga itu!']
];

for (const [symbol, completedSentence] of punctuationCases) {
  const punctuationQuestion = {
    q: `Lengkapkan ayat ini dengan tanda baca yang sesuai: ${completedSentence.slice(0, -1)}___`,
    answer: completedSentence,
    accepted: [completedSentence]
  };
  assert.equal(smartCheck(symbol, punctuationQuestion).status, 'correct', `Quiz submission must accept ${symbol}.`);
}

const punctuationQuestion = {
  q: 'Lengkapkan ayat ini dengan tanda baca yang sesuai: Sila duduk dengan tertib___',
  answer: 'Sila duduk dengan tertib.',
  accepted: ['Sila duduk dengan tertib.']
};
assert.equal(smartCheck('?', punctuationQuestion).status, 'wrong', 'A different punctuation mark must remain wrong.');
assert.equal(smartCheck('   ', punctuationQuestion).status, 'wrong', 'Whitespace-only input must remain empty.');

const creativeQuestion = {
  q: "Mencipta: Bina ayat lengkap menggunakan kata 'Aina' dan 'membaca'.",
  answer: 'Aina membaca buku cerita di ruang tamu.',
  cognitiveLevel: 'mencipta',
  rubric: { criteria: [{}, {}, {}] }
};
assert.equal(smartCheck('Aina membaca majalah di perpustakaan.', creativeQuestion).status, 'correct', 'A valid original sentence must retain casing and punctuation evidence.');
assert.equal(smartCheck('aina membaca majalah di perpustakaan.', creativeQuestion).status, 'wrong', 'Creative sentence capitalization remains required.');
assert.equal(smartCheck('Aina membaca majalah di perpustakaan', creativeQuestion).status, 'wrong', 'Creative sentence terminal punctuation remains required.');

const subjects = await loadAllSubjects();
const submissionMismatches = [];
let directAcceptedVariants = 0;
let oneCharacterVariants = 0;

for (const subject of subjects) {
  for (const topic of subject.topics || []) {
    for (const question of topic.questions || []) {
      for (const acceptedAnswer of getAcceptedAnswers(question)) {
        const rawAnswer = String(acceptedAnswer ?? '').trim();
        if (!rawAnswer || !isAcceptedQuestionAnswer(rawAnswer, question)) continue;
        directAcceptedVariants += 1;
        if ([...rawAnswer].length === 1) oneCharacterVariants += 1;
        if (smartCheck(rawAnswer, question).status !== 'correct') {
          submissionMismatches.push({
            subjectId: subject.id,
            topicId: topic.id,
            questionId: question.id,
            acceptedAnswer: rawAnswer
          });
        }
      }
    }
  }
}

assert.deepEqual(submissionMismatches, [], `Quiz submission disagrees with the canonical matcher: ${JSON.stringify(submissionMismatches.slice(0, 20))}`);

console.log(`smartCheck regression tests passed: ${directAcceptedVariants} accepted variants, ${oneCharacterVariants} one-character variants.`);
