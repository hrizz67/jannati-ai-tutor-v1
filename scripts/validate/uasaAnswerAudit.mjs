import assert from 'node:assert/strict';
import { getAcceptedAnswers, getQuestionAnswerDisplay, isAcceptedQuestionAnswer } from '../../src/utils/acceptedAnswers.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const question = {
  id: 'BM-AYAT-001',
  q: 'Kenal pasti jenis ayat bagi ayat ini: Siapakah nama kamu?',
  answer: 'Ayat tanya kerana ayat itu bertanya nama.',
  accepted: ['Ayat tanya kerana ayat itu bertanya nama.']
};

const accepted = getAcceptedAnswers(question);
assert.ok(accepted.includes('ayat tanya'), 'UASA must accept the short sentence category');
assert.equal(isAcceptedQuestionAnswer('ayat tanya', question), true);
assert.equal(getQuestionAnswerDisplay(question), 'ayat tanya');

const nounPhraseQuestion = {
  q: 'Baca ayat berikut: Aina membantu ibu mengemas meja makan keluarga. Apakah perkataan bagi benda yang disebut?',
  answer: 'meja makan keluarga',
  accepted: ['meja makan keluarga']
};
assert.equal(isAcceptedQuestionAnswer('meja makan', nounPhraseQuestion), true);

const punctuationQuestions = [
  ['Lengkapkan ayat ini dengan tanda baca yang sesuai: Wah, cantiknya bunga itu___', 'Wah, cantiknya bunga itu!', '!'],
  ['Lengkapkan ayat ini dengan tanda baca yang sesuai: Siapakah nama kamu___', 'Siapakah nama kamu?', '?'],
  ['Lengkapkan ayat ini dengan tanda baca yang sesuai: Sila duduk dengan tertib___', 'Sila duduk dengan tertib.', '.']
];
for (const [q, answer, symbol] of punctuationQuestions) {
  const punctuationQuestion = { q, answer };
  assert.equal(isAcceptedQuestionAnswer(symbol, punctuationQuestion), true, `must accept ${symbol} for ${q}`);
  assert.equal(smartCheck(symbol, punctuationQuestion).status, 'correct', `quiz must accept ${symbol} for ${q}`);
  assert.equal(getQuestionAnswerDisplay(punctuationQuestion), symbol, `must display ${symbol} for ${q}`);
}

console.log('UASA answer audit: PASS');
