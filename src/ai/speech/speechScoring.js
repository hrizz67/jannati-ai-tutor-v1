const MALAY_NUMBER_WORDS = new Map([
  ['sifar', '0'],
  ['satu', '1'],
  ['dua', '2'],
  ['tiga', '3'],
  ['empat', '4'],
  ['lima', '5'],
  ['enam', '6'],
  ['tujuh', '7'],
  ['lapan', '8'],
  ['sembilan', '9'],
  ['sepuluh', '10']
]);

const ENGLISH_NUMBER_WORDS = new Map([
  ['zero', '0'],
  ['one', '1'],
  ['two', '2'],
  ['three', '3'],
  ['four', '4'],
  ['five', '5'],
  ['six', '6'],
  ['seven', '7'],
  ['eight', '8'],
  ['nine', '9'],
  ['ten', '10'],
  ['eleven', '11'],
  ['twelve', '12'],
  ['thirteen', '13'],
  ['fourteen', '14'],
  ['fifteen', '15'],
  ['sixteen', '16'],
  ['seventeen', '17'],
  ['eighteen', '18'],
  ['nineteen', '19'],
  ['twenty', '20']
]);

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu;
const ARABIC_TATWEEL = /\u0640/gu;
const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC_INDIC_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const MALAY_NUMERIC_CONTEXT_WORDS = new Set(['angka', 'digit', 'jam', 'kod', 'nombor', 'pukul', 'telefon']);

function resolveComparisonLanguage(language = '') {
  const normalized = String(language ?? '').trim().toLowerCase();
  if (normalized === 'bm' || normalized === 'ms' || normalized.startsWith('ms-') || normalized.includes('melayu')) return 'ms';
  if (normalized === 'english' || normalized === 'en' || normalized.startsWith('en-') || normalized.includes('inggeris')) return 'en';
  if (normalized === 'arab' || normalized === 'arabic' || normalized === 'ar' || normalized.startsWith('ar-')) return 'ar';
  return '';
}

function normalizeUnicodeDigits(value) {
  return [...value].map(character => {
    const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(character);
    if (arabicIndex >= 0) return String(arabicIndex);
    const easternIndex = EASTERN_ARABIC_INDIC_DIGITS.indexOf(character);
    return easternIndex >= 0 ? String(easternIndex) : character;
  }).join('');
}

function normalizeNumberEquivalent(value, language) {
  if (/^\d+$/u.test(value)) return String(Number(value));
  if (language === 'ms') return MALAY_NUMBER_WORDS.get(value) ?? value;
  if (language === 'en') return ENGLISH_NUMBER_WORDS.get(value) ?? value;
  return value;
}

export function normalizeSpeechToken(value = '', { language = '' } = {}) {
  const comparisonLanguage = resolveComparisonLanguage(language);
  const normalized = normalizeUnicodeDigits(String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase(comparisonLanguage || undefined)
    .replace(ARABIC_TATWEEL, '')
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim());
  return normalizeNumberEquivalent(normalized, comparisonLanguage);
}

export function tokenizeSpeechComparison(value = '', options = {}) {
  const comparisonLanguage = resolveComparisonLanguage(options.language);
  const tokens = String(value ?? '')
    .normalize('NFKC')
    .trim()
    .split(/\s+/u)
    .map(raw => ({ raw, normalized: normalizeSpeechToken(raw, options) }))
    .filter(token => token.normalized);
  if (comparisonLanguage !== 'ms') return tokens;

  return tokens.map((token, index) => {
    if (token.normalized !== 'kosong') return token;
    const previous = tokens[index - 1]?.normalized || '';
    const next = tokens[index + 1]?.normalized || '';
    const isNumericContext = tokens.length === 1
      || MALAY_NUMERIC_CONTEXT_WORDS.has(previous)
      || /^\d+$/u.test(previous)
      || /^\d+$/u.test(next);
    return isNumericContext ? { ...token, normalized: '0' } : token;
  });
}

export function normalizeSpeechComparisonText(value = '', options = {}) {
  return tokenizeSpeechComparison(value, options).map(token => token.normalized).join(' ');
}

function createDistanceTable(targetTokens, spokenTokens) {
  const rows = Array.from(
    { length: targetTokens.length + 1 },
    () => Array(spokenTokens.length + 1).fill(0)
  );
  for (let targetIndex = 0; targetIndex <= targetTokens.length; targetIndex += 1) rows[targetIndex][0] = targetIndex;
  for (let spokenIndex = 0; spokenIndex <= spokenTokens.length; spokenIndex += 1) rows[0][spokenIndex] = spokenIndex;

  for (let targetIndex = 1; targetIndex <= targetTokens.length; targetIndex += 1) {
    for (let spokenIndex = 1; spokenIndex <= spokenTokens.length; spokenIndex += 1) {
      const isEquivalent = targetTokens[targetIndex - 1].normalized === spokenTokens[spokenIndex - 1].normalized;
      rows[targetIndex][spokenIndex] = Math.min(
        rows[targetIndex - 1][spokenIndex] + 1,
        rows[targetIndex][spokenIndex - 1] + 1,
        rows[targetIndex - 1][spokenIndex - 1] + (isEquivalent ? 0 : 1)
      );
    }
  }
  return rows;
}

export function alignSpeechTokens(targetText = '', transcript = '', options = {}) {
  const targetTokens = tokenizeSpeechComparison(targetText, options);
  const spokenTokens = tokenizeSpeechComparison(transcript, options);
  const rows = createDistanceTable(targetTokens, spokenTokens);
  const reversed = [];
  let targetIndex = targetTokens.length;
  let spokenIndex = spokenTokens.length;

  while (targetIndex > 0 || spokenIndex > 0) {
    const targetToken = targetIndex > 0 ? targetTokens[targetIndex - 1] : null;
    const spokenToken = spokenIndex > 0 ? spokenTokens[spokenIndex - 1] : null;
    const isEquivalent = Boolean(targetToken && spokenToken && targetToken.normalized === spokenToken.normalized);

    if (targetIndex > 0 && spokenIndex > 0 && isEquivalent
      && rows[targetIndex][spokenIndex] === rows[targetIndex - 1][spokenIndex - 1]) {
      reversed.push({ status: 'correct', target: targetToken, spoken: spokenToken });
      targetIndex -= 1;
      spokenIndex -= 1;
      continue;
    }

    if (targetIndex > 0 && spokenIndex > 0
      && rows[targetIndex][spokenIndex] === rows[targetIndex - 1][spokenIndex - 1] + 1) {
      reversed.push({ status: 'substitution', target: targetToken, spoken: spokenToken });
      targetIndex -= 1;
      spokenIndex -= 1;
      continue;
    }

    if (targetIndex > 0 && rows[targetIndex][spokenIndex] === rows[targetIndex - 1][spokenIndex] + 1) {
      reversed.push({ status: 'missing', target: targetToken, spoken: null });
      targetIndex -= 1;
      continue;
    }

    reversed.push({ status: 'extra', target: null, spoken: spokenToken });
    spokenIndex -= 1;
  }

  return reversed.reverse();
}

export function scoreReadingSpeech(targetText = '', transcript = '', options = {}) {
  const alignment = alignSpeechTokens(targetText, transcript, options);
  const targetEntries = alignment.filter(entry => entry.target);
  const correctEntries = alignment.filter(entry => entry.status === 'correct');
  const substitutions = alignment.filter(entry => entry.status === 'substitution');
  const missingEntries = alignment.filter(entry => entry.status === 'missing');
  const extraEntries = alignment.filter(entry => entry.status === 'extra');
  const totalTargetWords = targetEntries.length;
  const score = totalTargetWords
    ? Math.max(0, Math.round((correctEntries.length / totalTargetWords) * 100 - extraEntries.length * 2 - missingEntries.length))
    : 0;
  const words = alignment.map(entry => ({
    text: entry.target?.raw || entry.spoken?.raw || '',
    status: entry.status,
    spokenText: entry.spoken?.raw || ''
  }));
  const missed = missingEntries.map(entry => entry.target.raw);
  const extraWords = extraEntries.map(entry => entry.spoken.raw);
  const substitutionWords = substitutions.map(entry => ({
    expected: entry.target.raw,
    actual: entry.spoken.raw
  }));
  const incorrectWords = [
    ...substitutionWords.map(entry => entry.actual),
    ...extraWords
  ];

  return {
    alignment,
    words,
    correct: correctEntries.length,
    substitutions: substitutionWords,
    substitutionWordCount: substitutions.length,
    tertinggal: missed.length,
    missed,
    incorrect: incorrectWords.length,
    incorrectWords,
    extraWords,
    totalTargetWords,
    matchedWordCount: correctEntries.length,
    missedWordCount: missed.length,
    extraWordCount: extraWords.length,
    passed: score >= 80,
    score
  };
}

export function containsNormalizedSpeechPhrase(transcript = '', phrase = '', options = {}) {
  const transcriptTokens = tokenizeSpeechComparison(transcript, options).map(token => token.normalized);
  const phraseTokens = tokenizeSpeechComparison(phrase, options).map(token => token.normalized);
  if (!phraseTokens.length || phraseTokens.length > transcriptTokens.length) return false;

  return transcriptTokens.some((_, startIndex) => (
    phraseTokens.every((token, phraseIndex) => transcriptTokens[startIndex + phraseIndex] === token)
  ));
}

export function scoreSpeakingKeywords(prompt, transcript, options = {}) {
  const safePrompt = prompt && typeof prompt === 'object' ? prompt : { keywords: [] };
  const safeTranscript = typeof transcript === 'string' ? transcript : '';
  const safeKeywords = Array.isArray(safePrompt.keywords) ? safePrompt.keywords : [];
  const matched = safeKeywords.filter(keyword => containsNormalizedSpeechPhrase(safeTranscript, keyword, options));
  const missed = safeKeywords.filter(keyword => !matched.includes(keyword));
  const transcriptWords = tokenizeSpeechComparison(safeTranscript, options);
  const keywordScore = safeKeywords.length ? Math.round((matched.length / safeKeywords.length) * 80) : 0;
  const lengthBonus = transcriptWords.length >= Math.min(5, safeKeywords.length + 2) ? 20 : 8;

  return {
    score: Math.min(100, keywordScore + lengthBonus),
    matched,
    matchedKeywords: matched,
    tertinggal: missed,
    missingWords: missed,
    missed,
    words: safeKeywords.map(keyword => ({ text: keyword, status: matched.includes(keyword) ? 'correct' : 'missing' })),
    transcript: safeTranscript
  };
}
