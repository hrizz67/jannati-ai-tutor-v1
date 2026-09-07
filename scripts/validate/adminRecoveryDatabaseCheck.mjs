// Opt-in deployment preflight. Compiles the migration and exercises read/replay
// paths in a bounded transaction that ALWAYS rolls back. No customer is renewed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

assert.ok(process.argv.includes('--linked'), 'Explicit --linked is required for the deployment preflight.');
const migration = fs.readFileSync('supabase/migrations/20260907090000_admin_subscription_recovery.sql', 'utf8');
assert.match(migration, /^begin;/i);
assert.match(migration, /commit;\s*$/i);
const checks = `
do $check$
declare
  admin_id uuid;
  missing_id uuid := gen_random_uuid();
  result jsonb;
  prior public.premium_admin_audit_log%rowtype;
  before_entitlement jsonb;
  payment_count bigint;
  audit_count bigint;
begin
  perform set_config('request.jwt.claims', '{}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  begin
    perform public.admin_verify_subscription_request(missing_id);
    raise exception 'preflight_unauthenticated_allowed';
  exception when others then
    if sqlerrm <> 'not_authenticated' then raise; end if;
  end;
  perform set_config('request.jwt.claim.sub', missing_id::text, true);
  begin
    perform public.admin_verify_subscription_request(missing_id);
    raise exception 'preflight_nonadmin_allowed';
  exception when others then
    if sqlerrm <> 'admin_required' then raise; end if;
  end;
  if has_function_privilege('anon', 'public.admin_verify_subscription_request(uuid)', 'execute') then
    raise exception 'preflight_anon_execute_allowed';
  end if;
  select id into admin_id from public.profiles where is_admin is true limit 1;
  if admin_id is null then raise exception 'preflight_admin_required'; end if;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  result := public.admin_verify_subscription_request(missing_id);
  if result ->> 'status' <> 'not_found' then raise exception 'preflight_missing_request'; end if;
  perform public.admin_get_customer_details(admin_id);

  -- Existing audit identity is used only for a no-write idempotent replay.
  select a.* into prior from public.premium_admin_audit_log a
  where a.action in ('ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY', 'START_TRIAL', 'MARK_COMPLIMENTARY', 'CANCEL_PREMIUM', 'EXPIRE_PREMIUM')
    and (a.action in ('CANCEL_PREMIUM', 'EXPIRE_PREMIUM') or exists (
      select 1 from public.premium_payment_records p where p.request_id = a.request_id))
  order by a.created_at desc limit 1;
  if found then
    before_entitlement := public.premium_entitlement_payload(prior.target_user_id);
    select count(*) into payment_count from public.premium_payment_records;
    select count(*) into audit_count from public.premium_admin_audit_log;
    result := public.admin_apply_subscription_change(
      target_user_id => prior.target_user_id, requested_action => prior.action,
      request_id => prior.request_id, payment_status => 'waived');
    if result ->> 'status' <> 'success' or result ->> 'duplicate' <> 'true'
      or result ->> 'requestId' <> prior.request_id::text then raise exception 'preflight_replay_failed'; end if;
    if before_entitlement is distinct from public.premium_entitlement_payload(prior.target_user_id)
      or payment_count <> (select count(*) from public.premium_payment_records)
      or audit_count <> (select count(*) from public.premium_admin_audit_log) then
      raise exception 'preflight_replay_changed_data';
    end if;
  else
    raise notice 'No existing eligible audit row: replay check skipped; no synthetic customer writes.';
  end if;
end;
$check$;
rollback;
select 'PASS: SQL compilation, authorization, verification; transaction rolled back' as recovery_preflight;
`;
const sql = migration
  .replace(/^begin;/i, "begin;\nset local lock_timeout = '3s';\nset local statement_timeout = '15s';")
  .replace(/commit;\s*$/i, checks);
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'jannati-admin-preflight-'));
const sqlPath = path.join(temporaryDirectory, 'rollback.sql');
try {
  fs.writeFileSync(sqlPath, sql);
  const execution = spawnSync(process.execPath, [
    path.resolve('node_modules/supabase/dist/supabase.js'), 'db', 'query', '--linked', '--file', sqlPath
  ], { stdio: 'inherit', timeout: 60_000 });
  if (execution.error) throw execution.error;
  process.exitCode = execution.status ?? 1;
} finally {
  fs.unlinkSync(sqlPath);
  fs.rmdirSync(temporaryDirectory);
}
