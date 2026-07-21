const DISTINCT_REPLACEMENTS = {
  datuk: 'nenek',
  nenek: 'datuk',
  ibu: 'kakak',
  kakak: 'ibu',
  ayah: 'abang',
  abang: 'ayah',
  ali: 'abu',
  abu: 'ali',
  aina: 'sara',
  sara: 'aina',
  mira: 'farah',
  farah: 'mira'
};

const ROLE_PATTERN = /\b([\p{L}][\p{L}'-]*)\b(?:\s+[\p{L}][\p{L}'-]*){0,6}\s+(berbual dengan|bermain dengan|pergi bersama|bersama|dengan|dan|menolong|membantu)\s+\1\b/giu;
const CONSECUTIVE_WORD_PATTERN = /\b([\p{L}][\p{L}'-]*)\s+\1\b/giu;
const INTERNAL_TOKEN_PATTERN = /\b(?:BM-|questionId|topicId|adaptive[_-]|uasa[_-]|set[_-])\S*/i;

function normalizeEntity(value = '') {
  return String(value).trim().toLocaleLowerCase('ms-MY');
}

function capitalizeLike(value, reference) {
  if (!reference || reference[0] !== reference[0].toUpperCase()) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function pickDistinctEntity({ exclude = '', candidates = [], role = '' } = {}) {
  const excluded = normalizeEntity(exclude);
  if (DISTINCT_REPLACEMENTS[excluded]) return DISTINCT_REPLACEMENTS[excluded];
  const pool = Array.isArray(candidates) ? candidates : [];
  const selected = pool.find(item => normalizeEntity(item) && normalizeEntity(item) !== excluded);
  if (selected) return selected;
  return DISTINCT_REPLACEMENTS[excluded] || (role === 'companion' ? 'rakan' : 'murid');
}

export function validateBMSentence(sentence = '') {
  const text = String(sentence ?? '').replace(/\s+/g, ' ').trim();
  const issues = [];
  if (!text) issues.push('empty_sentence');
  if (ROLE_PATTERN.test(text)) issues.push('duplicate_person_roles');
  ROLE_PATTERN.lastIndex = 0;
  if (CONSECUTIVE_WORD_PATTERN.test(text)) issues.push('duplicate_consecutive_words');
  CONSECUTIVE_WORD_PATTERN.lastIndex = 0;
  if (INTERNAL_TOKEN_PATTERN.test(text)) issues.push('internal_id');
  if (/\s+[,.!?]/.test(text)) issues.push('punctuation_spacing');
  if (text && /^[a-z]/.test(text) && /[.!?]$/.test(text)) issues.push('capitalization');
  return { valid: issues.length === 0, issues, repairedSentence: text };
}

export function repairBMSentence(sentence = '', options = {}) {
  const original = String(sentence ?? '').replace(/\s+/g, ' ').trim();
  let repaired = original;
  const candidates = options.candidates || ['Ali', 'Aina', 'Abu', 'Sara', 'Datuk', 'Nenek', 'Ibu', 'Kakak', 'Ayah', 'Abang', 'rakan'];
  repaired = repaired.replace(ROLE_PATTERN, (full, first, relation) => {
    const replacement = pickDistinctEntity({ exclude: first, candidates, role: relation.includes('bersama') || relation.includes('dengan') ? 'companion' : 'second' });
    return full.replace(new RegExp(`\\b${first}\\b$`, 'iu'), capitalizeLike(replacement, first));
  });
  ROLE_PATTERN.lastIndex = 0;
  const validation = validateBMSentence(repaired);
  if (!validation.valid && validation.issues.includes('duplicate_consecutive_words')) {
    repaired = repaired.replace(CONSECUTIVE_WORD_PATTERN, (full, word) => `${word} ${capitalizeLike(pickDistinctEntity({ exclude: word, candidates, role: 'second' }), word)}`);
  }
  CONSECUTIVE_WORD_PATTERN.lastIndex = 0;
  if (repaired && /^\p{Ll}/u.test(repaired) && /[.!?]$/.test(repaired)) {
    repaired = repaired.charAt(0).toUpperCase() + repaired.slice(1);
  }
  const finalValidation = validateBMSentence(repaired);
  return {
    valid: finalValidation.valid,
    issues: finalValidation.issues,
    repairedSentence: finalValidation.valid ? repaired : original
  };
}

export function normalizeBMQuestionRecord(record = {}) {
  const next = { ...record };
  for (const field of ['q', 'question', 'answer', 'correctAnswer', 'explanation']) {
    if (typeof next[field] !== 'string') continue;
    const result = repairBMSentence(next[field]);
    if (result.repairedSentence !== next[field]) next[field] = result.repairedSentence;
  }
  if (Array.isArray(next.accepted)) {
    next.accepted = next.accepted.map(value => typeof value === 'string' ? repairBMSentence(value).repairedSentence : value);
  }
  if (Array.isArray(next.acceptedAnswers)) {
    next.acceptedAnswers = next.acceptedAnswers.map(value => typeof value === 'string' ? repairBMSentence(value).repairedSentence : value);
  }
  return next;
}

export function normalizeBMSubject(subject = {}) {
  return {
    ...subject,
    topics: Array.isArray(subject.topics)
      ? subject.topics.map(topic => ({
          ...topic,
          questions: Array.isArray(topic.questions) ? topic.questions.map(normalizeBMQuestionRecord) : topic.questions
        }))
      : subject.topics
  };
}

export default {
  pickDistinctEntity,
  validateBMSentence,
  repairBMSentence,
  normalizeBMQuestionRecord,
  normalizeBMSubject
};
