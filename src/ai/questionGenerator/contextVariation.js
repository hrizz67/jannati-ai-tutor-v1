function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function hashText(value = '') {
  let hash = 0;
  const text = String(value ?? '');
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash >>> 0;
}

export function createSmartQuestionSeed(parts = []) {
  return hashText((Array.isArray(parts) ? parts : [parts]).map(part => String(part ?? '')).join('|'));
}

export function getVariationSeed(question = {}, context = {}) {
  const questionId = question.id || question.questionId || '';
  const stem = question.q || question.question || '';
  const subjectId = question.subjectId || context.subjectId || context.subject?.id || '';
  const topicId = question.topicId || context.topicId || context.topic?.id || '';
  const mode = context.mode || '';
  const stateSeed = Number(context.state?.variationSeed || context.variationSeed || 0);
  const historySize = Array.isArray(context.state?.history) ? context.state.history.length : 0;
  return createSmartQuestionSeed([questionId, stem, subjectId, topicId, mode, stateSeed, historySize]);
}

export function rotateBySeed(items = [], seed = 0) {
  const list = Array.isArray(items) ? [...items] : [];
  if (list.length <= 1) return list;
  const index = Math.abs(Number(seed) || 0) % list.length;
  return [...list.slice(index), ...list.slice(0, index)];
}

export function applyContextVariation(questions = [], context = {}) {
  const list = Array.isArray(questions) ? [...questions] : [];
  if (!list.length) return [];

  const seed = Number(context.seed ?? context.state?.variationSeed ?? 0) || createSmartQuestionSeed([
    context.mode || '',
    context.subjectId || context.subject?.id || '',
    context.topicId || context.topic?.id || '',
    list.length
  ]);

  return rotateBySeed(list, seed).map((question, index) => ({
    ...question,
    smartVariation: {
      seed: getVariationSeed(question, { ...context, variationSeed: seed }),
      index
    }
  }));
}

export function normalizeVariationKey(value) {
  return normalizeText(value);
}

export default {
  applyContextVariation,
  createSmartQuestionSeed,
  getVariationSeed,
  hashText,
  normalizeVariationKey,
  rotateBySeed
};
