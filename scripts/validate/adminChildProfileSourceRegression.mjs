import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260910140000_admin_child_profile_source_fix.sql';
const schemaPath = 'supabase/schemas/public/functions/admin_console_v2.sql';
const pagePath = 'src/admin/AdminPremiumPage.jsx';
const databaseCheckPath = 'scripts/validate/adminChildProfileSourceDatabaseCheck.mjs';
const migration = fs.readFileSync(migrationPath, 'utf8');
const schema = fs.readFileSync(schemaPath, 'utf8');
const page = fs.readFileSync(pagePath, 'utf8');
const databaseCheck = fs.readFileSync(databaseCheckPath, 'utf8');

for (const sql of [migration, schema]) {
  assert.match(sql, /create or replace function public\.admin_child_summary_payload\(target_account_id uuid\)/, 'Canonical Admin child-summary helper is missing.');
  assert.match(sql, /security definer[\s\S]{0,80}set search_path = ''/i, 'Child metadata projection must use a pinned SECURITY DEFINER context.');
  assert.match(sql, /if not public\.is_current_premium_admin\(\) then raise exception 'admin_required'/, 'Child metadata projection must enforce the server-side Admin role.');
  assert.match(sql, /account_profile\.learning_data[\s\S]*jannati_cloud_child_state/, 'Child metadata must be read from the canonical account learning_data payload.');
  assert.match(sql, /jsonb_typeof\(canonical_child_state -> 'profiles'\) = 'array'/, 'Malformed canonical profile metadata must be rejected safely.');
  assert.match(sql, /deletedChildren[\s\S]*archivedChildren[\s\S]*archivedAt[\s\S]*restoredAt/, 'Deleted and archived profile rules must be applied.');
  assert.match(sql, /distinct on \(effective\.child_id\)/, 'Only duplicate IDs, never duplicate names, may collapse.');
  assert.match(sql, /'isActive', distinct_profile\.child_id = raw_active_child_id/, 'Active child identity must be resolved by canonical ID.');
  assert.match(sql, /if canonical_shape_valid then[\s\S]*'source', 'learning_data'[\s\S]*from public\.learner_profiles/, 'A valid canonical state must win before legacy fallback.');
  assert.match(sql, /cross join lateral[\s\S]*admin_child_summary_payload/, 'Admin RPCs must consume the shared child-summary helper.');
  assert.match(sql, /jsonb_array_elements\(coalesce\(child_summary\.payload -> 'children'/, 'Child-name search must use the canonical summary.');
  assert.doesNotMatch(sql, /update public\.profiles[\s\S]*learning_data|insert into public\.learner_profiles|delete from public\.learner_profiles/i, 'The Admin child-source hotfix must not reconcile or mutate child learning state.');
  assert.doesNotMatch(sql, /jannati_child_snapshot:|questionHistory|aiMemory/i, 'The helper must not project learning snapshots, history, or AI memory.');
}

assert.match(migration, /^begin;/i, 'The forward migration must be transactional.');
assert.match(migration, /commit;\s*$/i, 'The forward migration must end atomically.');
assert.match(migration, /revoke all on function public\.admin_child_summary_payload\(uuid\) from public, anon, authenticated/, 'Normal browser roles must not call the helper directly.');
assert.match(migration, /grant execute on function public\.admin_child_summary_payload\(uuid\) to postgres, service_role/, 'Only trusted server roles may call the helper directly.');
assert.match(page, /details\.children\.map\(child => <article key=\{child\.id\}>/, 'Same-name children must render with child IDs as React keys.');
assert.match(page, /child\.isActive[\s\S]{0,120}Aktif/, 'The Admin details view must display the server-provided active-child indicator.');

for (const scenario of [
  'case_a_two_canonical_children',
  'case_b_duplicate_names_preserved',
  'case_c_active_child_by_id',
  'case_d_archived_child_excluded',
  'case_e_legacy_fallback',
  'case_f_canonical_wins',
  'case_g_malformed_fallback',
  'case_h_non_admin_denied',
  'case_i_search_by_canonical_child',
  'case_j_sensitive_payload_excluded',
  'rollback;'
]) assert.ok(databaseCheck.includes(scenario), `Missing database rollback scenario: ${scenario}`);

console.log('Admin child profile source regression: PASS (canonical metadata, fallback, isolation, read-only Admin projection)');
