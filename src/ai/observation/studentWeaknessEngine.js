import { formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getTopicLabel(topic = {}) {
  return topic.title || formatTopicName(topic.topicId || topic.id || '');
}

export function getStudentWeaknessSummary(topic = {}, options = {}) {
  if (!topic) {
    return {
      subjectId: null,
      topicId: null,
      title: 'Belum cukup data',
      reason: 'Belum cukup data untuk mengenal pasti topik yang lemah.',
      recommendation: 'Teruskan latihan sedikit demi sedikit.'
    };
  }

  const wrongCount = toNumber(topic.wrongCount, 0);
  const mastery = toNumber(topic.mastery, 0);
  const confidence = toNumber(topic.confidence, 0);
  const subjectName = formatSubjectName(topic.subjectId);
  const topicName = getTopicLabel(topic);

  return {
    subjectId: topic.subjectId || null,
    topicId: topic.topicId || null,
    title: topicName,
    reason: wrongCount >= 3
      ? `Kamu selalu keliru tentang ${topicName}.`
      : mastery < 50
        ? `Kamu masih perlukan latihan untuk ${topicName}.`
        : `Topik ${topicName} masih boleh diperkukuh.`,
    recommendation: `Fokus pada ${subjectName} — ${topicName}.`,
    mastery,
    confidence,
    wrongCount,
    recurringMistake: wrongCount >= 2
  };
}

export default {
  getStudentWeaknessSummary
};
