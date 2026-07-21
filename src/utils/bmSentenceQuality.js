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

export const BM_SEMANTIC_ROLES = {
  READABLE_MATERIAL: ['buku', 'buku cerita', 'majalah', 'surat khabar', 'teks', 'cerita', 'nota', 'arahan'],
  WRITING_TOOL: ['pensel', 'pen', 'pensel warna'],
  DRAWING_TOOL: ['pensel warna', 'krayon', 'berus'],
  FOOD: ['nasi', 'roti', 'buah', 'makanan', 'kek', 'biskut'],
  DRINK: ['air', 'susu', 'jus'],
  CLOTHING: ['baju', 'kasut', 'topi', 'stoking', 'lencana'],
  VEHICLE: ['bas', 'kereta', 'motosikal', 'basikal', 'kereta api'],
  PLANT: ['pokok', 'bunga', 'tanaman'],
  PERSON: ['Ali', 'Aina', 'Abu', 'Sara', 'Mira', 'Datuk', 'Nenek', 'Ibu', 'Ayah', 'Kakak', 'Abang', 'adik', 'murid', 'guru'],
  PLACE: ['sekolah', 'kelas', 'kantin', 'taman', 'dapur', 'halaman rumah', 'perpustakaan', 'bilik tidur', 'bilik air', 'bas'],
  CLASSROOM_OBJECT: ['pensel', 'pen', 'buku', 'meja', 'sudu', 'gelas', 'beg', 'lencana'],
  ACTION_RESULT: ['ayat', 'nama', 'jawapan', 'cerita', 'surat', 'nota', 'gambar', 'pemandangan', 'bunga', 'rumah', 'skor', 'permainan'],
  BODY_PART: ['gigi', 'tangan', 'muka'],
  SPORT_OBJECT: ['bola']
};

export const BM_VERB_OBJECT_COMPATIBILITY = {
  membaca: 'READABLE_MATERIAL',
  menulis: 'ACTION_RESULT',
  melukis: 'ACTION_RESULT',
  makan: 'FOOD',
  minum: 'DRINK',
  memakai: 'CLOTHING',
  menaiki: 'VEHICLE',
  menyiram: 'PLANT',
  menggosok: 'BODY_PART',
  menendang: 'SPORT_OBJECT'
};

export const VALID_BM_COMPOUND_NOUNS = [
  'buku cerita', 'pensel warna', 'kasut sekolah', 'beg sekolah', 'meja guru', 'taman permainan', 'surat khabar'
];

const SEMANTIC_REPAIRS = [
  [/\bmembaca\s+pensel(?:\s+cerita)?\b/gi, 'membaca buku cerita'],
  [/\bminum\s+gelas(?:\s+air)?\b/gi, 'minum air'],
  [/\bmenulis\s+pensel\b/gi, 'menulis ayat dengan pensel'],
  [/\bmemakai\s+meja\b/gi, 'memakai kasut'],
  [/\bmembaca\s+kasut\b/gi, 'membaca buku'],
  [/\bmenaiki\s+sekolah\b/gi, 'menaiki bas'],
  [/\bmenyiram\s+buku\b/gi, 'menyiram pokok'],
  [/\bbermain\s+bola\s+dengan\s+pensel\b/gi, 'bermain bola bersama rakannya'],
  [/\bmakan\s+sudu\b/gi, 'makan nasi'],
  [/\bmenggosok\s+nasi\b/gi, 'menggosok gigi'],
  [/\bmemasak\s+di dalam bas\b/gi, 'memasak di dapur'],
  [/\bPada waktu malam,\s*murid menghadiri perhimpunan pagi\b/gi, 'Pada waktu pagi, murid menghadiri perhimpunan sekolah'],
  [/\bBunga itu lapar\b/gi, 'Bunga itu cantik'],
  [/\bSeekor\s+pensel\b/gi, 'Sebatang pensel'],
  [/\bSebatang\s+kucing\b/gi, 'Seekor kucing']
];

function normalizeEntity(value = '') {
  return String(value).trim().toLocaleLowerCase('ms-MY');
}

function roleValues(role) {
  return (BM_SEMANTIC_ROLES[role] || []).map(normalizeEntity);
}

export function validateVerbObjectPair(verb = '', object = '', context = {}) {
  const normalizedVerb = normalizeEntity(verb);
  const normalizedObject = normalizeEntity(object);
  const expectedRole = BM_VERB_OBJECT_COMPATIBILITY[normalizedVerb];
  if (!expectedRole || !normalizedObject) return { valid: true, issues: [] };
  if ((normalizedVerb === 'menulis' || normalizedVerb === 'melukis') && [...roleValues('WRITING_TOOL'), ...roleValues('DRAWING_TOOL')].includes(normalizedObject)) return { valid: false, issues: ['instrument_without_dengan'] };
  const valid = roleValues(expectedRole).some(value => normalizedObject === value || normalizedObject.includes(value) || value.includes(normalizedObject));
  if (valid) return { valid: true, issues: [] };
  const knownElsewhere = Object.entries(BM_SEMANTIC_ROLES)
    .filter(([role]) => role !== expectedRole)
    .some(([, values]) => values.map(normalizeEntity).some(value => normalizedObject === value || normalizedObject.includes(value) || value.includes(normalizedObject)));
  return { valid: !knownElsewhere, issues: knownElsewhere ? ['invalid_verb_object'] : [] };
}

export function validateVerbPlacePair(verb = '', place = '', context = {}) {
  const value = normalizeEntity(place);
  const verbKey = normalizeEntity(verb);
  const invalid = (verbKey === 'memasak' && value === 'bas') || (verbKey === 'menaiki' && value === 'sekolah');
  return { valid: !invalid, issues: invalid ? ['invalid_verb_place'] : [] };
}

export function validatePersonRoles(roles = []) {
  const values = Array.isArray(roles) ? roles.map(normalizeEntity).filter(Boolean) : [];
  const duplicate = values.length > 1 && new Set(values).size !== values.length;
  return { valid: !duplicate, issues: duplicate ? ['duplicate_person_roles'] : [] };
}

export function validateBmSemantics(sentence = '', context = {}) {
  const value = String(sentence ?? '').replace(/\s+/g, ' ').trim();
  const semanticIssues = [];
  for (const verb of Object.keys(BM_VERB_OBJECT_COMPATIBILITY)) {
    const pattern = new RegExp(`\\b${verb}\\s+([^,.!?]+)`, 'i');
    const match = value.match(pattern);
    if (!match) continue;
    const object = match[1].replace(/\b(?:di|ke|dengan|bersama|pada|untuk)\b.*$/i, '').trim();
    if (/^ini\b/i.test(object)) continue;
    const knownObject = Object.values(BM_SEMANTIC_ROLES).flat().some(value => normalizeEntity(object).includes(normalizeEntity(value)));
    if (!knownObject) continue;
    const result = validateVerbObjectPair(verb, object, context);
    semanticIssues.push(...result.issues);
  }
  if (/\b(?:memasak)\b[^.!?]*\bdi dalam bas\b/i.test(value)) semanticIssues.push('invalid_verb_place');
  if (/\b(?:waktu malam)\b[^.!?]*\bperhimpunan pagi\b/i.test(value)) semanticIssues.push('time_context_mismatch');
  if (/\b(?:seekor\s+pensel|sebatang\s+kucing|seorang\s+buku)\b/i.test(value)) semanticIssues.push('classifier_mismatch');
  if (/\b(?:pensel|meja|bola)\s+(?:cerita|membaca|minuman)\b/i.test(value)) semanticIssues.push('invalid_compound_noun');
  return { valid: semanticIssues.length === 0, issues: [...new Set(semanticIssues)] };
}

export function validateBmInstruction(instruction = '') {
  const value = String(instruction ?? '').trim();
  const issues = [];
  if (!value) issues.push('missing_instruction');
  if (/pilih jawapan betul di bawah|susun ayat perkataan ini|apakah kata nama di ayat bawah|bina ayat dengan guna perkataan/i.test(value)) issues.push('awkward_instruction');
  return { valid: issues.length === 0, issues };
}

export function validateBmOptions(options = [], expectedAnswer = '') {
  const list = Array.isArray(options) ? options.map(value => String(value ?? '').trim()) : [];
  const normalized = list.map(normalizeEntity);
  const issues = [];
  if (list.some(value => !value)) issues.push('empty_option');
  if (new Set(normalized).size !== normalized.length) issues.push('duplicate_options');
  if (expectedAnswer && !normalized.includes(normalizeEntity(expectedAnswer))) issues.push('expected_answer_missing');
  return { valid: issues.length === 0, issues };
}

export function validateBmQuestionObject(question = {}) {
  const sentence = question.q || question.question || '';
  const answer = question.answer || question.correctAnswer || '';
  const grammatical = validateBMSentence(sentence);
  const semantic = validateBmSemantics(sentence);
  const options = validateBmOptions(question.options || question.choices || question.accepted || [], answer);
  const issues = [...new Set([...grammatical.issues, ...semantic.issues, ...(question.options || question.choices ? options.issues : [])])];
  return { valid: issues.length === 0, issues, severity: issues.some(item => item.includes('invalid') || item.includes('missing') || item.includes('mismatch')) ? 'high' : issues.length ? 'medium' : 'low' };
}

export function regenerateBmSentence(context = {}) {
  const safe = context.fallback || 'Murid membaca buku di dalam kelas.';
  return repairBMSentence(safe, context);
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
  const semantic = validateBmSemantics(text);
  const grammaticalIssues = issues;
  const semanticIssues = semantic.issues;
  const allIssues = [...new Set([...grammaticalIssues, ...semanticIssues])];
  return {
    valid: allIssues.length === 0,
    issues: allIssues,
    grammaticalIssues,
    semanticIssues,
    repairedSentence: text,
    confidence: allIssues.length ? 0.35 : 0.98,
    severity: allIssues.some(issue => issue.includes('invalid') || issue.includes('mismatch')) ? 'high' : allIssues.length ? 'medium' : 'low'
  };
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
  for (const [pattern, replacement] of SEMANTIC_REPAIRS) repaired = repaired.replace(pattern, replacement);
  if (repaired && /^\p{Ll}/u.test(repaired) && /[.!?]$/.test(repaired)) {
    repaired = repaired.charAt(0).toUpperCase() + repaired.slice(1);
  }
  const finalValidation = validateBMSentence(repaired);
  return {
    valid: finalValidation.valid,
    issues: finalValidation.issues,
    grammaticalIssues: finalValidation.grammaticalIssues,
    semanticIssues: finalValidation.semanticIssues,
    confidence: finalValidation.valid ? (repaired === original ? 0.98 : 0.9) : 0.2,
    severity: finalValidation.severity,
    repairedSentence: finalValidation.valid ? repaired : original
  };
}

export function normalizeBMQuestionRecord(record = {}) {
  const next = { ...record };
  const sourceQuestion = typeof next.q === 'string' ? next.q : (typeof next.question === 'string' ? next.question : '');
  const repairedQuestion = sourceQuestion ? repairBMSentence(sourceQuestion).repairedSentence : sourceQuestion;
  if (sourceQuestion && repairedQuestion !== sourceQuestion) {
    if (typeof next.q === 'string') next.q = repairedQuestion;
    if (typeof next.question === 'string') next.question = repairedQuestion;
    if (typeof next.answer === 'string' && next.answer.includes(sourceQuestion)) next.answer = next.answer.replaceAll(sourceQuestion, repairedQuestion);
    if (typeof next.correctAnswer === 'string' && next.correctAnswer.includes(sourceQuestion)) next.correctAnswer = next.correctAnswer.replaceAll(sourceQuestion, repairedQuestion);
    if (typeof next.explanation === 'string' && next.explanation.includes(sourceQuestion)) next.explanation = next.explanation.replaceAll(sourceQuestion, repairedQuestion);
  }
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
  validateBmSemantics,
  validateVerbObjectPair,
  validateVerbPlacePair,
  validatePersonRoles,
  validateBmInstruction,
  validateBmOptions,
  validateBmQuestionObject,
  regenerateBmSentence,
  repairBMSentence,
  normalizeBMQuestionRecord,
  normalizeBMSubject
};
