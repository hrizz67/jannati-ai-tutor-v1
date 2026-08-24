import { getTopicPriority, rankStrongTopics, rankWeakTopics } from '../adaptive/weakTopicEngine.js';
import { formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';
import { calculateRepeatScore } from './repeatGuard.js';
import { calculateDifficultyScore } from './difficultyEngine.js';
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

export function resolveQuestionMeta(question = {}, context = {}) {
  const subjectId = question.subjectId || context.subjectId || context.subject?.id || '';
  const topicId = question.topicId || context.topicId || context.topic?.id || '';
  const questionId = question.id || question.questionId || '';
  const stem = question.q || question.question || '';
  const difficulty = question.difficulty || question.qip?.metadata?.difficulty || context.difficulty || 'sederhana';
  const intelligence = question.learningIntelligence && typeof question.learningIntelligence === 'object'
    ? question.learningIntelligence
    : {};
  const questionType = question.interaction?.type || intelligence.questionType || question.questionType || 'textEntry';
  return {
    subjectId,
    subjectName: formatSubjectName(subjectId),
    topicId,
    topicName: formatTopicName(topicId),
    questionId,
    stem,
    difficulty,
    questionType,
    skillId: intelligence.skillId || question.skill || topicId
  };
}

function buildSignalSets(profile = {}, options = {}) {
  const weakTopics = rankWeakTopics(profile, { includeLowConfidence: true, limit: options.weakLimit || 20 });
  const strongTopics = rankStrongTopics(profile, { limit: options.strongLimit || 20 });
  return {
    weak: new Set(weakTopics.map(item => `${item.subjectId}::${item.topicId}`)),
    strong: new Set(strongTopics.map(item => `${item.subjectId}::${item.topicId}`)),
    weakTopics,
    strongTopics
  };
}

function findRevisionEntry(revisionQueue = [], subjectId, topicId) {
  return (Array.isArray(revisionQueue) ? revisionQueue : []).find(item => {
    return item?.subjectId === subjectId && item?.topicId === topicId;
  }) || null;
}

function buildSelectionReason({
  repeatScore,
  revisionPriority,
  weakBoost,
  strongPenalty,
  uasaWeight,
  readinessLevel,
  mastery,
  topicName
}) {
  if (repeatScore >= 70) return `Elakkan ulang ${topicName || 'soalan ini'}.`;
  if (revisionPriority >= 70) return `Topik ${topicName || 'ini'} perlu diulang.`;
  if (weakBoost > 0) return `Fokus pada ${topicName || 'topik ini'} yang masih perlu latihan.`;
  if (uasaWeight >= 40) return 'Seimbangkan latihan UASA dengan topik utama.';
  if (strongPenalty > 0 && mastery >= 80) return `Kekalkan penguasaan ${topicName || 'topik ini'}.`;
  if (readinessLevel === 'needs_support') return 'Bina asas sedikit demi sedikit.';
  return 'Latihan dipilih secara seimbang.';
}

export function calculateQuestionPriority(question = {}, options = {}) {
  const profile = options.profile || {};
  const observation = options.observation || {};
  const predictionProfile = options.predictionProfile || {};
  const readiness = options.readiness || {};
  const parentAnalytics = options.parentAnalytics || {};
  const gamificationProfile = options.gamificationProfile || {};
  const smartState = options.smartState || {};
  const revisionQueue = Array.isArray(options.revisionQueue) ? options.revisionQueue : [];
  const meta = resolveQuestionMeta(question, options);
  const topicRecord = profile?.topics?.[meta.subjectId]?.[meta.topicId] || {};
  const topicPriority = getTopicPriority(topicRecord);
  const mastery = clamp(toNumber(topicRecord.mastery, 0), 0, 100);
  const confidence = clamp(toNumber(topicRecord.confidence, 0), 0, 100);
  const accuracy = clamp(toNumber(topicRecord.accuracy, 0), 0, 100);
  const total = clamp(toNumber(topicRecord.total, 0), 0, 9999);
  const wrong = clamp(toNumber(topicRecord.wrong, 0), 0, 9999);
  const weakSets = buildSignalSets(profile, options);
  const topicKey = `${meta.subjectId}::${meta.topicId}`;
  const revisionEntry = findRevisionEntry(revisionQueue, meta.subjectId, meta.topicId);
  const repeat = calculateRepeatScore(question, smartState, options);
  const difficultyInfo = calculateDifficultyScore(topicRecord, {
    mastery,
    confidence,
    wrongRate: total > 0 ? (wrong / total) * 100 : 0,
    recentPerformance: observation?.learningTrend === 'semakin baik' ? 12 : observation?.learningTrend === 'menurun' ? -12 : 0,
    streak: gamificationProfile?.currentStreak || profile?.streak || 0
  });
  const preferredQuestionId = String(options.preferredQuestionId || '');
  const preferredQuestionIds = Array.isArray(options.preferredQuestionIds) ? options.preferredQuestionIds.map(String) : [];
  const preferredBoost = question.id && (question.id === preferredQuestionId || preferredQuestionIds.includes(String(question.id))) ? 35 : 0;
  const weakBoost = weakSets.weak.has(topicKey) ? 18 : 0;
  const strongPenalty = weakSets.strong.has(topicKey) ? 12 : 0;
  const observationWeakBoost = observation?.weakestTopic?.subjectId === meta.subjectId && observation?.weakestTopic?.topicId === meta.topicId ? 20 : 0;
  const observationStrongPenalty = observation?.strongestTopic?.subjectId === meta.subjectId && observation?.strongestTopic?.topicId === meta.topicId ? 8 : 0;
  const readinessBoost = readiness?.level === 'needs_support' ? 10 : readiness?.level === 'developing' ? 5 : readiness?.level === 'ready' ? 0 : 4;
  const parentTrend = String(parentAnalytics?.weeklyTrend?.trend?.direction || parentAnalytics?.weeklyTrend?.trend || '').toLowerCase();
  const trendBoost = parentTrend === 'declining' ? 6 : parentTrend === 'improving' ? 2 : 0;
  const hintLevel = clamp(toNumber(predictionProfile?.evidence?.hintLevel || predictionProfile?.teachingStrategy?.hintLevel || 1), 1, 5);
  const predictionBoost = hintLevel <= 1 ? 4 : hintLevel === 2 ? 6 : 8;
  const revisionPriority = clamp(toNumber(revisionEntry?.priority, 0), 0, 100);
  const uasaWeight = question.uasa || options.mode === 'uasa'
    ? clamp(Math.round(
      (question.uasa ? 25 : 0) +
      (100 - mastery) * 0.18 +
      revisionPriority * 0.35 +
      (readiness?.level === 'needs_support' ? 10 : 0)
    ), 0, 100)
    : clamp(Math.round(revisionPriority * 0.2), 0, 100);
  const score = clamp(Math.round(
    (100 - mastery) * 0.26 +
    (100 - confidence) * 0.16 +
    topicPriority * 0.18 +
    revisionPriority * 0.22 +
    weakBoost +
    observationWeakBoost +
    readinessBoost +
    trendBoost +
    predictionBoost +
    preferredBoost +
    uasaWeight * 0.16 +
    difficultyInfo.score * 0.08 -
    repeat.repeatScore * 0.7 -
    strongPenalty -
    observationStrongPenalty
  ), 0, 100);
  const variationSeed = createSmartQuestionSeed([
    meta.subjectId,
    meta.topicId,
    meta.questionId,
    meta.stem,
    score,
    repeat.repeatScore,
    revisionPriority,
    uasaWeight,
    smartState?.variationSeed || 0
  ]);

  return {
    ...meta,
    mastery,
    confidence,
    accuracy,
    total,
    wrong,
    repeatScore: repeat.repeatScore,
    repeatReasons: repeat.reasons,
    revisionPriority,
    uasaWeight,
    difficultyScore: difficultyInfo.score,
    recommendedDifficulty: difficultyInfo.recommendedDifficulty,
    selectionReason: buildSelectionReason({
      repeatScore: repeat.repeatScore,
      revisionPriority,
      weakBoost: weakBoost + observationWeakBoost,
      strongPenalty: strongPenalty + observationStrongPenalty,
      uasaWeight,
      readinessLevel: readiness?.level || '',
      mastery,
      topicName: meta.topicName
    }),
    score,
    variationSeed,
    question
  };
}

export function sortQuestionsByPriority(candidates = [], options = {}) {
  const ranked = (Array.isArray(candidates) ? candidates : []).map((question, index) => {
    const priority = calculateQuestionPriority(question, {
      ...options,
      index
    });
    return {
      ...question,
      subjectId: priority.subjectId,
      topicId: priority.topicId,
      smartQuestion: priority
    };
  });

  ranked.sort((a, b) => {
    const left = a.smartQuestion || {};
    const right = b.smartQuestion || {};
    if (right.score !== left.score) return right.score - left.score;
    if (right.repeatScore !== left.repeatScore) return left.repeatScore - right.repeatScore;
    if (right.revisionPriority !== left.revisionPriority) return right.revisionPriority - left.revisionPriority;
    if (right.uasaWeight !== left.uasaWeight) return right.uasaWeight - left.uasaWeight;
    if (left.subjectId !== right.subjectId) return String(left.subjectId || '').localeCompare(String(right.subjectId || ''));
    if (left.topicId !== right.topicId) return String(left.topicId || '').localeCompare(String(right.topicId || ''));
    if (left.questionId !== right.questionId) return String(left.questionId || '').localeCompare(String(right.questionId || ''));
    return left.variationSeed - right.variationSeed;
  });

  return ranked;
}

export default {
  calculateQuestionPriority,
  resolveQuestionMeta,
  sortQuestionsByPriority
};
