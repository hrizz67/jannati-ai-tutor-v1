const DISTINCT_REPLACEMENTS = {
  ali: 'Adam',
  adam: 'Ali',
  sara: 'Lina',
  lina: 'Sara',
  aina: 'Maya',
  maya: 'Aina',
  amir: 'Hakim',
  hakim: 'Amir',
  mother: 'father',
  father: 'mother',
  cat: 'ball',
  dog: 'ball'
};

const INTERNAL_TOKEN_PATTERN = /\b(?:ENG-|questionId|topicId|adaptive[_-]|uasa[_-]|set[_-])\S*/i;
const DUPLICATE_ENTITY_PATTERN = /\b(Ali|Adam|Sara|Lina|Aina|Maya|Amir|Hakim|Ravi|Mei|Mother|Father|cat|dog|bird|ball)\b(?:\s+[\p{L}][\p{L}'-]*){0,5}\s+(with|and|helps?|chases?|talks?\s+to|plays?\s+with)\s+\1\b/giu;
const COORDINATED_DUPLICATE_PATTERN = /\b(Ali|Adam|Sara|Lina|Aina|Maya|Amir|Hakim|Ravi|Mei|Mother|Father|cat|dog|bird|ball)\s+and\s+\1\b/giu;
const DUPLICATE_WORD_PATTERN = /\b([\p{L}][\p{L}'-]*)\s+\1\b/giu;
const UNNATURAL_PATTERNS = [
  [/\bI am go(ing)?\b/gi, 'I go'],
  [/\bShe very likes\b/gi, 'She likes'],
  [/\bHe is eat\b/gi, 'He is eating'],
  [/\bon top table\b/gi, 'on the table'],
  [/\bqueue for enter\b/gi, 'queue to enter']
];
const THIRD_PERSON_FORMS = { run: 'runs', read: 'reads', play: 'plays', go: 'goes', eat: 'eats', like: 'likes', have: 'has', do: 'does' };
const PLURAL_FORMS = { runs: 'run', reads: 'read', plays: 'play', goes: 'go', eats: 'eat', likes: 'like', has: 'have', does: 'do' };
const MALAY_CONTENT_TOKENS = new Set('dan dengan di ke dari daripada untuk pada sedang membaca menulis murid guru sekolah kelas rumah ibu ayah adik kakak datuk nenek buku pensel jawapan betul pilih susun isi ayat perkataan pergi bermain membaca menolong'.split(' '));
const ENGLISH_COMMON_TOKENS = new Set('a an the is are am was were he she it they we you this that these those choose correct answer fill in blank complete sentence read words word match rearrange noun verb adjective book school cat dog goes go plays reads happy'.split(' '));
const PLACEHOLDER_PATTERN = /(?:\{\{?\s*(?:name|person|verb|object|place|pronoun|article|noun|adjective)\s*\}?\}|\$\{[^}]+\}|\[[A-Z_]+\]|<\s*(?:name|verb|object|place)\s*>)/i;
const TRUNCATED_END_PATTERN = /(?:\b(?:a|an|the|to|in|on|at|with|from|for|of|and|but|because|or|is|are|am|was|were|has|have|can)\s*|[,;:]\s*|\.\.\.)$/i;
const MALAY_TO_ENGLISH_REPAIRS = [
  [/\bAli membaca a book\b/gi, 'Ali reads a book'],
  [/\bShe pergi to school\b/gi, 'She goes to school'],
  [/\bMurid itu is happy\b/gi, 'The pupil is happy'],
  [/\bAina reads buku cerita\b/gi, 'Aina reads a storybook'],
  [/\bChoose the correct\b/gi, 'Choose the correct answer'],
  [/\bFill in the\b/gi, 'Fill in the blank'],
  [/\bShe is\s*$/gi, 'She is happy'],
  [/\bThe boy\s*$/gi, 'The boy is playing'],
  [/\bAli goes to\s*$/gi, 'Ali goes to school'],
  [/\bThis is a\s*$/gi, 'This is a book']
];

function text(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function key(value = '') {
  return text(value).toLocaleLowerCase('en-MY');
}

function replacementFor(value, candidates = []) {
  const normalized = key(value);
  if (DISTINCT_REPLACEMENTS[normalized]) return DISTINCT_REPLACEMENTS[normalized];
  const candidate = (Array.isArray(candidates) ? candidates : []).find(item => key(item) && key(item) !== normalized);
  return candidate || 'a friend';
}

export function pickDistinctEnglishEntity({ exclude = '', candidates = [], role = '' } = {}) {
  return replacementFor(exclude, candidates);
}

export function normalizeEnglishChildText(value = '') {
  return text(value)
    .replace(/\s*\((?:set|set adaptive|uasa)[^)]*\)/gi, '')
    .replace(/\s*\[(?:set|adaptive)[^\]]*\]/gi, '')
    .replace(/\b(?:undefined|null)\b|\[object Object\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectEnglishLanguagePurity(value = '', context = {}) {
  const content = normalizeEnglishChildText(value);
  const tokens = content.toLocaleLowerCase('en-MY').match(/[a-z]+/g) || [];
  const malayTokens = [...new Set(tokens.filter(token => MALAY_CONTENT_TOKENS.has(token)))];
  const suspiciousTokens = malayTokens.filter(token => !['murid', 'guru', 'sekolah'].includes(token) || context.expectedLanguage === 'english');
  const allowedBilingualInstruction = Boolean(context.allowedBilingualInstruction || context.isTutorExplanation || context.isTranslationExercise || context.contentType === 'ui_metadata');
  const mixedLanguage = !allowedBilingualInstruction && suspiciousTokens.length > 0;
  const englishCount = tokens.filter(token => ENGLISH_COMMON_TOKENS.has(token) || !MALAY_CONTENT_TOKENS.has(token)).length;
  return {
    valid: !mixedLanguage,
    englishTokenRatio: tokens.length ? Number((englishCount / tokens.length).toFixed(3)) : 1,
    malayTokens,
    suspiciousTokens,
    mixedLanguage,
    allowedBilingualInstruction,
    severity: mixedLanguage ? 'high' : 'low'
  };
}

export function detectTruncatedEnglishText(value = '', context = {}) {
  const content = normalizeEnglishChildText(value);
  if (!content || context.isLearnerInput || context.isQuotedExample || context.contentType === 'option') return { valid: true, truncated: false, issues: [] };
  const issues = [];
  if (TRUNCATED_END_PATTERN.test(content)) issues.push('truncated_ending');
  if ((content.match(/"/g) || []).length % 2) issues.push('unmatched_quote');
  if ((content.match(/[()[\]]/g) || []).filter(char => char === '(').length !== (content.match(/[()[\]]/g) || []).filter(char => char === ')').length) issues.push('unmatched_bracket');
  if (/_{2,}$/.test(content) && !context.isFillBlank) issues.push('unfinished_blank');
  return { valid: issues.length === 0, truncated: issues.length > 0, issues, severity: issues.length ? 'high' : 'low' };
}

export function validateResolvedEnglishTemplate(value = '') {
  const content = normalizeEnglishChildText(value);
  const unresolved = PLACEHOLDER_PATTERN.test(content);
  return { valid: !unresolved, issues: unresolved ? ['unresolved_placeholder'] : [], repairedText: content, severity: unresolved ? 'high' : 'low' };
}

export function joinEnglishFragments(fragments = []) {
  return (Array.isArray(fragments) ? fragments : [])
    .map(fragment => normalizeEnglishChildText(fragment))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([.!?])([A-Z])/g, '$1 $2')
    .replace(/\b(the|a|an)\s+\1\b/gi, '$1')
    .replace(/\b([a-z]+)\s+\1\b/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateEnglishQuestionCompleteness(question = {}) {
  const issues = [];
  const textValue = normalizeEnglishChildText(question.q || question.question || question.prompt || '');
  const instruction = normalizeEnglishChildText(question.instruction || question.direction || question.task || '');
  const answer = normalizeEnglishChildText(question.answer || question.correctAnswer || question.expectedAnswer || '');
  const options = Array.isArray(question.options || question.choices) ? (question.options || question.choices) : [];
  const questionType = String(question.questionType || question.type || '').toLocaleLowerCase('en-MY');
  if (!textValue) issues.push('missing_question_text');
  if (!answer) issues.push('missing_expected_answer');
  if (instruction && /^(choose the correct|fill in the|rearrange these words|what is the noun in)$/i.test(instruction)) issues.push('incomplete_instruction');
  if (textValue.length < 5 || /^(choose the correct|fill in the|she is|the boy|ali goes to|this is a|which word is)$/i.test(textValue)) issues.push('incomplete_question');
  if (PLACEHOLDER_PATTERN.test(textValue) || PLACEHOLDER_PATTERN.test(instruction)) issues.push('unresolved_placeholder');
  const truncation = detectTruncatedEnglishText(textValue, { isFillBlank: questionType.includes('fill') || textValue.includes('___') });
  issues.push(...truncation.issues);
  if (questionType.includes('fill') || textValue.includes('___')) {
    if ((textValue.match(/___+/g) || []).length !== 1) issues.push('invalid_blank_count');
    if (textValue.replace(/___+/g, '').trim().length < 8) issues.push('insufficient_blank_context');
  }
  if (questionType.includes('rearrange')) {
    const tokens = question.tokens || question.words || [];
    if (!Array.isArray(tokens) || tokens.length < 3) issues.push('incomplete_rearrange_tokens');
  }
  if (options.length && answer && !options.map(item => normalizeEnglishChildText(item).toLocaleLowerCase('en-MY')).includes(answer.toLocaleLowerCase('en-MY'))) issues.push('expected_answer_missing');
  const purity = detectEnglishLanguagePurity(textValue, { expectedLanguage: 'english', contentType: question.contentType });
  if (!purity.valid) issues.push('mixed_language');
  return { valid: issues.length === 0, issues: [...new Set(issues)], severity: issues.some(issue => ['missing_question_text', 'missing_expected_answer', 'mixed_language', 'unresolved_placeholder', 'incomplete_question'].includes(issue)) ? 'high' : issues.length ? 'medium' : 'low' };
}

export function normalizeEnglishQuestionObject(question = {}) {
  const next = normalizeEnglishQuestionRecord(question);
  if (!next.q && next.question) next.q = next.question;
  if (!next.question && next.q) next.question = next.q;
  const completeness = validateEnglishQuestionCompleteness(next);
  if (!completeness.valid && completeness.issues.includes('incomplete_question')) {
    const repaired = repairEnglishSentence(next.q || next.question || '');
    next.q = repaired.repairedText;
    next.question = repaired.repairedText;
  }
  return next;
}

export function validateEnglishSentence(sentence = '', context = {}) {
  const value = text(sentence);
  const issues = [];
  if (!value) issues.push('empty_sentence');
  if (INTERNAL_TOKEN_PATTERN.test(value)) issues.push('internal_id');
  INTERNAL_TOKEN_PATTERN.lastIndex = 0;
  if (DUPLICATE_ENTITY_PATTERN.test(value)) issues.push('duplicate_entities');
  DUPLICATE_ENTITY_PATTERN.lastIndex = 0;
  if (COORDINATED_DUPLICATE_PATTERN.test(value)) issues.push('duplicate_entities');
  COORDINATED_DUPLICATE_PATTERN.lastIndex = 0;
  if (DUPLICATE_WORD_PATTERN.test(value)) issues.push('duplicate_words');
  DUPLICATE_WORD_PATTERN.lastIndex = 0;
  if (/\s+[,.!?]/.test(value)) issues.push('punctuation_spacing');
  if (/[!?\.]{2,}$/.test(value)) issues.push('duplicate_punctuation');
  if (value && /^\p{Ll}/u.test(value) && /[.!?]$/.test(value)) issues.push('capitalization');
  if (/\ba\s+[aeiou][a-z]+\b/i.test(value)) issues.push('article_a_an');
  if (/\ban\s+(?:cat|dog|book|bird|uniform|university)\b/i.test(value)) issues.push('article_a_an');
  if (/(?<!does )(?<!and )\b(?:he|she|it|ali|aina|sara|amir|ravi|lina|mei|maya|hakim)\s+(?:run|read|play|go|eat|like|have|do)\b/i.test(value)) issues.push('subject_verb_agreement');
  if (/\b(?:they|we|you|the boys|the girls)\s+(?:runs|reads|plays|goes|eats|likes|has|does)\b/i.test(value)) issues.push('subject_verb_agreement');
  if (/\b(?:they|we|you|the boys|the girls|the children)\s+is\b/i.test(value) || /\b(?:he|she|it|Ali|Aina|Sara|Amir|Ravi|Lina|Mei)\s+are\b/i.test(value)) issues.push('is_are_confusion');
  if (/\b(?:they|we|you|the boys|the girls|the children)\s+has\b/i.test(value) || /\b(?:he|she|it|Ali|Aina|Sara|Amir|Ravi|Lina|Mei)\s+have\b/i.test(value)) issues.push('has_have_confusion');
  if (/\b(?:a|an)\s+(?:cats|dogs|books|birds|pencils)\b/i.test(value)) issues.push('singular_plural');
  if (/\b(?:Aina|Sara|Maya)\s+is\b[\s\S]*\bHe\b/.test(value) || /\b(?:The boys|The girls)\s+are\b[\s\S]*\bShe\b/.test(value)) issues.push('pronoun_mismatch');
  if (/\b(?:two|three|four|these|those)\s+[a-z]+\b/i.test(value) && /\b(?:cat|book|dog|bird|pencil)\b/i.test(value) && !/\b(?:cats|books|dogs|birds|pencils)\b/i.test(value)) issues.push('singular_plural');
  if (context.expectedAnswer && !key(value).includes(key(context.expectedAnswer)) && context.requireAnswerInText) issues.push('expected_answer_mismatch');
  const severity = issues.some(item => ['internal_id', 'duplicate_entities', 'subject_verb_agreement', 'expected_answer_mismatch'].includes(item)) ? 'high' : issues.length ? 'medium' : 'low';
  return { valid: issues.length === 0, issues, repairedText: value, severity };
}

export function repairEnglishSentence(sentence = '', context = {}) {
  const original = normalizeEnglishChildText(sentence);
  let repaired = original;
  for (const [pattern, replacement] of MALAY_TO_ENGLISH_REPAIRS) repaired = repaired.replace(pattern, replacement);
  if (PLACEHOLDER_PATTERN.test(repaired) && context.fallback) repaired = context.fallback;
  repaired = repaired.replace(DUPLICATE_ENTITY_PATTERN, (full, first) => {
    const replacement = replacementFor(first, context.candidates || ['Ali', 'Adam', 'Sara', 'Lina', 'Aina', 'Maya', 'Mother', 'Father', 'the ball']);
    return full.replace(new RegExp(`\\b${first}\\b$`, 'iu'), replacement);
  });
  DUPLICATE_ENTITY_PATTERN.lastIndex = 0;
  repaired = repaired.replace(COORDINATED_DUPLICATE_PATTERN, (full, first) => `${first} and ${replacementFor(first, context.candidates || ['Ali', 'Adam', 'Sara', 'Lina', 'Aina', 'Maya'])}`);
  COORDINATED_DUPLICATE_PATTERN.lastIndex = 0;
  for (const [pattern, replacement] of UNNATURAL_PATTERNS) repaired = repaired.replace(pattern, replacement);
  repaired = repaired.replace(/\b(he|she|it|Ali|Aina|Sara|Maya)\s+(run|read|play|go|eat|like|have|do)\b/gi, (full, subject, verb) => `${subject} ${THIRD_PERSON_FORMS[verb.toLowerCase()] || verb}`);
  repaired = repaired.replace(/\b(they|we|you|the boys|the girls)\s+(runs|reads|plays|goes|eats|likes|has|does)\b/gi, (full, subject, verb) => `${subject} ${PLURAL_FORMS[verb.toLowerCase()] || verb}`);
  repaired = repaired.replace(/\b(they|we|you|the boys|the girls|the children)\s+is\b/gi, '$1 are');
  repaired = repaired.replace(/\b(he|she|it)\s+are\b/gi, '$1 is');
  repaired = repaired.replace(/\b(they|we|you|the boys|the girls|the children)\s+has\b/gi, '$1 have');
  repaired = repaired.replace(/\b(he|she|it)\s+have\b/gi, '$1 has');
  repaired = repaired.replace(/\b(two|three|four|these|those)\s+(cat|book|dog|bird|pencil)\b/gi, '$1 $2s');
  repaired = repaired.replace(/\b(Aina|Sara|Maya)\s+is\b([\s\S]*?)\bHe\b/g, '$1 is$2She');
  repaired = repaired.replace(/\b(The boys|The girls)\s+are\b([\s\S]*?)\bShe\b/g, '$1 are$2They');
  repaired = repaired.replace(/\b(they|we|you|the boys|the girls|the children)\s+is\b/gi, '$1 are');
  repaired = repaired.replace(/\ba\s+([aeiou][a-z]+)/gi, 'an $1');
  repaired = repaired.replace(/\ban\s+(cat|dog|book|bird|uniform|university)\b/gi, 'a $1');
  repaired = repaired.replace(/\s+([,.!?])/g, '$1').replace(/([.!?]){2,}/g, '$1');
  if (repaired && /^\p{Ll}/u.test(repaired)) repaired = repaired.charAt(0).toUpperCase() + repaired.slice(1);
  repaired = joinEnglishFragments([repaired]);
  const result = validateEnglishSentence(repaired, context);
  return { valid: result.valid, issues: result.issues, repairedText: result.valid ? repaired : original, severity: result.severity };
}

export function validateEnglishOptions(options = [], expectedAnswer = '') {
  const list = Array.isArray(options) ? options.map(normalizeEnglishChildText) : [];
  const normalized = list.map(key);
  const issues = [];
  if (!list.length) issues.push('empty_options');
  if (list.some(value => !value)) issues.push('empty_option');
  if (new Set(normalized).size !== normalized.length) issues.push('duplicate_options');
  if (expectedAnswer && !normalized.includes(key(expectedAnswer))) issues.push('expected_answer_missing');
  if (list.some(value => INTERNAL_TOKEN_PATTERN.test(value))) issues.push('internal_id');
  INTERNAL_TOKEN_PATTERN.lastIndex = 0;
  return { valid: issues.length === 0, issues, repairedText: list, severity: issues.length ? 'high' : 'low' };
}

export function validateEnglishQuestion(question = {}) {
  const questionText = normalizeEnglishChildText(question.q || question.question || question.text || '');
  const answer = normalizeEnglishChildText(question.answer || question.correctAnswer || '');
  const sentence = validateEnglishSentence(questionText, { expectedAnswer: answer, requireAnswerInText: false });
  const options = validateEnglishOptions(question.options || question.choices || question.accepted || [], answer);
  const issues = [...new Set([...sentence.issues, ...(question.options || question.choices ? options.issues : [])])];
  return { valid: issues.length === 0, issues, severity: issues.some(item => ['internal_id', 'expected_answer_missing'].includes(item)) ? 'high' : issues.length ? 'medium' : 'low' };
}

export function normalizeEnglishQuestionRecord(record = {}) {
  const next = { ...record };
  const sourceFields = ['q', 'question', 'explanation', 'hint'];
  for (const field of sourceFields) {
    if (typeof next[field] !== 'string') continue;
    const result = repairEnglishSentence(next[field]);
    next[field] = result.repairedText;
  }
  if (Array.isArray(next.options)) next.options = next.options.map(value => normalizeEnglishChildText(value));
  if (Array.isArray(next.accepted)) next.accepted = next.accepted.map(value => normalizeEnglishChildText(value));
  return next;
}

export function normalizeEnglishSubject(subject = {}) {
  return {
    ...subject,
    topics: Array.isArray(subject.topics)
      ? subject.topics.map(topic => ({
          ...topic,
          questions: Array.isArray(topic.questions) ? topic.questions.map(normalizeEnglishQuestionObject) : topic.questions
        }))
      : subject.topics
  };
}

export default {
  validateEnglishSentence,
  detectEnglishLanguagePurity,
  detectTruncatedEnglishText,
  validateResolvedEnglishTemplate,
  joinEnglishFragments,
  validateEnglishQuestionCompleteness,
  normalizeEnglishQuestionObject,
  repairEnglishSentence,
  validateEnglishQuestion,
  validateEnglishOptions,
  pickDistinctEnglishEntity,
  normalizeEnglishChildText,
  normalizeEnglishQuestionRecord,
  normalizeEnglishSubject
};
