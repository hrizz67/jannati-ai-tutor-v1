const ARABIC_CHARACTER = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
const ARABIC_RUN = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+(?:\s+[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+)*/gu;
const ANSWER_LEAKAGE = /(?:Rujukan ayat|Contoh hiwar)\s*:/iu;
const MOJIBAKE = /(?:Ø.|Ù.|Ã.|Â.|�)/u;

const ARABIC_DIGIT_PRONUNCIATION = Object.freeze({
  '١': 'wāḥid',
  '٢': 'ithnān',
  '٣': 'thalāthah',
  '٤': 'arba‘ah',
  '٥': 'khamsah',
  '٦': 'sittah',
  '٧': 'sab‘ah',
  '٨': 'thamāniyah',
  '٩': 'tis‘ah',
  '١٠': '‘asyarah',
  '١١': 'aḥada ‘asyar',
  '١٢': 'ithnā ‘asyar',
  '١٣': 'thalāthata ‘asyar',
  '١٤': 'arba‘ata ‘asyar',
  '١٥': 'khamsata ‘asyar',
  '١٦': 'sittata ‘asyar',
  '١٧': 'sab‘ata ‘asyar',
  '١٨': 'thamāniyata ‘asyar',
  '١٩': 'tis‘ata ‘asyar',
  '٢٠': '‘isyrūn'
});

const ARABIC_WORD_PRONUNCIATION = Object.freeze({
  'اسْمُكَ': 'ismuka'
});

const CONSONANTS = Object.freeze({
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'ḥ', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sy',
  'ص': 'ṣ', 'ض': 'ḍ', 'ط': 'ṭ', 'ظ': 'ẓ', 'ع': '‘', 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'ة': 't', 'ء': '’', 'ؤ': '’', 'ئ': '’', 'ى': 'ā'
});

const DIACRITIC = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/u;

function normalizeText(value = '') {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/([؟?!])\./g, '$1')
    .trim();
}

function normalizeKey(value = '') {
  return normalizeText(value).toLocaleLowerCase('ms-MY');
}

function withTerminalPunctuation(value = '') {
  const text = normalizeText(value);
  return /[.!?؟]$/u.test(text) ? text : `${text}.`;
}

function containsArabic(value = '') {
  return ARABIC_CHARACTER.test(String(value));
}

function splitArabicClusters(word = '') {
  const clusters = [];
  for (const character of Array.from(String(word).normalize('NFC'))) {
    if (DIACRITIC.test(character) && clusters.length) clusters[clusters.length - 1].marks.push(character);
    else clusters.push({ base: character, marks: [] });
  }
  return clusters;
}

function vowelFor(marks = []) {
  if (marks.includes('\u064b')) return 'an';
  if (marks.includes('\u064c')) return 'un';
  if (marks.includes('\u064d')) return 'in';
  if (marks.includes('\u064e')) return marks.includes('\u0670') ? 'ā' : 'a';
  if (marks.includes('\u064f')) return 'u';
  if (marks.includes('\u0650')) return 'i';
  if (marks.includes('\u0670')) return 'ā';
  return '';
}

function transliterateWord(rawWord = '') {
  const trailingPunctuation = rawWord.match(/[؟،؛]+$/u)?.[0] || '';
  const coreWord = trailingPunctuation ? rawWord.slice(0, -trailingPunctuation.length) : rawWord;
  const punctuation = [...trailingPunctuation].map(character => ({ '؟': '?', '،': ',', '؛': ';' }[character] || character)).join('');
  const digit = ARABIC_DIGIT_PRONUNCIATION[coreWord];
  if (digit) return `${digit}${punctuation}`;
  const authoredPronunciation = ARABIC_WORD_PRONUNCIATION[coreWord];
  if (authoredPronunciation) return `${authoredPronunciation}${punctuation}`;

  let clusters = splitArabicClusters(coreWord);
  let prefix = '';
  if (clusters[0]?.base === 'ا' && clusters[1]?.base === 'ل') {
    prefix = 'al-';
    clusters = clusters.slice(2);
    if (clusters[0]) clusters[0] = {
      ...clusters[0],
      marks: clusters[0].marks.filter(mark => mark !== '\u0651')
    };
  }

  let output = prefix;
  clusters.forEach((cluster, index) => {
    const { base, marks } = cluster;
    const isFirst = index === 0 && !prefix;
    const vowel = vowelFor(marks);
    const hasShadda = marks.includes('\u0651');

    if (base === 'ـ') return;
    if (base === 'ا') {
      if (vowel) output += vowel;
      else if (output.endsWith('a')) output = `${output.slice(0, -1)}ā`;
      else output += 'ā';
      return;
    }
    if (base === 'آ') {
      output += 'ā';
      return;
    }
    if (base === 'أ' || base === 'إ') {
      output += `${isFirst ? '' : '’'}${vowel}`;
      return;
    }
    if (base === 'و') {
      if (!vowel && output.endsWith('u')) output = `${output.slice(0, -1)}ū`;
      else output += `${hasShadda ? 'ww' : 'w'}${vowel}`;
      return;
    }
    if (base === 'ي') {
      if (!vowel && output.endsWith('i')) output = `${output.slice(0, -1)}ī`;
      else output += `${hasShadda ? 'yy' : 'y'}${vowel}`;
      return;
    }
    if (base === 'ة' && !vowel && index === clusters.length - 1) {
      output += 'h';
      return;
    }

    const consonant = CONSONANTS[base];
    if (consonant) {
      output += `${hasShadda ? consonant.repeat(2) : consonant}${vowel}`;
      return;
    }

    const punctuation = { '؟': '?', '،': ',', '؛': ';' }[base];
    output += punctuation ?? base;
  });

  return `${output.replace(/-{2,}/g, '-')}${punctuation}`;
}

export function transliterateArabic(value = '') {
  return normalizeText(value)
    .split(/\s+/)
    .map(token => transliterateWord(token))
    .join(' ')
    .replace(/\s+([?,.;])/g, '$1')
    .trim();
}

function extractArabic(value = '') {
  return normalizeText(value).match(ARABIC_RUN)?.[0]?.trim() || '';
}

function targetArabic(record = {}) {
  const answer = normalizeText(record.answer);
  if (containsArabic(answer)) return answer;
  return extractArabic(record.q || record.question)
    || normalizeText(record.arabicText)
    || extractArabic(record.explanation);
}

function deriveTranslation(record = {}) {
  const answer = normalizeText(record.answer);
  const stem = normalizeText(record.q || record.question);
  if (!containsArabic(answer)) return answer.replace(/[.?!]+$/u, '');

  const quotedMeaning = stem.match(/Bahasa Arab (?:bagi|untuk)(?: ayat)?\s+["“]([^"”]+)["”]/iu)?.[1];
  if (quotedMeaning) return normalizeText(quotedMeaning);

  const directMeaning = stem.match(/Bahasa Arab (?:bagi|untuk)\s+(.+?)\s+ialah/iu)?.[1];
  if (directMeaning) return normalizeText(directMeaning.replace(/^ayat\s+/iu, '').replace(/["“”]/g, ''));

  const requestedMeaning = stem.match(/Apakah (?:perkataan|frasa) Arab (?:yang bermaksud\s+["“]?|bagi\s+)(.+?)["”]?\?/iu)?.[1];
  if (requestedMeaning) return normalizeText(requestedMeaning);

  const symbolMeaning = stem.match(/Simbol Arab bagi nombor\s+(.+?)\s+ialah/iu)?.[1];
  if (symbolMeaning) return normalizeText(symbolMeaning);
  return normalizeText(record.explanation || record.hint);
}

function inferQuestionType(record = {}, context = {}) {
  if (record.questionType) return record.questionType;
  const stem = normalizeText(record.q || record.question);
  if (context.topicId === 'kefahaman_arab') return 'short_answer';
  if (/Bahasa Arab (?:bagi|untuk)|Apakah (?:perkataan|frasa) Arab|bermaksud|Apakah maksud/iu.test(stem)) return 'short_answer';
  if (/selepas|sebelum/iu.test(stem)) return 'fill_blank';
  return 'fill_blank';
}

function inferCognitiveLevel(record = {}, context = {}) {
  if (record.cognitiveLevel) return record.cognitiveLevel;
  const stem = normalizeText(record.q || record.question);
  if (context.topicId === 'kefahaman_arab') {
    return /\bsalin perkataan Arab\b.*\byang bermaksud\b/iu.test(stem)
      ? 'menganalisis'
      : 'memahami';
  }
  if (/Bahasa Arab (?:bagi|untuk)|Apakah (?:perkataan|frasa) Arab|selepas|sebelum/iu.test(stem)) return 'mengaplikasi';
  if (/biasanya|boleh|arah|titik|baris|bermaksud|Apakah maksud/iu.test(stem)) return 'memahami';
  return 'mengingat';
}

function cleanAcceptedAnswers(record = {}, originalRecord = {}, answerChanged = false) {
  const canonical = normalizeText(record.answer);
  const canonicalIsArabic = containsArabic(canonical);
  const source = answerChanged
    ? []
    : Array.isArray(record.accepted)
      ? record.accepted
      : Array.isArray(originalRecord.accepted)
        ? originalRecord.accepted
        : [];
  return [...new Map(
    [canonical, ...source]
      .map(normalizeText)
      .filter(Boolean)
      .filter(value => containsArabic(value) === canonicalIsArabic)
      .map(value => [normalizeKey(value), value])
  ).values()];
}

export function normalizeArabQuestionRecord(record = {}, context = {}) {
  const override = context.questionOverrides?.[record.id] || {};
  const answerChanged = Object.prototype.hasOwnProperty.call(override, 'answer')
    && normalizeKey(override.answer) !== normalizeKey(record.answer);
  const next = { ...record, ...override };
  const stem = normalizeText(next.q || next.question)
    .replace(/\s+(?:Rujukan ayat|Contoh hiwar)\s*:[\s\S]*$/iu, '')
    .trim();

  next.q = stem;
  next.question = stem;
  next.answer = normalizeText(next.answer);
  next.hint = normalizeText(next.hint);
  next.explanation = normalizeText(next.explanation);
  next.accepted = cleanAcceptedAnswers(next, record, answerChanged);
  next.questionType = inferQuestionType(next, context);
  next.cognitiveLevel = inferCognitiveLevel(next, context);

  const arabic = targetArabic(next);
  const singleUnmarkedLetter = arabic
    .replace(DIACRITIC, '')
    .replace(/[^\u0621-\u064a]/gu, '')
    .length === 1 && !DIACRITIC.test(arabic);
  const transliteration = normalizeText(
    next.pronunciationGuideOverride
      || (singleUnmarkedLetter && next.letterName ? next.letterName : transliterateArabic(arabic))
  );
  const translation = normalizeText(next.translationOverride || deriveTranslation(next));
  next.pronunciationGuide = transliteration
    ? withTerminalPunctuation(`Sebutan Rumi: ${transliteration}`)
    : normalizeText(next.pronunciationHint || next.hint);
  next.readingSteps = transliteration
    ? withTerminalPunctuation(`Baca dari kanan ke kiri mengikut perkataan: ${transliteration.split(/\s+/).join(' | ')}`)
    : 'Baca soalan dengan teliti dan sebut jawapan dengan jelas.';
  next.translation = translation;
  next.translationHint = translation ? withTerminalPunctuation(`Maksud sasaran: ${translation}`) : next.hint;
  delete next.pronunciationGuideOverride;
  delete next.translationOverride;
  return next;
}

export function normalizeArabSubject(subject = {}, config = {}) {
  return {
    ...subject,
    topics: Array.isArray(subject.topics)
      ? subject.topics.map(topic => ({
          ...topic,
          ...(config.topicEnrichments?.[topic.id] || {}),
          questions: Array.isArray(topic.questions)
            ? topic.questions.map((question, index) => normalizeArabQuestionRecord(question, {
                topicId: topic.id,
                index,
                questionOverrides: config.questionOverrides
              }))
            : topic.questions
        }))
      : subject.topics
  };
}

export function validateArabQuestionRecord(question = {}) {
  const issues = [];
  const stem = normalizeText(question.q || question.question);
  const answer = normalizeText(question.answer);
  const accepted = Array.isArray(question.accepted) ? question.accepted.map(normalizeKey) : [];
  const combined = [stem, answer, question.explanation, question.arabicText].map(normalizeText).join(' ');
  const guide = normalizeText(question.pronunciationGuide);

  if (!question.id || !stem || !answer) issues.push('missing_core_field');
  if (normalizeText(question.q) !== normalizeText(question.question)) issues.push('q_question_mismatch');
  if ((stem.match(/_{2,}/g) || []).length > 1) issues.push('invalid_blank_count');
  if (!accepted.includes(normalizeKey(answer))) issues.push('answer_not_accepted');
  if (!question.hint || !question.explanation) issues.push('missing_learning_support');
  if (!question.questionType || !question.cognitiveLevel) issues.push('missing_learning_metadata');
  if (!containsArabic(combined)) issues.push('missing_arabic_learning_target');
  if (!guide || guide === normalizeText(question.explanation) || !/[a-zāīūḥṣḍṭẓ‘’]/iu.test(guide)) issues.push('invalid_pronunciation_guide');
  if (!question.readingSteps || !question.translation || !question.translationHint) issues.push('incomplete_language_support');
  if (ANSWER_LEAKAGE.test(stem)) issues.push('answer_leakage');
  if (MOJIBAKE.test(combined) || MOJIBAKE.test(guide)) issues.push('mojibake');
  if ([question.explanation, question.pronunciationGuide, question.readingSteps, question.translationHint]
    .some(value => /[؟?!]\./u.test(value || ''))) issues.push('double_punctuation');
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}

export default {
  normalizeArabQuestionRecord,
  normalizeArabSubject,
  transliterateArabic,
  validateArabQuestionRecord
};
