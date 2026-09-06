import { useCallback, useMemo } from 'react';
import { resolveAuthoritativeAccess } from '../services/accessControl.js';

export function usePremiumAccess({ accountUser = null, accessProfile = null } = {}) {
  const accountId = String(accountUser?.id || '').trim();
  const accountEmail = String(accountUser?.email || '').trim();
  const effectiveAccess = useMemo(
    () => resolveAuthoritativeAccess(accountId, accessProfile),
    [accountId, accessProfile]
  );
  const isPremiumUser = Boolean(effectiveAccess.isPremium);

  const applyAuthoritativeProfileAccess = useCallback((candidate = {}) => ({
    ...candidate,
    accountId,
    email: accountEmail,
    accessStatus: effectiveAccess.access_status,
    accessLabel: effectiveAccess.accessLabel,
    accessExpiresAt: effectiveAccess.access_expires_at || null,
    isPremium: isPremiumUser
  }), [accountEmail, accountId, effectiveAccess, isPremiumUser]);

  return Object.freeze({
    effectiveAccess,
    isPremiumUser,
    applyAuthoritativeProfileAccess
  });
}

export default usePremiumAccess;
