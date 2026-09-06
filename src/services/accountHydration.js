export const ACCOUNT_HYDRATION_TIMEOUT_MS = 8000;

function asRejectedResult(reason) {
  return { data: null, error: reason instanceof Error ? reason : new Error(String(reason || 'account_hydration_failed')) };
}

export async function settleAccountHydration({
  loadProfile,
  loadLearning,
  loadAccess,
  timeoutMs = ACCOUNT_HYDRATION_TIMEOUT_MS
} = {}) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  let timeoutId;
  const timeoutError = new Error('account_hydration_timeout');
  timeoutError.name = 'TimeoutError';

  const remoteRequest = Promise.allSettled([
    Promise.resolve().then(() => loadProfile?.(controller?.signal)),
    Promise.resolve().then(() => loadLearning?.(controller?.signal)),
    Promise.resolve().then(() => loadAccess?.(controller?.signal))
  ]).then(([profileResult, learningResult, accessResult]) => ({
    timedOut: false,
    profileResult: profileResult.status === 'fulfilled'
      ? profileResult.value
      : asRejectedResult(profileResult.reason),
    learningResult: learningResult.status === 'fulfilled'
      ? learningResult.value
      : asRejectedResult(learningResult.reason),
    accessResult: accessResult.status === 'fulfilled'
      ? accessResult.value
      : asRejectedResult(accessResult.reason)
  }));

  const timeoutRequest = new Promise(resolve => {
    timeoutId = setTimeout(() => {
      controller?.abort(timeoutError);
      resolve({
        timedOut: true,
        profileResult: asRejectedResult(timeoutError),
        learningResult: asRejectedResult(timeoutError),
        accessResult: asRejectedResult(timeoutError)
      });
    }, Math.max(1, Number(timeoutMs) || ACCOUNT_HYDRATION_TIMEOUT_MS));
  });

  try {
    return await Promise.race([remoteRequest, timeoutRequest]);
  } finally {
    clearTimeout(timeoutId);
  }
}
