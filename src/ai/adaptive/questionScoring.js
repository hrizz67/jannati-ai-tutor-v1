import { formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function topicKey(subjectId = '', topicId = '') {
  return `${subjectId || ''}::${topicId || ''}`;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function diffDays(left, right = new Date()) {
  if (!left) return null;
  const leftDate = parseDate(left);
  const rightDate = parseDate(right);
  if (!leftDate || !rightDate) return null;
  const delta = Math.abs(rightDate.getTime() - leftDate.getTime());
  return Math.floor(delta / 86400000);
}

function getTopicRecord(profile = {}, subjectId = '', topicId = '') {
  return profile?.topics?.[subjectId]?.[topicId]
    || profile?.subjects?.[subjectId]?.topics?.[topicId]
    || null;
}

function createRecentHistorySets(statistics = {}) {
  const recentQuestionIds = statistics.recentQuestionIds instanceof Set
    ? statistics.recentQuestionIds
    : new Set(Array.isArray(statistics.recentQuestionIds) ? statistics.recentQuestionIds : []);
  const recentTopicKeys = statistics.recentTopicKeys instanceof Set
    ? statistics.recentTopicKeys
    : new Set(Array.isArray(statistics.recentTopicKeys) ? statistics.recentTopicKeys : []);
  return { recentQuestionIds, recentTopicKeys };
}

function buildReason({
  topicName,
  repeatedMistakeBoost,
  weakTopicBoost,
  lowConfidenceBoost,
  lowAccuracyBoost,
  revisionPlanMatchBoost,
  longTimeNotPractisedBoost,
  knowledgeGapBoost,
  masteredTopicPenalty,
  recentlyAnsweredPenalty,
  sameQuestionRepeatedPenalty
}) {
  if (sameQuestionRepeatedPenalty <= -40 || recentlyAnsweredPenalty <= -30) {
    return `Elakkan soalan ini buat seketika dan cuba topik lain.`;
  }
  if (repeatedMistakeBoost > 0 && weakTopicBoost > 0) {
    return `Latih ${topicName || 'topik ini'} kerana kesilapan berulang masih dikesan.`;
  }
  if (weakTopicBoost > 0 && lowConfidenceBoost > 0) {
    return `Fokus pada ${topicName || 'topik ini'} kerana keyakinan masih rendah.`;
  }
  if (revisionPlanMatchBoost > 0 || longTimeNotPractisedBoost > 0) {
    return `Ulang ${topicName || 'topik ini'} mengikut pelan revisi.`;
  }
  if (knowledgeGapBoost > 0) {
    return `Bina asas ${topicName || 'topik ini'} sedikit demi sedikit.`;
  }
  if (masteredTopicPenalty <= -50) {
    return `Kekalkan penguasaan ${topicName || 'topik ini'} melalui ulang kaji ringan.`;
  }
  if (lowAccuracyBoost > 0) {
    return `Perbaiki ketepatan ${topicName || 'topik ini'} dengan latihan berperingkat.`;
  }
  return `Latihan ${topicName || 'topik ini'} dipilih secara seimbang.`;
}

function createSeed(parts = []) {
  const text = parts.map(part => String(part ?? '')).join('::');
  let seed = 0;
  for (let index = 0; index < text.length; index += 1) {
    seed = (seed * 31 + text.charCodeAt(index)) % 1000003;
  }
  return seed;
}

export function scoreAdaptiveQuestion(question = {}, options = {}, statistics = {}) {
  const profile = statistics.profile || options.profile || {};
  const subjectId = String(question?.subjectId || question?.qip?.metadata?.subject || options.subjectId || options.subject?.id || '');
  const topicId = String(question?.topicId || question?.qip?.metadata?.topic || options.topicId || options.topic?.id || '');
  const questionId = String(question?.id || question?.questionId || question?.qip?.metadata?.questionId || '');
  const stem = String(question?.q || question?.question || question?.stem || '');
  const difficulty = String(question?.difficulty || question?.qip?.metadata?.difficulty || options.difficulty || 'sederhana');
  const topicRecord = getTopicRecord(profile, subjectId, topicId) || {};
  const topicStatus = String(topicRecord.status || topicRecord.statusLabel || '').toLowerCase();
  const mastery = clamp(toNumber(topicRecord.confidence ?? topicRecord.mastery, 0), 0, 100);
  const accuracy = clamp(toNumber(topicRecord.accuracy, 0), 0, 100);
  const attempts = Math.max(0, toNumber(topicRecord.attempts, 0));
  const lastPractised = topicRecord.lastPractised || topicRecord.lastAttemptAt || topicRecord.lastAnsweredAt || '';
  const topicName = question?.topicTitle || options.topic?.title || formatTopicName(topicId);
  const subjectName = question?.subjectTitle || options.subject?.title || formatSubjectName(subjectId);
  const topic = topicKey(subjectId, topicId);
  const weaknessSet = statistics.weakTopicKeys instanceof Set ? statistics.weakTopicKeys : new Set();
  const strengthSet = statistics.strongTopicKeys instanceof Set ? statistics.strongTopicKeys : new Set();
  const revisionSet = statistics.revisionTopics instanceof Set ? statistics.revisionTopics : new Set();
  const recentSets = createRecentHistorySets(statistics);
  const recentQuestionIds = recentSets.recentQuestionIds;
  const recentTopicKeys = recentSets.recentTopicKeys;
  const mistakeContext = statistics.mistakeContext || {};
  const mistakeSummary = statistics.mistakeSummary || {};
  const recentTopicCount = statistics.sessionTopicCounts instanceof Map ? statistics.sessionTopicCounts.get(topic) || 0 : 0;
  const recentSubjectCount = statistics.sessionSubjectCounts instanceof Map ? statistics.sessionSubjectCounts.get(subjectId) || 0 : 0;
  const candidateTopicCount = statistics.candidateTopicCounts instanceof Map ? statistics.candidateTopicCounts.get(topic) || 0 : 0;
  const candidateSubjectCount = statistics.candidateSubjectCounts instanceof Map ? statistics.candidateSubjectCounts.get(subjectId) || 0 : 0;
  const recentDifficultyCount = statistics.difficultyCounts instanceof Map ? statistics.difficultyCounts.get(difficulty) || 0 : 0;
  const daysSincePractised = diffDays(lastPractised, new Date());

  const weakTopicBoost = weaknessSet.has(topic) ? 40 : 0;
  const repeatedMistakeBoost = (mistakeContext?.byTopic?.count || 0) > 1 || (mistakeContext?.repeatedMistakes || 0) > 0 ? 35 : 0;
  const lowConfidenceBoost = mastery <= 20 ? 25 : mastery <= 40 ? 20 : mastery <= 60 ? 12 : mastery <= 75 ? 6 : 0;
  const lowAccuracyBoost = accuracy <= 30 ? 20 : accuracy <= 50 ? 15 : accuracy <= 70 ? 8 : 0;
  const longTimeNotPractisedBoost = daysSincePractised === null ? 10 : daysSincePractised >= 30 ? 20 : daysSincePractised >= 14 ? 16 : daysSincePractised >= 7 ? 12 : daysSincePractised >= 3 ? 8 : 0;
  const revisionPlanMatchBoost = revisionSet.has(topic) ? 15 : 0;
  const knowledgeGapBoost = attempts === 0 ? 10 : mastery < 35 && attempts < 3 ? 8 : mastery < 50 && accuracy < 60 ? 6 : 0;
  const recentlyAnsweredPenalty = recentQuestionIds.has(questionId) || recentTopicKeys.has(topic) ? -30 : 0;
  const sameQuestionRepeatedPenalty = recentQuestionIds.has(questionId) ? -40 : 0;
  const masteredTopicPenalty = strengthSet.has(topic) || topicStatus.includes('mastered') || mastery >= 90 ? -50 : mastery >= 80 && accuracy >= 85 ? -30 : 0;
  const sessionBalancePenalty = Math.max(0, recentTopicCount - 1) * 8 + Math.max(0, recentSubjectCount - 3) * 4;
  const difficultyPenalty = recentDifficultyCount > 3 ? 4 : 0;
  const repeatPenalty = sessionBalancePenalty + difficultyPenalty;
  const profileStrengthBonus = profile?.totals?.currentStreak >= 3 ? 2 : 0;
  const masteryStabilityBonus = mastery >= 80 && accuracy >= 80 ? 4 : 0;
  const crowdingPenalty = Math.max(0, candidateTopicCount - 3) * 2 + Math.max(0, candidateSubjectCount - 6);
  const repeatScore = clamp(Math.round(Math.abs(recentlyAnsweredPenalty) + Math.abs(sameQuestionRepeatedPenalty) + repeatPenalty), 0, 100);
  const revisionPriority = clamp(Math.round(
    revisionPlanMatchBoost +
    longTimeNotPractisedBoost +
    Math.round(weakTopicBoost * 0.25) +
    Math.round(lowConfidenceBoost * 0.25) +
    Math.round(knowledgeGapBoost * 0.5)
  ), 0, 100);
  const uasaWeight = clamp(Math.round(
    ((question?.uasa || options.mode === 'uasa') ? 25 : 0) +
    revisionPriority * 0.35 +
    weakTopicBoost * 0.2 +
    lowConfidenceBoost * 0.15 +
    lowAccuracyBoost * 0.15
  ), 0, 100);
  const recommendedDifficulty = mastery >= 85 && accuracy >= 85
    ? 'challenging'
    : mastery <= 35 || accuracy <= 40
      ? 'easy'
      : 'medium';

  const priorityScore = clamp(Math.round(
    weakTopicBoost +
    repeatedMistakeBoost +
    lowConfidenceBoost +
    lowAccuracyBoost +
    longTimeNotPractisedBoost +
    revisionPlanMatchBoost +
    knowledgeGapBoost +
    profileStrengthBonus +
    masteryStabilityBonus +
    (statistics.topRevisionTopics instanceof Set && statistics.topRevisionTopics.has(topic) ? 4 : 0) +
    Math.abs(recentlyAnsweredPenalty) -
    Math.abs(sameQuestionRepeatedPenalty) -
    Math.abs(masteredTopicPenalty) -
    repeatPenalty -
    crowdingPenalty
  ), 0, 100);
  const variationSeed = createSeed([
    subjectId,
    topicId,
    questionId,
    stem,
    priorityScore,
    repeatScore,
    revisionPriority,
    uasaWeight
  ]);

  const selectionReason = buildReason({
    topicName,
    repeatedMistakeBoost,
    weakTopicBoost,
    lowConfidenceBoost,
    lowAccuracyBoost,
    revisionPlanMatchBoost,
    longTimeNotPractisedBoost,
    knowledgeGapBoost,
    masteredTopicPenalty,
    recentlyAnsweredPenalty,
    sameQuestionRepeatedPenalty
  });

  const confidenceLevel = priorityScore >= 75 ? 'high' : priorityScore >= 40 ? 'medium' : 'low';
  const mistakeReason = repeatedMistakeBoost > 0
    ? (mistakeContext?.focusMistake || mistakeSummary?.topMistakes?.[0]?.mistakeType || 'Kesilapan berulang')
    : lowAccuracyBoost > 0
      ? 'Ketepatan masih rendah'
      : lowConfidenceBoost > 0
        ? 'Keyakinan masih rendah'
        : '';

  return {
    subjectId,
    subjectName,
    topicId,
    topicName,
    questionId,
    stem,
    difficulty,
    recommendedDifficulty,
    priorityScore,
    score: priorityScore,
    repeatScore,
    revisionPriority,
    uasaWeight,
    variationSeed,
    weakTopicBoost,
    repeatedMistakeBoost,
    lowConfidenceBoost,
    lowAccuracyBoost,
    longTimeNotPractisedBoost,
    revisionPlanMatchBoost,
    knowledgeGapBoost,
    recentlyAnsweredPenalty,
    sameQuestionRepeatedPenalty,
    masteredTopicPenalty,
    sessionBalancePenalty,
    selectionReason,
    confidenceLevel,
    mistakeReason,
    topicStatus,
    mastery,
    accuracy,
    attempts,
    lastPractised
  };
}

export default {
  scoreAdaptiveQuestion
};
