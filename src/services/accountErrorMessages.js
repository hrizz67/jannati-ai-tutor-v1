export const ACCOUNT_CONNECTIVITY_EVENT = 'jannati:account-connectivity';

export const ACCOUNT_ERROR_KIND = Object.freeze({
  INVALID_CREDENTIALS: 'invalid-credentials',
  ALREADY_REGISTERED: 'already-registered',
  RATE_LIMITED: 'rate-limited',
  OFFLINE: 'offline',
  MODULE_LOAD: 'module-load',
  SERVER_UNREACHABLE: 'server-unreachable',
  SERVER_FAILURE: 'server-failure',
  GENERIC: 'generic'
});

const ACCOUNT_ERROR_COPY = Object.freeze({
  [ACCOUNT_ERROR_KIND.INVALID_CREDENTIALS]: 'E-mel atau kata laluan tidak betul. Semak semula dan cuba lagi.',
  [ACCOUNT_ERROR_KIND.ALREADY_REGISTERED]: 'E-mel ini sudah berdaftar. Tukar kepada Log masuk atau gunakan e-mel lain.',
  [ACCOUNT_ERROR_KIND.RATE_LIMITED]: 'Terlalu banyak cubaan dibuat. Tunggu sebentar sebelum cuba lagi.',
  [ACCOUNT_ERROR_KIND.OFFLINE]: 'Peranti sedang luar talian. Sambung ke internet dan cuba lagi. Mod Free masih boleh digunakan.',
  [ACCOUNT_ERROR_KIND.MODULE_LOAD]: 'Sistem akaun belum dapat dimuatkan. Muat semula aplikasi dan cuba lagi.',
  [ACCOUNT_ERROR_KIND.SERVER_UNREACHABLE]: 'Sambungan ke pelayan akaun gagal. Internet anda mungkin aktif tetapi pelayan akaun tidak dapat dicapai. Cuba lagi sebentar.',
  [ACCOUNT_ERROR_KIND.SERVER_FAILURE]: 'Pelayan akaun sedang mengalami masalah. Cuba lagi sebentar.',
  [ACCOUNT_ERROR_KIND.GENERIC]: 'Akaun tidak dapat diproses sekarang. Cuba lagi sebentar.'
});

function getOnlineState(online) {
  if (typeof online === 'boolean') return online;
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

function getStatus(error) {
  const status = Number(error?.status ?? error?.statusCode ?? error?.context?.status);
  return Number.isFinite(status) && status > 0 ? status : null;
}

export function classifyAccountError(error, { online } = {}) {
  const message = String(error?.message || '').trim().toLowerCase();
  const code = String(error?.code || '').trim().toLowerCase();
  const status = getStatus(error);

  if (message.includes('invalid login credentials') || code === 'invalid_credentials') {
    return ACCOUNT_ERROR_KIND.INVALID_CREDENTIALS;
  }
  if (message.includes('user already registered') || message.includes('already been registered')) {
    return ACCOUNT_ERROR_KIND.ALREADY_REGISTERED;
  }
  if (status === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return ACCOUNT_ERROR_KIND.RATE_LIMITED;
  }
  if (
    message.includes('failed to fetch dynamically imported module')
    || message.includes('error loading dynamically imported module')
    || message.includes('importing a module script failed')
    || message.includes('dynamically imported module')
  ) {
    return ACCOUNT_ERROR_KIND.MODULE_LOAD;
  }
  if (!getOnlineState(online)) return ACCOUNT_ERROR_KIND.OFFLINE;
  if (
    message.includes('failed to fetch')
    || message.includes('networkerror')
    || message.includes('network request failed')
    || message.includes('fetch failed')
    || message === 'load failed'
    || code === 'network_error'
  ) {
    return ACCOUNT_ERROR_KIND.SERVER_UNREACHABLE;
  }
  if ((status && status >= 500) || message.includes('server error') || message.includes('service unavailable')) {
    return ACCOUNT_ERROR_KIND.SERVER_FAILURE;
  }
  return ACCOUNT_ERROR_KIND.GENERIC;
}

export function getAccountConnectivityForErrorKind(kind) {
  if (kind === ACCOUNT_ERROR_KIND.OFFLINE) return 'offline';
  if (kind === ACCOUNT_ERROR_KIND.SERVER_UNREACHABLE) return 'unreachable';
  if (kind === ACCOUNT_ERROR_KIND.MODULE_LOAD) return 'unknown';
  return 'reachable';
}

export function describeAccountError(error, options = {}) {
  const kind = classifyAccountError(error, options);
  return {
    kind,
    message: ACCOUNT_ERROR_COPY[kind],
    connectivity: getAccountConnectivityForErrorKind(kind),
    diagnostic: {
      kind,
      name: String(error?.name || 'Error').slice(0, 80),
      status: getStatus(error),
      code: String(error?.code || '').slice(0, 80) || null
    }
  };
}

export function formatAccountError(error, options = {}) {
  return describeAccountError(error, options).message;
}

export function announceAccountConnectivity(status, eventTarget = typeof window !== 'undefined' ? window : null) {
  if (!eventTarget?.dispatchEvent || typeof CustomEvent === 'undefined') return false;
  eventTarget.dispatchEvent(new CustomEvent(ACCOUNT_CONNECTIVITY_EVENT, {
    detail: { status: ['offline', 'unreachable', 'reachable'].includes(status) ? status : 'unknown' }
  }));
  return true;
}

