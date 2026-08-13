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

const PERSON_ROLE = '(?:Ali|Abu|Aina|Sara|Mira|Farah|Datuk|Nenek|Ibu|Ayah|Kakak|Abang|adik|murid|guru)';
const ROLE_PATTERN = new RegExp(`\\b(${PERSON_ROLE})\\b(?:\\s+[\\p{L}][\\p{L}'-]*){0,6}\\s+(berbual dengan|bermain dengan|pergi bersama|bersama|dengan|dan|menolong|membantu)\\s+\\1\\b`, 'giu');
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

export const PART_WHOLE_RELATIONSHIPS = Object.freeze({
  dahan: ['pokok'],
  daun: ['pokok', 'bunga'],
  batang: ['pokok'],
  akar: ['pokok'],
  bunga: ['pokok', 'tanaman'],
  bumbung: ['rumah', 'sekolah', 'bangunan'],
  pintu: ['rumah', 'kelas', 'bilik', 'sekolah'],
  tingkap: ['rumah', 'kelas', 'bilik'],
  roda: ['kereta', 'basikal', 'motosikal', 'bas'],
  pemegang: ['pintu', 'beg', 'cawan'],
  muka: ['buku'],
  halaman: ['rumah', 'sekolah'],
  pagar: ['rumah', 'sekolah', 'taman'],
  rak: ['buku', 'kasut'],
  kaki: ['meja', 'kerusi', 'manusia', 'haiwan'],
  sayap: ['burung', 'rama-rama', 'kapal terbang'],
  ekor: ['kucing', 'anjing', 'burung', 'ikan']
});

export const VALID_BM_COMPOUND_NOUNS = [
  'buku cerita', 'pensel warna', 'kasut sekolah', 'beg sekolah', 'meja guru', 'meja murid',
  'taman permainan', 'surat khabar', 'dahan pokok', 'batang pokok', 'daun pokok', 'bunga raya',
  'pintu kelas', 'pintu rumah', 'halaman rumah', 'halaman sekolah', 'rak buku', 'rak kasut',
  'bumbung rumah', 'bumbung sekolah', 'bilik darjah', 'bilik tidur', 'bilik mandi'
];

const SPATIAL_PREPOSITIONS = ['di', 'ke', 'dari', 'daripada', 'pada', 'kepada', 'untuk', 'dengan'];
const LOCATION_HEADS = new Set(['meja', 'kerusi', 'papan putih', 'buku', 'rak', 'murid', 'guru', 'pokok', 'bunga', 'bangku', 'laluan', 'kolam', 'katil', 'sink', 'sofa', 'dapur', 'bilik', 'halaman', 'pagar', 'pintu', 'tingkap', 'lantai', 'dinding', 'jalan', 'sungai', 'padang', 'taman permainan', 'dahan pokok', 'bumbung rumah', 'bumbung sekolah']);
const BROAD_LOCATIONS = new Set(['taman', 'sekolah', 'kelas', 'dapur', 'bilik', 'jalan', 'padang', 'rumah', 'pasar']);

export function validatePartWholePhrase(part = '', whole = '', context = {}) {
  const p = normalizeEntity(part).replace(/\s+/g, ' ');
  const w = normalizeEntity(whole).replace(/\s+/g, ' ');
  if (!p || !w) return { valid: false, issues: ['missing_part_or_whole'] };
  const allowed = (PART_WHOLE_RELATIONSHIPS[p] || []).map(normalizeEntity);
  if (!allowed.length) return { valid: true, issues: [] };
  return allowed.includes(w)
    ? { valid: true, issues: [] }
    : { valid: false, issues: ['invalid_part_whole_relationship'] };
}

export function validateNestedLocationPhrase(locationPhrase = '', context = {}) {
  const text = normalizeEntity(locationPhrase).replace(/\s+/g, ' ').trim();
  const issues = [];
  if (!text) return { valid: false, issues: ['incomplete_location_phrase'] };
  if (/\bdi\s+di\b|\bdi\s+(?:atas|bawah|dalam|hadapan|belakang)\s+di\b|\bdi\s+atas\s+bawah\b|\bdi\s+hadapan\s+belakang\b/i.test(text)) issues.push('invalid_preposition_chain');
  const tokens = text.split(' ');
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const part = tokens[i];
    const whole = tokens[i + 1].replace(/[.,!?;:]+$/g, '');
    const candidateWhole = normalizeEntity(whole);
    const knownWhole = new Set(Object.values(PART_WHOLE_RELATIONSHIPS).flat().map(normalizeEntity));
    if (PART_WHOLE_RELATIONSHIPS[part] && !SPATIAL_PREPOSITIONS.includes(candidateWhole) && (knownWhole.has(candidateWhole) || BROAD_LOCATIONS.has(candidateWhole) || LOCATION_HEADS.has(candidateWhole))) {
      const result = validatePartWholePhrase(part, whole, context);
      if (!result.valid) issues.push(...result.issues);
    }
  }
  if (/\b(?:di\s+atas|di\s+bawah)\s+(?:taman|sekolah|kelas|pasar|jalan|padang)\b/i.test(text)) {
    const after = text.replace(/^.*?\b(?:di\s+atas|di\s+bawah|di\s+dalam|di\s+hadapan|di\s+belakang|di\s+tepi|di\s+sebelah)\s+/i, '').replace(/[.,!?].*$/, '').trim();
    if (!LOCATION_HEADS.has(after) && BROAD_LOCATIONS.has(after)) issues.push('broad_location_misuse');
  }
  if (/\b(?:dahan|akar|batang|bumbung|pintu|tingkap|roda|sayap|ekor|rak|halaman)\s+(?:taman|sekolah|rumah|meja|kerusi|buku|kereta|kucing|pokok)\b/i.test(text)) {
    const match = text.match(/\b(dahan|akar|batang|bumbung|pintu|tingkap|roda|sayap|ekor|rak|halaman)\s+([\p{L}-]+)/iu);
    if (match) {
      const result = validatePartWholePhrase(match[1], match[2], context);
      if (!result.valid) issues.push(...result.issues);
    }
  }
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}

export function validateBmPrepositionChain(text = '') {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  const issues = [];
  if (/\bdi\s+di\b|\bdi\s+(?:atas|bawah|dalam)\s+di\b|\b(?:atas|bawah|dalam)\s+di\b/i.test(value)) issues.push('invalid_preposition_chain');
  if (/\b(?:dahan|akar|batang)\s+di\s+(?:taman|sekolah|rumah)\b/i.test(value)) issues.push('missing_head_noun');
  return { valid: issues.length === 0, issues };
}

const SPATIAL_REPAIRS = [
  [/\bdi dahan taman\b/gi, 'di dahan pokok di taman'],
  [/\bdi pokok taman\b/gi, 'di pokok di taman'],
  [/\bdi bawah bilik meja\b/gi, 'di bawah meja'],
  [/\bdi atas kelas\b/gi, 'di atas meja di dalam kelas'],
  [/\bdi pintu belakang sekolah hadapan\b/gi, 'di hadapan pintu sekolah'],
  [/\bdi bunga taman\b/gi, 'pada bunga di taman'],
  [/\bdi dahan rumah\b/gi, 'di halaman rumah'],
  [/\bdi bumbung pokok\b/gi, 'di atas pokok'],
  [/\bdi bawah taman\b/gi, 'di bawah bangku taman'],
  [/\bdi atas sekolah\b/gi, 'di atas meja'],
  [/\bdi hadapan belakang kelas\b/gi, 'di hadapan kelas'],
  [/\bdi dalam atas meja\b/gi, 'di atas meja'],
  [/\bdi halaman katil\b/gi, 'di atas katil'],
  [/\bdi kerusi kelas meja\b/gi, 'di atas kerusi di dalam kelas']
];

export function repairNestedLocationPhrase(locationPhrase = '', context = {}) {
  let repaired = String(locationPhrase ?? '').replace(/\s+/g, ' ').trim();
  for (const [pattern, replacement] of SPATIAL_REPAIRS) repaired = repaired.replace(pattern, replacement);
  return { repairedPhrase: repaired, changed: repaired !== String(locationPhrase ?? '').replace(/\s+/g, ' ').trim(), validation: validateNestedLocationPhrase(repaired, context) };
}

export function validateBmNaturalness(sentence = '', context = {}) {
  const value = String(sentence ?? '').replace(/\s+/g, ' ').trim();
  if (context.isLearnerInput || context.isQuotedIncorrectExample || context.isAuthoredStory) {
    return { valid: true, semanticIssues: [], spatialIssues: [], ownershipIssues: [], ambiguityIssues: [], repairedSentence: value, issues: [], severity: 'low', confidence: 0.9 };
  }
  const spatial = validateNestedLocationPhrase(value, context);
  const preposition = validateBmPrepositionChain(value);
  const semantic = validateBmSemantics(value, context);
  const ownershipIssues = [];
  if (/\b(?:buku|kasut|meja|halaman|tingkap|pintu)\s+(?:taman|pokok|kerusi)\b/i.test(value)) ownershipIssues.push('invalid_noun_ownership');
  const ambiguityIssues = [];
  if (/\bmelihat\s+(?:burung|kucing|anjing|rama-rama|murid|Ali|Aina|Abu|Sara)\b[^.!?]*\s+di\s+(?:atas|bawah|dalam|hadapan|belakang)\b/i.test(value) && !/yang berada|^di\s+/i.test(value)) ambiguityIssues.push('ambiguous_location_attachment');
  const actionLocationIssues = [];
  if (/\bdi\s+di\b|\bdi\s+(?:atas|bawah|dalam)\s+di\b|\bdi\s+(?:bawah\s+bilik\s+meja|dalam\s+atas\s+meja)\b/i.test(value)) actionLocationIssues.push('invalid_preposition_chain');
  if (/\bikan\s+berenang\b[^.!?]*\b(?:di|ke)\s+(?:padang|sekolah|jalan)\b/i.test(value)) actionLocationIssues.push('animal_location_mismatch');
  if (/\bburung\s+berenang\b[^.!?]*\bpadang\b|\bkucing\s+terbang\b|\brama-rama\s+tidur\b[^.!?]*\bkolam\b|\bayam\s+berenang\b[^.!?]*\bdahan\b/i.test(value)) actionLocationIssues.push('animal_location_mismatch');
  if (/\b(?:tidur)\s+di\s+meja\b|\bberenang\s+di\s+padang\b|\bbermain\s+di\s+atas\s+bilik\b|\bberdiri\s+di\s+bawah\s+sekolah\b/i.test(value)) actionLocationIssues.push('action_location_mismatch');
  if (/\b(?:pokok\s+taman|kerusi\s+kelas\s+meja|pintu\s+belakang\s+sekolah\s+hadapan)\b/i.test(value)) actionLocationIssues.push('malformed_compound_noun');
  const issues = [...new Set([...spatial.issues, ...preposition.issues, ...semantic.issues, ...ownershipIssues, ...ambiguityIssues, ...actionLocationIssues])];
  const repair = repairNestedLocationPhrase(value, context);
  return {
    valid: issues.length === 0,
    semanticIssues: semantic.issues,
    spatialIssues: [...new Set([...spatial.issues, ...preposition.issues])],
    ownershipIssues,
    ambiguityIssues,
    repairedSentence: repair.repairedPhrase,
    issues,
    severity: issues.some(item => /invalid|missing|mismatch|ambiguous|incomplete/i.test(item)) ? 'high' : issues.length ? 'medium' : 'low',
    confidence: issues.length ? 0.3 : 0.98
  };
}

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
  if (/\bikan\s+berenang\b[^.!?]*\b(?:di|ke)\s+(?:padang|sekolah|jalan)\b|\bburung\s+berenang\b[^.!?]*\bpadang\b|\bkucing\s+terbang\b|\brama-rama\s+tidur\b[^.!?]*\bkolam\b|\bayam\s+berenang\b[^.!?]*\bdahan\b/i.test(value)) semanticIssues.push('animal_location_mismatch');
  if (/\b(?:tidur)\s+di\s+meja\b|\bberenang\s+di\s+padang\b|\bbermain\s+di\s+atas\s+bilik\b|\bberdiri\s+di\s+bawah\s+sekolah\b/i.test(value)) semanticIssues.push('invalid_verb_place');
  if (/\b(?:pokok\s+taman|kerusi\s+kelas\s+meja|pintu\s+belakang\s+sekolah\s+hadapan)\b/i.test(value)) semanticIssues.push('invalid_compound_noun');
  const spatial = validateNestedLocationPhrase(value, context);
  semanticIssues.push(...spatial.issues);
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
  const needsInspection = ROLE_PATTERN.test(original) || CONSECUTIVE_WORD_PATTERN.test(original) || INTERNAL_TOKEN_PATTERN.test(original)
    || SEMANTIC_REPAIRS.some(([pattern]) => pattern.test(original))
    || SPATIAL_REPAIRS.some(([pattern]) => pattern.test(original))
    || /\b(?:dahan|akar|batang|bumbung|pintu|tingkap|roda|sayap|ekor|rak|halaman|pokok|bunga|kolam|padang|taman)\b/i.test(original);
  ROLE_PATTERN.lastIndex = 0;
  CONSECUTIVE_WORD_PATTERN.lastIndex = 0;
  for (const [pattern] of SEMANTIC_REPAIRS) pattern.lastIndex = 0;
  for (const [pattern] of SPATIAL_REPAIRS) pattern.lastIndex = 0;
  if (!needsInspection) return { valid: true, issues: [], grammaticalIssues: [], semanticIssues: [], confidence: 0.99, severity: 'low', repairedSentence: original };
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
  for (const [pattern, replacement] of SPATIAL_REPAIRS) repaired = repaired.replace(pattern, replacement);
  repaired = repaired
    .replace(/\bIkan berenang di padang sekolah\b/gi, 'Ikan berenang di dalam kolam sekolah')
    .replace(/\bBurung berenang di padang\b/gi, 'Burung terbang di udara')
    .replace(/\bKucing terbang di udara\b/gi, 'Kucing memanjat pokok')
    .replace(/\bRama-rama tidur di dalam kolam\b/gi, 'Rama-rama hinggap pada bunga')
    .replace(/\bAyam berenang di dahan\b/gi, 'Ayam berjalan di halaman rumah')
    .replace(/\bKucing tidur di meja\b/gi, 'Kucing tidur di atas tikar')
    .replace(/\bBerenang di padang\b/gi, 'Berenang di dalam kolam');
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

function inferBMQuestionType(record = {}, context = {}) {
  if (record.questionType) return record.questionType;
  const options = record.options || record.choices || record.answerOptions;
  if (Array.isArray(options) && options.length >= 2) return 'objective';
  const text = String(record.q || record.question || '').trim();
  if (/\b(susun|atur)\b.*\b(urutan|perkataan|frasa|ayat)\b/i.test(text)) return 'ordering';
  if (Number(record.marks || 1) > 1 || /\b(tulis|bina|hasilkan|jelaskan|terangkan|berikan sebab|beri sebab)\b/i.test(text)) return 'structured';
  return context.defaultQuestionType || 'short_answer';
}

const BM_PROGRESSIVE_GRAMMAR_TOPICS = new Set([
  'kata_nama_am',
  'kata_nama_khas',
  'kata_ganti_nama',
  'kata_kerja',
  'kata_adjektif',
  'kata_sendi',
  'kata_hubung',
  'penjodoh_bilangan',
  'ayat',
  'tatabahasa'
]);

function inferBMCognitiveLevel(record = {}, context = {}) {
  if (record.cognitiveLevel) return record.cognitiveLevel;
  if (BM_PROGRESSIVE_GRAMMAR_TOPICS.has(context.topicId) && Number.isInteger(context.index)) {
    const phase = context.index % 50;
    if (phase < 10) return 'mengingat';
    if (phase < 20) return 'memahami';
    if (phase < 35) return 'mengaplikasi';
    if (phase < 45) return 'menganalisis';
    return 'menilai';
  }
  const text = String(record.q || record.question || '').trim();
  if (/\b(cipta|hasilkan|bina ayat|tulis (?:satu )?ayat|karang)\b/i.test(text)) return 'mencipta';
  if (/\b(penilaian kbat|nilaikan|wajarkah|paling sesuai)\b/i.test(text) || /\b(berikan|beri) sebab\b/i.test(text)) return 'menilai';
  if (/\b(analisis kbat|analisis|bandingkan|bezakan|bukti|rumuskan)\b/i.test(text)) return 'menganalisis';
  if (/\b(aplikasi|gunakan|lengkapkan|susun|padankan)\b/i.test(text)) return 'mengaplikasi';
  if (/\b(mengapakah|jelaskan|terangkan|maksud|jenis|kelaskan|kategorikan)\b/i.test(text)) return 'memahami';
  const difficulty = String(record.difficulty || '').toLowerCase();
  if (difficulty === 'sukar') return 'mengaplikasi';
  if (difficulty === 'sederhana') return 'memahami';
  return 'mengingat';
}

export function normalizeBMQuestionRecord(record = {}, context = {}) {
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
  if (sourceQuestion && repairedQuestion !== sourceQuestion) {
    const originalNatural = validateBmNaturalness(sourceQuestion);
    const repairedNatural = validateBmNaturalness(repairedQuestion);
    const oldPhrase = originalNatural.spatialIssues.length ? (sourceQuestion.match(/(?:di|ke|dari|daripada|pada|kepada)\s+[^,.!?]+/i)?.[0] || '') : '';
    const newPhrase = repairedNatural.repairedSentence.match(/(?:di|ke|dari|daripada|pada|kepada)\s+[^,.!?]+/i)?.[0] || '';
    if (oldPhrase && newPhrase && oldPhrase !== newPhrase) {
      const oldNounPhrase = oldPhrase.replace(/^(?:di|ke|dari|daripada|pada|kepada)\s+/i, '').trim();
      const newNounPhrase = newPhrase.replace(/^(?:di|ke|dari|daripada|pada|kepada)\s+/i, '').split(/\s+di\s+/i)[0].trim();
      for (const field of ['answer', 'correctAnswer', 'explanation', 'hint', 'readAloud', 'readAloudText']) {
        if (typeof next[field] === 'string') next[field] = next[field].replaceAll(oldPhrase, newPhrase).replaceAll(oldNounPhrase, newNounPhrase);
      }
      for (const field of ['options', 'choices', 'accepted', 'acceptedAnswers']) {
        if (Array.isArray(next[field])) next[field] = next[field].map(value => typeof value === 'string' ? value.replaceAll(oldPhrase, newPhrase).replaceAll(oldNounPhrase, newNounPhrase) : value);
      }
    }
  }
  for (const field of ['q', 'question', 'answer', 'correctAnswer', 'explanation', 'hint', 'readAloud', 'readAloudText']) {
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
  next.questionType = inferBMQuestionType(next, context);
  next.cognitiveLevel = inferBMCognitiveLevel(next, context);
  return next;
}

export function normalizeBMSubject(subject = {}) {
  return {
    ...subject,
    topics: Array.isArray(subject.topics)
      ? subject.topics.map(topic => ({
          ...topic,
          questions: Array.isArray(topic.questions)
            ? topic.questions.map((question, index) => normalizeBMQuestionRecord(question, {
                topicId: topic.id,
                index,
                defaultQuestionType: topic.defaultQuestionType
              }))
            : topic.questions
        }))
      : subject.topics
  };
}

export default {
  pickDistinctEntity,
  validateBMSentence,
  validateBmSemantics,
  validatePartWholePhrase,
  validateNestedLocationPhrase,
  repairNestedLocationPhrase,
  validateBmPrepositionChain,
  validateBmNaturalness,
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
