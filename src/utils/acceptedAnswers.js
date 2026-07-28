export function normalizeAcceptedAnswer(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[.,!?;:()[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function getAcceptedAnswers(question = {}) {
  const values = [
    question?.answer,
    ...(Array.isArray(question?.accepted) ? question.accepted : []),
    ...(Array.isArray(question?.acceptedAnswers) ? question.acceptedAnswers : [])
  ];
  const seen = new Set();
  return values.map(value => String(value ?? '').trim()).filter(value => {
    const key = normalizeAcceptedAnswer(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isAcceptedQuestionAnswer(answer, question = {}) {
  const candidate = normalizeAcceptedAnswer(answer);
  return Boolean(candidate && getAcceptedAnswers(question).some(value => normalizeAcceptedAnswer(value) === candidate));
}

export default { getAcceptedAnswers, isAcceptedQuestionAnswer, normalizeAcceptedAnswer };
