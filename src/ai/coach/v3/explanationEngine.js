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

  const questionText = String(context.questionText || '').trim();
  const expectedAnswer = String(context.expectedAnswer || '').trim();
  const subjectFocus = subjectId === 'math' && questionText
    ? ` Soalan semasa menggunakan nombor dan operasi ini: ${questionText}${expectedAnswer ? ` Jawapan perlu disemak dengan ${expectedAnswer}.` : ''}`
    : subjectId === 'sains' && questionText
      ? ` Perhatikan konsep sains dalam soalan semasa: ${questionText}`
      : subjectId === 'arab' && questionText
        ? ` Kekalkan tulisan dan bunyi Arab daripada soalan ini: ${questionText}`
        : subjectId === 'english' && questionText
          ? ` Gunakan perkataan atau ayat Inggeris dalam soalan ini: ${questionText}`
          : '';
  const contextualExplanation = `${explanation}${subjectFocus}`.trim();
  return {
    subjectId: subjectId || null,
    topicId: topicId || null,
    subjectLabel: strategy.label,
    explanation: contextualExplanation,
    simpleExplanation: `${simpleExplanation || explanations[0] || responseFocus}${subjectFocus}`.trim(),
    examples: examples.slice(0, 5),
    learningStep: subjectId === 'math' && questionText
      ? `Tulis semula ${questionText} dan kira satu langkah pada satu masa.`
      : context.correct
        ? 'Ulang konsep utama dan semak ketepatan jawapan.'
        : 'Pecahkan soalan kepada bahagian kecil dan semak petunjuk.',
    subjectVoice: responseFocus
  };
}

export default {
  buildExplanation
};
