import { describe, expect, it } from 'vitest';
import {
  CLOUD_WRITE_DEBOUNCE_MS,
  createCloudActivityWritePolicy
} from '../../src/services/cloudActivityWritePolicy.js';
import {
  CLOUD_CHILD_STATE_KEY,
  CLOUD_SYNC_META_KEY,
  saveRevisionedCloudLearningData,
  syncRevisionedCloudLearning
} from '../../src/services/learningSync.js';
import {
  compactCloudLearningPayload,
  measureCloudLearningPayloadBytes
} from '../../src/services/cloudPayloadCompaction.js';

const CHILD_ID = 'child-bandwidth-fixture';
const ACCOUNT_ID = 'account-bandwidth-fixture';

function canonicalPayload({ xp = 25, updatedAt = '2026-10-01T00:00:00.000Z' } = {}) {
  const profile = { id: CHILD_ID, childId: CHILD_ID, accountId: ACCOUNT_ID, name: 'Murid', year: 'Tahun 2', xp };
  return {
    [CLOUD_CHILD_STATE_KEY]: JSON.stringify({
      version: 3,
      profiles: [profile],
      activeChildId: CHILD_ID,
      deletedChildren: {},
      archivedChildren: {}
    }),
    jannati_child_profiles: JSON.stringify([profile]),
    jannati_active_child_id: CHILD_ID,
    jannati_deleted_child_profiles: '{}',
    jannati_archived_child_profiles: '{}',
    jannati_v151_profile: JSON.stringify(profile),
    [`jannati_child_snapshot:${CHILD_ID}`]: JSON.stringify({
      __childSnapshotChildId: CHILD_ID,
      __childSnapshotAccountId: ACCOUNT_ID,
      __childSnapshotCapturedAt: 1_759_276_800_000,
      jannati_v151_profile: JSON.stringify(profile)
    }),
    [CLOUD_SYNC_META_KEY]: JSON.stringify({
      version: 3,
      activeChildId: CHILD_ID,
      deviceId: 'baseline-device',
      updatedAt
    })
  };
}

describe('P1.13.2 Supabase bandwidth safety', () => {
  it('keeps the network debounce at 700ms or longer', () => {
    expect(CLOUD_WRITE_DEBOUNCE_MS).toBe(700);
  });

  it('coalesces five answers and activity completion into one bounded flush', () => {
    const policy = createCloudActivityWritePolicy();
    let writes = 0;
    let reads = 0;
    policy.begin({ activityId: 'quiz:five-questions', childId: CHILD_ID });

    for (let index = 0; index < 5; index += 1) {
      if (!policy.deferMutation(CHILD_ID)) writes += 1;
    }
    expect(writes).toBe(0);
    expect(policy.snapshot().deferredMutations).toBe(5);

    const completion = policy.finish();
    if (completion.shouldFlush) writes += 1;
    expect(writes).toBe(1);
    expect(reads).toBe(0);
    expect(policy.finish().shouldFlush).toBe(false);
  });

  it('does not defer unrelated child mutations and resets cleanly', () => {
    const policy = createCloudActivityWritePolicy();
    policy.begin({ activityId: 'quiz', childId: CHILD_ID });
    expect(policy.deferMutation('another-child')).toBe(false);
    expect(policy.deferMutation(CHILD_ID)).toBe(true);
    policy.reset();
    expect(policy.snapshot()).toEqual({ active: false, activityId: '', childId: '', deferredMutations: 0 });
  });

  it('performs no RPC when canonical learning state is unchanged', async () => {
    const cloud = canonicalPayload();
    const local = canonicalPayload({ updatedAt: '2026-10-05T00:00:00.000Z' });
    let rpcCalls = 0;
    const result = await syncRevisionedCloudLearning({
      async rpc() {
        rpcCalls += 1;
        throw new Error('unchanged state must not reach Supabase');
      }
    }, local, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: cloud, revision: 9, protocolVersion: 3, serverUpdatedAt: 'revision-9', error: null }
    });

    expect(result.ok).toBe(true);
    expect(result.unchanged).toBe(true);
    expect(result.localNoop).toBe(true);
    expect(result.revision).toBe(9);
    expect(rpcCalls).toBe(0);
  });

  it('uses the cached envelope for one reconnect write, then no-ops repeated sync', async () => {
    const cloud = canonicalPayload();
    const local = canonicalPayload({ xp: 30, updatedAt: '2026-10-05T00:00:00.000Z' });
    const calls = [];
    const client = {
      async rpc(name, args) {
        calls.push({ name, args });
        return {
          data: { ok: true, unchanged: false, duplicate: false, conflict: false, revision: 10, serverUpdatedAt: 'revision-10' },
          error: null
        };
      }
    };
    const first = await syncRevisionedCloudLearning(client, local, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: cloud, revision: 9, protocolVersion: 3, serverUpdatedAt: 'revision-9', error: null },
      retryBaseDelayMs: 0
    });
    const second = await syncRevisionedCloudLearning(client, local, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: first.payload, revision: 10, protocolVersion: 3, serverUpdatedAt: 'revision-10', error: null },
      retryBaseDelayMs: 0
    });

    expect(first.ok).toBe(true);
    expect(second.localNoop).toBe(true);
    expect(calls.filter(call => call.name === 'save_learning_data_v4')).toHaveLength(1);
    expect(calls.filter(call => call.name.startsWith('get_learning_'))).toHaveLength(0);
  });

  it('caps failed transport retries without a busy loop', async () => {
    let attempts = 0;
    const result = await saveRevisionedCloudLearningData({
      async rpc() {
        attempts += 1;
        return { data: null, error: { status: 503, message: 'Temporarily unavailable' } };
      }
    }, {
      payload: canonicalPayload({ xp: 31 }),
      transportMaxAttempts: 99,
      retryBaseDelayMs: 0
    });
    expect(result.ok).toBe(false);
    expect(attempts).toBe(3);
  });

  it('caps conflict reconciliation without recursive or unbounded retries', async () => {
    let attempts = 0;
    const cloud = canonicalPayload();
    const local = canonicalPayload({ xp: 32 });
    const result = await syncRevisionedCloudLearning({
      async rpc() {
        attempts += 1;
        return {
          data: {
            ok: false,
            unchanged: false,
            duplicate: false,
            conflict: true,
            payload: cloud,
            revision: 9 + attempts,
            serverUpdatedAt: `revision-${9 + attempts}`
          },
          error: null
        };
      }
    }, local, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: cloud, revision: 9, protocolVersion: 3, serverUpdatedAt: 'revision-9', error: null },
      maxAttempts: 99,
      transportMaxAttempts: 1,
      retryBaseDelayMs: 0
    });
    expect(result.ok).toBe(false);
    expect(result.conflict).toBe(true);
    expect(attempts).toBe(5);
  });

  it('keeps the deterministic v3.13.15 canonical payload fixture byte-identical', () => {
    const raw = canonicalPayload({ xp: 30 });
    raw.jannati_v152_resume_slots = JSON.stringify({
      [`${CHILD_ID}::quiz::math::numbers`]: {
        version: 1,
        accountId: ACCOUNT_ID,
        childId: CHILD_ID,
        mode: 'quiz',
        subjectId: 'math',
        topicId: 'numbers',
        questionIds: ['MATH-1', 'MATH-2'],
        currentIndex: 1,
        updatedAt: '2026-10-01T00:00:00.000Z'
      }
    });
    const compacted = compactCloudLearningPayload(raw, [raw], { accountId: ACCOUNT_ID, childId: CHILD_ID });
    const v31315Baseline = { rawBytes: 1820, compactedBytes: 2176 };

    expect(measureCloudLearningPayloadBytes(raw)).toBe(v31315Baseline.rawBytes);
    expect(measureCloudLearningPayloadBytes(compacted)).toBe(v31315Baseline.compactedBytes);
    expect(compacted).not.toHaveProperty('transcript');
    expect(compacted).not.toHaveProperty('audio');
  });

  it('removes transient transcript, audio and diagnostics from cloud resume payloads', () => {
    const raw = canonicalPayload();
    raw.jannati_v152_resume_slots = JSON.stringify({
      [`${CHILD_ID}::reading`]: {
        version: 1,
        accountId: ACCOUNT_ID,
        childId: CHILD_ID,
        mode: 'reading',
        state: {
          passageId: 'reading-1',
          transcript: 'transient learner transcript',
          speechTranscript: 'transient speech draft',
          audio: 'data:audio/webm;base64,never-upload',
          diagnostics: { provider: 'local-only' },
          result: { score: 80, completed: false }
        },
        updatedAt: '2026-10-01T00:00:00.000Z'
      }
    });

    const compacted = compactCloudLearningPayload(raw, [raw], { accountId: ACCOUNT_ID, childId: CHILD_ID });
    const serialized = compacted.jannati_v152_resume_slots;
    expect(serialized).not.toContain('transient learner transcript');
    expect(serialized).not.toContain('transient speech draft');
    expect(serialized).not.toContain('never-upload');
    expect(serialized).not.toContain('local-only');
    expect(serialized).toContain('"score":80');
  });
});
