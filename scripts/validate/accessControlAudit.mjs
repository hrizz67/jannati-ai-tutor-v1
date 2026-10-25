import assert from 'node:assert/strict';
import {
  FREE_DAILY_QUESTION_LIMIT,
  canSubmitFreeQuestion,
  capQuestionCountToRemainingQuota,
  getAccessFeatureLabel,
  getAccessLabel,
  getDailyQuestionCount,
  isPremiumAccess,
  resolveAuthoritativeAccess,
  resolveQuestionQuotaSubjectId
} from '../../src/services/accessControl.js';
import fs from 'node:fs';

const today = '2026-08-08';
assert.equal(FREE_DAILY_QUESTION_LIMIT, 10);
assert.equal(isPremiumAccess({ access_status: 'free' }), false);
assert.equal(isPremiumAccess({ access_status: 'premium', access_expires_at: '2099-01-01T00:00:00Z', server_verified: true, server_access_allowed: true }), true);
assert.equal(isPremiumAccess({ access_status: 'premium', access_expires_at: '2020-01-01T00:00:00Z' }), false);
assert.match(getAccessLabel({ access_status: 'premium', access_expires_at: '2099-01-01T00:00:00Z', server_verified: true, server_access_allowed: true }), /Premium aktif.*Tamat/);
assert.equal(getAccessFeatureLabel('tutorAi'), 'Tutor AI');
assert.equal(getAccessFeatureLabel('unknown'), 'Ciri Premium');
assert.equal(getDailyQuestionCount({}, {
  learningHistory: [
    { questionId: 'q1', answeredAt: `${today}T01:00:00Z` },
    { questionId: 'q2', answeredAt: '2026-08-07T12:00:00Z' },
    { eventType: 'quiz-answer', date: `${today}T02:00:00Z` }
  ]
}, today), 2);
assert.equal(getDailyQuestionCount({}, {
  learningHistory: [
    { questionId: 'bm-1', subjectId: 'bm', answeredAt: `${today}T01:00:00Z` },
    { questionId: 'math-1', subjectId: 'math', answeredAt: `${today}T02:00:00Z` }
  ]
}, today, 'bm'), 2, 'Free quota must be global across subjects for the active child and Malaysia day.');
assert.equal(getDailyQuestionCount({}, {
  learningHistory: [
    { sessionId: 'session-1', questionId: 'math-retry', subjectId: 'math', topicId: 'nombor', attemptNumber: 1, answeredAt: `${today}T01:00:00Z` },
    { sessionId: 'session-1', questionId: 'math-retry', subjectId: 'math', topicId: 'nombor', attemptNumber: 2, answeredAt: `${today}T01:01:00Z` }
  ]
}, today, 'math'), 1, 'Retries of one session/question occurrence must consume one daily unit.');
assert.equal(getDailyQuestionCount({}, {
  learningHistory: [
    { sessionId: 'session-1', questionId: 'math-repeat', subjectId: 'math', topicId: 'nombor', answeredAt: `${today}T01:00:00Z` },
    { sessionId: 'session-2', questionId: 'math-repeat', subjectId: 'math', topicId: 'nombor', answeredAt: `${today}T01:01:00Z` }
  ]
}, today, 'math'), 2, 'The same question in different sessions may consume separate units.');
const countedRetry = { sessionId: 'session-10', questionId: 'math-10', status: 'wrong', answeredAt: `${today}T02:00:00Z` };
assert.equal(canSubmitFreeQuestion({ dailyQuestionCount: 10, questionId: 'math-10', sessionId: 'session-10', sessionAnswers: [countedRetry], dateKey: today }), true);
assert.equal(canSubmitFreeQuestion({ dailyQuestionCount: 10, questionId: 'math-11', sessionId: 'session-10', sessionAnswers: [countedRetry], dateKey: today }), false);
assert.equal(resolveQuestionQuotaSubjectId({ subjectId: 'math' }, 'adaptive', 'bm'), 'math');
assert.equal(capQuestionCountToRemainingQuota(10, 7), 3);

const matchingPremium = resolveAuthoritativeAccess('account-premium', {
  id: 'account-premium',
  access_status: 'premium',
  access_expires_at: '2099-01-01T00:00:00Z',
  server_verified: true,
  server_access_allowed: true
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
const premiumAccessHook = fs.readFileSync(new URL('../../src/hooks/usePremiumAccess.js', import.meta.url), 'utf8');
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
const guardianConsentMigration = fs.readFileSync(new URL('../../supabase/migrations/20261025090000_quiz_stt_guardian_consent.sql', import.meta.url), 'utf8');
const guardianConsentTable = fs.readFileSync(new URL('../../supabase/schemas/public/tables/quiz_stt_guardian_consent_events.sql', import.meta.url), 'utf8');
const guardianAuthorizationTable = fs.readFileSync(new URL('../../supabase/schemas/public/tables/quiz_stt_guardian_authorization_challenges.sql', import.meta.url), 'utf8');
const guardianConsentFunctions = fs.readFileSync(new URL('../../supabase/schemas/public/functions/quiz_stt_guardian_consent.sql', import.meta.url), 'utf8');
const integrityTableNames = ['learning_data_backups', 'learning_sync_operations', 'learner_profiles', 'learning_states', 'learning_events'];
const startTopicSource = app.slice(app.indexOf('  function startTopic('), app.indexOf('\n  async function startResume('));
const startAdaptivePracticeSource = app.slice(app.indexOf('  async function startAdaptivePractice('), app.indexOf('\n  function currentQuestion('));
const checkAnswerSource = app.slice(app.indexOf('  function checkAnswer()'), app.indexOf('\n  function createCoachSnapshot('));
for (const token of ['openTutorAi', 'openPremiumScreen', 'FREE_DAILY_QUESTION_LIMIT', 'onOpenUasa={() => openPremiumScreen']) {
  assert.ok(app.includes(token), `Missing access gate token: ${token}`);
}
assert.ok(startTopicSource.indexOf('const matchingResume') < startTopicSource.indexOf('const subjectDailyQuestionCount'), 'Normal quiz resumes must be checked before the fresh-session quota gate.');
assert.ok(startAdaptivePracticeSource.indexOf('const practiceResume') < startAdaptivePracticeSource.indexOf('const subjectDailyQuestionCount'), 'Adaptive-practice resumes must be checked before the fresh-session quota gate.');
assert.match(checkAnswerSource, /resolveQuestionQuotaSubjectId\(\s*question,/, 'Answer-time quota subject must prefer question.subjectId.');
assert.match(checkAnswerSource, /canSubmitFreeQuestion\(\{/, 'Answer-time quota must distinguish a counted retry from a new question.');
assert.ok(!app.includes("onOpenUasa={() => setScreen('uasa')}"));
assert.ok(!app.includes("onStartBacaan={() => setScreen('reading')}"));
assert.match(app, /usePremiumAccess\(\{ accountUser, accessProfile \}\)/, 'App access must use the isolated authoritative access hook.');
assert.match(premiumAccessHook, /resolveAuthoritativeAccess\(accountId, accessProfile\)/, 'Premium access must be derived from the active account and server record.');
assert.match(app, /setAccessProfile\(current => String\(current\?\.id \|\| ''\) === String\(user\.id\) \? current : null\)/, 'Account switching must drop a previous account entitlement before hydration.');
assert.match(app, /if \(!accountUser\?\.id && \(screen === 'login' \|\| showAccountLogin\)\) return;/, 'Login must not resurrect a signed-out profile through persistence.');
assert.match(app, /setProfile\(\{ \.\.\.defaultProfile \}\)[\s\S]{0,300}setChildProfiles\(\[\]\)/, 'Logout must clear in-memory entitlement and child state.');
assert.match(app, /if \(scopedAccountId\) resetSignedOutAccountState\(scopedAccountId\)/, 'An expired or externally-ended session must clear the previous account state.');
assert.match(app, /activeScopedAccountId === previousAccountId[\s\S]{0,100}captureAccountSnapshot\(previousAccountId\)/, 'Repeated sign-out events must not overwrite the saved account snapshot with cleared state.');
assert.match(app, /const feature = PREMIUM_SCREEN_FEATURES\[screen\][\s\S]{0,200}if \(!feature \|\| isPremiumUser\) return;/, 'Protected screens must close when verified Premium access is absent or revoked.');
assert.ok(!dashboard.includes('profile?.isPremium'), 'Dashboard must not render Premium from local learning profile data.');
assert.match(dashboard, /hasAccountSession && accessProfile\?\.isPremium/, 'Dashboard Premium badge must require an authenticated account and authoritative access.');
assert.equal((dashboard.match(/<PremiumFeatureBadge visible=\{!isPremiumAccount\} \/>/g) || []).length, 7, 'Every currently gated dashboard entry point must disclose Premium access before click.');
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
assert.match(declarativeIntegrityFunctions, /grant execute on function public\.save_learning_data_v4[\s\S]{0,120}to authenticated;/, 'Authenticated users need the compact revisioned learning write RPC.');
for (const consentSql of [guardianConsentMigration, guardianConsentFunctions]) {
  assert.match(consentSql, /auth\.uid\(\)/, 'Guardian-consent decisions must be bound to the authenticated parent account.');
  assert.match(consentSql, /set search_path = ''/, 'Guardian-consent RPCs must pin an empty search path.');
  assert.match(consentSql, /jannati_cloud_child_state/, 'Guardian consent must verify ownership from canonical child state.');
  assert.match(consentSql, /deletedChildren/, 'Deleted children must never remain eligible for voice consent.');
  assert.match(consentSql, /archivedChildren/, 'Archived children must never remain eligible for voice consent.');
  assert.doesNotMatch(consentSql, /jannati_child_profiles/, 'Legacy projections cannot safely prove current child eligibility.');
  assert.match(consentSql, /begin_quiz_stt_guardian_authorization_v1/, 'A backend-issued guardian reauthentication challenge is required.');
  assert.match(consentSql, /current_session_hash = initial_session_hash/, 'The grant RPC must reject the parent-locked session that created the challenge.');
  assert.match(consentSql, /method ->> 'method' = 'password'/, 'Guardian grant must prove a fresh password authentication event.');
  assert.match(consentSql, /matched_child_id is distinct from p_child_id/, 'Consent verification must bind the token to the requested child.');
  assert.match(consentSql, /owns_active_child := public\._quiz_stt_account_owns_child_v1/, 'Consent verification must recheck active child ownership every time.');
  assert.match(consentSql, /pg_catalog\.pg_advisory_xact_lock/, 'Challenge and consent mutations must serialize concurrent calls.');
  assert.match(consentSql, /existing_used_at is null[\s\S]{0,160}existing_expires_at > pg_catalog\.now\(\)/, 'Repeated challenge requests must reuse one active five-minute challenge.');
  assert.match(consentSql, /stale\.created_at < pg_catalog\.now\(\) - interval '24 hours'/, 'Expired challenge records must have a bounded retention policy.');
  assert.match(consentSql, /canonical_notice_version constant text := 'quiz-stt-cloudflare-bm-v1'/, 'The backend must pin the canonical privacy notice version.');
  assert.match(consentSql, /if not p_granted then[\s\S]{0,500}update public\.quiz_stt_guardian_authorization_challenges[\s\S]{0,200}and used_at is null/, 'Revocation must invalidate a pending challenge while retaining its cooldown tombstone.');
  assert.doesNotMatch(consentSql, /if not p_granted then[\s\S]{0,500}delete from public\.quiz_stt_guardian_authorization_challenges/, 'Revocation must not delete the row that enforces issuance cooldown.');
}
assert.match(guardianConsentTable, /enable row level security/, 'The consent audit table must enable RLS.');
assert.match(guardianConsentTable, /revoke all on table "public"\."quiz_stt_guardian_consent_events" from public, anon, authenticated;/, 'Consent audit rows must not be directly readable or writable by browsers.');
assert.doesNotMatch(guardianConsentTable, /grant (select|insert|update|delete|all)[\s\S]{0,120}to authenticated/, 'Consent audit access must be RPC-only.');
assert.match(guardianAuthorizationTable, /enable row level security/, 'Guardian authorization challenges must enable RLS.');
assert.match(guardianAuthorizationTable, /initial_session_hash/, 'Guardian authorization challenges must store only a one-way session hash.');
assert.match(guardianAuthorizationTable, /unique \(account_id, child_id\)/, 'At most one challenge row may exist for an account/child pair.');
assert.doesNotMatch(guardianAuthorizationTable, /grant (select|insert|update|delete|all)[\s\S]{0,120}to authenticated/, 'Guardian authorization challenges must be RPC-only.');
assert.doesNotMatch(guardianConsentMigration, /update\s+public\.quiz_stt_guardian_consent_events|delete\s+from\s+public\.quiz_stt_guardian_consent_events/i, 'Consent decisions must remain append-only.');
assert.match(declarativeIntegrityFunctions, /grant execute on function public\.save_learning_data_v4[\s\S]{0,120}to authenticated;/, 'Authenticated users need the compact revisioned learning write RPC.');

console.log('Access-control audit: PASS');
