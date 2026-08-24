import { normalizeStem, numberSignature, templateSignature } from '../diversity/duplicateDetector.js';
import { contextSignature } from './contextEngine.js';

function ratio(unique, total) {
  return Math.round((unique / Math.max(total, 1)) * 100);
}

export function calculateQuestionAnalytics(questions = []) {
  const total = Math.max(questions.length, 1);
  const stems = new Set(questions.map(question => normalizeStem(question.q)).filter(Boolean));
  const templates = new Set(questions.map(templateSignature).filter(Boolean));
  const topics = new Set(questions.map(question => question.topicId || question.qde?.selectedTopicId).filter(Boolean));
  const difficulties = new Set(questions.map(question => question.difficulty || question.qde?.difficulty).filter(Boolean));
  const contexts = new Set(questions.map(contextSignature).filter(value => value && value !== 'none'));
  const numbers = new Set(questions.map(numberSignature).filter(Boolean));
  const interactionTypes = new Set(questions.map(question => question.interaction?.type || question.learningIntelligence?.questionType || question.questionType || 'textEntry').filter(Boolean));
  const responseModes = new Set(questions.map(question => question.learningIntelligence?.responseMode || (question.interaction ? 'interactive' : 'text_entry')).filter(Boolean));
  const stemDiversity = ratio(stems.size, total);
  const templateDiversity = ratio(templates.size, total);
  const topicDiversity = ratio(topics.size, total);
  const difficultyDiversity = Math.round((difficulties.size / Math.min(total, 3)) * 100);
  const contextDiversity = contexts.size ? ratio(contexts.size, total) : 100;
  const numberDiversity = numbers.size ? ratio(numbers.size, total) : 100;
  const interactionTypeDiversity = ratio(interactionTypes.size, total);
  const responseModeDiversity = ratio(responseModes.size, total);
  const overallDiversity = Math.round((stemDiversity + templateDiversity + topicDiversity + difficultyDiversity + contextDiversity + numberDiversity) / 6);
  return { stemDiversity, templateDiversity, topicDiversity, difficultyDiversity, contextDiversity, numberDiversity, interactionTypeDiversity, responseModeDiversity, overallDiversity };
}

export function summarizeBalance(questions = []) {
  const countBy = keyFn => questions.reduce((acc, question) => {
    const key = keyFn(question) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return {
    topics: countBy(question => question.topicId || question.qde?.selectedTopicId),
    difficulties: countBy(question => question.difficulty || question.qde?.difficulty),
    templates: countBy(templateSignature),
    interactionTypes: countBy(question => question.interaction?.type || question.learningIntelligence?.questionType || question.questionType || 'textEntry'),
    responseModes: countBy(question => question.learningIntelligence?.responseMode || (question.interaction ? 'interactive' : 'text_entry'))
  };
}
