import { getKnowledgeSubjectLoader } from '../registry/knowledgeRegistry.js';
import { normalizeKnowledgePack } from '../schemas/knowledgeSchema.js';

const EMPTY_PACK = normalizeKnowledgePack({
  subjectId: null,
  topicId: null
});

const subjectModuleCache = new Map();
const packCache = new Map();

function cacheKey(subjectId, topicId) {
  return `${subjectId || 'unknown'}:${topicId || 'unknown'}`;
}

function getSubjectMap(moduleValue) {
  if (!moduleValue) return {};
  return moduleValue.default && typeof moduleValue.default === 'object' ? moduleValue.default : moduleValue;
}

async function loadSubjectMap(subjectId) {
  if (!subjectId) return null;
  if (subjectModuleCache.has(subjectId)) {
    return subjectModuleCache.get(subjectId);
  }

  const loader = getKnowledgeSubjectLoader(subjectId);
  if (!loader) {
    subjectModuleCache.set(subjectId, null);
    return null;
  }

  try {
    const moduleValue = await loader();
    const subjectMap = getSubjectMap(moduleValue);
    subjectModuleCache.set(subjectId, subjectMap);
    return subjectMap;
  } catch {
    subjectModuleCache.set(subjectId, null);
    return null;
  }
}

function getCachedPack(subjectId, topicId) {
  return packCache.get(cacheKey(subjectId, topicId)) || null;
}

function setCachedPack(subjectId, topicId, pack) {
  if (!subjectId || !topicId || !pack) return pack;
  packCache.set(cacheKey(subjectId, topicId), pack);
  return pack;
}

export async function loadKnowledge(subjectId, topicId) {
  const cachedPack = getCachedPack(subjectId, topicId);
  if (cachedPack) return cachedPack;

  const subjectMap = await loadSubjectMap(subjectId);
  const pack = subjectMap?.[topicId];
  if (!pack) {
    return EMPTY_PACK;
  }

  return setCachedPack(subjectId, topicId, normalizeKnowledgePack(pack));
}

export async function loadKnowledgeMap(subjectId) {
  return loadSubjectMap(subjectId);
}

export async function hasKnowledge(subjectId, topicId) {
  const cachedPack = getCachedPack(subjectId, topicId);
  if (cachedPack) return true;

  const subjectMap = await loadSubjectMap(subjectId);
  return Boolean(subjectMap?.[topicId]);
}

export function peekKnowledge(subjectId, topicId) {
  return getCachedPack(subjectId, topicId);
}

export function primeKnowledgePack(subjectId, topicId, pack) {
  if (!pack) return EMPTY_PACK;
  return setCachedPack(subjectId, topicId, normalizeKnowledgePack(pack));
}

export async function clearKnowledgeCache() {
  subjectModuleCache.clear();
  packCache.clear();
}

export default {
  loadKnowledge,
  loadKnowledgeMap,
  hasKnowledge,
  peekKnowledge,
  primeKnowledgePack,
  clearKnowledgeCache
};
