import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
}

const migration = read('supabase/migrations/20260906193000_admin_premium_management.sql');
const entitlementTable = read('supabase/schemas/public/tables/premium_entitlements.sql');
const auditTable = read('supabase/schemas/public/tables/premium_admin_audit_log.sql');
const functions = read('supabase/schemas/public/functions/premium_management.sql');
const app = read('src/App.jsx');
const service = read('src/services/premiumEntitlement.js');
const adminPage = read('src/admin/AdminPremiumPage.jsx');
const dashboard = read('src/dashboard/HomeDashboard.jsx');
const tutorEdge = read('supabase/functions/tutor-ai/index.ts');
const tests = read('tests/unit/premiumEntitlement.test.js');

for (const sql of [migration, entitlementTable]) {
  assert.match(sql, /premium_entitlements/, 'Canonical entitlement table must exist.');
  assert.match(sql, /expires_at[\s\S]{0,40}(timestamp with time zone|timestamptz)/i, 'Expiry must use timestamptz.');
  assert.match(sql, /active[\s\S]{0,80}expired[\s\S]{0,80}cancelled[\s\S]{0,80}trial[\s\S]{0,80}complimentary/, 'All canonical statuses must be constrained.');
  assert.match(sql, /enable row level security/i, 'Entitlement RLS must be enabled.');
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)[\s\S]{0,120}to "?authenticated"?/i, 'Authenticated users must have no direct entitlement write grant.');
}

assert.match(migration, /legacy_profiles_migration/, 'Legacy Premium data must be migrated without deletion.');
assert.match(migration, /'9999-12-31 23:59:59\+00'/, 'Legacy lifetime Premium must become an explicit complimentary expiry.');
assert.match(migration, /pg_advisory_xact_lock/, 'Concurrent entitlement writes must be serialized per account.');
assert.match(migration, /premium_admin_audit_request_key unique/, 'Audit request id must enforce server idempotency.');
assert.match(migration, /when entitlement_active then old_expiry else server_now/, 'Renewal must preserve active unused days and restart expired plans from server time.');
assert.match(migration, /security definer[\s\S]{0,80}set search_path = ''/i, 'Admin RPCs must pin the search path.');
assert.match(migration, /if not public\.is_current_premium_admin\(\) then raise exception 'admin_required'/, 'Every admin RPC must reject normal users.');
assert.match(migration, /revoke all on table public\.premium_admin_audit_log from public, anon, authenticated/, 'Audit writes must not be exposed to browser roles.');
assert.doesNotMatch(auditTable, /grant (update|delete)[\s\S]{0,100}authenticated/i, 'Audit records must not be editable by normal users.');
assert.match(functions, /get_my_premium_entitlement/, 'Declarative schema must include the own-entitlement RPC.');
assert.match(functions, /admin_search_premium_accounts/, 'Declarative schema must include bounded account search.');
assert.match(functions, /least\(greatest\(coalesce\(\$2, 20\), 1\), 50\)/, 'Admin search must cap page size.');

assert.match(app, /loadAccess: signal => loadMyPremiumEntitlement/, 'Login hydration must read canonical entitlement.');
assert.match(app, /window\.addEventListener\('focus', refreshAccountAccess\)/, 'Entitlement must revalidate on focus.');
assert.match(app, /window\.addEventListener\('online', refreshAccountAccess\)/, 'Entitlement must revalidate after reconnect.');
assert.match(app, /visibilitychange/, 'Entitlement must revalidate when the tab is visible.');
assert.doesNotMatch(app, /setInterval\(refreshAccountAccess/, 'Entitlement refresh must avoid excessive polling.');
assert.match(app, /#\/admin\/premium/, 'The protected admin route must exist.');
assert.match(dashboard, /hasAccountSession && isAdmin/, 'Admin navigation must only be presented for a verified admin profile.');
assert.match(adminPage, /role="dialog"[\s\S]{0,3000}Sahkan/, 'Mutations must require a confirmation dialog.');
assert.match(adminPage, /submissionRef\.current/, 'The UI must suppress double submission.');
for (const action of ['ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY', 'CANCEL_PREMIUM', 'MARK_COMPLIMENTARY']) {
  assert.ok(adminPage.includes(action), `Admin UI is missing ${action}.`);
}

assert.doesNotMatch(service, /localStorage|service_role|SUPABASE_SERVICE_ROLE/i, 'Premium authority must not use local storage or a browser service-role secret.');
assert.match(service, /server_access_allowed: serverAllowed/, 'Access must preserve the authoritative server decision.');
assert.match(tutorEdge, /rpc\/get_my_premium_entitlement/, 'Tutor AI must use the same canonical entitlement RPC.');
assert.doesNotMatch(tutorEdge.slice(tutorEdge.indexOf('function premiumIsActive'), tutorEdge.indexOf('function withinRateLimit')), /Date\.now/, 'Tutor AI must not decide entitlement using its own clock.');
assert.equal((tests.match(/\bit\('/g) || []).length, 18, 'The Premium suite must contain all 18 deterministic acceptance tests.');

console.log('Admin Premium regression: PASS (canonical entitlement, RLS, audit, idempotency, refresh lifecycle)');
