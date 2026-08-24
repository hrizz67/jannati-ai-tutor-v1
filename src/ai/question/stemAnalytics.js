import { normalizeStem } from '../diversity/duplicateDetector.js';

export function calculateStemAnalytics(questions = []) {
  const stems = questions.map(question => question.qip?.selectedStem || question.q || question.question || '').filter(Boolean);
  const normalized = stems.map(normalizeStem);
  const uniqueStems = new Set(normalized).size;
  const repeatedStems = Math.max(0, normalized.length - uniqueStems);
  const averageStemDiversity = Math.round((uniqueStems / Math.max(stems.length, 1)) * 100);
  const stemReuseRate = Number(((repeatedStems / Math.max(stems.length, 1)) * 100).toFixed(2));
  return {
    uniqueStems,
    repeatedStems,
    averageStemDiversity,
    stemReuseRate
  };
}
