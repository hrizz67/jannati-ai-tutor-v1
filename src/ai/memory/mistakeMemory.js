import { loadMemory, saveMemory } from './memoryStorage.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function ensureMistakeBucket(memory, subjectId) {
  if (!memory.mistakes || typeof memory.mistakes !== 'object') {
    memory.mistakes = {};
  }
  if (!memory.mistakes[subjectId] || typeof memory.mistakes[subjectId] !== 'object') {
    memory.mistakes[subjectId] = {};
  }
  return memory.mistakes[subjectId];
}

function ensureMistakeRecord(bucket, topicId) {
  if (!bucket[topicId] || typeof bucket[topicId] !== 'object') {
    bucket[topicId] = {
      totalMistakes: 0,
      lastMistakeAt: null,
      lastQuestionId: null,
      lastDifficulty: null,
      recentMistakes: []
    };
  }
  return bucket[topicId];
}

export function recordMistake(memory = loadMemory(), profile = {}, result = {}) {
  const next = clone(memory);
  if (Boolean(result.correct)) return next;

  const subjectId = result.subjectId || null;
  const topicId = result.topicId || null;
  if (!subjectId || !topicId) return next;

  const bucket = ensureMistakeBucket(next, subjectId);
  const record = ensureMistakeRecord(bucket, topicId);
  const answeredAt = result.answeredAt || profile.lastAnsweredAt || next.lastAnsweredAt || new Date().toISOString();

  record.totalMistakes = toNumber(record.totalMistakes, 0) + 1;
  record.lastMistakeAt = answeredAt;
  record.lastQuestionId = result.questionId || record.lastQuestionId || null;
  record.lastDifficulty = result.difficulty || record.lastDifficulty || null;
  record.recentMistakes = Array.isArray(record.recentMistakes) ? record.recentMistakes.slice(0, 9) : [];
  record.recentMistakes = [
    {
      questionId: result.questionId || null,
      answeredAt,
      difficulty: result.difficulty || null,
      timeSpent: toNumber(result.timeSpent, 0),
      expected: result.expected || null,
      actual: result.actual || null
    },
    ...record.recentMistakes
  ].slice(0, 10);

  next.updatedAt = answeredAt;
  next.lastAnsweredAt = answeredAt;
  return next;
}

export function getMistakeMemory(memory = loadMemory(), subjectId, topicId) {
  return memory?.mistakes?.[subjectId]?.[topicId] || null;
}

export function saveMistakeMemory(memory = loadMemory(), profile = {}, result = {}) {
  return saveMemory(recordMistake(memory, profile, result));
}

export default {
  getMistakeMemory,
  recordMistake,
  saveMistakeMemory
};
