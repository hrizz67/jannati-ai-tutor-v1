import { buildQuestionSignature } from './repeatGuard.js';
import { rankAdaptiveQuestions } from '../adaptive/index.js';

function uniqueQuestions(candidates = []) {
  const seen = new Set();
  return (Array.isArray(candidates) ? candidates : []).filter(question => {
    const signature = buildQuestionSignature(question);
    if (!signature || seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

export function selectSmartQuestions(candidates = [], options = {}) {
  const source = uniqueQuestions(candidates);
  let ranked = source;
  let statistics = null;
  try {
    const adaptive = rankAdaptiveQuestions(source, options);
    if (Array.isArray(adaptive.questions) && adaptive.questions.length) {
      ranked = adaptive.questions;
    }
    statistics = adaptive.statistics || null;
  } catch {
    ranked = source;
  }
  const count = Math.max(0, Number(options.count || ranked.length) || ranked.length);
  return {
    questions: count > 0 ? ranked.slice(0, count) : [],
    ranked,
    revisionQueue: Array.isArray(options.revisionQueue)
      ? options.revisionQueue
      : Array.isArray(statistics?.revisionPlan?.subjects)
        ? statistics.revisionPlan.subjects.flatMap(subject => subject?.topics || [])
        : []
  };
}

export function selectNextSmartQuestion(candidates = [], options = {}) {
  const result = selectSmartQuestions(candidates, options);
  return result.questions[0] || null;
}

export default {
  selectNextSmartQuestion,
  selectSmartQuestions
};
