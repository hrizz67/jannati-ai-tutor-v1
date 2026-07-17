import { GENERAL_PATTERNS, MISTAKE_TYPES, getRulesForSubject } from './mistakePatterns.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toText(value) {
  return String(value ?? '').trim();
}

function toLowerText(value) {
  return toText(value).toLowerCase();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function textBundle({ question = {}, topic = {}, subject = {}, answer = '', correctAnswer = '' } = {}) {
  return [
    question.question,
    question.text,
    question.prompt,
    question.title,
    question.hint,
    question.explanation,
    topic.title,
    topic.displayName,
    topic.topicId,
    subject.title,
    subject.short,
    subject.id,
    answer,
    correctAnswer
  ].map(item => toLowerText(item)).filter(Boolean).join(' | ');
}

function numericAnswer(value = '') {
  const text = toText(value).replace(/[, ]/g, '');
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function calculateSimilarityScore(answer = '', correctAnswer = '') {
  const a = toLowerText(answer);
  const b = toLowerText(correctAnswer);
  if (!a || !b) return 0;
  if (a === b) return 100;
  let overlap = 0;
  for (const char of new Set(a)) {
    if (b.includes(char)) overlap += 1;
  }
  return Math.min(100, Math.round((overlap / Math.max(new Set(a).size, 1)) * 100));
}

function detectMathMistake(text, question, answer, correctAnswer) {
  const numericAnswerValue = numericAnswer(answer);
  const numericCorrectValue = numericAnswer(correctAnswer);
  const hasDigits = numericAnswerValue !== null && numericCorrectValue !== null;

  if (/pinjam|borrow/i.test(text)) {
    return MISTAKE_TYPES.BORROWING_MISTAKE;
  }
  if (/bawa|carry/i.test(text)) {
    return MISTAKE_TYPES.CARRYING_MISTAKE;
  }
  if (/nilai tempat|tempat nilai|puluh|ratus/i.test(text)) {
    if (hasDigits && `${answer}`.length === `${correctAnswer}`.length && answer !== correctAnswer) {
      return MISTAKE_TYPES.DIGIT_ALIGNMENT_MISTAKE;
    }
    return MISTAKE_TYPES.PLACE_VALUE_CONFUSION;
  }
  if (/darab|×|\bx\b|jadual darab/i.test(text)) {
    return MISTAKE_TYPES.MULTIPLICATION_TABLE_RECALL;
  }
  if (/bahagi|÷|kongsi/i.test(text)) {
    return MISTAKE_TYPES.DIVISION_MISUNDERSTANDING;
  }
  if (/rm|sen|duit|harga/i.test(text)) {
    return MISTAKE_TYPES.MONEY_CALCULATION_MISTAKE;
  }
  if (/jam|minit|pukul|masa/i.test(text)) {
    return MISTAKE_TYPES.TIME_CALCULATION_MISTAKE;
  }
  if (/cm|kg|g|ml|l|meter|kilogram|liter/i.test(text)) {
    return MISTAKE_TYPES.MEASUREMENT_CONVERSION_MISTAKE;
  }
  if (hasDigits && answer !== correctAnswer) {
    return MISTAKE_TYPES.OPERATION_CONFUSION;
  }
  return MISTAKE_TYPES.UNKNOWN_MISTAKE;
}

function detectBmMistake(text) {
  if (/penjodoh/i.test(text)) return MISTAKE_TYPES.WRONG_PENJODOH_BILANGAN;
  if (/kata kerja|perbuatan/i.test(text)) return MISTAKE_TYPES.WRONG_KATA_KERJA;
  if (/kata nama|nama orang|nama tempat|haiwan|benda/i.test(text)) return MISTAKE_TYPES.WRONG_KATA_NAMA;
  if (/kata adjektif|sifat|warna|besar|kecil/i.test(text)) return MISTAKE_TYPES.WRONG_KATA_ADJEKTIF;
  if (/kata hubung|dan|atau|tetapi/i.test(text)) return MISTAKE_TYPES.WRONG_KATA_HUBUNG;
  if (/kata sendi|di |ke |dari |daripada/i.test(text)) return MISTAKE_TYPES.WRONG_KATA_SENDI;
  if (/ayat|susunan|struktur/i.test(text)) return MISTAKE_TYPES.SENTENCE_STRUCTURE_ISSUE;
  if (/tatabahasa|imbuhan|ganti nama/i.test(text)) return MISTAKE_TYPES.GRAMMAR_ISSUE;
  if (/baca|petikan|faham|maksud|cerita/i.test(text)) return MISTAKE_TYPES.READING_COMPREHENSION_ISSUE;
  return MISTAKE_TYPES.UNKNOWN_MISTAKE;
}

function detectEnglishMistake(text) {
  if (/\b(is|are|am|was|were|he|she|they)\b/i.test(text)) return MISTAKE_TYPES.SUBJECT_VERB_AGREEMENT;
  if (/\b(plural|singular|many|one)\b/i.test(text)) return MISTAKE_TYPES.PLURAL_CONFUSION;
  if (/\b(past|present|future|tense)\b/i.test(text)) return MISTAKE_TYPES.VERB_TENSE_CONFUSION;
  if (/\b(in|on|at|to|from|under|over|between)\b/i.test(text)) return MISTAKE_TYPES.PREPOSITION_MISTAKE;
  if (/\b(a|an|the)\b/i.test(text)) return MISTAKE_TYPES.ARTICLE_MISTAKE;
  if (/\b(vocabulary|meaning|word)\b/i.test(text)) return MISTAKE_TYPES.VOCABULARY_CONFUSION;
  if (/\b(read|comprehension|passage|question)\b/i.test(text)) return MISTAKE_TYPES.READING_COMPREHENSION_MISTAKE;
  return MISTAKE_TYPES.UNKNOWN_MISTAKE;
}

function detectScienceMistake(text) {
  if (/\b(observe|pemerhatian)\b/i.test(text)) return MISTAKE_TYPES.OBSERVATION_MISTAKE;
  if (/\b(classify|group|mengelaskan)\b/i.test(text)) return MISTAKE_TYPES.CLASSIFICATION_MISTAKE;
  if (/\b(living|non-living|hidup|bukan hidup)\b/i.test(text)) return MISTAKE_TYPES.LIVING_NON_LIVING_CONFUSION;
  if (/\b(body part|anggota badan)\b/i.test(text)) return MISTAKE_TYPES.BODY_PARTS_MISUNDERSTANDING;
  if (/\b(plant|tumbuhan|akar|daun|batang)\b/i.test(text)) return MISTAKE_TYPES.PLANT_MISCONCEPTION;
  if (/\b(matter|bahan|solid|liquid|gas)\b/i.test(text)) return MISTAKE_TYPES.MATTER_MISCONCEPTION;
  if (/\b(light|cahaya|sound|bunyi)\b/i.test(text)) return MISTAKE_TYPES.LIGHT_SOUND_MISCONCEPTION;
  return MISTAKE_TYPES.CONCEPT_MISCONCEPTION;
}

function detectArabicMistake(text) {
  if (/\b(vocabulary|kosa kata)\b/i.test(text)) return MISTAKE_TYPES.ARABIC_VOCABULARY_CONFUSION;
  if (/\b(letter|huruf|alphabet)\b/i.test(text)) return MISTAKE_TYPES.LETTER_CONFUSION;
  if (/\b(pronounce|sebut|bunyi)\b/i.test(text)) return MISTAKE_TYPES.PRONUNCIATION_CONFUSION;
  if (/\b(read|baca)\b/i.test(text)) return MISTAKE_TYPES.READING_MISTAKE;
  if (/\b(write|tulis)\b/i.test(text)) return MISTAKE_TYPES.WRITING_MISTAKE;
  if (/\b(male|female|muzakkar|muannath)\b/i.test(text)) return MISTAKE_TYPES.GENDER_CONFUSION;
  if (/\b(number|singular|plural|satu|banyak)\b/i.test(text)) return MISTAKE_TYPES.NUMBER_CONFUSION;
  return MISTAKE_TYPES.UNKNOWN_MISTAKE;
}

function detectIslamMistake(text) {
  if (/\bjawi\b/i.test(text)) return MISTAKE_TYPES.JAWI_READING_ISSUE;
  if (/\bhafazan|hafal|doa|surah\b/i.test(text)) return MISTAKE_TYPES.HAFAZAN_RECALL_ISSUE;
  if (/\bsolat|wuduk|urutan|langkah\b/i.test(text)) return MISTAKE_TYPES.IBADAH_SEQUENCE_ISSUE;
  if (/\bakhlak|adab|sopan\b/i.test(text)) return MISTAKE_TYPES.AKHLAK_MISCONCEPTION;
  if (/\bsirah|rasulullah|saw\b/i.test(text)) return MISTAKE_TYPES.SIRAH_CONFUSION;
  return MISTAKE_TYPES.UNKNOWN_MISTAKE;
}

function detectPjPkMistake(text) {
  if (/\bkeselamatan|safety|bahaya\b/i.test(text)) return MISTAKE_TYPES.SAFETY_MISCONCEPTION;
  if (/\bkesihatan|health|sihat\b/i.test(text)) return MISTAKE_TYPES.HEALTH_MISCONCEPTION;
  if (/\bpergerakan|movement|gerak\b/i.test(text)) return MISTAKE_TYPES.BODY_MOVEMENT_MISUNDERSTANDING;
  if (/\bpemakanan|nutrition|makanan\b/i.test(text)) return MISTAKE_TYPES.NUTRITION_MISUNDERSTANDING;
  return MISTAKE_TYPES.UNKNOWN_MISTAKE;
}

function detectSubjectMistake(subjectId = '', text = '', question = {}) {
  const normalized = String(subjectId || '').toLowerCase();
  if (normalized === 'math' || normalized === 'matematik') return detectMathMistake(text, question);
  if (normalized === 'bm' || normalized === 'bahasa_melayu') return detectBmMistake(text, question);
  if (normalized === 'english' || normalized === 'en') return detectEnglishMistake(text, question);
  if (normalized === 'sains' || normalized === 'science') return detectScienceMistake(text, question);
  if (normalized === 'arab' || normalized === 'bahasa_arab') return detectArabicMistake(text, question);
  if (normalized === 'islam' || normalized === 'pendidikan_islam') return detectIslamMistake(text, question);
  if (normalized === 'pj' || normalized === 'pk' || normalized === 'pjpk') return detectPjPkMistake(text, question);
  return MISTAKE_TYPES.UNKNOWN_MISTAKE;
}

function getRuleForMistake(subjectId = '', type = MISTAKE_TYPES.UNKNOWN_MISTAKE) {
  const rules = getRulesForSubject(subjectId);
  return rules.find(rule => rule.type === type) || GENERAL_PATTERNS[0];
}

export function classifyMistake(input = {}) {
  const question = clone(input.question || {});
  const subject = clone(input.subject || {});
  const topic = clone(input.topic || {});
  const subjectId = String(input.subjectId || subject.id || subject.subjectId || topic.subjectId || '').toLowerCase();
  const topicId = String(input.topicId || topic.id || topic.topicId || '').trim();
  const subTopic = String(input.subTopic || topic.subTopic || topic.subtopic || '').trim();
  const answer = toText(input.answer ?? input.userAnswer ?? '');
  const correctAnswer = toText(input.correctAnswer ?? question.answer ?? '');
  const text = textBundle({ question, topic, subject, answer, correctAnswer });
  let detectedPattern = detectSubjectMistake(subjectId, text, question);
  if (detectedPattern === MISTAKE_TYPES.UNKNOWN_MISTAKE && subjectId === 'math') {
    detectedPattern = detectMathMistake(text, question, answer, correctAnswer);
  }

  const rule = getRuleForMistake(subjectId, detectedPattern);
  const similarity = calculateSimilarityScore(answer, correctAnswer);
  const confidence = Math.max(
    35,
    Math.min(
      95,
      Math.round(
        40 +
        (detectedPattern === MISTAKE_TYPES.UNKNOWN_MISTAKE ? -10 : 20) +
        (similarity > 0 && similarity < 100 ? 8 : 0)
      )
    )
  );
  const difficultyLevel = toText(input.difficultyLevel || question.difficulty || topic.difficulty || 'medium', 'medium');
  const timestamp = input.timestamp || new Date().toISOString();
  const baseSuggestion = rule.teacherSuggestion || 'Baca semula langkah dengan perlahan.';
  const basePractice = rule.recommendedPractice || 'Ulang latihan ringkas untuk topik ini.';

  return {
    mistakeId: `${subjectId || 'unknown'}:${topicId || 'unknown'}:${detectedPattern}:${timestamp}`,
    mistakeType: detectedPattern,
    confidence,
    subject: subjectId || null,
    topic: topicId || null,
    subTopic: subTopic || null,
    detectedPattern,
    teacherSuggestion: baseSuggestion,
    recommendedPractice: basePractice,
    difficultyLevel,
    timestamp,
    questionId: input.questionId || question.id || null,
    subjectTitle: subject.title || question.subjectTitle || '',
    topicTitle: topic.title || question.topicTitle || '',
    userAnswer: answer,
    correctAnswer,
    similarity,
    source: detectedPattern === MISTAKE_TYPES.UNKNOWN_MISTAKE ? 'fallback' : 'rule'
  };
}

export function classifyMistakes(entries = []) {
  return (Array.isArray(entries) ? entries : [entries]).map(classifyMistake);
}

export default {
  classifyMistake,
  classifyMistakes
};
