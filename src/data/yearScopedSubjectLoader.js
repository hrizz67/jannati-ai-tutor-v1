import { requireCurriculumBank } from '../config/curriculumBankCatalog.js';
import { loadSubjectData, subjectList } from './subjects/index.js';

// Opt-in guarded entrypoint for future years. The legacy API stays unchanged
// until migration/rollout gates explicitly approve it.
function requireExplicitReadyYear(year, curriculumId) {
  if (typeof year !== 'string' || !year.trim()) {
    throw new Error('Missing explicit student year for year-scoped content.');
  }
  return requireCurriculumBank({ year, curriculumId }, { requireReady: true });
}

export async function loadYearScopedSubjectData({ year, curriculumId, subjectId } = {}) {
  requireExplicitReadyYear(year, curriculumId);
  const id = String(subjectId || '').trim();
  if (!subjectList.some(subject => subject.id === id)) {
    throw new Error(`Unknown subject ID: ${id || '(missing)'}.`);
  }
  return loadSubjectData(id);
}

export async function loadYearScopedSubjects({ year, curriculumId } = {}) {
  requireExplicitReadyYear(year, curriculumId);
  return Promise.all(subjectList.map(subject => loadSubjectData(subject.id)));
}
