import { applyNumberVariation } from '../diversity/numberVariationEngine.js';

export function applyNumberIntelligence(question = {}, session = {}) {
  const varied = applyNumberVariation(question, {
    subject: { id: question.subjectId },
    usedNumberSequences: session.usedNumbers || new Set(),
    sessionSeed: session.seed || Date.now(),
    index: session.index || 0
  });
  const numbers = varied.qde?.numbers || [];
  if (numbers.length) session.usedNumbers?.add(numbers.join('|'));
  return {
    ...varied,
    qip: {
      ...(varied.qip || {}),
      numberVariant: numbers.length ? numbers.join('|') : 'none',
      dskpNumberLimit: question.subjectId === 'math' ? 'Year 2 safe range' : 'not applied'
    }
  };
}
