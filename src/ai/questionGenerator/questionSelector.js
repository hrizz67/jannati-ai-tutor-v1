import { buildQuestionSignature } from './repeatGuard.js';
import { rankAdaptiveQuestions } from '../adaptive/index.js';
import { rankQuestionQuality, selectQualityQuestions } from '../questionQuality/index.js';

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
  try {
    const qualityRanked = rankQuestionQuality(ranked, {
      ...options,
      recentQuestionIds: Array.isArray(options.recentQuestionIds) ? options.recentQuestionIds : [],
      recentTemplates: Array.isArray(options.recentTemplates) ? options.recentTemplates : [],
      recentStyles: Array.isArray(options.recentStyles) ? options.recentStyles : []
    });
    if (Array.isArray(qualityRanked) && qualityRanked.length) {
      ranked = qualityRanked;
    }
  } catch {
    // Keep adaptive ranking if the quality layer is unavailable.
  }
  let qualitySelection = { questions: ranked, ranked, rejected: [], warnings: [], fallbackUsed: false };
  try {
    qualitySelection = selectQualityQuestions(ranked, {
      ...options,
      count: Math.max(0, Number(options.count || ranked.length) || ranked.length),
      recentQuestionIds: Array.isArray(options.recentQuestionIds) ? options.recentQuestionIds : [],
      recentTemplates: Array.isArray(options.recentTemplates) ? options.recentTemplates : [],
      recentStyles: Array.isArray(options.recentStyles) ? options.recentStyles : []
    });
  } catch {
    // Fall back to the quality-ranked list.
  }
  const count = Math.max(0, Number(options.count || ranked.length) || ranked.length);
  return {
    questions: count > 0 ? qualitySelection.questions.slice(0, count) : [],
    ranked: qualitySelection.ranked || ranked,
    revisionQueue: Array.isArray(options.revisionQueue)
      ? options.revisionQueue
      : Array.isArray(statistics?.revisionPlan?.subjects)
        ? statistics.revisionPlan.subjects.flatMap(subject => subject?.topics || [])
        : [],
    quality: {
      rejected: qualitySelection.rejected || [],
      warnings: qualitySelection.warnings || [],
      fallbackUsed: Boolean(qualitySelection.fallbackUsed)
    }
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
