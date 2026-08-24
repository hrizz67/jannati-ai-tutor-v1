import { loadMemory, saveMemory } from './memoryStorage.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function syncAdaptiveSummary(memory, profile = {}) {
  const next = clone(memory);
  const totalQuestions = toNumber(profile.totalQuestions, 0);
  const correctQuestions = toNumber(profile.correctQuestions, 0);
  const studyMinutes = toNumber(profile.studyMinutes, 0);
  const level = toNumber(profile.level, 1);
  const streak = toNumber(profile.streak, 0);
  next.studentId = profile.studentId || next.studentId || null;
  next.name = profile.name || next.name || '';
  next.lastAnsweredAt = profile.lastAnsweredAt || next.lastAnsweredAt || null;
  next.updatedAt = new Date().toISOString();
  next.adaptive = {
    ...next.adaptive,
    version: profile.version ?? next.adaptive.version ?? null,
    totalQuestions,
    correctQuestions,
    level,
    streak,
    studyMinutes,
    lastStudyDate: profile.lastStudyDate || next.adaptive.lastStudyDate || null,
    accuracy: totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0
  };
  return next;
}

export function getStudentMemory(profile = {}, memory = loadMemory()) {
  return syncAdaptiveSummary(memory, profile);
}

export function saveStudentMemory(profile = {}, memory = loadMemory()) {
  return saveMemory(syncAdaptiveSummary(memory, profile));
}

export default {
  getStudentMemory,
  saveStudentMemory
};
