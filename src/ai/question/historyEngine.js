import { foundationSignature } from './duplicateDetector.js';

const QUESTION_LIMIT = 100;
const STEM_LIMIT = 30;
const TOPIC_LIMIT = 50;
const TEMPLATE_LIMIT = 30;
const CONTEXT_LIMIT = 50;
const NAME_LIMIT = 30;
const OBJECT_LIMIT = 30;

export function getQuestionIntelligenceHistory(memory = {}) {
  return {
    questions: (memory.questionHistory || memory.qipHistory?.questions || []).slice(0, QUESTION_LIMIT),
    stems: (memory.qipHistory?.stems || []).slice(0, STEM_LIMIT),
    topics: (memory.qipHistory?.topics || []).slice(0, TOPIC_LIMIT),
    templates: (memory.qipHistory?.templates || []).slice(0, TEMPLATE_LIMIT),
    contexts: (memory.qipHistory?.contexts || []).slice(0, CONTEXT_LIMIT),
    names: (memory.qipHistory?.names || []).slice(0, NAME_LIMIT),
    objects: (memory.qipHistory?.objects || []).slice(0, OBJECT_LIMIT)
  };
}

export function buildHistorySet(memory = {}) {
  const history = getQuestionIntelligenceHistory(memory);
  return {
    questionIds: new Set(history.questions.map(item => item.questionId || item.id).filter(Boolean)),
    questions: new Set(history.questions.map(item => item.signature || item.questionId || item.id).filter(Boolean)),
    stems: new Set(history.stems.map(item => item.signature || item.stem).filter(Boolean)),
    topics: new Set(history.topics.map(item => item.signature || item.topic).filter(Boolean)),
    templates: new Set(history.templates.map(item => item.signature || item.templateId).filter(Boolean)),
    contexts: new Set(history.contexts.map(item => item.signature || item.value || item.context).filter(Boolean)),
    names: new Set(history.names.map(item => item.signature || item.value || item.name).filter(Boolean)),
    objects: new Set(history.objects.map(item => item.signature || item.value || item.object).filter(Boolean))
  };
}

export const buildQuestionHistorySet = buildHistorySet;

export function rememberQuestionIntelligenceHistory(memory = {}, questions = []) {
  const rows = questions.map(question => {
    const signature = foundationSignature(question);
    return {
      questionId: signature.id,
      id: signature.id,
      stem: question.q || '',
      templateId: signature.template,
      topic: signature.topic,
      signature: `${signature.id}:${signature.stem}:${signature.template}:${signature.topic}`,
      date: new Date().toISOString()
    };
  });
  const stems = rows.map(row => ({ stem: row.stem, signature: row.stem.toLowerCase(), date: row.date }));
  const topics = rows.map(row => ({ topic: row.topic, signature: row.topic, date: row.date }));
  const templates = rows.map(row => ({ templateId: row.templateId, signature: row.templateId, date: row.date }));
  const contexts = questions
    .map(question => ({ value: question.qip?.contextVariant || '', context: question.qip?.selectedContext || '', signature: question.qip?.contextVariant || '', date: new Date().toISOString() }))
    .filter(row => row.value && row.value !== 'legacy');
  const names = contexts.filter(row => row.value.includes('->') && /ali|aiman|amir|hakim|adam|sara|siti|aina|nurul|hana/i.test(row.value));
  const objects = contexts.filter(row => row.value.includes('->') && !names.includes(row));
  const previous = getQuestionIntelligenceHistory(memory);
  return {
    ...memory,
    qipHistory: {
      questions: [...rows, ...previous.questions].slice(0, QUESTION_LIMIT),
      stems: [...stems, ...previous.stems].slice(0, STEM_LIMIT),
      topics: [...topics, ...previous.topics].slice(0, TOPIC_LIMIT),
      templates: [...templates, ...previous.templates].slice(0, TEMPLATE_LIMIT),
      contexts: [...contexts, ...previous.contexts].slice(0, CONTEXT_LIMIT),
      names: [...names, ...previous.names].slice(0, NAME_LIMIT),
      objects: [...objects, ...previous.objects].slice(0, OBJECT_LIMIT)
    },
    questionHistory: [...rows, ...(memory.questionHistory || [])].slice(0, QUESTION_LIMIT)
  };
}
