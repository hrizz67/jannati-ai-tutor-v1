// Only the fill-blank scorer uses this normalization. Arabic hamza/maddah
// distinguish authored words and must not disappear with optional vowel marks.
function normalizeToken(value = '') {
  const raw = String(value || '');
  const arabicScript = /\p{Script=Arabic}/u.test(raw);
  const normalized = arabicScript
    ? raw.normalize('NFD')
      // Remove optional vowel/tanwin/shadda/sukun and superscript alef only.
      // Keep U+0653..0655: maddah, hamza above and hamza below.
      .replace(/[\u064B-\u0652\u0670]/gu, '')
      .normalize('NFC')
    : raw.normalize('NFKD').replace(/\p{M}/gu, '');
  return normalized
    .toLowerCase()
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
