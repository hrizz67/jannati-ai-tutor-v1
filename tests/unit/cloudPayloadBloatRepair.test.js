import { beforeAll, describe, expect, it } from 'vitest';
import {
  MAX_CLOUD_LEARNING_PAYLOAD_BYTES,
  compactCloudLearningPayload,
  getCloudLearningPayloadSizeError,
  measureCloudLearningPayloadBytes
} from '../../src/services/cloudPayloadCompaction.js';
import {
  acknowledgeCloudMutations,
  markCloudMutation
} from '../../src/services/cloudMutationOutbox.js';
import {
  CHILD_MERGED_BACKUP_PREFIX,
  CHILD_ORIGINAL_SNAPSHOT_PREFIX,
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  mergeCloudLearningPayload,
  normalizeActiveLearningProjection
} from '../../src/services/learningSync.js';
import { syncRevisionedCloudLearning } from '../../src/services/learningSyncCoordinator.js';
import {
  auditCloudPayloadBloat,
  buildCloudPayloadBloatFixture
} from '../../scripts/validate/cloudPayloadBloatAudit.mjs';

const FOUR_MIB = 4 * 1024 * 1024;
const EXPECTED_MERGED_BYTES = 12_201_702;
const EXPECTED_COMPACTED_BYTES = 2_724_392;

function parse(raw) {
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

describe('P1.13.4 cloud payload bloat repair', () => {
  let fixture;
  let merged;
  let compacted;

  beforeAll(() => {
    fixture = buildCloudPayloadBloatFixture();
    merged = mergeCloudLearningPayload(fixture.local, fixture.cloud, {
      accountId: fixture.accountId,
      localActiveChildId: fixture.activeChildId,
      dirtyChildIds: [fixture.activeChildId],
      mergeDirtySnapshots: true,
      deviceId: 'payload-repair-test'
    });
    compacted = compactCloudLearningPayload(merged, [fixture.local, fixture.cloud], {
      accountId: fixture.accountId,
      childId: fixture.activeChildId
    });
  });

  it('reduces the deterministic oversized merged envelope below the preferred 4 MiB target', () => {
    const audit = auditCloudPayloadBloat();
    expect(audit.mergedBytes).toBe(EXPECTED_MERGED_BYTES);
    expect(audit.transportBytes).toBe(EXPECTED_COMPACTED_BYTES);
    expect(audit.transportBytes).toBeLessThan(FOUR_MIB);
    expect(audit.transportBytes).toBeLessThan(MAX_CLOUD_LEARNING_PAYLOAD_BYTES);
    expect(audit.duplicatedTransportBytes).toBe(0);
    expect(audit.beforeCompaction.categories[0]).toMatchObject({ category: 'merged child backups', bytes: 4_504_028 });
    expect(audit.afterCompaction.categories[0]).toMatchObject({ category: 'active child snapshot', bytes: 2_251_320 });
  });

  it('keeps active XP, coins, progress, mastery and history in the canonical snapshot', () => {
    const snapshot = parse(compacted[`${CHILD_SNAPSHOT_PREFIX}${fixture.activeChildId}`]);
    const profile = parse(snapshot.jannati_v151_profile);
    expect(profile).toMatchObject({ xp: 1155, coins: 87, stars: 87 });
    expect(profile.progress.bm.reading).toEqual({ completed: 35, mastery: 88 });
    expect(profile.history).toHaveLength(1);
  });

  it('keeps adaptive, gamification, student-core and AI-memory state without duplicate root copies', () => {
    const snapshot = parse(compacted[`${CHILD_SNAPSHOT_PREFIX}${fixture.activeChildId}`]);
    expect(parse(snapshot['jannati.adaptive.studentProfile'])).toMatchObject({ xp: 1155, mastery: { bm: 88, math: 74 } });
    expect(parse(snapshot['jannati.gamification.profile'])).toMatchObject({ xp: 1155, coins: 87, stars: 87 });
    expect(parse(snapshot.jannati_v152_student_core).core).toMatchObject({ xp: 1155, progress: { bm: 88 } });
    expect(parse(snapshot.jannati_v151_ai_memory).notes).toHaveLength(1);
    expect(compacted).not.toHaveProperty('jannati_v151_profile');
    expect(compacted).not.toHaveProperty('jannati.adaptive.studentProfile');
    expect(compacted).not.toHaveProperty('jannati.gamification.profile');
    expect(compacted).not.toHaveProperty('jannati_v151_ai_memory');
  });

  it('reconstructs the active root projection losslessly for refresh-equivalent hydration', () => {
    const hydrated = normalizeActiveLearningProjection(compacted, fixture.activeChildId, {
      accountId: fixture.accountId
    });
    expect(parse(hydrated.jannati_v151_profile)).toMatchObject({ xp: 1155, coins: 87, stars: 87 });
    expect(parse(hydrated.jannati_v151_profile).progress.bm.reading.mastery).toBe(88);
    expect(parse(hydrated['jannati.adaptive.studentProfile']).xp).toBe(1155);
    expect(parse(hydrated['jannati.gamification.profile']).coins).toBe(87);
    expect(parse(hydrated.jannati_v151_ai_memory).notes).toHaveLength(1);
  });

  it('preserves account-level resume slots', () => {
    const slots = parse(compacted.jannati_v152_resume_slots);
    expect(Object.values(slots)).toHaveLength(1);
    expect(Object.values(slots)[0]).toMatchObject({
      accountId: fixture.accountId,
      childId: fixture.activeChildId,
      currentIndex: 1,
      questionIds: ['BM-1', 'BM-2']
    });
  });

  it('preserves profiles, archive and delete tombstones in canonical child-state metadata', () => {
    const metadata = parse(compacted[CLOUD_CHILD_STATE_KEY]);
    expect(metadata.profiles.map(profile => profile.id)).toEqual([fixture.activeChildId, fixture.otherChildId]);
    expect(metadata.deletedChildren).toHaveProperty('audit-deleted-child');
    expect(metadata.archivedChildren[fixture.archivedChildId].profile).toMatchObject({ xp: 280, coins: 19 });
    expect(compacted).not.toHaveProperty('jannati_child_profiles');
    expect(compacted).not.toHaveProperty('jannati_active_child_id');
    expect(compacted).not.toHaveProperty('jannati_deleted_child_profiles');
    expect(compacted).not.toHaveProperty('jannati_archived_child_profiles');
  });

  it('does not turn a deleted child original into a live canonical snapshot', () => {
    const deletedChildId = 'audit-deleted-child';
    const originalKey = `${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${deletedChildId}`;
    const liveKey = `${CHILD_SNAPSHOT_PREFIX}${deletedChildId}`;
    const original = JSON.stringify({
      __childSnapshotChildId: deletedChildId,
      __childSnapshotAccountId: fixture.accountId,
      __childSnapshotCapturedAt: 1_791_331_200_000,
      jannati_v151_profile: JSON.stringify({ id: deletedChildId, xp: 99 })
    });
    const result = compactCloudLearningPayload({
      [CLOUD_CHILD_STATE_KEY]: compacted[CLOUD_CHILD_STATE_KEY],
      [originalKey]: original
    }, [], { accountId: fixture.accountId, childId: fixture.activeChildId });
    expect(result[originalKey]).toBe(original);
    expect(result).not.toHaveProperty(liveKey);
  });

  it('preserves non-active child learning while collapsing only its redundant original copy', () => {
    const other = parse(compacted[`${CHILD_SNAPSHOT_PREFIX}${fixture.otherChildId}`]);
    expect(parse(other.jannati_v151_profile)).toMatchObject({ xp: 640, coins: 44, stars: 44 });
    expect(parse(other.jannati_v151_profile).progress.math.numbers.mastery).toBe(81);
    expect(compacted).not.toHaveProperty(`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${fixture.otherChildId}`);
  });

  it('strips full copies only from a known merged-child backup and preserves unsafe recovery records', () => {
    const validKey = `${CHILD_MERGED_BACKUP_PREFIX}audit-legacy-alias`;
    const valid = parse(compacted[validKey]);
    expect(valid).toMatchObject({ canonicalId: fixture.activeChildId, aliasId: 'audit-legacy-alias' });
    expect(valid).not.toHaveProperty('snapshot');
    expect(valid).not.toHaveProperty('originalSnapshot');

    const unsafeKey = `${CHILD_MERGED_BACKUP_PREFIX}quarantine`;
    const unsafe = JSON.stringify({ reason: 'manual-recovery', snapshot: '{not-json}' });
    const result = compactCloudLearningPayload({ ...compacted, [unsafeKey]: unsafe }, [], {
      accountId: fixture.accountId,
      childId: fixture.activeChildId
    });
    expect(result[unsafeKey]).toBe(unsafe);
  });

  it('uses the cached revision, writes once, and sends the compacted recovery envelope', async () => {
    let writes = 0;
    let sent = null;
    const result = await syncRevisionedCloudLearning({
      async rpc(name, args) {
        expect(name).toBe('save_learning_data_v4');
        writes += 1;
        sent = args;
        return { data: { ok: true, revision: 1233, payload: args.payload }, error: null };
      }
    }, fixture.local, {
      accountId: fixture.accountId,
      localActiveChildId: fixture.activeChildId,
      dirtyChildIds: [fixture.activeChildId],
      cloudEnvelope: { data: fixture.cloud, revision: 1232, protocolVersion: 3, error: null },
      retryBaseDelayMs: 0
    });

    expect(result).toMatchObject({ ok: true, revision: 1233, conflictCount: 0 });
    expect(writes).toBe(1);
    expect(sent.expected_revision).toBe(1232);
    expect(measureCloudLearningPayloadBytes(sent.payload)).toBeLessThanOrEqual(EXPECTED_COMPACTED_BYTES);
    expect(measureCloudLearningPayloadBytes(sent.payload)).toBeLessThan(FOUR_MIB);
  });

  it('recompacts a conflict envelope monotonically and keeps revision retries bounded', async () => {
    const revisions = [];
    const sentPayloads = [];
    const result = await syncRevisionedCloudLearning({
      async rpc(_name, args) {
        revisions.push(args.expected_revision);
        sentPayloads.push(args.payload);
        if (revisions.length === 1) {
          return {
            data: {
              ok: false,
              conflict: true,
              revision: 1233,
              payload: fixture.cloud,
              serverUpdatedAt: 'revision-1233'
            },
            error: null
          };
        }
        return { data: { ok: true, revision: 1234, payload: args.payload }, error: null };
      }
    }, fixture.local, {
      accountId: fixture.accountId,
      localActiveChildId: fixture.activeChildId,
      dirtyChildIds: [fixture.activeChildId],
      cloudEnvelope: { data: fixture.cloud, revision: 1232, protocolVersion: 3, error: null },
      retryBaseDelayMs: 0
    });

    expect(revisions).toEqual([1232, 1233]);
    expect(result).toMatchObject({ ok: true, revision: 1234, conflictCount: 1 });
    expect(sentPayloads.every(payload => measureCloudLearningPayloadBytes(payload) < FOUR_MIB)).toBe(true);
    const finalProfile = parse(parse(result.payload[`${CHILD_SNAPSHOT_PREFIX}${fixture.activeChildId}`]).jannati_v151_profile);
    expect(finalProfile).toMatchObject({ xp: 1155, coins: 87, stars: 87 });
  });

  it('keeps a failed mutation pending and acknowledges one submitted version exactly once', async () => {
    const dirty = new Set();
    const versions = new Map();
    markCloudMutation(dirty, versions, fixture.activeChildId);
    const submitted = new Map(versions);

    const failed = await syncRevisionedCloudLearning({
      async rpc() {
        return { data: null, error: { status: 503, code: 'PGRST002', message: 'unavailable' } };
      }
    }, fixture.local, {
      accountId: fixture.accountId,
      localActiveChildId: fixture.activeChildId,
      dirtyChildIds: [...dirty],
      cloudEnvelope: { data: fixture.cloud, revision: 1232, protocolVersion: 3, error: null },
      transportMaxAttempts: 1,
      retryBaseDelayMs: 0
    });
    expect(failed.ok).toBe(false);
    expect([...dirty]).toEqual([fixture.activeChildId]);

    const success = await syncRevisionedCloudLearning({
      async rpc(_name, args) {
        return { data: { ok: true, revision: 1233, payload: args.payload }, error: null };
      }
    }, fixture.local, {
      accountId: fixture.accountId,
      localActiveChildId: fixture.activeChildId,
      dirtyChildIds: [...dirty],
      cloudEnvelope: { data: fixture.cloud, revision: 1232, protocolVersion: 3, error: null },
      retryBaseDelayMs: 0
    });
    expect(success.ok).toBe(true);
    expect(acknowledgeCloudMutations(dirty, versions, submitted)).toEqual([]);
    expect(acknowledgeCloudMutations(dirty, versions, submitted)).toEqual([]);
    expect(versions.size).toBe(0);
  });

  it('keeps the unchanged 7 MiB guard for genuinely oversized canonical data', () => {
    const error = getCloudLearningPayloadSizeError({ canonical: 'x'.repeat(MAX_CLOUD_LEARNING_PAYLOAD_BYTES + 1) });
    expect(error).toMatchObject({
      code: 'CLIENT_PAYLOAD_TOO_LARGE',
      maxPayloadBytes: MAX_CLOUD_LEARNING_PAYLOAD_BYTES,
      retryable: false
    });
  });
});
