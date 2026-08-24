import { formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getTopicLabel(topic = {}) {
  return topic.title || formatTopicName(topic.topicId || topic.id || '');
}

export function getStudentStrengthSummary(topic = {}, options = {}) {
  if (!topic) {
    return {
      subjectId: null,
      topicId: null,
      title: 'Belum cukup data',
      reason: 'Belum ada topik yang benar-benar kuat lagi.',
      recommendation: 'Teruskan latihan yang seimbang.'
    };
  }

  const mastery = toNumber(topic.mastery, 0);
  const confidence = toNumber(topic.confidence, 0);
  const subjectName = formatSubjectName(topic.subjectId);
  const topicName = getTopicLabel(topic);
  const improvement = toNumber(options.improvement, 0);

  return {
    subjectId: topic.subjectId || null,
    topicId: topic.topicId || null,
    title: topicName,
    reason: mastery >= 80
      ? `Kamu sangat mahir dalam ${topicName}.`
      : `Kamu semakin baik dalam ${topicName}.`,
    recommendation: improvement > 0
      ? `Kekalkan ${subjectName} — ${topicName}.`
      : `Teruskan menguatkan ${topicName}.`,
    mastery,
    confidence,
    improvement,
    recurringSuccess: mastery >= 80 && confidence >= 70
  };
}

export default {
  getStudentStrengthSummary
};
