export const KNOWLEDGE_SUBJECT_LOADERS = {
  bm: () => import('../subjects/bm/index.js'),
  english: () => import('../subjects/english/index.js'),
  math: () => import('../subjects/math/index.js'),
  sains: () => import('../subjects/sains/index.js'),
  arab: () => import('../subjects/arab/index.js'),
  islam: () => import('../subjects/islam/index.js'),
  pj: () => import('../subjects/pj/index.js'),
  pk: () => import('../subjects/pk/index.js')
};

export const KNOWLEDGE_SUBJECT_IDS = Object.keys(KNOWLEDGE_SUBJECT_LOADERS);

export function getKnowledgeSubjectLoader(subjectId) {
  return KNOWLEDGE_SUBJECT_LOADERS[subjectId] || null;
}

export default {
  KNOWLEDGE_SUBJECT_LOADERS,
  KNOWLEDGE_SUBJECT_IDS,
  getKnowledgeSubjectLoader
};
