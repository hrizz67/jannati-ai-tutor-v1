import assert from 'node:assert/strict';
import fs from 'node:fs';

const previousPath = 'supabase/migrations/20260907090000_admin_subscription_recovery.sql';
const migrationPath = 'supabase/migrations/20260910090000_admin_subscription_payment_returning_fix.sql';
const schemaPath = 'supabase/schemas/public/functions/admin_console_v2.sql';
const databaseCheckPath = 'scripts/validate/adminSubscriptionSql42702DatabaseCheck.mjs';
const previous = fs.readFileSync(previousPath, 'utf8');
const migration = fs.readFileSync(migrationPath, 'utf8');
const schema = fs.readFileSync(schemaPath, 'utf8');
const databaseCheck = fs.readFileSync(databaseCheckPath, 'utf8');

function extractRpc(source) {
  const start = source.indexOf('create or replace function public.admin_apply_subscription_change(');
  assert.ok(start >= 0, 'admin_apply_subscription_change definition is missing.');
  const end = source.indexOf('\n$$;', start);
  assert.ok(end > start, 'admin_apply_subscription_change terminator is missing.');
  return source.slice(start, end + 4);
}

function compactSql(source) {
  return source.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim();
}

function signature(source) {
  const rpc = extractRpc(source);
  return compactSql(rpc.slice(0, rpc.indexOf('returns jsonb')));
}

const previousRpc = extractRpc(previous);
const fixedRpc = extractRpc(migration);
const schemaRpc = extractRpc(schema);
const expectedFixedRpc = compactSql(previousRpc)
  .replace('insert into public.premium_payment_records(', 'insert into public.premium_payment_records as pr(')
  .replace(
    "returning jsonb_build_object('id', id, 'amount', amount, 'currency', currency, 'paymentMethod', payment_method, 'paymentReference', payment_reference, 'paymentStatus', payment_status, 'createdAt', created_at) into payment_payload;",
    "returning jsonb_build_object('id', pr.id, 'amount', pr.amount, 'currency', pr.currency, 'paymentMethod', pr.payment_method, 'paymentReference', pr.payment_reference, 'paymentStatus', pr.payment_status, 'createdAt', pr.created_at) into payment_payload;"
  );

assert.equal(signature(fixedRpc), signature(previousRpc), 'The public RPC name, parameter names, order and defaults must remain backward compatible.');
assert.equal(compactSql(fixedRpc), expectedFixedRpc, 'The forward migration may only qualify the premium payment INSERT/RETURNING row.');
assert.match(migration, /^begin;/i, 'The forward migration must be transactional.');
assert.match(migration, /commit;\s*$/i, 'The forward migration must commit atomically.');
assert.match(fixedRpc, /pg_advisory_xact_lock\(hashtextextended\('admin-subscription:' \|\| \$8::text, 0\)\)[\s\S]*pg_advisory_xact_lock\(hashtextextended\(\$1::text, 0\)\)/, 'Global request and per-account advisory locks must be preserved.');
assert.match(fixedRpc, /replay_audit[\s\S]*idempotentReplay', true/, 'Global request-id idempotent replay must be preserved.');
assert.match(fixedRpc, /payment_reference_required/, 'Paid transactions must still require a payment reference.');

const entitlementAt = fixedRpc.indexOf('insert into public.premium_entitlements');
const profileAt = fixedRpc.indexOf('insert into public.profiles');
const paymentAt = fixedRpc.indexOf('insert into public.premium_payment_records as pr');
const auditAt = fixedRpc.indexOf('insert into public.premium_admin_audit_log');
assert.ok(entitlementAt >= 0 && entitlementAt < profileAt && profileAt < paymentAt && paymentAt < auditAt, 'Entitlement, profile access, payment and audit writes must remain in one ordered RPC transaction.');

const returningMatch = fixedRpc.match(/returning\s+jsonb_build_object\(([\s\S]*?)\)\s+into\s+payment_payload;/i);
assert.ok(returningMatch, 'The premium payment RETURNING payload is missing.');
const returningExpressions = returningMatch[1].replace(/'[^']*'/g, '');
for (const column of ['id', 'amount', 'currency', 'payment_method', 'payment_reference', 'payment_status', 'created_at']) {
  assert.match(returningExpressions, new RegExp(`\\bpr\\.${column}\\b`), `${column} must be qualified through the inserted-row alias.`);
  const withoutQualified = returningExpressions.replace(new RegExp(`\\bpr\\.${column}\\b`, 'g'), '');
  assert.doesNotMatch(withoutQualified, new RegExp(`\\b${column}\\b`), `${column} remains ambiguous in RETURNING.`);
}

assert.match(schemaRpc, /insert into public\.premium_payment_records as pr\(/, 'The declarative schema must retain the payment target alias.');
assert.match(schemaRpc, /'paymentMethod', pr\.payment_method[\s\S]*'paymentReference', pr\.payment_reference[\s\S]*'paymentStatus', pr\.payment_status/, 'The declarative schema must retain qualified payment fields.');
assert.doesNotMatch(migration, /a6a7ba94/i, 'The failed production request ID must never be embedded or executed by automation.');

for (const scenario of [
  "requested_action => 'ACTIVATE_PREMIUM'",
  'duration_days => 30',
  "payment_method => 'duitnow'",
  "payment_status => 'waived'",
  'payment_reference => null',
  "payment_status => 'paid'",
  "payment_reference => 'SQL-42702-ROLLBACK'",
  'payment_reference_required',
  "replay ->> 'idempotentReplay' <> 'true'",
  "verification ->> 'entitlementMatches' <> 'true'",
  "verification ->> 'paymentRecordFound' <> 'true'",
  "verification ->> 'auditRecordFound' <> 'true'",
  'rollback;'
]) assert.ok(databaseCheck.includes(scenario), `Missing rollback database scenario: ${scenario}`);

console.log('Admin subscription PostgreSQL 42702 regression: PASS (qualified RETURNING, unchanged RPC contract, atomic/idempotent rollback matrix)');
