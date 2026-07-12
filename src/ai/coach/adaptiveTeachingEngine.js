import { buildCoachingDecision } from './coachingEngine.js';
import { getLearningStyle } from './learningStyleEngine.js';
import { getMistakePattern } from './mistakePatternEngine.js';
import { getCoachProfile } from './coachProfile.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function determineTeachingStyle({ learningStyle, mastery, confidence, recurringMistake }) {
  if (recurringMistake) return 'guided';
  if (learningStyle === 'auditory') return mastery >= 70 ? 'discussion' : 'guided';
  if (learningStyle === 'practice') return mastery >= 65 ? 'challenge' : 'guided';
  if (learningStyle === 'visual') return confidence >= 60 ? 'visual' : 'guided';
  return mastery >= 80 ? 'independent' : 'guided';
}

export function buildTeachingStrategy(profile = {}, memory = null, context = {}) {
  const coachProfile = getCoachProfile(profile, memory);
  const coachingDecision = buildCoachingDecision(profile, coachProfile.memory, context);
  const learningStyle = getLearningStyle(profile, coachProfile.memory);
  const pattern = getMistakePattern(profile, coachProfile.studentMemory, context.subjectId, context.topicId);
  const recurringMistake = Boolean(pattern?.recurring);

  const mastery = toNumber(context.mastery, 0);
  const confidence = toNumber(context.confidence, 0);
  const teachingStyle = determineTeachingStyle({
    learningStyle: learningStyle.style,
    mastery,
    confidence,
    recurringMistake
  });
  const explanationDepth = clamp(
    Math.round(
      (100 - mastery) * 0.04 +
      (100 - confidence) * 0.03 +
      (teachingStyle === 'guided' ? 3 : teachingStyle === 'discussion' ? 2 : 1)
    ),
    1,
    5
  );
  const hintLevel = coachingDecision.hintLevel || (mastery < 50 ? 3 : mastery < 75 ? 2 : 1);
  const challengeLevel = clamp(
    Math.round(
      (mastery >= 85 ? 3 : mastery >= 65 ? 2 : 1) +
      (confidence >= 80 ? 1 : 0) -
      (recurringMistake ? 1 : 0)
    ),
    1,
    3
  );
  const exampleCount = clamp(
    mastery >= 80 ? 1 : mastery >= 55 ? 2 : 3,
    1,
    3
  );
  const encouragementFrequency = clamp(
    recurringMistake ? 3 : mastery >= 80 ? 1 : mastery >= 60 ? 2 : 3,
    1,
    3
  );

  return {
    teachingStyle,
    explanationDepth,
    hintLevel,
    challengeLevel,
    exampleCount,
    encouragementFrequency,
    learningStyle: learningStyle.style,
    mistakePattern: pattern,
    coachingDecision
  };
}

export function getTeachingStrategy(profile = {}, memory = null, context = {}) {
  return buildTeachingStrategy(profile, memory, context);
}

export default {
  buildTeachingStrategy,
  getTeachingStrategy
};
