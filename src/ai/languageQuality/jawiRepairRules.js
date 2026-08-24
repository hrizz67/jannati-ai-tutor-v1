function normalizeText(value = '') {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function hasArabicOrJawiScript(value = '') {
  return /[\u0600-\u06FF]/.test(String(value || ''));
}

function extractRumiWord(question = {}) {
  const direct = normalizeText(question.rumiWord);
  if (direct) return direct;
  const answer = normalizeText(question.answer);
  if (answer && !hasArabicOrJawiScript(answer)) return answer;
  const match = normalizeText(question.q).match(/"([^"]+)"/);
  if (match?.[1]) return match[1];
  return '';
}

function extractJawiAnswer(question = {}) {
  const direct = normalizeText(question.jawiText || question.jawiAnswer);
  if (direct) return direct;
  const answer = normalizeText(question.answer);
  if (answer && hasArabicOrJawiScript(answer)) return answer;
  const stem = normalizeText(question.q);
  const match = stem.match(/([\u0600-\u06FF]+)/);
  return match?.[1] ? match[1] : '';
}

function detectJawiIssues(question = {}) {
  const issues = [];
  const q = normalizeText(question.q || question.question);
  const rumiWord = extractRumiWord(question);
  const jawiAnswer = extractJawiAnswer(question);
  const accepted = Array.isArray(question.acceptedAnswers)
    ? question.acceptedAnswers
    : Array.isArray(question.accepted)
      ? question.accepted
      : [];

  if (!jawiAnswer) issues.push('missing_jawi_text');
  if (!rumiWord) issues.push('missing_rumi_reference');
  if (accepted.length > 1) issues.push('multiple_possible_answers');
  if (accepted.length && accepted.some(item => normalizeText(item) !== normalizeText(accepted[0]))) {
    issues.push('inconsistent_spelling_format');
  }
  if (q.includes('...') || q.length < 10) issues.push('incomplete_jawi_question');
  if (!hasArabicOrJawiScript(q) && !hasArabicOrJawiScript(jawiAnswer)) issues.push('missing_jawi_text');
  return [...new Set(issues)];
}

function getJawiRepairSuggestion(issueType = '') {
  const type = String(issueType || '').trim();
  if (type === 'multiple_possible_answers') return 'Tambah jawapan standard atau pilihan jawapan jelas';
  if (type === 'missing_rumi_reference') return 'Tambah rujukan Rumi yang jelas';
  if (type === 'missing_jawi_text') return 'Tambah teks Jawi yang lengkap';
  if (type === 'inconsistent_spelling_format') return 'Seragamkan ejaan Jawi';
  if (type === 'incomplete_jawi_question') return 'Lengkapkan stem soalan Jawi';
  return 'Semak ejaan dan sokongan pembelajaran Jawi';
}

function getJawiLearningImpact(issueType = '') {
  const type = String(issueType || '').trim();
  if (type === 'multiple_possible_answers') return 'Learner may be unsure which answer is expected.';
  if (type === 'missing_rumi_reference') return 'Learner lacks a Roman script reference for mapping.';
  if (type === 'missing_jawi_text') return 'Learner cannot see the Jawi form needed to answer.';
  if (type === 'inconsistent_spelling_format') return 'Different spellings may confuse the learner.';
  if (type === 'incomplete_jawi_question') return 'Question stem may not give enough context.';
  return 'Jawi learning support needs review.';
}

function classifyJawiSeverity(issueType = '') {
  const type = String(issueType || '').trim();
  if (type === 'missing_jawi_text') return 'Critical';
  if (type === 'multiple_possible_answers' || type === 'missing_rumi_reference') return 'High';
  if (type === 'inconsistent_spelling_format' || type === 'incomplete_jawi_question') return 'Medium';
  return 'Low';
}

function normalizeJawiQuestion(question = {}) {
  const rumiWord = extractRumiWord(question);
  const jawiText = extractJawiAnswer(question);
  const acceptedAnswers = Array.isArray(question.acceptedAnswers)
    ? question.acceptedAnswers
    : Array.isArray(question.accepted)
      ? question.accepted
      : jawiText
        ? [jawiText]
        : [];

  return {
    question: normalizeText(question.q || question.question),
    rumiWord,
    jawiText,
    jawiAnswer: jawiText,
    acceptedAnswers: [...new Set(acceptedAnswers.map(item => normalizeText(item)).filter(Boolean))],
    pronunciationHint: normalizeText(question.pronunciationHint || question.hint || ''),
    explanation: normalizeText(question.explanation || ''),
    commonMistake: normalizeText(question.commonMistake || question.mistake || ''),
    memoryTip: normalizeText(question.memoryTip || question.tip || '')
  };
}

export {
  classifyJawiSeverity,
  detectJawiIssues,
  extractJawiAnswer,
  extractRumiWord,
  getJawiLearningImpact,
  getJawiRepairSuggestion,
  hasArabicOrJawiScript,
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
  hasArabicOrJawiScript,
  normalizeJawiQuestion,
  normalizeText
};
