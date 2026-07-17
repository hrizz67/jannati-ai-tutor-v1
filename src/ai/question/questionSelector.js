import { duplicateCheck, rememberDuplicateState } from './duplicateDetector.js';
import { buildHistorySet } from './historyEngine.js';
import { rankAdaptiveQuestions } from '../adaptive/index.js';

function historyCheck(question = {}, history = buildHistorySet()) {
  const metadata = question.qip?.metadata || {};
  const stem = (question.q || question.question || '').toLowerCase();
  return {
    id: Boolean(metadata.questionId && history.questionIds.has(metadata.questionId)),
    stem: Boolean(stem && history.stems.has(stem)),
    topic: Boolean(metadata.topic && history.topics.has(metadata.topic)),
    template: Boolean(metadata.templateId && history.templates.has(metadata.templateId))
  };
}

function hasHistoryConflict(result = {}) {
  return result.id || result.stem || result.template;
}

export function selectQuestions(candidates = [], options = {}) {
  const count = Math.min(options.count || candidates.length, candidates.length);
  const history = buildHistorySet(options.memory || {});
  const duplicateState = options.duplicateState;
  let orderedCandidates = Array.isArray(candidates) ? candidates : [];
  try {
    const adaptive = rankAdaptiveQuestions(orderedCandidates, options);
    if (Array.isArray(adaptive.questions) && adaptive.questions.length) {
      orderedCandidates = adaptive.questions;
    }
  } catch {
    // Fall back to the original order when adaptive ranking is unavailable.
  }
  const selected = [];
  const rejected = [];

  for (const candidate of orderedCandidates) {
    if (selected.length >= count) break;
    const duplicate = duplicateCheck(candidate, duplicateState);
    const historyResult = historyCheck(candidate, history);
    const conflict = duplicate.reasons.length || hasHistoryConflict(historyResult);
    if (!conflict || orderedCandidates.length <= count) {
      selected.push({
        ...candidate,
        qip: {
          ...(candidate.qip || {}),
          reasonSelected: conflict ? 'Question bank exhausted fallback' : 'QIP foundation selector accepted',
          duplicateCheck: duplicate.reasons.length ? duplicate.reasons : ['pass'],
          historyCheck: historyResult
        }
      });
      rememberDuplicateState(candidate, duplicateState);
    } else {
      rejected.push({
        id: candidate.id || candidate.qip?.metadata?.questionId || '',
        duplicate: duplicate.reasons,
        history: historyResult
      });
    }
  }

  return { questions: selected, rejected };
}
