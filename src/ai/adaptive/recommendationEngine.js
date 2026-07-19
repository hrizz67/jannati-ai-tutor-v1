import { getLearningNeeds, rankStrongTopics, rankWeakTopics } from './weakTopicEngine.js';
import { getTopicMastery } from './masteryEngine.js';

/**
 * Default recommendation configuration.
 */
export const DEFAULT_RECOMMENDATION_CONFIG = {
  planSizes: [10, 20, 30, 40, 50],
  mode: 'daily',
  difficulty: 'medium',
  minimumAttempts: 3,
  strongMinimumAttempts: 5,
  focusLimit: 8,
  strongLimit: 4,
  evidenceLimit: 4,
  minutesPerQuestion: {
    easy: 2,
    medium: 3,
    hard: 4
  },
  modeMultipliers: {
    daily: 1,
    weekly: 1.4,
    exam: 1.8,
    revision: 1.15
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getProfileTopics(profile = {}) {
  const topics = profile.topics && typeof profile.topics === 'object' ? profile.topics : {};
  return Object.entries(topics).flatMap(([subjectId, subjectTopics]) => {
    if (!subjectTopics || typeof subjectTopics !== 'object') return [];
    return Object.entries(subjectTopics).map(([topicId, record]) => ({
      subjectId,
      topicId,
      record: record && typeof record === 'object' ? { ...record } : {}
    }));
  });
}

function getRecommendedStatusPriority(status) {
  switch (status) {
    case 'critical':
      return 5;
    case 'weak':
      return 4;
    case 'needs_more_evidence':
      return 3;
    case 'developing':
      return 2;
    case 'strong':
      return 1;
    default:
      return 0;
  }
}

function roundHalfUp(value) {
  return Math.max(0, Math.round(value));
}

function resolvePlanSize(options = {}, config = DEFAULT_RECOMMENDATION_CONFIG) {
  const requested = toNumber(options.questionCount, 0);
  if (config.planSizes.includes(requested)) return requested;
  const fallback = config.planSizes.includes(toNumber(options.planSize, 0))
    ? toNumber(options.planSize, 0)
    : config.planSizes[1];
  return fallback;
}

function normalizeMode(options = {}, config = DEFAULT_RECOMMENDATION_CONFIG) {
  const raw = String(options.mode || config.mode || 'daily').toLowerCase();
  return config.modeMultipliers[raw] ? raw : 'daily';
}

function normalizeDifficulty(options = {}, config = DEFAULT_RECOMMENDATION_CONFIG) {
  const raw = String(options.difficulty || config.difficulty || 'medium').toLowerCase();
  return config.minutesPerQuestion[raw] ? raw : 'medium';
}

function sortCandidates(candidates = []) {
  return [...candidates].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (b.mastery !== a.mastery) return b.mastery - a.mastery;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return `${a.subjectId}_${a.topicId}`.localeCompare(`${b.subjectId}_${b.topicId}`);
  });
}

function buildCandidate(entry, statusPriority, options = {}, config = DEFAULT_RECOMMENDATION_CONFIG) {
  const record = entry.record || {};
  const topicMastery = getTopicMastery({
    topics: {
      [entry.subjectId]: {
        [entry.topicId]: record
      }
    }
  }, entry.subjectId, entry.topicId);

  const mastery = toNumber(topicMastery.mastery, toNumber(record.mastery, 0));
  const accuracy = toNumber(topicMastery.accuracy, toNumber(record.accuracy, 0));
  const confidence = toNumber(topicMastery.confidence, toNumber(record.confidence, 0));
  const attempts = toNumber(record.total, 0);
  const wrong = toNumber(record.wrong, 0);
  const averageTime = toNumber(record.averageTime, 0);
  const strongBonus = mastery >= 80 ? 0.5 : 0;
  const weakPenalty = mastery < 60 ? 0.4 : 0;

  let priority = statusPriority * 20;
  priority += (100 - mastery) * 0.35;
  priority += (100 - accuracy) * 0.25;
  priority += (100 - confidence) * 0.15;
  priority += wrong * 0.45;
  priority += averageTime > 0 ? Math.min(averageTime / 2, 15) : 0;
  priority += attempts < config.minimumAttempts ? 12 : 0;
  priority += strongBonus * -8;
  priority += weakPenalty * 6;

  return {
    subjectId: entry.subjectId,
    topicId: entry.topicId,
    record,
    mastery,
    accuracy,
    confidence,
    attempts,
    wrong,
    averageTime,
    priority: clamp(Math.round(priority), 0, 100),
    status: options.forceStatus || null
  };
}

function allocateByPriority(selectedTopics = [], totalQuestions = 0, config = DEFAULT_RECOMMENDATION_CONFIG) {
  if (!selectedTopics.length || totalQuestions <= 0) {
    return [];
  }

  const weights = selectedTopics.map(topic => {
    const statusWeight = getRecommendedStatusPriority(topic.status);
    const base = Math.max(1, topic.priority + statusWeight * 2);
    return {
      ...topic,
      weight: base
    };
  });

  const sum = weights.reduce((total, topic) => total + topic.weight, 0) || 1;
  const seeded = weights.map(topic => {
    const share = (topic.weight / sum) * totalQuestions;
    return {
      ...topic,
      questionCount: Math.floor(share)
    };
  });

  let remaining = totalQuestions - seeded.reduce((sumCount, topic) => sumCount + topic.questionCount, 0);
  const rankedByRemainder = weights
    .map(topic => ({
      ...topic,
      remainder: ((topic.weight / sum) * totalQuestions) - Math.floor((topic.weight / sum) * totalQuestions)
    }))
    .sort((a, b) => {
      if (b.remainder !== a.remainder) return b.remainder - a.remainder;
      return b.priority - a.priority;
    });

  const allocationMap = new Map(seeded.map(topic => [`${topic.subjectId}_${topic.topicId}`, topic]));
  let index = 0;
  while (remaining > 0 && rankedByRemainder.length > 0) {
    const topic = rankedByRemainder[index % rankedByRemainder.length];
    const key = `${topic.subjectId}_${topic.topicId}`;
    const current = allocationMap.get(key);
    current.questionCount += 1;
    remaining -= 1;
    index += 1;
  }

  return seeded.map(topic => ({
    subjectId: topic.subjectId,
    topicId: topic.topicId,
    mastery: topic.mastery,
    accuracy: topic.accuracy,
    confidence: topic.confidence,
    attempts: topic.attempts,
    wrong: topic.wrong,
    averageTime: topic.averageTime,
    priority: topic.priority,
    status: topic.status,
    questionCount: topic.questionCount
  }));
}

/**
 * Chooses candidate topics using mastery and weak-topic data.
 */
export function selectTopics(profile, options = {}) {
  const config = { ...DEFAULT_RECOMMENDATION_CONFIG, ...(options.config || {}) };
  const mode = normalizeMode(options, config);
  const difficulty = normalizeDifficulty(options, config);
  const weakTopics = rankWeakTopics(profile, {
    ...options,
    limit: options.weakLimit || config.focusLimit,
    minimumAttempts: options.minimumAttempts || config.minimumAttempts,
    includeLowConfidence: true
  });
  const strongTopics = rankStrongTopics(profile, {
    ...options,
    limit: options.strongLimit || config.strongLimit,
    minimumAttempts: options.strongMinimumAttempts || config.strongMinimumAttempts
  });
  const learningNeeds = getLearningNeeds(profile, {
    ...options,
    limit: options.weakLimit || config.focusLimit
  });

  const subjectFilter = options.subjectId || null;
  const allEntries = getProfileTopics(profile).filter(entry => !subjectFilter || entry.subjectId === subjectFilter);

  const candidateMap = new Map();
  const pushCandidate = (entry, status = null) => {
    const key = `${entry.subjectId}_${entry.topicId}`;
    if (candidateMap.has(key)) return;
    const candidate = buildCandidate(entry, getRecommendedStatusPriority(status), { ...options, forceStatus: status }, config);
    candidateMap.set(key, candidate);
  };

  weakTopics.forEach(topic => pushCandidate({
    subjectId: topic.subjectId,
    topicId: topic.topicId,
    record: topic.record || profile.topics?.[topic.subjectId]?.[topic.topicId] || {}
  }, topic.status));

  learningNeeds.needsMoreEvidence.forEach(topic => pushCandidate({
    subjectId: topic.subjectId,
    topicId: topic.topicId,
    record: profile.topics?.[topic.subjectId]?.[topic.topicId] || {}
  }, 'needs_more_evidence'));

  strongTopics.forEach(topic => pushCandidate({
    subjectId: topic.subjectId,
    topicId: topic.topicId,
    record: profile.topics?.[topic.subjectId]?.[topic.topicId] || {}
  }, topic.status));

  if (!candidateMap.size) {
    allEntries.forEach(entry => pushCandidate(entry, 'needs_more_evidence'));
  }

  const selected = sortCandidates([...candidateMap.values()]);
  const availableSubjects = [...new Set(selected.map(item => item.subjectId))];

  return {
    mode,
    difficulty,
    subjects: availableSubjects.map(subjectId => ({
      subjectId,
      topics: selected
        .filter(item => item.subjectId === subjectId)
        .map(item => ({
          topicId: item.topicId,
          priority: item.priority,
          status: item.status || (item.priority >= 70 ? 'critical' : item.priority >= 45 ? 'weak' : 'strong'),
          mastery: item.mastery,
          accuracy: item.accuracy,
          confidence: item.confidence,
          attempts: item.attempts,
          wrong: item.wrong,
          averageTime: item.averageTime
        }))
    }))
  };
}

/**
 * Allocates question counts across selected topics.
 */
export function allocateQuestions(selectedTopics, options = {}) {
  const config = { ...DEFAULT_RECOMMENDATION_CONFIG, ...(options.config || {}) };
  const planSize = resolvePlanSize(options, config);
  const mode = normalizeMode(options, config);
  const difficulty = normalizeDifficulty(options, config);
  const totalQuestions = Math.max(1, planSize);
  const multiplier = config.modeMultipliers[mode] || 1;
  const adjustedQuestions = clamp(roundHalfUp(totalQuestions * multiplier), 1, 200);

  const baseList = Array.isArray(selectedTopics)
    ? selectedTopics.map(topic => ({
        subjectId: topic.subjectId,
        topicId: topic.topicId,
        priority: toNumber(topic.priority, 0),
        status: topic.status || 'developing',
        mastery: toNumber(topic.mastery, 0),
        accuracy: toNumber(topic.accuracy, 0),
        confidence: toNumber(topic.confidence, 0),
        attempts: toNumber(topic.attempts, 0),
        wrong: toNumber(topic.wrong, 0),
        averageTime: toNumber(topic.averageTime, 0)
      }))
    : [];

  if (!baseList.length) {
    return [];
  }

  const ranked = sortCandidates(baseList);
  const weighted = ranked.map(topic => {
    let questionWeight = 1;
    if (topic.status === 'critical') questionWeight = 4;
    else if (topic.status === 'weak') questionWeight = 3;
    else if (topic.status === 'needs_more_evidence') questionWeight = 2;
    else if (topic.status === 'developing') questionWeight = 2;
    else if (topic.status === 'strong') questionWeight = 1;

    if (topic.mastery < 40) questionWeight += 1;
    if (topic.accuracy < 50) questionWeight += 1;
    if (topic.confidence < 50) questionWeight += 1;

    return {
      ...topic,
      questionWeight
    };
  });

  const totalWeight = weighted.reduce((sum, topic) => sum + topic.questionWeight, 0) || 1;
  const allocated = weighted.map(topic => {
    const share = (topic.questionWeight / totalWeight) * adjustedQuestions;
    return {
      ...topic,
      questionCount: Math.floor(share)
    };
  });

  let remaining = adjustedQuestions - allocated.reduce((sum, topic) => sum + topic.questionCount, 0);
  const remainders = weighted
    .map(topic => ({
      ...topic,
      remainder: ((topic.questionWeight / totalWeight) * adjustedQuestions) - Math.floor((topic.questionWeight / totalWeight) * adjustedQuestions)
    }))
    .sort((a, b) => {
      if (b.remainder !== a.remainder) return b.remainder - a.remainder;
      return b.priority - a.priority;
    });

  let cursor = 0;
  while (remaining > 0 && remainders.length > 0) {
    const target = remainders[cursor % remainders.length];
    const found = allocated.find(item => item.subjectId === target.subjectId && item.topicId === target.topicId);
    if (found) found.questionCount += 1;
    remaining -= 1;
    cursor += 1;
  }

  return allocated.map(topic => ({
    subjectId: topic.subjectId,
    topicId: topic.topicId,
    questionCount: topic.questionCount,
    priority: topic.priority,
    status: topic.status,
    estimatedMinutes: Math.max(1, Math.round(topic.questionCount * (config.minutesPerQuestion[difficulty] || 3)))
  }));
}

/**
 * Estimates study time for a study plan.
 */
export function estimateStudyTime(plan) {
  const subjects = Array.isArray(plan?.subjects) ? plan.subjects : [];
  return subjects.reduce((total, subject) => {
    const subjectMinutes = Array.isArray(subject.topics)
      ? subject.topics.reduce((sum, topic) => sum + toNumber(topic.estimatedMinutes, 0), 0)
      : 0;
    return total + subjectMinutes;
  }, 0);
}

/**
 * Creates a study plan from the student's adaptive data.
 */
export function generateStudyPlan(profile, options = {}) {
  const config = { ...DEFAULT_RECOMMENDATION_CONFIG, ...(options.config || {}) };
  const mode = normalizeMode(options, config);
  const difficulty = normalizeDifficulty(options, config);
  const selectedTopics = selectTopics(profile, options);
  const subjectTopics = selectedTopics.subjects.flatMap(subject => subject.topics.map(topic => ({
    subjectId: subject.subjectId,
    topicId: topic.topicId,
    priority: topic.priority,
    status: topic.status,
    mastery: topic.mastery,
    accuracy: topic.accuracy,
    confidence: topic.confidence,
    attempts: topic.attempts,
    wrong: topic.wrong,
    averageTime: topic.averageTime
  })));
  const allocated = allocateQuestions(subjectTopics, {
    ...options,
    config,
    mode,
    difficulty
  });

  const grouped = new Map();
  allocated.forEach(topic => {
    if (!grouped.has(topic.subjectId)) {
      grouped.set(topic.subjectId, []);
    }
    grouped.get(topic.subjectId).push({
      topicId: topic.topicId,
      questionCount: topic.questionCount,
      estimatedMinutes: topic.estimatedMinutes,
      priority: topic.priority
    });
  });

  const plan = {
    subjects: [...grouped.entries()].map(([subjectId, topics]) => ({
      subjectId,
      topics
    })),
    totalQuestions: allocated.reduce((sum, topic) => sum + topic.questionCount, 0),
    estimatedMinutes: 0
  };

  plan.estimatedMinutes = estimateStudyTime(plan);
  return plan;
}

/**
 * Returns a recommendation payload containing a plan and summary.
 */
export function generateRecommendation(profile, options = {}) {
  const plan = generateStudyPlan(profile, options);
  const needs = getLearningNeeds(profile, options);

  return {
    plan,
    learningNeeds: needs,
    summary: {
      weakTopics: needs.weakTopics.length,
      criticalTopics: needs.criticalTopics.length,
      strongTopics: needs.strongTopics.length,
      recommendedFocus: needs.recommendedFocus.map(topic => ({
        subjectId: topic.subjectId,
        topicId: topic.topicId,
        priority: topic.priority,
        status: topic.status
      }))
    }
  };
}

export function recommendAdaptiveAction(input = {}) {
  const mastery = clamp(toNumber(input.mastery, 0), 0, 100);
  const revisionPriority = clamp(toNumber(input.revisionPriority, 0), 0, 100);
  const attempts = toNumber(input.attempts, 0);
  const incorrect = toNumber(input.incorrect, 0);
  const usedHintCount = toNumber(input.usedHintCount, 0);
  const usedExplainCount = toNumber(input.usedExplainCount, 0);

  if (mastery < 60) {
    return {
      recommendation: 'review',
      recommendationKey: 'review',
      action: 'review',
      reason: 'Penguasaan masih rendah, ulang semula topik ini.',
      revisionPriority: clamp(Math.round(65 + (60 - mastery) * 0.5 + revisionPriority * 0.25), 0, 100),
      mastery,
      attempts,
      incorrect,
      usedHintCount,
      usedExplainCount
    };
  }

  if (mastery <= 85) {
    return {
      recommendation: 'normal practice',
      recommendationKey: 'normal_practice',
      action: 'normal_practice',
      reason: 'Teruskan latihan biasa untuk mengukuhkan penguasaan.',
      revisionPriority: clamp(Math.round(35 + revisionPriority * 0.3), 0, 100),
      mastery,
      attempts,
      incorrect,
      usedHintCount,
      usedExplainCount
    };
  }

  return {
    recommendation: 'increase difficulty or move to next topic',
    recommendationKey: 'increase_difficulty',
    action: 'advance',
    reason: 'Penguasaan tinggi, boleh naik aras atau ke topik seterusnya.',
    revisionPriority: clamp(Math.round(10 + revisionPriority * 0.15), 0, 100),
    mastery,
    attempts,
    incorrect,
    usedHintCount,
    usedExplainCount
  };
}

export default {
  DEFAULT_RECOMMENDATION_CONFIG,
  allocateQuestions,
  estimateStudyTime,
  generateRecommendation,
  generateStudyPlan,
  selectTopics
};
