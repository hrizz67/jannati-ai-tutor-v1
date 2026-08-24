import { getStudentMemory } from '../memory/studentMemory.js';
import { loadAIMemory } from '../memoryEngine.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getCoachProfile(profile = {}, memory = null) {
  const aiMemory = memory || loadAIMemory();
  const studentMemory = getStudentMemory(profile);
  const totalQuestions = toNumber(profile.totalQuestions, 0);
  const correctQuestions = toNumber(profile.correctQuestions, 0);
  const accuracy = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
  const topicHistory = studentMemory.topics || {};
  const mistakeHistory = studentMemory.mistakes || {};

  return {
    profile: clone(profile),
    adaptive: clone(profile),
    memory: aiMemory,
    studentMemory,
    topicHistory,
    mistakeHistory,
    stats: {
      xp: toNumber(profile.xp, 0),
      level: toNumber(profile.level, 1),
      streak: toNumber(profile.streak, 0),
      totalQuestions,
      correctQuestions,
      accuracy,
      studyMinutes: toNumber(profile.studyMinutes, 0)
    }
  };
}

export default {
  getCoachProfile
};
