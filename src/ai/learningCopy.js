const TOPIC_EXAMPLES = {
  person: ['Ali', 'Aiman', 'Siti', 'Farah'],
  place: ['padang', 'sekolah', 'hospital', 'kedai', 'pasar'],
  animal: ['kucing', 'ayam', 'gajah', 'burung'],
  object: ['buku', 'pensel', 'kerusi', 'meja'],
  verb: ['berlari', 'makan', 'menulis', 'tidur'],
  adjective: ['cantik', 'besar', 'tinggi', 'gembira'],
  penjodoh: ['seekor ayam', 'sekuntum bunga', 'sehelai kertas', 'sebatang pensel'],
  simpulan: ['ringan tulang', 'buah tangan', 'kaki ayam', 'panjang tangan'],
  conjunction: ['dan', 'atau', 'tetapi', 'kerana'],
  sendi: ['di', 'ke', 'dari', 'daripada'],
  name: ['Ali', 'Aiman', 'Siti', 'Farah'],
  generic: ['jawapan yang tepat', 'petunjuk kata kunci', 'contoh yang sepadan', 'maksud ayat']
};

const MEMORY_TIPS = {
  person: '🧠 Tip Ingatan\nNAMA ORANG\n=\nAli\nAiman\nSiti\nFarah',
  place: '🧠 Tip Ingatan\nNAMA TEMPAT\n=\npadang\nsekolah\nhospital\nkedai\npasar',
  animal: '🧠 Tip Ingatan\nNAMA HAIWAN\n=\nkucing\nayam\ngajah\nburung',
  object: '🧠 Tip Ingatan\nNAMA BENDA\n=\nbuku\npensel\nkerusi\nmeja',
  verb: '🧠 Tip Ingatan\nKATA KERJA\n=\nperbuatan atau aksi',
  adjective: '🧠 Tip Ingatan\nKATA ADJEKTIF\n=\nsifat atau keadaan',
  penjodoh: '🧠 Tip Ingatan\nPENJODOH BILANGAN\n=\nseekor, sekuntum, sehelai, sebatang',
  simpulan: '🧠 Tip Ingatan\nSIMPULAN BAHASA\n=\nmaksud khas, bukan maksud biasa',
  conjunction: '🧠 Tip Ingatan\nKATA HUBUNG\n=\ndan, atau, tetapi, kerana',
  sendi: '🧠 Tip Ingatan\nKATA SENDI NAMA\n=\ndi, ke, dari, daripada',
  generic: '🧠 Tip Ingatan\nBaca soalan perlahan-lahan dan cari kata kunci.'
};

function normalize(value = '') {
  return String(value).toLowerCase();
}

function unique(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(item => String(item).trim()).filter(Boolean))];
}

export function getSubjectId(question = {}, topic = {}) {
  const explicit = question?.subjectId || topic?.subjectId || question?.subject || topic?.subject;
  if (explicit) return normalize(explicit);
  const prefixMap = { BM: 'bm', MATH: 'math', EN: 'english', ENG: 'english', SAINS: 'sains', ARAB: 'arab', ISLAM: 'islam', PJ: 'pj', PK: 'pk' };
  return prefixMap[String(question?.id || '').toUpperCase().split('-')[0]] || '';
}

function getQuestionStem(question = {}) {
  return normalize(question?.q || question?.question || question?.stem || question?.text || '');
}

function getNumberOrderExamples(question = {}) {
  const stem = getQuestionStem(question);
  const after = stem.match(/nombor selepas\s+(\d+)/i);
  const before = stem.match(/nombor sebelum\s+(\d+)/i);
  if (after) {
    const value = Number(after[1]);
    return [`${value} + 1 = ${value + 1}`, `Nombor selepas ${value} ialah ${value + 1}.`];
  }
  if (before) {
    const value = Number(before[1]);
    return [`${value} - 1 = ${value - 1}`, `Nombor sebelum ${value} ialah ${value - 1}.`];
  }
  return ['Baca nombor dengan teliti.', 'Kenal pasti nilai tempat.', 'Semak urutan nombor.'];
}

function getMathTopicText(question = {}, topic = {}) {
  return normalize([
    topic?.id,
    topic?.title,
    topic?.note,
    question?.topicId,
    question?.topic,
    question?.q,
    question?.hint,
    question?.explanation
  ].filter(Boolean).join(' '));
}

export function isMassVolumeTopic(question = {}, topic = {}) {
  return /jisim[_ ]isi[_ ]padu|jisim dan isi padu|menimbang jisim|penimbang|berat|cecair|kg|gram|mililiter|liter|\bml\b|\bl\b/i.test(getMathTopicText(question, topic));
}

function getMassVolumeExamples(question = {}) {
  const stem = getQuestionStem(question);
  if (/alat|menimbang|jisim|berat/.test(stem)) {
    return ['Penimbang digunakan untuk menimbang jisim.', 'Jisim boleh diukur dalam gram (g) atau kilogram (kg).', 'Pilih alat dan unit yang sesuai dengan objek.'];
  }
  if (/cecair|isi padu|liter|mililiter|\bml\b|\bl\b/.test(stem)) {
    return ['Gunakan mL untuk isi padu cecair yang sedikit.', 'Gunakan L untuk isi padu cecair yang lebih banyak.', 'Semak unit sebelum menulis jawapan.'];
  }
  return ['Gunakan g atau kg untuk jisim.', 'Gunakan mL atau L untuk isi padu.', 'Baca soalan dan semak unit jawapan.'];
}

export function getMathLearningGuidance(question = {}, topic = {}) {
  if (isMassVolumeTopic(question, topic)) {
    return {
      focus: 'Memahami jisim, isi padu, alat dan unit yang sesuai.',
      steps: ['Kenal pasti sama ada soalan tentang jisim atau isi padu.', 'Pilih alat atau unit yang sesuai.', 'Semak jawapan dan unit.'],
      examples: getMassVolumeExamples(question),
      commonMistakes: ['Tersalah guna unit jisim dan isi padu.', 'Tidak membezakan g dan kg atau mL dan L.'],
      memoryTip: 'Tip Ingatan: Jisim diukur dengan g atau kg. Isi padu cecair diukur dengan mL atau L.'
    };
  }
  return {
    focus: 'Memahami maklumat, kaedah dan unit yang digunakan dalam soalan.',
    steps: ['Kenal pasti maklumat yang diberi.', 'Pilih kaedah atau operasi yang sesuai.', 'Kira dan semak jawapan serta unit.'],
    examples: ['Kenal pasti maklumat penting dalam soalan.', 'Pilih kaedah yang sesuai.', 'Semak jawapan sebelum meneruskan.'],
    commonMistakes: ['Memilih kaedah yang tidak sesuai.', 'Tidak menyemak pengiraan, jawapan atau unit.'],
    memoryTip: 'Tip Ingatan: Baca soalan, pilih kaedah dan semak jawapan.'
  };
}

export function sanitizeAiText(value = '') {
  const raw = String(value || '')
    .replace(/\s*Konteks:\s*.*$/gim, '')
    .replace(/\bLatihan AI\b/gi, '')
    .replace(/\bUASA\b/gi, '')
    .replace(/\bKSSR Tahun 2\b/gi, '')
    .replace(/\bSubject IDs?\b/gi, '')
    .replace(/\bInternal lesson IDs?\b/gi, '')
    .replace(/\bTopic IDs?\b/gi, '')
    .replace(/\s+[•·]\s+/g, ' • ')
    .replace(/\s+/g, ' ')
    .trim();
  return raw;
}

export function sanitizeChildFacingText(value = '') {
  const raw = sanitizeAiText(String(value || ''))
    .replace(/\b[A-Za-z]+_[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*(?:_[A-Za-z0-9-]+)?\b/g, '')
    .replace(/\b[0-9a-f]{8,}(?:-[0-9a-f]{4,}){3}-[0-9a-f]{12}\b/gi, '')
    .replace(/\[object Object\]/g, '')
    .replace(/\bundefined\b/gi, '')
    .replace(/\bnull\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.,!?;:])\1+/g, '$1')
    .trim();
  return raw;
}

export function detectLearningCategory(question = {}, topic = {}) {
  const subjectId = getSubjectId(question, topic);
  // Subject-specific questions must not inherit a word category from an
  // incidental word in the stem, hint, or stale explanation text. This was
  // causing Math questions to receive BM prompts such as "nama tempat".
  if (subjectId === 'math') return 'generic';
  const text = normalize([
    topic?.id,
    topic?.title,
    topic?.note,
    question?.topic,
    question?.uasa,
    question?.dskp,
    question?.q,
    question?.hint,
    question?.explanation
  ].filter(Boolean).join(' '));

  if (/simpulan bahasa/.test(text)) return 'simpulan';
  if (/penjodoh bilangan/.test(text)) return 'penjodoh';
  if (/kata sendi/.test(text)) return 'sendi';
  if (/kata hubung/.test(text)) return 'conjunction';
  if (/kata adjektif/.test(text)) return 'adjective';
  if (/kata kerja/.test(text)) return 'verb';
  // For kata nama khas, follow the requested target in the question first.
  // A sentence may mention a place as context while asking for a person's name.
  if (/kata[_ ]nama[_ ]khas|nama khas/.test(text)) {
    if (/nama orang|nama manusia/.test(text)) return 'person';
    if (/nama guru|nama murid|nama tokoh/.test(text)) return 'person';
    if (/nama tempat|tempat tersebut|tempat percutian|nama bandar|\bbandar\b|nama sekolah|nama negeri|nama negara/.test(text)) return 'place';
    if (/nama haiwan/.test(text)) return 'animal';
    if (/nama jenama|\bjenama\b|tajuk rancangan|nama buku/.test(text)) return 'properNoun';
    if (/nama benda/.test(text)) return 'object';
    return 'properNoun';
  }
  if (/kata nama tempat|nama tempat|tempat/.test(text)) return 'place';
  if (/kata nama haiwan|nama haiwan|haiwan/.test(text)) return 'animal';
  if (/kata nama benda|nama benda|benda/.test(text)) return 'object';
  if (/kata nama orang|nama orang|nama khas|tokoh|murid/.test(text)) return 'person';
  if (/kata nama/.test(text)) return 'name';
  return 'generic';
}

export function getLearningExamples(question = {}, topic = {}) {
  const subjectId = getSubjectId(question, topic);
  const stem = getQuestionStem(question);
  if (subjectId === 'math') {
    if (/nombor\s+(selepas|sebelum)\s+\d+/i.test(stem)) return getNumberOrderExamples(question);
    return getMathLearningGuidance(question, topic).examples;
  }
  if (subjectId === 'bm' && /kata ganti nama|menyiapkan kerja kelas|meja belajar/.test(`${stem} ${normalize(topic?.id)} ${normalize(topic?.title)}`)) {
    return ['Saya membaca buku.', 'Saya menulis di meja belajar.', 'Kata ganti nama diri pertama ialah saya.'];
  }
  const category = detectLearningCategory(question, topic);
  return unique(TOPIC_EXAMPLES[category] || TOPIC_EXAMPLES.generic);
}

export function getLearningMemoryTip(question = {}, topic = {}) {
  const subjectId = getSubjectId(question, topic);
  if (subjectId === 'math') {
    const stem = getQuestionStem(question);
    if (/nombor\s+(selepas|sebelum)\s+\d+/i.test(stem)) return 'Tip Ingatan: nombor selepas tambah 1, nombor sebelum tolak 1.';
    return getMathLearningGuidance(question, topic).memoryTip;
  }
  if (subjectId === 'bm' && /kata ganti nama|menyiapkan kerja kelas|meja belajar/.test(`${getQuestionStem(question)} ${normalize(topic?.id)} ${normalize(topic?.title)}`)) {
    return 'Tip Ingatan: Saya ialah kata ganti nama diri pertama untuk orang yang bercakap.';
  }
  const category = detectLearningCategory(question, topic);
  return MEMORY_TIPS[category] || MEMORY_TIPS.generic;
}

export function guardDistinctSections(sections = {}, questionText = '', fallback = {}) {
  const normalizeTokens = value => String(value || '').toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/gi, ' ').trim().split(/\s+/).filter(Boolean);
  const questionTokens = new Set(normalizeTokens(questionText));
  const seen = new Set();
  const result = { ...sections };
  for (const key of ['summary', 'focus', 'simpleExplanation', 'whyCorrect', 'hint', 'steps', 'example', 'commonMistake', 'memoryTip', 'coachMessage']) {
    if (!(key in result)) continue;
    const values = Array.isArray(result[key]) ? result[key] : [result[key]];
    result[key] = values.map((value, valueIndex) => {
      const text = String(value || '').trim();
      const tokens = normalizeTokens(text);
      const overlap = questionTokens.size ? tokens.filter(token => questionTokens.has(token)).length / questionTokens.size : 0;
      const duplicate = seen.has(text.toLowerCase()) || (tokens.length >= 5 && overlap >= 0.85);
      if (duplicate && fallback[key]) return Array.isArray(fallback[key]) ? (fallback[key][valueIndex] || fallback[key][0]) : fallback[key];
      seen.add(text.toLowerCase());
      return value;
    });
    if (!Array.isArray(sections[key])) result[key] = result[key][0] || '';
  }
  return result;
}
