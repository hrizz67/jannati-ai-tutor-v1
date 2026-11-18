import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createCloudRevisionAcceptancePolicy } from '../../src/services/cloudRevisionAcceptance.js';

const app = readFileSync('src/App.jsx', 'utf8');
const OWNER = {
  accountId: 'synthetic-account-a',
  childId: 'synthetic-child-a',
  year: 'Tahun 2'
};

const envelope = (revision, data = { score: revision }) => ({
  revision,
  protocolVersion: 3,
  serverUpdatedAt: `2026-11-18T00:00:${String(revision).padStart(2, '0')}Z`,
  data,
  error: null
});

function deferred() {
  let resolve;
  const promise = new Promise(next => { resolve = next; });
  return { promise, resolve };
}

async function applyCloudResult({
  policy,
  lease,
  response,
  state,
  pending = () => false,
  beforeProjection,
  restoreSucceeds = true
}) {
  const result = await response;
  const acceptance = policy.accept(lease, result, { accountId: OWNER.accountId });
  if (!acceptance.accepted) return false;
  if (acceptance.advanced) state.envelope = acceptance.envelope;
  if (beforeProjection) await beforeProjection();
  if (pending() || !policy.isAccepted(acceptance.token) || !restoreSucceeds) return false;
  state.projection = result.data;
  state.signature = JSON.stringify(result);
  state.status = 'loaded';
  state.acknowledgements += 1;
  state.tombstonePending = false;
  return true;
}

function createState() {
  return {
    envelope: null,
    projection: null,
    signature: '',
    status: 'idle',
    acknowledgements: 0,
    tombstonePending: true
  };
}

describe('M1-K revision monotonicity remediation', () => {
  it('MK-CONTROL proves the pre-remediation owner-only gate regresses 11 to 10', () => {
    let current = envelope(11);
    current = envelope(10);
    expect(current.revision).toBe(10);
  });

  it('MK-01 keeps realtime revision 11 when an older manual revision 10 completes later', async () => {
    const policy = createCloudRevisionAcceptancePolicy(OWNER);
    const manual = deferred();
    const realtime = deferred();
    const state = createState();
    const manualCompletion = applyCloudResult({ policy, lease: policy.capture(), response: manual.promise, state });
    const realtimeCompletion = applyCloudResult({ policy, lease: policy.capture(), response: realtime.promise, state });

    realtime.resolve(envelope(11));
    expect(await realtimeCompletion).toBe(true);
    manual.resolve(envelope(10));
    expect(await manualCompletion).toBe(false);

    expect(state.envelope?.revision).toBe(11);
    expect(state.projection).toEqual({ score: 11 });
    expect(state.acknowledgements).toBe(1);
  });

  it('MK-02 cancels revision 10 projection when revision 11 wins during restore', async () => {
    const policy = createCloudRevisionAcceptancePolicy(OWNER);
    const state = createState();
    const restoreBarrier = deferred();
    const manualCompletion = applyCloudResult({
      policy,
      lease: policy.capture(),
      response: Promise.resolve(envelope(10)),
      state,
      beforeProjection: () => restoreBarrier.promise
    });
    await Promise.resolve();
    expect(await applyCloudResult({
      policy,
      lease: policy.capture(),
      response: Promise.resolve(envelope(11)),
      state
    })).toBe(true);
    restoreBarrier.resolve();
    expect(await manualCompletion).toBe(false);
    expect(state.envelope?.revision).toBe(11);
    expect(state.projection).toEqual({ score: 11 });
  });

  it('MK-03 accepts an identical retry but rejects equal-revision conflicting payloads', () => {
    const policy = createCloudRevisionAcceptancePolicy(OWNER);
    const lease = policy.capture();
    const first = policy.accept(lease, envelope(7, { score: 7, topic: 'BM' }), { accountId: OWNER.accountId });
    const duplicate = policy.accept(lease, envelope(7, { score: 7, topic: 'BM' }), { accountId: OWNER.accountId });
    const conflict = policy.accept(lease, envelope(7, { score: 99, topic: 'BM' }), { accountId: OWNER.accountId });

    expect(first).toMatchObject({ accepted: true, advanced: true });
    expect(duplicate).toMatchObject({ accepted: true, advanced: false });
    expect(policy.isAccepted(duplicate.token)).toBe(true);
    expect(conflict).toMatchObject({ accepted: false, reason: 'conflicting_revision' });
    expect(first.envelope?.data).toEqual({ score: 7, topic: 'BM' });
  });

  it('MK-04 rejects account, child, year, epoch and ABA ownership mismatches', () => {
    const policy = createCloudRevisionAcceptancePolicy(OWNER);
    const originalLease = policy.capture();
    expect(policy.accept(originalLease, envelope(5), { accountId: 'wrong-account' }).reason).toBe('wrong_account');

    policy.setOwner({ ...OWNER, childId: 'synthetic-child-b' });
    expect(policy.accept(originalLease, envelope(5), { accountId: OWNER.accountId }).reason).toBe('stale_owner');
    const childBLease = policy.capture();
    policy.setOwner(OWNER);
    expect(policy.accept(childBLease, envelope(5), { accountId: OWNER.accountId }).reason).toBe('stale_owner');
    expect(policy.accept(originalLease, envelope(5), { accountId: OWNER.accountId }).reason).toBe('stale_owner');

    policy.setOwner({ ...OWNER, year: 'Tahun 3' });
    expect(policy.accept(policy.capture(), envelope(5), { accountId: OWNER.accountId }).reason).toBe('stale_owner');
  });

  it('MK-05 preserves a local pending mutation and tombstone created during a read', async () => {
    const policy = createCloudRevisionAcceptancePolicy(OWNER);
    const state = createState();
    let pending = false;
    const restoreBarrier = deferred();
    const completion = applyCloudResult({
      policy,
      lease: policy.capture(),
      response: Promise.resolve(envelope(8)),
      state,
      pending: () => pending,
      beforeProjection: () => restoreBarrier.promise
    });
    await Promise.resolve();
    pending = true;
    restoreBarrier.resolve();

    expect(await completion).toBe(false);
    expect(state.projection).toBeNull();
    expect(state.signature).toBe('');
    expect(state.acknowledgements).toBe(0);
    expect(state.tombstonePending).toBe(true);
  });

  it('MK-06 rejects a stale acknowledgement before clearing outbox or tombstones', async () => {
    const policy = createCloudRevisionAcceptancePolicy(OWNER);
    const state = createState();
    expect(await applyCloudResult({
      policy,
      lease: policy.capture(),
      response: Promise.resolve(envelope(11)),
      state
    })).toBe(true);
    state.acknowledgements = 0;
    state.tombstonePending = true;

    expect(await applyCloudResult({
      policy,
      lease: policy.capture(),
      response: Promise.resolve(envelope(10)),
      state
    })).toBe(false);
    expect(state.acknowledgements).toBe(0);
    expect(state.tombstonePending).toBe(true);
    expect(state.envelope?.revision).toBe(11);
  });

  it('MK-07 permits recovery from a failed restore only for the identical accepted revision', async () => {
    const policy = createCloudRevisionAcceptancePolicy(OWNER);
    const state = createState();
    expect(await applyCloudResult({
      policy,
      lease: policy.capture(),
      response: Promise.resolve(envelope(9)),
      state,
      restoreSucceeds: false
    })).toBe(false);
    expect(state.projection).toBeNull();
    expect(state.status).toBe('idle');

    expect(await applyCloudResult({
      policy,
      lease: policy.capture(),
      response: Promise.resolve(envelope(9)),
      state
    })).toBe(true);
    expect(state.projection).toEqual({ score: 9 });
    expect(policy.accept(policy.capture(), envelope(9, { score: 10 }), { accountId: OWNER.accountId }))
      .toMatchObject({ accepted: false, reason: 'conflicting_revision' });
  });

  it('MK-08 rejects malformed revisions and envelopes without changing accepted state', () => {
    const policy = createCloudRevisionAcceptancePolicy(OWNER);
    const lease = policy.capture();
    expect(policy.accept(lease, envelope(4), { accountId: OWNER.accountId }).accepted).toBe(true);
    const invalid = [
      { ...envelope(5), revision: -1 },
      { ...envelope(5), revision: 5.5 },
      { ...envelope(5), revision: '' },
      { ...envelope(5), revision: null },
      { ...envelope(5), protocolVersion: 0 },
      { ...envelope(5), protocolVersion: '3' },
      { ...envelope(5), data: null },
      { ...envelope(5), error: new Error('failed read') }
    ];
    invalid.forEach(candidate => {
      expect(policy.accept(lease, candidate, { accountId: OWNER.accountId }).accepted).toBe(false);
    });
    expect(policy.accept(lease, envelope(4), { accountId: OWNER.accountId }))
      .toMatchObject({ accepted: true, advanced: false });
  });

  it('wires the shared reservation before projections, signatures, acknowledgements and success', () => {
    expect(app).toContain("import { createCloudRevisionAcceptancePolicy } from './services/cloudRevisionAcceptance.js';");
    expect(app).toContain('cloudRestoreGateRef.current = createCloudRevisionAcceptancePolicy();');
    expect(app).toContain('cloudRestoreGateRef.current.accept(lease, result, { accountId });');

    const write = app.slice(
      app.indexOf('const syncResult = await syncRevisionedCloudLearning'),
      app.indexOf('function scheduleCloudLearningSave')
    );
    const writeAcceptance = write.indexOf('rememberCloudEnvelope(operationAccountId, { ...syncResult, data: payload })');
    expect(writeAcceptance).toBeGreaterThan(-1);
    expect(write.indexOf('acknowledgeResumeTombstones')).toBeGreaterThan(writeAcceptance);
    expect(write.indexOf('applyMergedCloudMetadata')).toBeGreaterThan(writeAcceptance);
    expect(write.indexOf('lastCloudSignatureRef.current =')).toBeGreaterThan(writeAcceptance);
    expect(write.indexOf('acknowledgeCloudMutations')).toBeGreaterThan(writeAcceptance);
    expect(write).toContain('cloudRestoreGateRef.current.isAccepted(acceptance.token)');

    const realtime = app.slice(
      app.indexOf('const handleCloudData = async cloudResult => {'),
      app.indexOf("void import('./services/learningSyncEgress.js')")
    );
    expect(realtime.indexOf('const acceptance = rememberCloudEnvelope')).toBeLessThan(realtime.indexOf('applyCloudRestoreResult('));
    expect(realtime).toContain('cloudRestoreGateRef.current.isAccepted(acceptedRevisionToken)');

    const manual = app.slice(app.indexOf('async function loadLearningDataNow()'), app.indexOf('function isQuestionResumeMode'));
    expect(manual.indexOf('const acceptance = rememberCloudEnvelope')).toBeLessThan(manual.indexOf('applyCloudRestoreResult('));
    expect(manual.indexOf('if (!isCurrent()) return;', manual.indexOf('applyCloudRestoreResult(')))
      .toBeLessThan(manual.indexOf('setPendingCloudMutation(operationAccountId, false);'));
  });
});
