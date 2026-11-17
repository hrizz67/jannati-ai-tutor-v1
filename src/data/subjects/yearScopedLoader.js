import { requireCurriculumBank } from '../../config/curriculumBankCatalog.js';
import { loadSubjectData, subjectList } from './index.js';

// Opt-in guarded entrypoint for future years. The legacy API stays unchanged
// until migration/rollout gates explicitly approve it.
export async function loadYearScopedSubjectData({ year, curriculumId, subjectId } = {}) {
  requireCurriculumBank({ year, curriculumId }, { requireReady: true });
  const id = String(subjectId || '').trim();
  if (!subjectList.some(subject => subject.id === id)) {
    throw new Error(`Unknown subject ID: ${id || '(missing)'}.`);
  }
  return loadSubjectData(id);
}

export async function loadYearScopedSubjects({ year, curriculumId } = {}) {
  requireCurriculumBank({ year, curriculumId }, { requireReady: true });
  return Promise.all(subjectList.map(subject => loadSubjectData(subject.id)));
}
