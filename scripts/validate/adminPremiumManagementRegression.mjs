import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
}

const migration = read('supabase/migrations/20260906210000_admin_console_v2.sql');
const paymentTable = read('supabase/schemas/public/tables/premium_payment_records.sql');
const entitlementTable = read('supabase/schemas/public/tables/premium_entitlements.sql');
const auditTable = read('supabase/schemas/public/tables/premium_admin_audit_log.sql');
const page = read('src/admin/AdminPremiumPage.jsx');
const service = read('src/services/premiumEntitlement.js');
const app = read('src/App.jsx');
const tests = read('tests/unit/adminPremiumManagement.test.js');

assert.match(migration, /alter table public\.premium_entitlements[\s\S]*add column if not exists is_permanent/i, 'Permanent complimentary must be explicit on the canonical entitlement.');
assert.match(migration, /premium_entitlements_expiry_presence_check/, 'Permanent and expiring entitlement shapes must be constrained.');
assert.match(migration, /create table if not exists public\.premium_payment_records/, 'Payment and renewal bookkeeping table must exist.');
assert.match(migration, /enable row level security[\s\S]*Admins can read premium payment records/i, 'Payment records must use admin-only RLS.');
assert.doesNotMatch(paymentTable, /grant (insert|update|delete|all)[\s\S]{0,100}authenticated/i, 'Browser users must not write payment records directly.');
assert.doesNotMatch(paymentTable, /grant select[\s\S]{0,100}authenticated/i, 'Normal users must not read payment records directly.');
assert.doesNotMatch(entitlementTable, /grant (insert|update|delete|all)[\s\S]{0,100}authenticated/i, 'Browser users must not write entitlements directly.');
assert.doesNotMatch(auditTable, /grant (insert|update|delete|all)[\s\S]{0,100}authenticated/i, 'Browser users must not write audit history directly.');
assert.doesNotMatch(auditTable, /grant select[\s\S]{0,100}authenticated/i, 'Normal users must not read audit history directly.');

for (const rpc of ['admin_console_summary', 'admin_search_customers', 'admin_get_customer_details', 'admin_apply_subscription_change']) assert.ok(migration.includes(rpc), `Missing protected ${rpc} RPC.`);
assert.ok((migration.match(/if not public\.is_current_premium_admin\(\) then raise exception 'admin_required'/g) || []).length >= 4, 'Every Admin Console RPC must verify the server role.');
assert.match(migration, /pg_advisory_xact_lock/, 'Subscription writes must be serialized per account.');
assert.match(migration, /revoke all on function public\.admin_manage_premium_entitlement[\s\S]{0,180}from authenticated/, 'The legacy browser mutation endpoint must be retired.');
assert.match(migration, /premium_payment_records[\s\S]*premium_admin_audit_log[\s\S]*return public\.premium_entitlement_payload/, 'Entitlement, payment and audit must complete in one server transaction.');
assert.match(migration, /when entitlement_active and old_expiry is not null then old_expiry else server_now/, 'Renewal must preserve unused active time.');
assert.match(migration, /when 'START_TRIAL'[\s\S]*next_status := 'trial'/, 'Trial workflow must be server-authorized.');
assert.match(migration, /when 'MARK_COMPLIMENTARY'[\s\S]*next_permanent := coalesce\(\$9, false\)/, 'Complimentary permanence must be explicit.');
assert.match(migration, /case when public\.is_current_premium_admin\(\) then entitlement\.notes else null end/, 'Admin notes must be hidden from normal entitlement readers.');
assert.match(migration, /status in \('active', 'trial', 'complimentary'\)[\s\S]{0,120}is_permanent or entitlement\.expires_at > now\(\)/, 'Trial and complimentary access must expire dynamically using server time.');
assert.doesNotMatch(migration, /2099/, 'V2 must not represent permanent complimentary access with a fake future year.');
assert.equal((migration.match(/9999-12-31/g) || []).length, 1, 'The legacy sentinel date may appear only in its one-time conversion.');
assert.match(migration, /set is_permanent = true,[\s\S]{0,80}expires_at = null[\s\S]{0,160}9999-12-31/, 'The only legacy sentinel date must be converted to explicit permanence.');

assert.match(app, /\['#\/admin', '#\/admin\/premium'\]/, 'Canonical protected Admin Console route and compatibility alias must exist.');
for (const label of ['Jumlah Akaun', 'Premium Aktif', 'Tamat ≤7 Hari', 'Tamat ≤30 Hari', 'Percubaan', 'Complimentary']) assert.ok(page.includes(label), `Dashboard is missing ${label}.`);
for (const action of ['ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY', 'START_TRIAL', 'MARK_COMPLIMENTARY', 'CANCEL_PREMIUM', 'EXPIRE_PREMIUM']) assert.ok(page.includes(action), `Admin Console is missing ${action}.`);
assert.match(page, /paymentReference[\s\S]*Sahkan Perubahan/, 'Renewal confirmation must include the payment reference.');
assert.match(page, /reductionWarning[\s\S]*Saya faham/, 'Dangerous reductions must require explicit acknowledgement.');
assert.match(page, /Eksport CSV Paparan/, 'Filtered CSV export must be available.');
assert.match(page, /childNames[\s\S]*Bayaran terakhir:/, 'Search results must identify child profiles and the latest payment reference.');
assert.match(service, /admin_apply_subscription_change/, 'Client writes must use the atomic server RPC.');
assert.doesNotMatch(service, /supabase\.rpc\(['"]admin_manage_premium_entitlement/, 'Compatibility code must not call the legacy write RPC.');
assert.doesNotMatch(service, /\.from\(['"]premium_(entitlements|payment_records|admin_audit_log)/, 'Client must not write protected tables directly.');
assert.doesNotMatch(service, /localStorage|SUPABASE_SERVICE_ROLE/i, 'Admin authority must not use local state or a service-role browser secret.');
assert.ok((tests.match(/\bit\('/g) || []).length >= 28, 'Admin Console V2 must include at least 28 deterministic tests.');

console.log('Admin Premium Management regression: PASS (dashboard, customer detail, trial, complimentary, atomic payment, RLS, audit)');
