import { getCoachProfile } from './coachProfile.js';
import { getHintDecision } from './hintEngine.js';
import { getExplanationDecision } from './explanationEngine.js';
import { getEncouragementDecision } from './encouragementEngine.js';
import { getLearningStyle } from './learningStyleEngine.js';
import { getMistakePattern } from './mistakePatternEngine.js';
import { getTopicMemory } from '../memory/topicMemory.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function decideNextAction({ hintLevel, recurringMistake, confidence, mastery }) {
  if (hintLevel >= 3 || recurringMistake) return 'hint';
  if (mastery >= 75 && confidence >= 70) return 'explanation';
  if (mastery >= 55) return 'encouragement';
  return 'hint';
}

export function buildCoachingDecision(profile = {}, memory = null, context = {}) {
  const coachProfile = getCoachProfile(profile, memory);
  const topicMemory = getTopicMemory(coachProfile.studentMemory, context.subjectId, context.topicId);
  const learningStyle = getLearningStyle(profile, coachProfile.memory);
  const pattern = getMistakePattern(profile, coachProfile.studentMemory, context.subjectId, context.topicId);
  const mastery = toNumber(context.mastery, toNumber(topicMemory?.masterySnapshot, 0));
  const confidence = toNumber(context.confidence, toNumber(topicMemory?.confidenceSnapshot, 0));

  const hintDecision = getHintDecision(profile, coachProfile.memory, {
    ...context,
    mastery,
    confidence
  });
  const explanationDecision = getExplanationDecision(profile, coachProfile.memory, {
    ...context,
    mastery,
    confidence
  });
  const encouragementDecision = getEncouragementDecision(profile, coachProfile.memory, {
    ...context,
    mastery,
    confidence
  });

  const nextAction = decideNextAction({
    hintLevel: hintDecision.hintLevel,
    recurringMistake: pattern.recurring,
    confidence,
    mastery
  });

  return {
    hintLevel: hintDecision.hintLevel,
    hint: hintDecision.hint,
    explanation: explanationDecision.explanation,
    encouragement: encouragementDecision.encouragement,
    nextAction,
    learningStyle: learningStyle.style,
    mistakePattern: pattern,
    coachProfile: {
      stats: coachProfile.stats,
      subjectId: context.subjectId || null,
      topicId: context.topicId || null
    }
  };
}

export function getCoachingState(profile = {}, memory = null, context = {}) {
  return buildCoachingDecision(profile, memory, context);
}

export default {
  buildCoachingDecision,
  getCoachingState
};
