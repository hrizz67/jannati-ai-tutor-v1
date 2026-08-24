import { getPersonalityProfile } from './personalityProfile.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getConversationStyle(profile = {}, memory = null, context = {}) {
  const personality = getPersonalityProfile(profile, memory, context);
  const mastery = toNumber(personality.mastery, 0);
  const readiness = personality.readiness;
  const persona = personality.persona;

  const style = persona === 'jati'
    ? {
        voice: 'calm-analytical',
        sentenceLength: mastery >= 80 ? 'long' : 'medium',
        pacing: readiness === 'needs_support' ? 'slow' : 'steady',
        structure: 'step-by-step'
      }
    : {
        voice: 'cheerful-encouraging',
        sentenceLength: mastery >= 80 ? 'medium' : 'short',
        pacing: readiness === 'ready' ? 'brisk' : 'steady',
        structure: 'warm-reassuring'
      };

  return {
    persona,
    ...style,
    focus: mastery >= 80 ? 'independent' : mastery >= 55 ? 'guided' : 'supportive'
  };
}

export default {
  getConversationStyle
};
