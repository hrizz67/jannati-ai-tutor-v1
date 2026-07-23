import { buildCoachResponse } from './v3/coachController.js';
import { explainAnswer } from '../explainEngine.js';
import { teachAnswer } from '../teacherEngine.js';
import { sanitizeAiText } from '../learningCopy.js';
import { formatSubjectName, getHumanReadableTopic } from '../../utils/displayFormatter.js';
import { getAcceptedAnswers } from '../../utils/acceptedAnswers.js';

const isDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

const SUBJECT_LABELS = {
  bm: 'Bahasa Melayu',
  math: 'Matematik',
  english: 'English',
  sains: 'Sains',
  arab: 'Bahasa Arab',
  islam: 'Pendidikan Islam',
  pj: 'Pendidikan Jasmani',
  pk: 'Pendidikan Kesihatan'
};

function logCoachAdapter(message, payload = {}) {
  if (!isDev) return;
  console.debug('[coach-adapter]', message, payload);
}

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return normalizeText(value[0], fallback);
  if (typeof value === 'object') {
    if (typeof value.text === 'string' || typeof value.text === 'number') return sanitizeAiText(String(value.text));
    if (typeof value.label === 'string' || typeof value.label === 'number') return sanitizeAiText(String(value.label));
    if (typeof value.value === 'string' || typeof value.value === 'number') return sanitizeAiText(String(value.value));
    return fallback;
  }
  const text = sanitizeAiText(String(value).trim());
  return text || fallback;
}

function normalizeList(value) {
  if (value === null || value === undefined || value === '') return [];
  const items = Array.isArray(value) ? value : [value];
  const result = [];
  const seen = new Set();
  for (const item of items.flat(Infinity)) {
    const text = normalizeText(item, '');
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return normalizeList(value);
  const text = normalizeText(value, '');
  return text ? [text] : [];
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = normalizeText(value, '');
    if (text) return text;
  }
  return '';
}

function normalizeError(error) {
  if (!error) return null;
  if (typeof error === 'object' && (error.code || error.message)) {
    return {
      code: normalizeText(error.code, 'COACH_PAYLOAD_ERROR'),
      message: normalizeText(error.message, 'Coach payload issue detected.')
    };
  }
  return {
    code: 'COACH_PAYLOAD_ERROR',
    message: normalizeText(error, 'Coach payload issue detected.')
  };
}

function buildFallbackData(mode, { question = {}, topic = {}, result = {}, userAnswer = '' } = {}) {
  const explainData = explainAnswer({ question, topic, result, userAnswer });
  if (mode === 'teach') {
    return teachAnswer({ question, topic, explanationData: explainData });
  }
  return explainData;
}

function getCoachSubjectLabel(subjectId, coachData = {}, question = {}, topic = {}) {
  const knownLabel = SUBJECT_LABELS[subjectId];
  return normalizeText(
    coachData.subjectLabel ||
    knownLabel ||
    (subjectId && subjectId !== 'unknown' ? formatSubjectName(subjectId) : '') ||
    question.subjectTitle ||
    topic.title ||
    topic.name ||
    subjectId ||
    'General'
  );
}

function extractCoachText(payload = {}, fallbackData = {}, question = {}, topic = {}, subjectId = '', topicId = '') {
  const explanationObject = payload.explanation && typeof payload.explanation === 'object' ? payload.explanation : {};
  const hintObject = payload.hint && typeof payload.hint === 'object' ? payload.hint : {};
  const praiseObject = payload.praise && typeof payload.praise === 'object' ? payload.praise : {};
  const tipsObject = payload.tips && typeof payload.tips === 'object' ? payload.tips : {};

  const explanation = pickFirstText(
    explanationObject.explanation,
    payload.explanation,
    payload.simpleExplanation,
    fallbackData.explanation,
    fallbackData.simpleExplanation,
    question.explanation,
    question?.q || question?.question || question?.stem
      ? `Teliti soalan ini: ${question.q || question.question || question.stem}. Padankan jawapan dengan arahan.`
      : 'Semak arahan dan padankan jawapan dengan maklumat yang diberi.'
  );
  const simpleExplanation = pickFirstText(
    explanationObject.simpleExplanation,
    payload.simpleExplanation,
    fallbackData.simpleExplanation,
    explanation
  );
  const hint = pickFirstText(
    hintObject.hint,
    payload.hint,
    fallbackData.hint,
    question.hint,
    'Baca soalan perlahan-lahan dan cari kata kunci.'
  );
  const praise = pickFirstText(
    praiseObject.praise,
    payload.praise,
    payload.encouragement,
    fallbackData.encouragement,
    'Bagus! Teruskan usaha kamu.'
  );
  const learningTip = pickFirstText(
    payload.learningTip,
    tipsObject.spotlight,
    fallbackData.learningTip,
    normalizeList(payload.tips)[0],
    normalizeList(fallbackData.tips)[0],
    normalizeList(payload.memoryTips)[0],
    normalizeList(fallbackData.memoryTips)[0],
    normalizeList(payload.followUpQuestions)[0],
    normalizeList(fallbackData.followUpQuestions)[0],
    'Fokus pada kata kunci penting.'
  );
  const steps = normalizeList(
    payload.steps ||
    payload.problemSolvingSteps ||
    payload.readingSteps ||
    payload.pronunciationGuide ||
    payload.observationPrompts ||
    payload.comparisonPrompts ||
    payload.whyQuestions ||
    payload.predictionQuestions ||
    payload.realLifeApplications ||
    payload.dailyPractice ||
    payload.adabApplications ||
    payload.reflectionQuestions ||
    payload.goodDeedsIdeas ||
    fallbackData.steps ||
    fallbackData.problemSolvingSteps ||
    fallbackData.readingSteps ||
    fallbackData.pronunciationGuide ||
    fallbackData.observationPrompts ||
    fallbackData.comparisonPrompts ||
    fallbackData.whyQuestions ||
    fallbackData.predictionQuestions ||
    fallbackData.realLifeApplications ||
    fallbackData.dailyPractice ||
    fallbackData.adabApplications ||
    fallbackData.reflectionQuestions ||
    fallbackData.goodDeedsIdeas
  );
  const correctAnswer = pickFirstText(
    payload.correctAnswer,
    question.answer,
    ''
  );
  const subject = getCoachSubjectLabel(subjectId, payload, question, topic);
  const explicitTopicName = payload.topic || question.topicTitle || topic.title || topic.name || '';
  const topicName = normalizeText(
    explicitTopicName || getHumanReadableTopic({
      subject: { id: subjectId, title: subject },
      topic,
      question,
      metadata: {
        topicId,
        displayName: payload.topic || question.topicTitle || topic.title || topic.name || ''
      }
    }) ||
    payload.topic ||
    question.topicTitle ||
    topic.title ||
    topic.name ||
    ''
  );

  return {
    explanation,
    simpleExplanation,
    hint,
    learningTip,
    praise,
    correctAnswer,
    subject,
    topic: topicName,
    steps,
    error: null
  };
}

function mergeList(primary = [], secondary = []) {
  const result = [];
  const seen = new Set();
  for (const item of [...normalizeList(primary), ...normalizeList(secondary)]) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function buildFallbackPayload(mode, { question = {}, topic = {}, result = {}, userAnswer = '' } = {}) {
  return buildFallbackData(mode, { question, topic, result, userAnswer });
}

function buildContextUsed({
  subjectId = '',
  topicId = '',
  question = {},
  topic = {},
  result = {},
  userAnswer = '',
  questionText = '',
  instruction = '',
  options = [],
  expectedAnswer = '',
  acceptedAnswers = [],
  explanationMode = '',
  currentLearningObjective = '',
  attemptCount = 0,
  hintsUsed = 0
} = {}) {
  return {
    subjectId: normalizeText(subjectId, ''),
    topicId: normalizeText(topicId, ''),
    questionText: normalizeText(questionText || question?.q || question?.question || question?.stem || '', ''),
    instruction: normalizeText(instruction || question?.instruction || '', ''),
    options: normalizeArray(options.length ? options : question?.options || question?.choices || []),
    expectedAnswer: normalizeText(expectedAnswer || question?.answer || question?.correctAnswer || '', ''),
    acceptedAnswers: getAcceptedAnswers({ ...question, acceptedAnswers }),
    learnerAnswer: normalizeText(userAnswer || result?.userAnswer || '', ''),
    isCorrect: Boolean(result?.correct || result?.status === 'correct'),
    attemptCount: Number(attemptCount) || 0,
    hintsUsed: Number(hintsUsed) || 0,
    explanationMode: normalizeText(explanationMode, ''),
    currentLearningObjective: normalizeText(currentLearningObjective || question?.learningObjective || topic?.learningObjective || topic?.objective || '', ''),
    subjectIdResolved: normalizeText(subjectId, ''),
    topicLabel: normalizeText(
      getHumanReadableTopic({
        subject: { id: subjectId, title: subjectId },
        topic,
        question,
        metadata: { topicId, displayName: topic?.title || topic?.name || '' }
      }),
      'topik semasa'
    )
  };
}

function normalizeCoachPayload(mode, { subjectId, topicId, topic = null, question = {}, result = {}, userAnswer = '', coachData = null, fallbackData = null, error = null, questionText = '', instruction = '', options = [], expectedAnswer = '', acceptedAnswers = [], learnerAnswer = '', explanationMode = '', currentLearningObjective = '', attemptCount = 0, hintsUsed = 0, sourceLanguage = '' } = {}) {
  const subjectLabel = getCoachSubjectLabel(subjectId, coachData || {}, question, topic || {});
  const rawFallback = fallbackData || buildFallbackPayload(mode, { question, topic: topic || {}, result, userAnswer });
  const hasCoachData = Boolean(coachData && !error);
  const payload = hasCoachData ? coachData : rawFallback;
  const tipsObject = payload.tips && typeof payload.tips === 'object' ? payload.tips : {};
  const normalizedCore = extractCoachText(payload, rawFallback, question, topic || {}, subjectId, topicId);
  const contextUsed = buildContextUsed({
    subjectId,
    topicId,
    question,
    topic: topic || {},
    result,
    userAnswer: learnerAnswer || userAnswer,
    questionText,
    instruction,
    options,
    expectedAnswer,
    acceptedAnswers,
    explanationMode,
    currentLearningObjective,
    attemptCount,
    hintsUsed
  });
  const revealAnswer = Boolean(
    result?.correct ||
    result?.status === 'correct' ||
    result?.status === 'almost' ||
    explanationMode === 'correct_answer_reinforcement'
  );
  const resolvedFallbackUsed = !hasCoachData ||
    !normalizedCore.explanation ||
    !normalizedCore.hint ||
    !normalizedCore.praise ||
    !normalizedCore.correctAnswer ||
    !normalizedCore.learningTip ||
    normalizedCore.steps.length === 0;

  const normalized = {
    explanation: normalizedCore.explanation || (question?.q || question?.question || question?.stem
      ? `Teliti soalan ini: ${question.q || question.question || question.stem}. Padankan jawapan dengan arahan.`
      : 'Semak arahan dan padankan jawapan dengan maklumat yang diberi.'),
    steps: normalizedCore.steps,
    hint: normalizedCore.hint || 'Baca soalan perlahan-lahan dan cari kata kunci.',
    learningTip: normalizedCore.learningTip || 'Fokus pada kata kunci penting.',
    praise: normalizedCore.praise || 'Bagus! Teruskan usaha kamu.',
    correctAnswer: normalizedCore.correctAnswer || '',
    acceptedAnswers: getAcceptedAnswers({ ...question, acceptedAnswers }),
    subject: normalizedCore.subject || subjectLabel,
    topic: normalizedCore.topic || '',
    fallbackUsed: resolvedFallbackUsed,
    source: resolvedFallbackUsed ? 'fallback' : 'coach-v3',
    sourceQuestionId: normalizeText(question?.id || question?.questionId, ''),
    sourceSubjectId: normalizeText(subjectId, ''),
    sourceTopicId: normalizeText(topicId || question?.topicId || topic?.id, ''),
    sourceLanguage: normalizeText(sourceLanguage || question?.language || topic?.language || (subjectId === 'english' ? 'en' : subjectId === 'arab' ? 'ar' : 'ms'), 'ms'),
    generatedMode: mode === 'teach' ? 'teach' : 'explain',
    error: normalizeError(error) || (resolvedFallbackUsed ? {
      code: 'COACH_FALLBACK',
      message: 'Coach payload was incomplete, so a safe fallback was used.'
    } : null),
    simpleExplanation: normalizedCore.simpleExplanation || normalizedCore.explanation || '',
    subjectId: subjectId || null,
    topicId: topicId || question.topicId || topic?.id || null,
    subjectLabel,
    subjectTone: coachData?.subjectTone || '',
    shortText: sanitizeAiText(rawFallback.shortText || normalizedCore.explanation || normalizedCore.simpleExplanation || normalizedCore.hint || ''),
    contextUsed,
    showCorrectAnswer: Boolean(revealAnswer),
    sections: rawFallback.sections || {
      summary: sanitizeAiText(questionText || question?.q || question?.question || topic?.title || 'Mari kita lihat soalan ini.'),
      whyCorrect: normalizedCore.explanation || normalizedCore.simpleExplanation || '',
      hint: normalizedCore.hint || '',
      steps: rawFallback.steps || normalizedCore.steps || [],
      commonMistake: mergeList(payload.commonMistakes, rawFallback.commonMistakes)[0] || '',
      example: mergeList(payload.examples, rawFallback.examples)[0] || '',
      memoryTip: mergeList(payload.memoryTips, rawFallback.memoryTips)[0] || '',
      correctAnswer: revealAnswer ? (normalizedCore.correctAnswer || question.answer || '') : '',
      coachMessage: normalizedCore.praise || '',
      learningObjective: sanitizeAiText(currentLearningObjective || question?.learningObjective || topic?.learningObjective || topic?.objective || '')
    },
    suggestedActions: mode === 'teach'
      ? ['Latih', 'Tutup']
      : ['Ajar Saya', 'Cuba Lagi'],
    examples: mergeList(payload.examples, rawFallback.examples),
    extraExamples: mergeList(payload.extraExamples, rawFallback.extraExamples),
    tips: mergeList(tipsObject.tips || payload.tips, rawFallback.tips),
    memoryTips: mergeList(tipsObject.memoryTips || payload.memoryTips, rawFallback.memoryTips),
    commonMistakes: mergeList(tipsObject.commonMistakes || payload.commonMistakes, rawFallback.commonMistakes),
    followUpQuestions: mergeList(payload.followUpQuestions, rawFallback.followUpQuestions),
    workedExamples: mergeList(payload.workedExamples, rawFallback.workedExamples),
    problemSolvingSteps: mergeList(payload.problemSolvingSteps, rawFallback.problemSolvingSteps),
    scientificFacts: mergeList(payload.scientificFacts, rawFallback.scientificFacts),
    observationPrompts: mergeList(payload.observationPrompts, rawFallback.observationPrompts),
    comparisonPrompts: mergeList(payload.comparisonPrompts, rawFallback.comparisonPrompts),
    investigationIdeas: mergeList(payload.investigationIdeas, rawFallback.investigationIdeas),
    realLifeConnections: mergeList(payload.realLifeConnections, rawFallback.realLifeConnections),
    safetyNotes: mergeList(payload.safetyNotes, rawFallback.safetyNotes),
    misconceptions: mergeList(payload.misconceptions, rawFallback.misconceptions),
    evidenceQuestions: mergeList(payload.evidenceQuestions, rawFallback.evidenceQuestions),
    pronunciationTips: mergeList(payload.pronunciationTips, rawFallback.pronunciationTips),
    pronunciationGuide: mergeList(payload.pronunciationGuide, rawFallback.pronunciationGuide),
    readingSteps: mergeList(payload.readingSteps, rawFallback.readingSteps),
    letterBreakdown: mergeList(payload.letterBreakdown, rawFallback.letterBreakdown),
    listeningTips: mergeList(payload.listeningTips, rawFallback.listeningTips),
    letterRecognitionTips: mergeList(payload.letterRecognitionTips, rawFallback.letterRecognitionTips),
    writingTips: mergeList(payload.writingTips, rawFallback.writingTips),
    vocabularyGroups: mergeList(payload.vocabularyGroups, rawFallback.vocabularyGroups),
    wordMeaning: mergeList(payload.wordMeaning, rawFallback.wordMeaning),
    exampleSentences: mergeList(payload.exampleSentences, rawFallback.exampleSentences),
    translationHints: mergeList(payload.translationHints, rawFallback.translationHints),
    readingPractice: mergeList(payload.readingPractice, rawFallback.readingPractice),
    listeningPractice: mergeList(payload.listeningPractice, rawFallback.listeningPractice),
    speakingPractice: mergeList(payload.speakingPractice, rawFallback.speakingPractice),
    writingPractice: mergeList(payload.writingPractice, rawFallback.writingPractice),
    dailyPractice: mergeList(payload.dailyPractice, rawFallback.dailyPractice),
    adabApplications: mergeList(payload.adabApplications, rawFallback.adabApplications),
    realLifeExamples: mergeList(payload.realLifeExamples, rawFallback.realLifeExamples),
    ayahOrHadithReference: mergeList(payload.ayahOrHadithReference, rawFallback.ayahOrHadithReference),
    reflectionQuestions: mergeList(payload.reflectionQuestions, rawFallback.reflectionQuestions),
    goodDeedsIdeas: mergeList(payload.goodDeedsIdeas, rawFallback.goodDeedsIdeas),
    whyQuestions: mergeList(payload.whyQuestions, rawFallback.whyQuestions),
    predictionQuestions: mergeList(payload.predictionQuestions, rawFallback.predictionQuestions),
    comparisonQuestions: mergeList(payload.comparisonQuestions, rawFallback.comparisonQuestions),
    realLifeApplications: mergeList(payload.realLifeApplications, rawFallback.realLifeApplications),
    answerLine: pickFirstText(
      revealAnswer ? payload.answerLine : '',
      revealAnswer ? rawFallback.answerLine : '',
      revealAnswer && question?.answer ? `Jawapan: ${question.answer}` : ''
    ),
    practicePrompt: pickFirstText(payload.practicePrompt, rawFallback.practicePrompt, rawFallback.followUpQuestions?.[0], 'Cuba sekali lagi selepas membaca penerangan ini.'),
    encouragement: normalizedCore.praise || 'Bagus! Teruskan usaha kamu.',
    encouragementMessage: normalizedCore.praise || 'Bagus! Teruskan usaha kamu.',
    fallbackReason: error ? normalizeError(error) : null
  };

  return normalized;
}

export async function buildCoachAdapterData(mode, { subjectId, topicId, question = {}, result = {}, userAnswer = '', topic = null, questionText = '', instruction = '', options = [], expectedAnswer = '', acceptedAnswers = [], learnerAnswer = '', explanationMode = '', currentLearningObjective = '', attemptCount = 0, hintsUsed = 0, sourceLanguage = '' } = {}) {
  const startedAt = Date.now();
  try {
    const coachData = await buildCoachResponse({
      subjectId,
      topicId,
      question,
      result,
      userAnswer,
      mode,
      context: {
        subjectId,
        topicId,
        mastery: topic?.mastery || topic?.masteryScore || 0,
        confidence: topic?.confidence || 0,
        correct: result?.status === 'correct',
        questionText,
        instruction,
        options,
        expectedAnswer,
        acceptedAnswers: getAcceptedAnswers({ ...question, acceptedAnswers }),
        learnerAnswer,
        explanationMode,
        currentLearningObjective,
        attemptCount,
        hintsUsed
      }
    });
  const normalized = normalizeCoachPayload(mode, {
      subjectId,
      topicId,
      topic,
      question,
      result,
      userAnswer,
      coachData,
      questionText,
      instruction,
      options,
      expectedAnswer,
       acceptedAnswers,
      learnerAnswer,
      explanationMode,
      currentLearningObjective,
      attemptCount,
      hintsUsed,
      sourceLanguage
    });
    if (isDev && normalized.fallbackUsed) {
      console.warn('[coach-adapter] contract fallback', {
        subjectId: normalized.subjectId,
        topicId: normalized.topicId,
        explanation: Boolean(normalized.explanation),
        hint: Boolean(normalized.hint),
        learningTip: Boolean(normalized.learningTip),
        praise: Boolean(normalized.praise),
        correctAnswer: Boolean(normalized.correctAnswer)
      });
    }
    logCoachAdapter('coach response resolved', {
      subjectId: normalized.subjectId,
      topicId: normalized.topicId,
      responseTimeMs: Date.now() - startedAt,
      fallbackUsed: normalized.fallbackUsed
    });
    return normalized;
  } catch (error) {
    const normalized = normalizeCoachPayload(mode, {
      subjectId,
      topicId,
      topic,
      question,
      result,
      userAnswer,
      coachData: null,
      fallbackData: buildFallbackPayload(mode, { question, topic, result, userAnswer }),
      error,
      sourceLanguage
    });
    if (isDev) {
      console.warn('[coach-adapter] contract fallback after error', {
        subjectId: normalized.subjectId,
        topicId: normalized.topicId,
        error: normalized.error
      });
    }
    logCoachAdapter('coach response fallback', {
      subjectId: normalized.subjectId,
      topicId: normalized.topicId,
      responseTimeMs: Date.now() - startedAt,
      fallbackUsed: true,
      error: error?.message || String(error || 'unknown-error')
    });
    return normalized;
  }
}

export function normalizeCoachPayloadForAudit(mode, payload = {}) {
  return normalizeCoachPayload(mode, payload);
}

export async function getCoachExplainData(args = {}) {
  return buildCoachAdapterData('explain', args);
}

export async function getCoachTeacherData(args = {}) {
  return buildCoachAdapterData('teach', args);
}

export default {
  buildCoachAdapterData,
  getCoachExplainData,
  getCoachTeacherData,
  normalizeCoachPayloadForAudit
};
