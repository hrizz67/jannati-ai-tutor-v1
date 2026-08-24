import { loadKnowledge, peekKnowledge } from '../loader/knowledgeLoader.js';

export async function getKnowledgePack(subjectId, topicId) {
  return loadKnowledge(subjectId, topicId);
}

export async function getKnowledgeSummary(subjectId, topicId) {
  const pack = await loadKnowledge(subjectId, topicId);
  return {
    subjectId: pack.subjectId,
    topicId: pack.topicId,
    explanationCount: Array.isArray(pack.explanations) ? pack.explanations.length : 0,
    exampleCount: Array.isArray(pack.examples) ? pack.examples.length : 0,
    memoryTipCount: Array.isArray(pack.memoryTips) ? pack.memoryTips.length : 0,
    tipCount: Array.isArray(pack.tips) ? pack.tips.length : 0,
    mistakeCount: Array.isArray(pack.commonMistakes) ? pack.commonMistakes.length : 0,
    encouragementCount: Object.values(pack.encouragement || {}).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0)
  };
}

export function getCachedKnowledgePack(subjectId, topicId) {
  return peekKnowledge(subjectId, topicId);
}

export default {
  getKnowledgePack,
  getKnowledgeSummary,
  getCachedKnowledgePack
};
