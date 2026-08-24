import { getCoachProfile } from './coachProfile.js';
import { getMistakePattern } from './mistakePatternEngine.js';
import { getTopicMemory } from '../memory/topicMemory.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getExplanationDecision(profile = {}, memory = null, context = {}) {
  const coachProfile = getCoachProfile(profile, memory);
  const topicMemory = getTopicMemory(coachProfile.studentMemory, context.subjectId, context.topicId);
  const pattern = getMistakePattern(profile, coachProfile.studentMemory, context.subjectId, context.topicId);
  const mastery = toNumber(context.mastery, toNumber(topicMemory?.masterySnapshot, 0));
  const confidence = toNumber(context.confidence, toNumber(topicMemory?.confidenceSnapshot, 0));

  return {
    explanation: mastery >= 80
      ? 'Topik ini hampir dikuasai. Fokus pada perbezaan kecil dalam jawapan.'
      : confidence >= 70
        ? 'Murid sudah ada asas yang baik. Ulang langkah penting sekali lagi.'
        : 'Baca arahan dengan perlahan dan pecahkan soalan kepada bahagian kecil.',
    explanationLevel: mastery >= 80 ? 1 : confidence >= 70 ? 2 : 3,
    recurringMistake: pattern.recurring
  };
}

export default {
  getExplanationDecision
};
