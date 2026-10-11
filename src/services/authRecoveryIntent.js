export const AUTH_RECOVERY_STATUS = Object.freeze({
  IDLE: 'idle',
  PENDING: 'pending',
  READY: 'ready',
  INVALID: 'invalid'
});

function readSafeAuthParams(value = '') {
  const source = String(value || '').replace(/^[?#]/, '');
  return source ? new URLSearchParams(source) : new URLSearchParams();
}

export function getInitialAuthRecoveryStatus(locationLike = typeof window !== 'undefined' ? window.location : {}) {
  const searchParams = readSafeAuthParams(locationLike?.search);
  const hashParams = readSafeAuthParams(locationLike?.hash);
  const type = String(hashParams.get('type') || searchParams.get('type') || '').toLowerCase();
  if (type === 'recovery') return AUTH_RECOVERY_STATUS.PENDING;

  const errorCode = String(hashParams.get('error_code') || searchParams.get('error_code') || '').toLowerCase();
  const errorDescription = String(hashParams.get('error_description') || searchParams.get('error_description') || '').toLowerCase();
  if (errorCode === 'otp_expired' || /(?:invalid|expired|tamat tempoh)/.test(errorDescription)) {
    return AUTH_RECOVERY_STATUS.INVALID;
  }
  return AUTH_RECOVERY_STATUS.IDLE;
}

export function resolveAuthRecoveryEvent({ event = '', hasSession = false, currentStatus = AUTH_RECOVERY_STATUS.IDLE } = {}) {
  if (event === 'PASSWORD_RECOVERY') {
    return {
      status: hasSession ? AUTH_RECOVERY_STATUS.READY : AUTH_RECOVERY_STATUS.INVALID,
      shouldHydrate: false
    };
  }
  if (currentStatus === AUTH_RECOVERY_STATUS.PENDING && ['INITIAL_SESSION', 'SIGNED_IN'].includes(event)) {
    return {
      status: hasSession ? AUTH_RECOVERY_STATUS.READY : AUTH_RECOVERY_STATUS.INVALID,
      shouldHydrate: false
    };
  }
  if (currentStatus !== AUTH_RECOVERY_STATUS.IDLE && event !== 'SIGNED_OUT') {
    return { status: currentStatus, shouldHydrate: false };
  }
  return { status: currentStatus, shouldHydrate: true };
}
