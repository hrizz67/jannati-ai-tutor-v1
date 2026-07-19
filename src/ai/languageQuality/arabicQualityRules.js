function normalizeText(value = '') {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function getArabicSuggestion(issueType = '') {
  const type = String(issueType || '').trim();
  if (type === 'missing_arabic_text') return 'Tambah tulisan Arab asal';
  if (type === 'pronunciation_hint_missing') return 'Tambah cara sebutan / transliterasi';
  if (type === 'translation_mismatch') return 'Semak maksud Arab-BM';
  if (type === 'missing_example') return 'Tambah contoh penggunaan Arab';
  return 'Semak struktur pembelajaran Arab';
}

function getArabicLearningImpact(issueType = '') {
  const type = String(issueType || '').trim();
  if (type === 'missing_arabic_text') return 'Learner cannot read or answer the Arabic item confidently.';
  if (type === 'pronunciation_hint_missing') return 'Learner lacks reading support for correct pronunciation.';
  if (type === 'translation_mismatch') return 'Learner may learn an incorrect Arabic-BM meaning pair.';
  if (type === 'missing_example') return 'Learner misses an example for using the Arabic word or phrase.';
  return 'Arabic teaching support needs review.';
}

function classifyArabicSeverity(issueType = '') {
  const type = String(issueType || '').trim();
  if (type === 'missing_arabic_text') return 'Critical';
  if (type === 'translation_mismatch') return 'High';
  if (type === 'pronunciation_hint_missing') return 'Medium';
  if (type === 'missing_example') return 'Low';
  return 'Low';
}

function hasArabicScript(value = '') {
  return /[\u0600-\u06FF]/.test(String(value || ''));
}

export {
  classifyArabicSeverity,
  getArabicLearningImpact,
  getArabicSuggestion,
  hasArabicScript,
  normalizeText
};

export default {
  classifyArabicSeverity,
  getArabicLearningImpact,
  getArabicSuggestion,
  hasArabicScript,
  normalizeText
};
