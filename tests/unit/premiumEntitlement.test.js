import { describe, expect, it, vi } from 'vitest';
import { resolveAuthoritativeAccess } from '../../src/services/accessControl.js';
import {
  calculateRenewalExpiry,
  isFreshAuthenticatedEntitlement,
  malaysiaEndOfDayUtc,
  managePremiumEntitlement,
  normalizeServerEntitlement
} from '../../src/services/premiumEntitlement.js';

const SERVER_NOW = '2026-09-06T04:00:00.000Z';

function entitlement(accountId, overrides = {}) {
  return normalizeServerEntitlement(accountId, {
    accountId,
    plan: 'premium',
    storedStatus: 'active',
    effectiveStatus: 'active',
    startsAt: '2026-08-01T00:00:00.000Z',
    expiresAt: '2026-10-01T00:00:00.000Z',
    accessAllowed: true,
    serverNow: SERVER_NOW,
    revision: 2,
    ...overrides
  });
}

describe('canonical premium entitlement acceptance cases', () => {
  it('1. keeps a free user free', () => {
    const value = entitlement('free-1', { plan: 'free', storedStatus: 'free', effectiveStatus: 'free', expiresAt: null, accessAllowed: false });
    expect(resolveAuthoritativeAccess('free-1', value).isPremium).toBe(false);
  });

  it('2. denies expired premium', () => {
    const value = entitlement('expired-1', { effectiveStatus: 'expired', expiresAt: '2026-09-01T00:00:00.000Z', accessAllowed: false });
    expect(resolveAuthoritativeAccess('expired-1', value).isPremium).toBe(false);
  });

  it('3. allows active premium verified by the server', () => {
    expect(resolveAuthoritativeAccess('active-1', entitlement('active-1')).isPremium).toBe(true);
  });

  it('4. active +30 days preserves unused days', () => {
    expect(calculateRenewalExpiry({ expiresAt: '2026-09-20T04:00:00.000Z', serverNow: SERVER_NOW, days: 30, accessAllowed: true }))
      .toBe('2026-10-20T04:00:00.000Z');
  });

  it('5. expired +30 days starts from server now', () => {
    expect(calculateRenewalExpiry({ expiresAt: '2026-09-01T04:00:00.000Z', serverNow: SERVER_NOW, days: 30, accessAllowed: false }))
      .toBe('2026-10-06T04:00:00.000Z');
  });

  it('6. admin mutation calls the protected RPC', async () => {
    const rpc = vi.fn(async () => ({ data: { ok: true, effectiveStatus: 'active' }, error: null }));
    await expect(managePremiumEntitlement({ rpc }, { targetUserId: 'user-1', action: 'ACTIVATE_PREMIUM', durationDays: 30, requestId: 'request-1' }))
      .resolves.toMatchObject({ ok: true });
    expect(rpc).toHaveBeenCalledWith('admin_manage_premium_entitlement', expect.objectContaining({ target_user_id: 'user-1' }));
  });

  it('7. normal-user rejection remains a denied mutation', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: new Error('admin_required') }));
    await expect(managePremiumEntitlement({ rpc }, { targetUserId: 'user-1', action: 'EXTEND_PREMIUM', durationDays: 30, requestId: 'request-2' }))
      .rejects.toThrow('admin_required');
  });

  it('8. the client wrapper never writes expiry directly to a table', async () => {
    const from = vi.fn(() => { throw new Error('direct_table_write'); });
    const rpc = vi.fn(async () => ({ data: { ok: true }, error: null }));
    await managePremiumEntitlement({ rpc, from }, { targetUserId: 'user-1', action: 'SET_EXPIRY', expiresAt: '2026-10-01T00:00:00.000Z', requestId: 'request-3' });
    expect(from).not.toHaveBeenCalled();
  });

  it('9. a fresh renewed server response replaces expired presentation', () => {
    const renewed = resolveAuthoritativeAccess('user-1', entitlement('user-1', { revision: 3 }));
    expect(renewed.accessLabel).toContain('Premium aktif');
  });

  it('10. browser reload can rebuild active access from the server payload alone', () => {
    const reloaded = normalizeServerEntitlement('user-1', { accountId: 'user-1', effectiveStatus: 'active', storedStatus: 'active', accessAllowed: true, expiresAt: '2026-10-01T00:00:00.000Z', serverNow: SERVER_NOW });
    expect(resolveAuthoritativeAccess('user-1', reloaded).isPremium).toBe(true);
  });

  it('11. two accounts cannot share entitlement state', () => {
    expect(resolveAuthoritativeAccess('user-b', entitlement('user-a')).isPremium).toBe(false);
  });

  it('12. child switching does not change an account-level family entitlement', () => {
    const familyAccess = entitlement('family-1');
    const childA = resolveAuthoritativeAccess('family-1', familyAccess);
    const childB = resolveAuthoritativeAccess('family-1', familyAccess);
    expect(childA.isPremium).toBe(true);
    expect(childB).toEqual(childA);
  });

  it('13. Malaysia calendar-day expiry ends at 23:59:59.999 UTC+8', () => {
    expect(malaysiaEndOfDayUtc('2026-09-06')).toBe('2026-09-06T15:59:59.999Z');
  });

  it('14. one request id cannot extend twice', async () => {
    const applied = new Set();
    let writes = 0;
    const rpc = vi.fn(async (_name, params) => {
      const duplicate = applied.has(params.request_id);
      if (!duplicate) { applied.add(params.request_id); writes += 1; }
      return { data: { ok: true, duplicate }, error: null };
    });
    const command = { targetUserId: 'user-1', action: 'EXTEND_PREMIUM', durationDays: 30, requestId: 'same-request' };
    await managePremiumEntitlement({ rpc }, command);
    const retry = await managePremiumEntitlement({ rpc }, command);
    expect(retry.duplicate).toBe(true);
    expect(writes).toBe(1);
  });

  it('15. cancelled entitlement denies premium', () => {
    const value = entitlement('cancelled-1', { storedStatus: 'cancelled', effectiveStatus: 'cancelled', accessAllowed: false });
    expect(resolveAuthoritativeAccess('cancelled-1', value).isPremium).toBe(false);
  });

  it('16. active complimentary entitlement works', () => {
    const value = entitlement('gift-1', { storedStatus: 'complimentary', effectiveStatus: 'complimentary', accessAllowed: true });
    expect(resolveAuthoritativeAccess('gift-1', value).isPremium).toBe(true);
  });

  it('17. stale local premium cannot override expired server authority', () => {
    const staleLocal = { id: 'user-1', access_status: 'premium', access_expires_at: '2999-01-01T00:00:00.000Z' };
    expect(resolveAuthoritativeAccess('user-1', staleLocal).isPremium).toBe(false);
  });

  it('18. renewed server authority overrides stale expired cache', () => {
    const stale = entitlement('user-1', { effectiveStatus: 'expired', accessAllowed: false, expiresAt: '2026-09-01T00:00:00.000Z' });
    const renewed = entitlement('user-1', { revision: 4, expiresAt: '2026-10-06T04:00:00.000Z' });
    expect(isFreshAuthenticatedEntitlement(stale, 'user-1')).toBe(true);
    expect(resolveAuthoritativeAccess('user-1', renewed).isPremium).toBe(true);
  });
});
