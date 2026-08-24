import { rankWeakTopics } from '../adaptive/weakTopicEngine.js';
import { formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function topicKey(subjectId, topicId) {
  return `${subjectId}::${topicId}`;
}

export function getRevisionPriority(item = {}) {
  return clamp(toNumber(item.priority, 0), 0, 100);
}

export function buildRevisionQueue(profile = {}, options = {}) {
  const limit = Math.max(1, toNumber(options.limit, 12));
  const weakTopics = rankWeakTopics(profile, {
    includeLowConfidence: true,
    limit: options.weakLimit || limit
  });
  const focusSubject = options.subjectId || null;
  const focusTopic = options.topicId || null;
  const observation = options.observation || {};
  const parentAnalytics = options.parentAnalytics || {};
  const readiness = options.readiness || {};
  const trendDirection = parentAnalytics?.weeklyTrend?.trend?.direction || parentAnalytics?.weeklyTrend?.trend || '';
  const decliningTrend = String(trendDirection || '').toLowerCase() === 'declining';

  const queue = weakTopics.map((topic, index) => {
    const isFocused = (focusSubject && topic.subjectId === focusSubject) || (focusTopic && topic.topicId === focusTopic);
    const observationMatch = observation?.weakestTopic?.topicId === topic.topicId && observation?.weakestTopic?.subjectId === topic.subjectId;
    const readinessBoost = readiness?.level === 'needs_support' ? 8 : readiness?.level === 'developing' ? 4 : 0;
    const trendBoost = decliningTrend ? 5 : 0;
    const priority = clamp(
      topic.priority +
      (observationMatch ? 12 : 0) +
      (isFocused ? 10 : 0) +
      readinessBoost +
      trendBoost -
      Math.min(index, 5),
      0,
      100
    );

    return {
      key: topicKey(topic.subjectId, topic.topicId),
      subjectId: topic.subjectId,
      subjectName: formatSubjectName(topic.subjectId),
      topicId: topic.topicId,
      topicName: formatTopicName(topic.topicId),
      title: topic.title || formatTopicName(topic.topicId),
      priority,
      status: topic.status,
      mastery: topic.mastery,
      confidence: topic.confidence,
      attempts: topic.attempts,
      reason: topic.status === 'needs_more_evidence'
        ? 'Belum cukup data'
        : topic.status === 'critical'
          ? 'Perlu perhatian segera'
          : topic.status === 'weak'
            ? 'Topik lemah'
            : 'Topik berkembang'
    };
  });

  queue.sort((a, b) => b.priority - a.priority || a.subjectId.localeCompare(b.subjectId) || a.topicId.localeCompare(b.topicId));

  return queue.slice(0, limit);
}

export function summarizeRevisionQueue(queue = []) {
  const items = Array.isArray(queue) ? queue : [];
  return {
    total: items.length,
    highPriority: items.filter(item => getRevisionPriority(item) >= 70),
    mediumPriority: items.filter(item => getRevisionPriority(item) >= 40 && getRevisionPriority(item) < 70),
    lowPriority: items.filter(item => getRevisionPriority(item) < 40)
  };
}

export default {
  buildRevisionQueue,
  getRevisionPriority,
  summarizeRevisionQueue
};
