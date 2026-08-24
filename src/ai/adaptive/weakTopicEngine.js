import { getSubjectMastery, getTopicMastery } from './masteryEngine.js';

/**
 * Default configuration for weak-topic ranking.
 */
export const DEFAULT_WEAK_TOPIC_CONFIG = {
  minimumAttempts: 3,
  strongMinimumAttempts: 4,
  lowConfidenceThreshold: 55,
  weakMasteryThreshold: 60,
  criticalMasteryThreshold: 40,
  strongMasteryThreshold: 80,
  weakAccuracyThreshold: 65,
  criticalAccuracyThreshold: 45,
  strongAccuracyThreshold: 85,
  weakConfidenceThreshold: 65,
  strongConfidenceThreshold: 80,
  averageTimePenaltyThreshold: 25,
  recentDaysWindow: 10,
  evidencePoints: 3,
  limit: 10
};

/**
 * Scoring weights used for priority calculations.
 */
export const DEFAULT_PRIORITY_WEIGHTS = {
  mastery: 0.3,
  accuracy: 0.22,
  confidence: 0.12,
  attempts: 0.08,
  wrongCount: 0.14,
  timeSpent: 0.08,
  recency: 0.06
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(dateValue) {
  const date = normalizeDate(dateValue);
  if (!date) return null;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getTopicEntries(profile = {}) {
  const subjects = profile.topics && typeof profile.topics === 'object' ? profile.topics : {};
  const entries = [];

  Object.entries(subjects).forEach(([subjectId, subjectTopics]) => {
    if (!subjectTopics || typeof subjectTopics !== 'object') return;

    Object.entries(subjectTopics).forEach(([topicId, record]) => {
      if (!record || typeof record !== 'object') return;
      entries.push({
        subjectId,
        topicId,
        record: { ...record }
      });
    });
  });

  return entries;
}

function getRecentPerformanceScore(record = {}, config = DEFAULT_WEAK_TOPIC_CONFIG) {
  const attempts = toNumber(record.total, 0);
  const correct = toNumber(record.correct, 0);
  const wrong = toNumber(record.wrong, 0);
  const averageTime = toNumber(record.averageTime, 0);
  const lastPlayedDays = daysSince(record.lastPlayed);

  const accuracyScore = attempts ? (correct / attempts) * 100 : 0;
  const wrongPressure = attempts ? (wrong / attempts) * 100 : 0;
  const timePressure = averageTime > config.averageTimePenaltyThreshold
    ? clamp((averageTime - config.averageTimePenaltyThreshold) * 2, 0, 30)
    : 0;
  const recencyBoost = lastPlayedDays == null
    ? 0
    : clamp(config.recentDaysWindow - lastPlayedDays, 0, config.recentDaysWindow);

  return {
    accuracyScore,
    wrongPressure,
    timePressure,
    recencyBoost
  };
}

function determineStatus(record = {}, score = 0, config = DEFAULT_WEAK_TOPIC_CONFIG) {
  const mastery = toNumber(record.mastery, 0);
  const accuracy = toNumber(record.accuracy, 0);
  const confidence = toNumber(record.confidence, 0);
  const attempts = toNumber(record.total, 0);

  if (attempts < config.minimumAttempts || confidence < config.lowConfidenceThreshold) {
    return 'needs_more_evidence';
  }
  if (mastery < config.criticalMasteryThreshold || accuracy < config.criticalAccuracyThreshold || score >= 75) {
    return 'critical';
  }
  if (mastery < config.weakMasteryThreshold || accuracy < config.weakAccuracyThreshold || confidence < config.weakConfidenceThreshold) {
    return 'weak';
  }
  if (mastery < config.strongMasteryThreshold || accuracy < config.strongAccuracyThreshold || confidence < config.strongConfidenceThreshold) {
    return 'developing';
  }
  return 'strong';
}

function buildReasonCodes(record = {}, score = 0, config = DEFAULT_WEAK_TOPIC_CONFIG) {
  const codes = [];
  const mastery = toNumber(record.mastery, 0);
  const accuracy = toNumber(record.accuracy, 0);
  const confidence = toNumber(record.confidence, 0);
  const attempts = toNumber(record.total, 0);
  const wrong = toNumber(record.wrong, 0);
  const averageTime = toNumber(record.averageTime, 0);
  const recencyDays = daysSince(record.lastPlayed);

  if (attempts < config.minimumAttempts) codes.push('low_evidence');
  if (mastery < config.weakMasteryThreshold) codes.push('low_mastery');
  if (accuracy < config.weakAccuracyThreshold) codes.push('low_accuracy');
  if (confidence < config.weakConfidenceThreshold) codes.push('low_confidence');
  if (wrong > 0 && wrong >= Math.ceil(attempts / 2)) codes.push('high_wrong_count');
  if (averageTime > config.averageTimePenaltyThreshold) codes.push('slow_response_time');
  if (recencyDays != null && recencyDays <= config.recentDaysWindow) codes.push('recent_activity');
  if (score >= 70) codes.push('high_priority_signal');

  return [...new Set(codes)];
}

function buildPriorityScore(record = {}, config = DEFAULT_WEAK_TOPIC_CONFIG, weights = DEFAULT_PRIORITY_WEIGHTS) {
  const mastery = clamp(toNumber(record.mastery, 0), 0, 100);
  const accuracy = clamp(toNumber(record.accuracy, 0), 0, 100);
  const confidence = clamp(toNumber(record.confidence, 0), 0, 100);
  const attempts = Math.max(0, toNumber(record.total, 0));
  const wrong = Math.max(0, toNumber(record.wrong, 0));
  const averageTime = Math.max(0, toNumber(record.averageTime, 0));
  const lastPlayedDays = daysSince(record.lastPlayed);
  const recentPerformance = getRecentPerformanceScore(record, config);

  const masteryNeed = 100 - mastery;
  const accuracyNeed = 100 - accuracy;
  const confidenceNeed = 100 - confidence;
  const attemptNeed = attempts < config.minimumAttempts ? (config.minimumAttempts - attempts) * 18 : 0;
  const wrongNeed = clamp((wrong / Math.max(1, attempts)) * 100, 0, 100);
  const timeNeed = averageTime > config.averageTimePenaltyThreshold
    ? clamp((averageTime - config.averageTimePenaltyThreshold) * 3, 0, 100)
    : 0;
  const recencyNeed = lastPlayedDays == null ? 0 : clamp(config.recentDaysWindow - lastPlayedDays, 0, 100);

  const weighted = (
    masteryNeed * weights.mastery +
    accuracyNeed * weights.accuracy +
    confidenceNeed * weights.confidence +
    attemptNeed * weights.attempts +
    wrongNeed * weights.wrongCount +
    timeNeed * weights.timeSpent +
    recencyNeed * weights.recency +
    recentPerformance.wrongPressure * 0.05 +
    recentPerformance.timePressure * 0.03
  );

  return clamp(Math.round(weighted), 0, 100);
}

/**
 * Returns a normalized priority score for a topic record.
 */
export function getTopicPriority(record, options = {}) {
  if (!record || typeof record !== 'object') return 0;
  const config = { ...DEFAULT_WEAK_TOPIC_CONFIG, ...(options.config || {}) };
  const weights = { ...DEFAULT_PRIORITY_WEIGHTS, ...(options.weights || {}) };
  return buildPriorityScore(record, config, weights);
}

function buildTopicResult({ subjectId, topicId, record, config, weights }) {
  const cloned = record && typeof record === 'object' ? { ...record } : {};
  const attempts = toNumber(cloned.total, 0);
  const priority = buildPriorityScore(cloned, config, weights);
  const status = determineStatus(cloned, priority, config);
  const reasonCodes = buildReasonCodes(cloned, priority, config);

  return {
    subjectId,
    topicId,
    priority,
    status,
    mastery: clamp(toNumber(cloned.mastery, 0), 0, 100),
    accuracy: clamp(toNumber(cloned.accuracy, 0), 0, 100),
    confidence: clamp(toNumber(cloned.confidence, 0), 0, 100),
    attempts,
    correct: toNumber(cloned.correct, 0),
    wrong: toNumber(cloned.wrong, 0),
    averageTime: toNumber(cloned.averageTime, 0),
    totalTime: toNumber(cloned.totalTime, 0),
    xp: toNumber(cloned.xp, 0),
    lastPlayed: cloned.lastPlayed || null,
    reasons: reasonCodes
  };
}

/**
 * Ranks weak topics for the entire profile.
 */
export function rankWeakTopics(profile, options = {}) {
  const config = { ...DEFAULT_WEAK_TOPIC_CONFIG, ...(options.config || {}) };
  const weights = { ...DEFAULT_PRIORITY_WEIGHTS, ...(options.weights || {}) };
  const subjectFilter = options.subjectId || null;
  const minimumAttempts = Math.max(0, toNumber(options.minimumAttempts, config.minimumAttempts));
  const includeLowConfidence = Boolean(options.includeLowConfidence);
  const limit = Math.max(0, toNumber(options.limit, config.limit));

  const ranked = getTopicEntries(profile)
    .filter(entry => !subjectFilter || entry.subjectId === subjectFilter)
    .map(entry => buildTopicResult({
      subjectId: entry.subjectId,
      topicId: entry.topicId,
      record: entry.record,
      config,
      weights
    }))
    .filter(result => {
      if (result.attempts < minimumAttempts) {
        return includeLowConfidence && result.status === 'needs_more_evidence';
      }
      return result.status === 'critical' || result.status === 'weak' || result.status === 'developing' || result.status === 'needs_more_evidence';
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
      return a.topicId.localeCompare(b.topicId);
    });

  return limit > 0 ? ranked.slice(0, limit) : ranked;
}

/**
 * Ranks strong topics for the entire profile.
 */
export function rankStrongTopics(profile, options = {}) {
  const config = { ...DEFAULT_WEAK_TOPIC_CONFIG, ...(options.config || {}) };
  const weights = { ...DEFAULT_PRIORITY_WEIGHTS, ...(options.weights || {}) };
  const subjectFilter = options.subjectId || null;
  const minimumAttempts = Math.max(config.strongMinimumAttempts, toNumber(options.minimumAttempts, config.strongMinimumAttempts));
  const limit = Math.max(0, toNumber(options.limit, config.limit));

  const ranked = getTopicEntries(profile)
    .filter(entry => !subjectFilter || entry.subjectId === subjectFilter)
    .map(entry => buildTopicResult({
      subjectId: entry.subjectId,
      topicId: entry.topicId,
      record: entry.record,
      config,
      weights
    }))
    .filter(result => result.attempts >= minimumAttempts && result.status === 'strong')
    .sort((a, b) => {
      if (b.mastery !== a.mastery) return b.mastery - a.mastery;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.topicId.localeCompare(b.topicId);
    });

  return limit > 0 ? ranked.slice(0, limit) : ranked;
}

/**
 * Returns weak-topic rankings for a single subject.
 */
export function getWeakTopicsBySubject(profile, subjectId, options = {}) {
  return rankWeakTopics(profile, {
    ...options,
    subjectId
  });
}

/**
 * Returns strong-topic rankings for a single subject.
 */
export function getStrongTopicsBySubject(profile, subjectId, options = {}) {
  return rankStrongTopics(profile, {
    ...options,
    subjectId
  });
}

/**
 * Produces a summary of learning needs across all subjects.
 */
export function getLearningNeeds(profile, options = {}) {
  const weakTopics = rankWeakTopics(profile, options);
  const strongTopics = rankStrongTopics(profile, options);
  const criticalTopics = weakTopics.filter(topic => topic.status === 'critical');
  const developingTopics = weakTopics.filter(topic => topic.status === 'developing');
  const needsMoreEvidence = weakTopics.filter(topic => topic.status === 'needs_more_evidence');

  const recommendedFocus = weakTopics
    .filter(topic => topic.status === 'critical' || topic.status === 'weak' || topic.status === 'developing')
    .slice(0, Math.max(0, toNumber(options.focusLimit, 5)));

  return {
    criticalTopics,
    weakTopics: weakTopics.filter(topic => topic.status === 'weak'),
    developingTopics,
    needsMoreEvidence,
    strongTopics,
    recommendedFocus
  };
}

/**
 * Returns a machine-readable explanation for the topic result.
 */
export function explainWeakness(topicResult) {
  const result = topicResult && typeof topicResult === 'object' ? topicResult : {};
  const reasonCodes = Array.isArray(result.reasons) ? [...new Set(result.reasons)] : [];
  const primaryReason = reasonCodes[0] || (
    result.status === 'needs_more_evidence'
      ? 'low_evidence'
      : result.status === 'critical'
        ? 'low_mastery'
        : 'low_accuracy'
  );

  const messages = {
    low_evidence: 'Belum cukup data percubaan untuk membuat penarafan yang kuat.',
    low_mastery: 'Penguasaan masih belum mencapai tahap yang disasarkan bagi topik ini.',
    low_accuracy: 'Ketepatan masih di bawah tahap sasaran.',
    low_confidence: 'Keyakinan masih rendah kerana percubaan belum stabil.',
    high_wrong_count: 'Jawapan salah kerap berlaku dan perlu diberi perhatian.',
    slow_response_time: 'Masa menjawab menunjukkan topik ini memerlukan lebih latihan.',
    recent_activity: 'Percubaan terkini masih menunjukkan jurang pembelajaran yang perlu diberi perhatian.',
    high_priority_signal: 'Beberapa isyarat prestasi menunjukkan topik ini perlu diberi fokus segera.'
  };

  return {
    primaryReason,
    reasonCodes,
    message: messages[primaryReason] || 'Topik ini masih memerlukan latihan dan ulang kaji tambahan.'
  };
}

export function summarizeWeakTopicProfile(profile = {}, options = {}) {
  const weak = rankWeakTopics(profile, options);
  const strong = rankStrongTopics(profile, options);
  const subjectIds = [...new Set(getTopicEntries(profile).map(entry => entry.subjectId))];

  return {
    weakTopics: weak,
    strongTopics: strong,
    subjectSummaries: subjectIds.map(subjectId => ({
      subjectId,
      ...getSubjectMastery(profile, subjectId)
    }))
  };
}

export default {
  DEFAULT_PRIORITY_WEIGHTS,
  DEFAULT_WEAK_TOPIC_CONFIG,
  explainWeakness,
  getLearningNeeds,
  getStrongTopicsBySubject,
  getSubjectMastery,
  getTopicPriority,
  getWeakTopicsBySubject,
  rankStrongTopics,
  rankWeakTopics,
  summarizeWeakTopicProfile
};
