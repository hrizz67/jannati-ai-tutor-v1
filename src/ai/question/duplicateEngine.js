import { numberSignature, questionSignature, templateSignature } from '../diversity/duplicateDetector.js';
import { contextSignature } from './contextEngine.js';
import { answerPositionSignature, distractorSignature } from './distractorEngine.js';

export function questionIntelligenceSignature(question = {}) {
  const base = questionSignature(question);
  return {
    ...base,
    template: templateSignature(question),
    context: contextSignature(question),
    numbers: numberSignature(question),
    distractors: distractorSignature(question),
    answerPosition: answerPositionSignature(question)
  };
}

export function createIntelligenceSeen() {
  return {
    ids: new Set(),
    stems: new Set(),
    templates: new Set(),
    contexts: new Set(),
    numbers: new Set(),
    distractors: new Set(),
    answerPositions: new Set()
  };
}

export function addIntelligenceSeen(seen, question = {}) {
  const signature = questionIntelligenceSignature(question);
  if (signature.id) seen.ids.add(signature.id);
  if (signature.stem) seen.stems.add(signature.stem);
  if (signature.template) seen.templates.add(signature.template);
  if (signature.context && signature.context !== 'none') seen.contexts.add(signature.context);
  if (signature.numbers) seen.numbers.add(signature.numbers);
  if (signature.distractors) seen.distractors.add(signature.distractors);
  if (signature.answerPosition) seen.answerPositions.add(signature.answerPosition);
  return seen;
}

export function intelligenceDuplicateReasons(question = {}, seen = createIntelligenceSeen()) {
  const signature = questionIntelligenceSignature(question);
  return [
    ['id', signature.id, seen.ids],
    ['stem', signature.stem, seen.stems],
    ['template', signature.template, seen.templates],
    ['context', signature.context && signature.context !== 'none' ? signature.context : '', seen.contexts],
    ['numbers', signature.numbers, seen.numbers],
    ['distractors', signature.distractors, seen.distractors],
    ['answerPosition', signature.answerPosition, seen.answerPositions]
  ].filter(([, key, set]) => key && set.has(key)).map(([kind]) => kind);
}

export function detectIntelligenceDuplicates(questions = []) {
  const seen = createIntelligenceSeen();
  const issues = [];
  questions.forEach((question, index) => {
    const reasons = intelligenceDuplicateReasons(question, seen);
    reasons.forEach(reason => issues.push({ reason, index, id: question.id || null }));
    addIntelligenceSeen(seen, question);
  });
  return issues;
}
