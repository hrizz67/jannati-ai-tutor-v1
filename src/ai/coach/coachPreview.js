import { buildCoachingDecision } from './coachingEngine.js';
import { buildTeachingStrategy } from './adaptiveTeachingEngine.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function summarizeTeachingStrategy(strategy = {}) {
  return {
    teachingStyle: strategy.teachingStyle || 'guided',
    hintLevel: toNumber(strategy.hintLevel, 1),
    challengeLevel: toNumber(strategy.challengeLevel, 1),
    explanationDepth: toNumber(strategy.explanationDepth, 1),
    exampleCount: toNumber(strategy.exampleCount, 1),
    encouragementFrequency: toNumber(strategy.encouragementFrequency, 1),
    learningStyle: strategy.learningStyle || 'balanced'
  };
}

export function summarizeMistakePattern(pattern = {}) {
  return {
    subjectId: pattern.subjectId || null,
    topicId: pattern.topicId || null,
    totalMistakes: toNumber(pattern.totalMistakes, 0),
    repeatedQuestionCount: toNumber(pattern.repeatedQuestionCount, 0),
    recurring: Boolean(pattern.recurring),
    difficultyCounts: pattern.difficultyCounts || {},
    recentMistakes: Array.isArray(pattern.recentMistakes) ? pattern.recentMistakes.slice(0, 5) : []
  };
}

export function buildCoachPreview(profile = {}, memory = null, context = {}) {
  const strategy = buildTeachingStrategy(profile, memory, context);
  const coachingDecision = buildCoachingDecision(profile, memory, context);
  const strategySummary = summarizeTeachingStrategy(strategy);
  const mistakeSummary = summarizeMistakePattern(strategy.mistakePattern);

  return {
    teachingStyle: strategySummary.teachingStyle,
    hintLevel: strategySummary.hintLevel,
    challengeLevel: strategySummary.challengeLevel,
    explanationDepth: strategySummary.explanationDepth,
    exampleCount: strategySummary.exampleCount,
    encouragementFrequency: strategySummary.encouragementFrequency,
    learningStyle: strategySummary.learningStyle,
    mistakePattern: mistakeSummary,
    recommendationSummary: coachingDecision.nextAction,
    recommendationDetails: {
      hint: coachingDecision.hint,
      explanation: coachingDecision.explanation,
      encouragement: coachingDecision.encouragement,
      nextAction: coachingDecision.nextAction
    }
  };
}

export default {
  buildCoachPreview,
  summarizeTeachingStrategy,
  summarizeMistakePattern
};
