import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  LEGACY_RESUME_KEYS,
  RESUME_KEY,
  RESUME_SLOTS_KEY,
  RESUME_TOMBSTONES_KEY,
  RESUME_PENDING_TOMBSTONES_KEY,
  getResumeScopeKey
} from '../../src/utils/resumeStorage.js';
import { getYearScopedResumeScopeKey } from '../../src/services/yearScopedResumePolicy.js';
import { inspectMultiYearResumeMigration } from '../../src/services/multiYearResumeMigrationDryRun.js';

const year2 = { year: 'Tahun 2', curriculumId: 'kssr-current', accountId: 'family', childId: 'child-a' };
const year1 = { ...year2, year: 'Tahun 1', curriculumId: 'kp2027' };
const year3 = { ...year2, year: 'Tahun 3', curriculumId: 'kssr-current' };

function resume(data = {}) {
  return {
    mode: 'quiz',
    accountId: 'family',
    childId: 'child-a',
    studentId: 'child-a',
    subjectId: 'bm',
    topicId: 'kata-nama',
    questions: [{ id: 'BM-001', q: 'Sample synthetic question' }],
    currentIndex: 0,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...data
  };
}

function collection(...records) {
  return Object.fromEntries(records.map(record => [getResumeScopeKey(record), record]));
}

function storage(slots, others = {}) {
  return { [RESUME_SLOTS_KEY]: JSON.stringify(slots), ...others };
}

describe('M1-E resume migration dry-run invariants', () => {
  it('preserves historical Year 2 keys with an identical top-level resume alias', () => {
    const old = resume();
    const raw = storage(collection(old), { [RESUME_KEY]: JSON.stringify(old) });
    const original = JSON.stringify(raw);
    const report = inspectMultiYearResumeMigration(raw, year2);
    expect(report).toMatchObject({
      reportVersion: 1, status: 'hold', readOnly: true,
      canApply: false, proposedWrites: 0, proposedDeletes: 0,
      counts: { rawSlots: 1, rawLegacyRecords: 1, plannedKeys: 1, readyBankRecords: 1, identicalAliases: 1 },
      findings: []
    });
    expect(JSON.stringify(raw)).toBe(original);
    expect(getYearScopedResumeScopeKey(old, year2)).toBe(getResumeScopeKey(old));
  });

  it('distinguishes year1 KP2027 from year3 KSSR for exactly the same child, mode and topic', () => {
    const one = resume({ year: 'Tahun 1', curriculumId: 'kp2027' });
    const three = resume({ year: 'Tahun 3', curriculumId: 'kssr-current' });
    expect(getResumeScopeKey(one)).toBe(getResumeScopeKey(three));
    expect(getYearScopedResumeScopeKey(one, year1)).not.toBe(getYearScopedResumeScopeKey(three, year3));
    for (const [record, selection] of [[one, year1], [three, year3]]) {
      const report = inspectMultiYearResumeMigration(storage(collection(record)), selection);
      expect(report.counts.plannedKeys).toBe(1);
      expect(report.counts.plannedBankRecords).toBe(1);
      expect(report.counts.readyBankRecords).toBe(0);
      expect(report.findings).toEqual([]);
      expect(report.canApply).toBe(false);
      expect(report.needsOwnerReview).toBe(true);
    }
  });

  it('rejects inferred, missing or unsupported selections with no writes', () => {
    const raw = storage(collection(resume()));
    for (const selection of [{}, { year: 'Tahun 2' }, { ...year2, accountId: '' },
      { ...year2, childId: 'default' }, { ...year2, year: 'Tahun 4' },
      { ...year2, curriculumId: 'kp2027' }]) {
      const report = inspectMultiYearResumeMigration(raw, selection);
      expect(report.findings[0]?.code).toBe('missing_or_unsupported_explicit_selection');
      expect(report.counts.plannedKeys).toBe(0);
      expect(report.canApply).toBe(false);
    }
    expect(inspectMultiYearResumeMigration(null, year2).findings[0]?.code).toBe('invalid_snapshot');
  });

  it('does not guess a future year for unlabelled historical resumes', () => {
    const report = inspectMultiYearResumeMigration(storage(collection(resume())), year1);
    expect(report.findings[0]?.code).toBe('missing_future_year_or_curriculum');
    expect(report.counts.plannedKeys).toBe(0);
  });

  it('holds wrong-year and contradictory nested year/curriculum hints', () => {
    const other = resume({ year: 'Tahun 1', curriculumId: 'kp2027' });
    const mismatch = inspectMultiYearResumeMigration(storage(collection(other)), year2);
    expect(mismatch.findings[0]?.code).toBe('different_year_or_curriculum');
    const conflicting = resume({
      year: 'Tahun 2', curriculumId: 'kssr-current',
      state: { year: 'Tahun 3' }
    });
    const report = inspectMultiYearResumeMigration(storage(collection(conflicting)), year2);
    expect(report.findings[0]?.code).toBe('conflicting_year_or_curriculum');
  });

  it('rejects mismatched account/child and contradictory identity hints even for legacy Year2', () => {
    const differentChild = resume({ childId: 'child-b', studentId: 'child-b' });
    const differentAccount = resume({ accountId: 'another-account' });
    const conflicting = resume({ state: { childId: 'child-other', accountId: 'another-account' } });
    for (const record of [differentChild, differentAccount, conflicting]) {
      const report = inspectMultiYearResumeMigration(storage(collection(record)), year2);
      expect(report.findings[0]?.code).toBe('insufficient_or_mismatched_identity');
      expect(report.counts.plannedKeys).toBe(0);
    }
  });

  it('refuses automatic attribution of legacy records with no explicit ownership evidence', () => {
    const unscoped = resume({ accountId: '', childId: '', studentId: 'default' });
    const report = inspectMultiYearResumeMigration(storage(collection(unscoped)), year2);
    expect(report.findings[0]?.code).toBe('insufficient_or_mismatched_identity');
  });

  it('keeps active or pending deletion tombstones from resurrecting recorded sessions', () => {
    const old = resume();
    const scope = getResumeScopeKey(old);
    const tombstone = { accountId: 'family', childId: 'child-a', clearedAt: '2026-10-03T10:00:00Z' };
    const input = storage(collection(old), {
      [RESUME_TOMBSTONES_KEY]: JSON.stringify({ [scope]: tombstone }),
      [RESUME_PENDING_TOMBSTONES_KEY]: JSON.stringify({ [scope]: tombstone })
    });
    const report = inspectMultiYearResumeMigration(input, year2);
    expect(report.counts).toMatchObject({ tombstones: 1, pendingTombstones: 1, plannedKeys: 0 });
    expect(report.findings[0]?.code).toBe('tombstone_prevents_revival');
    expect(report.canApply).toBe(false);
  });

  it('retains orphan tombstone evidence without deleting anything', () => {
    const tombstone = { accountId: 'family', childId: 'child-a', clearedAt: '2026-10-03T10:00:00Z' };
    const report = inspectMultiYearResumeMigration({
      [RESUME_PENDING_TOMBSTONES_KEY]: JSON.stringify({ 'child-a::quiz::bm::kata-nama': tombstone })
    }, year2);
    expect(report.counts.pendingTombstones).toBe(1);
    expect(report.counts.plannedKeys).toBe(0);
    expect(report.proposedDeletes).toBe(0);
    expect(report.needsOwnerReview).toBe(true);
  });

  it('rejects a noncanonical stored resume slot rather than silently moving it', () => {
    const raw = storage({ 'wrong-child::quiz::bm::kata-nama': resume() });
    const report = inspectMultiYearResumeMigration(raw, year2);
    expect(report.findings[0]?.code).toBe('noncanonical_slot_key');
    expect(report.proposedWrites).toBe(0);
  });

  it('detects conflicting legacy aliases while allowing exact duplicates', () => {
    const old = resume();
    const changed = resume({ currentIndex: 2, updatedAt: '2026-10-17T00:00:00Z' });
    const report = inspectMultiYearResumeMigration(storage(collection(old), {
      [RESUME_KEY]: JSON.stringify(changed)
    }), year2);
    expect(report.findings.some(entry => entry.code === 'conflicting_scope_records')).toBe(true);
    expect(report.counts.plannedKeys).toBe(1);
    expect(report.counts.identicalAliases).toBe(0);
  });

  it('fails closed on malformed, overlarge and non-object storage blobs', () => {
    const malformed = inspectMultiYearResumeMigration({
      [RESUME_SLOTS_KEY]: '{bad-json',
      [RESUME_TOMBSTONES_KEY]: '[]',
      [RESUME_KEY]: JSON.stringify(resume())
    }, year2);
    expect(malformed.findings.some(entry => entry.code === 'unreadable_storage_blob')).toBe(true);
    expect(malformed.canApply).toBe(false);
    const tooLarge = inspectMultiYearResumeMigration({ [RESUME_SLOTS_KEY]: 'x'.repeat(1024 * 1024 + 1) }, year2);
    expect(tooLarge.findings[0]?.code).toBe('invalid_or_oversized_storage_blob');
    const invalidRecord = inspectMultiYearResumeMigration(storage({ abc: { mode: 'quiz' } }), year2);
    expect(invalidRecord.findings[0]?.code).toBe('invalid_resume_record');
  });

  it('does not expose synthetic child names, answer text or question payloads in the plan', () => {
    const record = resume({ name: 'PRIVATE-CHILD-NAME', questions: [{ id: 'BM-001', q: 'PRIVATE-QUESTION', answer: 'PRIVATE-ANSWER' }] });
    const result = inspectMultiYearResumeMigration(storage(collection(record)), year2);
    const printable = JSON.stringify(result);
    expect(printable).not.toContain('PRIVATE-CHILD-NAME');
    expect(printable).not.toContain('PRIVATE-ANSWER');
    expect(printable).not.toContain('PRIVATE-QUESTION');
    expect(printable).not.toContain('child-a');
    expect(printable).not.toContain('family');
  });

  it('does not touch browser storage or wire a migration into the active learner app', () => {
    const before = readFileSync('src/utils/resumeStorage.js', 'utf8');
    const app = readFileSync('src/App.jsx', 'utf8');
    const dryRun = readFileSync('src/services/multiYearResumeMigrationDryRun.js', 'utf8');
    const compaction = readFileSync('src/utils/resumeCompaction.js', 'utf8');
    expect(before).not.toContain('multiYearResumeMigrationDryRun');
    expect(app).not.toContain('multiYearResumeMigrationDryRun');
    expect(dryRun).not.toMatch(/localStorage\.|sessionStorage\.|\.setItem\(|\.removeItem\(/);
    // Existing compaction is still yearless and bounded, hence migration MUST remain on hold.
    expect(compaction).toContain('if (Object.keys(bounded).length >= 12');
    expect(compaction).toContain('const key = scopeKey(resume)');
  });
});
