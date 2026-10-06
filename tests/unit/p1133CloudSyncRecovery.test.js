import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createCloudActivityWritePolicy,
  resolveCloudSyncStatus
} from '../../src/services/cloudActivityWritePolicy.js';
import {
  acknowledgeCloudMutations,
  markCloudMutation
} from '../../src/services/cloudMutationOutbox.js';
import {
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  CLOUD_SYNC_META_KEY
} from '../../src/services/learningSync.js';
import { syncRevisionedCloudLearning } from '../../src/services/learningSyncCoordinator.js';

const ACCOUNT_ID = 'account-p1133';
const CHILD_ID = 'child-p1133';

function canonicalPayload(xp = 10) {
  const profile = { id: CHILD_ID, childId: CHILD_ID, accountId: ACCOUNT_ID, xp };
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
    [`${CHILD_SNAPSHOT_PREFIX}${CHILD_ID}`]: JSON.stringify({
      __childSnapshotChildId: CHILD_ID,
      __childSnapshotAccountId: ACCOUNT_ID,
      __childSnapshotCapturedAt: 1_759_276_800_000,
      jannati_v151_profile: JSON.stringify(profile)
    }),
    [CLOUD_SYNC_META_KEY]: JSON.stringify({
      version: 3,
      activeChildId: CHILD_ID,
      deviceId: 'p1133-device',
      updatedAt: '2026-10-01T00:00:00.000Z'
    })
  };
}

describe('P1.13.3 cloud sync state recovery', () => {
  it('maps every attempted save to a bounded terminal state', () => {
    expect(resolveCloudSyncStatus(true)).toBe('saved');
    expect(resolveCloudSyncStatus(false, 'idle')).toBe('idle');
    expect(resolveCloudSyncStatus(false, 'offline')).toBe('offline');
    expect(resolveCloudSyncStatus(false, 'conflict')).toBe('conflict');
    expect(resolveCloudSyncStatus(false, 'upgrade-required')).toBe('upgrade-required');
    expect(resolveCloudSyncStatus()).toBe('error');
  });

  it('defers an active quiz and flushes its mutations exactly once on completion', () => {
    const policy = createCloudActivityWritePolicy();
    policy.begin({ activityId: 'quiz:complete', childId: CHILD_ID });
    for (let index = 0; index < 5; index += 1) expect(policy.deferMutation(CHILD_ID)).toBe(true);

    expect(policy.snapshot()).toMatchObject({ active: true, deferredMutations: 5 });
    expect(policy.finish()).toMatchObject({ wasActive: true, shouldFlush: true, deferredMutations: 5 });
    expect(policy.finish()).toMatchObject({ wasActive: false, shouldFlush: false, deferredMutations: 0 });
  });

  it('flushes an abandoned partial quiz once when the learner returns to the dashboard', () => {
    const policy = createCloudActivityWritePolicy();
    policy.begin({ activityId: 'quiz:partial', childId: CHILD_ID });
    for (let index = 0; index < 3; index += 1) expect(policy.deferMutation(CHILD_ID)).toBe(true);

    const backBoundary = policy.finish();
    expect(backBoundary).toMatchObject({ shouldFlush: true, deferredMutations: 3 });
    expect(policy.snapshot().active).toBe(false);
    expect(policy.finish().shouldFlush).toBe(false);
  });

  it('settles a canonical no-op as saved without a cloud read or write', async () => {
    let rpcCalls = 0;
    const payload = canonicalPayload();
    const result = await syncRevisionedCloudLearning({
      async rpc() {
        rpcCalls += 1;
        throw new Error('No-op must not call Supabase');
      }
    }, payload, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: payload, revision: 2, protocolVersion: 3, error: null }
    });

    expect(result).toMatchObject({ ok: true, unchanged: true, localNoop: true });
    expect(resolveCloudSyncStatus(result.ok)).toBe('saved');
    expect(rpcCalls).toBe(0);
  });

  it('writes changed canonical state once from the cached envelope and settles saved', async () => {
    let writes = 0;
    let reads = 0;
    const cloud = canonicalPayload(10);
    const local = canonicalPayload(20);
    const result = await syncRevisionedCloudLearning({
      async rpc(name, args) {
        if (name.startsWith('get_learning_')) reads += 1;
        if (name === 'save_learning_data_v4') {
          writes += 1;
          return { data: { ok: true, revision: 3, payload: args.payload }, error: null };
        }
        throw new Error(`Unexpected RPC: ${name}`);
      }
    }, local, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: cloud, revision: 2, protocolVersion: 3, error: null },
      retryBaseDelayMs: 0
    });

    expect(result.ok).toBe(true);
    expect(resolveCloudSyncStatus(result.ok)).toBe('saved');
    expect({ writes, reads }).toEqual({ writes: 1, reads: 0 });
  });

  it('keeps a failed mutation queued and reconnects with one bounded write', async () => {
    const dirty = new Set();
    const versions = new Map();
    markCloudMutation(dirty, versions, CHILD_ID);
    const submitted = new Map(versions);
    const cloud = canonicalPayload(10);
    const local = canonicalPayload(20);
    let failedAttempts = 0;
    const failed = await syncRevisionedCloudLearning({
      async rpc() {
        failedAttempts += 1;
        return { data: null, error: { status: 503, message: 'unavailable' } };
      }
    }, local, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [...dirty],
      cloudEnvelope: { data: cloud, revision: 2, protocolVersion: 3, error: null },
      retryBaseDelayMs: 0
    });

    expect(failed.ok).toBe(false);
    expect(resolveCloudSyncStatus()).toBe('error');
    expect(failedAttempts).toBe(3);
    expect([...dirty]).toEqual([CHILD_ID]);

    let reconnectWrites = 0;
    const reconnected = await syncRevisionedCloudLearning({
      async rpc(name, args) {
        if (name === 'save_learning_data_v4') reconnectWrites += 1;
        return { data: { ok: true, revision: 3, payload: args.payload }, error: null };
      }
    }, local, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [...dirty],
      cloudEnvelope: { data: cloud, revision: 2, protocolVersion: 3, error: null },
      retryBaseDelayMs: 0
    });
    expect(reconnected.ok).toBe(true);
    expect(reconnectWrites).toBe(1);
    expect(acknowledgeCloudMutations(dirty, versions, submitted)).toEqual([]);
  });

  it('does not acknowledge a newer mutation completed during an older write', () => {
    const dirty = new Set();
    const versions = new Map();
    markCloudMutation(dirty, versions, CHILD_ID);
    const submitted = new Map(versions);
    markCloudMutation(dirty, versions, CHILD_ID);
    expect(acknowledgeCloudMutations(dirty, versions, submitted)).toEqual([CHILD_ID]);
  });

  it('wires deferred hydration and manual sync without a pre-emptive syncing state', () => {
    const source = readFileSync('src/App.jsx', 'utf8');
    const queueSource = source.slice(source.indexOf('function queueCloudLearningSave'), source.indexOf('function scheduleCloudLearningSave'));
    const manualSource = source.slice(source.indexOf('async function syncLearningDataNow'), source.indexOf('async function loadLearningDataNow'));
    const pendingBranch = manualSource.slice(manualSource.indexOf('if (hasPendingChanges)'), manualSource.indexOf('// A manual check'));

    expect(queueSource).toMatch(/isActive[\s\S]{0,250}resolveCloudSyncStatus\(false, 'idle'\)/);
    expect(queueSource).toMatch(/cloudHydratedAccountId !== operationAccountId[\s\S]{0,300}resolveCloudSyncStatus\(false, 'idle'\)/);
    expect(queueSource).toMatch(/try \{[\s\S]*finally \{[\s\S]{0,120}cloudWritePendingRef\.current = false/);
    expect(pendingBranch).not.toContain("setCloudSyncStatus('syncing')");
    expect(manualSource).toMatch(/cloudWritePendingRef\.current[\s\S]{0,220}return;/);
  });

  it('queues all durable pending forms once hydration completes', () => {
    const source = readFileSync('src/App.jsx', 'utf8');
    const hydrationEffect = source.slice(
      source.indexOf('if (skipNextCloudSaveRef.current)'),
      source.indexOf('useEffect(() => {', source.indexOf('if (skipNextCloudSaveRef.current)') + 1)
    );
    expect(hydrationEffect).toContain('pendingOfflineCloudSaveRef.current');
    expect(hydrationEffect).toContain('hasPendingCloudMutation(accountUser.id)');
    expect(hydrationEffect).toContain('dirtyChildIdsRef.current.size > 0');
    expect(hydrationEffect).toContain('hasPendingProfileReconciliation(accountUser.id)');
    expect(hydrationEffect.match(/queueCloudLearningSave\(\{ markMutation: false \}\)/g)).toHaveLength(1);
  });

  it('keeps retry available for stale syncing but disables it during a real write', () => {
    const source = readFileSync('src/dashboard/HomeDashboard.jsx', 'utf8');
    expect(source).toMatch(/syncing: \{[^\n]+retryable: true/);
    expect(source).toContain('cloudSyncPresentation.retryable && !syncInFlight');
  });

  it('uses the same activity boundary for normal and error-path quiz exits', () => {
    const source = readFileSync('src/App.jsx', 'utf8');
    const backSource = source.slice(source.indexOf('function handleQuizBack'), source.indexOf('function toggleBookmark'));
    const quizRender = source.slice(source.indexOf("if (screen === 'quiz')"), source.indexOf("if (screen === 'finish')"));
    expect(backSource).toMatch(/autoSave\(questionIndex, session\);\s*finishCloudLearningActivity\(\);\s*setScreen\('dashboard'\)/);
    expect(backSource).not.toContain('applyLearnerReward');
    expect(quizRender).toContain('onAction={handleQuizBack}');
  });
});
