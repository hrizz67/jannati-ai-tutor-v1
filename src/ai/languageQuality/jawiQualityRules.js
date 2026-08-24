function normalizeText(value = '') {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function hasArabicOrJawiScript(value = '') {
  return /[\u0600-\u06FF]/.test(String(value || ''));
}

function extractRumiWord(question = {}) {
  const direct = normalizeText(question.rumiWord);
  if (direct) return direct;
  const answer = normalizeText(question.answer);
  if (answer && !hasArabicOrJawiScript(answer)) return answer;
  const match = normalizeText(question.q || question.question).match(/"([^"]+)"/);
  if (match?.[1]) return match[1];
  return '';
}

function extractJawiAnswer(question = {}) {
  const direct = normalizeText(question.jawiText || question.jawiAnswer);
  if (direct) return direct;
  const answer = normalizeText(question.answer);
  if (answer && hasArabicOrJawiScript(answer)) return answer;
  const stem = normalizeText(question.q || question.question);
  const match = stem.match(/([\u0600-\u06FF]+)/);
  return match?.[1] ? match[1] : '';
}

function getJawiSuggestion(issueType = '') {
  const type = String(issueType || '').trim();
  if (type === 'multiple_possible_answers') return 'Tambah jawapan standard atau pilihan jawapan jelas';
  if (type === 'missing_jawi_text') return 'Tambah teks Jawi yang lengkap';
  if (type === 'incorrect_word_mapping') return 'Semak padanan Rumi-Jawi';
  if (type === 'inconsistent_spelling') return 'Seragamkan ejaan Jawi';
  return 'Semak ejaan dan sokongan pembelajaran Jawi';
}

function getJawiRepairSuggestion(issueType = '') {
  return getJawiSuggestion(issueType);
}

function getJawiLearningImpact(issueType = '') {
  const type = String(issueType || '').trim();
  if (type === 'multiple_possible_answers') return 'Learner may not know which Jawi spelling is expected.';
  if (type === 'missing_jawi_text') return 'Learner lacks the Jawi form needed to answer.';
  if (type === 'incorrect_word_mapping') return 'Rumi-Jawi mapping may be misleading.';
  if (type === 'inconsistent_spelling') return 'Spelling consistency in Jawi may confuse the learner.';
  return 'Jawi learning support needs review.';
}

function classifyJawiSeverity(issueType = '') {
  const type = String(issueType || '').trim();
  if (type === 'missing_jawi_text') return 'Critical';
  if (type === 'incorrect_word_mapping') return 'High';
  if (type === 'multiple_possible_answers') return 'High';
  if (type === 'inconsistent_spelling') return 'Medium';
  return 'Low';
}

function detectJawiIssues(question = {}) {
  const issues = [];
  const q = normalizeText(question.question || question.q);
  const rumiWord = extractRumiWord(question);
  const jawiAnswer = extractJawiAnswer(question);
  const accepted = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [];
  if (!jawiAnswer) issues.push('missing_jawi_text');
  if (!rumiWord) issues.push('missing_rumi_reference');
  if (accepted.length > 1) issues.push('multiple_possible_answers');
  if (accepted.length && accepted.some(item => normalizeText(item) !== normalizeText(accepted[0]))) issues.push('inconsistent_spelling_format');
  if (!q || q.length < 10) issues.push('incomplete_jawi_question');
  return [...new Set(issues)];
}

function normalizeJawiQuestion(question = {}) {
  const acceptedAnswers = Array.isArray(question.acceptedAnswers)
    ? question.acceptedAnswers
    : Array.isArray(question.accepted)
      ? question.accepted
      : [];
  const jawiText = extractJawiAnswer(question);
  return {
    question: normalizeText(question.question || question.q),
    rumiWord: extractRumiWord(question),
    jawiText,
    jawiAnswer: jawiText,
    acceptedAnswers: [...new Set(acceptedAnswers.map(item => normalizeText(item)).filter(Boolean))],
    pronunciationHint: normalizeText(question.pronunciationHint || question.hint || ''),
    explanation: normalizeText(question.explanation || ''),
    commonMistake: normalizeText(question.commonMistake || question.mistake || ''),
    memoryTip: normalizeText(question.memoryTip || question.tip || '')
  };
}

function hasJawiScript(value = '') {
  return hasArabicOrJawiScript(value);
}

export {
  classifyJawiSeverity,
  detectJawiIssues,
  extractJawiAnswer,
  extractRumiWord,
  getJawiLearningImpact,
  getJawiRepairSuggestion,
  getJawiSuggestion,
  hasArabicOrJawiScript,
  hasJawiScript,
  normalizeJawiQuestion,
  normalizeText
};

export default {
  classifyJawiSeverity,
  detectJawiIssues,
  extractJawiAnswer,
  extractRumiWord,
  getJawiLearningImpact,
  getJawiRepairSuggestion,
  getJawiSuggestion,
  hasArabicOrJawiScript,
  hasJawiScript,
  normalizeJawiQuestion,
  normalizeText
};
