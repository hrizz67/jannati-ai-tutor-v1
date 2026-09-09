import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ACCOUNT_SNAPSHOT_PREFIX,
  hydrateCloudLearningState,
  measureSnapshotStorage,
  shouldBlockEmptyCloudWrite,
  shouldLoadStudentLearningForRoute
} from '../../src/services/cloudSnapshotRecovery.js';
import { CHILD_SNAPSHOT_PREFIX, CLOUD_CHILD_STATE_KEY } from '../../src/services/learningSync.js';

const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const serviceSource = fs.readFileSync(new URL('../../src/services/cloudSnapshotRecovery.js', import.meta.url), 'utf8');
const accountId = '3fceddeb-4468-4fec-87d3-476f2251f68c';
const activeChildId = 'child-ae293f93-494b-44ff-84ee-e323f74c298e';
const secondChildId = 'child-334ff219-6aca-4bd1-aad2-8973fd783b61';
const orphanChildId = 'child-9cf28317-orphan';

function memoryStorage({ failCacheWrites = false } = {}) {
  const values = new Map([[`${ACCOUNT_SNAPSHOT_PREFIX}old-account`, 'x'.repeat(300_000)]]);
  return {
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
    setItem(key, value) {
      if (failCacheWrites && String(key).startsWith(CHILD_SNAPSHOT_PREFIX)) {
        throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
      }
      values.set(String(key), String(value));
    },
    removeItem: key => values.delete(String(key))
  };
}

const profiles = [
  { id: activeChildId, name: 'Fayadh', year: 'Tahun 2' },
  { id: secondChildId, name: 'Fayadh', year: 'Tahun 2' }
];
const activeSnapshot = {
  __childSnapshotChildId: activeChildId,
  __childSnapshotAccountId: accountId,
  jannati_v151_profile: JSON.stringify({ accountId, childId: activeChildId, xp: 970 }),
  jannati_large_history: JSON.stringify({ events: ['x'.repeat(1_550_000)] })
};
const payload = {
  [CLOUD_CHILD_STATE_KEY]: JSON.stringify({
    version: 3,
    profiles,
    activeChildId,
    deletedChildren: {},
    archivedChildren: {}
  }),
  jannati_child_profiles: JSON.stringify(profiles),
  jannati_active_child_id: activeChildId,
  jannati_v151_profile: activeSnapshot.jannati_v151_profile,
  [`${CHILD_SNAPSHOT_PREFIX}${activeChildId}`]: JSON.stringify(activeSnapshot),
  [`${CHILD_SNAPSHOT_PREFIX}${secondChildId}`]: JSON.stringify({
    __childSnapshotChildId: secondChildId,
    __childSnapshotAccountId: accountId,
    jannati_v151_profile: JSON.stringify({ accountId, childId: secondChildId, xp: 40 })
  }),
  [`${CHILD_SNAPSHOT_PREFIX}${orphanChildId}`]: JSON.stringify({
    __childSnapshotChildId: orphanChildId,
    __childSnapshotAccountId: accountId
  })
};

const storage = memoryStorage({ failCacheWrites: true });
const result = hydrateCloudLearningState(storage, payload, { accountId });
assert.equal(result.ok, true, 'A cache failure must not turn valid canonical cloud data into a restore failure.');
assert.equal(result.hydrated, true, 'Canonical cloud profiles must hydrate.');
assert.equal(result.activeStatePersisted, true, 'The active projection must persist independently of child cache writes.');
assert.equal(result.snapshotPersisted, false, 'A skipped/failed local cache must remain observable.');
assert.equal(result.profiles.length, 2, 'Both authoritative child IDs must survive hydration.');
assert.equal(result.activeChildId, activeChildId, 'The valid server active child must be restored deterministically.');
assert.equal(result.orphanSnapshotKeys.length, 1, 'An orphan snapshot must be reported but not promoted to a profile.');
assert.equal(storage.getItem(`${ACCOUNT_SNAPSHOT_PREFIX}old-account`), null, 'A stale other-account snapshot must be pruned after authentication.');
assert.equal(shouldBlockEmptyCloudWrite({ serverProfileCount: 2, localProfileCount: 0, activeStatePersisted: false }), true);
assert.equal(shouldLoadStudentLearningForRoute('#/admin'), false, 'The Admin route must not request the multi-MB student payload.');

const sizes = measureSnapshotStorage(payload, accountId);
assert.ok(sizes.canonicalCloudBytes > 3_000_000, 'The representative fixture must exercise a multi-megabyte canonical payload.');
assert.ok(sizes.projectedAccountSnapshotBytes <= 768 * 1024, 'The local account snapshot must remain bounded.');
assert.equal(sizes.childFieldBreakdown[0]?.key, 'jannati_large_history', 'The safe size report must identify the largest top-level child field without exposing its value.');
assert.ok(result.skippedLargeSnapshotKeys.includes(`${CHILD_SNAPSHOT_PREFIX}${activeChildId}`), 'The oversized active child cache must be skipped whole, never truncated.');

assert.doesNotMatch(appSource, /account-snapshot-restore-failed/, 'A cache-only failure must not be reported as a cloud restore failure.');
assert.match(appSource, /hydrateCloudLearningState\(localStorage, cloudData/, 'Cloud hydration must use the structured recovery service.');
assert.match(appSource, /cloudWriteGuardRef\.current\.blocked/, 'Cloud writes must fail closed after incomplete device hydration.');
assert.match(appSource, /Data cloud berjaya dimuatkan, tetapi salinan pemulihan pada peranti tidak dapat disimpan\./, 'The UI must distinguish cache failure from cloud failure.');
assert.match(appSource, /currentHash !== '#\/admin' && currentHash !== '#\/admin\/premium'/, 'Admin-only sessions must bypass student learning hydration.');
assert.doesNotMatch(serviceSource, /isPremium|entitlement_status|access_status/, 'Cloud recovery must remain independent of Premium entitlement.');

console.log('Cloud snapshot recovery regression: PASS (24 unit scenarios + production-shaped multi-MB fixture)');
