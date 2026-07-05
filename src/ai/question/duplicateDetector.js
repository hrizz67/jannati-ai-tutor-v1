import { answerPattern, normalizeStem, templateSignature } from '../diversity/duplicateDetector.js';
import { getQuestionStem } from './questionRegistry.js';

export function foundationSignature(question = {}) {
  return {
    id: question.qip?.metadata?.questionId || question.id || '',
    stem: normalizeStem(getQuestionStem(question)),
    template: question.qip?.metadata?.templateId || templateSignature(question),
    topic: question.qip?.metadata?.topic || question.topicId || question.qde?.selectedTopicId || '',
    context: question.qip?.metadata?.contextGroup || question.contextGroup || question.qip?.contextVariant || '',
    answer: answerPattern(question)
  };
}

export function createDuplicateState() {
  return {
    ids: new Set(),
    stems: new Set(),
    templates: new Set(),
    contexts: new Set(),
    topics: [],
    answers: new Set()
  };
}

export function duplicateCheck(question = {}, state = createDuplicateState()) {
  const signature = foundationSignature(question);
  const reasons = [];
  if (signature.id && state.ids.has(signature.id)) reasons.push('same ID');
  if (signature.stem && state.stems.has(signature.stem)) reasons.push('same stem');
  if (signature.template && state.templates.has(signature.template)) reasons.push('same template');
  if (signature.topic && state.topics.slice(-3).every(topic => topic === signature.topic)) reasons.push('same topic');
  if (signature.context && state.contexts.has(signature.context)) reasons.push('same context');
  if (signature.answer && state.answers.has(signature.answer)) reasons.push('same answer pattern');
  return { pass: reasons.length === 0, reasons, signature };
}

export function rememberDuplicateState(question = {}, state = createDuplicateState()) {
  const signature = foundationSignature(question);
  if (signature.id) state.ids.add(signature.id);
  if (signature.stem) state.stems.add(signature.stem);
  if (signature.template) state.templates.add(signature.template);
  if (signature.context) state.contexts.add(signature.context);
  if (signature.topic) state.topics.push(signature.topic);
  if (signature.answer) state.answers.add(signature.answer);
  state.topics = state.topics.slice(-50);
  return state;
}

export function detectDuplicates(questions = []) {
  const state = createDuplicateState();
  const issues = [];
  questions.forEach((question, index) => {
    const check = duplicateCheck(question, state);
    check.reasons.forEach(reason => issues.push({ reason, index, id: check.signature.id || null }));
    rememberDuplicateState(question, state);
  });
  return issues;
}
