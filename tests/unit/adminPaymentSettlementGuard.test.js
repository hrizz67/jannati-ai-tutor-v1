import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = fs.readFileSync(new URL('../../supabase/migrations/20261011090000_admin_payment_settlement_guard.sql', import.meta.url), 'utf8');
const previous = fs.readFileSync(new URL('../../supabase/migrations/20260910090000_admin_subscription_payment_returning_fix.sql', import.meta.url), 'utf8');
const schema = fs.readFileSync(new URL('../../supabase/schemas/public/functions/admin_console_v2.sql', import.meta.url), 'utf8');
const adminPage = fs.readFileSync(new URL('../../src/admin/AdminPremiumPage.jsx', import.meta.url), 'utf8');

function compact(value) {
  return value.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim();
}

function signature(value) {
  const start = value.indexOf('create or replace function public.admin_apply_subscription_change(');
  const end = value.indexOf('returns jsonb', start);
  return compact(value.slice(start, end));
}

function rpcBody(value) {
  const start = value.indexOf('create or replace function public.admin_apply_subscription_change(');
  const end = value.indexOf('\n$$;', start);
  return value.slice(start, end + 4);
}

const guardMatch = migration.match(/if normalized_action in \(([^)]*)\)\s+and normalized_payment_status not in \(([^)]*)\) then\s+raise exception 'payment_not_settled';/i);
const guardedActions = new Set((guardMatch?.[1].match(/'[^']+'/g) || []).map(value => value.slice(1, -1)));
const settledStatuses = new Set((guardMatch?.[2].match(/'[^']+'/g) || []).map(value => value.slice(1, -1)));
const rejects = (action, status) => guardedActions.has(action) && !settledStatuses.has(status);

describe('Admin payment settlement guard', () => {
  it.each([
    ['pending', 'ACTIVATE_PREMIUM'],
    ['pending', 'EXTEND_PREMIUM'],
    ['failed', 'ACTIVATE_PREMIUM'],
    ['failed', 'EXTEND_PREMIUM'],
    ['refunded', 'ACTIVATE_PREMIUM'],
    ['refunded', 'EXTEND_PREMIUM'],
    ['pending', 'SET_EXPIRY']
  ])('rejects %s for %s', (status, action) => {
    expect(rejects(action, status)).toBe(true);
  });

  it.each([
    ['paid', 'ACTIVATE_PREMIUM'],
    ['paid', 'EXTEND_PREMIUM'],
    ['paid', 'SET_EXPIRY'],
    ['waived', 'ACTIVATE_PREMIUM'],
    ['waived', 'EXTEND_PREMIUM'],
    ['waived', 'SET_EXPIRY']
  ])('allows intentionally settled %s for %s', (status, action) => {
    expect(rejects(action, status)).toBe(false);
  });

  it.each(['START_TRIAL', 'MARK_COMPLIMENTARY', 'CANCEL_PREMIUM', 'EXPIRE_PREMIUM'])('does not apply the billable guard to %s', action => {
    expect(guardedActions.has(action)).toBe(false);
  });

  it('raises before entitlement mutation', () => {
    expect(migration.indexOf("raise exception 'payment_not_settled'")).toBeLessThan(migration.indexOf('insert into public.premium_entitlements'));
  });

  it('raises before payment mutation', () => {
    expect(migration.indexOf("raise exception 'payment_not_settled'")).toBeLessThan(migration.indexOf('insert into public.premium_payment_records as pr'));
  });

  it('raises before audit mutation', () => {
    expect(migration.indexOf("raise exception 'payment_not_settled'")).toBeLessThan(migration.indexOf('insert into public.premium_admin_audit_log'));
  });

  it('preserves duplicate request replay before evaluating a new-write payment guard', () => {
    expect(migration.indexOf("'idempotentReplay', true")).toBeLessThan(migration.indexOf("raise exception 'payment_not_settled'"));
  });

  it('preserves the public RPC signature, authorization and grants', () => {
    expect(signature(migration)).toBe(signature(previous));
    expect(migration).toMatch(/if caller_id is null then raise exception 'not_authenticated'/);
    expect(migration).toMatch(/if not public\.is_current_premium_admin\(\) then raise exception 'admin_required'/);
    expect(migration).toMatch(/revoke all on function public\.admin_apply_subscription_change[\s\S]*grant execute[\s\S]*authenticated, postgres, service_role/);
  });

  it('changes the previous RPC body only by inserting the settlement guard', () => {
    const withoutGuard = rpcBody(migration).replace(/\s*if normalized_action in \('ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY'\)\s+and normalized_payment_status not in \('paid', 'waived'\) then\s+raise exception 'payment_not_settled';\s+end if;/i, ' ');
    expect(compact(withoutGuard)).toBe(compact(rpcBody(previous)));
  });

  it('keeps the declarative function aligned with the forward migration guard', () => {
    expect(schema).toMatch(/normalized_action in \('ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY'\)[\s\S]*normalized_payment_status not in \('paid', 'waived'\)[\s\S]*payment_not_settled/);
  });

  it('prevents Pending in the Admin UI and maps the deterministic server error', () => {
    expect(adminPage).toContain('Bayaran Pending belum boleh mengaktifkan atau melanjutkan Premium.');
    expect(adminPage).toContain('Bayaran belum disahkan. Tandakan sebagai Dibayar atau gunakan akses yang dikecualikan sebelum mengaktifkan Premium.');
  });
});
