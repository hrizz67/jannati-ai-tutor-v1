import { getAcceptedAnswers, isAcceptedQuestionAnswer, normalizeAcceptedAnswer } from './acceptedAnswers.js';

export function normalizeAnswer(value) {
  return normalizeAcceptedAnswer(value);
}

export function isAcceptedAnswer(answer, acceptedAnswers = []) {
  const normalizedAnswer = normalizeAnswer(answer);
  if (!normalizedAnswer) return false;
  return (Array.isArray(acceptedAnswers) ? acceptedAnswers : [])
    .map(normalizeAnswer)
    .filter(Boolean)
    .some(candidate => candidate === normalizedAnswer);
}

export function smartCheck(userAnswer, question) {
  const user = String(userAnswer ?? '').normalize('NFKC').trim();

  if (!user) {
    return { status: 'wrong', title: 'Belum jawab', message: 'Tulis jawapan dahulu ya.' };
  }

  // Preserve casing and punctuation for question-specific checks. Eager
  // normalization would turn valid symbols such as "." into an empty value
  // and remove evidence required by creative sentence rubrics.
  if (isAcceptedQuestionAnswer(user, question)) {
    return { status: 'correct', title: 'Betul!', message: 'Jawapan kamu diterima.' };
  }

  return { status: 'wrong', title: 'Belum tepat', message: 'Cuba semak semula jawapan kamu.' };
}
