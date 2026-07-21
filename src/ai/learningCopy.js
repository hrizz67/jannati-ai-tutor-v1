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
  if (/kata nama tempat|nama tempat|tempat/.test(text)) return 'place';
  if (/kata nama haiwan|nama haiwan|haiwan/.test(text)) return 'animal';
  if (/kata nama benda|nama benda|benda/.test(text)) return 'object';
  if (/kata nama orang|nama orang|nama khas|tokoh|murid/.test(text)) return 'person';
  if (/kata nama/.test(text)) return 'name';
  return 'generic';
}

export function getLearningExamples(question = {}, topic = {}) {
  const category = detectLearningCategory(question, topic);
  return unique(TOPIC_EXAMPLES[category] || TOPIC_EXAMPLES.generic);
}

export function getLearningMemoryTip(question = {}, topic = {}) {
  const category = detectLearningCategory(question, topic);
  return MEMORY_TIPS[category] || MEMORY_TIPS.generic;
}
