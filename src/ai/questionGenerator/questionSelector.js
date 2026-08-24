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

function collectRecentQuestionIds(options = {}) {
  const ids = new Set();
  const add = value => {
    const id = String(value ?? '').trim();
    if (id) ids.add(id);
  };

  if (Array.isArray(options.recentQuestionIds)) {
    options.recentQuestionIds.forEach(add);
  }

  const smartState = options.smartState && typeof options.smartState === 'object' ? options.smartState : null;
  if (smartState) {
    const history = Array.isArray(smartState.history) ? smartState.history : [];
    const lastQuestions = Array.isArray(smartState.lastQuestions) ? smartState.lastQuestions : [];
    history.forEach(item => add(item?.questionId || item?.id));
    lastQuestions.forEach(item => add(item?.questionId || item?.id));
  }

  return [...ids];
}

export function selectSmartQuestions(candidates = [], options = {}) {
  const source = uniqueQuestions(candidates);
  const recentQuestionIds = collectRecentQuestionIds(options);
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
      recentQuestionIds,
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
      recentQuestionIds,
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
