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
