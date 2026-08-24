import { CONTEXT_POOLS, OBJECT_GROUPS, PLACE_GROUPS } from './contextPools.js';

function textOf(question = {}) {
  return `${question.q || question.question || ''} ${question.topicTitle || ''} ${question.topic || ''}`;
}

export function hasArabicText(value = '') {
  return /[\u0600-\u06FF]/.test(String(value));
}

export function isProtectedScienceContext(question = {}) {
  const text = textOf(question).toLowerCase();
  return (question.subjectId === 'sains' || question.qip?.metadata?.subject === 'sains') &&
    /akar|daun|batang|bunga|buah|biji|air|udara|cahaya|haiwan|tumbuhan|fungsi|keperluan/.test(text);
}

export function isProtectedIslamContext(question = {}) {
  const text = textOf(question).toLowerCase();
  return (question.subjectId === 'islam' || question.qip?.metadata?.subject === 'islam') &&
    (/quran|hadis|doa|hukum|solat|wuduk|puasa|akidah|arab/.test(text) || hasArabicText(text));
}

export function isProtectedArabicContext(question = {}) {
  return question.subjectId === 'arab' || question.qip?.metadata?.subject === 'arab' || hasArabicText(textOf(question));
}

export function getContextGroupsForQuestion(question = {}) {
  if (isProtectedArabicContext(question)) return ['people_year2'];
  if (isProtectedIslamContext(question)) return ['people_year2', 'classroom', 'home'];
  if (isProtectedScienceContext(question)) return ['people_year2', 'classroom', 'garden'];

  const text = textOf(question).toLowerCase();
  const groups = ['people_year2'];
  [...OBJECT_GROUPS, ...PLACE_GROUPS].forEach(group => {
    if (CONTEXT_POOLS[group].some(item => text.includes(item.toLowerCase()))) groups.push(group);
  });
  if (groups.length === 1) groups.push('school_objects', 'classroom');
  return [...new Set(groups)];
}

export function getContextTokens(question = {}) {
  const groups = getContextGroupsForQuestion(question);
  return groups.flatMap(group => (CONTEXT_POOLS[group] || []).map(value => ({ group, value })));
}
