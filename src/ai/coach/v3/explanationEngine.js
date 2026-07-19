import { getSubjectStrategy } from './subjectStrategies.js';

function toTextList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === null || value === undefined || value === '') return [];
  return [String(value)];
}

export function buildExplanation({ subjectId, topicId, knowledgePack = null, context = {} } = {}) {
  const strategy = getSubjectStrategy(subjectId);
  const source = knowledgePack || {};
  const explanations = toTextList(source.teacherExplanation);
  const simpleExplanation = String(source.simpleExplanation || source.explanation || '');
  const examples = [
    ...toTextList(source.examples),
    ...toTextList(source.extraExamples)
  ];
  const responseFocus = context.correct
    ? strategy.explanationLead
    : strategy.hintLead;

  return {
    subjectId: subjectId || null,
    topicId: topicId || null,
    subjectLabel: strategy.label,
    explanation: explanations[0] || simpleExplanation || responseFocus,
    simpleExplanation: simpleExplanation || explanations[0] || responseFocus,
    examples: examples.slice(0, 5),
    learningStep: context.correct
      ? 'Ulang konsep utama dan semak ketepatan jawapan.'
      : 'Pecahkan soalan kepada bahagian kecil dan semak petunjuk.',
    subjectVoice: responseFocus
  };
}

export default {
  buildExplanation
};
