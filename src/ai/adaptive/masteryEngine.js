export const MASTERY_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  LEARNING: 'LEARNING',
  NEEDS_PRACTICE: 'NEEDS_PRACTICE',
  MASTERED: 'MASTERED'
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function topicHistory(profile = {}, subjectId, topicId, topicTitle) {
  return (profile.history || []).filter(item => {
    return (item.subjectId === subjectId || item.subject === subjectId) &&
      (item.topicId === topicId || item.topic === topicId || item.topic === topicTitle);
  });
}

function resolveStatus({ attempts, accuracy, masteryScore }) {
  if (!attempts) return MASTERY_STATUS.NOT_STARTED;
  if (masteryScore >= 82 && accuracy >= 80 && attempts >= 1) return MASTERY_STATUS.MASTERED;
  if (accuracy < 65 || masteryScore < 58) return MASTERY_STATUS.NEEDS_PRACTICE;
  return MASTERY_STATUS.LEARNING;
}

function reviewDays(status, confidence) {
  if (status === MASTERY_STATUS.MASTERED) return confidence >= 80 ? 14 : 7;
  if (status === MASTERY_STATUS.LEARNING) return 3;
  if (status === MASTERY_STATUS.NEEDS_PRACTICE) return 1;
  return 0;
}

export function calculateTopicMastery({
  accuracy = 0,
  attempts = 0,
  studyHistory = [],
  streak = 0,
  lastLesson = null,
  xp = 0
} = {}) {
  const recentScores = studyHistory.slice(0, 5).map(item => item.percent || item.score || 0);
  const historyAverage = recentScores.length
    ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
    : accuracy;
  const recencyBonus = lastLesson ? 4 : 0;
  const attemptWeight = clamp(attempts * 7, 0, 21);
  const streakWeight = clamp(streak * 2, 0, 12);
  const xpWeight = clamp(Math.floor((xp || 0) / 120), 0, 10);

  const masteryScore = Math.round(clamp(
    accuracy * 0.52 +
    historyAverage * 0.22 +
    attemptWeight +
    streakWeight +
    xpWeight +
    recencyBonus,
    0,
    100
  ));
  const confidence = Math.round(clamp(
    35 +
    attempts * 12 +
    recentScores.length * 5 +
    (lastLesson ? 8 : 0) +
    clamp(streak, 0, 5) * 3,
    0,
    100
  ));
  const status = resolveStatus({ attempts, accuracy, masteryScore });

  return {
    masteryLevel: status === MASTERY_STATUS.MASTERED ? 'Advanced' : status === MASTERY_STATUS.NOT_STARTED ? 'Starter' : 'Developing',
    masteryScore,
    status,
    nextReviewDate: addDays(new Date(), reviewDays(status, confidence)),
    confidence
  };
}

export function buildMasteryMap(profile = {}, subjects = [], previousMemory = {}) {
  const lastLesson = previousMemory.lastLesson || null;
  const topicMastery = {};

  (subjects || []).forEach(subject => {
    (subject?.topics || []).forEach(topic => {
      const key = `${subject.id}_${topic.id}`;
      const progress = profile.progress?.[key] || {};
      const history = topicHistory(profile, subject.id, topic.id, topic.title);
      topicMastery[key] = {
        subjectId: subject.id,
        subject: subject.short || subject.title,
        topicId: topic.id,
        title: topic.title,
        attempts: progress.attempts || 0,
        accuracy: progress.last || progress.best || 0,
        best: progress.best || 0,
        ...calculateTopicMastery({
          accuracy: progress.last || progress.best || 0,
          attempts: progress.attempts || 0,
          studyHistory: history,
          streak: profile.streak || previousMemory.studyStreak || 0,
          lastLesson: lastLesson?.subjectId === subject.id && lastLesson?.topicId === topic.id ? lastLesson : null,
          xp: profile.xp || previousMemory.xp || 0
        })
      };
    });
  });

  return topicMastery;
}

export function summarizeMastery(topicMastery = {}) {
  const rows = Object.values(topicMastery);
  const total = rows.length;
  const statusCounts = rows.reduce((counts, row) => {
    counts[row.status] = (counts[row.status] || 0) + 1;
    return counts;
  }, {
    [MASTERY_STATUS.NOT_STARTED]: 0,
    [MASTERY_STATUS.LEARNING]: 0,
    [MASTERY_STATUS.NEEDS_PRACTICE]: 0,
    [MASTERY_STATUS.MASTERED]: 0
  });
  const masteryScore = total
    ? Math.round(rows.reduce((sum, row) => sum + (row.masteryScore || 0), 0) / total)
    : 0;

  return {
    total,
    masteryScore,
    mastered: statusCounts[MASTERY_STATUS.MASTERED] || 0,
    learning: statusCounts[MASTERY_STATUS.LEARNING] || 0,
    needsPractice: statusCounts[MASTERY_STATUS.NEEDS_PRACTICE] || 0,
    notStarted: statusCounts[MASTERY_STATUS.NOT_STARTED] || 0
  };
}
