export async function settleLogoutStep(task, { timeoutMs = 8000, timeoutCode = 'timeout' } = {}) {
  let timer = null;
  const guardedTask = Promise.resolve()
    .then(() => typeof task === 'function' ? task() : task)
    .then(value => ({ ok: true, value }))
    .catch(error => ({ ok: false, error, errorCode: 'failed' }));
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve({ ok: false, errorCode: timeoutCode }), timeoutMs);
  });
  const result = await Promise.race([guardedTask, timeout]);
  if (timer) clearTimeout(timer);
  return result;
}

export async function signOutCurrentBrowserSession(auth, options = {}) {
  if (!auth || typeof auth.signOut !== 'function') {
    return { ok: false, errorCode: 'auth-unavailable' };
  }
  const outcome = await settleLogoutStep(
    () => auth.signOut({ scope: 'local' }),
    { ...options, timeoutCode: 'signout-timeout' }
  );
  if (!outcome.ok) return outcome;
  if (outcome.value?.error) {
    return { ok: false, error: outcome.value.error, errorCode: 'signout-failed' };
  }
  return { ok: true };
}

export function clearAuthenticatedBrowserStorage(storage, {
  isAccountDataKey = () => false,
  accountScopeKey = ''
} = {}) {
  if (!storage || typeof storage.length !== 'number' || typeof storage.key !== 'function' || typeof storage.removeItem !== 'function') {
    return { ok: false, errorCode: 'storage-unavailable', removedKeys: [] };
  }
  try {
    const removableKeys = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && isAccountDataKey(key)) removableKeys.push(key);
    }
    removableKeys.forEach(key => storage.removeItem(key));
    if (accountScopeKey) storage.removeItem(accountScopeKey);
    const unclearedKeys = removableKeys.filter(key => storage.getItem(key) !== null);
    const scopeStillActive = accountScopeKey && storage.getItem(accountScopeKey) !== null;
    return {
      ok: unclearedKeys.length === 0 && !scopeStillActive,
      errorCode: unclearedKeys.length || scopeStillActive ? 'storage-cleanup-incomplete' : '',
      removedKeys: removableKeys
    };
  } catch (error) {
    return { ok: false, error, errorCode: 'storage-cleanup-failed', removedKeys: [] };
  }
}

export async function executeAuthenticatedLogout({
  auth,
  hasPendingChanges = false,
  syncPendingChanges = null,
  confirmUnsynced = null,
  invalidatePendingWork = null,
  clearAuthenticatedState = null,
  timeoutMs = 8000
} = {}) {
  let syncAcknowledged = !hasPendingChanges;
  if (hasPendingChanges) {
    const syncOutcome = await settleLogoutStep(
      () => typeof syncPendingChanges === 'function' ? syncPendingChanges() : false,
      { timeoutMs, timeoutCode: 'sync-timeout' }
    );
    syncAcknowledged = syncOutcome.ok && syncOutcome.value === true;
    if (!syncAcknowledged) {
      const confirmed = typeof confirmUnsynced === 'function' && await confirmUnsynced(syncOutcome);
      if (!confirmed) return { ok: false, cancelled: true, errorCode: 'unsynced-cancelled', syncAcknowledged: false };
    }
  }

  if (typeof invalidatePendingWork === 'function') await invalidatePendingWork();
  const signOutResult = await signOutCurrentBrowserSession(auth, { timeoutMs });
  if (!signOutResult.ok) return { ...signOutResult, signedOut: false, syncAcknowledged };

  const cleanupResult = typeof clearAuthenticatedState === 'function'
    ? await clearAuthenticatedState()
    : { ok: false, errorCode: 'cleanup-unavailable' };
  if (cleanupResult === false || cleanupResult?.ok === false) {
    return {
      ok: false,
      signedOut: true,
      syncAcknowledged,
      errorCode: cleanupResult?.errorCode || 'cleanup-failed'
    };
  }
  return { ok: true, signedOut: true, syncAcknowledged };
}
