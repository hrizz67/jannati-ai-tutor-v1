import {
  LEGACY_CURRICULUM_ID,
  LEGACY_STUDENT_YEAR,
  requireCurriculumBank
} from '../config/curriculumBankCatalog.js';
import { getResumeScopeKey } from '../utils/resumeStorage.js';

function explicitYear(selection = {}) {
  const year = typeof selection.year === 'string' ? selection.year.trim() : '';
  if (!year) throw new Error('Missing explicit year for resume scope.');
  return year;
}

function explicitHints(record = {}, key) {
  return [...new Set([
    record?.[key],
    record?.state?.[key],
    record?.metadata?.[key]
  ].filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()))];
}

function matchesRecordBank(record, bank) {
  const years = explicitHints(record, 'year');
  const editions = explicitHints(record, 'curriculumId');
  if (years.some(year => year !== bank.year)) return false;
  if (editions.some(edition => edition !== bank.curriculumId)) return false;
  if (bank.year === LEGACY_STUDENT_YEAR && bank.curriculumId === LEGACY_CURRICULUM_ID) {
    // Historical Year 2 sessions legitimately have no curriculum/year fields.
    return true;
  }
  // Future years MUST carry both fields before any record can be read.
  return years.length === 1 && editions.length === 1;
}

function matchingScopeIdentity(record, selection, bank) {
  const child = String(selection?.childId ?? '').trim();
  const account = String(selection?.accountId ?? '').trim();
  const children = [...new Set([
    ...explicitHints(record, 'childId'),
    ...explicitHints(record, 'studentId')
  ].filter(id => id !== 'default'))];
  const accounts = explicitHints(record, 'accountId');
  if (children.length > 1 || accounts.length > 1) return false;
  if (child && children.length && child !== children[0]) return false;
  if (account && accounts.length && account !== accounts[0]) return false;
  // Future records need both explicit selection and matching persisted IDs.
  if (bank.year !== LEGACY_STUDENT_YEAR && (
    !child || !account || children.length !== 1 || accounts.length !== 1
    || children[0] !== child || accounts[0] !== account
  )) return false;
  return true;
}

/**
 * Planning-only key derivation for future editions. This is deliberately NOT
 * wired into saveResume/loadResume or student-facing UI.
 *
 * Year 2 preserves the precise historic key to avoid changing existing slots.
 * Non-legacy keys are disjoint and encode the full legacy key as one segment.
 */
export function getYearScopedResumeScopeKey(record = {}, selection = {}) {
  const year = explicitYear(selection);
  const bank = requireCurriculumBank({ year, curriculumId: selection.curriculumId });
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('A resume record is required for a year-scoped key.');
  }
  if (!matchesRecordBank(record, bank)) {
    throw new Error('Resume record year/curriculum does not match selected bank.');
  }
  const legacyKey = getResumeScopeKey(record);
  if (bank.year === LEGACY_STUDENT_YEAR && bank.curriculumId === LEGACY_CURRICULUM_ID) {
    return legacyKey;
  }
  if (!matchingScopeIdentity(record, selection, bank)) {
    throw new Error('Future resume record requires matching explicit child and account identity.');
  }
  return ['m1', 'resume', bank.curriculumId, bank.year,
    selection.accountId, selection.childId, legacyKey]
    .map(encodeURIComponent).join('::');
}

/**
 * Read-only fail-closed authorization check for a future storage migration.
 * Never treats a planned bank as available, and never coerces a future
 * unlabelled record into Year 2. No storage access or mutation occurs.
 */
export function isYearScopedResumeReadable(record, selection = {}) {
  try {
    const year = explicitYear(selection);
    const bank = requireCurriculumBank({ year, curriculumId: selection.curriculumId }, { requireReady: true });
    if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
    return matchesRecordBank(record, bank) && matchingScopeIdentity(record, selection, bank);
  } catch {
    return false;
  }
}
