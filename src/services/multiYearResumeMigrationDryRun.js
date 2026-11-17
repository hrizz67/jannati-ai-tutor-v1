import {
  LEGACY_RESUME_KEYS,
  RESUME_KEY,
  RESUME_SLOTS_KEY,
  RESUME_TOMBSTONES_KEY,
  RESUME_PENDING_TOMBSTONES_KEY,
  getResumeScopeKey,
  normalizeResumeData
} from '../utils/resumeStorage.js';
import { resolveCurriculumBank } from '../config/curriculumBankCatalog.js';
import {
  getYearScopedResumeScopeKey,
  isYearScopedResumeReadable
} from './yearScopedResumePolicy.js';

// This module is planning-only: it never accepts a Storage object, reads
// localStorage, or exposes any API that can persist or delete a learner record.
const MAX_RAW_CHARS = 1024 * 1024;
const MAX_SLOTS = 256;
const SOURCES = Object.freeze([RESUME_SLOTS_KEY, RESUME_KEY, ...LEGACY_RESUME_KEYS]);
const TOMBSTONES = Object.freeze([RESUME_TOMBSTONES_KEY, RESUME_PENDING_TOMBSTONES_KEY]);

function objectRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hintSet(record, field) {
  return [...new Set([
    record?.[field],
    record?.state?.[field],
    record?.metadata?.[field]
  ].filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()))];
}

function readRawObject(snapshot, storageKey, findings) {
  if (!Object.prototype.hasOwnProperty.call(snapshot, storageKey)) return null;
  const raw = snapshot[storageKey];
  if (typeof raw !== 'string' || raw.length > MAX_RAW_CHARS) {
    findings.push({ code: 'invalid_or_oversized_storage_blob', source: storageKey });
    return null;
  }
  try {
    const value = JSON.parse(raw);
    if (!objectRecord(value)) throw new Error('Expected JSON object');
    return value;
  } catch {
    findings.push({ code: 'unreadable_storage_blob', source: storageKey });
    return null;
  }
}

function matchedIdentity(record, selection) {
  const children = [...new Set([
    ...hintSet(record, 'childId'),
    ...hintSet(record, 'studentId')
  ].filter(value => value !== 'default'))];
  const accounts = hintSet(record, 'accountId');
  if (children.length > 1 || accounts.length > 1) return false;
  if (children.length && children[0] !== selection.childId) return false;
  if (accounts.length && accounts[0] !== selection.accountId) return false;
  // Missing historical identity is not grounds for automatic attribution.
  return children.length === 1 && accounts.length === 1;
}

function recordEdition(record, selectedBank) {
  const years = hintSet(record, 'year');
  const curriculums = hintSet(record, 'curriculumId');
  if (years.length > 1 || curriculums.length > 1) return 'conflicting_year_or_curriculum';
  if (years.length && years[0] !== selectedBank.year) return 'different_year_or_curriculum';
  if (curriculums.length && curriculums[0] !== selectedBank.curriculumId) return 'different_year_or_curriculum';
  if (selectedBank.year !== 'Tahun 2' && (!years.length || !curriculums.length)) {
    return 'missing_future_year_or_curriculum';
  }
  return '';
}

function recordSummary(record, selection, source, slotOrdinal, slotKey, protectedScopes, projected, findings, counts) {
  const label = { source, ordinal: slotOrdinal };
  if (!objectRecord(record)) {
    findings.push({ ...label, code: 'invalid_resume_record' });
    return;
  }
  const normalized = normalizeResumeData(record);
  if (!normalized) {
    findings.push({ ...label, code: 'invalid_resume_record' });
    return;
  }
  const canonicalLegacyScope = getResumeScopeKey(record);
  if (source === RESUME_SLOTS_KEY && slotKey !== canonicalLegacyScope) {
    findings.push({ ...label, code: 'noncanonical_slot_key' });
    return;
  }
  const editionProblem = recordEdition(record, selection.bank);
  if (editionProblem) {
    findings.push({ ...label, code: editionProblem });
    return;
  }
  if (!matchedIdentity(record, selection)) {
    findings.push({ ...label, code: 'insufficient_or_mismatched_identity' });
    return;
  }
  if (protectedScopes.has(canonicalLegacyScope)) {
    findings.push({ ...label, code: 'tombstone_prevents_revival' });
    return;
  }

  let proposedScope;
  try {
    proposedScope = getYearScopedResumeScopeKey(record, selection);
  } catch {
    findings.push({ ...label, code: 'scope_policy_rejected' });
    return;
  }
  const signature = JSON.stringify(record);
  if (projected.has(proposedScope)) {
    // The top-level RESUME_KEY frequently mirrors a record already in slots.
    // A different payload in the same scope cannot be chosen automatically.
    const previous = projected.get(proposedScope);
    if (previous.signature === signature) {
      counts.identicalAliases += 1;
    } else {
      findings.push({ ...label, code: 'conflicting_scope_records' });
    }
    return;
  }
  projected.set(proposedScope, { signature });
  counts.plannedKeys += 1;
  if (isYearScopedResumeReadable(record, selection)) counts.readyBankRecords += 1;
  else counts.plannedBankRecords += 1;
}

/**
 * Generate a privacy-minimal, read-only migration report for ONE explicitly
 * identified child and curriculum. Input is a plain snapshot of raw JSON
 * storage values; output never contains a record, answer or child identifier.
 *
 * This NEVER authorizes writing, even when every finding is clear.
 */
export function inspectMultiYearResumeMigration(snapshot = {}, selection = {}) {
  const findings = [];
  const counts = {
    rawSlots: 0,
    rawLegacyRecords: 0,
    plannedKeys: 0,
    readyBankRecords: 0,
    plannedBankRecords: 0,
    identicalAliases: 0,
    tombstones: 0,
    pendingTombstones: 0
  };
  const report = () => ({
    reportVersion: 1,
    status: 'hold',
    readOnly: true,
    canApply: false,
    proposedWrites: 0,
    proposedDeletes: 0,
    counts: { ...counts },
    findings: [...findings],
    needsOwnerReview: findings.length > 0 || counts.pendingTombstones > 0 || counts.plannedBankRecords > 0
  });

  if (!objectRecord(snapshot)) {
    findings.push({ code: 'invalid_snapshot' });
    return report();
  }
  const year = typeof selection?.year === 'string' ? selection.year.trim() : '';
  const curriculumId = typeof selection?.curriculumId === 'string' ? selection.curriculumId.trim() : '';
  const accountId = typeof selection?.accountId === 'string' ? selection.accountId.trim() : '';
  const childId = typeof selection?.childId === 'string' ? selection.childId.trim() : '';
  const bank = resolveCurriculumBank({ year, curriculumId });
  if (!year || !curriculumId || !accountId || !childId || accountId === 'default' || childId === 'default' || !bank) {
    findings.push({ code: 'missing_or_unsupported_explicit_selection' });
    return report();
  }

  const activeSelection = { year, curriculumId, accountId, childId, bank };
  const protectedScopes = new Set();
  for (const source of TOMBSTONES) {
    const records = readRawObject(snapshot, source, findings);
    if (!records) continue;
    if (Object.keys(records).length > MAX_SLOTS) {
      findings.push({ code: 'too_many_tombstones', source });
      continue;
    }
    for (const [scope, value] of Object.entries(records)) {
      if (!objectRecord(value) || !Number.isFinite(Date.parse(value.clearedAt || ''))) {
        findings.push({ code: 'invalid_tombstone_record', source });
        continue;
      }
      protectedScopes.add(scope);
      if (source === RESUME_TOMBSTONES_KEY) counts.tombstones += 1;
      else counts.pendingTombstones += 1;
    }
  }

  const projected = new Map();
  for (const source of SOURCES) {
    const entries = readRawObject(snapshot, source, findings);
    if (!entries) continue;
    if (source === RESUME_SLOTS_KEY) {
      const rows = Object.entries(entries);
      counts.rawSlots = rows.length;
      if (rows.length > MAX_SLOTS) {
        findings.push({ code: 'too_many_resume_slots', source });
        continue;
      }
      rows.forEach(([key, value], index) => recordSummary(
        value, activeSelection, source, index, key, protectedScopes, projected, findings, counts
      ));
    } else {
      counts.rawLegacyRecords += 1;
      recordSummary(entries, activeSelection, source, 0, null, protectedScopes, projected, findings, counts);
    }
  }
  return report();
}
