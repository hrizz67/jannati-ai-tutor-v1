function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function getRecentAttempts(topicRecord = {}) {
  const history = Array.isArray(topicRecord.recentAnswers)
    ? topicRecord.recentAnswers
    : Array.isArray(topicRecord.attemptHistory)
      ? topicRecord.attemptHistory
      : [];
  return history.slice(-10).map(entry => ({
    correct: Boolean(entry?.correct),
    difficulty: String(entry?.difficulty || '').toLowerCase(),
    answeredAt: entry?.answeredAt || entry?.date || null
  }));
}

function getRecentPerformance(recentAttempts = []) {
  const attempts = recentAttempts.slice(-10);
  if (!attempts.length) {
    return {
      accuracy: 0,
      drop: 0,
      wrongRate: 0,
      averageDifficulty: 0
    };
  }

  const lastFive = attempts.slice(-5);
  const lastTen = attempts.slice(-10);
  const correctFive = lastFive.reduce((sum, attempt) => sum + (attempt.correct ? 1 : 0), 0);
  const correctTen = lastTen.reduce((sum, attempt) => sum + (attempt.correct ? 1 : 0), 0);
  const accuracyFive = Math.round((correctFive / Math.max(1, lastFive.length)) * 100);
  const accuracyTen = Math.round((correctTen / Math.max(1, lastTen.length)) * 100);
  const drop = accuracyFive - accuracyTen;
  const wrongRate = Math.round(((lastTen.length - correctTen) / Math.max(1, lastTen.length)) * 100);
  const difficultyWeight = lastTen.reduce((sum, attempt) => {
    if (attempt.difficulty === 'sukar') return sum + 3;
    if (attempt.difficulty === 'sederhana') return sum + 2;
    return sum + 1;
  }, 0);

  return {
    accuracy: accuracyTen,
    drop,
    wrongRate,
    averageDifficulty: Math.round((difficultyWeight / Math.max(1, lastTen.length)) * 100) / 100
  };
}

function getStreakFactor(profile = {}) {
  const streak = Math.max(0, toNumber(profile.streak, 0));
  if (streak >= 20) return 1.15;
  if (streak >= 10) return 1.1;
  if (streak >= 5) return 1.05;
  return 1;
}

function getBaseDistribution(score, recentDrop, lowConfidence) {
  let distribution = { mudah: 0.2, sederhana: 0.4, sukar: 0.4 };

  if (score < 40) distribution = { mudah: 0.7, sederhana: 0.25, sukar: 0.05 };
  else if (score <= 60) distribution = { mudah: 0.45, sederhana: 0.45, sukar: 0.1 };
  else if (score <= 80) distribution = { mudah: 0.15, sederhana: 0.7, sukar: 0.15 };
  else if (score <= 90) distribution = { mudah: 0.08, sederhana: 0.52, sukar: 0.4 };
  else distribution = { mudah: 0.05, sederhana: 0.25, sukar: 0.7 };

  if (recentDrop >= 15) {
    distribution = {
      mudah: clamp(distribution.mudah + 0.15, 0, 1),
      sederhana: clamp(distribution.sederhana + 0.05, 0, 1),
      sukar: clamp(distribution.sukar - 0.2, 0, 1)
    };
  }

  if (lowConfidence) {
    distribution = {
      mudah: clamp(distribution.mudah + 0.1, 0, 1),
      sederhana: clamp(distribution.sederhana + 0.05, 0, 1),
      sukar: clamp(distribution.sukar - 0.15, 0, 1)
    };
  }

  const total = distribution.mudah + distribution.sederhana + distribution.sukar || 1;
  return {
    mudah: Math.round((distribution.mudah / total) * 100),
    sederhana: Math.round((distribution.sederhana / total) * 100),
    sukar: 100 - Math.round((distribution.mudah / total) * 100) - Math.round((distribution.sederhana / total) * 100)
  };
}

function getDifficultyLabel(score) {
  if (score < 40) return 'mudah';
  if (score <= 70) return 'sederhana';
  return 'sukar';
}

export function calculateDifficultyScore(topicRecord = {}) {
  const mastery = clamp(toNumber(topicRecord.mastery, 0), 0, 100);
  const confidence = clamp(toNumber(topicRecord.confidence, 0), 0, 100);
  const total = Math.max(0, toNumber(topicRecord.total, 0));
  const wrong = Math.max(0, toNumber(topicRecord.wrong, 0));
  const correct = Math.max(0, toNumber(topicRecord.correct, 0));
  const streakFactor = getStreakFactor(topicRecord.profile || {});
  const recent = getRecentPerformance(getRecentAttempts(topicRecord));
  const wrongRate = wrong + correct > 0 ? (wrong / Math.max(1, wrong + correct)) * 100 : recent.wrongRate;

  const masteryComponent = mastery * 0.4;
  const confidenceComponent = confidence * 0.2;
  const recentComponent = recent.accuracy * 0.2;
  const streakComponent = clamp((streakFactor - 1) * 100, 0, 15) * 0.1;
  const wrongComponent = (100 - clamp(wrongRate, 0, 100)) * 0.1;
  const score = clamp(Math.round(masteryComponent + confidenceComponent + recentComponent + streakComponent + wrongComponent), 0, 100);

  return score;
}

export function getRecommendedDifficulty(topicRecord = {}) {
  const score = calculateDifficultyScore(topicRecord);
  const mastery = clamp(toNumber(topicRecord.mastery, 0), 0, 100);
  const confidence = clamp(toNumber(topicRecord.confidence, 0), 0, 100);
  const recent = getRecentPerformance(getRecentAttempts(topicRecord));

  let recommendedDifficulty = getDifficultyLabel(score);
  if (mastery < 40) recommendedDifficulty = 'mudah';
  else if (mastery <= 60) recommendedDifficulty = score < 50 ? 'mudah' : 'sederhana';
  else if (mastery <= 80) recommendedDifficulty = recent.drop >= 10 ? 'mudah' : 'sederhana';
  else if (mastery <= 90) recommendedDifficulty = recent.drop >= 12 || confidence < 65 ? 'sederhana' : 'sukar';
  else recommendedDifficulty = confidence > 90 && recent.drop < 10 ? 'sukar' : 'sederhana';

  if (recent.drop >= 15) {
    recommendedDifficulty = recommendedDifficulty === 'sukar' ? 'sederhana' : 'mudah';
  }

  if (confidence < 45 && recommendedDifficulty === 'sukar') {
    recommendedDifficulty = 'sederhana';
  }

  const distribution = getBaseDistribution(score, recent.drop, confidence < 60);
  const reason = mastery < 40
    ? 'Penguasaan masih rendah, jadi soalan mudah lebih sesuai.'
    : confidence < 60
      ? 'Keyakinan data masih rendah, jadi tahap sukar dielakkan dahulu.'
      : recent.drop >= 15
        ? 'Prestasi terkini menurun, jadi tahap akan diturunkan sementara.'
        : recommendedDifficulty === 'sukar'
          ? 'Penguasaan tinggi, soalan sukar sesuai untuk cabaran seterusnya.'
          : 'Tahap sederhana seimbang dengan prestasi semasa.';

  return {
    recommendedDifficulty,
    score,
    distribution,
    reason,
    confidence: confidence
  };
}

export function adjustDifficulty(profile = {}, subjectId, topicId) {
  const topicRecord = profile.topics?.[subjectId]?.[topicId] || {};
  return getRecommendedDifficulty({
    ...topicRecord,
    profile
  });
}

export function getDifficultyDistribution(profile = {}) {
  const topics = Object.entries(profile.topics || {}).flatMap(([subjectId, subjectTopics]) => {
    if (!subjectTopics || typeof subjectTopics !== 'object') return [];
    return Object.entries(subjectTopics).map(([topicId, record]) => ({
      subjectId,
      topicId,
      record: record && typeof record === 'object' ? { ...record } : {}
    }));
  });

  const all = topics.map(entry => getRecommendedDifficulty(entry.record));
  const totals = all.reduce((acc, item) => {
    acc.mudah += item.distribution.mudah;
    acc.sederhana += item.distribution.sederhana;
    acc.sukar += item.distribution.sukar;
    return acc;
  }, { mudah: 0, sederhana: 0, sukar: 0 });

  const count = Math.max(1, all.length);
  return {
    mudah: Math.round(totals.mudah / count),
    sederhana: Math.round(totals.sederhana / count),
    sukar: Math.round(totals.sukar / count)
  };
}

export function buildDifficultyPlan(profile = {}) {
  const topics = Object.entries(profile.topics || {}).flatMap(([subjectId, subjectTopics]) => {
    if (!subjectTopics || typeof subjectTopics !== 'object') return [];
    return Object.entries(subjectTopics).map(([topicId, record]) => ({
      subjectId,
      topicId,
      record: record && typeof record === 'object' ? { ...record } : {}
    }));
  });

  const difficultyMap = topics.map(entry => {
    const result = getRecommendedDifficulty(entry.record);
    return {
      subjectId: entry.subjectId,
      topicId: entry.topicId,
      ...result
    };
  }).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return `${a.subjectId}_${a.topicId}`.localeCompare(`${b.subjectId}_${b.topicId}`);
  });

  return {
    generatedAt: new Date().toISOString(),
    topics: difficultyMap,
    distribution: getDifficultyDistribution(profile)
  };
}

export default {
  adjustDifficulty,
  buildDifficultyPlan,
  calculateDifficultyScore,
  getDifficultyDistribution,
  getRecommendedDifficulty
};
