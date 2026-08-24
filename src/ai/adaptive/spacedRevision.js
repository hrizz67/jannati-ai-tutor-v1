import { getTopicPerformance, listTrackedTopics } from './performanceTracker.js';
import { calculateMastery } from './masteryEngine.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(left, right = new Date()) {
  const leftDate = toDate(left);
  const rightDate = toDate(right);
  if (!leftDate || !rightDate) return null;
  const diff = rightDate.getTime() - leftDate.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function intervalForMastery(mastery = 0) {
  if (mastery >= 90) return 30;
  if (mastery >= 80) return 14;
  if (mastery >= 70) return 7;
  if (mastery >= 60) return 3;
  return 1;
}

export function calculateRevisionPriority(performance = {}, masteryInput = null, options = {}) {
  const mastery = clamp(toNumber(masteryInput ?? performance.mastery ?? calculateMastery(performance), 0), 0, 100);
  const attempts = toNumber(performance.attempts ?? performance.total ?? 0, 0);
  const correct = toNumber(performance.correct ?? 0, 0);
  const incorrect = toNumber(performance.incorrect ?? 0, Math.max(0, attempts - correct));
  const usedHintCount = toNumber(performance.usedHintCount ?? performance.hintsUsed ?? 0, 0);
  const usedExplainCount = toNumber(performance.usedExplainCount ?? performance.explanationsUsed ?? 0, 0);
  const averageTime = toNumber(performance.averageTime ?? performance.timeTaken ?? 0, 0);
  const lastAnsweredAt = performance.lastAnsweredAt || performance.lastPlayed || performance.updatedAt || null;
  const daysSinceLast = daysBetween(lastAnsweredAt, options.now || new Date());
  const intervalDays = intervalForMastery(mastery);
  const dueInDays = daysSinceLast === null ? intervalDays : Math.max(0, intervalDays - daysSinceLast);
  const overdueBonus = dueInDays === 0 ? 18 : dueInDays <= 1 ? 12 : dueInDays <= 3 ? 8 : 0;
  const weakBonus = mastery < 60 ? 30 : mastery < 80 ? 18 : 5;
  const errorBonus = clamp(incorrect * 4, 0, 20);
  const supportBonus = clamp((usedHintCount * 3) + (usedExplainCount * 2), 0, 15);
  const speedBonus = averageTime > 0 ? clamp(12 - Math.floor(averageTime / 20), 0, 12) : 0;
  const freshnessPenalty = daysSinceLast !== null && daysSinceLast > intervalDays * 2 ? 10 : 0;

  const priority = clamp(Math.round(
    weakBonus +
    errorBonus +
    supportBonus +
    speedBonus +
    overdueBonus -
    freshnessPenalty
  ), 0, 100);

  return {
    mastery,
    attempts,
    correct,
    incorrect,
    usedHintCount,
    usedExplainCount,
    averageTime,
    lastAnsweredAt,
    daysSinceLast,
    intervalDays,
    dueInDays,
    priority,
    reviewLevel: mastery < 60 ? 'review' : mastery <= 85 ? 'normal practice' : 'advance'
  };
}

export function buildSpacedRevisionEntry(subjectId = '', topicId = '', performance = {}, options = {}) {
  const review = calculateRevisionPriority(performance, options.mastery, options);
  const dueDate = toDate(options.now || new Date());
  if (dueDate) {
    dueDate.setDate(dueDate.getDate() + review.dueInDays);
  }
  const isOverdue = review.daysSinceLast !== null && review.daysSinceLast > review.intervalDays;

  return {
    subjectId: String(subjectId || '').trim(),
    topicId: String(topicId || '').trim(),
    mastery: review.mastery,
    priority: review.priority,
    dueInDays: review.dueInDays,
    intervalDays: review.intervalDays,
    daysSinceLast: review.daysSinceLast !== null && review.daysSinceLast !== undefined ? review.daysSinceLast : 0,
    overdueDays: isOverdue ? Math.max(0, (review.daysSinceLast || 0) - review.intervalDays) : 0,
    isOverdue,
    reviewLevel: review.reviewLevel,
    nextReviewAt: dueDate ? dueDate.toISOString() : '',
    reason:
      review.reviewLevel === 'review'
        ? 'Perlu ulang segera.'
        : review.reviewLevel === 'advance'
          ? 'Boleh naik aras atau ke topik seterusnya.'
          : 'Latihan biasa masih sesuai.'
  };
}

export function buildSpacedRevisionSchedule(profile = {}, options = {}) {
  const trackedTopics = listTrackedTopics(profile);
  const now = options.now || new Date();
  const schedule = trackedTopics
    .map(item => {
      const performance = getTopicPerformance(profile, item.subjectId, item.topicId);
      const mastery = Number.isFinite(Number(item.mastery)) ? Number(item.mastery) : calculateMastery(performance);
      return buildSpacedRevisionEntry(item.subjectId, item.topicId, performance, { ...options, mastery, now });
    })
    .filter(item => item.subjectId && item.topicId)
    .sort((left, right) => {
      if (right.priority !== left.priority) return right.priority - left.priority;
      if (left.dueInDays !== right.dueInDays) return left.dueInDays - right.dueInDays;
      if (left.mastery !== right.mastery) return left.mastery - right.mastery;
      return `${left.subjectId}_${left.topicId}`.localeCompare(`${right.subjectId}_${right.topicId}`);
    });

  return {
    generatedAt: new Date(now).toISOString(),
    schedule
  };
}

export default {
  calculateRevisionPriority,
  buildSpacedRevisionEntry,
  buildSpacedRevisionSchedule
};
