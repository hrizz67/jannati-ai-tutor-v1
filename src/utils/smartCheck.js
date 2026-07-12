export function normalizeAnswer(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]+$/g, '')
    .replace(/\s+/g, ' ');
}

export function smartCheck(userAnswer, question) {
  const user = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(question?.answer);
  const accepted = Array.isArray(question?.accepted) ? question.accepted.map(normalizeAnswer) : [];

  if (!user) {
    return { status: 'wrong', title: 'Belum jawab', message: 'Tulis jawapan dahulu ya.' };
  }

  if (user === correct || accepted.some(answer => answer === user)) {
    return { status: 'correct', title: 'Betul!', message: 'Jawapan kamu diterima.' };
  }

  return { status: 'wrong', title: 'Belum tepat', message: 'Cuba semak semula jawapan kamu.' };
}
