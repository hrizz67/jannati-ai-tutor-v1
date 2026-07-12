import { getPredictionProfile } from './predictionProfile.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getReadiness(profile = {}, memory = null, context = {}) {
  const predictionProfile = getPredictionProfile(profile, memory, context);
  const stats = predictionProfile.stats;
  const mastery = toNumber(context.mastery, 0);
  const confidence = toNumber(context.confidence, 0);
  const accuracy = stats.accuracy;
  const streak = stats.streak;
  const hintLevel = predictionProfile.evidence.hintLevel;

  const score = clamp(
    Math.round(
      accuracy * 0.3 +
      mastery * 0.3 +
      confidence * 0.2 +
      Math.min(streak * 3, 15) +
      (hintLevel <= 1 ? 10 : hintLevel === 2 ? 5 : 0)
    ),
    0,
    100
  );

  return {
    score,
    level: score >= 80 ? 'ready' : score >= 55 ? 'developing' : 'needs_support',
    message: score >= 80
      ? 'Murid bersedia untuk cabaran seterusnya.'
      : score >= 55
        ? 'Murid masih berkembang dan sesuai dengan latihan berpandu.'
        : 'Murid memerlukan sokongan tambahan sebelum bergerak ke tahap lebih tinggi.',
    evidence: {
      accuracy,
      mastery,
      confidence,
      streak
    }
  };
}

export default {
  getReadiness
};
