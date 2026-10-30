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

const REVIEWED_RESPONSE_SUPPORT_WORDS = Object.freeze({
  bm: new Set(['ada', 'beberapa', 'dengan', 'dia', 'kami', 'ketika', 'kita', 'mereka', 'menulis', 'pagi', 'sedang', 'suka', 'telah', 'waktu']),
  english: new Set(['also', 'have', 'he', 'her', 'his', 'it', 'morning', 'she', 'they', 'usually', 'we', 'with']),
  arab: new Set(['الصباح', 'الفطور', 'على', 'مع', 'هو', 'هي', 'نحن'])
});

const NEGATION_WORDS = Object.freeze({
  bm: new Set(['bukan', 'jangan', 'tidak', 'tak']),
  english: new Set(['cannot', "can't", 'do not', "don't", 'never', 'no', 'not']),
  arab: new Set(['لا', 'ولا', 'ليس', 'ليست', 'لن', 'ما'])
});

// These paired groups are a deliberately bounded, teacher-reviewed evidence
// contract for the ten authored Year 2 themes shared by Menulis and the first
// ten Bertutur prompts. They support formative feedback only; matching them is
// not a claim that the app understands unrestricted natural-language meaning.
const REVIEWED_TASK_EVIDENCE = Object.freeze({
  bm: [
    [['makan', 'minum', 'bersarapan'], ['nasi', 'roti', 'telur', 'susu', 'buah', 'bubur', 'bijirin', 'mi', 'sarapan']],
    [['belajar', 'duduk', 'menulis', 'membaca'], ['guru', 'kelas', 'kerusi', 'meja', 'murid', 'papan']],
    [['ada', 'makan', 'tidur', 'bermain'], ['bulu', 'comel', 'kucing', 'manja']],
    [['pergi', 'menaiki', 'berjalan', 'memandu'], ['bas', 'kereta', 'sekolah', 'van']],
    [['basuh', 'gosok', 'mandi', 'sapu', 'membersihkan'], ['bersih', 'gigi', 'tangan', 'sabun']],
    [['bermain', 'berlari', 'kejar'], ['bola', 'gelongsor', 'taman']],
    [['hujan', 'cerah', 'mendung'], ['awan', 'panas', 'sejuk', 'cuaca']],
    [['makan', 'minum', 'memilih'], ['buah', 'sihat', 'sayur', 'susu', 'makanan']],
    [['berkongsi', 'membantu', 'bermain'], ['baik', 'kawan', 'rajin']],
    [['bermain', 'membaca', 'melawat', 'menolong'], ['keluarga', 'hujung', 'minggu']]
  ],
  english: [
    [['eat', 'drink', 'have'], ['rice', 'bread', 'egg', 'milk', 'fruit', 'cereal', 'noodles', 'breakfast']],
    [['learn', 'sit', 'write', 'read'], ['teacher', 'class', 'chair', 'desk', 'pupil', 'board']],
    [['have', 'eat', 'sleep', 'play'], ['fur', 'cute', 'cat', 'pet']],
    [['go', 'ride', 'walk', 'drive'], ['bus', 'car', 'school', 'van']],
    [['wash', 'clean', 'brush', 'bathe'], ['hands', 'teeth', 'soap', 'clean']],
    [['play', 'run', 'chase'], ['ball', 'slide', 'park']],
    [['rain', 'shine'], ['cloud', 'sunny', 'cloudy', 'hot', 'cold', 'weather']],
    [['eat', 'drink', 'choose'], ['fruit', 'healthy', 'vegetable', 'milk', 'food']],
    [['share', 'help', 'play'], ['kind', 'friend', 'helpful']],
    [['play', 'read', 'visit', 'help'], ['family', 'weekend']]
  ],
  arab: [
    [['اكل', 'اشرب', 'اتناول'], ['خبز', 'الخبز', 'ارز', 'الارز', 'بيض', 'البيض', 'والبيض', 'حليب', 'فاكهة', 'فطور']],
    [['اتعلم', 'اجلس', 'اكتب', 'اقرا'], ['معلم', 'فصل', 'كرسي', 'مكتب', 'تلميذ']],
    [['عندي', 'تاكل', 'تنام', 'تلعب'], ['قطة', 'جميلة', 'حيوان']],
    [['اذهب', 'اركب', 'امشي'], ['حافلة', 'سيارة', 'مدرسة']],
    [['اغسل', 'انظف', 'افرش'], ['نظيف', 'اسنان', 'يدين', 'صابون']],
    [['العب', 'اجري'], ['كرة', 'حديقة', 'لعبة']],
    [['تمطر', 'تشرق'], ['شمس', 'مطر', 'غائم', 'حار', 'بارد', 'طقس']],
    [['اكل', 'اشرب', 'اختار'], ['فاكهة', 'خضروات', 'صحي', 'حليب', 'طعام']],
    [['اساعد', 'اشارك', 'العب'], ['طيب', 'صديق']],
    [['العب', 'اقرا', 'ازور', 'اساعد'], ['اسرة', 'عطلة']]
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

export function buildSemanticCommunicationRubric(prompt = '', { language = 'bm', seedIndex = -1, mode = 'writing' } = {}) {
  const key = languageKey(language);
  const promptTokens = tokens(prompt);
  const excluded = new Set([...(INSTRUCTION_WORDS[key] || []), ...(FUNCTION_WORDS[key] || [])]);
  const topicTerms = [...new Set(promptTokens.filter(token => !excluded.has(token) && !/^\d+$/u.test(token)))];
  const reviewedGroups = Number.isInteger(seedIndex) && seedIndex >= 0 && seedIndex < 10
    ? REVIEWED_TASK_EVIDENCE[key]?.[seedIndex] || []
    : [];
  const evidenceGroups = reviewedGroups.map(group => [...new Set(group.map(normalize).filter(Boolean))]);
  return Object.freeze({
    version: 2,
    language: key,
    mode: mode === 'speaking' ? 'speaking' : 'writing',
    promptText: String(prompt || '').trim(),
    topicTerms: Object.freeze(topicTerms),
    semanticCues: Object.freeze([...new Set(evidenceGroups.flat())]),
    evidenceGroups: Object.freeze(evidenceGroups.map(group => Object.freeze(group))),
    reviewStatus: evidenceGroups.length >= 2 ? 'teacher-reviewed' : 'safe-fallback',
    assessmentBasis: 'bounded-formative-evidence',
    semanticUnderstanding: false,
    criteria: Object.freeze(['Berkaitan tugasan', 'Ada tindakan dan butiran', 'Ayat cukup jelas'])
  });
}

function containsPhrase(responseText, phrase) {
  const source = ` ${normalize(responseText)} `;
  const target = normalize(phrase);
  return Boolean(target) && source.includes(` ${target} `);
}

function isReviewedResponseToken(token, reviewedVocabulary, language) {
  if (reviewedVocabulary.has(token)) return true;
  if (language !== 'arab') return false;
  const withoutConjunction = token.startsWith('و') ? token.slice(1) : token;
  if (reviewedVocabulary.has(withoutConjunction)) return true;
  const withoutArticle = withoutConjunction.startsWith('ال') ? withoutConjunction.slice(2) : withoutConjunction;
  return reviewedVocabulary.has(withoutArticle);
}

export function assessSemanticCommunicationResponse({ prompt = '', rubric = null, response = '', language = 'bm' } = {}) {
  const safeRubric = rubric?.version === 2 ? rubric : buildSemanticCommunicationRubric(prompt, { language });
  const key = languageKey(safeRubric.language || language);
  const responseText = String(response || '').trim();
  const responseTokens = tokens(responseText);
  const promptTokens = new Set(tokens(safeRubric.promptText || prompt));
  const ignored = new Set([...(INSTRUCTION_WORDS[key] || []), ...(FUNCTION_WORDS[key] || [])]);
  const contentTokens = responseTokens.filter(token => !ignored.has(token));
  const novelContent = contentTokens.filter(token => !promptTokens.has(token));
  const matchedTopics = safeRubric.topicTerms.filter(term => containsPhrase(responseText, term));
  const matchedCues = safeRubric.semanticCues.filter(term => containsPhrase(responseText, term));
  const matchedEvidenceGroups = (safeRubric.evidenceGroups || []).map(group => group.filter(term => containsPhrase(responseText, term)));
  const reviewedEvidence = safeRubric.reviewStatus === 'teacher-reviewed' && matchedEvidenceGroups.length >= 2;
  const hasRequiredEvidence = reviewedEvidence && matchedEvidenceGroups.every(group => group.length > 0);
  const hasNegation = [...(NEGATION_WORDS[key] || [])].some(term => containsPhrase(responseText, term));
  const reviewedVocabulary = new Set([
    ...(safeRubric.evidenceGroups || []).flat(),
    ...(safeRubric.topicTerms || []),
    ...(INSTRUCTION_WORDS[key] || []),
    ...(FUNCTION_WORDS[key] || []),
    ...(REVIEWED_RESPONSE_SUPPORT_WORDS[key] || [])
  ]);
  const unreviewedTokens = responseTokens.filter(token => !/^\d+$/u.test(token) && !isReviewedResponseToken(token, reviewedVocabulary, key));
  const normalizedPrompt = normalize(safeRubric.promptText || prompt);
  const includesVerbatimInstruction = Boolean(normalizedPrompt) && normalize(responseText).includes(normalizedPrompt);
  const promptEcho = Boolean(responseTokens.length) && (
    normalize(responseText) === normalizedPrompt
    || contentTokens.every(token => promptTokens.has(token))
    || (includesVerbatimInstruction && matchedCues.length < 2)
  );
  const relevant = !promptEcho && (matchedTopics.length > 0 || matchedCues.length > 0);
  const supportedMeaning = !promptEcho && !hasNegation && unreviewedTokens.length === 0 && hasRequiredEvidence;
  const minimumTokens = safeRubric.mode === 'speaking' ? 3 : 4;
  const complete = supportedMeaning && responseTokens.length >= minimumTokens && novelContent.length >= 2;
  const passedCriteria = [relevant, supportedMeaning, complete];
  const criteria = safeRubric.criteria.map((label, index) => ({
    id: ['relevance', 'own-idea', 'complete'][index],
    label,
    status: passedCriteria[index] ? 'correct' : 'missing'
  }));
  const score = promptEcho ? 0 : passedCriteria.reduce((sum, passed, index) => sum + (passed ? [30, 40, 30][index] : 0), 0);
  const requiresTeacherReview = hasNegation || unreviewedTokens.length > 0 || safeRubric.reviewStatus !== 'teacher-reviewed';
  const explanation = promptEcho
    ? 'Cuba jawab dengan idea kamu sendiri, bukan ulang arahan soalan.'
    : !relevant
      ? 'Cuba jawab perkara yang diminta dalam tugasan.'
      : requiresTeacherReview
        ? 'Janna hanya boleh beri maklum balas terhad untuk jawapan ini. Minta guru atau orang dewasa menyemak maksudnya.'
      : !supportedMeaning
        ? 'Tambah satu tindakan dan satu butiran yang sesuai dengan tugasan.'
        : complete
          ? 'Bagus. Jawapan kamu menunjukkan tindakan, butiran dan ayat yang jelas.'
          : 'Idea kamu sesuai. Lengkapkan respons dengan ayat yang lebih jelas.';

  const masteryEligible = complete && !requiresTeacherReview;
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
    unreviewedTokens,
    requiresTeacherReview,
    masteryEligible,
    rewardEligible: masteryEligible,
    assessmentBasis: safeRubric.assessmentBasis,
    semanticUnderstanding: false,
    transcript: responseText,
    explanation,
    message: explanation
  };
}

export function getSemanticCommunicationRewardScore(result = {}) {
  if (result?.rewardEligible === false) return 0;
  const score = Number(result?.score);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
}
