export const PARENT_SECURITY_STORAGE_PREFIX = 'jannati_parent_security:';

const PIN_RECORD_VERSION = 1;
const PBKDF2_ITERATIONS = 120000;
const RATE_LIMIT_PREFIX = 'jannati_parent_rate:';
const RECOVERY_PREFIX = 'jannati_parent_recovery:';
const MAX_ATTEMPTS = 3;
const BASE_LOCK_MS = 30000;
const MAX_LOCK_MS = 5 * 60 * 1000;

function cleanAccountId(accountId) {
  return String(accountId || '').trim();
}

function getPinStorageKey(accountId) {
  return `${PARENT_SECURITY_STORAGE_PREFIX}${cleanAccountId(accountId)}`;
}

function getRateLimitKey(accountId) {
  return `${RATE_LIMIT_PREFIX}${cleanAccountId(accountId)}`;
}

function getRecoveryKey(accountId) {
  return `${RECOVERY_PREFIX}${cleanAccountId(accountId)}`;
}

function resolveStorage(storage, name) {
  if (storage) return storage;
  try {
    return globalThis?.[name] || null;
  } catch {
    return null;
  }
}

function bytesToBase64(bytes) {
  if (typeof btoa !== 'function') throw new Error('parent_pin_crypto_unavailable');
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  if (typeof atob !== 'function') throw new Error('parent_pin_crypto_unavailable');
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function getWebCrypto() {
  const webCrypto = globalThis?.crypto;
  if (!webCrypto?.subtle || typeof webCrypto.getRandomValues !== 'function') {
    throw new Error('parent_pin_crypto_unavailable');
  }
  return webCrypto;
}

function constantTimeEqual(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array) || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}

async function derivePinVerifier(accountId, pin, salt, iterations = PBKDF2_ITERATIONS) {
  const webCrypto = getWebCrypto();
  const material = new TextEncoder().encode(`${cleanAccountId(accountId)}:${pin}`);
  const key = await webCrypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits']);
  const bits = await webCrypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt,
    iterations
  }, key, 256);
  return new Uint8Array(bits);
}

function readPinRecord(accountId, storage) {
  const account = cleanAccountId(accountId);
  const targetStorage = resolveStorage(storage, 'localStorage');
  if (!account || !targetStorage) return null;
  try {
    const parsed = JSON.parse(targetStorage.getItem(getPinStorageKey(account)) || 'null');
    if (!parsed || parsed.version !== PIN_RECORD_VERSION || !parsed.salt || !parsed.verifier) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isValidParentPin(pin) {
  return /^\d{4,6}$/.test(String(pin || ''));
}

export function hasParentPin(accountId, options = {}) {
  return Boolean(readPinRecord(accountId, options.localStorage || options.storage));
}

export async function saveParentPin(accountId, pin, options = {}) {
  const account = cleanAccountId(accountId);
  const targetStorage = resolveStorage(options.localStorage || options.storage, 'localStorage');
  if (!account || !targetStorage) throw new Error('parent_pin_storage_unavailable');
  if (!isValidParentPin(pin)) throw new Error('parent_pin_invalid');

  const webCrypto = getWebCrypto();
  const salt = webCrypto.getRandomValues(new Uint8Array(16));
  const verifier = await derivePinVerifier(account, String(pin), salt, PBKDF2_ITERATIONS);
  const record = {
    version: PIN_RECORD_VERSION,
    algorithm: 'PBKDF2-SHA-256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    verifier: bytesToBase64(verifier),
    updatedAt: new Date().toISOString()
  };
  targetStorage.setItem(getPinStorageKey(account), JSON.stringify(record));
  return true;
}

export async function verifyParentPin(accountId, pin, options = {}) {
  const account = cleanAccountId(accountId);
  if (!account || !isValidParentPin(pin)) return false;
  const record = readPinRecord(account, options.localStorage || options.storage);
  if (!record) return false;
  try {
    const expected = base64ToBytes(record.verifier);
    const actual = await derivePinVerifier(account, String(pin), base64ToBytes(record.salt), Number(record.iterations) || PBKDF2_ITERATIONS);
    return constantTimeEqual(expected, actual);
  } catch {
    return false;
  }
}

function parseSessionRecord(storage, key) {
  try {
    const parsed = JSON.parse(storage?.getItem(key) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function getParentPinAttemptState(accountId, options = {}) {
  const account = cleanAccountId(accountId);
  const storage = resolveStorage(options.sessionStorage || options.storage, 'sessionStorage');
  const now = Number(options.now) || Date.now();
  const record = account && storage ? parseSessionRecord(storage, getRateLimitKey(account)) : null;
  if (!record) {
    return { attempts: 0, blockedUntil: 0, remainingMs: 0, isBlocked: false };
  }
  const blockedUntil = Number(record.blockedUntil) || 0;
  if (blockedUntil > 0 && blockedUntil <= now) {
    return { attempts: 0, blockedUntil: 0, remainingMs: 0, isBlocked: false };
  }
  return {
    attempts: Math.max(0, Number(record.attempts) || 0),
    blockedUntil,
    remainingMs: Math.max(0, blockedUntil - now),
    isBlocked: blockedUntil > now
  };
}

export function recordParentPinFailure(accountId, options = {}) {
  const account = cleanAccountId(accountId);
  const storage = resolveStorage(options.sessionStorage || options.storage, 'sessionStorage');
  const now = Number(options.now) || Date.now();
  if (!account || !storage) return { attempts: 1, blockedUntil: 0, remainingMs: 0, isBlocked: false };
  const current = parseSessionRecord(storage, getRateLimitKey(account));
  const currentBlockedUntil = Number(current?.blockedUntil) || 0;
  const previousAttempts = current && (currentBlockedUntil === 0 || currentBlockedUntil > now)
    ? Number(current.attempts) || 0
    : 0;
  const attempts = previousAttempts + 1;
  const lockLevel = Math.max(0, Math.floor((attempts - MAX_ATTEMPTS) / MAX_ATTEMPTS));
  const blockedUntil = attempts >= MAX_ATTEMPTS
    ? now + Math.min(MAX_LOCK_MS, BASE_LOCK_MS * (2 ** lockLevel))
    : 0;
  storage.setItem(getRateLimitKey(account), JSON.stringify({ attempts, blockedUntil }));
  return {
    attempts,
    blockedUntil,
    remainingMs: Math.max(0, blockedUntil - now),
    isBlocked: blockedUntil > now
  };
}

export function clearParentPinAttempts(accountId, options = {}) {
  const account = cleanAccountId(accountId);
  const storage = resolveStorage(options.sessionStorage || options.storage, 'sessionStorage');
  if (account && storage) storage.removeItem(getRateLimitKey(account));
}

export function requestParentPinRecovery(accountId, authMarker, options = {}) {
  const account = cleanAccountId(accountId);
  const storage = resolveStorage(options.sessionStorage || options.storage, 'sessionStorage');
  if (!account || !storage) return false;
  storage.setItem(getRecoveryKey(account), JSON.stringify({
    requestedAt: Number(options.now) || Date.now(),
    previousAuthMarker: String(authMarker || '')
  }));
  return true;
}

export function canRecoverParentPin(accountId, authMarker, options = {}) {
  const account = cleanAccountId(accountId);
  const storage = resolveStorage(options.sessionStorage || options.storage, 'sessionStorage');
  const record = account && storage ? parseSessionRecord(storage, getRecoveryKey(account)) : null;
  const nextMarker = String(authMarker || '');
  if (!record || !nextMarker || nextMarker === String(record.previousAuthMarker || '')) return false;
  const markerTime = Date.parse(nextMarker);
  return Number.isNaN(markerTime) || markerTime >= Number(record.requestedAt || 0);
}

export async function replaceParentPinAfterReauthentication(accountId, pin, authMarker, options = {}) {
  if (!canRecoverParentPin(accountId, authMarker, options)) throw new Error('parent_pin_reauthentication_required');
  await saveParentPin(accountId, pin, options);
  const storage = resolveStorage(options.sessionStorage || options.storage, 'sessionStorage');
  storage?.removeItem(getRecoveryKey(accountId));
  clearParentPinAttempts(accountId, options);
  return true;
}

export default {
  PARENT_SECURITY_STORAGE_PREFIX,
  canRecoverParentPin,
  clearParentPinAttempts,
  getParentPinAttemptState,
  hasParentPin,
  isValidParentPin,
  recordParentPinFailure,
  replaceParentPinAfterReauthentication,
  requestParentPinRecovery,
  saveParentPin,
  verifyParentPin
};
