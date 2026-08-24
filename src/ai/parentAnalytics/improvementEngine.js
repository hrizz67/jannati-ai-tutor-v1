import { formatTopicName } from '../../utils/displayFormatter.js';

function pickTopic(source) {
  if (!source || !source.topicId) return null;
  return {
    subjectId: source.subjectId || source.subject || null,
    topicId: source.topicId,
    title: formatTopicName(source.title || source.topicId),
    mastery: Number(source.mastery) || 0,
    confidence: Number(source.confidence) || 0,
    trend: source.trend || null
  };
}

export function buildImprovement(profile = {}, context = {}) {
  const observation = context.observation || {};
  const strongest = pickTopic(observation.strongestTopic);
  const weakest = pickTopic(observation.weakestTopic);
  const improving = pickTopic(observation.improvingTopic);
  const declining = pickTopic(observation.decliningTopic);
  const memorySpeech = observation.memorySpeech || '';

  const summaryParts = [];
  if (strongest?.title) summaryParts.push(`Topik terbaik ialah ${strongest.title}.`);
  if (weakest?.title) summaryParts.push(`Topik ${weakest.title} masih perlu perhatian.`);
  if (!summaryParts.length) summaryParts.push('Belum cukup data untuk menilai perubahan topik.');

  return {
    strongestTopic: strongest,
    weakestTopic: weakest,
    improvingTopic: improving,
    decliningTopic: declining,
    memorySpeech,
    summary: summaryParts.slice(0, 2).join(' '),
    hasData: Boolean(strongest || weakest || improving || declining)
  };
}

export default {
  buildImprovement
};
