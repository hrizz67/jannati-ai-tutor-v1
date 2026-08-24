import assert from 'node:assert/strict';
import {
  FREE_DAILY_QUESTION_LIMIT,
  getAccessFeatureLabel,
  getAccessLabel,
  getDailyQuestionCount,
  isPremiumAccess,
  resolveAuthoritativeAccess
} from '../../src/services/accessControl.js';
import fs from 'node:fs';

const today = '2026-08-08';
assert.equal(FREE_DAILY_QUESTION_LIMIT, 10);
assert.equal(isPremiumAccess({ access_status: 'free' }), false);
assert.equal(isPremiumAccess({ access_status: 'premium', access_expires_at: '2099-01-01T00:00:00Z' }), true);
assert.equal(isPremiumAccess({ access_status: 'premium', access_expires_at: '2020-01-01T00:00:00Z' }), false);
assert.match(getAccessLabel({ access_status: 'premium', access_expires_at: '2099-01-01T00:00:00Z' }), /Premium aktif.*Tamat/);
assert.equal(getAccessFeatureLabel('tutorAi'), 'Tutor AI');
assert.equal(getAccessFeatureLabel('unknown'), 'Ciri Premium');
assert.equal(getDailyQuestionCount({}, {
  learningHistory: [
    { questionId: 'q1', answeredAt: `${today}T01:00:00Z` },
    { questionId: 'q2', answeredAt: '2026-08-07T23:00:00Z' },
    { eventType: 'quiz-answer', date: `${today}T02:00:00Z` }
  ]
}, today), 2);
assert.equal(getDailyQuestionCount({}, {
  learningHistory: [
    { questionId: 'bm-1', subjectId: 'bm', answeredAt: `${today}T01:00:00Z` },
    { questionId: 'math-1', subjectId: 'math', answeredAt: `${today}T02:00:00Z` }
  ]
}, today, 'bm'), 1);

const matchingPremium = resolveAuthoritativeAccess('account-premium', {
  id: 'account-premium',
  access_status: 'premium',
  access_expires_at: '2099-01-01T00:00:00Z'
});
assert.equal(matchingPremium.isPremium, true, 'A matching server Premium record must remain Premium.');
assert.equal(matchingPremium.verifiedForAccount, true);

const mismatchedPremium = resolveAuthoritativeAccess('account-new', {
  id: 'account-old',
  access_status: 'premium',
  access_expires_at: '2099-01-01T00:00:00Z'
});
assert.equal(mismatchedPremium.isPremium, false, 'A previous account entitlement must fail closed.');
assert.equal(mismatchedPremium.access_status, 'free');
assert.equal(mismatchedPremium.verifiedForAccount, false);

const forgedLocalPremium = resolveAuthoritativeAccess('', {
  id: 'account-old',
  access_status: 'premium',
  isPremium: true
});
assert.equal(forgedLocalPremium.isPremium, false, 'Anonymous/local profile data must never grant Premium.');

const matchingFreeWithStaleFlag = resolveAuthoritativeAccess('account-free', {
  id: 'account-free',
  access_status: 'free',
  isPremium: true
});
assert.equal(matchingFreeWithStaleFlag.isPremium, false, 'Server Free must override a stale local isPremium flag.');
assert.equal(matchingFreeWithStaleFlag.accessLabel, 'Versi Free');

const expiredPremium = resolveAuthoritativeAccess('account-expired', {
  id: 'account-expired',
  access_status: 'premium',
  access_expires_at: '2020-01-01T00:00:00Z'
});
assert.equal(expiredPremium.isPremium, false);
assert.equal(expiredPremium.access_status, 'expired', 'An elapsed Premium entitlement must resolve to expired immediately.');
assert.match(expiredPremium.accessLabel, /Premium tamat/);

const app = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../../src/dashboard/HomeDashboard.jsx', import.meta.url), 'utf8');
const schema = fs.readFileSync(new URL('../../supabase/schema.sql', import.meta.url), 'utf8');
const learningSql = fs.readFileSync(new URL('../../supabase/learning_data.sql', import.meta.url), 'utf8');
const migrationDirectory = new URL('../../supabase/migrations/', import.meta.url);
const migrationNames = fs.readdirSync(migrationDirectory);
const baselineMigrationName = migrationNames
  .find(name => name.endsWith('_remote_schema_baseline.sql'));
const accessMigrationName = migrationNames
  .find(name => name.endsWith('_access_isolation_hardening.sql'));
const integrityMigrationName = migrationNames
  .find(name => name.endsWith('_learning_data_integrity_v3.sql'));
const integrityFunctionFixMigrationName = migrationNames
  .find(name => name.endsWith('_learning_data_v3_function_fix.sql'));
assert.ok(baselineMigrationName, 'A production schema baseline migration must exist.');
assert.ok(accessMigrationName, 'Access-isolation database migration must exist.');
assert.ok(integrityMigrationName, 'Data-integrity database migration must exist.');
assert.ok(integrityFunctionFixMigrationName, 'The v3 RPC ambiguity hotfix migration must exist.');
const baselineMigration = fs.readFileSync(new URL(baselineMigrationName, migrationDirectory), 'utf8');
const accessMigration = fs.readFileSync(new URL(accessMigrationName, migrationDirectory), 'utf8');
const integrityMigration = fs.readFileSync(new URL(integrityMigrationName, migrationDirectory), 'utf8');
const integrityFunctionFixMigration = fs.readFileSync(new URL(integrityFunctionFixMigrationName, migrationDirectory), 'utf8');
const declarativeProfiles = fs.readFileSync(new URL('../../supabase/schemas/public/tables/profiles.sql', import.meta.url), 'utf8');
const declarativeIntegrityFunctions = fs.readFileSync(new URL('../../supabase/schemas/public/functions/learning_data_v3.sql', import.meta.url), 'utf8');
const integrityTableNames = ['learning_data_backups', 'learning_sync_operations', 'learner_profiles', 'learning_states', 'learning_events'];
for (const token of ['openTutorAi', 'openPremiumScreen', 'FREE_DAILY_QUESTION_LIMIT', 'onOpenUasa={() => openPremiumScreen']) {
  assert.ok(app.includes(token), `Missing access gate token: ${token}`);
}
assert.ok(!app.includes("onOpenUasa={() => setScreen('uasa')}"));
assert.ok(!app.includes("onStartBacaan={() => setScreen('reading')}"));
assert.match(app, /resolveAuthoritativeAccess\(accountUser\?\.id, accessProfile\)/, 'App access must be derived from the active account and server record.');
assert.match(app, /setAccessProfile\(current => String\(current\?\.id \|\| ''\) === String\(user\.id\) \? current : null\)/, 'Account switching must drop a previous account entitlement before hydration.');
assert.match(app, /if \(!accountUser\?\.id && \(screen === 'login' \|\| showAccountLogin\)\) return;/, 'Login must not resurrect a signed-out profile through persistence.');
assert.match(app, /setProfile\(\{ \.\.\.defaultProfile \}\)[\s\S]{0,300}setChildProfiles\(\[\]\)/, 'Logout must clear in-memory entitlement and child state.');
assert.match(app, /if \(scopedAccountId\) resetSignedOutAccountState\(scopedAccountId\)/, 'An expired or externally-ended session must clear the previous account state.');
assert.match(app, /activeScopedAccountId === previousAccountId[\s\S]{0,100}captureAccountSnapshot\(previousAccountId\)/, 'Repeated sign-out events must not overwrite the saved account snapshot with cleared state.');
assert.match(app, /const feature = PREMIUM_SCREEN_FEATURES\[screen\][\s\S]{0,200}if \(!feature \|\| isPremiumUser\) return;/, 'Protected screens must close when verified Premium access is absent or revoked.');
assert.ok(!dashboard.includes('profile?.isPremium'), 'Dashboard must not render Premium from local learning profile data.');
assert.match(dashboard, /hasAccountSession && accessProfile\?\.isPremium/, 'Dashboard Premium badge must require an authenticated account and authoritative access.');
assert.match(schema, /values \(new\.id, coalesce\([\s\S]{0,100}, 'free'\)/, 'New auth users must be inserted explicitly as Free.');
assert.match(schema, /revoke insert, update, delete on table public\.profiles from anon, authenticated;/, 'Client roles must not write entitlement rows directly.');
assert.match(learningSql, /values \(auth\.uid\(\), 'Murid', 'free'\)/, 'Learning-data fallback profile creation must be explicitly Free.');
assert.match(learningSql, /revoke all on function public\.save_learning_data\(jsonb\) from public, anon, authenticated;/, 'Anonymous users must not execute the learning-data write RPC.');
assert.match(accessMigration, /revoke all on table public\.profiles from anon, authenticated;/, 'Migration must remove legacy browser-role table grants.');
assert.match(accessMigration, /grant select on table public\.profiles to authenticated;/, 'Authenticated users still need RLS-scoped profile reads.');
assert.match(accessMigration, /revoke all on function public\.save_learning_data\(jsonb\) from public, anon, authenticated;/, 'Migration must remove anonymous learning-data RPC access.');
assert.match(accessMigration, /grant execute on function public\.save_learning_data\(jsonb\) to authenticated;/, 'Authenticated learning sync must remain available.');
assert.match(integrityMigration, /revoke all on function public\.save_learning_data\(jsonb\) from public, anon, authenticated;/, 'The v3 migration must retire the legacy authenticated blind-write endpoint.');
assert.match(integrityMigration, /security definer[\s\S]{0,120}set search_path = ''/, 'Revisioned RPC functions must pin an empty search path.');
for (const functionSql of [integrityFunctionFixMigration, declarativeIntegrityFunctions]) {
  assert.doesNotMatch(functionSql, /on conflict \((operation_id|event_id)\)/, 'RPC SQL must not use ambiguous parameter/column conflict targets.');
  assert.match(functionSql, /where operation_log\.operation_id = \$3/, 'The operation lookup must reference the RPC argument unambiguously.');
  assert.match(functionSql, /on conflict on constraint learning_sync_operations_pkey do nothing/, 'Sync-operation idempotency must target the named primary-key constraint.');
  assert.match(functionSql, /on conflict on constraint learning_events_pkey do nothing/, 'Learning-event idempotency must target the named primary-key constraint.');
}
for (const tableName of integrityTableNames) {
  const tableSchema = fs.readFileSync(new URL(`../../supabase/schemas/public/tables/${tableName}.sql`, import.meta.url), 'utf8');
  assert.match(tableSchema, new RegExp(`alter table "public"\\."${tableName}" enable row level security`), `${tableName} must enable RLS.`);
  assert.match(tableSchema, /\(select auth\.uid\(\)\) = account_id/, `${tableName} reads must be scoped to the authenticated account.`);
  assert.doesNotMatch(tableSchema, /grant (insert|update|delete|all)[\s\S]{0,120}to "authenticated"/, `${tableName} must not expose direct browser writes.`);
}
assert.match(accessMigration, /alter default privileges for role postgres in schema public[\s\S]*revoke all on tables from anon, authenticated;/, 'Future tables must fail closed for browser roles.');
assert.match(baselineMigration, /create table if not exists public\.profiles/, 'Baseline must recreate the profile schema without production data.');
assert.match(baselineMigration, /learning_data jsonb not null default '\{\}'::jsonb/, 'Baseline must recreate Cloud learning storage.');
assert.doesNotMatch(declarativeProfiles, /grant[\s\S]{0,200}on table "public"\."profiles" to "anon"/, 'Declarative production schema must not grant profile-table access to anonymous users.');
assert.match(declarativeProfiles, /grant select on table "public"\."profiles" to "authenticated";/, 'Declarative schema must preserve RLS-scoped authenticated reads.');
assert.match(declarativeIntegrityFunctions, /set search_path to ''/, 'Declarative revisioned RPCs must pin an empty search path.');
assert.match(declarativeIntegrityFunctions, /grant execute on function public\.save_learning_data_v3[\s\S]{0,120}to authenticated;/, 'Authenticated users need only the revisioned learning write RPC.');

console.log('Access-control audit: PASS');
