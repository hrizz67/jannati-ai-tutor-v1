import { loadKnowledge, hasKnowledge } from './loader/knowledgeLoader.js';
import { sanitizeAiText } from '../../learningCopy.js';

const isDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

const FIELD_PRIORITY = {
  math: ['workedExamples', 'problemSolvingSteps', 'examples', 'extraExamples'],
  sains: ['scientificFacts', 'investigationIdeas', 'observationPrompts', 'examples', 'extraExamples'],
  arab: ['pronunciationTips', 'readingPractice', 'speakingPractice', 'writingPractice', 'examples', 'extraExamples'],
  islam: ['dailyPractice', 'adabApplications', 'realLifeExamples', 'examples', 'extraExamples'],
  pj: ['movementSteps', 'warmUpIdeas', 'fitnessActivities', 'gameApplications', 'dailyMovementIdeas', 'examples', 'extraExamples'],
  pk: ['healthyHabits', 'dailyPractice', 'hygieneSteps', 'nutritionTips', 'realLifeScenarios', 'bodyCare', 'examples', 'extraExamples'],
  default: ['examples', 'extraExamples']
};

const lastSelectionMap = new Map();

function logKnowledgeEvent(message, payload = {}) {
  if (!isDev) return;
  console.log('[knowledge-engine]', message, payload);
}

function safeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => item !== null && item !== undefined && item !== '').map(item => item);
}

function toDisplayText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return sanitizeAiText(String(value));
  }

  if (Array.isArray(value)) {
    return value
      .flatMap(item => toDisplayText(item))
      .map(item => sanitizeAiText(String(item)))
      .filter(Boolean);
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
    const text = candidates.map(item => sanitizeAiText(String(item || '').trim())).find(Boolean);
    if (text) return [text];
    return Object.values(value).flatMap(entry => toDisplayText(entry)).filter(Boolean);
  }

  return [sanitizeAiText(String(value))];
}

function dedupeText(items = []) {
  const result = [];
  const seen = new Set();
  for (const item of items) {
    const text = sanitizeAiText(String(item || '').trim());
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    result.push(text);
  }
  return result;
}

function rotateList(items = [], key = '') {
  const list = safeArray(items);
  if (list.length <= 1) return list.slice();

  const state = lastSelectionMap.get(key) || { index: 0, last: '' };
  const start = state.index % list.length;
  const rotated = list.slice(start).concat(list.slice(0, start));
  const first = sanitizeAiText(String(rotated[0] || '').trim());
  const nextIndex = first && first === state.last ? (start + 1) % list.length : (start + 1) % list.length;
  lastSelectionMap.set(key, { index: nextIndex, last: first });
  return rotated;
}

function selectString(items = [], key = '') {
  const rotated = rotateList(items, key);
  const first = rotated[0];
  return sanitizeAiText(String(first || '').trim());
}

function getPack(subjectId, topicId) {
  if (!subjectId || !topicId) {
    logKnowledgeEvent('missing topic', { subjectId: subjectId || null, topicId: topicId || null });
    return null;
  }

  try {
    if (!hasKnowledge(subjectId, topicId)) {
      logKnowledgeEvent('fallback used', { subjectId, topicId, reason: 'knowledge-pack-missing' });
      return null;
    }

    const pack = loadKnowledge(subjectId, topicId);
    logKnowledgeEvent('knowledge pack loaded', {
      subjectId,
      topicId,
      displayName: pack?.displayName || ''
    });
    return pack;
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

function getPriorityFields(subjectId) {
  return FIELD_PRIORITY[subjectId] || FIELD_PRIORITY.default;
}

function collectPrioritizedText(pack, subjectId) {
  if (!pack) return [];

  const fields = getPriorityFields(subjectId);
  const values = [];
  for (const field of fields) {
    values.push(...toDisplayText(pack[field]));
  }

  if (!values.length) {
    values.push(...toDisplayText(pack.examples));
  }

  if (!values.length) {
    values.push(...toDisplayText(pack.extraExamples));
  }

  return dedupeText(values);
}

function pickEncouragement(pack, subjectId, topicId, status = 'correct') {
  const pool = pack?.encouragement || {};
  const key = `${subjectId || 'subject'}:${topicId || 'topic'}:encouragement:${status}`;
  const list = status === 'excellent'
    ? safeArray(pool.excellent)
    : status === 'retry'
      ? safeArray(pool.retry)
      : safeArray(pool.correct);
  const selected = selectString(list, key);
  return selected || '';
}

function buildHintFromPack(pack, subjectId, topicId) {
  const fields = [
    ...toDisplayText(pack?.tips),
    ...toDisplayText(pack?.memoryTips),
    ...toDisplayText(pack?.commonMistakes)
  ];
  const selected = selectString(dedupeText(fields), `${subjectId || 'subject'}:${topicId || 'topic'}:hint`);
  return selected || '';
}

export function getKnowledgePack(subjectId, topicId) {
  return getPack(subjectId, topicId);
}

export function getTeacherExplanation(subjectId, topicId) {
  const pack = getPack(subjectId, topicId);
  if (!pack) return '';
  const explanations = [
    ...safeArray(pack.teacherExplanation),
    ...safeArray(pack.explanations),
    ...toDisplayText(pack.simpleExplanation)
  ];
  return selectString(dedupeText(explanations), `${subjectId || 'subject'}:${topicId || 'topic'}:teacherExplanation`);
}

export function getExamples(subjectId, topicId) {
  const pack = getPack(subjectId, topicId);
  if (!pack) return [];
  const list = collectPrioritizedText(pack, subjectId);
  return rotateList(list, `${subjectId || 'subject'}:${topicId || 'topic'}:examples`);
}

export function getExtraExamples(subjectId, topicId) {
  const pack = getPack(subjectId, topicId);
  if (!pack) return [];
  const list = dedupeText(toDisplayText(pack.extraExamples));
  return rotateList(list, `${subjectId || 'subject'}:${topicId || 'topic'}:extraExamples`);
}

export function getTips(subjectId, topicId) {
  const pack = getPack(subjectId, topicId);
  if (!pack) return [];
  const list = dedupeText(toDisplayText(pack.tips));
  return rotateList(list, `${subjectId || 'subject'}:${topicId || 'topic'}:tips`);
}

export function getMemoryTips(subjectId, topicId) {
  const pack = getPack(subjectId, topicId);
  if (!pack) return [];
  const list = dedupeText(toDisplayText(pack.memoryTips));
  return rotateList(list, `${subjectId || 'subject'}:${topicId || 'topic'}:memoryTips`);
}

export function getCommonMistakes(subjectId, topicId) {
  const pack = getPack(subjectId, topicId);
  if (!pack) return [];
  const list = dedupeText(toDisplayText(pack.commonMistakes));
  return rotateList(list, `${subjectId || 'subject'}:${topicId || 'topic'}:commonMistakes`);
}

export function getEncouragement(subjectId, topicId) {
  const pack = getPack(subjectId, topicId);
  return pack?.encouragement || { correct: [], retry: [], excellent: [] };
}

export function getFollowUpQuestions(subjectId, topicId) {
  const pack = getPack(subjectId, topicId);
  if (!pack) return [];
  const list = dedupeText(toDisplayText(pack.followUpQuestions));
  return rotateList(list, `${subjectId || 'subject'}:${topicId || 'topic'}:followUpQuestions`);
}

export function buildCoachKnowledgeData({ subjectId, topicId, question = {}, result = {}, userAnswer = '' } = {}) {
  const pack = getPack(subjectId, topicId);
  if (!pack) return null;

  const teacherExplanation = getTeacherExplanation(subjectId, topicId);
  const simpleExplanation = sanitizeAiText(pack.simpleExplanation || teacherExplanation || question?.explanation || question?.hint || 'Jawapan ini sesuai dengan soalan.');
  const examples = getExamples(subjectId, topicId);
  const extraExamples = getExtraExamples(subjectId, topicId);
  const tips = getTips(subjectId, topicId);
  const memoryTips = getMemoryTips(subjectId, topicId);
  const commonMistakes = getCommonMistakes(subjectId, topicId);
  const followUpQuestions = getFollowUpQuestions(subjectId, topicId);
  const encouragementStatus = result?.status === 'correct'
    ? 'correct'
    : result?.status === 'excellent'
      ? 'excellent'
      : 'retry';
  const encouragement = pickEncouragement(pack, subjectId, topicId, encouragementStatus);
  const hint = buildHintFromPack(pack, subjectId, topicId) || sanitizeAiText(question?.hint || '');
  const questionAnswer = sanitizeAiText(question?.answer || '');
  const practicePrompt = followUpQuestions[0] || sanitizeAiText(question?.hint || 'Cuba sekali lagi selepas membaca penerangan ini.');

  return {
    source: 'knowledge',
    subjectId: subjectId || null,
    topicId: topicId || null,
    displayName: pack.displayName || '',
    teacherExplanation,
    explanation: teacherExplanation || simpleExplanation,
    simpleExplanation,
    hint: hint || sanitizeAiText(question?.hint || 'Cari kata kunci penting dalam soalan.'),
    examples,
    extraExamples,
    tips,
    memoryTips,
    commonMistakes,
    encouragement,
    encouragementMessage: encouragement,
    followUpQuestions,
    practicePrompt,
    answerLine: questionAnswer ? `Jawapan: ${questionAnswer}` : '',
    correctAnswer: questionAnswer,
    workedExamples: rotateList(dedupeText(toDisplayText(pack.workedExamples)), `${subjectId || 'subject'}:${topicId || 'topic'}:workedExamples`),
    problemSolvingSteps: rotateList(dedupeText(toDisplayText(pack.problemSolvingSteps)), `${subjectId || 'subject'}:${topicId || 'topic'}:problemSolvingSteps`),
    scientificFacts: rotateList(dedupeText(toDisplayText(pack.scientificFacts)), `${subjectId || 'subject'}:${topicId || 'topic'}:scientificFacts`),
    observationPrompts: rotateList(dedupeText(toDisplayText(pack.observationPrompts)), `${subjectId || 'subject'}:${topicId || 'topic'}:observationPrompts`),
    comparisonPrompts: rotateList(dedupeText(toDisplayText(pack.comparisonPrompts)), `${subjectId || 'subject'}:${topicId || 'topic'}:comparisonPrompts`),
    investigationIdeas: rotateList(dedupeText(toDisplayText(pack.investigationIdeas)), `${subjectId || 'subject'}:${topicId || 'topic'}:investigationIdeas`),
    realLifeConnections: rotateList(dedupeText(toDisplayText(pack.realLifeConnections)), `${subjectId || 'subject'}:${topicId || 'topic'}:realLifeConnections`),
    safetyNotes: rotateList(dedupeText(toDisplayText(pack.safetyNotes)), `${subjectId || 'subject'}:${topicId || 'topic'}:safetyNotes`),
    misconceptions: rotateList(dedupeText(toDisplayText(pack.misconceptions)), `${subjectId || 'subject'}:${topicId || 'topic'}:misconceptions`),
    evidenceQuestions: rotateList(dedupeText(toDisplayText(pack.evidenceQuestions)), `${subjectId || 'subject'}:${topicId || 'topic'}:evidenceQuestions`),
    pronunciationTips: rotateList(dedupeText(toDisplayText(pack.pronunciationTips)), `${subjectId || 'subject'}:${topicId || 'topic'}:pronunciationTips`),
    letterRecognitionTips: rotateList(dedupeText(toDisplayText(pack.letterRecognitionTips)), `${subjectId || 'subject'}:${topicId || 'topic'}:letterRecognitionTips`),
    writingTips: rotateList(dedupeText(toDisplayText(pack.writingTips)), `${subjectId || 'subject'}:${topicId || 'topic'}:writingTips`),
    vocabularyGroups: rotateList(dedupeText(toDisplayText(pack.vocabularyGroups)), `${subjectId || 'subject'}:${topicId || 'topic'}:vocabularyGroups`),
    translationHints: rotateList(dedupeText(toDisplayText(pack.translationHints)), `${subjectId || 'subject'}:${topicId || 'topic'}:translationHints`),
    readingPractice: rotateList(dedupeText(toDisplayText(pack.readingPractice)), `${subjectId || 'subject'}:${topicId || 'topic'}:readingPractice`),
    listeningPractice: rotateList(dedupeText(toDisplayText(pack.listeningPractice)), `${subjectId || 'subject'}:${topicId || 'topic'}:listeningPractice`),
    speakingPractice: rotateList(dedupeText(toDisplayText(pack.speakingPractice)), `${subjectId || 'subject'}:${topicId || 'topic'}:speakingPractice`),
    writingPractice: rotateList(dedupeText(toDisplayText(pack.writingPractice)), `${subjectId || 'subject'}:${topicId || 'topic'}:writingPractice`),
    commonPronunciationMistakes: rotateList(dedupeText(toDisplayText(pack.commonPronunciationMistakes)), `${subjectId || 'subject'}:${topicId || 'topic'}:commonPronunciationMistakes`),
    dailyPractice: rotateList(dedupeText(toDisplayText(pack.dailyPractice)), `${subjectId || 'subject'}:${topicId || 'topic'}:dailyPractice`),
    adabApplications: rotateList(dedupeText(toDisplayText(pack.adabApplications)), `${subjectId || 'subject'}:${topicId || 'topic'}:adabApplications`),
    realLifeExamples: rotateList(dedupeText(toDisplayText(pack.realLifeExamples)), `${subjectId || 'subject'}:${topicId || 'topic'}:realLifeExamples`),
    ayahOrHadithReference: rotateList(dedupeText(toDisplayText(pack.ayahOrHadithReference)), `${subjectId || 'subject'}:${topicId || 'topic'}:ayahOrHadithReference`),
    reflectionQuestions: rotateList(dedupeText(toDisplayText(pack.reflectionQuestions)), `${subjectId || 'subject'}:${topicId || 'topic'}:reflectionQuestions`),
    goodDeedsIdeas: rotateList(dedupeText(toDisplayText(pack.goodDeedsIdeas)), `${subjectId || 'subject'}:${topicId || 'topic'}:goodDeedsIdeas`)
  };
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
  buildCoachKnowledgeData
};
