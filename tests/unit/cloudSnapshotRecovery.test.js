import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_SNAPSHOT_PREFIX,
  LAST_RESTORE_DIAGNOSTIC_KEY,
  buildCloudRestorePlan,
  buildCompactAccountSnapshot,
  createLocalSnapshotDiagnostics,
  estimateStorageBytes,
  hydrateCloudLearningState,
  measureSnapshotStorage,
  persistBoundedChildSnapshot,
  pruneForeignAccountSnapshots,
  safeStorageSet,
  shouldBlockEmptyCloudWrite,
  shouldLoadStudentLearningForRoute
} from '../../src/services/cloudSnapshotRecovery.js';
import {
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY
} from '../../src/services/learningSync.js';

const ACCOUNT_ID = '3fceddeb-4468-4fec-87d3-476f2251f68c';
const ACTIVE_CHILD_ID = 'child-ae293f93-494b-44ff-84ee-e323f74c298e';
const SECOND_CHILD_ID = 'child-334ff219-6aca-4bd1-aad2-8973fd783b61';
const ORPHAN_CHILD_ID = 'child-9cf28317-legacy-orphan';

function createMemoryStorage(initial = {}, options = {}) {
  const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
  return {
    get length() { return values.size; },
    key(index) {
      if (options.failList) throw Object.assign(new Error('blocked'), { name: 'SecurityError' });
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      if (options.failGet?.(key)) throw Object.assign(new Error('blocked'), { name: 'SecurityError' });
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      const failure = options.failSet?.(key, String(value));
      if (failure) throw Object.assign(new Error(failure.message || 'write failed'), { name: failure.name || 'Error' });
      values.set(String(key), String(value));
    },
    removeItem(key) {
      const failure = options.failRemove?.(key);
      if (failure) throw Object.assign(new Error(failure.message || 'remove failed'), { name: failure.name || 'Error' });
      values.delete(String(key));
    },
    dump() { return Object.fromEntries(values); }
  };
}

function createProductionFixture({ largeActiveSnapshot = false, includeOrphan = true } = {}) {
  const profiles = [
    { id: ACTIVE_CHILD_ID, name: 'Fayadh', year: 'Tahun 2' },
    { id: SECOND_CHILD_ID, name: 'Fayadh', year: 'Tahun 2' }
  ];
  const activeSnapshot = {
    __childSnapshotChildId: ACTIVE_CHILD_ID,
    __childSnapshotAccountId: ACCOUNT_ID,
    __childSnapshotCapturedAt: 1_789_000_000_000,
    jannati_v151_profile: JSON.stringify({
      accountId: ACCOUNT_ID,
      childId: ACTIVE_CHILD_ID,
      name: 'Fayadh',
      year: 'Tahun 2',
      xp: 970
    }),
    'jannati.adaptive.studentProfile': JSON.stringify({ xp: 970, totalQuestions: 120 }),
    ...(largeActiveSnapshot
      ? { jannati_large_history: JSON.stringify({ events: ['x'.repeat(750_000)] }) }
      : {})
  };
  const secondSnapshot = {
    __childSnapshotChildId: SECOND_CHILD_ID,
    __childSnapshotAccountId: ACCOUNT_ID,
    jannati_v151_profile: JSON.stringify({ accountId: ACCOUNT_ID, childId: SECOND_CHILD_ID, xp: 40 })
  };
  const payload = {
    [CLOUD_CHILD_STATE_KEY]: JSON.stringify({
      version: 3,
      profiles,
      activeChildId: ACTIVE_CHILD_ID,
      deletedChildren: {},
      archivedChildren: {}
    }),
    jannati_child_profiles: JSON.stringify(profiles),
    jannati_active_child_id: ACTIVE_CHILD_ID,
    jannati_v151_profile: activeSnapshot.jannati_v151_profile,
    [`${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`]: JSON.stringify(activeSnapshot),
    [`${CHILD_SNAPSHOT_PREFIX}${SECOND_CHILD_ID}`]: JSON.stringify(secondSnapshot)
  };
  if (includeOrphan) {
    payload[`${CHILD_SNAPSHOT_PREFIX}${ORPHAN_CHILD_ID}`] = JSON.stringify({
      __childSnapshotChildId: ORPHAN_CHILD_ID,
      __childSnapshotAccountId: ACCOUNT_ID,
      jannati_v151_profile: JSON.stringify({ accountId: ACCOUNT_ID, childId: ORPHAN_CHILD_ID, xp: 10 })
    });
  }
  return payload;
}

describe('cloud snapshot recovery hotfix', () => {
  it('hydrates normal canonical cloud data before treating snapshots as cache', () => {
    const storage = createMemoryStorage();
    const result = hydrateCloudLearningState(storage, createProductionFixture(), { accountId: ACCOUNT_ID });

    expect(result.ok).toBe(true);
    expect(result.hydrated).toBe(true);
    expect(result.activeStatePersisted).toBe(true);
    expect(result.profiles).toHaveLength(2);
    expect(JSON.parse(storage.getItem('jannati_child_profiles'))).toHaveLength(2);
    expect(JSON.parse(storage.getItem('jannati_v151_profile')).xp).toBe(970);
  });

  it('keeps server profiles in memory when localStorage is unavailable', () => {
    const result = hydrateCloudLearningState(null, createProductionFixture(), { accountId: ACCOUNT_ID });

    expect(result.ok).toBe(true);
    expect(result.hydrated).toBe(true);
    expect(result.profiles).toHaveLength(2);
    expect(result.activeStatePersisted).toBe(false);
    expect(result.readOnly).toBe(true);
    expect(result.reason).toBe('storage_unavailable');
  });

  it('classifies quota failure without discarding canonical profiles', () => {
    const storage = createMemoryStorage({}, {
      failSet: () => ({ name: 'QuotaExceededError' })
    });
    const result = hydrateCloudLearningState(storage, createProductionFixture(), { accountId: ACCOUNT_ID });

    expect(result.ok).toBe(true);
    expect(result.profiles).toHaveLength(2);
    expect(result.reason).toBe('quota_exceeded');
    expect(result.readOnly).toBe(true);
  });

  it('prunes only stale account snapshots after authentication', () => {
    const currentKey = `${ACCOUNT_SNAPSHOT_PREFIX}${ACCOUNT_ID}`;
    const staleKey = `${ACCOUNT_SNAPSHOT_PREFIX}other-account`;
    const storage = createMemoryStorage({ [currentKey]: '{}', [staleKey]: '{}', unrelated: 'keep' });
    const result = pruneForeignAccountSnapshots(storage, ACCOUNT_ID);

    expect(result.ok).toBe(true);
    expect(storage.getItem(currentKey)).toBe('{}');
    expect(storage.getItem(staleKey)).toBeNull();
    expect(storage.getItem('unrelated')).toBe('keep');
  });

  it('does not require a pre-existing local account snapshot', () => {
    const storage = createMemoryStorage();
    const result = hydrateCloudLearningState(storage, createProductionFixture(), { accountId: ACCOUNT_ID });

    expect(result.hydrated).toBe(true);
    expect(storage.getItem(`${ACCOUNT_SNAPSHOT_PREFIX}${ACCOUNT_ID}`)).not.toBeNull();
  });

  it('rejects invalid canonical child metadata with a structured reason', () => {
    const result = buildCloudRestorePlan({ [CLOUD_CHILD_STATE_KEY]: '{bad-json' }, { accountId: ACCOUNT_ID });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('cloud_payload_invalid');
    expect(result.failedKey).toBe(CLOUD_CHILD_STATE_KEY);
  });

  it('skips an oversized child cache while retaining its active root projection', () => {
    const storage = createMemoryStorage();
    const result = hydrateCloudLearningState(storage, createProductionFixture({ largeActiveSnapshot: true }), {
      accountId: ACCOUNT_ID,
      maxChildSnapshotBytes: 100_000
    });

    expect(result.hydrated).toBe(true);
    expect(result.activeStatePersisted).toBe(true);
    expect(result.snapshotPersisted).toBe(false);
    expect(result.skippedLargeSnapshotKeys).toContain(`${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`);
    expect(storage.getItem('jannati_large_history')).not.toBeNull();
    expect(storage.getItem(`${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`)).toBeNull();
  });

  it('classifies orphan child snapshots without creating ghost profiles', () => {
    const plan = buildCloudRestorePlan(createProductionFixture(), { accountId: ACCOUNT_ID });

    expect(plan.profiles).toHaveLength(2);
    expect(plan.orphanSnapshotKeys).toContain(`${CHILD_SNAPSHOT_PREFIX}${ORPHAN_CHILD_ID}`);
    expect(plan.snapshotEntries[`${CHILD_SNAPSHOT_PREFIX}${ORPHAN_CHILD_ID}`]).toBeUndefined();
  });

  it('preserves two same-name children because IDs are authoritative', () => {
    const plan = buildCloudRestorePlan(createProductionFixture(), { accountId: ACCOUNT_ID });

    expect(plan.profiles.map(profile => profile.id)).toEqual([ACTIVE_CHILD_ID, SECOND_CHILD_ID]);
    expect(plan.duplicateNameGroups).toEqual([[ACTIVE_CHILD_ID, SECOND_CHILD_ID]]);
  });

  it('uses the valid server active child before a stale local preference', () => {
    const plan = buildCloudRestorePlan(createProductionFixture(), {
      accountId: ACCOUNT_ID,
      preferredChildId: SECOND_CHILD_ID,
      currentActiveChildId: SECOND_CHILD_ID
    });

    expect(plan.activeChildId).toBe(ACTIVE_CHILD_ID);
  });

  it('hydrates independently of an expired Premium entitlement', () => {
    const result = hydrateCloudLearningState(createMemoryStorage(), createProductionFixture(), {
      accountId: ACCOUNT_ID,
      entitlement: { status: 'expired' }
    });

    expect(result.hydrated).toBe(true);
    expect(result.profiles).toHaveLength(2);
  });

  it('skips student learning hydration on the Admin routes only', () => {
    expect(shouldLoadStudentLearningForRoute('#/admin')).toBe(false);
    expect(shouldLoadStudentLearningForRoute('#/admin/premium')).toBe(false);
    expect(shouldLoadStudentLearningForRoute('')).toBe(true);
    expect(shouldLoadStudentLearningForRoute('#/dashboard')).toBe(true);
  });

  it('keeps profiles and blocks writes after an active projection write failure', () => {
    const storage = createMemoryStorage({}, {
      failSet: key => key === 'jannati_v151_profile' ? ({ name: 'Error' }) : null
    });
    const result = hydrateCloudLearningState(storage, createProductionFixture(), { accountId: ACCOUNT_ID });

    expect(result.profiles).toHaveLength(2);
    expect(result.activeStatePersisted).toBe(false);
    expect(result.readOnly).toBe(true);
    expect(result.failedKey).toBe('jannati_v151_profile');
  });

  it('does not require a rollback copy when stale-key cleanup fails', () => {
    const storage = createMemoryStorage({ jannati_stale: 'old' }, {
      failRemove: key => key === 'jannati_stale' ? ({ name: 'SecurityError' }) : null
    });
    const result = hydrateCloudLearningState(storage, createProductionFixture(), { accountId: ACCOUNT_ID });

    expect(result.ok).toBe(true);
    expect(result.hydrated).toBe(true);
    expect(result.activeStatePersisted).toBe(true);
    expect(result.cleanupFailureCount).toBe(1);
  });

  it('stays write-protected when cleanup and projection recovery both fail', () => {
    const storage = createMemoryStorage({ jannati_stale: 'old' }, {
      failRemove: () => ({ name: 'SecurityError' }),
      failSet: key => key === 'jannati_v151_profile' ? ({ name: 'QuotaExceededError' }) : null
    });
    const result = hydrateCloudLearningState(storage, createProductionFixture(), { accountId: ACCOUNT_ID });

    expect(result.hydrated).toBe(true);
    expect(result.profiles).toHaveLength(2);
    expect(result.activeStatePersisted).toBe(false);
    expect(result.readOnly).toBe(true);
    expect(result.reason).toBe('quota_exceeded');
  });

  it('accepts an explicitly empty canonical profile set without inventing a child', () => {
    const payload = {
      [CLOUD_CHILD_STATE_KEY]: JSON.stringify({ profiles: [], activeChildId: '', deletedChildren: {}, archivedChildren: {} })
    };
    const result = hydrateCloudLearningState(createMemoryStorage(), payload, { accountId: ACCOUNT_ID });

    expect(result.ok).toBe(true);
    expect(result.profiles).toEqual([]);
    expect(result.activeChildId).toBe('');
  });

  it('treats a child-cache write failure as non-blocking when the active projection is usable', () => {
    const storage = createMemoryStorage({}, {
      failSet: key => key.startsWith(CHILD_SNAPSHOT_PREFIX) ? ({ name: 'QuotaExceededError' }) : null
    });
    const result = hydrateCloudLearningState(storage, createProductionFixture(), { accountId: ACCOUNT_ID });

    expect(result.activeStatePersisted).toBe(true);
    expect(result.snapshotPersisted).toBe(false);
    expect(result.readOnly).toBe(false);
    expect(JSON.parse(storage.getItem('jannati_child_profiles'))).toHaveLength(2);
  });

  it('blocks an accidental empty-state write over non-empty server profiles', () => {
    expect(shouldBlockEmptyCloudWrite({ serverProfileCount: 2, localProfileCount: 0, activeStatePersisted: false })).toBe(true);
    expect(shouldBlockEmptyCloudWrite({ serverProfileCount: 2, localProfileCount: 2, activeStatePersisted: true })).toBe(false);
    expect(shouldBlockEmptyCloudWrite({ serverProfileCount: 0, localProfileCount: 0, activeStatePersisted: true })).toBe(false);
  });

  it('rejects an explicitly different root account before any hydration', () => {
    const payload = createProductionFixture();
    payload.jannati_v151_profile = JSON.stringify({ accountId: 'other-account', xp: 9999 });
    const result = hydrateCloudLearningState(createMemoryStorage(), payload, { accountId: ACCOUNT_ID });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('account_mismatch');
  });

  it('enforces a bounded whole-field account snapshot without truncating values', () => {
    const huge = 'x'.repeat(800_000);
    const compact = buildCompactAccountSnapshot({
      jannati_child_profiles: '[]',
      jannati_v151_profile: JSON.stringify({ xp: 970 }),
      jannati_large_history: huge
    }, ACCOUNT_ID, { maxBytes: 100_000, maxEntryBytes: 80_000 });

    expect(compact.estimatedBytes).toBeLessThanOrEqual(100_000);
    expect(compact.snapshot.jannati_large_history).toBeUndefined();
    expect(compact.omittedKeys).toContain('jannati_large_history');
    expect(compact.snapshot.jannati_v151_profile).toBe(JSON.stringify({ xp: 970 }));
  });

  it('bounds a large child snapshot as a best-effort cache result', () => {
    const storage = createMemoryStorage({ [`${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`]: 'old' });
    const result = persistBoundedChildSnapshot(
      storage,
      `${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`,
      { data: 'x'.repeat(2000) },
      { maxBytes: 500, removeExistingOnLimit: true }
    );

    expect(result.ok).toBe(true);
    expect(result.persisted).toBe(false);
    expect(result.reason).toBe('size_limit_exceeded');
    expect(storage.getItem(`${CHILD_SNAPSHOT_PREFIX}${ACTIVE_CHILD_ID}`)).toBeNull();
  });

  it('reports projected storage size without exposing payload values', () => {
    const report = measureSnapshotStorage(createProductionFixture({ largeActiveSnapshot: true }), ACCOUNT_ID);

    expect(report.canonicalCloudBytes).toBeGreaterThan(0);
    expect(report.projectedAccountSnapshotBytes).toBeLessThanOrEqual(768 * 1024);
    expect(report.breakdown[0]).toEqual(expect.objectContaining({ key: expect.any(String), estimatedBytes: expect.any(Number) }));
    expect(report.breakdown[0]).not.toHaveProperty('value');
    expect(report.childFieldBreakdown[0]).toEqual(expect.objectContaining({
      childId: ACTIVE_CHILD_ID,
      key: 'jannati_large_history',
      estimatedBytes: expect.any(Number)
    }));
    expect(report.childFieldBreakdown[0]).not.toHaveProperty('value');
  });

  it('persists a small structured restore diagnostic and reports local key sizes', () => {
    const storage = createMemoryStorage();
    hydrateCloudLearningState(storage, createProductionFixture(), { accountId: ACCOUNT_ID });
    const diagnostic = createLocalSnapshotDiagnostics(storage, ACCOUNT_ID);

    expect(diagnostic.ok).toBe(true);
    expect(diagnostic.lastRestore).toEqual(expect.objectContaining({ accountId: ACCOUNT_ID, hydrated: true }));
    expect(storage.getItem(LAST_RESTORE_DIAGNOSTIC_KEY)).not.toContain('Fayadh');
    expect(diagnostic.keys.every(item => !Object.hasOwn(item, 'value'))).toBe(true);
  });

  it('classifies silent storage write drops as write_failed', () => {
    const storage = createMemoryStorage();
    storage.setItem = () => {};
    const result = safeStorageSet(storage, 'jannati_test', 'value');

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('write_failed');
    expect(result.errorName).toBe('StorageReadbackError');
    expect(estimateStorageBytes('a', 'b')).toBe(4);
  });
});
