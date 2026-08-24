function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

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

function startOfLocalDay(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a, b) {
  const startA = startOfLocalDay(a);
  const startB = startOfLocalDay(b);
  if (!startA || !startB) return 0;
  return Math.round((startB.getTime() - startA.getTime()) / 86400000);
}

function getProfileTopics(profile = {}) {
  const subjects = profile.topics && typeof profile.topics === 'object' ? profile.topics : {};
  return Object.entries(subjects).flatMap(([subjectId, subjectTopics]) => {
    if (!subjectTopics || typeof subjectTopics !== 'object') return [];
    return Object.entries(subjectTopics).map(([topicId, record]) => ({
      subjectId,
      topicId,
      record: record && typeof record === 'object' ? { ...record } : {}
    }));
  });
}

function getBaseIntervalDays(topicRecord = {}) {
  const mastery = clamp(toNumber(topicRecord.mastery, 0), 0, 100);
  const confidence = clamp(toNumber(topicRecord.confidence, 0), 0, 100);

  if (mastery > 95 && confidence > 90) return 30;
  if (mastery > 80) return 14;
  if (mastery >= 60) return 7;
  if (mastery >= 40) return 3;
  return 1;
}

function getAdjustmentFactor(topicRecord = {}) {
  const confidence = clamp(toNumber(topicRecord.confidence, 0), 0, 100);
  const wrong = Math.max(0, toNumber(topicRecord.wrong, 0));
  const total = Math.max(0, toNumber(topicRecord.total, 0));
  const recentMistakePenalty = daysBetween(topicRecord.lastPlayed || topicRecord.lastReviewed || null, new Date()) <= 2 ? 0.75 : 1;
  const lowConfidenceFactor = confidence < 40 ? 0.7 : confidence < 60 ? 0.85 : confidence > 90 ? 1.2 : 1;
  const wrongFactor = wrong >= Math.ceil(Math.max(1, total) / 2) ? 0.75 : wrong > 0 ? 0.9 : 1;
  return clamp(lowConfidenceFactor * wrongFactor * recentMistakePenalty, 0.35, 1.35);
}

function getReviewDate(topicRecord = {}, referenceDate = new Date()) {
  const baseDays = getBaseIntervalDays(topicRecord);
  const factor = getAdjustmentFactor(topicRecord);
  const adjustedDays = Math.max(1, Math.round(baseDays * factor));
  const reviewedAt = topicRecord.lastReviewed || topicRecord.lastPlayed || referenceDate;
  const next = new Date(reviewedAt);
  if (Number.isNaN(next.getTime())) {
    return localDateKey(referenceDate);
  }
  next.setDate(next.getDate() + adjustedDays);
  return localDateKey(next);
}

function normalizeTopicRecord(topicRecord = {}) {
  const record = topicRecord && typeof topicRecord === 'object' ? { ...topicRecord } : {};
  const nextReview = record.nextReview || getReviewDate(record);
  const lastReviewed = record.lastReviewed || record.lastPlayed || null;
  const priority = getReviewPriority(record);
  const dueToday = isDueForReview({ ...record, nextReview });
  const overdueDays = nextReview ? daysBetween(nextReview, localDateKey()) : 0;

  return {
    ...record,
    nextReview,
    lastReviewed,
    priority,
    dueToday,
    overdueDays: overdueDays > 0 ? overdueDays : 0
  };
}

export function calculateNextReview(topicRecord = {}) {
  return getReviewDate(topicRecord);
}

export function isDueForReview(topicRecord = {}, today = new Date()) {
  const normalizedToday = localDateKey(today);
  const nextReview = topicRecord?.nextReview || calculateNextReview(topicRecord);
  return String(nextReview) <= String(normalizedToday);
}

export function getReviewPriority(topicRecord = {}) {
  const mastery = clamp(toNumber(topicRecord.mastery, 0), 0, 100);
  const confidence = clamp(toNumber(topicRecord.confidence, 0), 0, 100);
  const wrong = Math.max(0, toNumber(topicRecord.wrong, 0));
  const total = Math.max(0, toNumber(topicRecord.total, 0));
  const nextReview = topicRecord?.nextReview || calculateNextReview(topicRecord);
  const daysToReview = daysBetween(localDateKey(), nextReview);
  const recentMistake = daysBetween(topicRecord.lastPlayed || topicRecord.lastReviewed || null, new Date()) <= 2;
  const overduePenalty = daysToReview < 0 ? Math.min(30, Math.abs(daysToReview) * 8) : 0;
  const dueBoost = daysToReview <= 0 ? 30 : daysToReview <= 2 ? 18 : daysToReview <= 5 ? 10 : 0;

  if (mastery < 40) return 'critical';
  if (mastery < 60 || confidence < 60 || wrong > 0 && recentMistake) return dueBoost > 0 ? 'high' : 'medium';
  if (mastery < 80) return dueBoost > 0 ? 'high' : 'medium';
  if (mastery > 95 && confidence > 90 && total >= 5) return daysToReview <= 0 ? 'medium' : 'low';
  if (overduePenalty > 0) return 'high';
  return dueBoost > 0 ? 'medium' : 'low';
}

function buildTopicQueue(profile = {}) {
  return getProfileTopics(profile).map(entry => {
    const normalized = normalizeTopicRecord(entry.record);
    return {
      subjectId: entry.subjectId,
      topicId: entry.topicId,
      ...normalized
    };
  });
}

function sortQueue(topics = []) {
  const order = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...topics].sort((a, b) => {
    if (order[b.priority] !== order[a.priority]) return order[b.priority] - order[a.priority];
    if (a.overdueDays !== b.overdueDays) return b.overdueDays - a.overdueDays;
    if (a.nextReview !== b.nextReview) return String(a.nextReview).localeCompare(String(b.nextReview));
    if (b.mastery !== a.mastery) return a.mastery - b.mastery;
    return `${a.subjectId}_${a.topicId}`.localeCompare(`${b.subjectId}_${b.topicId}`);
  });
}

export function buildReviewSchedule(profile = {}) {
  const topics = buildTopicQueue(profile);
  return sortQueue(topics);
}

function bucketByDueDate(topics = [], today = localDateKey()) {
  return topics.reduce((acc, topic) => {
    const nextReview = topic.nextReview || calculateNextReview(topic);
    const bucket = String(nextReview) < String(today)
      ? 'overdueTopics'
      : String(nextReview) === String(today)
        ? 'dueTopics'
        : 'upcomingTopics';
    acc[bucket].push(topic);
    return acc;
  }, {
    dueTopics: [],
    upcomingTopics: [],
    overdueTopics: []
  });
}

export function getReviewQueue(profile = {}) {
  const generatedAt = new Date().toISOString();
  const today = localDateKey();
  const schedule = buildReviewSchedule(profile);
  const buckets = bucketByDueDate(schedule, today);
  const dueTopics = sortQueue(buckets.dueTopics);
  const overdueTopics = sortQueue(buckets.overdueTopics);
  const upcomingTopics = sortQueue(buckets.upcomingTopics);
  const summary = dueTopics.length
    ? `${dueTopics.length} topik perlu ulang kaji hari ini.`
    : 'Tiada ulang kaji diperlukan hari ini.';

  return {
    generatedAt,
    today,
    dueTopics,
    upcomingTopics,
    overdueTopics,
    summary
  };
}

export default {
  buildReviewSchedule,
  calculateNextReview,
  getReviewPriority,
  getReviewQueue,
  isDueForReview
};
