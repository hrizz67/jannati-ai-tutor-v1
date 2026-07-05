import { getQuestionStem } from './questionRegistry.js';

function uniqueRatio(values = [], total = values.length) {
  return Math.round((new Set(values.filter(Boolean)).size / Math.max(total, 1)) * 100);
}

export function calculateDiversityScore(questions = []) {
  const total = Math.max(questions.length, 1);
  const stems = questions.map(getQuestionStem);
  const topics = questions.map(question => question.qip?.metadata?.topic || question.topicId || question.qde?.selectedTopicId || '');
  const difficulties = questions.map(question => question.qip?.metadata?.difficulty || question.difficulty || question.qde?.difficulty || '');
  const contexts = questions.map(question => question.qip?.metadata?.contextGroup || question.contextGroup || '');
  const templates = questions.map(question => question.qip?.metadata?.templateId || question.templateId || question.qde?.templateId || question.id || '');

  const topicDiversity = uniqueRatio(topics, total);
  const stemDiversity = uniqueRatio(stems, total);
  const difficultyDiversity = Math.round((new Set(difficulties.filter(Boolean)).size / Math.min(total, 3)) * 100);
  const contextDiversity = contexts.some(Boolean) ? uniqueRatio(contexts, total) : 100;
  const templateDiversity = uniqueRatio(templates, total);
  const overallDiversity = Math.round((topicDiversity + stemDiversity + difficultyDiversity + contextDiversity + templateDiversity) / 5);

  return {
    topicDiversity,
    stemDiversity,
    difficultyDiversity,
    contextDiversity,
    templateDiversity,
    overallDiversity,
    sessionDiversity: overallDiversity
  };
}
