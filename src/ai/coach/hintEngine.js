import { getCoachProfile } from './coachProfile.js';
import { getLearningStyle } from './learningStyleEngine.js';
import { getMistakePattern } from './mistakePatternEngine.js';
import { getTopicMemory } from '../memory/topicMemory.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getHintDecision(profile = {}, memory = null, context = {}) {
  const coachProfile = getCoachProfile(profile, memory);
  const learningStyle = getLearningStyle(profile, coachProfile.memory);
  const topicMemory = getTopicMemory(coachProfile.studentMemory, context.subjectId, context.topicId);
  const pattern = getMistakePattern(profile, coachProfile.studentMemory, context.subjectId, context.topicId);
  const mastery = toNumber(context.mastery, toNumber(topicMemory?.masterySnapshot, 0));
  const confidence = toNumber(context.confidence, toNumber(topicMemory?.confidenceSnapshot, 0));
  const wrongCount = toNumber(topicMemory?.wrongCount, 0);

  const hintLevel = mastery >= 85 && confidence >= 80
    ? 1
    : mastery >= 60 || confidence >= 60
      ? 2
      : 3;

  return {
    hintLevel,
    hint: hintLevel === 1
      ? 'Cari kata kunci utama dahulu.'
      : hintLevel === 2
        ? 'Baca semula maklumat penting dalam soalan.'
        : 'Gunakan petunjuk kecil dan semak satu langkah pada satu masa.',
    learningStyle: learningStyle.style,
    recurringMistake: pattern.recurring,
    wrongCount
  };
}

export default {
  getHintDecision
};
