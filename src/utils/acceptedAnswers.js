export function normalizeAcceptedAnswer(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[.,!?;:()[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getAcceptedAnswers(question = {}) {
  const values = [
    question?.answer,
    ...(Array.isArray(question?.accepted) ? question.accepted : []),
    ...(Array.isArray(question?.acceptedAnswers) ? question.acceptedAnswers : [])
  ];
  const seen = new Set();
  const accepted = values.map(value => String(value ?? '').trim()).filter(value => {
    // Punctuation is a valid one-character answer, but the general text
    // normalizer intentionally removes punctuation. Keep it on a separate
    // key so `!`, `?`, and `.` are not discarded during deduplication.
    const punctuation = value.match(/^[?!.,;:]$/)?.[0];
    const key = punctuation ? `punctuation:${punctuation}` : normalizeAcceptedAnswer(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // For person-name questions, preserve a valid honorific that appears in
  // the source sentence (for example, "Puan Salmah" for "Salmah").
  const questionText = normalizeAcceptedAnswer(getQuestionText(question));

  // Fill-in-the-blank questions may store the complete sentence as `answer`
  // for explanations, while the learner is only expected to type the missing
  // word or phrase. Keep the complete sentence accepted, but also accept the
  // leading phrase before the sentence remainder.
  const rawQuestion = getQuestionText(question);
  const blankMatch = rawQuestion.match(/_{2,}/);
  if (blankMatch) {
    const remainder = normalizeAcceptedAnswer(
      rawQuestion.slice((blankMatch.index || 0) + blankMatch[0].length).split(/[".?!]/)[0]
    );
    const normalizedAnswer = normalizeAcceptedAnswer(question?.answer || '');
    const remainderIndex = remainder ? normalizedAnswer.lastIndexOf(remainder) : -1;
    if (remainderIndex >= 0) {
      let blankAnswer = normalizedAnswer.slice(0, remainderIndex).trim();

      // Some prompts include context before the blank, while the stored
      // answer contains the completed sentence (for example, "Selepas
      // pulang dari sekolah, saya terus..."). Remove that prompt context so
      // only the text that belongs in the blank is accepted/displayed.
      const questionPrefix = rawQuestion.slice(0, blankMatch.index || 0);
      const lastColon = questionPrefix.lastIndexOf(':');
      const relevantPrefix = lastColon >= 0
        ? questionPrefix.slice(lastColon + 1)
        : questionPrefix;
      const normalizedPrefix = normalizeAcceptedAnswer(relevantPrefix)
        .replace(/^['"“”]+|['"“”]+$/g, '')
        .trim();
      if (normalizedPrefix && blankAnswer.startsWith(normalizedPrefix)) {
        blankAnswer = blankAnswer.slice(normalizedPrefix.length).trim();
      }

      if (blankAnswer && blankAnswer.split(' ').length <= 4 && !seen.has(blankAnswer)) {
        seen.add(blankAnswer);
        accepted.push(blankAnswer);
      }
    }
  }

  // Punctuation fill-ins ask for the missing symbol, not the complete
  // sentence stored as the model answer. Keep the full answer for context,
  // but also accept and display the terminal symbol on its own.
  if (/\b(?:tanda baca|tanda soal|tanda seru|tanda noktah|tanda koma)\b/.test(questionText)) {
    const punctuation = accepted
      .map(value => String(value).trim().match(/([?!.,;:])$/)?.[1])
      .find(Boolean);
    if (punctuation && !seen.has(punctuation)) {
      seen.add(punctuation);
      accepted.push(punctuation);
    }
  }

  if (/kata nama khas.*nama orang|nama khas.*nama orang/.test(questionText)) {
    accepted.slice().forEach(value => {
      const name = normalizeAcceptedAnswer(value);
      if (!name || name.includes(' ')) return;
      const honorific = questionText.match(new RegExp(`\\b(puan|encik|cikgu|cik|ustazah|ustaz|doktor|dr)\\s+${name}\\b`, 'i'))?.[1];
      if (!honorific) return;
      const fullName = `${honorific} ${value}`;
      const key = normalizeAcceptedAnswer(fullName);
      if (!seen.has(key)) {
        seen.add(key);
        accepted.push(fullName);
      }
    });
  }

  // Prompts that ask specifically for the penjodoh bilangan expect the
  // classifier (for example, "sebatang"), not the complete noun phrase
  // stored for the explanation (for example, "sebatang pensel merah").
  // Keep both forms accepted so older saved questions and voice answers
  // remain compatible while the feedback shows the requested word.
  if (/\bpilih penjodoh bilangan\b/.test(questionText)) {
    const classifier = normalizeAcceptedAnswer(accepted[0] || '').split(' ')[0];
    if (classifier && !seen.has(classifier)) {
      seen.add(classifier);
      accepted.push(classifier);
    }
  }

  // Classification questions often store a full explanatory sentence as
  // the answer, while pupils are expected to type only the category.
  // Preserve the explanation, but also accept the explicit category.
  if (/\b(?:jenis ayat|kenal pasti jenis|tentukan jenis)\b/.test(questionText)) {
    const category = accepted
      .map(value => normalizeAcceptedAnswer(value).match(/\bayat\s+(tanya|penyata|perintah|seruan)\b/)?.[0])
      .find(Boolean);
    if (category && !seen.has(category)) {
      seen.add(category);
      accepted.push(category);
    }
  }

  if (/\bkata nama\s+(am|khas)\b/.test(questionText)) {
    const category = accepted
      .map(value => normalizeAcceptedAnswer(value).match(/\bkata nama\s+(am|khas)\b/)?.[0])
      .find(Boolean);
    if (category && !seen.has(category)) {
      seen.add(category);
      accepted.push(category);
    }
  }

  return accepted;
}

export function getQuestionAnswerDisplay(question = {}) {
  const accepted = getAcceptedAnswers(question);
  const rawQuestion = getQuestionText(question);
  if (/\bpilih penjodoh bilangan\b/.test(normalizeAcceptedAnswer(rawQuestion))) {
    return accepted[accepted.length - 1] || accepted[0] || String(question?.answer || question?.correctAnswer || '').trim();
  }
  if (/\bjenis ayat\b/.test(normalizeAcceptedAnswer(rawQuestion)) || /\bkata nama\s+(am|khas)\b/.test(normalizeAcceptedAnswer(rawQuestion))) {
    return accepted[accepted.length - 1] || accepted[0] || String(question?.answer || question?.correctAnswer || '').trim();
  }
  if (rawQuestion.match(/_{2,}/) && accepted.length > 1) return accepted[accepted.length - 1];
  return accepted[0] || String(question?.answer || question?.correctAnswer || '').trim();
}

const GENERIC_VARIANT_WORDS = new Set(['kata', 'nama', 'orang', 'benda', 'tempat', 'haiwan', 'makanan', 'pakaian']);
const PERSONAL_PRONOUNS = new Set([
  'saya', 'aku', 'kami', 'kita', 'awak', 'kamu', 'anda', 'kau',
  'dia', 'beliau', 'mereka'
]);

function getQuestionText(question = {}) {
  const nestedQuestion = question?.question && typeof question.question === 'object'
    ? question.question
    : null;
  return [
    question?.q,
    typeof question?.question === 'string' ? question.question : '',
    question?.stem,
    question?.prompt,
    question?.text,
    nestedQuestion?.q,
    nestedQuestion?.stem,
    nestedQuestion?.prompt,
    nestedQuestion?.text
  ].filter(value => typeof value === 'string' && value.trim()).join(' ');
}

function hasWordSequence(text, phrase) {
  const sourceWords = normalizeAcceptedAnswer(text).split(' ').filter(Boolean);
  const phraseWords = normalizeAcceptedAnswer(phrase).split(' ').filter(Boolean);
  if (!sourceWords.length || !phraseWords.length || phraseWords.length > sourceWords.length) return false;
  return sourceWords.some((_, index) => phraseWords.every((word, offset) => sourceWords[index + offset] === word));
}

function isSafeAnswerVariant(candidate, accepted, question = {}) {
  const questionText = normalizeAcceptedAnswer(getQuestionText(question));
  if (!questionText || /\b(bukan|tidak|salah|kecuali)\b/.test(candidate)) return false;

  // Accept a fuller noun phrase, e.g. "baju kurung baharu" for "baju kurung".
  if (hasWordSequence(candidate, accepted)) return true;

  // UASA may store the full noun phrase for the explanation (for example,
  // "meja makan keluarga"), while the prompt asks for the named item and
  // "meja makan" is a valid concise answer. Require at least two words and
  // an explicit object-wording prompt so a vague one-word answer is not let
  // through accidentally.
  const candidateWords = candidate.split(' ').filter(Boolean);
  const acceptedWords = accepted.split(' ').filter(Boolean);
  const nounPhrasePrompt = /\b(perkataan bagi benda|nama benda|benda yang disebut)\b/.test(questionText);
  if (nounPhrasePrompt
    && candidateWords.length >= 2
    && acceptedWords.length > candidateWords.length
    && acceptedWords.slice(0, candidateWords.length).join(' ') === candidate) {
    return true;
  }

  // Accept a clear head noun for a longer answer when the question asks for
  // a common noun and the shorter form appears in the question itself.
  return acceptedWords.length > candidateWords.length
    && candidateWords.length === 1
    && candidateWords[0].length >= 3
    && !GENERIC_VARIANT_WORDS.has(candidateWords[0])
    && hasWordSequence(accepted, candidate)
    && /kata nama am/.test(questionText)
    && hasWordSequence(questionText, candidate);
}

export function isAcceptedQuestionAnswer(answer, question = {}) {
  const rawCandidate = String(answer ?? '').normalize('NFKC').trim();
  const punctuationCandidate = rawCandidate.match(/^[?!.,;:]$/)?.[0];
  if (punctuationCandidate) {
    const punctuationExpected = getAcceptedAnswers(question)
      .map(value => String(value).trim().match(/([?!.,;:])$/)?.[1])
      .find(Boolean);
    if (punctuationExpected === punctuationCandidate) return true;
  }

  const candidate = normalizeAcceptedAnswer(answer);
  if (!candidate) return false;
  const questionText = normalizeAcceptedAnswer(getQuestionText(question));
  const acceptedAnswers = getAcceptedAnswers(question);

  // Pronoun correction prompts ask the learner to replace the pronoun, even
  // when the stored answer is the completed sentence used in the explanation.
  // Accepting the sentence's leading pronoun keeps short typed/voice answers
  // equivalent to the full-sentence answer without weakening other questions.
  const correctionPrompt = /betulkan ayat/.test(questionText)
    || /^BM-KATA_GANTI_NAMA-\d+$/i.test(String(question?.id || question?.questionId || ''));
  if (correctionPrompt && PERSONAL_PRONOUNS.has(candidate)) {
    const expectedPronoun = acceptedAnswers.some(value => {
      const firstWord = normalizeAcceptedAnswer(value).split(' ')[0];
      return firstWord === candidate;
    });
    if (expectedPronoun) return true;
  }

  return acceptedAnswers.some(value => {
    const accepted = normalizeAcceptedAnswer(value);
    return accepted === candidate || isSafeAnswerVariant(candidate, accepted, question);
  });
}

export default { getAcceptedAnswers, getQuestionAnswerDisplay, isAcceptedQuestionAnswer, normalizeAcceptedAnswer };
