export const LEARNING_MATERIALS_VERSION = 1;

const MODE_COLLECTION = Object.freeze({
  nota: 'notes',
  buku: 'textbooks'
});

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeEntry(value) {
  if (value === true) return { completedAt: '', source: 'legacy' };
  if (!isObject(value)) return null;
  return {
    completedAt: String(value.completedAt || ''),
    updatedAt: String(value.updatedAt || value.completedAt || ''),
    source: String(value.source || 'learner')
  };
}

function normalizeEntries(value) {
  return Object.fromEntries(Object.entries(isObject(value) ? value : {})
    .map(([key, entry]) => [String(key || '').trim(), normalizeEntry(entry)])
    .filter(([key, entry]) => key && entry));
}

export function createEmptyLearningMaterialsProgress() {
  return {
    version: LEARNING_MATERIALS_VERSION,
    notes: {},
    textbooks: {},
    updatedAt: ''
  };
}

export function normalizeLearningMaterialsProgress(value = {}) {
  const source = isObject(value) ? value : {};
  return {
    version: LEARNING_MATERIALS_VERSION,
    notes: normalizeEntries(source.notes),
    textbooks: normalizeEntries(source.textbooks),
    updatedAt: String(source.updatedAt || '')
  };
}

export function getLearningMaterialKey(subjectId = '', topicId = '') {
  const subject = String(subjectId || '').trim();
  const topic = String(topicId || '').trim();
  return subject && topic ? `${subject}_${topic}` : '';
}

function getCollection(mode = 'nota') {
  return MODE_COLLECTION[mode] || MODE_COLLECTION.nota;
}

export function isLearningMaterialComplete(progress, mode, subjectId, topicId) {
  const normalized = normalizeLearningMaterialsProgress(progress);
  const key = getLearningMaterialKey(subjectId, topicId);
  return Boolean(key && normalized[getCollection(mode)]?.[key]);
}

export function markLearningMaterialComplete(progress, {
  mode = 'nota',
  subjectId = '',
  topicId = '',
  completedAt = new Date().toISOString(),
  source = 'learner'
} = {}) {
  const normalized = normalizeLearningMaterialsProgress(progress);
  const key = getLearningMaterialKey(subjectId, topicId);
  if (!key) return normalized;
  const collection = getCollection(mode);
  const timestamp = String(completedAt || new Date().toISOString());
  return {
    ...normalized,
    [collection]: {
      ...normalized[collection],
      [key]: {
        completedAt: timestamp,
        updatedAt: timestamp,
        source: String(source || 'learner')
      }
    },
    updatedAt: timestamp
  };
}

export function migrateLegacyNoteProgress(progress, legacyReadTopics = {}, migratedAt = new Date().toISOString()) {
  const normalized = normalizeLearningMaterialsProgress(progress);
  const legacyEntries = Object.entries(isObject(legacyReadTopics) ? legacyReadTopics : {})
    .filter(([key, completed]) => String(key || '').trim() && completed === true);
  if (!legacyEntries.length) return normalized;
  const timestamp = String(migratedAt || new Date().toISOString());
  const notes = { ...normalized.notes };
  let changed = false;
  legacyEntries.forEach(([key]) => {
    if (notes[key]) return;
    notes[key] = { completedAt: timestamp, updatedAt: timestamp, source: 'legacy' };
    changed = true;
  });
  return changed ? { ...normalized, notes, updatedAt: timestamp } : normalized;
}

export function countCompletedLearningMaterials(progress, mode) {
  const normalized = normalizeLearningMaterialsProgress(progress);
  return Object.keys(normalized[getCollection(mode)] || {}).length;
}
