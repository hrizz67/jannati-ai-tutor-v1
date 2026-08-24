function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function resolveDifficultyLabel(score = 0) {
  if (score < 40) return 'mudah';
  if (score < 75) return 'sederhana';
  return 'sukar';
}

export function calculateDifficultyScore(topicRecord = {}, options = {}) {
  const mastery = clamp(toNumber(options.mastery ?? topicRecord.mastery ?? 0), 0, 100);
  const confidence = clamp(toNumber(options.confidence ?? topicRecord.confidence ?? 0), 0, 100);
  const wrongRate = clamp(toNumber(options.wrongRate ?? (topicRecord.total ? (topicRecord.wrong / Math.max(1, topicRecord.total)) * 100 : 0)), 0, 100);
  const recentPerformance = clamp(toNumber(options.recentPerformance ?? options.recentTrend ?? 0), -100, 100);
  const streak = clamp(toNumber(options.streak ?? 0), 0, 30);

  const score = clamp(Math.round(
    mastery * 0.38 +
    confidence * 0.2 +
    (100 - wrongRate) * 0.16 +
    ((recentPerformance + 100) / 2) * 0.2 +
    Math.min(streak * 1.5, 12)
  ), 0, 100);

  const recommendedDifficulty = resolveDifficultyLabel(score);

  return {
    score,
    recommendedDifficulty,
    mastery,
    confidence,
    wrongRate,
    recentPerformance,
    streak
  };
}

export function getRecommendedDifficulty(topicRecord = {}, options = {}) {
  return calculateDifficultyScore(topicRecord, options).recommendedDifficulty;
}

export function adjustDifficulty(profile = {}, subjectId, topicId, options = {}) {
  const topicRecord = profile?.topics?.[subjectId]?.[topicId] || {};
  const assessment = calculateDifficultyScore(topicRecord, options);
  return {
    subjectId: subjectId || null,
    topicId: topicId || null,
    recommendedDifficulty: assessment.recommendedDifficulty,
    score: assessment.score,
    reason: assessment.score < 40
      ? 'Topik ini sesuai bermula dengan soalan mudah.'
      : assessment.score < 80
        ? 'Tahap sederhana sesuai untuk mengukuhkan asas.'
        : 'Tahap sukar sesuai untuk mencabar penguasaan.'
  };
}

export function getDifficultyDistribution(profile = {}) {
  const topics = profile?.topics && typeof profile.topics === 'object' ? profile.topics : {};
  const distribution = { mudah: 0, sederhana: 0, sukar: 0 };

  Object.entries(topics).forEach(([subjectId, subjectTopics]) => {
    Object.entries(subjectTopics || {}).forEach(([topicId, record]) => {
      const difficulty = getRecommendedDifficulty(record, { subjectId, topicId });
      distribution[difficulty] = (distribution[difficulty] || 0) + 1;
    });
  });

  return distribution;
}

export function buildDifficultyPlan(profile = {}) {
  const topics = profile?.topics && typeof profile.topics === 'object' ? profile.topics : {};
  const plan = [];

  Object.entries(topics).forEach(([subjectId, subjectTopics]) => {
    Object.entries(subjectTopics || {}).forEach(([topicId, record]) => {
      const assessment = calculateDifficultyScore(record, { subjectId, topicId });
      plan.push({
        subjectId,
        topicId,
        recommendedDifficulty: assessment.recommendedDifficulty,
        score: assessment.score
      });
    });
  });

  plan.sort((a, b) => b.score - a.score || a.subjectId.localeCompare(b.subjectId) || a.topicId.localeCompare(b.topicId));

  return {
    distribution: getDifficultyDistribution(profile),
    topics: plan
  };
}

export default {
  adjustDifficulty,
  buildDifficultyPlan,
  calculateDifficultyScore,
  getDifficultyDistribution,
  getRecommendedDifficulty
};
