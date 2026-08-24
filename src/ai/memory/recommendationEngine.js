import { loadMemory } from './memoryStorage.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normaliseTopicRow(subjectId, topicId, topicRecord = {}, profileTopic = {}, memoryTopic = {}) {
  const mastery = toNumber(profileTopic.mastery, toNumber(topicRecord.masterySnapshot, 0));
  const confidence = toNumber(profileTopic.confidence, toNumber(topicRecord.confidenceSnapshot, 0));
  const wrongCount = toNumber(memoryTopic.wrongCount, 0);
  const reviewCount = toNumber(memoryTopic.reviewCount, 0);
  const lastAnsweredAt = memoryTopic.lastAnsweredAt || profileTopic.lastPlayed || null;
  const recencyPenalty = lastAnsweredAt ? Math.max(0, Math.min(20, Math.round((Date.now() - new Date(lastAnsweredAt).getTime()) / 86400000))) : 20;

  const weaknessScore = Math.round(
    (100 - mastery) * 0.45 +
    (100 - confidence) * 0.25 +
    Math.min(wrongCount * 7, 28) +
    Math.min(reviewCount * 2, 10) +
    recencyPenalty
  );

  return {
    subjectId,
    topicId,
    mastery,
    confidence,
    wrongCount,
    reviewCount,
    lastAnsweredAt,
    score: Math.max(0, weaknessScore)
  };
}

export function getRecommendationScores(memory = loadMemory(), profile = {}) {
  const scores = {};
  const topicGroups = profile.topics && typeof profile.topics === 'object' ? profile.topics : {};

  Object.entries(topicGroups).forEach(([subjectId, topics]) => {
    const subjectScores = [];
    Object.entries(topics || {}).forEach(([topicId, record]) => {
      const memoryTopic = memory.topics?.[subjectId]?.[topicId] || {};
      const row = normaliseTopicRow(subjectId, topicId, memoryTopic, record, memoryTopic);
      subjectScores.push(row);
    });
    subjectScores.sort((a, b) => b.score - a.score || a.topicId.localeCompare(b.topicId));
    scores[subjectId] = subjectScores;
  });

  return scores;
}

export function getRecommendedTopicScores(memory = loadMemory(), profile = {}) {
  return getRecommendationScores(memory, profile);
}

export default {
  getRecommendationScores,
  getRecommendedTopicScores
};
