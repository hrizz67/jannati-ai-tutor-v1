import { buildRevisionQueue } from './revisionQueue.js';
import { getRecommendedDifficulty } from './difficultyEngine.js';
import { createSmartQuestionSeed } from './contextVariation.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function extractQuestionMeta(question = {}, context = {}) {
  const subjectId = question.subjectId || context.subjectId || context.subject?.id || '';
  const topicId = question.topicId || context.topicId || context.topic?.id || '';
  const questionId = question.id || question.questionId || '';
  const stem = question.q || question.question || '';
  const topicTitle = question.topicTitle || context.topic?.title || context.topic?.name || '';
  return { subjectId, topicId, questionId, stem, topicTitle };
}

export function calculateUasaWeight(question = {}, context = {}) {
  const meta = extractQuestionMeta(question, context);
  const profile = context.profile || {};
  const topicRecord = profile?.topics?.[meta.subjectId]?.[meta.topicId] || {};
  const mastery = clamp(toNumber(topicRecord.mastery, 0), 0, 100);
  const confidence = clamp(toNumber(topicRecord.confidence, 0), 0, 100);
  const uasaSignal = Boolean(question.uasa || context.mode === 'uasa');
  const weakQueue = Array.isArray(context.revisionQueue) ? context.revisionQueue : [];
  const queueEntry = weakQueue.find(item => item.subjectId === meta.subjectId && item.topicId === meta.topicId);
  const queuePriority = queueEntry ? clamp(toNumber(queueEntry.priority, 0), 0, 100) : 0;
  const readiness = clamp(toNumber(context.readiness?.score ?? context.readiness?.value ?? 0), 0, 100);
  const parentTrend = String(context.parentAnalytics?.weeklyTrend?.trend?.direction || context.parentAnalytics?.weeklyTrend?.trend || '').toLowerCase();
  const decliningTrend = parentTrend === 'declining';

  return clamp(Math.round(
    (uasaSignal ? 28 : 0) +
    (100 - mastery) * 0.18 +
    (100 - confidence) * 0.1 +
    queuePriority * 0.35 +
    (100 - readiness) * 0.08 +
    (decliningTrend ? 6 : 0)
  ), 0, 100);
}

export function buildUasaPlan(questions = [], context = {}) {
  const revisionQueue = context.revisionQueue || buildRevisionQueue(context.profile || {}, context);
  const items = (Array.isArray(questions) ? questions : []).map(question => {
    const difficulty = getRecommendedDifficulty(
      context.profile?.topics?.[question.subjectId || context.subjectId || context.subject?.id || '']?.[question.topicId || context.topicId || context.topic?.id || ''] || question,
      {
        mastery: context.profile?.topics?.[question.subjectId || context.subjectId || context.subject?.id || '']?.[question.topicId || context.topicId || context.topic?.id || '']?.mastery || 0,
        confidence: context.profile?.topics?.[question.subjectId || context.subjectId || context.subject?.id || '']?.[question.topicId || context.topicId || context.topic?.id || '']?.confidence || 0,
        streak: context.gamificationProfile?.currentStreak || context.profile?.streak || 0
      }
    );
    const uasaWeight = calculateUasaWeight(question, { ...context, revisionQueue });
    const signature = createSmartQuestionSeed([
      question.id || question.questionId || '',
      question.q || question.question || '',
      question.subjectId || context.subjectId || context.subject?.id || '',
      question.topicId || context.topicId || context.topic?.id || '',
      difficulty,
      uasaWeight
    ]);

    return {
      question,
      difficulty,
      uasaWeight,
      signature
    };
  });

  items.sort((a, b) => {
    if (b.uasaWeight !== a.uasaWeight) return b.uasaWeight - a.uasaWeight;
    if (a.difficulty !== b.difficulty) return a.difficulty.localeCompare(b.difficulty);
    return a.signature - b.signature;
  });

  return {
    revisionQueue,
    questions: items.map(item => ({
      ...item.question,
      smartQuestion: {
        ...(item.question.smartQuestion || {}),
        uasaWeight: item.uasaWeight,
        recommendedDifficulty: item.difficulty,
        variationSeed: item.signature
      }
    }))
  };
}

export default {
  buildUasaPlan,
  calculateUasaWeight
};
