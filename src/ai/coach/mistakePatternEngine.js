import { getMistakeMemory } from '../memory/mistakeMemory.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getMistakePattern(profile = {}, memory = null, subjectId, topicId) {
  const topicMemory = getMistakeMemory(memory || profile, subjectId, topicId);
  const totalMistakes = toNumber(topicMemory?.totalMistakes, 0);
  const recentMistakes = Array.isArray(topicMemory?.recentMistakes) ? topicMemory.recentMistakes : [];
  const repeatedQuestionCount = recentMistakes.reduce((count, item, index, rows) => {
    return count + (rows.findIndex(row => row.questionId && row.questionId === item.questionId) < index ? 1 : 0);
  }, 0);
  const difficultyCounts = recentMistakes.reduce((acc, item) => {
    const key = item?.difficulty || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    subjectId: subjectId || null,
    topicId: topicId || null,
    totalMistakes,
    recentMistakes,
    repeatedQuestionCount,
    difficultyCounts,
    recurring: totalMistakes >= 3 || repeatedQuestionCount >= 1
  };
}

export default {
  getMistakePattern
};
