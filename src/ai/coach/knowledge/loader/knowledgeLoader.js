import { KNOWLEDGE_REGISTRY } from '../registry/knowledgeRegistry.js';
import { normalizeKnowledgePack } from '../schemas/knowledgeSchema.js';

const EMPTY_PACK = normalizeKnowledgePack({
  subjectId: null,
  topicId: null
});

export function loadKnowledge(subjectId, topicId) {
  const subjectKnowledge = KNOWLEDGE_REGISTRY[subjectId] || {};
  const pack = subjectKnowledge[topicId];

  if (!pack) {
    return EMPTY_PACK;
  }

  return normalizeKnowledgePack(pack);
}

export function hasKnowledge(subjectId, topicId) {
  return Boolean(KNOWLEDGE_REGISTRY[subjectId]?.[topicId]);
}

export default {
  loadKnowledge,
  hasKnowledge
};
