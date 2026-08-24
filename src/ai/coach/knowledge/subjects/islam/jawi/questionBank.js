const MOJIBAKE_TO_JAWI = [
  ['Ø§', 'ا'],
  ['Ø¨', 'ب'],
  ['Øª', 'ت'],
  ['Ø«', 'ث'],
  ['Ø¬', 'ج'],
  ['Ø­', 'ح'],
  ['Ø®', 'خ'],
  ['Ø¯', 'د'],
  ['Ø°', 'ذ'],
  ['Ø±', 'ر'],
  ['Ø²', 'ز'],
  ['Ø³', 'س'],
  ['Ø´', 'ش'],
  ['Øµ', 'ص'],
  ['Ø¶', 'ض'],
  ['Ø·', 'ط'],
  ['Ø¸', 'ظ'],
  ['Ø¹', 'ع'],
  ['Øº', 'غ'],
  ['Ù', 'ف'],
  ['Ù‚', 'ق'],
  ['Ú©', 'ک'],
  ['Ù„', 'ل'],
  ['Ù…', 'م'],
  ['Ù†', 'ن'],
  ['Ùˆ', 'و'],
  ['Ú¾', 'ھ'],
  ['ÙŠ', 'ي'],
  ['Ú ', 'ڠ'],
  ['Ú¤', 'ڤ'],
  ['Ú¬', 'ڬ'],
  ['Ú½', 'ڽ'],
  ['Ú†', 'چ'],
  ['Ù„Ø§', 'لا'],
  ['Ø¡', 'ء']
];

const JAWI_LETTER_MAP = [
  ['ا', 'alif'],
  ['ب', 'ba'],
  ['ت', 'ta'],
  ['ث', 'sa'],
  ['ج', 'jim'],
  ['ح', 'ha'],
  ['خ', 'kha'],
  ['د', 'dal'],
  ['ذ', 'zal'],
  ['ر', 'ra'],
  ['ز', 'zai'],
  ['س', 'sin'],
  ['ش', 'syin'],
  ['ص', 'sad'],
  ['ض', 'dad'],
  ['ط', 'tho'],
  ['ظ', 'zho'],
  ['ع', 'ain'],
  ['غ', 'ghain'],
  ['ف', 'fa'],
  ['ق', 'qaf'],
  ['ک', 'kaf'],
  ['ل', 'lam'],
  ['م', 'mim'],
  ['ن', 'nun'],
  ['و', 'wau'],
  ['ھ', 'ha simpul'],
  ['ي', 'ya'],
  ['ڠ', 'nga'],
  ['ڤ', 'pa'],
  ['ڬ', 'ga'],
  ['ڽ', 'nya'],
  ['چ', 'ca'],
  ['لا', 'lam alif'],
  ['ء', 'hamzah']
];

const JAWI_BY_RUMI = Object.fromEntries(JAWI_LETTER_MAP.map(([jawi, rumi]) => [rumi, jawi]));

const JAWI_REF_HELPERS = {
  direction: {
    rumiWord: 'kanan',
    jawiText: 'جاوي',
    pronunciationHint: 'ka-nan',
    explanation: 'Tulisan Jawi dibaca dan ditulis dari kanan ke kiri.',
    commonMistake: 'Jangan baca Jawi dari kiri ke kanan.',
    memoryTip: 'Ingat: Jawi bergerak dari kanan ke kiri.',
    difficulty: 'easy'
  },
  ba: {
    rumiWord: 'ba',
    jawiText: 'ب',
    pronunciationHint: 'ba',
    explanation: 'Huruf ب disebut ba dan mempunyai satu titik di bawah.',
    commonMistake: 'Jangan tertukar ب dengan ت atau ث.',
    memoryTip: 'Satu titik di bawah = ba.',
    difficulty: 'easy'
  },
  ta: {
    rumiWord: 'ta',
    jawiText: 'ت',
    pronunciationHint: 'ta',
    explanation: 'Huruf ت disebut ta dan mempunyai dua titik di atas.',
    commonMistake: 'Jangan tertukar ta dengan ba.',
    memoryTip: 'Dua titik di atas = ta.',
    difficulty: 'easy'
  }
};

function normalizeJawiUnicode(value = '') {
  let text = String(value ?? '');
  for (const [bad, good] of MOJIBAKE_TO_JAWI) {
    text = text.split(bad).join(good);
  }
  return text;
}

function normalizeText(value = '') {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function extractRumiReference(question = '', answer = '') {
  const text = String(question || '');
  const directLetterName = text.match(/Nama huruf Jawi\s+[^\s]+\s+ialah/i);
  if (directLetterName) {
    return String(answer || '').trim();
  }

  const explicitName = text.match(/Huruf\s+([^\s]+)\s+dalam Jawi/i);
  if (explicitName?.[1]) {
    return normalizeJawiUnicode(explicitName[1]).trim();
  }

  const writtenAs = text.match(/Huruf\s+([^\s]+)\s+ditulis/i);
  if (writtenAs?.[1]) {
    return normalizeJawiUnicode(writtenAs[1]).trim();
  }

  if (text.includes('Jawi')) {
    return 'Jawi';
  }

  return String(answer || '').trim();
}

function buildLetterQuestion(letter, name) {
  const jawiLetter = normalizeJawiUnicode(letter);
  const rumiWord = normalizeText(name);
  return {
    q: `Nama huruf Jawi ${jawiLetter} ialah ________.`,
    question: `Nama huruf Jawi ${jawiLetter} ialah ________.`,
    rumiWord,
    jawiText: jawiLetter,
    answer: rumiWord,
    acceptedAnswers: [rumiWord],
    accepted: [rumiWord],
    hint: 'Perhatikan bentuk huruf Jawi.',
    pronunciationHint: `Sebut ${rumiWord} dengan jelas.`,
    explanation: `Huruf ${jawiLetter} dinamakan ${rumiWord}.`,
    commonMistake: `Jangan tertukar huruf ${jawiLetter} dengan huruf lain.`,
    memoryTip: `Ingat ${jawiLetter} = ${rumiWord}.`,
    difficulty: 'easy'
  };
}

function buildJawiQuestionMeta(item = {}) {
  const question = normalizeJawiUnicode(normalizeText(item.question || ''));
  const answer = normalizeJawiUnicode(normalizeText(item.answer || ''));
  const acceptedAnswers = Array.isArray(item.acceptedAnswers) && item.acceptedAnswers.length
    ? item.acceptedAnswers
    : [answer];
  const helper = item.helper ? JAWI_REF_HELPERS[item.helper] || {} : {};
  const rumiWord = normalizeText(
    item.rumiWord ||
    helper.rumiWord ||
    extractRumiReference(question, answer) ||
    answer
  );
  const inferredJawi = JAWI_BY_RUMI[rumiWord] || JAWI_BY_RUMI[answer] || '';
  const jawiText = normalizeJawiUnicode(normalizeText(item.jawiText || helper.jawiText || inferredJawi || answer || ''))
    || (question.includes('Jawi') ? 'جاوي' : '');

  return {
    q: question,
    question,
    rumiWord,
    jawiText,
    answer,
    acceptedAnswers: [...new Set(acceptedAnswers.map(value => normalizeJawiUnicode(normalizeText(value))).filter(Boolean))],
    accepted: [...new Set(acceptedAnswers.map(value => normalizeJawiUnicode(normalizeText(value))).filter(Boolean))],
    hint: normalizeText(item.hint || ''),
    pronunciationHint: normalizeText(item.pronunciationHint || helper.pronunciationHint || item.hint || ''),
    explanation: normalizeText(item.explanation || helper.explanation || ''),
    commonMistake: normalizeText(item.commonMistake || helper.commonMistake || ''),
    memoryTip: normalizeText(item.memoryTip || helper.memoryTip || ''),
    difficulty: normalizeText(item.difficulty || helper.difficulty || 'easy') || 'easy'
  };
}

export {
  JAWI_LETTER_MAP,
  JAWI_REF_HELPERS,
  buildJawiQuestionMeta,
  buildLetterQuestion,
  normalizeJawiUnicode
};

export default {
  JAWI_LETTER_MAP,
  JAWI_REF_HELPERS,
  buildJawiQuestionMeta,
  buildLetterQuestion,
  normalizeJawiUnicode
};
