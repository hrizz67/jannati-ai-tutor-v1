import { getPredictionProfile } from './predictionProfile.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function buildStudyPlan(profile = {}, memory = null, context = {}) {
  const predictionProfile = getPredictionProfile(profile, memory, context);
  const stats = predictionProfile.stats;
  const mastery = toNumber(context.mastery, 0);
  const confidence = toNumber(context.confidence, 0);
  const hintLevel = predictionProfile.evidence.hintLevel;
  const focusCount = clamp(
    Math.round((100 - mastery) / 20 + (100 - confidence) / 25 + hintLevel),
    1,
    5
  );
  const estimatedMinutes = clamp(10 + focusCount * 5 + Math.round((100 - stats.accuracy) / 10), 10, 60);

  return {
    focusCount,
    estimatedMinutes,
    planType: mastery >= 80 ? 'maintenance' : mastery >= 55 ? 'development' : 'support',
    recommendedMode: hintLevel >= 3 ? 'guided' : hintLevel === 2 ? 'mixed' : 'independent',
    notes: mastery >= 80
      ? 'Kekalkan penguasaan dengan ulang kaji ringkas.'
      : 'Ikut pelan latihan yang lebih terarah untuk menutup jurang.'
  };
}

export default {
  buildStudyPlan
};
