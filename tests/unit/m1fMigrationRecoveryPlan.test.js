import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  RESUME_KEY, RESUME_SLOTS_KEY,
  RESUME_TOMBSTONES_KEY, RESUME_PENDING_TOMBSTONES_KEY
} from '../../src/utils/resumeStorage.js';
import {
  MIGRATION_RECOVERY_STORAGE_KEYS,
  MIGRATION_RECOVERY_STAGES,
  compareMultiYearRollbackSnapshots,
  planMultiYearMigrationRecovery
} from '../../src/services/multiYearMigrationRecoveryPlan.js';

const selection = { year: 'Tahun 2', curriculumId: 'kssr-current', accountId: 'synthetic-family', childId: 'synthetic-child' };
const record = {
  accountId: 'synthetic-family',
  childId: 'synthetic-child',
  studentId: 'synthetic-child',
  mode: 'quiz',
  subjectId: 'bm',
  topicId: 'kata-nama',
  questions: [{ id: 'BM-001', answer: 'PRIVATE-ANSWER' }],
  currentIndex: 0
};
const scope = 'synthetic-child::quiz::bm::kata-nama';
const tombstone = { accountId: 'synthetic-family', childId: 'synthetic-child', clearedAt: '2026-10-01T00:00:00.000Z' };

function sampleSnapshot() {
  return {
    [RESUME_SLOTS_KEY]: JSON.stringify({ [scope]: record }),
    [RESUME_KEY]: JSON.stringify(record),
    [RESUME_TOMBSTONES_KEY]: JSON.stringify({ 'synthetic-child::uasa::bm': tombstone }),
    [RESUME_PENDING_TOMBSTONES_KEY]: JSON.stringify({ 'synthetic-child::uasa::bm': tombstone })
  };
}

describe('M1-F recovery design-only snapshot comparisons', () => {
  it('holds every migration stage even for a clean synthetic Year 2 snapshot', () => {
    const snapshot = sampleSnapshot();
    const before = JSON.stringify(snapshot);
    const result = planMultiYearMigrationRecovery(snapshot, selection);
    expect(result).toMatchObject({
      status: 'HOLD', readOnly: true,
      canApply: false, canRestore: false,
      backupCaptured: false, backupVerified: false,
      rollbackRehearsed: false, ownerApproved: false,
      proposedWrites: 0, proposedDeletes: 0
    });
    expect(result.stages).toContain('obtain-explicit-owner-migration-approval');
    expect(result.stages).toContain('rollback-from-verified-backup-on-any-failure');
    expect(result.stages).toContain('verify-child-year-tombstone-and-reward-isolation');
    expect(result.presentKeyTypes).toBe(4);
    expect(JSON.stringify(snapshot)).toBe(before);
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE-ANSWER|synthetic-child|synthetic-family/);
  });

  it('passes read-only byte-for-byte equivalence but still cannot restore', () => {
    const original = sampleSnapshot();
    const cloned = JSON.parse(JSON.stringify(original));
    const result = compareMultiYearRollbackSnapshots(original, cloned);
    expect(result).toMatchObject({
      status: 'HOLD', exactMatch: true, readOnly: true,
      canApply: false, canRestore: false, proposedWrites: 0, proposedDeletes: 0,
      verifiedKeyTypes: MIGRATION_RECOVERY_STORAGE_KEYS.length, findings: []
    });
    expect(MIGRATION_RECOVERY_STAGES.length).toBeGreaterThanOrEqual(8);
  });

  it('rejects a changed answer byte-for-byte without printing the learner answer', () => {
    const original = sampleSnapshot();
    const modified = { ...original, [RESUME_KEY]: original[RESUME_KEY].replace('PRIVATE-ANSWER', 'PRIVATE-ANSWER-CHANGED') };
    const result = compareMultiYearRollbackSnapshots(original, modified);
    expect(result.exactMatch).toBe(false);
    expect(result.findings).toEqual([{ code: 'rollback_payload_mismatch', source: RESUME_KEY }]);
    expect(JSON.stringify(result)).not.toContain('PRIVATE-ANSWER');
  });

  it('refuses rollback equivalence when a pending tombstone is missing', () => {
    const original = sampleSnapshot();
    const missing = { ...original };
    delete missing[RESUME_PENDING_TOMBSTONES_KEY];
    const result = compareMultiYearRollbackSnapshots(original, missing);
    expect(result.exactMatch).toBe(false);
    expect(result.findings).toContainEqual({
      code: 'missing_or_added_backup_key', source: RESUME_PENDING_TOMBSTONES_KEY
    });
  });

  it('refuses altered tombstone data and new unknown key families', () => {
    const original = sampleSnapshot();
    const modified = { ...original,
      [RESUME_TOMBSTONES_KEY]: '{}',
      'jannati_v999_future_resume': JSON.stringify({ name: 'PRIVATE-CHILD' })
    };
    const result = compareMultiYearRollbackSnapshots(original, modified);
    expect(result.exactMatch).toBe(false);
    expect(result.findings).toContainEqual({ code: 'rollback_payload_mismatch', source: RESUME_TOMBSTONES_KEY });
    expect(result.findings).toContainEqual({ code: 'unrecognized_backup_key' });
    expect(JSON.stringify(result)).not.toContain('PRIVATE-CHILD');
  });

  it('fails closed on invalid, massive, non-string and accessor-defined snapshots', () => {
    for (const source of [null, [], new Map(), undefined, 'hello']) {
      const result = compareMultiYearRollbackSnapshots(source, sampleSnapshot());
      expect(result).toMatchObject({ exactMatch: false, canApply: false });
      expect(result.findings[0]?.code).toBe('invalid_snapshot');
    }
    const normal = sampleSnapshot();
    const huge = { ...normal, [RESUME_KEY]: 'x'.repeat(1024 * 1024 + 1) };
    expect(compareMultiYearRollbackSnapshots(normal, huge).findings)
      .toContainEqual({ code: 'invalid_or_oversized_backup_value', source: RESUME_KEY });
    const accessors = Object.defineProperty({}, RESUME_KEY, {
      enumerable: true, get() { throw new Error('getter must not run'); }
    });
    expect(compareMultiYearRollbackSnapshots(accessors, normal).findings)
      .toContainEqual({ code: 'invalid_or_oversized_backup_value', source: RESUME_KEY });
  });

  it('is not a working backup, does not touch browser storage, and stays outside App', () => {
    const source = readFileSync('src/services/multiYearMigrationRecoveryPlan.js', 'utf8');
    const app = readFileSync('src/App.jsx', 'utf8');
    const storage = readFileSync('src/utils/resumeStorage.js', 'utf8');
    expect(source).not.toMatch(/localStorage\.|sessionStorage\.|\.setItem\(|\.removeItem\(/);
    expect(app).not.toContain('multiYearMigrationRecoveryPlan');
    expect(storage).not.toContain('multiYearMigrationRecoveryPlan');
  });
});
