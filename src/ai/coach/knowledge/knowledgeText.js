import { sanitizeAiText } from '../../learningCopy.js';

const FIELD_PRIORITY = {
  math: ['workedExamples', 'problemSolvingSteps', 'examples', 'extraExamples'],
  sains: ['scientificFacts', 'whyQuestions', 'predictionQuestions', 'comparisonQuestions', 'realLifeApplications', 'investigationIdeas', 'observationPrompts', 'examples', 'extraExamples'],
  arab: ['pronunciationGuide', 'readingSteps', 'letterBreakdown', 'listeningTips', 'pronunciationTips', 'readingPractice', 'speakingPractice', 'writingPractice', 'examples', 'extraExamples'],
  english: ['wordMeaning', 'exampleSentences', 'examples', 'extraExamples'],
  islam: ['dailyPractice', 'adabApplications', 'realLifeExamples', 'examples', 'extraExamples'],
  pj: ['movementSteps', 'warmUpIdeas', 'fitnessActivities', 'gameApplications', 'dailyMovementIdeas', 'examples', 'extraExamples'],
  pk: ['healthyHabits', 'dailyPractice', 'hygieneSteps', 'nutritionTips', 'realLifeScenarios', 'bodyCare', 'examples', 'extraExamples'],
  default: ['examples', 'extraExamples']
};

const lastSelectionMap = new Map();

export function asKnowledgeArray(value) {
  return Array.isArray(value) ? value.filter(item => item !== null && item !== undefined && item !== '') : [];
}

export function toKnowledgeText(value) {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = sanitizeAiText(String(value));
    return text ? [text] : [];
  }
  if (Array.isArray(value)) return value.flatMap(toKnowledgeText).filter(Boolean);
  if (typeof value === 'object') {
    if (Array.isArray(value.steps) && value.steps.length) {
      const stepText = value.steps.flatMap(toKnowledgeText).filter(Boolean).join(' • ');
      const parts = [
        value.prompt || value.question || value.title || value.label || '',
        stepText,
        value.answer ? `Jawapan: ${value.answer}` : ''
      ].map(item => sanitizeAiText(String(item || '').trim())).filter(Boolean);
      if (parts.length) return [parts.join(' — ')];
    }
    const candidates = [value.prompt, value.question, value.title, value.label, value.term, value.word, value.answer, value.example, value.text, value.description];
    const direct = candidates.map(item => sanitizeAiText(String(item || '').trim())).find(Boolean);
    return direct ? [direct] : Object.values(value).flatMap(toKnowledgeText).filter(Boolean);
  }
  const text = sanitizeAiText(String(value));
  return text ? [text] : [];
}

export function dedupeKnowledgeText(items = []) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const text = sanitizeAiText(String(item || '').trim());
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

export function rotateKnowledgeList(items = [], key = '') {
  const list = asKnowledgeArray(items);
  if (list.length <= 1) return list.slice();
  const state = lastSelectionMap.get(key) || { index: 0, last: '' };
  const start = state.index % list.length;
  const rotated = list.slice(start).concat(list.slice(0, start));
  lastSelectionMap.set(key, {
    index: (start + 1) % list.length,
    last: sanitizeAiText(String(rotated[0] || '').trim())
  });
  return rotated;
}

export function selectKnowledgeText(items = [], key = '') {
  return rotateKnowledgeList(items, key)[0] || '';
}

export function collectPrioritizedKnowledgeText(pack, subjectId) {
  if (!pack) return [];
  const values = [];
  for (const field of FIELD_PRIORITY[subjectId] || FIELD_PRIORITY.default) values.push(...toKnowledgeText(pack[field]));
  if (!values.length) values.push(...toKnowledgeText(pack.examples));
  if (!values.length) values.push(...toKnowledgeText(pack.extraExamples));
  return dedupeKnowledgeText(values);
}
