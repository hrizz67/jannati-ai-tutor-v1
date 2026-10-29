function normalizeToken(value = '') {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateWritingFillBlankTask(task = {}) {
  const prompt = typeof task?.prompt === 'string' ? task.prompt.trim() : '';
  const blankCount = [...prompt.matchAll(/_{3,}/gu)].length;
  const acceptedTokens = [...new Set(
    (Array.isArray(task?.acceptedTokens) ? task.acceptedTokens : [])
      .map(normalizeToken)
      .filter(Boolean)
  )];
  const reason = !prompt
    ? 'missing-prompt'
    : blankCount === 0
      ? 'missing-blank'
      : blankCount > 1
        ? 'multiple-blanks'
        : acceptedTokens.length === 0
          ? 'missing-accepted-token'
          : '';
  return {
    valid: !reason,
    reason,
    prompt,
    blankCount,
    acceptedTokens
  };
}

export function scoreWritingFillBlank(task = {}, answer = '') {
  const contract = validateWritingFillBlankTask(task);
  if (!contract.valid) {
    return {
      status: 'unavailable',
      score: 0,
      matched: [],
      totalKeywords: 0,
      metricLabel: 'perkataan sasaran',
      spellingIssues: [],
      grammarPetunjuks: [],
      explanation: '',
      message: 'Latihan isi tempat kosong ini belum mempunyai ayat dan jawapan yang sah.',
      errorCode: contract.reason
    };
  }

  const normalizedAnswer = normalizeToken(answer);
  const correct = Boolean(normalizedAnswer) && contract.acceptedTokens.includes(normalizedAnswer);
  return {
    status: 'completed',
    score: correct ? 100 : 0,
    matched: correct ? [normalizedAnswer] : [],
    totalKeywords: 1,
    metricLabel: 'perkataan sasaran',
    spellingIssues: [],
    grammarPetunjuks: [],
    explanation: correct
      ? 'Bagus. Perkataan itu melengkapkan ayat dengan tepat.'
      : 'Cuba baca seluruh ayat dan pilih satu perkataan yang melengkapkan maksudnya.',
    correct
  };
}
