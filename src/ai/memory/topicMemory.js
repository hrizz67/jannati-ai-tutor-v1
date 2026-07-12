import { loadMemory, saveMemory } from './memoryStorage.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function ensureTopicBucket(memory, subjectId) {
  if (!memory.topics || typeof memory.topics !== 'object') {
    memory.topics = {};
  }
  if (!memory.topics[subjectId] || typeof memory.topics[subjectId] !== 'object') {
    memory.topics[subjectId] = {};
  }
  return memory.topics[subjectId];
}

function ensureTopicRecord(bucket, topicId) {
  if (!bucket[topicId] || typeof bucket[topicId] !== 'object') {
    bucket[topicId] = {
      subjectId: null,
      topicId,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      lastAnsweredAt: null,
      lastQuestionId: null,
      lastDifficulty: null,
      lastCorrect: null,
      masterySnapshot: 0,
      confidenceSnapshot: 0,
      focusPriority: 0,
      recentMistakes: []
    };
  }
  return bucket[topicId];
}

export function updateTopicMemory(memory = loadMemory(), profile = {}, result = {}) {
  const next = clone(memory);
  const subjectId = result.subjectId || null;
  const topicId = result.topicId || null;
  if (!subjectId || !topicId) return next;

  const bucket = ensureTopicBucket(next, subjectId);
  const record = ensureTopicRecord(bucket, topicId);
  const topicProfile = profile.topics?.[subjectId]?.[topicId] || {};
  const answeredAt = result.answeredAt || profile.lastAnsweredAt || next.lastAnsweredAt || new Date().toISOString();
  const correct = Boolean(result.correct);

  record.subjectId = subjectId;
  record.topicId = topicId;
  record.reviewCount = toNumber(record.reviewCount, 0) + 1;
  record.correctCount = toNumber(record.correctCount, 0) + (correct ? 1 : 0);
  record.wrongCount = toNumber(record.wrongCount, 0) + (correct ? 0 : 1);
  record.lastAnsweredAt = answeredAt;
  record.lastQuestionId = result.questionId || record.lastQuestionId || null;
  record.lastDifficulty = result.difficulty || record.lastDifficulty || null;
  record.lastCorrect = correct;
  record.masterySnapshot = toNumber(topicProfile.mastery, record.masterySnapshot);
  record.confidenceSnapshot = toNumber(topicProfile.confidence, record.confidenceSnapshot);
  record.focusPriority = Math.max(
    0,
    Math.round(
      (100 - record.masterySnapshot) * 0.45 +
      (100 - record.confidenceSnapshot) * 0.35 +
      Math.min(record.wrongCount * 8, 30) +
      Math.min(record.reviewCount * 2, 10)
    )
  );
  record.recentMistakes = Array.isArray(record.recentMistakes) ? record.recentMistakes.slice(0, 10) : [];
  if (!correct) {
    record.recentMistakes = [
      {
        questionId: result.questionId || null,
        answeredAt,
        difficulty: result.difficulty || null,
        timeSpent: toNumber(result.timeSpent, 0)
      },
      ...record.recentMistakes
    ].slice(0, 10);
  }
  next.updatedAt = answeredAt;
  next.lastAnsweredAt = answeredAt;
  return next;
}

export function getTopicMemory(memory = loadMemory(), subjectId, topicId) {
  return memory?.topics?.[subjectId]?.[topicId] || null;
}

export function saveTopicMemory(memory = loadMemory(), profile = {}, result = {}) {
  return saveMemory(updateTopicMemory(memory, profile, result));
}

export default {
  getTopicMemory,
  saveTopicMemory,
  updateTopicMemory
};
