import bmKnowledge from '../subjects/bm/index.js';
import englishKnowledge from '../subjects/english/index.js';
import mathKnowledge from '../subjects/math/index.js';
import scienceKnowledge from '../subjects/sains/index.js';
import arabKnowledge from '../subjects/arab/index.js';
import islamKnowledge from '../subjects/islam/index.js';
import pjKnowledge from '../subjects/pj/index.js';
import pkKnowledge from '../subjects/pk/index.js';

export const KNOWLEDGE_REGISTRY = {
  bm: bmKnowledge,
  english: englishKnowledge,
  math: mathKnowledge,
  sains: scienceKnowledge,
  arab: arabKnowledge,
  islam: islamKnowledge,
  pj: pjKnowledge,
  pk: pkKnowledge
};

export function listKnowledgeSubjects() {
  return Object.keys(KNOWLEDGE_REGISTRY);
}

export function listKnowledgeTopics(subjectId) {
  return Object.keys(KNOWLEDGE_REGISTRY[subjectId] || {});
}

export default {
  KNOWLEDGE_REGISTRY,
  listKnowledgeSubjects,
  listKnowledgeTopics
};
