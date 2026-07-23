import { loadKnowledge, peekKnowledge, primeKnowledgePack } from './loader/knowledgeLoader.js';
import { sanitizeAiText } from '../../learningCopy.js';
import { getStudentProfileSummary, getTopicProgress, getSubjectProgress, generateRevisionPlan } from '../../profile/index.js';
import { getMistakeContext } from '../../mistakes/index.js';

const isDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

const FIELD_PRIORITY = {
  math: ['workedExamples', 'problemSolvingSteps', 'examples', 'extraExamples'],
  sains: ['scientificFacts', 'whyQuestions', 'predictionQuestions', 'comparisonQuestions', 'realLifeApplications', 'investigationIdeas', 'observationPrompts', 'examples', 'extraExamples'],
  arab: ['pronunciationGuide', 'readingSteps', 'letterBreakdown', 'listeningTips', 'pronunciationTips', 'readingPractice', 'speakingPractice', 'writingPractice', 'examples', 'extraExamples'],
  english: ['wordMeaning', 'exampleSentences', 'examples', 'extraExamples'],
  islam: ['dailyPractice', 'adabApplications', 'realLifeExamples', 'examples', 'extraExamples'],
  pj: ['movementSteps', 'warmUpIdeas', 'fitnessActivities', 'gameApplications', 'dailyMovementIdeas', 'examples', 'extraExamples'],
  pk: ['healthyHabits', 'dailyPractice', 'hygieneSteps', 'nutritionTips', 'realLifeScenarios', 'bodyCare', 'examples', 'extraExamples'],
  default: ['examples', 'extraExamples']
};

const SUBJECT_TONE = {
  math: {
    correct: 'Bagus! Mari kita kira langkah demi langkah.',
    retry: 'Jom semak kiraan perlahan-lahan.',
    excellent: 'Hebat! Kamu semakin cekap mengira.'
  },
  bm: {
    correct: 'Bagus! Mari bina ayat yang lebih kemas.',
    retry: 'Jom semak ayat dengan teliti.',
    excellent: 'Hebat! Kamu semakin mahir berbahasa.'
  },
  english: {
    correct: "Great! Let's practise the sentence together.",
    retry: 'Take another careful look at the sentence.',
    excellent: 'Excellent! You are getting better at English.'
  },
  sains: {
    correct: 'Hebat! Mari fikir seperti seorang saintis.',
    retry: 'Jom perhati semula dengan lebih teliti.',
    excellent: 'Cemerlang! Kamu membuat pemerhatian yang baik.'
  },
  arab: {
    correct: 'Bagus! Mari sebut huruf dengan betul.',
    retry: 'Jom sebut semula dengan perlahan.',
    excellent: 'Hebat! Sebutan kamu semakin baik.'
  },
  islam: {
    correct: 'Alhamdulillah, mari kita fahami pengajaran ini.',
    retry: 'Jom baca semula dengan tenang.',
    excellent: 'Masya-Allah, kamu sangat tekun belajar.'
  },
  pj: {
    correct: 'Bagus! Ingat keselamatan semasa bergerak.',
    retry: 'Jom semak langkah pergerakan dengan selamat.',
    excellent: 'Hebat! Kawalan badan kamu semakin baik.'
  },
  pk: {
    correct: 'Bagus! Amalkan gaya hidup sihat.',
    retry: 'Jom lihat semula pilihan yang paling sihat.',
    excellent: 'Hebat! Kamu memahami penjagaan diri dengan baik.'
  },
  default: {
    correct: 'Bagus! Kamu sedang belajar dengan baik.',
    retry: 'Jom cuba semula dengan teliti.',
    excellent: 'Hebat! Teruskan usaha kamu.'
  }
};

const lastSelectionMap = new Map();

function logKnowledgeEvent(message, payload = {}) {
  if (!isDev) return;
  console.log('[knowledge-engine]', message, payload);
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(item => item !== null && item !== undefined && item !== '') : [];
}

function toDisplayText(value) {
  if (value === null || value === undefined) return [];

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = sanitizeAiText(String(value));
    return text ? [text] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(entry => toDisplayText(entry)).filter(Boolean);
  }

  if (typeof value === 'object') {
    if (Array.isArray(value.steps) && value.steps.length) {
      const stepText = value.steps.flatMap(step => toDisplayText(step)).filter(Boolean).join(' • ');
      const parts = [
        value.prompt || value.question || value.title || value.label || '',
        stepText,
        value.answer ? `Jawapan: ${value.answer}` : ''
      ].map(item => sanitizeAiText(String(item || '').trim())).filter(Boolean);
      if (parts.length) return [parts.join(' — ')];
    }

    const candidates = [
      value.prompt,
      value.question,
      value.title,
      value.label,
      value.term,
      value.word,
      value.answer,
      value.example,
      value.text,
      value.description
    ];
    const direct = candidates.map(item => sanitizeAiText(String(item || '').trim())).find(Boolean);
    if (direct) return [direct];
    return Object.values(value).flatMap(entry => toDisplayText(entry)).filter(Boolean);
  }

  const text = sanitizeAiText(String(value));
  return text ? [text] : [];
}

function dedupeText(items = []) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const text = sanitizeAiText(String(item || '').trim());
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function rotateList(items = [], key = '') {
  const list = asArray(items);
  if (list.length <= 1) return list.slice();

  const state = lastSelectionMap.get(key) || { index: 0, last: '' };
  const start = state.index % list.length;
  const rotated = list.slice(start).concat(list.slice(0, start));
  const first = sanitizeAiText(String(rotated[0] || '').trim());
  lastSelectionMap.set(key, {
    index: (start + 1) % list.length,
    last: first
  });
  return rotated;
}

function selectString(items = [], key = '') {
  return rotateList(items, key)[0] || '';
}

function getPriorityFields(subjectId) {
  return FIELD_PRIORITY[subjectId] || FIELD_PRIORITY.default;
}

function getSubjectTone(subjectId = 'default') {
  return SUBJECT_TONE[subjectId] || SUBJECT_TONE.default;
}

function collectPrioritizedText(pack, subjectId) {
  if (!pack) return [];
  const values = [];
  for (const field of getPriorityFields(subjectId)) {
    values.push(...toDisplayText(pack[field]));
  }
  if (!values.length) values.push(...toDisplayText(pack.examples));
  if (!values.length) values.push(...toDisplayText(pack.extraExamples));
  return dedupeText(values);
}

function buildPackData(pack, subjectId, topicId, question = {}, result = {}, userAnswer = '') {
  if (!pack) return null;
  const studentProfile = getStudentProfileSummary('default');
  const topicProgress = getTopicProgress(studentProfile.studentId || 'default', subjectId, topicId, studentProfile);
  const subjectProgress = getSubjectProgress(studentProfile.studentId || 'default', subjectId, studentProfile);
  const revisionPlan = generateRevisionPlan(studentProfile.studentId || 'default', { limit: 6 }, studentProfile);
  const mistakeContext = getMistakeContext(studentProfile, subjectId, topicId);
  const topicStatus = topicProgress?.status || 'new';

  const teacherExplanation = selectString(
    dedupeText([
      ...asArray(pack.teacherExplanation),
      ...asArray(pack.explanations),
      ...toDisplayText(pack.simpleExplanation)
    ]),
    `${subjectId}:${topicId}:teacherExplanation`
  );

  const questionStem = sanitizeAiText(question?.question || question?.q || question?.text || 'soalan ini');
  const simpleExplanation = sanitizeAiText(
    pack.simpleExplanation || teacherExplanation || question?.explanation || question?.hint ||
    `Mari teliti ${questionStem} dan pilih jawapan yang sepadan dengan arahan.`
  );
  const examples = rotateList(collectPrioritizedText(pack, subjectId), `${subjectId}:${topicId}:examples`);
  const extraExamples = rotateList(dedupeText(toDisplayText(pack.extraExamples)), `${subjectId}:${topicId}:extraExamples`);
  const tips = rotateList(dedupeText(toDisplayText(pack.tips)), `${subjectId}:${topicId}:tips`);
  const memoryTips = rotateList(dedupeText(toDisplayText(pack.memoryTips)), `${subjectId}:${topicId}:memoryTips`);
  const commonMistakes = rotateList(dedupeText(toDisplayText(pack.commonMistakes)), `${subjectId}:${topicId}:commonMistakes`);
  const followUpQuestions = rotateList(dedupeText(toDisplayText(pack.followUpQuestions)), `${subjectId}:${topicId}:followUpQuestions`);
  const problemSolvingSteps = rotateList(dedupeText(toDisplayText(pack.problemSolvingSteps)), `${subjectId}:${topicId}:problemSolvingSteps`);
  const pronunciationGuide = rotateList(dedupeText(toDisplayText(pack.pronunciationGuide)), `${subjectId}:${topicId}:pronunciationGuide`);
  const readingSteps = rotateList(dedupeText(toDisplayText(pack.readingSteps)), `${subjectId}:${topicId}:readingSteps`);
  const letterBreakdown = rotateList(dedupeText(toDisplayText(pack.letterBreakdown)), `${subjectId}:${topicId}:letterBreakdown`);
  const listeningTips = rotateList(dedupeText(toDisplayText(pack.listeningTips)), `${subjectId}:${topicId}:listeningTips`);
  const wordMeaning = rotateList(dedupeText(toDisplayText(pack.wordMeaning)), `${subjectId}:${topicId}:wordMeaning`);
  const exampleSentences = rotateList(dedupeText(toDisplayText(pack.exampleSentences)), `${subjectId}:${topicId}:exampleSentences`);
  const whyQuestions = rotateList(dedupeText(toDisplayText(pack.whyQuestions)), `${subjectId}:${topicId}:whyQuestions`);
  const predictionQuestions = rotateList(dedupeText(toDisplayText(pack.predictionQuestions)), `${subjectId}:${topicId}:predictionQuestions`);
  const comparisonQuestions = rotateList(dedupeText(toDisplayText(pack.comparisonQuestions)), `${subjectId}:${topicId}:comparisonQuestions`);
  const realLifeApplications = rotateList(dedupeText(toDisplayText(pack.realLifeApplications)), `${subjectId}:${topicId}:realLifeApplications`);
  const encouragementStatus = result?.status === 'correct' ? 'correct' : result?.status === 'excellent' ? 'excellent' : 'retry';
  const encouragement = selectString(
    dedupeText(asArray(pack.encouragement?.[encouragementStatus])),
    `${subjectId}:${topicId}:encouragement:${encouragementStatus}`
  );
  const subjectTone = getSubjectTone(subjectId);
  const questionAnswer = sanitizeAiText(question?.answer || '');
  const hintSources = dedupeText([
    ...toDisplayText(pack.tips),
    ...toDisplayText(pack.memoryTips),
    ...toDisplayText(pack.commonMistakes)
  ]);
  const hint = selectString(hintSources, `${subjectId}:${topicId}:hint`) || sanitizeAiText(question?.hint || 'Cari kata kunci penting dalam soalan.');
  const practicePrompt = followUpQuestions[0] || sanitizeAiText(question?.hint || 'Cuba sekali lagi selepas membaca penerangan ini.');
  const learningProfile = {
    studentId: studentProfile.studentId || 'default',
    name: studentProfile.name || '',
    accuracy: studentProfile.summary?.accuracy || 0,
    currentStreak: studentProfile.summary?.currentStreak || 0,
    longestStreak: studentProfile.summary?.longestStreak || 0,
    strongestTopic: studentProfile.strongestTopic || null,
    weakestTopic: studentProfile.weakestTopic || null,
    topicStatus,
    subjectProgress,
    topicProgress,
    weakTopics: studentProfile.weakTopics || [],
    strongTopics: studentProfile.strongTopics || [],
    revisionPlan,
    mistakeContext
  };
  const encouragementOverride = (() => {
    const toneLead = subjectTone[encouragementStatus] || subjectTone.default || '';
    if (result?.status === 'correct' || result?.status === 'excellent') {
      if (topicStatus === 'mastered') return [toneLead, 'Kamu sudah kuasai topik ini. Teruskan ke cabaran seterusnya.', encouragement].filter(Boolean).join(' ');
      if (topicStatus === 'good') return [toneLead, 'Kamu sudah semakin yakin dengan topik ini.', encouragement].filter(Boolean).join(' ');
      return [toneLead, encouragement || 'Teruskan usaha kamu.'].filter(Boolean).join(' ');
    }
    if (topicStatus === 'weak') {
      return [toneLead, encouragement || 'Tak mengapa. Kita belajar perlahan-lahan satu langkah demi satu langkah.'].filter(Boolean).join(' ');
    }
    if (topicStatus === 'needs_practice') {
      return [toneLead, encouragement || 'Jom ulang sedikit lagi supaya kamu lebih yakin.'].filter(Boolean).join(' ');
    }
    if (topicStatus === 'mastered') {
      return [toneLead, encouragement || 'Kamu sudah menguasai topik ini dengan baik.'].filter(Boolean).join(' ');
    }
    return [toneLead, encouragement || (result?.status === 'correct' ? 'Hebat! Teruskan usaha kamu.' : 'Tak mengapa. Kita cuba sekali lagi.')].filter(Boolean).join(' ');
  })();
  const profileHint = topicStatus === 'mastered'
    ? 'Kamu sudah kuat dalam topik ini. Kita fokus pada kefahaman ringkas dan semak semula.'
    : topicStatus === 'weak'
      ? 'Topik ini masih perlukan latihan. Baca perlahan-lahan dan ikut langkah kecil.'
      : '';
  const mistakeHint = mistakeContext?.repeatedMistakes > 1
    ? 'Nampaknya kesilapan yang sama sering berulang. Cuba ikut satu langkah pada satu masa.'
    : '';

  return {
    source: 'knowledge',
    subjectId: subjectId || null,
    topicId: topicId || null,
    displayName: pack.displayName || '',
    teacherExplanation,
    explanation: teacherExplanation || simpleExplanation,
    simpleExplanation: [simpleExplanation, profileHint, mistakeHint].filter(Boolean).join(' ').trim() || simpleExplanation,
    hint: [hint, profileHint, mistakeHint].filter(Boolean).join(' ').trim() || hint,
    examples,
    extraExamples,
    tips,
    memoryTips,
    commonMistakes,
    encouragement: encouragementOverride,
    encouragementMessage: encouragementOverride,
    followUpQuestions,
    practicePrompt: [subjectTone[topicStatus === 'mastered' ? 'excellent' : 'retry'] || subjectTone.default?.retry || '', practicePrompt, profileHint, mistakeHint].filter(Boolean).join(' ').trim() || practicePrompt,
    answerLine: questionAnswer ? `Jawapan: ${questionAnswer}` : '',
    correctAnswer: questionAnswer,
    workedExamples: rotateList(dedupeText(toDisplayText(pack.workedExamples)), `${subjectId}:${topicId}:workedExamples`),
    problemSolvingSteps: rotateList(dedupeText(toDisplayText(pack.problemSolvingSteps)), `${subjectId}:${topicId}:problemSolvingSteps`),
    scientificFacts: rotateList(dedupeText(toDisplayText(pack.scientificFacts)), `${subjectId}:${topicId}:scientificFacts`),
    observationPrompts: rotateList(dedupeText(toDisplayText(pack.observationPrompts)), `${subjectId}:${topicId}:observationPrompts`),
    comparisonPrompts: rotateList(dedupeText(toDisplayText(pack.comparisonPrompts)), `${subjectId}:${topicId}:comparisonPrompts`),
    investigationIdeas: rotateList(dedupeText(toDisplayText(pack.investigationIdeas)), `${subjectId}:${topicId}:investigationIdeas`),
    realLifeConnections: rotateList(dedupeText(toDisplayText(pack.realLifeConnections)), `${subjectId}:${topicId}:realLifeConnections`),
    safetyNotes: rotateList(dedupeText(toDisplayText(pack.safetyNotes)), `${subjectId}:${topicId}:safetyNotes`),
    misconceptions: rotateList(dedupeText(toDisplayText(pack.misconceptions)), `${subjectId}:${topicId}:misconceptions`),
    evidenceQuestions: rotateList(dedupeText(toDisplayText(pack.evidenceQuestions)), `${subjectId}:${topicId}:evidenceQuestions`),
    pronunciationTips: rotateList(dedupeText(toDisplayText(pack.pronunciationTips)), `${subjectId}:${topicId}:pronunciationTips`),
    letterRecognitionTips: rotateList(dedupeText(toDisplayText(pack.letterRecognitionTips)), `${subjectId}:${topicId}:letterRecognitionTips`),
    writingTips: rotateList(dedupeText(toDisplayText(pack.writingTips)), `${subjectId}:${topicId}:writingTips`),
    vocabularyGroups: rotateList(dedupeText(toDisplayText(pack.vocabularyGroups)), `${subjectId}:${topicId}:vocabularyGroups`),
    translationHints: rotateList(dedupeText(toDisplayText(pack.translationHints)), `${subjectId}:${topicId}:translationHints`),
    readingPractice: rotateList(dedupeText(toDisplayText(pack.readingPractice)), `${subjectId}:${topicId}:readingPractice`),
    listeningPractice: rotateList(dedupeText(toDisplayText(pack.listeningPractice)), `${subjectId}:${topicId}:listeningPractice`),
    speakingPractice: rotateList(dedupeText(toDisplayText(pack.speakingPractice)), `${subjectId}:${topicId}:speakingPractice`),
    writingPractice: rotateList(dedupeText(toDisplayText(pack.writingPractice)), `${subjectId}:${topicId}:writingPractice`),
    commonPronunciationMistakes: rotateList(dedupeText(toDisplayText(pack.commonPronunciationMistakes)), `${subjectId}:${topicId}:commonPronunciationMistakes`),
    pronunciationGuide,
    readingSteps,
    letterBreakdown,
    listeningTips,
    wordMeaning,
    exampleSentences,
    whyQuestions,
    predictionQuestions,
    comparisonQuestions,
    realLifeApplications,
    dailyPractice: rotateList(dedupeText(toDisplayText(pack.dailyPractice)), `${subjectId}:${topicId}:dailyPractice`),
    adabApplications: rotateList(dedupeText(toDisplayText(pack.adabApplications)), `${subjectId}:${topicId}:adabApplications`),
    realLifeExamples: rotateList(dedupeText(toDisplayText(pack.realLifeExamples)), `${subjectId}:${topicId}:realLifeExamples`),
    ayahOrHadithReference: rotateList(dedupeText(toDisplayText(pack.ayahOrHadithReference)), `${subjectId}:${topicId}:ayahOrHadithReference`),
    reflectionQuestions: rotateList(dedupeText(toDisplayText(pack.reflectionQuestions)), `${subjectId}:${topicId}:reflectionQuestions`),
    goodDeedsIdeas: rotateList(dedupeText(toDisplayText(pack.goodDeedsIdeas)), `${subjectId}:${topicId}:goodDeedsIdeas`),
    userAnswer: sanitizeAiText(userAnswer || ''),
    learningProfile,
    packLoaded: true
  };
}

function getCachedPackOrEmpty(subjectId, topicId) {
  return peekKnowledge(subjectId, topicId) || null;
}

export function getKnowledgePack(subjectId, topicId) {
  return getCachedPackOrEmpty(subjectId, topicId);
}

export function getTeacherExplanation(subjectId, topicId) {
  return buildPackData(getCachedPackOrEmpty(subjectId, topicId), subjectId, topicId)?.teacherExplanation || '';
}

export function getExamples(subjectId, topicId) {
  return buildPackData(getCachedPackOrEmpty(subjectId, topicId), subjectId, topicId)?.examples || [];
}

export function getExtraExamples(subjectId, topicId) {
  return buildPackData(getCachedPackOrEmpty(subjectId, topicId), subjectId, topicId)?.extraExamples || [];
}

export function getTips(subjectId, topicId) {
  return buildPackData(getCachedPackOrEmpty(subjectId, topicId), subjectId, topicId)?.tips || [];
}

export function getMemoryTips(subjectId, topicId) {
  return buildPackData(getCachedPackOrEmpty(subjectId, topicId), subjectId, topicId)?.memoryTips || [];
}

export function getCommonMistakes(subjectId, topicId) {
  return buildPackData(getCachedPackOrEmpty(subjectId, topicId), subjectId, topicId)?.commonMistakes || [];
}

export function getEncouragement(subjectId, topicId) {
  const pack = getCachedPackOrEmpty(subjectId, topicId);
  return pack?.encouragement || { correct: [], retry: [], excellent: [] };
}

export function getFollowUpQuestions(subjectId, topicId) {
  return buildPackData(getCachedPackOrEmpty(subjectId, topicId), subjectId, topicId)?.followUpQuestions || [];
}

export async function fetchCoachKnowledgeData({ subjectId, topicId, question = {}, result = {}, userAnswer = '' } = {}) {
  if (!subjectId || !topicId) {
    logKnowledgeEvent('missing topic', { subjectId: subjectId || null, topicId: topicId || null });
    return null;
  }

  try {
    const pack = await loadKnowledge(subjectId, topicId);
    if (!pack || !pack.subjectId) {
      logKnowledgeEvent('fallback used', { subjectId, topicId, reason: 'knowledge-pack-missing' });
      return null;
    }
    logKnowledgeEvent('knowledge pack loaded', { subjectId, topicId, displayName: pack.displayName || '' });
    primeKnowledgePack(subjectId, topicId, pack);
    return buildPackData(pack, subjectId, topicId, question, result, userAnswer);
  } catch (error) {
    logKnowledgeEvent('fallback used', {
      subjectId,
      topicId,
      reason: 'knowledge-load-failed',
      error: error?.message || String(error || 'unknown-error')
    });
    return null;
  }
}

export function buildCoachKnowledgeData({ subjectId, topicId, question = {}, result = {}, userAnswer = '' } = {}) {
  const pack = getCachedPackOrEmpty(subjectId, topicId);
  if (!pack) return null;
  return buildPackData(pack, subjectId, topicId, question, result, userAnswer);
}

export async function prefetchCoachKnowledgePack(subjectId, topicId, question = {}, result = {}, userAnswer = '') {
  return fetchCoachKnowledgeData({ subjectId, topicId, question, result, userAnswer });
}

export default {
  getKnowledgePack,
  getTeacherExplanation,
  getExamples,
  getExtraExamples,
  getTips,
  getMemoryTips,
  getCommonMistakes,
  getEncouragement,
  getFollowUpQuestions,
  buildCoachKnowledgeData,
  fetchCoachKnowledgeData,
  prefetchCoachKnowledgePack
};
