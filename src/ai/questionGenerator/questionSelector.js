import { buildRevisionQueue } from './revisionQueue.js';
import { buildUasaPlan } from './uasaPlanner.js';
import { sortQuestionsByPriority } from './questionPriority.js';
import { buildQuestionSignature } from './repeatGuard.js';

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
  const profile = options.profile || {};
  const revisionQueue = Array.isArray(options.revisionQueue)
    ? options.revisionQueue
    : buildRevisionQueue(profile, options);
  const sourceQuestions = options.mode === 'uasa'
    ? buildUasaPlan(candidates, { ...options, revisionQueue }).questions
    : candidates;
  const source = uniqueQuestions(sourceQuestions);
  const ranked = sortQuestionsByPriority(source, {
    ...options,
    revisionQueue
  });
  const count = Math.max(0, Number(options.count || ranked.length) || ranked.length);
  return {
    questions: count > 0 ? ranked.slice(0, count) : [],
    ranked,
    revisionQueue
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
