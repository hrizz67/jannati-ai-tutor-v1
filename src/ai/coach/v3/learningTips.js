import { getSubjectStrategy } from './subjectStrategies.js';

function toList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === null || value === undefined || value === '') return [];
  return [String(value)];
}

export function buildLearningTips({ subjectId, topicId, knowledgePack = null, context = {} } = {}) {
  const strategy = getSubjectStrategy(subjectId);
  const source = knowledgePack || {};
  const tips = [
    ...toList(source.tips),
    ...toList(source.memoryTips),
    ...toList(source.commonMistakes)
  ];

  const uniqueTips = [...new Set(tips.map(t => t.trim()).filter(Boolean))];
  const spotlight = context.mastery >= 80
    ? 'Fokus pada semakan dan ketepatan jawapan.'
    : context.mastery >= 50
      ? 'Langkah kecil membantu kamu lebih yakin.'
      : 'Baca perlahan-lahan dan ikut satu langkah pada satu masa.';

  return {
    subjectId: subjectId || null,
    topicId: topicId || null,
    subjectLabel: strategy.label,
    spotlight,
    tips: uniqueTips.slice(0, 4),
    memoryTips: toList(source.memoryTips).slice(0, 3),
    commonMistakes: toList(source.commonMistakes).slice(0, 3)
  };
}

export default {
  buildLearningTips
};
