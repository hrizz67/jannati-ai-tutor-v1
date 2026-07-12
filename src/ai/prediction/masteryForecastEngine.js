import { getPredictionProfile } from './predictionProfile.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function forecastMastery(profile = {}, memory = null, context = {}) {
  const predictionProfile = getPredictionProfile(profile, memory, context);
  const stats = predictionProfile.stats;
  const mastery = toNumber(context.mastery, 0);
  const confidence = toNumber(context.confidence, 0);
  const teachingDepth = predictionProfile.teachingStrategy.explanationDepth || 1;
  const growth = clamp(
    Math.round(
      (stats.streak * 1.5) +
      (confidence * 0.18) +
      (predictionProfile.evidence.hintLevel === 1 ? 4 : predictionProfile.evidence.hintLevel === 2 ? 2 : 0) +
      (3 - teachingDepth) * 2
    ),
    0,
    20
  );

  return {
    current: mastery,
    projected: clamp(mastery + growth, 0, 100),
    growth,
    confidenceBand: confidence >= 80 ? 'high' : confidence >= 55 ? 'medium' : 'low',
    message: growth >= 10
      ? 'Penguasaan dijangka meningkat dengan konsisten.'
      : growth >= 5
        ? 'Penguasaan dijangka bertambah sedikit demi sedikit.'
        : 'Penguasaan dijangka stabil buat masa ini.'
  };
}

export default {
  forecastMastery
};
