function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildEncouragementNarrative(profile = {}, memory = {}, observation = {}, context = {}) {
  const risk = `${observation.riskLevel || ''}`.toUpperCase();
  const confidence = toNumber(observation.confidence, 0);
  const weakest = observation.weakestTopic;
  const mistakes = toNumber(weakest?.wrongCount, 0);

  if (risk === 'HIGH' || confidence < 40 || mistakes >= 3) {
    return 'Tak mengapa. Kita cuba langkah demi langkah.';
  }

  if (weakest?.title) {
    return 'Tak mengapa. Kita cuba sekali lagi.';
  }

  if ((profile.level || 0) >= 5 || confidence >= 80) {
    return 'Kamu sudah bersedia untuk cabaran baharu.';
  }

  return 'Teruskan usaha yang baik.';
}

export default {
  buildEncouragementNarrative
};
