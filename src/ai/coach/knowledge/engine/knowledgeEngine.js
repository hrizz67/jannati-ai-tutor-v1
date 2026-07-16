import { loadKnowledge } from '../loader/knowledgeLoader.js';
import { listKnowledgeSubjects, listKnowledgeTopics, KNOWLEDGE_REGISTRY } from '../registry/knowledgeRegistry.js';

export function getKnowledgePack(subjectId, topicId) {
  return loadKnowledge(subjectId, topicId);
}

export function getKnowledgeSummary(subjectId, topicId) {
  const pack = loadKnowledge(subjectId, topicId);
  return {
    subjectId: pack.subjectId,
    topicId: pack.topicId,
    explanationCount: pack.explanations.length,
    exampleCount: pack.examples.length,
    memoryTipCount: pack.memoryTips.length,
    tipCount: pack.tips.length,
    mistakeCount: pack.commonMistakes.length,
    encouragementCount: Object.values(pack.encouragement).reduce((sum, list) => sum + list.length, 0)
  };
}

export function getAvailableKnowledgeSubjects() {
  return listKnowledgeSubjects();
}

export function getAvailableKnowledgeTopics(subjectId) {
  return listKnowledgeTopics(subjectId);
}

export function getKnowledgeRegistry() {
  return KNOWLEDGE_REGISTRY;
}

export default {
  getKnowledgePack,
  getKnowledgeSummary,
  getAvailableKnowledgeSubjects,
  getAvailableKnowledgeTopics,
  getKnowledgeRegistry
};
