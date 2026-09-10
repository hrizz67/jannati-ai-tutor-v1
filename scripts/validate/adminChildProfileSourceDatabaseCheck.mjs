// Opt-in linked-database check. It installs the forward migration and creates
// synthetic production-shaped fixtures inside one transaction that ALWAYS
// rolls back. No real account learning payload is changed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

assert.ok(process.argv.includes('--linked'), 'Explicit --linked is required for the Admin child-source rollback check.');
const migration = fs.readFileSync('supabase/migrations/20260910140000_admin_child_profile_source_fix.sql', 'utf8');
assert.match(migration, /^begin;/i);
assert.match(migration, /commit;\s*$/i);

const checks = String.raw`
do $check$
declare
  admin_id uuid;
  fixture_id uuid := gen_random_uuid();
  fixture_email text := 'admin-child-source-' || replace(fixture_id::text, '-', '') || '@example.invalid';
  fixture_name text := 'SourceTwin-' || left(fixture_id::text, 8);
  child_a text := 'child-' || gen_random_uuid()::text;
  child_b text := 'child-' || gen_random_uuid()::text;
  canonical_state jsonb;
  summary_payload jsonb;
  search_payload jsonb;
  detail_payload jsonb;
  original_payload jsonb;
  original_revision bigint;
  original_updated_at timestamptz;
  non_admin_denied boolean := false;
begin
  select account_profile.id into admin_id
  from public.profiles as account_profile
  where account_profile.is_admin is true
  order by account_profile.id
  limit 1;
  if admin_id is null then raise exception 'rollback_check_admin_required'; end if;

  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    fixture_id, 'authenticated', 'authenticated', fixture_email, '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', 'Synthetic Admin Child Fixture'), now(), now()
  );
  insert into public.profiles (id, display_name, access_status, learning_revision, learning_sync_version)
  values (fixture_id, 'Synthetic Admin Child Fixture', 'free', 616, 3)
  on conflict (id) do update set display_name = excluded.display_name,
    learning_revision = excluded.learning_revision, learning_sync_version = excluded.learning_sync_version;

  perform set_config('request.jwt.claims', '{}', true);
  perform set_config('request.jwt.claim.sub', admin_id::text, true);

  canonical_state := jsonb_build_object(
    'version', 3,
    'profiles', jsonb_build_array(
      jsonb_build_object('id', child_a, 'name', fixture_name, 'year', 'Tahun 2', 'avatar', 'janna'),
      jsonb_build_object('id', child_b, 'name', fixture_name, 'year', 'Tahun 2', 'avatar', 'jati')
    ),
    'activeChildId', child_a,
    'deletedChildren', '{}'::jsonb,
    'archivedChildren', '{}'::jsonb
  );
  update public.profiles as fixture_profile
  set learning_data = jsonb_build_object(
      'jannati_cloud_child_state', canonical_state::text,
      'jannati_child_snapshot:' || child_a, jsonb_build_object(
        'questionHistory', 'must-not-leak', 'answers', 'must-not-leak', 'aiMemory', 'must-not-leak'
      )::text
    ),
    learning_revision = 616
  where fixture_profile.id = fixture_id;

  summary_payload := public.admin_child_summary_payload(fixture_id);
  if summary_payload ->> 'source' <> 'learning_data'
    or (summary_payload ->> 'childCount')::integer <> 2
    or jsonb_array_length(summary_payload -> 'children') <> 2 then
    raise exception 'case_a_two_canonical_children';
  end if;
  if (select count(distinct child_entry ->> 'id') from jsonb_array_elements(summary_payload -> 'children') child_entry) <> 2
    or (select count(*) from jsonb_array_elements(summary_payload -> 'children') child_entry where child_entry ->> 'name' = fixture_name) <> 2 then
    raise exception 'case_b_duplicate_names_preserved';
  end if;
  if summary_payload ->> 'activeChildId' <> child_a
    or (select child_entry ->> 'isActive' from jsonb_array_elements(summary_payload -> 'children') child_entry where child_entry ->> 'id' = child_a) <> 'true'
    or (select child_entry ->> 'isActive' from jsonb_array_elements(summary_payload -> 'children') child_entry where child_entry ->> 'id' = child_b) <> 'false' then
    raise exception 'case_c_active_child_by_id';
  end if;

  canonical_state := jsonb_set(canonical_state, '{archivedChildren}', jsonb_build_object(
    child_b, jsonb_build_object('archivedAt', 200, 'restoredAt', 100)
  ));
  update public.profiles as fixture_profile
  set learning_data = jsonb_build_object('jannati_cloud_child_state', canonical_state::text)
  where fixture_profile.id = fixture_id;
  summary_payload := public.admin_child_summary_payload(fixture_id);
  if (summary_payload ->> 'childCount')::integer <> 1
    or summary_payload #>> '{children,0,id}' <> child_a then
    raise exception 'case_d_archived_child_excluded';
  end if;

  insert into public.learner_profiles (account_id, legacy_child_id, display_name, school_year, avatar)
  values (fixture_id, 'legacy-stale-child', 'Legacy Stale Child', 'Tahun 1', 'janna');
  update public.profiles as fixture_profile set learning_data = '{}'::jsonb where fixture_profile.id = fixture_id;
  summary_payload := public.admin_child_summary_payload(fixture_id);
  if summary_payload ->> 'source' <> 'learner_profiles'
    or (summary_payload ->> 'childCount')::integer <> 1
    or summary_payload #>> '{children,0,id}' <> 'legacy-stale-child' then
    raise exception 'case_e_legacy_fallback';
  end if;

  canonical_state := jsonb_set(canonical_state, '{archivedChildren}', '{}'::jsonb);
  update public.profiles as fixture_profile
  set learning_data = jsonb_build_object('jannati_cloud_child_state', canonical_state::text)
  where fixture_profile.id = fixture_id;
  summary_payload := public.admin_child_summary_payload(fixture_id);
  if summary_payload ->> 'source' <> 'learning_data'
    or (summary_payload ->> 'childCount')::integer <> 2
    or summary_payload::text like '%Legacy Stale Child%' then
    raise exception 'case_f_canonical_wins';
  end if;

  update public.profiles as fixture_profile
  set learning_data = jsonb_build_object('jannati_cloud_child_state', '{malformed')
  where fixture_profile.id = fixture_id;
  summary_payload := public.admin_child_summary_payload(fixture_id);
  if summary_payload ->> 'source' <> 'learner_profiles'
    or (summary_payload ->> 'childCount')::integer <> 1 then
    raise exception 'case_g_malformed_fallback';
  end if;

  perform set_config('request.jwt.claim.sub', fixture_id::text, true);
  begin
    perform public.admin_child_summary_payload(fixture_id);
  exception when others then
    if sqlerrm = 'admin_required' then non_admin_denied := true; else raise; end if;
  end;
  if not non_admin_denied then raise exception 'case_h_non_admin_denied'; end if;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);

  update public.profiles as fixture_profile
  set learning_data = jsonb_build_object(
      'jannati_cloud_child_state', canonical_state::text,
      'jannati_child_snapshot:' || child_a, '{"questionHistory":"must-not-leak","answers":"must-not-leak","aiMemory":"must-not-leak"}'
    ),
    learning_revision = 616
  where fixture_profile.id = fixture_id;
  search_payload := public.admin_search_customers(fixture_name, 'all', 20, 0);
  if not exists (
    select 1 from jsonb_array_elements(search_payload -> 'accounts') account_entry
    where account_entry ->> 'accountId' = fixture_id::text
      and (account_entry ->> 'childCount')::integer = 2
  ) then raise exception 'case_i_search_by_canonical_child'; end if;

  select fixture_profile.learning_data, fixture_profile.learning_revision, fixture_profile.updated_at
    into original_payload, original_revision, original_updated_at
  from public.profiles as fixture_profile where fixture_profile.id = fixture_id;
  detail_payload := public.admin_get_customer_details(fixture_id);
  if detail_payload::text like '%must-not-leak%'
    or detail_payload::text like '%questionHistory%'
    or detail_payload::text like '%aiMemory%'
    or detail_payload ? 'learning_data'
    or detail_payload #>> '{overview,activeChildId}' <> child_a
    or (detail_payload #>> '{overview,childCount}')::integer <> 2 then
    raise exception 'case_j_sensitive_payload_excluded';
  end if;
  if original_payload is distinct from (select fixture_profile.learning_data from public.profiles fixture_profile where fixture_profile.id = fixture_id)
    or original_revision is distinct from (select fixture_profile.learning_revision from public.profiles fixture_profile where fixture_profile.id = fixture_id)
    or original_updated_at is distinct from (select fixture_profile.updated_at from public.profiles fixture_profile where fixture_profile.id = fixture_id) then
    raise exception 'admin_read_path_mutated_learning_state';
  end if;
end;
$check$;
rollback;
select 'PASS: Admin child-source scenarios executed; synthetic schema and data changes rolled back' as admin_child_source_check;
`;

const sql = migration
  .replace(/^begin;/i, "begin;\nset local lock_timeout = '3s';\nset local statement_timeout = '45s';")
  .replace(/commit;\s*$/i, checks);
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'jannati-admin-child-source-'));
const sqlPath = path.join(temporaryDirectory, 'rollback.sql');
try {
  fs.writeFileSync(sqlPath, sql);
  const execution = spawnSync(process.execPath, [
    path.resolve('node_modules/supabase/dist/supabase.js'), 'db', 'query', '--linked', '--file', sqlPath
  ], { stdio: 'inherit', timeout: 120_000 });
  if (execution.error) throw execution.error;
  process.exitCode = execution.status ?? 1;
} finally {
  fs.unlinkSync(sqlPath);
  fs.rmdirSync(temporaryDirectory);
}
