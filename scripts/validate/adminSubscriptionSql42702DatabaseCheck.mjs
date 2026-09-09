// Opt-in linked-database check. It installs the forward migration and exercises
// mutation scenarios inside one transaction that ALWAYS rolls back. It never
// uses the failed production request ID and never commits a Premium renewal.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

assert.ok(process.argv.includes('--linked'), 'Explicit --linked is required for the PostgreSQL 42702 rollback check.');
const migration = fs.readFileSync('supabase/migrations/20260910090000_admin_subscription_payment_returning_fix.sql', 'utf8');
assert.match(migration, /^begin;/i);
assert.match(migration, /commit;\s*$/i);

const checks = String.raw`
do $check$
declare
  admin_id uuid;
  waived_request_id uuid := gen_random_uuid();
  paid_request_id uuid := gen_random_uuid();
  missing_reference_request_id uuid := gen_random_uuid();
  result jsonb;
  replay jsonb;
  verification jsonb;
  expiry_after_paid timestamptz;
  payment_count bigint;
  audit_count bigint;
begin
  select p.id into admin_id from public.profiles p where p.is_admin is true order by p.id limit 1;
  if admin_id is null then raise exception 'rollback_check_admin_required'; end if;
  perform set_config('request.jwt.claims', '{}', true);
  perform set_config('request.jwt.claim.sub', admin_id::text, true);

  result := public.admin_apply_subscription_change(
    target_user_id => admin_id,
    requested_action => 'ACTIVATE_PREMIUM',
    duration_days => 30,
    requested_note => 'SQL 42702 rollback check',
    request_id => waived_request_id,
    payment_amount => 0,
    payment_currency => 'MYR',
    payment_method => 'duitnow',
    payment_reference => null,
    payment_status => 'waived'
  );
  if result ->> 'ok' <> 'true' or result ->> 'duplicate' <> 'false'
    or result #>> '{payment,paymentMethod}' <> 'duitnow'
    or result #>> '{payment,paymentStatus}' <> 'waived'
    or result #> '{payment,paymentReference}' <> 'null'::jsonb then
    raise exception 'rollback_check_waived_activation_failed';
  end if;
  verification := public.admin_verify_subscription_request(waived_request_id);
  if verification ->> 'status' <> 'success'
    or verification ->> 'entitlementMatches' <> 'true'
    or verification ->> 'paymentRecordFound' <> 'true'
    or verification ->> 'auditRecordFound' <> 'true' then
    raise exception 'rollback_check_waived_verification_failed';
  end if;

  result := public.admin_apply_subscription_change(
    target_user_id => admin_id,
    requested_action => 'EXTEND_PREMIUM',
    duration_days => 2,
    requested_note => 'SQL 42702 paid rollback check',
    request_id => paid_request_id,
    payment_amount => 10,
    payment_currency => 'MYR',
    payment_method => 'duitnow',
    payment_reference => 'SQL-42702-ROLLBACK',
    payment_status => 'paid'
  );
  if result ->> 'ok' <> 'true'
    or result #>> '{payment,paymentReference}' <> 'SQL-42702-ROLLBACK'
    or result #>> '{payment,paymentStatus}' <> 'paid' then
    raise exception 'rollback_check_paid_transaction_failed';
  end if;
  expiry_after_paid := (result ->> 'newExpiry')::timestamptz;
  select count(*) into payment_count from public.premium_payment_records pr where pr.request_id = paid_request_id;
  select count(*) into audit_count from public.premium_admin_audit_log al where al.request_id = paid_request_id;

  replay := public.admin_apply_subscription_change(
    target_user_id => admin_id,
    requested_action => 'EXTEND_PREMIUM',
    duration_days => 2,
    request_id => paid_request_id,
    payment_amount => 10,
    payment_currency => 'MYR',
    payment_method => 'duitnow',
    payment_reference => 'SQL-42702-ROLLBACK',
    payment_status => 'paid'
  );
  if replay ->> 'idempotentReplay' <> 'true' or replay ->> 'duplicate' <> 'true'
    or (replay ->> 'newExpiry')::timestamptz is distinct from expiry_after_paid
    or payment_count <> (select count(*) from public.premium_payment_records pr where pr.request_id = paid_request_id)
    or audit_count <> (select count(*) from public.premium_admin_audit_log al where al.request_id = paid_request_id) then
    raise exception 'rollback_check_idempotent_replay_failed';
  end if;

  begin
    perform public.admin_apply_subscription_change(
      target_user_id => admin_id,
      requested_action => 'EXTEND_PREMIUM',
      duration_days => 1,
      request_id => missing_reference_request_id,
      payment_amount => 10,
      payment_currency => 'MYR',
      payment_method => 'duitnow',
      payment_reference => null,
      payment_status => 'paid'
    );
    raise exception 'rollback_check_missing_reference_allowed';
  exception when others then
    if sqlerrm <> 'payment_reference_required' then raise; end if;
  end;
  verification := public.admin_verify_subscription_request(missing_reference_request_id);
  if verification ->> 'status' <> 'not_found' then raise exception 'rollback_check_missing_reference_wrote_data'; end if;

  verification := public.admin_verify_subscription_request(paid_request_id);
  if verification ->> 'status' <> 'success'
    or verification ->> 'entitlementMatches' <> 'true'
    or verification ->> 'paymentRecordFound' <> 'true'
    or verification ->> 'auditRecordFound' <> 'true' then
    raise exception 'rollback_check_paid_verification_failed';
  end if;
end;
$check$;
rollback;
select 'PASS: PostgreSQL 42702 scenarios executed; all schema and data changes rolled back' as admin_subscription_42702_check;
`;

const sql = migration
  .replace(/^begin;/i, "begin;\nset local lock_timeout = '3s';\nset local statement_timeout = '30s';")
  .replace(/commit;\s*$/i, checks);
assert.doesNotMatch(sql, /a6a7ba94/i, 'The production request ID must not appear in rollback automation.');
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'jannati-admin-42702-'));
const sqlPath = path.join(temporaryDirectory, 'rollback.sql');
try {
  fs.writeFileSync(sqlPath, sql);
  const execution = spawnSync(process.execPath, [
    path.resolve('node_modules/supabase/dist/supabase.js'), 'db', 'query', '--linked', '--file', sqlPath
  ], { stdio: 'inherit', timeout: 90_000 });
  if (execution.error) throw execution.error;
  process.exitCode = execution.status ?? 1;
} finally {
  fs.unlinkSync(sqlPath);
  fs.rmdirSync(temporaryDirectory);
}
