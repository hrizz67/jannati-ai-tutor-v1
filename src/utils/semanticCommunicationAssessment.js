const LANGUAGE_ALIASES = Object.freeze({
  bm: 'bm', ms: 'bm', 'ms-my': 'bm',
  english: 'english', en: 'english', 'en-us': 'english', 'en-gb': 'english',
  arab: 'arab', ar: 'arab', 'ar-sa': 'arab'
});

const INSTRUCTION_WORDS = Object.freeze({
  bm: new Set(['bina', 'ceritakan', 'huraikan', 'jelaskan', 'lengkapkan', 'terangkan', 'tulis', 'ayat', 'tentang', 'kamu']),
  english: new Set(['build', 'complete', 'describe', 'explain', 'tell', 'talk', 'write', 'sentence', 'about', 'your', 'us']),
  arab: new Set(['اكتب', 'اكمل', 'اشرح', 'تكلم', 'صف', 'عن', 'جملة', 'ك'])
});

const FUNCTION_WORDS = Object.freeze({
  bm: new Set(['aku', 'dan', 'di', 'ini', 'itu', 'ke', 'pada', 'saya', 'untuk', 'yang']),
  english: new Set(['a', 'an', 'and', 'at', 'for', 'i', 'in', 'is', 'my', 'of', 'on', 'the', 'to']),
  arab: new Set(['انا', 'الى', 'في', 'من', 'هذا', 'هذه', 'و'])
});

const REVIEWED_SEMANTIC_CUES = Object.freeze({
  bm: [
    ['makan', 'minum', 'nasi', 'roti', 'telur', 'susu', 'buah', 'bubur', 'bijirin', 'mi'],
    ['belajar', 'bersih', 'guru', 'kelas', 'kerusi', 'meja', 'murid', 'papan'],
    ['bulu', 'comel', 'kucing', 'makan', 'manja', 'tidur'],
    ['bas', 'berjalan', 'kereta', 'sekolah', 'van'],
    ['basuh', 'bersih', 'gosok', 'mandi', 'sapu', 'sabun'],
    ['bermain', 'bola', 'gelongsor', 'kejar', 'taman'],
    ['awan', 'cerah', 'hujan', 'mendung', 'panas', 'sejuk'],
    ['buah', 'makan', 'sihat', 'sayur', 'susu'],
    ['baik', 'berkongsi', 'kawan', 'membantu', 'rajin'],
    ['bermain', 'keluarga', 'membaca', 'melawat', 'menolong']
  ],
  english: [
    ['eat', 'drink', 'rice', 'bread', 'egg', 'milk', 'fruit', 'cereal', 'noodles'],
    ['learn', 'clean', 'teacher', 'class', 'chair', 'desk', 'pupil', 'board'],
    ['fur', 'cute', 'cat', 'eat', 'sleep', 'play'],
    ['bus', 'walk', 'car', 'school', 'van'],
    ['wash', 'clean', 'brush', 'bathe', 'soap'],
    ['play', 'ball', 'slide', 'run', 'park'],
    ['cloud', 'sunny', 'rain', 'cloudy', 'hot', 'cold'],
    ['fruit', 'eat', 'healthy', 'vegetable', 'milk'],
    ['kind', 'share', 'friend', 'help', 'helpful'],
    ['play', 'family', 'read', 'visit', 'help']
  ],
  arab: [
    ['اكل', 'اشرب', 'خبز', 'الخبز', 'ارز', 'الارز', 'بيض', 'البيض', 'والبيض', 'حليب', 'فاكهة'],
    ['اتعلم', 'نظيف', 'معلم', 'فصل', 'كرسي', 'مكتب', 'تلميذ'],
    ['قطة', 'جميلة', 'تنام', 'تاكل', 'تلعب'],
    ['حافلة', 'امشي', 'سيارة', 'مدرسة'],
    ['اغسل', 'نظيف', 'اسنان', 'صابون'],
    ['العب', 'كرة', 'حديقة', 'اجري'],
    ['شمس', 'مطر', 'غائم', 'حار', 'بارد'],
    ['فاكهة', 'خضروات', 'صحي', 'حليب'],
    ['طيب', 'صديق', 'اساعد', 'اشارك'],
    ['العب', 'اسرة', 'اقرا', 'ازور', 'اساعد']
  ]
});

function languageKey(language = '') {
  const normalized = String(language || '').trim().toLowerCase();
  return LANGUAGE_ALIASES[normalized]
    || (normalized.startsWith('ms') ? 'bm' : normalized.startsWith('en') ? 'english' : normalized.startsWith('ar') ? 'arab' : 'bm');
}

function normalize(value = '') {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value = '') {
  const normalized = normalize(value);
  return normalized ? normalized.split(' ') : [];
}

export function buildSemanticCommunicationRubric(prompt = '', { language = 'bm', seedIndex = -1 } = {}) {
  const key = languageKey(language);
  const promptTokens = tokens(prompt);
  const excluded = new Set([...(INSTRUCTION_WORDS[key] || []), ...(FUNCTION_WORDS[key] || [])]);
  const topicTerms = [...new Set(promptTokens.filter(token => !excluded.has(token) && !/^\d+$/u.test(token)))];
  const reviewedCues = Number.isInteger(seedIndex) && seedIndex >= 0 && seedIndex < 10
    ? REVIEWED_SEMANTIC_CUES[key]?.[seedIndex] || []
    : [];
  return Object.freeze({
    version: 1,
    language: key,
    promptText: String(prompt || '').trim(),
    topicTerms: Object.freeze(topicTerms),
    semanticCues: Object.freeze([...new Set(reviewedCues.map(normalize).filter(Boolean))]),
    criteria: Object.freeze(['Menjawab tugasan', 'Idea sendiri', 'Respons lengkap'])
  });
}

function containsPhrase(responseText, phrase) {
  const source = ` ${normalize(responseText)} `;
  const target = normalize(phrase);
  return Boolean(target) && source.includes(` ${target} `);
}

export function assessSemanticCommunicationResponse({ prompt = '', rubric = null, response = '', language = 'bm' } = {}) {
  const safeRubric = rubric?.version === 1 ? rubric : buildSemanticCommunicationRubric(prompt, { language });
  const key = languageKey(safeRubric.language || language);
  const responseText = String(response || '').trim();
  const responseTokens = tokens(responseText);
  const promptTokens = new Set(tokens(safeRubric.promptText || prompt));
  const ignored = new Set([...(INSTRUCTION_WORDS[key] || []), ...(FUNCTION_WORDS[key] || [])]);
  const contentTokens = responseTokens.filter(token => !ignored.has(token));
  const novelContent = contentTokens.filter(token => !promptTokens.has(token));
  const matchedTopics = safeRubric.topicTerms.filter(term => containsPhrase(responseText, term));
  const matchedCues = safeRubric.semanticCues.filter(term => containsPhrase(responseText, term));
  const normalizedPrompt = normalize(safeRubric.promptText || prompt);
  const includesVerbatimInstruction = Boolean(normalizedPrompt) && normalize(responseText).includes(normalizedPrompt);
  const promptEcho = Boolean(responseTokens.length) && (
    normalize(responseText) === normalizedPrompt
    || contentTokens.every(token => promptTokens.has(token))
    || (includesVerbatimInstruction && matchedCues.length < 2)
  );
  const relevant = !promptEcho && (matchedTopics.length > 0 || matchedCues.length > 0);
  const hasOwnIdea = !promptEcho && novelContent.length >= 2 && (
    safeRubric.semanticCues.length ? matchedCues.length >= 2 : matchedTopics.length > 0
  );
  const complete = !promptEcho && responseTokens.length >= 3 && novelContent.length >= 2;
  const passedCriteria = [relevant, hasOwnIdea, complete];
  const criteria = safeRubric.criteria.map((label, index) => ({
    id: ['relevance', 'own-idea', 'complete'][index],
    label,
    status: passedCriteria[index] ? 'correct' : 'missing'
  }));
  const score = promptEcho ? 0 : passedCriteria.reduce((sum, passed, index) => sum + (passed ? [40, 40, 20][index] : 0), 0);
  const explanation = promptEcho
    ? 'Cuba jawab dengan idea kamu sendiri, bukan ulang arahan soalan.'
    : !relevant
      ? 'Cuba jawab perkara yang diminta dalam tugasan.'
      : !hasOwnIdea
        ? 'Tambah sekurang-kurangnya dua idea atau butiran yang sesuai.'
        : complete
          ? 'Bagus. Jawapan kamu relevan, mempunyai idea sendiri dan cukup lengkap.'
          : 'Idea kamu sesuai. Lengkapkan respons dengan ayat yang lebih jelas.';

  return {
    status: 'completed',
    score,
    matched: criteria.filter(item => item.status === 'correct').map(item => item.label),
    matchedKeywords: criteria.filter(item => item.status === 'correct').map(item => item.label),
    missingWords: criteria.filter(item => item.status !== 'correct').map(item => item.label),
    missed: criteria.filter(item => item.status !== 'correct').map(item => item.label),
    words: criteria.map(item => ({ text: item.label, status: item.status })),
    criteria,
    totalKeywords: criteria.length,
    metricLabel: 'kriteria',
    promptEcho,
    transcript: responseText,
    explanation,
    message: explanation
  };
}
