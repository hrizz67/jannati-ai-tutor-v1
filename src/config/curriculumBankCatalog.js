// M1 planning contract. Only the existing Year 2 KSSR question bank is ready.
// Planned entries are deliberately not exposed as learning content.
export const LEGACY_STUDENT_YEAR = 'Tahun 2';
export const LEGACY_CURRICULUM_ID = 'kssr-current';

export const CURRICULUM_BANK_CATALOG = Object.freeze([
  Object.freeze({ year: 'Tahun 1', curriculumId: 'kp2027', status: 'planned' }),
  Object.freeze({ year: LEGACY_STUDENT_YEAR, curriculumId: LEGACY_CURRICULUM_ID, status: 'ready' }),
  Object.freeze({ year: 'Tahun 3', curriculumId: LEGACY_CURRICULUM_ID, status: 'planned' })
]);

export function resolveCurriculumBank({ year, curriculumId = '' } = {}) {
  const normalizedYear = String(year ?? '').trim();
  const normalizedCurriculum = String(curriculumId ?? '').trim();
  const matching = CURRICULUM_BANK_CATALOG.filter(bank =>
    bank.year === normalizedYear
    && (!normalizedCurriculum || bank.curriculumId === normalizedCurriculum)
  );
  // Ambiguous future years must never silently select a curriculum edition.
  return matching.length === 1 ? matching[0] : null;
}

export function requireCurriculumBank(selection = {}, { requireReady = false } = {}) {
  const bank = resolveCurriculumBank(selection);
  if (!bank) throw new Error('Unsupported or ambiguous year/curriculum selection.');
  if (requireReady && bank.status !== 'ready') {
    throw new Error(`Question bank not ready: ${bank.year} (${bank.curriculumId}).`);
  }
  return bank;
}

export function isCurriculumBankReady(selection = {}) {
  return resolveCurriculumBank(selection)?.status === 'ready';
}
