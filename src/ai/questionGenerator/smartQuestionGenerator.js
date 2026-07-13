import { createSmartQuestionSeed } from './contextVariation.js';
import { selectSmartQuestions } from './questionSelector.js';
import {
  loadSmartQuestionState,
  migrateSmartQuestionState,
  recordSmartQuestionState,
  resetSmartQuestionState,
  SMART_QUESTION_HISTORY_LIMIT,
  SMART_QUESTION_STORAGE_KEY,
  SMART_QUESTION_VERSION
} from './questionHistory.js';
import { formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';

export function buildSmartQuestionDecision(candidates = [], options = {}) {
  const state = migrateSmartQuestionState(options.smartState || loadSmartQuestionState());
  const selection = selectSmartQuestions(candidates, {
    ...options,
    smartState: state
  });
  const questions = selection.questions || [];
  const selectedQuestion = questions[0] || null;
  const smartMeta = selectedQuestion?.smartQuestion || {};
  const topicId = selectedQuestion?.topicId || options.topicId || options.topic?.id || '';
  const subjectId = selectedQuestion?.subjectId || options.subjectId || options.subject?.id || '';
  const topicName = selectedQuestion?.topicTitle || options.topic?.title || formatTopicName(topicId);
  const subjectName = selectedQuestion?.subjectTitle || options.subject?.title || formatSubjectName(subjectId);

  return {
    question: selectedQuestion,
    topic: selectedQuestion
      ? {
        subjectId,
        subjectName,
        topicId,
        topicName,
        title: topicName
      }
      : null,
    difficulty: smartMeta.recommendedDifficulty || selectedQuestion?.difficulty || 'sederhana',
    revisionPriority: smartMeta.revisionPriority || 0,
    repeatScore: smartMeta.repeatScore || 0,
    variationSeed: smartMeta.variationSeed || createSmartQuestionSeed([subjectId, topicId, questions.length, state.variationSeed || 0]),
    selectionReason: smartMeta.selectionReason || 'Latihan dipilih secara seimbang.',
    uasaWeight: smartMeta.uasaWeight || 0,
    questions,
    revisionQueue: selection.revisionQueue || [],
    ranked: selection.ranked || questions,
    state
  };
}

export function buildSmartQuestionSession(candidates = [], options = {}) {
  return buildSmartQuestionDecision(candidates, options);
}

export function persistSmartQuestionDecision(state = loadSmartQuestionState(), decision = {}, context = {}) {
  return recordSmartQuestionState(state, decision, context);
}

export {
  SMART_QUESTION_HISTORY_LIMIT,
  SMART_QUESTION_STORAGE_KEY,
  SMART_QUESTION_VERSION,
  loadSmartQuestionState,
  migrateSmartQuestionState,
  recordSmartQuestionState,
  resetSmartQuestionState,
  createSmartQuestionSeed
};

export default {
  buildSmartQuestionDecision,
  buildSmartQuestionSession,
  persistSmartQuestionDecision,
  loadSmartQuestionState,
  recordSmartQuestionState,
  resetSmartQuestionState
};
