import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createCloudRevisionAcceptancePolicy } from '../../src/services/cloudRevisionAcceptance.js';
import { loadCloudLearningDataIfChanged } from '../../src/services/learningSyncEgress.js';

const app = readFileSync('src/App.jsx', 'utf8');
const OWNER = {
  accountId: 'synthetic-account-a',
  childId: 'synthetic-child-a',
  year: 'Tahun 2'
};

const envelope = (revision, data = { score: revision }) => ({
  revision,
  protocolVersion: 3,
  serverUpdatedAt: `2026-11-19T00:00:${String(revision).padStart(2, '0')}Z`,
  data,
  error: null
});

function createReadClient(result) {
  const calls = [];
  return {
    calls,
    client: {
      rpc(name) {
        calls.push(name);
        if (name === 'get_learning_revision_v1') {
          return Promise.resolve({
            data: {
              revision: result.revision,
              protocolVersion: result.protocolVersion,
              serverUpdatedAt: result.serverUpdatedAt
            },
            error: null
          });
        }
        if (name === 'get_learning_data_v3') {
          return Promise.resolve({
            data: {
              revision: result.revision,
              protocolVersion: result.protocolVersion,
              serverUpdatedAt: result.serverUpdatedAt,
              payload: result.data
            },
            error: null
          });
        }
        throw new Error(`Unexpected RPC ${name}`);
      }
    }
  };
}

function createRecoveryHarness(owner = OWNER) {
  const policy = createCloudRevisionAcceptancePolicy(owner);
  let committedEnvelope = null;
  return {
    policy,
    reserve(result, lease = policy.capture(), accountId = owner.accountId) {
      return policy.accept(lease, result, { accountId });
    },
    commit(acceptance) {
      const committed = policy.commit(acceptance?.token);
      if (committed) committedEnvelope = committed;
      return { committed: Boolean(committed), envelope: committed };
    },
    get committedEnvelope() { return committedEnvelope; },
    get knownRevision() { return committedEnvelope?.revision || 0; }
  };
}

describe('M1-L failed cloud restore recovery', () => {
  it('ML-01 does not publish a revision when its local restore fails', () => {
    const harness = createRecoveryHarness();
    const acceptance = harness.reserve(envelope(12));

    expect(acceptance).toMatchObject({ accepted: true, advanced: true });
    // A failed local restore deliberately does not commit the reservation.
    expect(harness.committedEnvelope).toBeNull();
    expect(harness.knownRevision).toBe(0);
  });

  it('ML-02 fetches and commits an unchanged server revision on retry', async () => {
    const harness = createRecoveryHarness();
    const original = envelope(12, { score: 12, topic: 'BM' });
    const failedAcceptance = harness.reserve(original);
    expect(failedAcceptance.accepted).toBe(true);

    const read = createReadClient(original);
    const retryResult = await loadCloudLearningDataIfChanged(read.client, {
      knownRevision: harness.knownRevision
    });
    expect(retryResult).toMatchObject({ changed: true, revision: 12, data: original.data });
    expect(read.calls).toEqual(['get_learning_revision_v1', 'get_learning_data_v3']);

    const retryAcceptance = harness.reserve(retryResult);
    expect(retryAcceptance).toMatchObject({ accepted: true, advanced: false });
    expect(harness.commit(retryAcceptance)).toMatchObject({ committed: true });
    expect(harness.knownRevision).toBe(12);
  });

  it('ML-03 lets a newer revision supersede a failed restore without permitting late commit', () => {
    const harness = createRecoveryHarness();
    const failedRevision = harness.reserve(envelope(12));
    const newerRevision = harness.reserve(envelope(13));

    expect(harness.commit(newerRevision)).toMatchObject({ committed: true });
    expect(harness.commit(failedRevision)).toMatchObject({ committed: false });
    expect(harness.committedEnvelope?.data).toEqual({ score: 13 });
  });

  it('ML-04 preserves pending mutations and tombstones until a valid server acknowledgement commits', () => {
    const harness = createRecoveryHarness();
    const local = { pendingMutation: true, tombstonePending: true, acknowledgements: 0 };
    const readAcceptance = harness.reserve(envelope(8, {
      deletedChildren: { 'synthetic-child-a': { deletedAt: 10 } }
    }));

    // A read that races a local mutation must not publish or acknowledge it.
    expect(readAcceptance.accepted).toBe(true);
    expect(harness.committedEnvelope).toBeNull();
    expect(local).toEqual({ pendingMutation: true, tombstonePending: true, acknowledgements: 0 });

    const acknowledgedWrite = harness.reserve(envelope(9, {
      deletedChildren: { 'synthetic-child-a': { deletedAt: 20 } }
    }));
    expect(harness.commit(acknowledgedWrite).committed).toBe(true);
    local.pendingMutation = false;
    local.tombstonePending = false;
    local.acknowledgements += 1;
    expect(local).toEqual({ pendingMutation: false, tombstonePending: false, acknowledgements: 1 });
  });

  it('ML-05 rejects account, child and ABA commits from an obsolete ownership epoch', () => {
    const harness = createRecoveryHarness();
    const childA = harness.reserve(envelope(7));

    harness.policy.setOwner({ ...OWNER, childId: 'synthetic-child-b' });
    expect(harness.commit(childA)).toMatchObject({ committed: false });
    const childB = harness.reserve(envelope(7), harness.policy.capture());
    harness.policy.setOwner(OWNER);
    expect(harness.commit(childB)).toMatchObject({ committed: false });
    expect(harness.commit(childA)).toMatchObject({ committed: false });

    const freshChildA = harness.reserve(envelope(7), harness.policy.capture());
    expect(harness.commit(freshChildA)).toMatchObject({ committed: true });

    const accountA = harness.reserve(envelope(8));
    harness.policy.setOwner({ ...OWNER, accountId: 'synthetic-account-b' });
    expect(harness.commit(accountA)).toMatchObject({ committed: false });
  });

  it('publishes accepted revisions only after the relevant local operation succeeds', () => {
    const remember = app.slice(
      app.indexOf('function rememberCloudEnvelope('),
      app.indexOf('function queueCloudLearningSave(')
    );
    expect(remember).not.toContain('cloudEnvelopeRef.current = acceptance.envelope;');
    expect(remember).toContain('function commitCloudEnvelope(');
    expect(remember).toContain('cloudRestoreGateRef.current.commit(acceptance?.token)');

    const write = app.slice(
      app.indexOf('const syncResult = await syncRevisionedCloudLearning'),
      app.indexOf('function scheduleCloudLearningSave')
    );
    expect(write.indexOf('commitCloudEnvelope(acceptance)')).toBeGreaterThan(-1);
    expect(write.indexOf('commitCloudEnvelope(acceptance)')).toBeLessThan(write.indexOf('acknowledgeResumeTombstones'));
    expect(write.indexOf('commitCloudEnvelope(acceptance)')).toBeLessThan(write.indexOf('acknowledgeCloudMutations'));

    const hydration = app.slice(
      app.indexOf('const syncAccount = async (user, syncSequence) => {'),
      app.indexOf('const requestAccountSync = user => {')
    );
    const hydrationPersistedCheck = hydration.indexOf('if (!restoreResult.activeStatePersisted)');
    const hydrationRestoreCommit = hydration.indexOf('commitCloudEnvelope(cloudAcceptance)', hydrationPersistedCheck);
    expect(hydrationRestoreCommit).toBeGreaterThan(hydrationPersistedCheck);
    expect(hydrationRestoreCommit).toBeLessThan(hydration.indexOf("setCloudSyncStatus(cloudProtocolRequiresUpgrade ? 'upgrade-required' : 'loaded');"));

    const realtime = app.slice(
      app.indexOf('const handleCloudData = async cloudResult => {'),
      app.indexOf("void import('./services/learningSyncEgress.js')")
    );
    const realtimePersistedCheck = realtime.indexOf('if (!restoreResult.activeStatePersisted)');
    const realtimeRestoreCommit = realtime.indexOf('commitCloudEnvelope(acceptance)', realtimePersistedCheck);
    expect(realtimeRestoreCommit).toBeGreaterThan(realtimePersistedCheck);
    expect(realtimeRestoreCommit)
      .toBeLessThan(realtime.indexOf('lastCloudSignatureRef.current = cloudSignature;'));

    const manual = app.slice(app.indexOf('async function loadLearningDataNow()'), app.indexOf('function isQuestionResumeMode'));
    const manualPersistedCheck = manual.indexOf('if (!restoreResult.activeStatePersisted)');
    const manualRestoreCommit = manual.indexOf('commitCloudEnvelope(acceptance)', manualPersistedCheck);
    expect(manualRestoreCommit).toBeGreaterThan(manualPersistedCheck);
    expect(manualRestoreCommit)
      .toBeLessThan(manual.indexOf('setPendingCloudMutation(operationAccountId, false);'));
  });
});
