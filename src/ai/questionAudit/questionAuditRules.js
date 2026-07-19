function normalizeText(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]+$/g, '')
    .replace(/\s+/g, ' ');
}

function countWords(value = '') {
  return normalizeText(value).split(' ').filter(Boolean).length;
}

function getQuestionText(question = {}) {
  return String(question.q || question.question || question.stem || '').trim();
}

function listAnswers(question = {}) {
  const answers = [];
  if (question.answer !== undefined && question.answer !== null) {
    const answer = String(question.answer).trim();
    if (answer) answers.push(answer);
  }
  for (const value of Array.isArray(question.accepted) ? question.accepted : []) {
    const answer = String(value ?? '').trim();
    if (answer) answers.push(answer);
  }
  for (const value of Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : []) {
    const answer = String(value ?? '').trim();
    if (answer) answers.push(answer);
  }
  return [...new Set(answers)];
}

function hasContext(text = '') {
  const value = String(text || '').trim();
  if (!value) return false;
  if (/[.!?]/.test(value)) return true;
  if (value.includes(':')) return true;
  if (/\b(berikut|di bawah|dalam ayat|dalam gambar|situasi|petikan|dialog|cerita|peta|jadual|graf|contoh)\b/i.test(value)) return true;
  return countWords(value) >= 8;
}

function hasInstruction(text = '') {
  return /\b(pilih|nyatakan|cari|apakah|siapakah|tandakan|bulatkan|isi|lengkapkan|padankan|senaraikan|jelaskan|bandingkan|ramalkan|kenal pasti|terangkan|kira|hitung)\b/i.test(String(text || ''));
}

function detectLanguage(text = '', subjectId = '') {
  const subject = String(subjectId || '').toLowerCase();
  if (subject === 'arab') return 'arabic';
  if (subject === 'english') return 'english';
  if (subject === 'sains') return 'science';
  if (subject === 'math') return 'math';
  return 'bm';
}

function splitAlternatives(answer = '') {
  return String(answer || '')
    .split(/[\/|;]/)
    .map(item => item.trim())
    .filter(Boolean);
}

const BM_AWKWARD = [
  /\bdi atas taman\b/i,
  /\bdi atas sekolah\b/i,
  /\bdi atas kelas\b/i,
  /\bdi atas pasar\b/i,
  /\bdi atas jalan\b/i,
  /\badalah ialah\b/i,
  /\bialah adalah\b/i,
  /\bkerana sebab\b/i
];

const ENGLISH_TENSE_HINT = /\b(go|goes|went|play|plays|played|eat|eats|ate|drink|drinks|drank)\b/i;
const ARABIC_RE = /[\u0600-\u06FF]/;
const SCIENCE_RISK = [
  /\bsemua haiwan boleh terbang\b/i,
  /\bsemua tumbuhan perlu banyak air\b/i,
  /\bmatahari berpusing mengelilingi bumi\b/i,
  /\bbunyi boleh bergerak tanpa medium\b/i
];
const MATH_UNIT_HINT = /\b(RM|sen|cm|m|kg|g|mL|L|jam|minit|saat)\b/i;

function isMathExpression(text = '') {
  const value = String(text || '');
  return /[0-9]/.test(value) && /[+\-×x÷=*/]/.test(value);
}

function detectQuestionCompleteness(question = {}) {
  const text = getQuestionText(question);
  const issues = [];
  const words = countWords(text);
  if (!text) return ['empty_question_text'];
  if (words < 2 && !isMathExpression(text)) issues.push('incomplete_sentence');
  if (/^(pilih|nyatakan|cari|isi|lengkapkan|padankan|kenal pasti|apakah|siapakah)\b/i.test(text) && words <= 4) {
    issues.push('missing_instruction');
  }
  if (hasInstruction(text) && !hasContext(text) && !isMathExpression(text) && words <= 6) {
    issues.push('missing_context');
  }
  if (/\.\.\.$/.test(text) || /,$/.test(text)) {
    issues.push('unfinished_phrase');
  }
  return [...new Set(issues)];
}

function detectAnswerQuality(question = {}) {
  const text = getQuestionText(question);
  const answer = String(question.answer ?? '').trim();
  const answers = listAnswers(question);
  const options = Array.isArray(question.options) ? question.options : Array.isArray(question.choices) ? question.choices : [];
  const issues = [];
  if (!answer && answers.length === 0 && !Number.isInteger(question.answerIndex) && !Number.isInteger(question.answer_index) && !Number.isInteger(question.correctIndex)) {
    issues.push('no_correct_answer');
  }
  if (answers.length > 1) {
    issues.push('multiple_possible_answers');
  }
  if (Array.isArray(options) && options.length) {
    const normalizedOptions = options.map(item => normalizeText(item)).filter(Boolean);
    const optionSet = new Set(normalizedOptions);
    if (answers.some(item => !optionSet.has(normalizeText(item)))) {
      issues.push('answer_not_matching_options');
    }
    if (optionSet.size !== normalizedOptions.length) {
      issues.push('duplicate_answer_options');
    }
    if (options.length > 1 && normalizedOptions.length < 3) {
      issues.push('unclear_distractors');
    }
  }
  if (!text && answer) issues.push('answer_without_question');
  return [...new Set(issues)];
}

function detectLanguageQuality(question = {}, subjectId = '') {
  const text = getQuestionText(question);
  const language = detectLanguage(text, subjectId);
  const issues = [];

  if (language === 'bm') {
    BM_AWKWARD.forEach(pattern => { if (pattern.test(text)) issues.push('awkward_malay_structure'); });
    if (countWords(text) > 28) issues.push('too_long');
    if (/\b(AI|engine|confidence|adaptive)\b/i.test(text)) issues.push('non_year2_wording');
  } else if (language === 'english') {
    if (countWords(text) > 24) issues.push('too_long');
    if (/\b(goed|eated|buyed|drinked)\b/i.test(text)) issues.push('incorrect_tense');
    if (/\b(he|she|it)\s+(go|play|drink|eat)\b/i.test(text)) issues.push('grammar_error');
  } else if (language === 'arabic') {
    const hasArabic = ARABIC_RE.test(text) || ARABIC_RE.test(String(question.answer || '')) || ARABIC_RE.test(listAnswers(question).join(' '));
    if (hasArabic && !ARABIC_RE.test(text)) issues.push('missing_arabic_text');
    if (hasArabic && !question.pronunciationGuide && !question.pronunciationTips && !question.readingSteps) issues.push('pronunciation_hint_missing');
    if (hasArabic && String(question.translation || question.translationHint || '').trim() === '') issues.push('translation_mismatch');
  } else if (language === 'science') {
    if (SCIENCE_RISK.some(pattern => pattern.test(text))) issues.push('inaccurate_concept');
  } else if (language === 'math') {
    const hasNumbers = /\b\d+\b/.test(text);
    const hasOperator = /[+\-×x÷=*/]/.test(text);
    const mentionsUnit = MATH_UNIT_HINT.test(text) || MATH_UNIT_HINT.test(String(question.answer || ''));
    if (hasNumbers && !hasOperator && !/\b(berapakah|jumlah|baki|hasil|jawapan|nilai|berapa)\b/i.test(text)) {
      issues.push('ambiguous_operation');
    }
    if (hasNumbers && !mentionsUnit && /\b(RM|sen|cm|m|kg|g|mL|L|jam|minit|saat)\b/i.test(String(question.topicId || '')) === false) {
      // Ignore plain arithmetic questions; only flag unit issues when the question is clearly unit-based.
      if (/\b(wang|masa|panjang|jisim|isi padu)\b/i.test(text)) {
        issues.push('missing_unit');
      }
    }
    if (!hasNumbers && !hasContext(text) && /\b(kira|hitung|jumlah|baki|darab|bahagi|tambah|tolak)\b/i.test(text)) {
      issues.push('too_easy_or_ambiguous');
    }
    if (countWords(text) > 30) issues.push('too_long');
  }

  return [...new Set(issues)];
}

function detectDifficultyQuality(question = {}, subjectId = '') {
  const text = getQuestionText(question);
  const issues = [];
  const words = countWords(text);
  if (subjectId === 'math') {
    if (/\b(berikan sebab|bandingkan|mengapa|terangkan)\b/i.test(text) && !hasContext(text)) issues.push('kbat_without_enough_information');
  } else if (subjectId === 'bm' || subjectId === 'english' || subjectId === 'sains') {
    if (words < 2 && !isMathExpression(text)) issues.push('too_easy');
    if (words > 30) issues.push('too_difficult');
  }
  if (/\b(kbat|kb at|KBAT)\b/i.test(text) && !hasContext(text) && words <= 8) {
    issues.push('kbat_without_enough_information');
  }
  return [...new Set(issues)];
}

function detectRepetitionQuality(question = {}, state = {}) {
  const text = normalizeText(getQuestionText(question));
  const answerPattern = normalizeText(listAnswers(question).join('|'));
  const template = String(question.qip?.metadata?.templateId || question.templateId || question.questionStyle || '').trim();
  const issues = [];
  if (!text) return issues;
  const recentTexts = Array.isArray(state.recentTexts) ? state.recentTexts : [];
  const recentAnswers = Array.isArray(state.recentAnswers) ? state.recentAnswers : [];
  const recentTemplates = Array.isArray(state.recentTemplates) ? state.recentTemplates : [];
  if (recentTexts.includes(text)) issues.push('identical_question_text');
  if (answerPattern && recentAnswers.includes(answerPattern)) issues.push('same_answer_pattern_repeated');
  if (template && recentTemplates.filter(item => item === template).length >= 3) issues.push('same_wording_template_too_frequent');
  return [...new Set(issues)];
}

function classifySeverity(issues = []) {
  const set = new Set(issues);
  if (set.has('empty_question_text') || set.has('no_correct_answer')) return 'Critical';
  if (set.has('answer_not_matching_options') || set.has('duplicate_answer_options') || set.has('inaccurate_concept') || set.has('missing_arabic_text')) return 'High';
  if (set.has('multiple_possible_answers') || set.has('grammar_error') || set.has('incorrect_tense') || set.has('ambiguous_operation') || set.has('kbat_without_enough_information') || set.has('missing_instruction')) return 'Medium';
  if (issues.length > 0) return 'Low';
  return 'Low';
}

function qualityScoreFromIssues(issues = []) {
  let score = 100;
  for (const issue of issues) {
    if (issue === 'empty_question_text' || issue === 'no_correct_answer') score -= 40;
    else if (issue === 'answer_not_matching_options' || issue === 'duplicate_answer_options' || issue === 'inaccurate_concept' || issue === 'missing_arabic_text') score -= 20;
    else if (issue === 'multiple_possible_answers' || issue === 'grammar_error' || issue === 'incorrect_tense' || issue === 'ambiguous_operation' || issue === 'kbat_without_enough_information' || issue === 'missing_instruction') score -= 10;
    else score -= 3;
  }
  return Math.max(0, score);
}

export {
  classifySeverity,
  countWords,
  detectAnswerQuality,
  detectDifficultyQuality,
  detectLanguageQuality,
  detectQuestionCompleteness,
  detectRepetitionQuality,
  getQuestionText,
  hasContext,
  hasInstruction,
  isMathExpression,
  listAnswers,
  normalizeText,
  qualityScoreFromIssues,
  splitAlternatives
};

export default {
  classifySeverity,
  countWords,
  detectAnswerQuality,
  detectDifficultyQuality,
  detectLanguageQuality,
  detectQuestionCompleteness,
  detectRepetitionQuality,
  getQuestionText,
  hasContext,
  hasInstruction,
  isMathExpression,
  listAnswers,
  normalizeText,
  qualityScoreFromIssues,
  splitAlternatives
};
