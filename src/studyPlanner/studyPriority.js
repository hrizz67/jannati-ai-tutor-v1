import { formatSubjectName } from '../utils/displayFormatter.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

export function getSubjectLabel(subjectId = '') {
  return formatSubjectName(subjectId) || safeText(subjectId, 'Subjek');
}

export function scoreStudyPriority(input = {}, context = {}) {
  const mastery = Math.max(0, Math.min(100, toNumber(input.mastery, 0)));
  const recommendationKey = safeText(input.recommendationKey || input.recommendation, '');
  const isOverdue = Boolean(input.isOverdue);
  const overdueDays = Math.max(0, toNumber(input.overdueDays, 0));
  const dueInDays = Math.max(0, toNumber(input.dueInDays, 0));
  const recentActivityPenalty = context.recentSubjects?.includes(input.subjectId) ? 8 : 0;

  let priorityScore = 0;
  if (isOverdue) priorityScore += 50;
  priorityScore += Math.max(0, 60 - mastery) * 0.8;
  if (mastery < 60) priorityScore += 16;
  if (recommendationKey === 'review') priorityScore += 22;
  if (recommendationKey === 'normal_practice') priorityScore += 10;
  if (recommendationKey === 'increase_difficulty') priorityScore += 4;
  if (!isOverdue && dueInDays > 0 && dueInDays <= 3) priorityScore += 12;
  if (overdueDays > 0) priorityScore += Math.min(20, overdueDays * 4);
  if (input.activityType === 'challenge') priorityScore += 3;
  if (input.activityType === 'revision') priorityScore += 12;
  if (input.activityType === 'practice') priorityScore += 8;
  priorityScore -= recentActivityPenalty;

  const priority = priorityScore >= 55 ? 'high' : priorityScore >= 25 ? 'medium' : 'low';

  return {
    ...input,
    mastery,
    recommendationKey,
    priorityScore: Math.max(0, Math.round(priorityScore)),
    priority
  };
}

export function sortStudyPriorities(items = [], context = {}) {
  return [...items]
    .map(item => scoreStudyPriority(item, context))
    .sort((left, right) => {
      if (right.priorityScore !== left.priorityScore) return right.priorityScore - left.priorityScore;
      if (right.mastery !== left.mastery) return left.mastery - right.mastery;
      if (right.overdueDays !== left.overdueDays) return right.overdueDays - left.overdueDays;
      if (right.dueInDays !== left.dueInDays) return left.dueInDays - right.dueInDays;
      return `${left.subjectId || ''}_${left.topicId || ''}`.localeCompare(`${right.subjectId || ''}_${right.topicId || ''}`);
    });
}

export function buildStudyPriorityMap(items = [], context = {}) {
  const prioritized = sortStudyPriorities(items, context);
  return prioritized.map(item => ({
    ...item,
    subjectLabel: getSubjectLabel(item.subjectId),
    topicLabel: safeText(item.topicLabel || item.title || item.topicId, 'Topik'),
    reason: safeText(item.reason, 'Perlu latihan seimbang.')
  }));
}

export default {
  getSubjectLabel,
  scoreStudyPriority,
  sortStudyPriorities,
  buildStudyPriorityMap
};
