const NORMALIZE_RE = /[.,!?;:]+$/g;

export function normalizeText(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(NORMALIZE_RE, '')
    .replace(/\s+/g, ' ');
}

export function splitWords(value = '') {
  return normalizeText(value)
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean);
}

export function countWords(value = '') {
  return splitWords(value).length;
}

export function hasSentenceContext(text = '') {
  const value = String(text || '').trim();
  if (!value) return false;
  if (/[.!?]/.test(value)) return true;
  if (value.includes(':')) return true;
  if (/\b(berikut|di bawah|dalam ayat|dalam gambar|daripada ayat ini|di dalam ayat)\b/i.test(value)) return true;
  return countWords(value) >= 8;
}

const INSTRUCTION_PATTERNS = [
  /\bpilih\b/i,
  /\bnyatakan\b/i,
  /\bcari\b/i,
  /\bapakah\b/i,
  /\bsiapakah\b/i,
  /\btandakan\b/i,
  /\bbulatkan\b/i,
  /\bisi\b/i,
  /\blengkapkan\b/i,
  /\bpadankan\b/i,
  /\bsenaraikan\b/i,
  /\bjelaskan\b/i,
  /\bbandingkan\b/i,
  /\bramalkan\b/i,
  /\bterangkan\b/i,
  /\bkenal pasti\b/i,
  /\bpilih jawapan terbaik\b/i,
  /\bpilih jawapan yang betul\b/i
];

export function hasInstruction(text = '') {
  const value = String(text || '');
  return INSTRUCTION_PATTERNS.some(pattern => pattern.test(value));
}

const AWKWARD_PHRASES = [
  /\bdi atas taman\b/i,
  /\bdi atas taman mangga\b/i,
  /\bdi atas sekolah\b/i,
  /\bdi atas kelas\b/i,
  /\bdi atas pasar\b/i,
  /\bdi atas jalan\b/i,
  /\bdi atas padang\b/i,
  /\badalah ialah\b/i,
  /\bialah adalah\b/i,
  /\bdi mana\s+yang\b/i,
  /\bkerana\s+sebab\b/i,
  /\bmasing-masing\b.*\bsemua\b/i
];

const GENERIC_PATTERNS = [
  /\bpilih kata nama\b/i,
  /\bnyatakan kata nama\b/i,
  /\bcari kata nama am\b/i,
  /\bisi tempat kosong\b/i,
  /\bjawapan di atas\b/i
];

export function detectMalayLanguageIssues(text = '') {
  const value = String(text || '').trim();
  const issues = [];
  if (!value) {
    issues.push('empty_text');
    return issues;
  }
  if (countWords(value) < 3) issues.push('too_short');
  if (countWords(value) < 6 && !hasSentenceContext(value)) issues.push('no_context');
  if (AWKWARD_PHRASES.some(pattern => pattern.test(value))) issues.push('awkward_phrase');
  if (GENERIC_PATTERNS.some(pattern => pattern.test(value)) && !hasSentenceContext(value)) issues.push('generic_template');
  if (/\b(\w+)\b(?:\s+\1){1,}/i.test(value)) issues.push('repeated_word');
  if (/\s{2,}/.test(value)) issues.push('extra_spaces');
  if (/^[a-z]/.test(value) && countWords(value) > 3) issues.push('capitalisation');
  return [...new Set(issues)];
}

function normalizeList(items = []) {
  return (Array.isArray(items) ? items : [])
    .map(item => String(item ?? '').trim())
    .filter(Boolean);
}

export function inferAnswerType(question = {}) {
  const declared = String(question.answerType || question.qip?.metadata?.answerType || '').trim().toLowerCase();
  const acceptedAnswers = normalizeList(question.acceptedAnswers || question.accepted);
  const answer = String(question.answer ?? '').trim();
  if (declared) return declared;
  if (acceptedAnswers.length > 1) return 'multiple_answer';
  if (acceptedAnswers.length === 1 && answer) return 'single_answer';
  if (acceptedAnswers.length > 0 && !answer) return 'multiple_answer';
  if (/^\s*$/.test(answer)) return 'open_answer';
  if (/[\/;|]/.test(answer) && answer.split(/[\/;|]/).map(item => item.trim()).filter(Boolean).length > 1) return 'multiple_answer';
  return 'single_answer';
}

export function buildAcceptedAnswers(question = {}) {
  const raw = [
    ...normalizeList(question.acceptedAnswers),
    ...normalizeList(question.accepted),
    ...(question.answer !== undefined && question.answer !== null ? [String(question.answer).trim()] : [])
  ];
  return [...new Set(raw.filter(Boolean))];
}

export function inferQuestionStyle(question = {}, text = '') {
  const value = String(text || question.q || question.question || '').trim();
  const normalized = normalizeText(value);
  if (!normalized) return 'identify';
  if (/\bpadankan\b|\bmatch\b/i.test(value)) return 'matching';
  if (/\bisi tempat kosong\b|\blengkapkan\b|\bisi\b.*\bkosong\b/i.test(value) || /_{3,}/.test(value)) return 'fill_blank';
  if (/\bbandingkan\b|\bmengapa\b|\bkenapa\b|\bramalkan\b|\bjelaskan\b|\bhuraikan\b|\bpaling sesuai\b|\bpilih jawapan terbaik\b|\bpilih jawapan yang paling sesuai\b/i.test(value)) {
    return 'KBAT';
  }
  if (/\b(situasi|keadaan|cerita|gambar|gambar rajah|baca ayat|ayat berikut|perhatikan)\b/i.test(value)) return 'scenario';
  if (/\b(aplikasi|gunakan|amalkan|praktis|praktik)\b/i.test(value)) return 'application';
  if (/\b(tandakan|bulatkan|cari|nyatakan|pilih|kenal pasti|siapakah|apakah)\b/i.test(value)) return 'identify';
  return 'identify';
}

export function inferDifficulty(question = {}, text = '') {
  const value = String(text || question.q || question.question || '').trim();
  const style = inferQuestionStyle(question, value);
  const provided = String(question.difficulty || question.qip?.metadata?.difficulty || '').trim().toLowerCase();
  if (provided) {
    if (['easy', 'mudah'].includes(provided)) return 'easy';
    if (['medium', 'sederhana'].includes(provided)) return 'medium';
    if (['hard', 'sukar'].includes(provided)) return 'hard';
    if (['kbat', 'kb_at'].includes(provided)) return 'KBAT';
  }
  if (style === 'KBAT') return 'KBAT';
  if (style === 'scenario' || style === 'application' || style === 'fill_blank') return 'medium';
  if (style === 'matching') return 'medium';
  if (countWords(value) <= 8) return 'easy';
  return 'medium';
}

export function alignDifficulty(provided = '', inferred = '') {
  const left = String(provided || '').trim().toLowerCase();
  const right = String(inferred || '').trim().toLowerCase();
  if (!left && !right) return 100;
  if (!left || !right) return 80;
  if (left === right) return 100;
  const easySet = new Set(['easy', 'mudah']);
  const mediumSet = new Set(['medium', 'sederhana']);
  const hardSet = new Set(['hard', 'sukar']);
  const kbatSet = new Set(['kbat']);
  const groups = [easySet, mediumSet, hardSet, kbatSet];
  const sameGroup = groups.some(group => group.has(left) && group.has(right));
  if (sameGroup) return 85;
  return 45;
}

export function consecutiveStyleCount(recentStyles = [], style = '') {
  const normalizedStyle = String(style || '').trim().toLowerCase();
  let count = 0;
  for (let index = Array.isArray(recentStyles) ? recentStyles.length - 1 : -1; index >= 0; index -= 1) {
    const recent = String(recentStyles[index] || '').trim().toLowerCase();
    if (!recent || recent !== normalizedStyle) break;
    count += 1;
  }
  return count;
}

export function scoreDiversity(question = {}, context = {}) {
  const style = inferQuestionStyle(question, context.text);
  const templateId = String(question.qip?.metadata?.templateId || question.templateId || '');
  const recentStyles = Array.isArray(context.recentStyles) ? context.recentStyles : [];
  const recentTemplates = Array.isArray(context.recentTemplates) ? context.recentTemplates : [];
  const recentQuestionIds = Array.isArray(context.recentQuestionIds) ? context.recentQuestionIds : [];

  const repeatedStylePenalty = Math.max(0, consecutiveStyleCount(recentStyles, style) - 1) * 15;
  const repeatedTemplatePenalty = Math.max(0, consecutiveStyleCount(recentTemplates, templateId) - 1) * 20;
  const repeatedQuestionPenalty = recentQuestionIds.includes(String(question.id || question.questionId || '')) ? 25 : 0;

  return Math.max(0, 100 - repeatedStylePenalty - repeatedTemplatePenalty - repeatedQuestionPenalty);
}

export function normalizeDifficultyLabel(value = '') {
  return inferDifficulty({ difficulty: value }, value);
}

export default {
  alignDifficulty,
  buildAcceptedAnswers,
  countWords,
  detectMalayLanguageIssues,
  hasInstruction,
  hasSentenceContext,
  inferAnswerType,
  inferDifficulty,
  inferQuestionStyle,
  normalizeDifficultyLabel,
  normalizeText,
  scoreDiversity,
  splitWords
};
