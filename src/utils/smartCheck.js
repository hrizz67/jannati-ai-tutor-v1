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
  const user = normalizeAnswer(userAnswer);

  if (!user) {
    return { status: 'wrong', title: 'Belum jawab', message: 'Tulis jawapan dahulu ya.' };
  }

  if (isAcceptedQuestionAnswer(user, question)) {
    return { status: 'correct', title: 'Betul!', message: 'Jawapan kamu diterima.' };
  }

  return { status: 'wrong', title: 'Belum tepat', message: 'Cuba semak semula jawapan kamu.' };
}
