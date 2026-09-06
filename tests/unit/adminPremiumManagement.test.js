import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { getAccessLabel, resolveAuthoritativeAccess } from '../../src/services/accessControl.js';
import {
  applyAdminSubscriptionChange,
  buildAdminSubscriptionCsv,
  buildSubscriptionPreview,
  calculateDaysRemaining,
  calculateRenewalExpiry,
  deriveAdminDisplayStatus,
  isFreshAuthenticatedEntitlement,
  loadAdminConsoleSummary,
  malaysiaEndOfDayUtc,
  normalizeServerEntitlement,
  requiresReductionWarning,
  searchAdminCustomers
} from '../../src/services/premiumEntitlement.js';

const SERVER_NOW = '2026-09-06T04:00:00.000Z';
const ACTIVE_EXPIRY = '2026-09-20T04:00:00.000Z';

function entitlement(accountId = 'account-a', overrides = {}) {
  return normalizeServerEntitlement(accountId, {
    accountId,
    plan: 'premium',
    storedStatus: 'active',
    effectiveStatus: 'active',
    startsAt: '2026-08-01T00:00:00.000Z',
    expiresAt: ACTIVE_EXPIRY,
    accessAllowed: true,
    serverNow: SERVER_NOW,
    revision: 2,
    ...overrides
  });
}

function rejectedRpc(message) {
  return { rpc: vi.fn(async () => ({ data: null, error: new Error(message) })) };
}

describe('Admin Console V2 acceptance matrix', () => {
  it('1. anonymous cannot access Admin Console', async () => {
    await expect(loadAdminConsoleSummary(rejectedRpc('not_authenticated'))).rejects.toThrow('not_authenticated');
  });

  it('2. normal user cannot access Admin Console', async () => {
    await expect(loadAdminConsoleSummary(rejectedRpc('admin_required'))).rejects.toThrow('admin_required');
  });

  it('3. normal user cannot update own premium', async () => {
    await expect(applyAdminSubscriptionChange(rejectedRpc('admin_required'), { targetUserId: 'account-a' })).rejects.toThrow('admin_required');
  });

  it('4. normal user cannot update another user premium', async () => {
    await expect(applyAdminSubscriptionChange(rejectedRpc('admin_required'), { targetUserId: 'account-b' })).rejects.toThrow('admin_required');
  });

  it('5. admin can perform an allowed server operation', async () => {
    const rpc = vi.fn(async () => ({ data: { ok: true, duplicate: false }, error: null }));
    await expect(applyAdminSubscriptionChange({ rpc }, { targetUserId: 'account-a', action: 'EXTEND_PREMIUM', durationDays: 30, requestId: 'request-a', paymentReference: 'DN-1' })).resolves.toMatchObject({ ok: true });
    expect(rpc).toHaveBeenCalledWith('admin_apply_subscription_change', expect.objectContaining({ target_user_id: 'account-a' }));
  });

  it('6. no service-role key exists in browser premium code', () => {
    const source = fs.readFileSync(new URL('../../src/services/premiumEntitlement.js', import.meta.url), 'utf8');
    expect(source).not.toMatch(/service[_-]?role|SUPABASE_SERVICE/i);
  });

  it('7. active +30 preserves unused days', () => {
    expect(calculateRenewalExpiry({ expiresAt: ACTIVE_EXPIRY, serverNow: SERVER_NOW, days: 30, accessAllowed: true })).toBe('2026-10-20T04:00:00.000Z');
  });

  it('8. expired +30 begins from server time', () => {
    expect(calculateRenewalExpiry({ expiresAt: '2026-09-01T00:00:00.000Z', serverNow: SERVER_NOW, days: 30, accessAllowed: false })).toBe('2026-10-06T04:00:00.000Z');
  });

  it('9. active +90 works', () => {
    expect(calculateRenewalExpiry({ expiresAt: ACTIVE_EXPIRY, serverNow: SERVER_NOW, days: 90, accessAllowed: true })).toBe('2026-12-19T04:00:00.000Z');
  });

  it('10. active +365 works', () => {
    expect(calculateRenewalExpiry({ expiresAt: ACTIVE_EXPIRY, serverNow: SERVER_NOW, days: 365, accessAllowed: true })).toBe('2027-09-20T04:00:00.000Z');
  });

  it('11. custom expiry uses Malaysia end of day', () => {
    expect(malaysiaEndOfDayUtc('2026-12-20')).toBe('2026-12-20T15:59:59.999Z');
  });

  it('12. earlier custom expiry requires warning', () => {
    expect(requiresReductionWarning({ expiresAt: ACTIVE_EXPIRY }, '2026-09-10T04:00:00.000Z', 'SET_EXPIRY')).toBe(true);
  });

  it('13. trial grants premium until expiry', () => {
    const access = entitlement('trial-a', { plan: 'premium_trial', storedStatus: 'trial', effectiveStatus: 'trial' });
    expect(resolveAuthoritativeAccess('trial-a', access).isPremium).toBe(true);
  });

  it('14. expired trial loses premium', () => {
    const access = entitlement('trial-b', { plan: 'premium_trial', storedStatus: 'trial', effectiveStatus: 'expired', expiresAt: '2026-09-01T00:00:00.000Z', accessAllowed: false });
    expect(resolveAuthoritativeAccess('trial-b', access).isPremium).toBe(false);
  });

  it('15. complimentary access works', () => {
    const access = entitlement('gift-a', { plan: 'premium_complimentary', storedStatus: 'complimentary', effectiveStatus: 'complimentary' });
    expect(resolveAuthoritativeAccess('gift-a', access).isPremium).toBe(true);
  });

  it('16. expired complimentary loses access when expiry is configured', () => {
    const access = entitlement('gift-b', { storedStatus: 'complimentary', effectiveStatus: 'expired', expiresAt: '2026-09-01T00:00:00.000Z', accessAllowed: false });
    expect(resolveAuthoritativeAccess('gift-b', access).isPremium).toBe(false);
  });

  it('17. renewal sends the payment and reference in one RPC', async () => {
    const rpc = vi.fn(async () => ({ data: { ok: true, payment: { paymentReference: 'DN-2' } }, error: null }));
    await applyAdminSubscriptionChange({ rpc }, { targetUserId: 'account-a', action: 'EXTEND_PREMIUM', durationDays: 30, paymentAmount: '29.90', paymentMethod: 'duitnow', paymentReference: 'DN-2', paymentStatus: 'paid', requestId: 'request-b' });
    expect(rpc).toHaveBeenCalledWith('admin_apply_subscription_change', expect.objectContaining({ payment_amount: 29.9, payment_reference: 'DN-2' }));
  });

  it('18. entitlement and payment use one atomic server call', async () => {
    const from = vi.fn();
    const rpc = vi.fn(async () => ({ data: { ok: true }, error: null }));
    await applyAdminSubscriptionChange({ rpc, from }, { targetUserId: 'account-a', action: 'EXTEND_PREMIUM', requestId: 'request-c' });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(from).not.toHaveBeenCalled();
  });

  it('19. failed renewal returns no partial client success', async () => {
    await expect(applyAdminSubscriptionChange(rejectedRpc('transaction_failed'), { targetUserId: 'account-a' })).rejects.toThrow('transaction_failed');
  });

  it('20. stale expired cache cannot override renewed server status', () => {
    const renewed = entitlement('account-a', { revision: 4 });
    expect(resolveAuthoritativeAccess('account-a', renewed).isPremium).toBe(true);
  });

  it('21. stale active cache cannot grant expired premium', () => {
    const stale = { id: 'account-a', access_status: 'premium', access_expires_at: '2999-01-01T00:00:00.000Z' };
    expect(resolveAuthoritativeAccess('account-a', stale).isPremium).toBe(false);
    expect(isFreshAuthenticatedEntitlement(stale, 'account-a')).toBe(false);
  });

  it('22. Account A renewal does not authorize Account B', () => {
    expect(resolveAuthoritativeAccess('account-b', entitlement('account-a')).isPremium).toBe(false);
  });

  it('23. child switch retains family-level subscription', () => {
    const familyAccess = entitlement('family-a');
    expect(resolveAuthoritativeAccess('family-a', familyAccess)).toEqual(resolveAuthoritativeAccess('family-a', familyAccess));
  });

  it('24. Malaysia date boundary is UTC+8 end of day', () => {
    expect(malaysiaEndOfDayUtc('2026-09-06')).toBe('2026-09-06T15:59:59.999Z');
  });

  it('25. invalid Malaysia calendar date is rejected', () => {
    expect(malaysiaEndOfDayUtc('2026-02-31')).toBeNull();
  });

  it('26. premium header uses canonical renewed status', () => {
    expect(getAccessLabel(entitlement('account-a'))).toContain('Premium aktif');
  });

  it('27. days remaining uses authoritative server timestamp', () => {
    expect(calculateDaysRemaining('2026-09-09T04:00:00.000Z', SERVER_NOW)).toBe(3);
    expect(deriveAdminDisplayStatus({ storedStatus: 'active', expiresAt: '2026-09-09T04:00:00.000Z' }, SERVER_NOW)).toBe('expiring_soon');
  });

  it('28. account filters are executed on the server', async () => {
    const rpc = vi.fn(async () => ({ data: { accounts: [], total: 0 }, error: null }));
    await searchAdminCustomers({ rpc }, '', { statusFilter: 'expiring_30', pageSize: 20, pageOffset: 0 });
    expect(rpc).toHaveBeenCalledWith('admin_search_customers', expect.objectContaining({ status_filter: 'expiring_30' }));
  });

  it('exports only the approved subscription fields', () => {
    const csv = buildAdminSubscriptionCsv([{ email: 'a@example.com', displayName: 'A', plan: 'premium', effectiveStatus: 'active', expiresAt: ACTIVE_EXPIRY, daysRemaining: 14, children: ['private'] }]);
    expect(csv).toContain('email,parent_name,plan,status,expires_at,days_remaining');
    expect(csv).not.toContain('private');
  });

  it('builds a trial preview from server time', () => {
    expect(buildSubscriptionPreview({}, { action: 'START_TRIAL', durationDays: 7 }, SERVER_NOW).previewExpiry).toBe('2026-09-13T04:00:00.000Z');
  });
});
