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

export function hasSingleAcceptedOption(question = {}) {
  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length < 2 || options.length > 6) return false;
  const values = options.map(option => String(option?.value ?? option?.label ?? option ?? '').trim());
  const normalizedValues = values.map(normalizeAcceptedAnswer);
  return normalizedValues.every(Boolean)
    && new Set(normalizedValues).size === values.length
    && values.filter(value => isAcceptedQuestionAnswer(value, question)).length === 1;
}

// Keep this lightweight gate in the already-loaded answer utility so the
// full interactive renderer and serializers can remain lazy-loaded.
export function supportsInteractiveQuestion(question = {}) {
  const config = question?.interaction;
  if (!config) return hasSingleAcceptedOption(question);
  if (Number(config.version) !== 1) return false;
  if (['choice', 'imageChoice', 'visualMath', 'clock', 'measurement'].includes(config.type)) {
    return Array.isArray(config.options) && config.options.length >= 2;
  }
  if (config.type === 'fillBlank') {
    return Array.isArray(config.options) && config.options.length >= 2 && config.sentenceParts?.length === 2;
  }
  if (config.type === 'multiSelect') {
    return Array.isArray(config.options) && config.options.length >= 3 && Array.isArray(config.correctOptionIds);
  }
  if (config.type === 'hotspot') {
    return Array.isArray(config.hotspots) && config.hotspots.length >= 2 && Boolean(config.correctHotspotId);
  }
  if (config.type === 'money') {
    return Array.isArray(config.denominations) && config.denominations.length >= 2 && Number(config.targetSen) > 0;
  }
  if (config.type === 'dragDrop') {
    return Array.isArray(config.items) && config.items.length >= 2 && Array.isArray(config.zones) && config.zones.length >= 2;
  }
  if (config.type === 'matching') {
    return Array.isArray(config.items) && config.items.length >= 2 && Array.isArray(config.targets) && config.targets.length >= 2;
  }
  return config.type === 'ordering'
    && Array.isArray(config.items)
    && config.items.length >= 2
    && Array.isArray(config.correctOrder);
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

const ACTION_GROUPS = [
  ['kutip', 'mengutip', 'memungut', 'ambil', 'mengambil', 'bersih', 'membersihkan'],
  ['buang', 'membuang', 'membuangnya', 'masuk', 'masukkan', 'letak', 'meletakkan'],
  ['bantu', 'membantu', 'tolong', 'menolong', 'beri', 'memberi', 'kongsi', 'berkongsi', 'pinjam', 'meminjam'],
  ['tegur', 'menegur', 'nasihat', 'menasihati', 'ingatkan', 'mengingatkan'],
  ['tutup', 'menutup', 'padam', 'memadam'],
  ['beratur', 'tunggu', 'menunggu'],
  ['lapor', 'melaporkan', 'beritahu', 'memberitahu', 'maklum']
];

const SIMPULAN_MEANING_GROUPS = [
  ['berjalan tanpa kasut', 'tidak memakai kasut', 'tidak pakai kasut', 'tanpa kasut', 'berkaki ayam'],
  ['barang yang dibawa pulang dari perjalanan sebagai hadiah', 'barang yang dibawa dari perjalanan', 'hadiah dari perjalanan', 'oleh oleh', 'buah tangan'],
  ['boleh berfikir baik baik', 'cerdik mencari penyelesaian', 'bijak mencari jalan penyelesaian', 'pandai mencari penyelesaian', 'pandai menyelesaikan masalah', 'panjang akal'],
  ['cepat menangkap atau memahami pelajaran', 'cepat menangkap pelajaran', 'cepat memahami pelajaran', 'cepat faham pelajaran', 'mudah memahami pelajaran', 'otak cair'],
  ['memberi perhatian', 'ambil berat', 'mengambil berat', 'prihatin'],
  ['gembira atau bangga', 'gembira', 'bangga', 'berasa bangga'],
  ['rajin bekerja atau suka membantu', 'rajin membantu', 'suka membantu', 'rajin bekerja', 'ringan tulang'],
  ['lemah lembut dan baik tutur katanya', 'bercakap dengan lemah lembut', 'bercakap lembut', 'baik tutur katanya', 'berkata sopan', 'mulut manis'],
  ['orang yang sangat rajin membaca buku', 'orang yang rajin membaca', 'sangat suka membaca', 'suka membaca buku', 'ulat buku'],
  ['orang yang tidak pandai bermain bola', 'tidak pandai bermain bola', 'tidak mahir bermain bola sepak', 'kaki bangku']
];

const SCENARIO_STOP_WORDS = new Set([
  'selepas', 'sebelum', 'semasa', 'apakah', 'tindakan', 'paling', 'sesuai',
  'yang', 'ialah', 'dan', 'atau', 'dengan', 'untuk', 'dalam', 'ke', 'di',
  'kelas', 'sekolah', 'kamu', 'mereka', 'melihat', 'nampak'
]);

function isScenarioActionQuestion(questionText = '') {
  return /tindakan\s+paling\s+sesuai|apakah\s+tindakan|apakah\s+yang\s+patut/i.test(questionText);
}

function hasActionFromGroup(text, group) {
  return group.some(word => text.includes(word));
}

function hasScenarioContext(candidate, questionText) {
  const questionWords = normalizeAcceptedAnswer(questionText)
    .split(' ')
    .filter(word => word.length >= 4 && !SCENARIO_STOP_WORDS.has(word));
  const candidateWords = new Set(normalizeAcceptedAnswer(candidate).split(' '));
  return questionWords.some(word => candidateWords.has(word));
}

function isScenarioActionEquivalent(candidate, accepted, questionText) {
  if (!isScenarioActionQuestion(questionText)) return false;
  const expectedText = normalizeAcceptedAnswer(accepted);
  const candidateText = normalizeAcceptedAnswer(candidate);
  const actionMatches = ACTION_GROUPS.some(group =>
    hasActionFromGroup(expectedText, group) && hasActionFromGroup(candidateText, group)
  );
  return actionMatches && hasScenarioContext(candidate, questionText) && candidateText.split(' ').length >= 2;
}

function isBinaAyatEquivalent(candidate, questionText, question = {}) {
  if (!/bina\s+ayat|tuliskan\s+ayat|gunakan\s+kata/i.test(questionText)) return false;
  const rawCandidate = String(candidate ?? '').normalize('NFKC').trim();
  const quoted = [...questionText.matchAll(/["“”']([^"“”']+)["“”']/g)]
    .flatMap(match => normalizeAcceptedAnswer(match[1]).split(' '));
  const named = questionText.match(/nama\s+([a-zà-ÿ][a-zà-ÿ-]*)/i)?.[1] || '';
  const required = [...new Set([...quoted, named ? normalizeAcceptedAnswer(named) : ''].filter(Boolean))];
  const candidateText = normalizeAcceptedAnswer(rawCandidate);
  const candidateWords = candidateText.split(' ').filter(Boolean);
  const semanticCues = Array.isArray(question?.responseRules?.semanticCues)
    ? question.responseRules.semanticCues.map(normalizeAcceptedAnswer).filter(Boolean)
    : [];
  const hasRequiredContext = !semanticCues.length
    || semanticCues.some(cue => candidateText.includes(cue));
  const startsWithCapital = /^\p{Lu}/u.test(rawCandidate);
  const hasTerminalPunctuation = /[.!?]$/u.test(rawCandidate);
  const hasRepeatedWord = /\b([\p{L}][\p{L}'-]*)\s+\1\b/iu.test(candidateText);
  return required.length >= 2
    && required.every(word => candidateWords.includes(word))
    && candidateWords.length >= Math.max(4, required.length + 2)
    && startsWithCapital
    && hasTerminalPunctuation
    && !hasRepeatedWord
    && hasRequiredContext;
}

function isSimpulanMeaningEquivalent(candidate, accepted, questionText) {
  if (!/simpulan\s+bahasa/i.test(questionText)) return false;
  const candidateText = normalizeAcceptedAnswer(candidate);
  const acceptedText = normalizeAcceptedAnswer(accepted);
  return SIMPULAN_MEANING_GROUPS.some(group => {
    const normalizedGroup = group.map(normalizeAcceptedAnswer);
    return normalizedGroup.some(variant => acceptedText.includes(variant))
      && normalizedGroup.some(variant => candidateText.includes(variant));
  });
}

function isSimpulanUsageEquivalent(candidate, question = {}) {
  const rules = question?.responseRules || {};
  const variants = Array.isArray(rules.requiredVariants) ? rules.requiredVariants : [];
  const semanticCues = Array.isArray(rules.semanticCues) ? rules.semanticCues : [];
  const rawCandidate = String(candidate ?? '').normalize('NFKC').trim();
  const candidateText = normalizeAcceptedAnswer(rawCandidate);
  const candidateWords = candidateText.split(' ').filter(Boolean);
  const usesRequiredPhrase = variants.some(variant => candidateText.includes(normalizeAcceptedAnswer(variant)));
  const showsMeaning = semanticCues.some(cue => candidateText.includes(normalizeAcceptedAnswer(cue)));
  return variants.length > 0
    && semanticCues.length > 0
    && usesRequiredPhrase
    && showsMeaning
    && candidateWords.length >= 5
    && /^\p{Lu}/u.test(rawCandidate)
    && /[.!?]$/u.test(rawCandidate)
    && !/\b([\p{L}][\p{L}'-]*)\s+\1\b/iu.test(candidateText);
}

function isMathOperationConstructionEquivalent(candidate, question = {}) {
  const category = String(question?.metadata?.category || '').toLowerCase();
  if (!['tambah', 'tolak', 'darab', 'bahagi', 'wang', 'masa', 'panjang', 'jisim_isi_padu', 'bentuk'].includes(category)
    || String(question?.cognitiveLevel || '').toLowerCase() !== 'mencipta') return false;
  const rules = question?.responseRules || {};
  const requiredNumbers = Array.isArray(rules.requiredNumbers) ? rules.requiredNumbers.map(String) : [];
  const requiredWords = Array.isArray(rules.requiredWords) ? rules.requiredWords.map(normalizeAcceptedAnswer) : [];
  if (requiredNumbers.length + requiredWords.length < 3) return false;
  const rawCandidate = String(candidate ?? '').normalize('NFKC').trim();
  const candidateNumbers = rawCandidate.match(/\d+/g) || [];
  if (!requiredNumbers.every(value => candidateNumbers.includes(value))) return false;
  const candidateText = normalizeAcceptedAnswer(rawCandidate);
  if (!requiredWords.every(value => candidateText.includes(value))) return false;

  if (rules.responseKind === 'story') {
    const candidateText = normalizeAcceptedAnswer(rawCandidate);
    const semanticCues = Array.isArray(rules.semanticCues) ? rules.semanticCues.map(normalizeAcceptedAnswer) : [];
    return candidateText.split(' ').filter(Boolean).length >= 8
      && semanticCues.some(cue => candidateText.includes(cue));
  }

  if (category === 'darab' && rules.responseKind === 'array') {
    const candidateText = normalizeAcceptedAnswer(rawCandidate);
    return /\b(baris|lajur|tatasusunan|setiap)\b/.test(candidateText)
      && candidateText.split(' ').filter(Boolean).length >= 6;
  }

  if (category === 'bahagi' && rules.responseKind === 'grouping') {
    const candidateText = normalizeAcceptedAnswer(rawCandidate);
    return /\b(kumpulan|setiap|susun|bahagi|diagih)\b/.test(candidateText)
      && candidateText.split(' ').filter(Boolean).length >= 6;
  }

  if (category === 'masa' && ['schedule', 'representation'].includes(rules.responseKind)) {
    return /\b(?:aktiviti|pertama|kedua|jarum|minit|jam|pukul|waktu)\b/.test(candidateText)
      && candidateText.split(' ').filter(Boolean).length >= 6;
  }

  if (category === 'panjang' && rules.responseKind === 'representation') {
    return /\b(?:cm|m|meter|sentimeter|panjang)\b/.test(candidateText)
      && /[=+\-]/.test(rawCandidate);
  }

  if (category === 'jisim_isi_padu' && rules.responseKind === 'representation') {
    return /\b(?:kg|g|l|ml|kilogram|gram|liter|mililiter)\b/.test(candidateText)
      && /[=+\-]/.test(rawCandidate);
  }

  if (category === 'bentuk' && ['design', 'pattern', 'classification'].includes(rules.responseKind)) {
    return /\b(?:bentuk|segi|bulatan|kubus|kuboid|silinder|kon|sfera|pola|rumah|roket)\b/.test(candidateText)
      && candidateText.split(' ').filter(Boolean).length >= 6;
  }

  const hasOperationSymbol = category === 'tolak'
    ? rawCandidate.includes('-')
    : category === 'darab'
      ? /[x×]/i.test(rawCandidate)
      : category === 'bahagi'
        ? /[÷/]/i.test(rawCandidate) || /\bbahagi\b/i.test(rawCandidate)
        : category === 'wang'
          ? /[+\-]/.test(rawCandidate)
          : category === 'masa'
            ? /[:+\-–]/.test(rawCandidate) || /\b(?:pukul|minit|jam|hari)\b/i.test(rawCandidate)
            : category === 'panjang'
              ? /[+\-]/.test(rawCandidate) || /\b(?:cm|m|meter|sentimeter|panjang)\b/i.test(rawCandidate)
              : category === 'jisim_isi_padu'
                ? /[+\-]/.test(rawCandidate) || /\b(?:kg|g|L|mL|jisim|isi padu)\b/i.test(rawCandidate)
                : category === 'bentuk'
                  ? /\b(?:segi|bulatan|kubus|kuboid|silinder|kon|sfera|pola)\b/i.test(rawCandidate)
                  : rawCandidate.includes('+');
  return hasOperationSymbol && rawCandidate.includes('=');
}

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
  const rawQuestionText = getQuestionText(question);
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

  const hasCreativeRubric = String(question?.cognitiveLevel || '').toLowerCase() === 'mencipta'
    && Array.isArray(question?.rubric?.criteria);
  const isCreativeSentenceTask = hasCreativeRubric
    && /bina\s+ayat|tuliskan\s+ayat|gunakan\s+kata/i.test(rawQuestionText);
  const questionCategory = String(question?.metadata?.category || '').toLowerCase();
  if (hasCreativeRubric && questionCategory === 'simpulan_bahasa') {
    return isSimpulanUsageEquivalent(rawCandidate, question);
  }
  if (hasCreativeRubric && isMathOperationConstructionEquivalent(rawCandidate, question)) return true;
  if (isCreativeSentenceTask) return isBinaAyatEquivalent(rawCandidate, rawQuestionText, question);
  if (isBinaAyatEquivalent(rawCandidate, rawQuestionText, question)) return true;

  const expectsSimpulanPhrase = questionCategory === 'simpulan_bahasa'
    && String(question?.metadata?.responseKind || '').toLowerCase() === 'phrase';
  if (expectsSimpulanPhrase) {
    return acceptedAnswers.some(value => normalizeAcceptedAnswer(value) === candidate);
  }
  const expectsSimpulanMeaning = questionCategory === 'simpulan_bahasa'
    && String(question?.metadata?.responseKind || '').toLowerCase() === 'meaning';
  const sourcePhrase = normalizeAcceptedAnswer(question?.source?.phrase || '');
  if (expectsSimpulanMeaning && sourcePhrase && candidate.includes(sourcePhrase)) return false;

  if (acceptedAnswers.some(value => isSimpulanMeaningEquivalent(candidate, value, rawQuestionText))) return true;

  if (acceptedAnswers.some(value => isScenarioActionEquivalent(candidate, value, questionText))) return true;

  return acceptedAnswers.some(value => {
    const accepted = normalizeAcceptedAnswer(value);
    return accepted === candidate || isSafeAnswerVariant(candidate, accepted, question);
  });
}

export default { getAcceptedAnswers, getQuestionAnswerDisplay, isAcceptedQuestionAnswer, normalizeAcceptedAnswer, supportsInteractiveQuestion };
