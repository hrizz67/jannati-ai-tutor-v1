import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { acknowledgeCloudMutations, markCloudMutation } from '../../src/services/cloudMutationOutbox.js';
import { createYear2AsyncOwnerGate } from '../../src/services/yearOwnedAsyncSubjectGate.js';

const app = readFileSync('src/App.jsx', 'utf8');
const owner = {
  accountId: 'synthetic-account-a',
  childId: 'synthetic-child-a',
  year: 'Tahun 2'
};

function deferred() {
  let resolve;
  const promise = new Promise(next => { resolve = next; });
  return { promise, resolve };
}

async function commitOwnedRestore({ gate, lease, pendingChanges = () => false, result, commit }) {
  const value = await result;
  if (!gate.isCurrent(lease) || pendingChanges()) return false;
  commit(value);
  return true;
}

describe('M1-J stale cloud restore ownership', () => {
  it('MJ-01 rejects a delayed manual cloud result after logout/account replacement', async () => {
    const gate = createYear2AsyncOwnerGate(owner);
    const lease = gate.capture();
    const response = deferred();
    const writes = [];
    const completion = commitOwnedRestore({
      gate,
      lease,
      result: response.promise,
      commit: value => writes.push(value)
    });

    gate.setOwner({ ...owner, accountId: 'synthetic-account-b' });
    response.resolve({ profile: 'must-not-hydrate' });
    expect(await completion).toBe(false);
    expect(writes).toEqual([]);
  });

  it('MJ-02/MJ-03 rejects child switch and ABA completions', async () => {
    const gate = createYear2AsyncOwnerGate(owner);
    const oldLease = gate.capture();
    gate.setOwner({ ...owner, childId: 'synthetic-child-b' });
    expect(gate.isCurrent(oldLease)).toBe(false);
    gate.setOwner(owner);
    expect(gate.isCurrent(oldLease)).toBe(false);
    expect(gate.isCurrent(gate.capture())).toBe(true);
  });

  it('MJ-04/MJ-06 preserves a new mutation or tombstone created while the read is pending', async () => {
    const gate = createYear2AsyncOwnerGate(owner);
    const lease = gate.capture();
    const response = deferred();
    let pending = false;
    const writes = [];
    const completion = commitOwnedRestore({
      gate,
      lease,
      pendingChanges: () => pending,
      result: response.promise,
      commit: value => writes.push(value)
    });

    pending = true;
    response.resolve({ deletedResume: 'must-not-revive' });
    expect(await completion).toBe(false);
    expect(writes).toEqual([]);
  });

  it('MJ-11 keeps per-child outbox versions after out-of-order acknowledgement', () => {
    const dirty = new Set();
    const versions = new Map();
    markCloudMutation(dirty, versions, 'synthetic-child-a');
    markCloudMutation(dirty, versions, 'synthetic-child-b');
    const submitted = new Map(versions);
    markCloudMutation(dirty, versions, 'synthetic-child-a');

    expect(acknowledgeCloudMutations(dirty, versions, submitted)).toEqual(['synthetic-child-a']);
    expect(versions.get('synthetic-child-a')).toBe(2);
    expect(versions.has('synthetic-child-b')).toBe(false);
  });

  it('wires an independent account/child/year gate into manual and realtime cloud restores', () => {
    expect(app).toContain('const cloudRestoreGateRef = useRef(null);');
    expect(app).toContain('cloudRestoreGateRef.current = createYear2AsyncOwnerGate();');
    expect(app).toContain('cloudRestoreGateRef.current.setOwner({');

    const realtime = app.slice(
      app.indexOf('const handleCloudData = async cloudResult => {'),
      app.indexOf("void import('./services/learningSyncEgress.js')")
    );
    expect(realtime).toContain('const restoreLease = cloudRestoreGateRef.current.capture();');
    expect(realtime).toContain('const isCurrentOwner = () => !cancelled');
    expect(realtime).toContain('cloudRestoreGateRef.current.isCurrent(restoreLease)');
    expect(realtime).toMatch(/if \(hasPendingCloudChanges\(accountId\)\)[\s\S]+?queueCloudLearningSave/);
    expect(realtime).toMatch(/restoreCloudLearningSnapshotResult\([\s\S]+?\(\) => isCurrentRestore\(\)/);
    expect(realtime).toMatch(/if \(!restoreResult \|\| !isCurrentRestore\(\)\) return;/);
    expect(realtime.indexOf('skipNextCloudSaveRef.current = true;'))
      .toBeGreaterThan(realtime.indexOf('if (!restoreResult || !isCurrentRestore()) return;'));

    const manual = app.slice(
      app.indexOf('async function loadLearningDataNow()'),
      app.indexOf('function isQuestionResumeMode')
    );
    expect(manual).toContain('const operationAccountId = accountUser.id;');
    expect(manual).toContain('const restoreLease = cloudRestoreGateRef.current.capture();');
    expect(manual).toContain('cloudRestoreGateRef.current.isCurrent(restoreLease)');
    expect(manual).toContain('!hasPendingCloudChanges(operationAccountId)');
    expect(manual).toMatch(/restoreCloudLearningSnapshotResult\([\s\S]+?\(\) => isCurrent\(\)/);
    expect(manual).toContain('if (!isCurrent()) return;');
    expect(manual).toContain('if (!restoreResult) {');
    expect(manual).toContain('hasPendingCloudChanges(operationAccountId)');
    expect(manual).toMatch(/finally \{[\s\S]+?hasPendingCloudChanges\(operationAccountId\)[\s\S]+?queueCloudLearningSave/);
    expect(manual.indexOf('dirtyChildIdsRef.current.clear();'))
      .toBeGreaterThan(manual.indexOf('if (!restoreResult) {'));
  });

  it('invalidates cloud restore leases synchronously on child switch, child creation and logout', () => {
    const selectChild = app.slice(
      app.indexOf('function handleSelectChild(childId)'),
      app.indexOf('function handleCreateChild(')
    );
    expect(selectChild).toContain('cloudRestoreGateRef.current.invalidate();');
    expect(selectChild.indexOf('cloudRestoreGateRef.current.invalidate();'))
      .toBeLessThan(selectChild.indexOf('setActiveChildId(target.id);'));

    const createChild = app.slice(
      app.indexOf('function handleCreateChild('),
      app.indexOf('function handleRenameChild(')
    );
    expect(createChild).toContain('cloudRestoreGateRef.current.invalidate();');

    const logout = app.slice(
      app.indexOf('async function logoutAccount()'),
      app.indexOf('function exitLocalProfile()')
    );
    expect(logout).toContain('cloudRestoreGateRef.current.invalidate();');
  });
});
