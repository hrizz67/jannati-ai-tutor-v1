import {
  RESUME_KEY,
  RESUME_SLOTS_KEY,
  RESUME_TOMBSTONES_KEY,
  RESUME_PENDING_TOMBSTONES_KEY,
  LEGACY_RESUME_KEYS
} from '../utils/resumeStorage.js';
import { inspectMultiYearResumeMigration } from './multiYearResumeMigrationDryRun.js';

export const MIGRATION_RECOVERY_STORAGE_KEYS = Object.freeze([
  RESUME_SLOTS_KEY,
  RESUME_KEY,
  ...LEGACY_RESUME_KEYS,
  RESUME_TOMBSTONES_KEY,
  RESUME_PENDING_TOMBSTONES_KEY
]);

export const MIGRATION_RECOVERY_STAGES = Object.freeze([
  'pause-child-writes-and-cloud-reconciliation',
  'capture-encrypted-account-child-backup',
  'verify-backup-integrity-and-restorability',
  'perform-isolated-synthetic-restore-rehearsal',
  'obtain-explicit-owner-migration-approval',
  'stage-versioned-migration-with-quarantine',
  'verify-child-year-tombstone-and-reward-isolation',
  'resume-sync-only-after-verification',
  'rollback-from-verified-backup-on-any-failure'
]);

const MAX_BLOB_CHARS = 1024 * 1024;

function isPlainSnapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function descriptorString(value, key) {
  if (!hasOwn(value, key)) return { present: false, value: null };
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !hasOwn(descriptor, 'value') || typeof descriptor.value !== 'string'
    || descriptor.value.length > MAX_BLOB_CHARS) {
    return { present: true, invalid: true, value: null };
  }
  return { present: true, value: descriptor.value };
}

/**
 * Privacy-minimal recovery gate. Evaluates a caller-supplied plain
 * snapshot only; it NEVER captures a backup or authorizes writes/restores.
 * BackupVerified remains false until an external, independently audited
 * encrypted backup/restore implementation exists.
 */
export function planMultiYearMigrationRecovery(snapshot = {}, selection = {}) {
  // Do not invoke arbitrary getters when handing a caller-supplied snapshot
  // to the existing dry-run parser. Data-only snapshots are mandatory.
  const validSnapshot = isPlainSnapshot(snapshot)
    && Object.values(Object.getOwnPropertyDescriptors(snapshot))
      .every(descriptor => hasOwn(descriptor, 'value'));
  const snapshotStatus = validSnapshot
    ? inspectMultiYearResumeMigration(snapshot, selection)
    : inspectMultiYearResumeMigration(null, selection);
  const presentSources = validSnapshot
    ? MIGRATION_RECOVERY_STORAGE_KEYS.filter(key => hasOwn(snapshot, key)).length
    : 0;
  return {
    planVersion: 1,
    mode: 'design-only',
    status: 'HOLD',
    readOnly: true,
    canApply: false,
    canRestore: false,
    backupCaptured: false,
    backupVerified: false,
    rollbackRehearsed: false,
    ownerApproved: false,
    proposedWrites: 0,
    proposedDeletes: 0,
    protectedKeyTypes: MIGRATION_RECOVERY_STORAGE_KEYS.length,
    presentKeyTypes: presentSources,
    stages: [...MIGRATION_RECOVERY_STAGES],
    riskCounts: { ...snapshotStatus.counts },
    findingCodes: [...new Set(snapshotStatus.findings.map(finding => finding.code))].sort(),
    needsOwnerReview: true
  };
}

/**
 * Compares two explicit synthetic snapshots byte-for-byte for every allowlisted
 * resume/tombstone key. No JSON parsing, data extraction, storage IO, or
 * answer/identity data is returned. Passing does NOT authorize a restore.
 */
export function compareMultiYearRollbackSnapshots(original, candidate) {
  const findings = [];
  const summary = (verifiedKeys = 0) => ({
    reportVersion: 1,
    status: 'HOLD',
    readOnly: true,
    canApply: false,
    canRestore: false,
    proposedWrites: 0,
    proposedDeletes: 0,
    exactMatch: findings.length === 0,
    checkedKeyTypes: MIGRATION_RECOVERY_STORAGE_KEYS.length,
    verifiedKeyTypes: verifiedKeys,
    findings: [...findings]
  });
  if (!isPlainSnapshot(original) || !isPlainSnapshot(candidate)) {
    findings.push({ code: 'invalid_snapshot' });
    return summary();
  }

  let verified = 0;
  let presentProtectedKeys = 0;
  for (const key of MIGRATION_RECOVERY_STORAGE_KEYS) {
    const left = descriptorString(original, key);
    const right = descriptorString(candidate, key);
    if (left.present || right.present) presentProtectedKeys += 1;
    if (left.invalid || right.invalid) {
      findings.push({ code: 'invalid_or_oversized_backup_value', source: key });
    } else if (left.present !== right.present) {
      findings.push({ code: 'missing_or_added_backup_key', source: key });
    } else if (left.present && left.value !== right.value) {
      findings.push({ code: 'rollback_payload_mismatch', source: key });
    } else if (left.present && right.present) {
      verified += 1;
    }
  }
  // Two empty objects are not proof that a recoverable backup was captured.
  if (presentProtectedKeys === 0) findings.push({ code: 'no_protected_snapshot_data' });
  // A future/new key type cannot be silently discarded by the proposed
  // backup schema. No unknown key names are returned in the audit output.
  const unknown = Object.keys(original).concat(Object.keys(candidate))
    .some(key => !MIGRATION_RECOVERY_STORAGE_KEYS.includes(key));
  if (unknown) findings.push({ code: 'unrecognized_backup_key' });
  return summary(verified);
}
