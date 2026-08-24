import { getCoachProfile } from '../coach/coachProfile.js';
import { buildCoachingDecision } from '../coach/coachingEngine.js';
import { buildTeachingStrategy } from '../coach/adaptiveTeachingEngine.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getPredictionProfile(profile = {}, memory = null, context = {}) {
  const coachProfile = getCoachProfile(profile, memory);
  const coachingDecision = buildCoachingDecision(profile, memory, context);
  const teachingStrategy = buildTeachingStrategy(profile, memory, context);
  const stats = coachProfile.stats;

  return {
    adaptive: clone(profile),
    stats,
    memory: coachProfile.memory,
    coachingDecision,
    teachingStrategy,
    evidence: {
      mastery: toNumber(context.mastery, 0),
      confidence: toNumber(context.confidence, 0),
      hintLevel: coachingDecision.hintLevel || teachingStrategy.hintLevel || 1
    }
  };
}

export default {
  getPredictionProfile
};
