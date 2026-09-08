import { PARENT_SECURITY_STORAGE_PREFIX } from './parentAccessStorage.js';
export { PARENT_SECURITY_STORAGE_PREFIX } from './parentAccessStorage.js';

const PIN_RECORD_VERSION = 1;
const PBKDF2_ITERATIONS = 120000;
const RATE_LIMIT_PREFIX = 'jannati_parent_rate:';
const RECOVERY_PREFIX = 'jannati_parent_recovery:';
const MAX_ATTEMPTS = 3;
const BASE_LOCK_MS = 30000;
const MAX_LOCK_MS = 5 * 60 * 1000;

export class ParentAccessError extends Error {
  constructor(code) { super(code); this.name = 'ParentAccessError'; this.code = code; }
}
const fail = code => new ParentAccessError(code);
const cleanAccountId = accountId => String(accountId || '').trim();
const pinKey = accountId => PARENT_SECURITY_STORAGE_PREFIX + cleanAccountId(accountId);
const rateKey = accountId => RATE_LIMIT_PREFIX + cleanAccountId(accountId);
const recoveryKey = accountId => RECOVERY_PREFIX + cleanAccountId(accountId);

function resolveStorage(options, name) {
  try {
    if (Object.hasOwn(options, name)) return options[name];
    if (Object.hasOwn(options, 'storage')) return options.storage;
    return globalThis[name] || null;
  } catch { return null; }
}
function requirePinStorage(options) {
  const storage = resolveStorage(options, 'localStorage');
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') throw fail('parent_pin_storage_unavailable');
  return storage;
}
function readRawPin(storage, accountId) {
  try { return storage.getItem(pinKey(accountId)); }
  catch { throw fail('parent_pin_storage_unavailable'); }
}
function getWebCrypto() {
  try {
    const crypto = globalThis.crypto;
    if (globalThis.isSecureContext === false || !crypto?.subtle
      || typeof crypto.subtle.importKey !== 'function' || typeof crypto.subtle.deriveBits !== 'function'
      || typeof crypto.getRandomValues !== 'function' || typeof globalThis.TextEncoder !== 'function'
      || typeof globalThis.btoa !== 'function' || typeof globalThis.atob !== 'function') throw new Error();
    return crypto;
  } catch { throw fail('parent_pin_crypto_unavailable'); }
}
function bytesToBase64(bytes) { return globalThis.btoa(String.fromCharCode(...bytes)); }

function decodeRecord(raw) {
  if (raw === null) return null;
  if (typeof globalThis.atob !== 'function' || typeof globalThis.btoa !== 'function') throw fail('parent_pin_crypto_unavailable');
  try {
    const record = JSON.parse(raw);
    if (!record || record.version !== PIN_RECORD_VERSION || record.algorithm !== 'PBKDF2-SHA-256'
      || record.iterations !== PBKDF2_ITERATIONS) throw new Error();
    const decode = (value, length) => {
      if (typeof value !== 'string') throw new Error();
      const bytes = Uint8Array.from(globalThis.atob(value), character => character.charCodeAt(0));
      if (bytes.length !== length || bytesToBase64(bytes) !== value) throw new Error();
      return bytes;
    };
    return { record, salt: decode(record.salt, 16), verifier: decode(record.verifier, 32) };
  } catch { throw fail('parent_pin_storage_corrupt'); }
}
function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}
async function derivePinVerifier(accountId, pin, salt) {
  const crypto = getWebCrypto();
  try {
    // Retain the original accountId:pin cryptographic scope.
    const material = new TextEncoder().encode(cleanAccountId(accountId) + ':' + pin);
    const key = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS }, key, 256);
    return new Uint8Array(bits);
  } catch { throw fail('parent_pin_crypto_unavailable'); }
}
function assertCurrent(options) {
  if (options.isCurrent && !options.isCurrent()) throw fail('parent_pin_context_changed');
}
export function isValidParentPin(pin) { return /^\d{4,6}$/.test(String(pin || '')); }
export function getParentPinStatus(accountId, options = {}) {
  if (!cleanAccountId(accountId)) return { exists: false, errorCode: '' };
  try {
    return { exists: Boolean(decodeRecord(readRawPin(requirePinStorage(options), accountId))), errorCode: '' };
  } catch (error) { return { exists: false, errorCode: error.code || 'parent_pin_storage_unavailable' }; }
}
export function hasParentPin(accountId, options = {}) { return getParentPinStatus(accountId, options).exists; }

// Never roll back over a newer record written by another tab.
async function persistParentPin(accountId, pin, storage, previousRaw, options) {
  let salt;
  try { salt = getWebCrypto().getRandomValues(new Uint8Array(16)); }
  catch { throw fail('parent_pin_crypto_unavailable'); }
  const verifier = await derivePinVerifier(accountId, String(pin), salt);
  assertCurrent(options);
  if (readRawPin(storage, accountId) !== previousRaw) throw fail('parent_pin_record_changed');
  let previousTime = 0;
  try { previousTime = Date.parse(JSON.parse(previousRaw)?.updatedAt) || 0; } catch { /* corrupt record recovery */ }
  const record = {
    version: PIN_RECORD_VERSION, algorithm: 'PBKDF2-SHA-256', iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt), verifier: bytesToBase64(verifier), updatedAt: new Date(Math.max(Date.now(), previousTime + 1)).toISOString()
  };
  const raw = JSON.stringify(record);
  try { storage.setItem(pinKey(accountId), raw); }
  catch { throw fail('parent_pin_storage_write_failed'); }
  try {
    const storedRaw = readRawPin(storage, accountId);
    if (storedRaw !== raw) throw new Error();
    const stored = decodeRecord(storedRaw);
    if (!stored || !constantTimeEqual(stored.verifier, await derivePinVerifier(accountId, String(pin), stored.salt))) throw new Error();
    if (readRawPin(storage, accountId) !== raw) throw new Error();
  } catch {
    try {
      if (readRawPin(storage, accountId) === raw) {
        if (previousRaw === null) storage.removeItem(pinKey(accountId));
        else storage.setItem(pinKey(accountId), previousRaw);
      }
    } catch { /* Storage may prevent safe rollback. Access remains locked. */ }
    throw fail('parent_pin_storage_readback_failed');
  }
  return true;
}
export async function saveParentPin(accountId, pin, options = {}) {
  if (!isValidParentPin(pin)) throw fail('parent_pin_invalid');
  if (!cleanAccountId(accountId)) throw fail('parent_pin_storage_unavailable');
  const storage = requirePinStorage(options);
  const previous = readRawPin(storage, accountId);
  if (previous !== null) throw fail('parent_pin_reauthentication_required');
  return persistParentPin(accountId, pin, storage, previous, options);
}
export async function verifyParentPin(accountId, pin, options = {}) {
  if (!cleanAccountId(accountId) || !isValidParentPin(pin)) return false;
  getWebCrypto();
  const storage = requirePinStorage(options);
  const raw = readRawPin(storage, accountId);
  const stored = decodeRecord(raw);
  if (!stored) return false;
  const actual = await derivePinVerifier(accountId, String(pin), stored.salt);
  assertCurrent(options);
  if (readRawPin(storage, accountId) !== raw) throw fail('parent_pin_record_changed');
  return constantTimeEqual(stored.verifier, actual);
}

// Cheap probes on submission/diagnostic request only; no PBKDF2 on render.
function probeStorage(storage, key) {
  try {
    if (!storage) return false;
    storage.setItem(key, 'probe');
    if (storage.getItem(key) !== 'probe') return false;
    storage.removeItem(key);
    return storage.getItem(key) === null;
  } catch { return false; }
  finally { try { storage?.removeItem(key); } catch { /* probe key only */ } }
}
export function probeParentAccessCapabilities(options = {}) {
  const nonce = Date.now() + '-' + Math.random().toString(36).slice(2);
  let cryptoAvailable = true;
  try { getWebCrypto(); } catch { cryptoAvailable = false; }
  return {
    secureContext: globalThis.isSecureContext !== false,
    cryptoAvailable,
    localStorageUsable: probeStorage(resolveStorage(options, 'localStorage'), PARENT_SECURITY_STORAGE_PREFIX + 'probe:' + nonce),
    sessionStorageUsable: probeStorage(resolveStorage(options, 'sessionStorage'), RATE_LIMIT_PREFIX + 'probe:' + nonce)
  };
}
function readSessionRecord(storage, key) {
  if (!storage) throw fail('parent_pin_session_storage_unavailable');
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch { throw fail('parent_pin_session_storage_unavailable'); }
}
const emptyAttempts = () => ({ attempts: 0, blockedUntil: 0, remainingMs: 0, isBlocked: false });
export function getParentPinAttemptState(accountId, options = {}) {
  const now = Number(options.now) || Date.now();
  try {
    const record = readSessionRecord(resolveStorage(options, 'sessionStorage'), rateKey(accountId));
    if (!record) return emptyAttempts();
    if (!Number.isInteger(record.attempts) || record.attempts < 0 || !Number.isFinite(record.blockedUntil) || record.blockedUntil < 0) throw new Error();
    if (record.blockedUntil > 0 && record.blockedUntil <= now) return emptyAttempts();
    return { attempts: record.attempts, blockedUntil: record.blockedUntil, remainingMs: Math.max(0, record.blockedUntil - now), isBlocked: record.blockedUntil > now };
  } catch {
    // Fail closed, rather than allowing unlimited guesses without a rate store.
    return { ...emptyAttempts(), isBlocked: true, errorCode: 'parent_pin_session_storage_unavailable' };
  }
}
export function recordParentPinFailure(accountId, options = {}) {
  const current = getParentPinAttemptState(accountId, options);
  if (current.errorCode) throw fail(current.errorCode);
  const storage = resolveStorage(options, 'sessionStorage');
  const now = Number(options.now) || Date.now();
  const attempts = current.attempts + 1;
  const lockLevel = Math.max(0, Math.floor((attempts - MAX_ATTEMPTS) / MAX_ATTEMPTS));
  const blockedUntil = attempts >= MAX_ATTEMPTS ? now + Math.min(MAX_LOCK_MS, BASE_LOCK_MS * (2 ** lockLevel)) : 0;
  const raw = JSON.stringify({ attempts, blockedUntil });
  try {
    storage.setItem(rateKey(accountId), raw);
    if (storage.getItem(rateKey(accountId)) !== raw) throw new Error();
  } catch { throw fail('parent_pin_session_storage_unavailable'); }
  return { attempts, blockedUntil, remainingMs: Math.max(0, blockedUntil - now), isBlocked: blockedUntil > now };
}
function removeSessionRecord(accountId, prefix, options) {
  const storage = resolveStorage(options, 'sessionStorage');
  try {
    if (!cleanAccountId(accountId) || !storage) return false;
    const key = prefix + cleanAccountId(accountId);
    storage.removeItem(key);
    return storage.getItem(key) === null;
  } catch { return false; }
}
export function clearParentPinAttempts(accountId, options = {}) { return removeSessionRecord(accountId, RATE_LIMIT_PREFIX, options); }

function recoveryIdentity(accountId, options) {
  const raw = readRawPin(requirePinStorage(options), accountId);
  if (raw === null) return 'absent';
  try { return JSON.parse(raw)?.updatedAt || 'corrupt'; } catch { return 'corrupt'; }
}
export function requestParentPinRecovery(accountId, authMarker, options = {}) {
  try {
    const storage = resolveStorage(options, 'sessionStorage');
    if (!cleanAccountId(accountId) || !storage || !authMarker) return false;
    const raw = JSON.stringify({ requestedAt: Number(options.now) || Date.now(), previousAuthMarker: String(authMarker), pinUpdatedAt: recoveryIdentity(accountId, options) });
    storage.setItem(recoveryKey(accountId), raw);
    return storage.getItem(recoveryKey(accountId)) === raw;
  } catch { return false; }
}
export function canRecoverParentPin(accountId, authMarker, options = {}) {
  try {
    const record = readSessionRecord(resolveStorage(options, 'sessionStorage'), recoveryKey(accountId));
    const nextMarker = String(authMarker || '');
    if (!record || !nextMarker || nextMarker === String(record.previousAuthMarker || '')
      || !record.pinUpdatedAt || record.pinUpdatedAt !== recoveryIdentity(accountId, options)) return false;
    const markerTime = Date.parse(nextMarker);
    return Number.isNaN(markerTime) || markerTime >= Number(record.requestedAt || 0);
  } catch { return false; }
}
export async function replaceParentPinAfterReauthentication(accountId, pin, authMarker, options = {}) {
  if (!canRecoverParentPin(accountId, authMarker, options)) throw fail('parent_pin_reauthentication_required');
  if (!isValidParentPin(pin)) throw fail('parent_pin_invalid');
  const storage = requirePinStorage(options);
  await persistParentPin(accountId, pin, storage, readRawPin(storage, accountId), options);
  // Binding recovery to the old record also prevents reuse if removal fails.
  removeSessionRecord(accountId, RECOVERY_PREFIX, options);
  clearParentPinAttempts(accountId, options);
  return true;
}
export function getParentAccessMessage(code) {
  return ({
    parent_pin_invalid: 'Masukkan PIN 4 hingga 6 digit.',
    parent_pin_mismatch: 'Pengesahan PIN tidak sepadan.',
    parent_pin_crypto_unavailable: 'Pengesahan PIN selamat tidak tersedia dalam pelayar ini. Cuba guna Chrome/Edge terkini melalui sambungan HTTPS.',
    parent_pin_storage_unavailable: 'Storan pelayar tidak tersedia. Semak tetapan privasi atau cuba semula dalam pelayar biasa.',
    parent_pin_storage_write_failed: 'PIN tidak dapat disimpan dalam pelayar ini. Semak storan/privasi pelayar dan cuba semula.',
    parent_pin_storage_readback_failed: 'PIN tidak dapat disahkan selepas disimpan. Laporan masih dikunci. Cuba semula atau buka semula Kawasan Ibu Bapa.',
    parent_pin_storage_corrupt: 'Rekod PIN dalam pelayar tidak dapat dibaca dengan selamat. Gunakan Lupa PIN dan log masuk semula untuk menetapkannya semula.',
    parent_pin_reauthentication_required: 'Log masuk semula diperlukan sebelum PIN boleh ditetapkan semula.',
    parent_pin_record_changed: 'Rekod PIN telah berubah. Buka semula Kawasan Ibu Bapa dan sahkan PIN semasa.',
    parent_pin_session_storage_unavailable: 'Storan sesi pengesahan tidak tersedia. Semak tetapan privasi pelayar dan cuba buka semula Kawasan Ibu Bapa.',
    parent_pin_saved_unlock_failed: 'PIN telah disimpan, tetapi Laporan Ibu Bapa belum dapat dibuka. Cuba buka semula Kawasan Ibu Bapa.',
    parent_pin_verified_unlock_failed: 'PIN telah disahkan, tetapi Laporan Ibu Bapa belum dapat dibuka. Cuba buka semula Kawasan Ibu Bapa.'
  })[code] || 'Pengesahan PIN tidak dapat diselesaikan. Cuba semula.';
}

// Small gate coordinator: persistence, rate cleanup and unlock are separate stages.
export function createParentPinSubmission() {
  let generation = 0;
  let busy = false;
  return {
    invalidate() { generation += 1; busy = false; },
    async submit({ accountId, authMarker, pin, confirmPin, setupMode, onUnlock, isCurrent = () => true, options = {} }) {
      if (busy) return { status: 'busy' };
      busy = true;
      const ticket = generation;
      const current = () => ticket === generation && isCurrent();
      const scopedOptions = { ...options, isCurrent: current };
      let saved = false;
      try {
        if (!current()) return { status: 'stale' };
        if (!isValidParentPin(pin)) throw fail('parent_pin_invalid');
        if (setupMode && pin !== confirmPin) throw fail('parent_pin_mismatch');
        if (setupMode) {
          if (canRecoverParentPin(accountId, authMarker, options)) await replaceParentPinAfterReauthentication(accountId, pin, authMarker, scopedOptions);
          else await saveParentPin(accountId, pin, scopedOptions);
          saved = true;
        } else {
          getWebCrypto();
          const attempts = getParentPinAttemptState(accountId, options);
          if (attempts.errorCode) throw fail(attempts.errorCode);
          if (attempts.isBlocked) return { status: 'blocked', attempts };
          if (!probeParentAccessCapabilities(options).sessionStorageUsable) throw fail('parent_pin_session_storage_unavailable');
          if (!await verifyParentPin(accountId, pin, scopedOptions)) {
            if (!current()) return { status: 'stale' };
            return { status: 'incorrect', attempts: recordParentPinFailure(accountId, options) };
          }
        }
        if (!current()) return { status: 'stale', saved };
        clearParentPinAttempts(accountId, options);
        try { await onUnlock?.(); }
        catch { return { status: 'unlock_failed', saved, code: saved ? 'parent_pin_saved_unlock_failed' : 'parent_pin_verified_unlock_failed' }; }
        return { status: current() ? 'unlocked' : 'stale', saved };
      } catch (error) {
        return { status: current() ? 'error' : 'stale', saved, code: error.code || 'parent_pin_unknown' };
      } finally { if (ticket === generation) busy = false; }
    }
  };
}
