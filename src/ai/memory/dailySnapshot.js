import { loadMemory, saveMemory } from './memoryStorage.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function localDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function ensureSnapshots(memory) {
  if (!Array.isArray(memory.dailySnapshots)) {
    memory.dailySnapshots = [];
  }
  return memory.dailySnapshots;
}

function summarizeSubjects(profile = {}) {
  const subjects = profile.subjects && typeof profile.subjects === 'object' ? profile.subjects : {};
  return Object.entries(subjects).map(([subjectId, summary]) => ({
    subjectId,
    total: toNumber(summary?.total, 0),
    correct: toNumber(summary?.correct, 0),
    accuracy: toNumber(summary?.accuracy, 0)
  }));
}

export function createDailySnapshot(profile = {}, memory = loadMemory(), timestamp = new Date()) {
  const next = clone(memory);
  const snapshots = ensureSnapshots(next);
  const date = localDayKey(timestamp);
  const answeredAt = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp || Date.now()).toISOString();
  const totalQuestions = toNumber(profile.totalQuestions, 0);
  const correctQuestions = toNumber(profile.correctQuestions, 0);
  const studyMinutes = toNumber(profile.studyMinutes, 0);
  const existing = snapshots.find(item => item && item.date === date) || null;
  const snapshot = {
    date,
    totalQuestions,
    correctQuestions,
    wrongQuestions: Math.max(0, totalQuestions - correctQuestions),
    accuracy: totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0,
    studyMinutes,
    streak: toNumber(profile.streak, 0),
    xp: toNumber(profile.xp, 0),
    level: toNumber(profile.level, 1),
    subjects: summarizeSubjects(profile),
    updatedAt: answeredAt
  };

  if (existing) {
    Object.assign(existing, snapshot);
  } else {
    snapshots.unshift(snapshot);
  }

  next.updatedAt = answeredAt;
  next.lastAnsweredAt = answeredAt;
  return next;
}

export function getDailySnapshot(memory = loadMemory(), date = new Date()) {
  const day = localDayKey(date);
  return (memory.dailySnapshots || []).find(item => item?.date === day) || null;
}

export function saveDailySnapshot(profile = {}, memory = loadMemory(), timestamp = new Date()) {
  return saveMemory(createDailySnapshot(profile, memory, timestamp));
}

export default {
  createDailySnapshot,
  getDailySnapshot,
  saveDailySnapshot
};
