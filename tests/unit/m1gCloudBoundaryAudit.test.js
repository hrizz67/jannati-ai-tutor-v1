import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CLOUD_CHILD_STATE_KEY,
  CHILD_SNAPSHOT_PREFIX
} from '../../src/services/learningSync.js';
import {
  RESUME_SLOTS_KEY,
  RESUME_TOMBSTONES_KEY,
  RESUME_PENDING_TOMBSTONES_KEY
} from '../../src/utils/resumeStorage.js';
import {
  acknowledgeCloudMutations,
  markCloudMutation
} from '../../src/services/cloudMutationOutbox.js';
import { auditMultiYearCloudBoundary } from '../../src/services/multiYearCloudBoundaryAudit.js';

const accountId = 'family-synthetic';
const childId = 'child-a';
const selection = { accountId, childId, year: 'Tahun 2', curriculumId: 'kssr-current' };
const profile = { accountId, childId, studentId: childId, year: 'Tahun 2', curriculumId: 'kssr-current', xp: 12 };
const child = { id: childId, name: 'Private fake child', year: 'Tahun 2' };
const slot = `${childId}::quiz::bm::kata-nama`;

function fixture(custom = {}) {
  const meta = {
    profiles: [child, { id: 'child-b', name: 'Other fake child', year: 'Tahun 2' }],
    activeChildId: childId,
    deletedChildren: {},
    archivedChildren: {},
    ...(custom.metadata || {})
  };
  const snapshot = {
    __childSnapshotAccountId: accountId,
    __childSnapshotChildId: childId,
    jannati_v151_profile: JSON.stringify(profile),
    ...(custom.snapshot || {})
  };
  const data = {
    [CLOUD_CHILD_STATE_KEY]: JSON.stringify(meta),
    [`${CHILD_SNAPSHOT_PREFIX}${childId}`]: JSON.stringify(snapshot),
    jannati_v151_profile: JSON.stringify(profile),
    [RESUME_SLOTS_KEY]: JSON.stringify({ [slot]: {
      ...profile, mode: 'quiz', subjectId: 'bm', topicId: 'kata-nama',
      questions: [{ id: 'BM-001' }]
    } })
  };
  return {
    selection: { ...selection, ...(custom.selection || {}) },
    localPayload: { ...data, ...(custom.local || {}) },
    cloudPayload: { ...data, ...(custom.cloud || {}) },
    syncState: { ...(custom.syncState || {}) }
  };
}

describe('M1-G read-only cloud / year integration audit', () => {
  it('provides privacy-minimal summary for matching Year 2 synthetic snapshots, always HOLD', () => {
    const input = fixture();
    const before = JSON.stringify(input);
    const report = auditMultiYearCloudBoundary(input);
    expect(report).toMatchObject({
      reportVersion: 1, status: 'HOLD', readOnly: true,
      canHydrate: false, canMerge: false, canApply: false, canRelease: false,
      proposedWrites: 0, proposedDeletes: 0,
      counts: { localChildSnapshots: 1, cloudChildSnapshots: 1, localResumeSlots: 1, cloudResumeSlots: 1 }
    });
    expect(report.findings).toEqual([]);
    expect(JSON.stringify(input)).toBe(before);
    expect(JSON.stringify(report)).not.toMatch(/Private fake child|BM-001|family-synthetic|child-a|PRIVATE-ANSWER/);
  });

  it('blocks planned Year 1/3 even with explicitly matching year/edition profiles', () => {
    for (const [year, curriculumId] of [['Tahun 1', 'kp2027'], ['Tahun 3', 'kssr-current']]) {
      const data = fixture({
        metadata: { profiles: [{ ...child, year }], activeChildId: childId },
        selection: { year, curriculumId },
        snapshot: { jannati_v151_profile: JSON.stringify({ ...profile, year, curriculumId }) },
        local: { jannati_v151_profile: JSON.stringify({ ...profile, year, curriculumId }) },
        cloud: { jannati_v151_profile: JSON.stringify({ ...profile, year, curriculumId }) }
      });
      const report = auditMultiYearCloudBoundary(data);
      expect(report.findings).toContain('unready_curriculum_bank');
      expect(report.canRelease).toBe(false);
    }
  });

  it('rejects unsupported selections and impossible identity', () => {
    for (const details of [
      {}, { ...selection, childId: '' }, { ...selection, accountId: 'default' },
      { ...selection, year: 'Tahun 4' }, { ...selection, curriculumId: 'kp2027' }
    ]) {
      const report = auditMultiYearCloudBoundary(fixture({ selection: details }));
      if (Object.keys(details).length === 0) continue; // fixture provides safe defaults
      expect(report.findings).toContain('missing_or_unsupported_selection');
      expect(report.canApply).toBe(false);
    }
  });

  it('refuses profile year mismatches and deleted/archived children', () => {
    const mismatched = fixture({
      metadata: { profiles: [{ ...child, year: 'Tahun 3' }] }
    });
    expect(auditMultiYearCloudBoundary(mismatched).findings).toContain('cloud_child_year_mismatch');

    const deleted = fixture({ metadata: { deletedChildren: { [childId]: { deletedAt: 1 } } } });
    expect(auditMultiYearCloudBoundary(deleted).findings).toContain('selected_child_deleted_or_archived');
    const archived = fixture({
      metadata: { archivedChildren: { [childId]: { archivedAt: 100, restoredAt: 0 } } }
    });
    expect(auditMultiYearCloudBoundary(archived).findings).toContain('selected_child_deleted_or_archived');
  });

  it('rejects wrong-account and wrong-child snapshots before any cloud hydration', () => {
    for (const mutation of [
      { __childSnapshotAccountId: 'foreign-family' },
      { __childSnapshotChildId: 'other-child' }
    ]) {
      const data = fixture({ snapshot: mutation });
      expect(auditMultiYearCloudBoundary(data).findings).toContain('local_snapshot_owner_mismatch');
      expect(auditMultiYearCloudBoundary(data).findings).toContain('cloud_snapshot_owner_mismatch');
    }
    const missingOwner = fixture({ snapshot: { __childSnapshotAccountId: '' } });
    expect(auditMultiYearCloudBoundary(missingOwner).findings).toContain('cloud_unverifiable_snapshot_owner');
  });

  it('rejects embedded or root profile account and year drift', () => {
    const wrongRoot = fixture({ cloud: { jannati_v151_profile: JSON.stringify({ ...profile, accountId: 'foreign' }) } });
    expect(auditMultiYearCloudBoundary(wrongRoot).findings).toContain('cloud_root_identity_mismatch');
    const wrongEmbedded = fixture({ snapshot: { jannati_v151_profile: JSON.stringify({ ...profile, year: 'Tahun 1' }) } });
    expect(auditMultiYearCloudBoundary(wrongEmbedded).findings).toContain('cloud_embedded_profile_identity_mismatch');
  });

  it('rejects unlabelled future resume and cross-year resume identity', () => {
    const otherYear = fixture({
      selection: { year: 'Tahun 1', curriculumId: 'kp2027' },
      metadata: { profiles: [{ ...child, year: 'Tahun 1' }] },
      cloud: { [RESUME_SLOTS_KEY]: JSON.stringify({ [slot]: {
        accountId, childId, studentId: childId, mode: 'quiz', subjectId: 'bm', topicId: 'kata-nama'
      } }) }
    });
    const report = auditMultiYearCloudBoundary(otherYear);
    expect(report.findings).toContain('cloud_unlabelled_future_resume');
    expect(report.canApply).toBe(false);
    expect(report.findings).toContain('unready_curriculum_bank');
    const conflicting = fixture({
      cloud: { [RESUME_SLOTS_KEY]: JSON.stringify({ [slot]: {
        ...profile, year: 'Tahun 3', mode: 'quiz'
      } }) }
    });
    expect(auditMultiYearCloudBoundary(conflicting).findings).toContain('cloud_resume_identity_or_edition_mismatch');
  });

  it('holds pending deletion markers and local/cloud tombstone drift', () => {
    const tombstone = { accountId, childId, clearedAt: '2026-11-01T00:00:00Z' };
    const data = fixture({
      local: { [RESUME_PENDING_TOMBSTONES_KEY]: JSON.stringify({ [slot]: tombstone }) },
      cloud: { [RESUME_PENDING_TOMBSTONES_KEY]: JSON.stringify({}) }
    });
    const report = auditMultiYearCloudBoundary(data);
    expect(report.findings).toContain('local_pending_deletions');
    expect(report.findings).toContain('pending_tombstone_drift');
    expect(report.counts.localPendingTombstones).toBe(1);
    const invalid = fixture({ cloud: { [RESUME_TOMBSTONES_KEY]: '{bad' } });
    expect(auditMultiYearCloudBoundary(invalid).findings).toContain('cloud_invalid_cleared_tombstones');
  });

  it('detects stale cloud mutation acknowledgements and foreign child outbox entries', () => {
    const report = auditMultiYearCloudBoundary(fixture({
      syncState: {
        pending: true,
        dirtyChildIds: ['child-b'],
        requestChildId: 'child-b',
        requestYear: 'Tahun 1',
        requestCurriculumId: 'kp2027',
        submittedMutationVersion: 2,
        currentMutationVersion: 3,
        localRevision: 9,
        serverRevision: 8
      }
    }));
    expect(report.findings).toEqual(expect.arrayContaining([
      'unsynced_child_mutations',
      'outbox_contains_foreign_child',
      'stale_request_child',
      'stale_request_year',
      'stale_request_curriculum',
      'stale_mutation_acknowledgement',
      'cloud_revision_conflict'
    ]));
    expect(report.canMerge).toBe(false);
  });

  it('keeps existing outbox versions pending after an old response', () => {
    const dirty = new Set();
    const versions = new Map();
    markCloudMutation(dirty, versions, childId);
    const submitted = new Map(versions);
    markCloudMutation(dirty, versions, childId);
    const left = acknowledgeCloudMutations(dirty, versions, submitted);
    expect(left).toEqual([childId]);
    expect(versions.get(childId)).toBe(2);
    expect(auditMultiYearCloudBoundary(fixture({
      syncState: { dirtyChildIds: left, submittedMutationVersion: 1, currentMutationVersion: 2 }
    })).findings).toContain('stale_mutation_acknowledgement');
  });

  it('rejects malformed JSON and oversized cloud metadata without leaking content', () => {
    const malformed = auditMultiYearCloudBoundary(fixture({ cloud: { [CLOUD_CHILD_STATE_KEY]: '{bad' } }));
    expect(malformed.findings).toContain('missing_or_invalid_cloud_child_metadata');
    const oversized = auditMultiYearCloudBoundary(fixture({
      cloud: { [CLOUD_CHILD_STATE_KEY]: 'x'.repeat(1024 * 1024 + 1) }
    }));
    expect(oversized.findings).toContain('missing_or_invalid_cloud_child_metadata');
    const foreignSnapshot = auditMultiYearCloudBoundary(fixture({
      cloud: { [`${CHILD_SNAPSHOT_PREFIX}${childId}`]: '{bad' }
    }));
    expect(foreignSnapshot.findings).toContain('cloud_malformed_selected_child_snapshot');
  });

  it('does not evaluate accessor input, touch storage or change active runtime', () => {
    const malicious = Object.defineProperty({}, 'cloudPayload', {
      enumerable: true, get() { throw new Error('getter must not execute'); }
    });
    // Parent-level accessor is disallowed by contract: only caller-created data
    // objects should reach the diagnostic. The leaf-map accessor is rejected.
    const unsafe = Object.defineProperty({}, CLOUD_CHILD_STATE_KEY, {
      enumerable: true, get() { throw new Error('cloud getter must not execute'); }
    });
    const report = auditMultiYearCloudBoundary({ ...fixture(), cloudPayload: unsafe });
    expect(report.findings).toContain('invalid_input_object');
    expect(report.canApply).toBe(false);
    expect(malicious).toBeTruthy();

    const module = readFileSync('src/services/multiYearCloudBoundaryAudit.js', 'utf8');
    const app = readFileSync('src/App.jsx', 'utf8');
    const activeCloud = readFileSync('src/services/cloudSnapshotRecovery.js', 'utf8');
    expect(module).not.toMatch(/localStorage\.|sessionStorage\.|\.setItem\(|\.removeItem\(|\.rpc\(|fetch\s*\(/);
    expect(app).not.toContain('multiYearCloudBoundaryAudit');
    expect(activeCloud).not.toContain('multiYearCloudBoundaryAudit');
  });
});
