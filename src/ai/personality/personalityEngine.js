import { getPersonalityProfile } from './personalityProfile.js';
import { getGreeting, getFarewell } from './greetingEngine.js';
import { getEmotion } from './emotionEngine.js';
import { getAchievementMessage } from './achievementDialogue.js';
import { getMotivation } from './motivationEngine.js';
import { getConversationStyle } from './conversationStyle.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeCoachTone(persona, emotion, readiness) {
  if (persona === 'jati') {
    if (readiness === 'ready') return 'analitikal-yakin';
    if (emotion === 'sokongan') return 'sabar-tersusun';
    return 'tenang-berstruktur';
  }

  if (emotion === 'bangga') return 'ceria-bangga';
  if (readiness === 'ready') return 'ceria-bersemangat';
  return 'mesra-menggalakkan';
}

export function buildPersonalityResponse(profile = {}, memory = null, context = {}) {
  const personalityProfile = getPersonalityProfile(profile, memory, context);
  const persona = personalityProfile.persona;
  const streak = toNumber(context.streak, personalityProfile.streak);
  const mastery = toNumber(context.mastery, personalityProfile.mastery);
  const topicStrength = toNumber(context.topicStrength, personalityProfile.topicStrength);
  const readiness = `${context.readiness || personalityProfile.readiness || 'needs_support'}`.toLowerCase();
  const conversationStyle = getConversationStyle(profile, memory, {
    ...context,
    persona,
    streak,
    mastery,
    readiness,
    topicStrength
  });
  const emotion = getEmotion(profile, memory, {
    ...context,
    persona,
    streak,
    mastery,
    readiness,
    topicStrength
  });
  const emotionTone = emotion?.tone || 'mesra-menggalakkan';

  return {
    persona,
    greeting: getGreeting(profile, memory, {
      ...context,
      persona,
      streak,
      mastery,
      readiness,
      topicStrength
    }),
    emotion,
    coachTone: normalizeCoachTone(persona, emotion.label, readiness) || emotionTone,
    motivation: getMotivation(profile, memory, {
      ...context,
      persona,
      streak,
      mastery,
      readiness,
      topicStrength
    }),
    achievementMessage: getAchievementMessage(profile, memory, {
      ...context,
      persona,
      streak,
      mastery,
      readiness,
      topicStrength
    }),
    farewell: getFarewell(profile, memory, {
      ...context,
      persona,
      streak,
      mastery,
      readiness,
      topicStrength
    }),
    conversationStyle,
    personalityProfile
  };
}

export function getPersonalityState(profile = {}, memory = null, context = {}) {
  return buildPersonalityResponse(profile, memory, context);
}

export default {
  buildPersonalityResponse,
  getPersonalityState
};
