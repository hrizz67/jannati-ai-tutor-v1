import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  acknowledgeCloudMutations,
  applyCloudPostSaveEffects,
  markCloudMutation
} from '../../src/services/cloudMutationOutbox.js';
import { createCloudRevisionAcceptancePolicy } from '../../src/services/cloudRevisionAcceptance.js';
import {
  acknowledgeResumeTombstones,
  RESUME_PENDING_TOMBSTONES_KEY,
  RESUME_TOMBSTONES_KEY
} from '../../src/utils/resumeStorage.js';

const ACCOUNT_ID = 'synthetic-account-a';
const ACTIVE_CHILD_ID = 'synthetic-child-a';
const OTHER_CHILD_ID = 'synthetic-child-b';
const CHILD_SNAPSHOT_PREFIX = 'jannati_child_snapshot:';
const CHILD_ORIGINAL_SNAPSHOT_PREFIX = 'jannati_child_original_snapshot:';
const CHILD_MERGED_BACKUP_PREFIX = 'jannati_merged_child_backup:';
const CLOUD_CHILD_STATE_KEY = 'jannati_cloud_child_state_v3';
const CLOUD_SYNC_META_KEY = 'jannati_cloud_sync_meta_v3';
const DELETED_CHILDREN_KEY = 'jannati_deleted_child_profiles';

class MemoryStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
  }

  get length() { return this.values.size; }

  key(index) { return [...this.values.keys()][index] ?? null; }

  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }

  setItem(key, value) { this.values.set(String(key), String(value)); }

  removeItem(key) { this.values.delete(String(key)); }
}

function loadApplyMergedCloudMetadata(overrides = {}) {
  const app = readFileSync(process.env.M1M_APP_SOURCE || 'src/App.jsx', 'utf8');
  const source = app.slice(
    app.indexOf('function applyMergedCloudMetadata('),
    app.indexOf('\nfunction clearAccountData()', app.indexOf('function applyMergedCloudMetadata('))
  );
  const storage = overrides.storage || new MemoryStorage();
  const profiles = overrides.profiles || [
    { id: ACTIVE_CHILD_ID, name: 'Child A' },
    { id: OTHER_CHILD_ID, name: 'Child B' }
  ];
  const persistBoundedChildSnapshot = overrides.persistBoundedChildSnapshot
    || vi.fn((target, key, raw) => {
      target.setItem(key, raw);
      return { ok: true, persisted: true, reason: 'ok', failedKey: '' };
    });
  const dependencies = {
    localStorage: storage,
    CLOUD_CHILD_STATE_KEY,
    CLOUD_SYNC_META_KEY,
    DELETED_CHILDREN_KEY,
    ACTIVE_CHILD_KEY: 'active-child',
    CHILD_SNAPSHOT_PREFIX,
    CHILD_ORIGINAL_SNAPSHOT_PREFIX,
    CHILD_MERGED_BACKUP_PREFIX,
    readChildProfiles: () => profiles,
    writeChildProfiles: vi.fn(),
    writeArchivedChildren: vi.fn(),
    captureChildSnapshot: vi.fn(() => true),
    persistBoundedChildSnapshot,
    persistChildRecoverySnapshot: overrides.persistChildRecoverySnapshot
      || vi.fn((key, raw) => persistBoundedChildSnapshot(storage, key, raw, { removeExistingOnLimit: true })),
    resolveChildSnapshot: vi.fn(childId => {
      const raw = storage.getItem(`${CHILD_SNAPSHOT_PREFIX}${childId}`)
        || storage.getItem(`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${childId}`);
      return raw ? JSON.parse(raw) : null;
    }),
    restoreChildSnapshot: vi.fn(() => true),
    ...overrides
  };
  const names = Object.keys(dependencies);
  const values = Object.values(dependencies);
  const applyMergedCloudMetadata = Function(
    ...names,
    `'use strict'; ${source}; return applyMergedCloudMetadata;`
  )(...values);
  return { applyMergedCloudMetadata, dependencies, storage };
}

function cloudPayload(extra = {}) {
  return {
    [CLOUD_CHILD_STATE_KEY]: JSON.stringify({
      profiles: [
        { id: ACTIVE_CHILD_ID, name: 'Child A' },
        { id: OTHER_CHILD_ID, name: 'Child B' }
      ],
      activeChildId: ACTIVE_CHILD_ID,
      deletedChildren: {},
      archivedChildren: {}
    }),
    [CLOUD_SYNC_META_KEY]: JSON.stringify({ activeChildId: ACTIVE_CHILD_ID }),
    [`${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`]: JSON.stringify({
      __childSnapshotChildId: ACTIVE_CHILD_ID,
      __childSnapshotAccountId: ACCOUNT_ID,
      score: '11'
    }),
    ...extra
  };
}

describe('M1-M independent post-integration residual integrity', () => {
  it.each([null, { score: 'B' }])('M1-N blocks a failed cross-child projection (%j)', fallback => {
    const storage = new MemoryStorage({ 'active-child': ACTIVE_CHILD_ID, root: 'A' });
    const restoreChildSnapshot = vi.fn(() => false);
    const harness = loadApplyMergedCloudMetadata({
      storage, restoreChildSnapshot, resolveChildSnapshot: () => fallback
    });
    const payload = { [CLOUD_CHILD_STATE_KEY]: JSON.stringify({
      profiles: [{ id: OTHER_CHILD_ID, name: 'Child B' }],
      deletedChildren: { [ACTIVE_CHILD_ID]: { deletedAt: 20 } }
    }) };
    const ack = vi.fn();
    expect(applyCloudPostSaveEffects({
      applyMetadata: () => harness.applyMergedCloudMetadata(payload, ACTIVE_CHILD_ID),
      acknowledgeMutations: ack
    })).toMatchObject({ ok: false });
    expect(ack).not.toHaveBeenCalled();
    expect(storage.getItem('active-child')).toBe(ACTIVE_CHILD_ID);
    expect(storage.getItem('root')).toBe('A');
  });

  it('M1-N initializes an empty child before publishing its identity', () => {
    const storage = new MemoryStorage({ 'active-child': ACTIVE_CHILD_ID, root: 'A' });
    const harness = loadApplyMergedCloudMetadata({
      storage,
      restoreChildSnapshot: (snapshot, childId, accountId, activate) => {
        expect(snapshot).toEqual({});
        expect(storage.getItem('active-child')).toBe(ACTIVE_CHILD_ID);
        storage.removeItem('root');
        if (activate) storage.setItem('active-child', childId);
        return true;
      }
    });
    expect(harness.applyMergedCloudMetadata({
      [CLOUD_CHILD_STATE_KEY]: JSON.stringify({ profiles: [{ id: OTHER_CHILD_ID, name: 'B' }] })
    }, ACTIVE_CHILD_ID)).toMatchObject({ persisted: true });
    expect(storage.getItem('root')).toBeNull();
    expect(storage.getItem('active-child')).toBe(OTHER_CHILD_ID);
  });
  it('MMR-CONTROL-01 applies mandatory active data directly when its optional cache hits quota', () => {
    const persistBoundedChildSnapshot = vi.fn((storage, key, raw) => {
      if (key === `${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`) {
        return {
          ok: false,
          persisted: false,
          reason: 'quota_exceeded',
          errorName: 'QuotaExceededError',
          failedKey: key
        };
      }
      storage.setItem(key, raw);
      return { ok: true, persisted: true, reason: 'ok', failedKey: '' };
    });
    const harness = loadApplyMergedCloudMetadata({ persistBoundedChildSnapshot });

    const result = harness.applyMergedCloudMetadata(cloudPayload(), ACTIVE_CHILD_ID, []);

    expect(result).toMatchObject({ persisted: true, activeChildId: ACTIVE_CHILD_ID });
    expect(harness.dependencies.restoreChildSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ __childSnapshotChildId: ACTIVE_CHILD_ID, score: '11' }),
      ACTIVE_CHILD_ID
    );
  });

  it('MMR-CONTROL-02 applies mandatory active data when its optional cache is oversized', () => {
    const persistBoundedChildSnapshot = vi.fn((storage, key, raw) => {
      if (key === `${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`) {
        storage.removeItem(key);
        return {
          ok: true,
          persisted: false,
          reason: 'size_limit_exceeded',
          errorName: '',
          failedKey: key
        };
      }
      storage.setItem(key, raw);
      return { ok: true, persisted: true, reason: 'ok', failedKey: '' };
    });
    const harness = loadApplyMergedCloudMetadata({ persistBoundedChildSnapshot });

    expect(harness.applyMergedCloudMetadata(cloudPayload(), ACTIVE_CHILD_ID, []))
      .toMatchObject({ persisted: true, activeChildId: ACTIVE_CHILD_ID });
    expect(harness.dependencies.restoreChildSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ score: '11' }),
      ACTIVE_CHILD_ID
    );
  });

  it('MMR-03 keeps a partial inactive cache write optional after applying the active projection', () => {
    const persistBoundedChildSnapshot = vi.fn((storage, key, raw) => {
      if (key === `${CHILD_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`) {
        return { ok: false, persisted: false, reason: 'write_failed', errorName: 'StorageReadbackError', failedKey: key };
      }
      storage.setItem(key, raw);
      return { ok: true, persisted: true, reason: 'ok', failedKey: '' };
    });
    const harness = loadApplyMergedCloudMetadata({ persistBoundedChildSnapshot });
    const payload = cloudPayload({
      [`${CHILD_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`]: JSON.stringify({
        __childSnapshotChildId: OTHER_CHILD_ID,
        __childSnapshotAccountId: ACCOUNT_ID,
        score: '7'
      })
    });

    expect(harness.applyMergedCloudMetadata(payload, ACTIVE_CHILD_ID, []))
      .toMatchObject({ persisted: true, activeChildId: ACTIVE_CHILD_ID });
    expect(harness.storage.getItem(`${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`)).not.toBeNull();
    expect(harness.storage.getItem(`${CHILD_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`)).toBeNull();
    expect(harness.dependencies.restoreChildSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ score: '11' }),
      ACTIVE_CHILD_ID
    );
  });

  it('MMR-CONTROL-04 fails the local commit when the active projection restore rolls back', () => {
    const restoreChildSnapshot = vi.fn(() => false);
    const harness = loadApplyMergedCloudMetadata({ restoreChildSnapshot });

    expect(harness.applyMergedCloudMetadata(cloudPayload(), ACTIVE_CHILD_ID, []))
      .toMatchObject({ persisted: false });
  });

  it('MMR-CONTROL-05 rejects a required snapshot with conflicting child ownership', () => {
    const restoreChildSnapshot = vi.fn((snapshot, childId) => (
      snapshot.__childSnapshotChildId === childId
      && snapshot.__childSnapshotAccountId === ACCOUNT_ID
    ));
    const harness = loadApplyMergedCloudMetadata({ restoreChildSnapshot });
    const payload = cloudPayload({
      [`${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`]: JSON.stringify({
        __childSnapshotChildId: OTHER_CHILD_ID,
        __childSnapshotAccountId: ACCOUNT_ID,
        score: 'conflicting-owner'
      })
    });

    expect(harness.applyMergedCloudMetadata(payload, ACTIVE_CHILD_ID, []))
      .toMatchObject({ persisted: false });
    expect(restoreChildSnapshot).toHaveBeenCalledTimes(1);
  });

  it('MMR-CONTROL-06 preserves a newer pending mutation for an inactive child', () => {
    const harness = loadApplyMergedCloudMetadata();
    const payload = cloudPayload({
      [`${CHILD_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`]: JSON.stringify({
        __childSnapshotChildId: OTHER_CHILD_ID,
        __childSnapshotAccountId: ACCOUNT_ID,
        score: 'server-old'
      })
    });

    expect(harness.applyMergedCloudMetadata(payload, ACTIVE_CHILD_ID, [OTHER_CHILD_ID]))
      .toMatchObject({ persisted: true });
    expect(harness.dependencies.persistBoundedChildSnapshot)
      .not.toHaveBeenCalledWith(
        expect.anything(),
        `${CHILD_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`,
        expect.anything(),
        expect.anything()
      );
  });

  it('MMR-07 does not upgrade optional recovery-cache failure into mandatory data loss', () => {
    const persistBoundedChildSnapshot = vi.fn((storage, key, raw) => {
      if (key.startsWith(CHILD_ORIGINAL_SNAPSHOT_PREFIX) || key.startsWith(CHILD_MERGED_BACKUP_PREFIX)) {
        return { ok: false, persisted: false, reason: 'quota_exceeded', errorName: 'QuotaExceededError', failedKey: key };
      }
      storage.setItem(key, raw);
      return { ok: true, persisted: true, reason: 'ok', failedKey: '' };
    });
    const harness = loadApplyMergedCloudMetadata({ persistBoundedChildSnapshot });
    const payload = cloudPayload({
      [`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`]: JSON.stringify({ backup: 'optional' }),
      [`${CHILD_MERGED_BACKUP_PREFIX}audit`]: JSON.stringify({ backup: 'optional' })
    });

    expect(harness.applyMergedCloudMetadata(payload, ACTIVE_CHILD_ID, []))
      .toMatchObject({ persisted: true });
    expect(harness.dependencies.restoreChildSnapshot).toHaveBeenCalledTimes(1);
  });

  it('MMR-08 preserves the authoritative local projection for a newer pending mutation', () => {
    const persistBoundedChildSnapshot = vi.fn(() => {
      throw new Error('the active cloud snapshot must be skipped');
    });
    const harness = loadApplyMergedCloudMetadata({ persistBoundedChildSnapshot });

    expect(harness.applyMergedCloudMetadata(cloudPayload(), ACTIVE_CHILD_ID, [ACTIVE_CHILD_ID]))
      .toMatchObject({ persisted: true, activeChildId: ACTIVE_CHILD_ID });
    expect(harness.dependencies.captureChildSnapshot).toHaveBeenCalledWith(ACTIVE_CHILD_ID, { force: true });
    expect(harness.dependencies.restoreChildSnapshot).not.toHaveBeenCalled();
  });

  it('MMR-09 preserves durable resume tombstones when mutation acknowledgement throws', () => {
    const scope = `${ACTIVE_CHILD_ID}::quiz::bm::kata-nama`;
    const tombstone = {
      accountId: ACCOUNT_ID,
      childId: ACTIVE_CHILD_ID,
      clearedAt: '2026-11-20T00:00:00.000Z'
    };
    const storage = new MemoryStorage({
      [RESUME_TOMBSTONES_KEY]: JSON.stringify({ [scope]: tombstone }),
      [RESUME_PENDING_TOMBSTONES_KEY]: JSON.stringify({ [scope]: tombstone }),
      [`jannati_cloud_dirty_children:${ACCOUNT_ID}`]: JSON.stringify([ACTIVE_CHILD_ID])
    });
    const dirty = new Set([ACTIVE_CHILD_ID]);
    const versions = new Map([[ACTIVE_CHILD_ID, 1]]);

    const result = applyCloudPostSaveEffects({
      applyMetadata: () => ({ persisted: true, activeChildId: ACTIVE_CHILD_ID }),
      acknowledgeResume: () => acknowledgeResumeTombstones({ [scope]: tombstone }, storage, ACCOUNT_ID),
      acknowledgeMutations() { throw new Error('injected mutation acknowledgement failure'); }
    });

    expect(result).toMatchObject({ ok: false, phase: 'outbox_acknowledgement' });
    expect(JSON.parse(storage.getItem(RESUME_TOMBSTONES_KEY))).toEqual({ [scope]: tombstone });
    expect(storage.getItem(RESUME_PENDING_TOMBSTONES_KEY)).toBeNull();
    expect([...dirty]).toEqual([ACTIVE_CHILD_ID]);
    expect([...versions]).toEqual([[ACTIVE_CHILD_ID, 1]]);
    expect(JSON.parse(storage.getItem(`jannati_cloud_dirty_children:${ACCOUNT_ID}`)))
      .toEqual([ACTIVE_CHILD_ID]);
  });

  it('MMR-10 recovers a mutation after an exception following its in-memory acknowledgement', () => {
    const dirty = new Set();
    const versions = new Map();
    markCloudMutation(dirty, versions, ACTIVE_CHILD_ID);
    const submitted = new Map(versions);
    const storage = new MemoryStorage({
      [`jannati_cloud_dirty_children:${ACCOUNT_ID}`]: JSON.stringify([ACTIVE_CHILD_ID])
    });

    const result = applyCloudPostSaveEffects({
      applyMetadata: () => ({ persisted: true, activeChildId: ACTIVE_CHILD_ID }),
      acknowledgeResume: () => false,
      acknowledgeMutations() {
        acknowledgeCloudMutations(dirty, versions, submitted);
        throw new Error('crash after in-memory acknowledgement');
      }
    });

    expect(result).toMatchObject({ ok: false, phase: 'outbox_acknowledgement' });
    expect([...dirty]).toEqual([]);
    const reloadedDirty = new Set(JSON.parse(storage.getItem(`jannati_cloud_dirty_children:${ACCOUNT_ID}`)));
    expect([...reloadedDirty]).toEqual([ACTIVE_CHILD_ID]);
  });

  it('MMR-11 keeps an identical revision retryable and rejects ownership/ABA changes', () => {
    const owner = { accountId: ACCOUNT_ID, childId: ACTIVE_CHILD_ID, year: 'Tahun 2' };
    const policy = createCloudRevisionAcceptancePolicy(owner);
    const envelope = {
      revision: 19,
      protocolVersion: 3,
      serverUpdatedAt: '2026-11-20T00:00:19.000Z',
      data: { score: 19 },
      error: null
    };
    const originalLease = policy.capture();
    expect(policy.accept(originalLease, envelope, { accountId: ACCOUNT_ID }))
      .toMatchObject({ accepted: true, advanced: true });
    expect(policy.accept(originalLease, envelope, { accountId: ACCOUNT_ID }))
      .toMatchObject({ accepted: true, advanced: false });

    policy.setOwner({ ...owner, childId: OTHER_CHILD_ID });
    expect(policy.accept(originalLease, envelope, { accountId: ACCOUNT_ID }))
      .toMatchObject({ accepted: false, reason: 'stale_owner' });
    const childBLease = policy.capture();
    policy.setOwner(owner);
    expect(policy.accept(childBLease, envelope, { accountId: ACCOUNT_ID }))
      .toMatchObject({ accepted: false, reason: 'stale_owner' });
  });

  it('MMR-12 keeps deleted-child tombstones authoritative without requiring a cache write', () => {
    const storage = new MemoryStorage({
      [`${CHILD_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`]: JSON.stringify({ score: 'old' }),
      [`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`]: JSON.stringify({ score: 'backup' })
    });
    const persistBoundedChildSnapshot = vi.fn((target, key, raw) => {
      target.setItem(key, raw);
      return { ok: true, persisted: true, reason: 'ok', failedKey: '' };
    });
    const harness = loadApplyMergedCloudMetadata({ storage, persistBoundedChildSnapshot });
    const payload = cloudPayload();
    payload[CLOUD_CHILD_STATE_KEY] = JSON.stringify({
      profiles: [{ id: ACTIVE_CHILD_ID, name: 'Child A' }],
      activeChildId: ACTIVE_CHILD_ID,
      deletedChildren: { [OTHER_CHILD_ID]: { deletedAt: 20 } },
      archivedChildren: {}
    });

    expect(harness.applyMergedCloudMetadata(payload, ACTIVE_CHILD_ID, []))
      .toMatchObject({ persisted: true });
    expect(storage.getItem(`${CHILD_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`)).toBeNull();
    expect(storage.getItem(`${CHILD_ORIGINAL_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`)).toBeNull();
    expect(JSON.parse(storage.getItem(DELETED_CHILDREN_KEY)))
      .toEqual({ [OTHER_CHILD_ID]: { deletedAt: 20 } });
    expect(persistBoundedChildSnapshot)
      .not.toHaveBeenCalledWith(
        expect.anything(),
        `${CHILD_SNAPSHOT_PREFIX}${OTHER_CHILD_ID}`,
        expect.anything(),
        expect.anything()
      );
  });
});
