import { getCoachProfile } from './coachProfile.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getEncouragementDecision(profile = {}, memory = null, context = {}) {
  const coachProfile = getCoachProfile(profile, memory);
  const stats = coachProfile.stats;
  const mastery = toNumber(context.mastery, context.mastery ?? 0);
  const accuracy = stats.accuracy;

  const encouragement = accuracy >= 90 || mastery >= 85
    ? 'Hebat! Kamu sedang berada pada laluan yang sangat baik.'
    : accuracy >= 70
      ? 'Bagus. Teruskan usaha sedikit demi sedikit.'
      : 'Jangan putus asa. Setiap cubaan membawa kemajuan.';

  return {
    encouragement,
    intensity: accuracy >= 90 ? 'high' : accuracy >= 70 ? 'medium' : 'low'
  };
}

export default {
  getEncouragementDecision
};
