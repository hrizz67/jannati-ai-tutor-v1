function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildLearningJourneyNarrative(profile = {}, memory = {}, observation = {}, context = {}) {
  const scope = `${context.scope || ''}`.toLowerCase();
  const trend = `${observation.learningTrend || ''}`.toLowerCase();
  const consistency = toNumber(observation.studyConsistency, 0);
  const strongest = observation.strongestTopic?.title || observation.summary?.strongestTopic;

  if (scope === 'week') {
    return 'Minggu ini kita teruskan rutin belajar yang baik.';
  }

  if (scope === 'session') {
    return 'Hari ini kamu sudah berusaha dengan baik.';
  }

  if (trend.includes('baik') || (strongest && consistency >= 70)) {
    return 'Kita nampak kemajuan yang baik sejak kebelakangan ini.';
  }

  return 'Kita sambung langkah kecil hari ini.';
}

export default {
  buildLearningJourneyNarrative
};
