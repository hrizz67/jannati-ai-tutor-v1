import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
}

const app = read('src/App.jsx');
const hydration = read('src/services/accountHydration.js');
const learningSync = read('src/services/learningSync.js');
const childStorage = read('src/services/childScopedStorage.js');
const legacyMigration = read('src/services/legacyStudentMigration.js');

const accountSync = app.slice(
  app.indexOf('const syncAccount = async'),
  app.indexOf("const { data: authListener }")
);
const dashboardIndex = accountSync.indexOf('openAccountDashboardFromDevice(user)');
const remoteIndex = accountSync.indexOf('await settleAccountHydration');
const timeoutStart = accountSync.indexOf('if (hydration.timedOut)');
const timeoutEnd = accountSync.indexOf('clearHydrationRetry();', timeoutStart);

assert.ok(dashboardIndex >= 0, 'A verified account session must activate its device-scoped dashboard.');
assert.ok(remoteIndex > dashboardIndex, 'The dashboard must open before waiting for remote profile and learning hydration.');
assert.match(accountSync, /setCloudHydratedAccountId\(''\)[\s\S]{0,1400}openAccountDashboardFromDevice\(user\)/, 'Cloud writes must remain locked while the local dashboard opens.');
assert.match(accountSync, /if \(hydration\.timedOut\)[\s\S]{0,550}scheduleHydrationRetry\(user\)[\s\S]{0,80}return;/, 'A timed-out hydration must leave the dashboard usable and schedule a safe retry.');
assert.doesNotMatch(
  accountSync.slice(timeoutStart, timeoutEnd),
  /setCloudHydratedAccountId/,
  'A timed-out cloud read must never unlock cloud autosave.'
);
assert.match(accountSync, /inFlightAccountId === accountId && inFlightHydration/, 'Duplicate auth callbacks must share one in-flight account hydration.');
assert.match(accountSync, /if \(!user\) \{[\s\S]{0,100}inFlightAccountId = '';[\s\S]{0,80}inFlightHydration = null;/, 'Signing out must release an old in-flight hydration before the same account can sign in again.');
assert.match(accountSync, /dashboardReadyAccountId !== user\.id[\s\S]{0,180}setScreen\('dashboard'\)/, 'A hydration retry must not interrupt an active learning screen.');
assert.match(accountSync, /dashboardReadyAccountId !== user\.id[\s\S]{0,160}setCloudSyncInfo\(\{ revision: 0, serverUpdatedAt: '' \}\)[\s\S]{0,100}lastCloudSignatureRef\.current = ''/, 'A newly activated account must not display another account\'s cloud revision metadata.');
assert.match(app, /onAuthStateChange[\s\S]{0,180}requestAccountSync/, 'Auth changes must use the deduplicated hydration path.');
assert.match(app, /getSession\(\)[\s\S]{0,180}requestAccountSync/, 'Recovered sessions must use the deduplicated hydration path.');
assert.match(accountSync, /restoreCloudLearningSnapshotResult[\s\S]{0,300}if \(!restoreResult\.ok\)[\s\S]{0,500}scheduleHydrationRetry\(user\)[\s\S]{0,80}return;/, 'A failed device restore must preserve local data, keep cloud writes locked and retry.');
assert.match(accountSync, /hydrationStageByAccount[\s\S]{0,12000}Account hydration failed/, 'Unexpected post-read failures must expose a safe diagnostic stage.');
assert.match(app, /function restoreCloudLearningSnapshotResult[\s\S]{0,3500}restoreAccountSnapshot\(previousSnapshot, accountScopeId\)/, 'Cloud restore must roll back to the complete previous account snapshot.');
assert.match(childStorage, /previousValues[\s\S]{0,1000}storage-quota-exceeded/, 'Scoped storage writes must roll back transactionally on browser quota failure.');
assert.match(legacyMigration, /alreadyScoped[\s\S]{0,500}reason: 'already-scoped'/, 'Already-scoped learning data must skip the duplicate legacy backup.');

assert.match(hydration, /ACCOUNT_HYDRATION_TIMEOUT_MS = 8000/, 'Remote hydration requires a finite timeout.');
assert.match(hydration, /controller\?\.abort\(timeoutError\)/, 'The timeout must abort supported Supabase requests.');
assert.match(hydration, /Promise\.allSettled/, 'A failed profile request must not discard a valid learning result.');
assert.match(learningSync, /options\.signal[\s\S]{0,120}request\?\.abortSignal/, 'Cloud learning reads must accept the account hydration abort signal.');

console.log('Login hydration regression: PASS (instant dashboard, transactional restore, safe retry, staged diagnostics)');
