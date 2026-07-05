import { OBJECT_GROUPS, PLACE_GROUPS } from './contextPools.js';

function uniqueRatio(values = []) {
  return Math.round((new Set(values.filter(Boolean)).size / Math.max(values.filter(Boolean).length, 1)) * 100);
}

export function calculateContextAnalytics(questions = []) {
  const contexts = questions.map(question => question.qip?.contextVariant).filter(value => value && value !== 'legacy');
  const names = questions.filter(question => question.qip?.contextGroup === 'people_year2').map(question => question.qip?.contextVariant);
  const objects = questions.filter(question => OBJECT_GROUPS.includes(question.qip?.contextGroup)).map(question => question.qip?.contextVariant);
  const places = questions.filter(question => PLACE_GROUPS.includes(question.qip?.contextGroup)).map(question => question.qip?.contextVariant);
  const repeated = contexts.length - new Set(contexts).size;
  const contextDiversity = contexts.length ? uniqueRatio(contexts) : 100;
  const nameDiversity = names.length ? uniqueRatio(names) : 100;
  const objectDiversity = objects.length ? uniqueRatio(objects) : 100;
  const placeDiversity = places.length ? uniqueRatio(places) : 100;
  const reuseRate = Number(((Math.max(0, repeated) / Math.max(contexts.length, 1)) * 100).toFixed(2));
  const overallContextScore = Math.round((contextDiversity + nameDiversity + objectDiversity + placeDiversity + (100 - reuseRate)) / 5);
  return { contextDiversity, nameDiversity, objectDiversity, placeDiversity, reuseRate, overallContextScore };
}
