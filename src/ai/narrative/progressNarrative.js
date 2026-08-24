function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildProgressNarrative(observation = {}) {
  const trend = `${observation.learningTrend || ''}`.toLowerCase();
  const strongest = observation.strongestTopic;
  const weakest = observation.weakestTopic;
  const confidence = toNumber(observation.confidence, 0);

  if (trend.includes('baik') || confidence >= 75) {
    return strongest?.title
      ? `Bagus! Kamu semakin yakin dalam ${strongest.title}.`
      : 'Bagus! Kamu semakin yakin dengan latihan kamu.';
  }

  if (trend.includes('stabil')) {
    return weakest?.title
      ? `Kita beri sedikit perhatian pada ${weakest.title}.`
      : 'Kita teruskan langkah kecil hari ini.';
  }

  if (weakest?.title) {
    return `Kita beri lebih latihan pada ${weakest.title}.`;
  }

  return 'Kita teruskan langkah kecil hari ini.';
}

export default {
  buildProgressNarrative
};
