import { getSubjectStrategy } from './subjectStrategies.js';

function toTextList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === null || value === undefined || value === '') return [];
  return [String(value)];
}

export function buildHint({ subjectId, topicId, knowledgePack = null, context = {} } = {}) {
  const strategy = getSubjectStrategy(subjectId);
  const source = knowledgePack || {};
  const fallbackHints = [
    ...toTextList(source.tips),
    ...toTextList(source.memoryTips),
    ...toTextList(source.commonMistakes)
  ];
  const mastery = Number(context.mastery || 0);

  return {
    subjectId: subjectId || null,
    topicId: topicId || null,
    subjectLabel: strategy.label,
    hint: fallbackHints[0] || strategy.hintLead,
    hintLevel: mastery >= 80 ? 1 : mastery >= 50 ? 2 : 3,
    nudges: fallbackHints.slice(0, 3)
  };
}

export default {
  buildHint
};
