import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PARENT_SECURITY_STORAGE_PREFIX, canRecoverParentPin, clearParentPinAttempts,
  createParentPinSubmission, getParentAccessMessage, getParentPinAttemptState,
  getParentPinStatus, hasParentPin, probeParentAccessCapabilities,
  isRecentParentAuthentication, PARENT_RECENT_AUTH_MAX_AGE_MS,
  recordParentPinFailure, replaceParentPinAfterReauthentication,
  requestParentPinRecovery, saveParentPin, verifyParentPin
} from '../../src/services/parentAccess.js';

class MemoryStorage {
  values = new Map();
  getItem = vi.fn(key => this.values.get(key) ?? null);
  setItem = vi.fn((key, value) => this.values.set(key, String(value)));
  removeItem = vi.fn(key => this.values.delete(key));
}
const A = 'parent-hotfix-account-a';
const B = 'parent-hotfix-account-b';
const NOW = Date.parse('2026-10-10T10:00:00.000Z');
const key = account => PARENT_SECURITY_STORAGE_PREFIX + account;
const authMarkerFor = options => new Date((Number.isFinite(Number(options?.now)) ? Number(options.now) : NOW) - 1000).toISOString();
const withRecentAuth = options => ({ ...options, now: options?.now ?? NOW, authMarker: options?.authMarker || authMarkerFor(options) });
const setup = options => {
  const scopedOptions = withRecentAuth(options);
  return { accountId: A, authMarker: scopedOptions.authMarker, pin: '2468', confirmPin: '2468', setupMode: true, options: scopedOptions };
};
const stores = () => ({ localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage() });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Parent PIN persistence and verification', () => {
  it('allows missing-PIN setup only within the five-minute recent-auth window', async () => {
    const options = stores();
    const recentMarker = new Date(NOW - PARENT_RECENT_AUTH_MAX_AGE_MS).toISOString();
    const staleMarker = new Date(NOW - PARENT_RECENT_AUTH_MAX_AGE_MS - 1).toISOString();
    expect(isRecentParentAuthentication(recentMarker, { now: NOW })).toBe(true);
    expect(isRecentParentAuthentication(staleMarker, { now: NOW })).toBe(false);
    expect(isRecentParentAuthentication(new Date(NOW + 1).toISOString(), { now: NOW })).toBe(false);
    const result = await createParentPinSubmission().submit({
      ...setup(options),
      authMarker: staleMarker,
      options: { ...options, now: NOW }
    });
    expect(result.code).toBe('parent_pin_recent_auth_required');
    expect(options.localStorage.getItem(key(A))).toBeNull();
  });

  it('permits first setup after a fresh authenticated login', async () => {
    const options = stores();
    const result = await createParentPinSubmission().submit({ ...setup(options) });
    expect(result).toMatchObject({ status: 'unlocked', saved: true });
    expect(await verifyParentPin(A, '2468', options)).toBe(true);
  });

  it('saves an account-scoped salted verifier, not a plaintext PIN, and verifies readback', async () => {
    const options = stores();
    await expect(saveParentPin(A, '2468', withRecentAuth(options))).resolves.toBe(true);
    const raw = options.localStorage.getItem(key(A));
    const record = JSON.parse(raw);
    expect(record.algorithm).toBe('PBKDF2-SHA-256');
    expect(record.iterations).toBe(120000);
    expect(Boolean(record.salt && record.verifier)).toBe(true);
    expect(raw.includes('"2468"')).toBe(false);
    expect(await verifyParentPin(A, '2468', options)).toBe(true);
    expect(await verifyParentPin(A, '1357', options)).toBe(false);
  });
  it('rejects the same verifier even when copied to a different account key', async () => {
    const options = stores();
    await saveParentPin(A, '2468', withRecentAuth(options));
    options.localStorage.setItem(key(B), options.localStorage.getItem(key(A)));
    expect(await verifyParentPin(B, '2468', options)).toBe(false);
  });
  it.each(['02468', '024680'])('supports longer PINs and leading zeroes: %s', async pin => {
    const options = stores();
    await saveParentPin(A, pin, withRecentAuth(options));
    expect(await verifyParentPin(A, pin, options)).toBe(true);
    expect(await verifyParentPin(A, pin.slice(1), options)).toBe(false);
  });
  it.each(['123', '1234567', '12ab', ''])('rejects invalid PIN shape without writing: %s', async pin => {
    const options = stores();
    await expect(saveParentPin(A, pin, options)).rejects.toMatchObject({ code: 'parent_pin_invalid' });
    expect(options.localStorage.setItem).not.toHaveBeenCalled();
  });
  it('reports unavailable storage and never unlocks', async () => {
    const onUnlock = vi.fn();
    const result = await createParentPinSubmission().submit({ ...setup({ localStorage: null }), onUnlock });
    expect(result.code).toBe('parent_pin_storage_unavailable');
    expect(onUnlock).not.toHaveBeenCalled();
  });
  it('contains a throwing browser storage getter', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('privacy'); } });
    try { expect(getParentPinStatus(A).errorCode).toBe('parent_pin_storage_unavailable'); }
    finally {
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
      else delete globalThis.localStorage;
    }
  });
  it('distinguishes a quota/write failure without unlocking', async () => {
    const options = stores();
    options.localStorage.setItem.mockImplementation(() => { throw new Error('quota'); });
    const onUnlock = vi.fn();
    const result = await createParentPinSubmission().submit({ ...setup(options), onUnlock });
    expect(result.code).toBe('parent_pin_storage_write_failed');
    expect(onUnlock).not.toHaveBeenCalled();
  });
  it('detects a silently dropped write before unlocking', async () => {
    const options = stores();
    options.localStorage.setItem.mockImplementation(() => {});
    const onUnlock = vi.fn();
    const result = await createParentPinSubmission().submit({ ...setup(options), onUnlock });
    expect(result.code).toBe('parent_pin_storage_readback_failed');
    expect(onUnlock).not.toHaveBeenCalled();
  });
  it('detects readback exceptions and keeps access locked', async () => {
    const options = stores();
    options.localStorage.getItem.mockImplementation(k => {
      if (options.localStorage.values.has(k)) throw new Error('read blocked');
      return null;
    });
    const onUnlock = vi.fn();
    const result = await createParentPinSubmission().submit({ ...setup(options), onUnlock });
    expect(result.code).toBe('parent_pin_storage_readback_failed');
    expect(onUnlock).not.toHaveBeenCalled();
  });
  it('re-derives the written PIN and removes only its own failed record', async () => {
    const options = stores();
    const original = globalThis.crypto.subtle.deriveBits.bind(globalThis.crypto.subtle);
    let calls = 0;
    vi.spyOn(globalThis.crypto.subtle, 'deriveBits').mockImplementation((...args) => ++calls === 2 ? Promise.resolve(new ArrayBuffer(32)) : original(...args));
    await expect(saveParentPin(A, '2468', withRecentAuth(options))).rejects.toMatchObject({ code: 'parent_pin_storage_readback_failed' });
    expect(options.localStorage.values.has(key(A))).toBe(false);
  });
  it('restores the previous PIN when recovery readback derivation fails', async () => {
    const options = stores();
    await saveParentPin(A, '2468', withRecentAuth(options));
    requestParentPinRecovery(A, 'auth-before', options);
    const derive = globalThis.crypto.subtle.deriveBits.bind(globalThis.crypto.subtle);
    let calls = 0;
    const spy = vi.spyOn(globalThis.crypto.subtle, 'deriveBits').mockImplementation((...args) => ++calls === 2 ? Promise.reject(new Error('crypto failure')) : derive(...args));
    await expect(replaceParentPinAfterReauthentication(A, '8642', 'auth-after', options)).rejects.toMatchObject({ code: 'parent_pin_storage_readback_failed' });
    spy.mockRestore();
    expect(await verifyParentPin(A, '2468', options)).toBe(true);
    expect(await verifyParentPin(A, '8642', options)).toBe(false);
  });
  it('does not delete a newer PIN written during asynchronous readback', async () => {
    const options = stores();
    const otherStore = stores();
    await saveParentPin(A, '8642', withRecentAuth(otherStore));
    const newerRaw = otherStore.localStorage.getItem(key(A));
    const derive = globalThis.crypto.subtle.deriveBits.bind(globalThis.crypto.subtle);
    let calls = 0;
    const spy = vi.spyOn(globalThis.crypto.subtle, 'deriveBits').mockImplementation(async (...args) => {
      const result = await derive(...args);
      if (++calls === 2) options.localStorage.setItem(key(A), newerRaw);
      return result;
    });
    const onUnlock = vi.fn();
    const result = await createParentPinSubmission().submit({ ...setup(options), onUnlock });
    expect(result.code).toBe('parent_pin_storage_readback_failed');
    expect(onUnlock).not.toHaveBeenCalled();
    expect(options.localStorage.getItem(key(A)) === newerRaw).toBe(true);
    spy.mockRestore();
    expect(await verifyParentPin(A, '8642', options)).toBe(true);
  });
  it.each(['{bad', '{}', '{"version":1,"salt":"bad","verifier":"bad"}'])('rejects malformed records without allowing setup overwrite: %s', async raw => {
    const options = stores();
    options.localStorage.setItem(key(A), raw);
    expect(hasParentPin(A, options)).toBe(false);
    expect(getParentPinStatus(A, options).errorCode).toBe('parent_pin_storage_corrupt');
    await expect(saveParentPin(A, '2468', withRecentAuth(options))).rejects.toMatchObject({ code: 'parent_pin_reauthentication_required' });
  });
  it.each(['version', 'algorithm', 'iterations', 'salt', 'verifier'])('validates the %s field of a stored record', async field => {
    const options = stores();
    await saveParentPin(A, '2468', withRecentAuth(options));
    const record = JSON.parse(options.localStorage.getItem(key(A)));
    record[field] = field === 'iterations' ? 1 : 'invalid';
    options.localStorage.setItem(key(A), JSON.stringify(record));
    expect(hasParentPin(A, options)).toBe(false);
    await expect(verifyParentPin(A, '2468', options)).rejects.toMatchObject({ code: 'parent_pin_storage_corrupt' });
  });
  it.each(['crypto', 'TextEncoder', 'btoa', 'atob'])('does not count unavailable %s as an incorrect PIN', async capability => {
    const options = stores();
    await saveParentPin(A, '2468', withRecentAuth(options));
    vi.stubGlobal(capability, undefined);
    const result = await createParentPinSubmission().submit({ ...setup(options), setupMode: false });
    expect(result.code).toBe('parent_pin_crypto_unavailable');
    expect(options.sessionStorage.setItem).not.toHaveBeenCalled();
  });
  it('rejects insecure runtime capabilities without weakening PBKDF2', async () => {
    const options = stores();
    vi.stubGlobal('isSecureContext', false);
    expect(probeParentAccessCapabilities(options).cryptoAvailable).toBe(false);
    await expect(saveParentPin(A, '2468', withRecentAuth(options))).rejects.toMatchObject({ code: 'parent_pin_crypto_unavailable' });
  });
  it.each(['crypto', 'storage', 'corrupt'])('does not count a runtime %s failure as a wrong PIN', async fault => {
    const options = stores();
    await saveParentPin(A, '2468', withRecentAuth(options));
    const codes = { crypto: 'parent_pin_crypto_unavailable', storage: 'parent_pin_storage_unavailable', corrupt: 'parent_pin_storage_corrupt' };
    if (fault === 'crypto') vi.spyOn(globalThis.crypto.subtle, 'deriveBits').mockRejectedValue(new Error('crypto failure'));
    if (fault === 'storage') options.localStorage.getItem.mockImplementation(storageKey => {
      if (storageKey === key(A)) throw new Error('privacy');
      return options.localStorage.values.get(storageKey) ?? null;
    });
    if (fault === 'corrupt') options.localStorage.setItem(key(A), '{}');
    const onUnlock = vi.fn();
    const result = await createParentPinSubmission().submit({ ...setup(options), setupMode: false, onUnlock });
    expect(result.code).toBe(codes[fault]);
    expect(onUnlock).not.toHaveBeenCalled();
    expect(getParentPinAttemptState(A, options).attempts).toBe(0);
  });
});

describe('Parent PIN flow stages and races', () => {
  it('continues unlock after attempt cleanup throws following successful save', async () => {
    const options = stores();
    options.localStorage.removeItem.mockImplementation(() => { throw new Error('blocked'); });
    const onUnlock = vi.fn();
    const result = await createParentPinSubmission().submit({ ...setup(options), onUnlock });
    expect(result.status).toBe('unlocked');
    expect(result.saved).toBe(true);
    expect(onUnlock).toHaveBeenCalledOnce();
    expect(await verifyParentPin(A, '2468', options)).toBe(true);
    expect(clearParentPinAttempts(A, options)).toBe(false);
  });
  it.each([false, true])('distinguishes post-save callback rejection (async=%s)', async asynchronous => {
    const options = stores();
    const onUnlock = asynchronous ? async () => { throw new Error('render failure'); } : () => { throw new Error('render failure'); };
    const result = await createParentPinSubmission().submit({ ...setup(options), onUnlock });
    expect(result.code).toBe('parent_pin_saved_unlock_failed');
    expect(result.saved).toBe(true);
    expect(getParentAccessMessage(result.code)).toContain('PIN telah disimpan');
    expect(getParentAccessMessage(result.code)).not.toContain('PIN tidak dapat disimpan');
    expect(await verifyParentPin(A, '2468', options)).toBe(true);
  });
  it('distinguishes post-verification callback failure without counting a wrong PIN', async () => {
    const options = stores();
    await saveParentPin(A, '2468', withRecentAuth(options));
    const result = await createParentPinSubmission().submit({ ...setup(options), setupMode: false, onUnlock() { throw new Error(); } });
    expect(result.code).toBe('parent_pin_verified_unlock_failed');
    expect(getParentPinAttemptState(A, options).attempts).toBe(0);
  });
  it('prevents duplicate submit synchronously, before React can render busy', async () => {
    const options = stores();
    const submission = createParentPinSubmission();
    const onUnlock = vi.fn();
    const first = submission.submit({ ...setup(options), onUnlock });
    expect((await submission.submit({ ...setup(options), onUnlock })).status).toBe('busy');
    expect((await first).status).toBe('unlocked');
    expect(options.localStorage.setItem).toHaveBeenCalledOnce();
    expect(onUnlock).toHaveBeenCalledOnce();
  });
  it.each(['account', 'child', 'auth', 'unmount'])('rejects stale %s context while PBKDF2 is running', async () => {
    const options = stores();
    const submission = createParentPinSubmission();
    const onUnlock = vi.fn();
    const pending = submission.submit({ ...setup(options), onUnlock });
    submission.invalidate();
    expect((await pending).status).toBe('stale');
    expect(onUnlock).not.toHaveBeenCalled();
    expect(options.localStorage.setItem).not.toHaveBeenCalled();
  });
  it('refuses stale setup after another tab creates a PIN', async () => {
    const options = stores();
    await saveParentPin(A, '2468', withRecentAuth(options));
    const result = await createParentPinSubmission().submit({ ...setup(options), pin: '8642', confirmPin: '8642' });
    expect(result.code).toBe('parent_pin_reauthentication_required');
    expect(await verifyParentPin(A, '2468', options)).toBe(true);
  });
});

describe('Recovery and rate limit remain protected', () => {
  it('requires a later login, replaces the PIN and consumes recovery even if cleanup fails', async () => {
    const options = stores();
    await saveParentPin(A, '2468', withRecentAuth(options));
    const requested = { ...options, now: Date.parse('2026-09-07T10:05:00Z') };
    expect(requestParentPinRecovery(A, '2026-09-07T10:00:00Z', requested)).toBe(true);
    expect(canRecoverParentPin(A, '2026-09-07T10:00:00Z', options)).toBe(false);
    await expect(replaceParentPinAfterReauthentication(A, '8642', '2026-09-07T10:00:00Z', options)).rejects.toMatchObject({ code: 'parent_pin_reauthentication_required' });
    expect(canRecoverParentPin(A, '2026-09-07T10:10:00Z', options)).toBe(true);
    options.sessionStorage.removeItem.mockImplementation(() => { throw new Error(); });
    await replaceParentPinAfterReauthentication(A, '8642', '2026-09-07T10:10:00Z', options);
    expect(await verifyParentPin(A, '2468', options)).toBe(false);
    expect(await verifyParentPin(A, '8642', options)).toBe(true);
    expect(canRecoverParentPin(A, '2026-09-07T10:10:00Z', options)).toBe(false);
  });
  it('safely contains failed recovery storage writes', () => {
    const options = stores();
    options.sessionStorage.setItem.mockImplementation(() => { throw new Error(); });
    expect(requestParentPinRecovery(A, 'session-before', options)).toBe(false);
    expect(canRecoverParentPin(A, 'session-after', options)).toBe(false);
  });
  it('blocks the third wrong PIN and preserves the 30-second cooldown', async () => {
    const options = { ...stores(), now: 1000 };
    await saveParentPin(A, '2468', withRecentAuth(options));
    const submission = createParentPinSubmission();
    for (let i = 0; i < 3; i++) expect((await submission.submit({ ...setup(options), pin: '1357', setupMode: false })).status).toBe('incorrect');
    expect(getParentPinAttemptState(A, options).blockedUntil).toBe(31000);
    expect((await submission.submit({ ...setup(options), setupMode: false })).status).toBe('blocked');
    expect(getParentPinAttemptState(A, { ...options, now: 31001 }).isBlocked).toBe(false);
  });
  it('shares lockout across tabs and clears it after an expired lock plus correct PIN', async () => {
    const sharedLocalStorage = new MemoryStorage();
    const tabOne = { localStorage: sharedLocalStorage, sessionStorage: new MemoryStorage(), now: 1000 };
    const tabTwo = { localStorage: sharedLocalStorage, sessionStorage: new MemoryStorage(), now: 1000 };
    await saveParentPin(A, '2468', withRecentAuth(tabOne));
    recordParentPinFailure(A, tabOne);
    recordParentPinFailure(A, tabOne);
    const third = await createParentPinSubmission().submit({ ...setup(tabTwo), pin: '1357', setupMode: false });
    expect(third.status).toBe('incorrect');
    expect(getParentPinAttemptState(A, tabOne)).toMatchObject({ attempts: 3, isBlocked: true, blockedUntil: 31000 });
    expect(getParentPinAttemptState(A, tabTwo)).toMatchObject({ attempts: 3, isBlocked: true, blockedUntil: 31000 });
    const blocked = await createParentPinSubmission().submit({ ...setup(tabTwo), pin: '1357', setupMode: false });
    expect(blocked.status).toBe('blocked');
    expect(getParentPinAttemptState(A, tabOne).attempts).toBe(3);
    const afterExpiry = { ...tabTwo, now: 31001 };
    const unlocked = await createParentPinSubmission().submit({ ...setup(afterExpiry), setupMode: false });
    expect(unlocked.status).toBe('unlocked');
    expect(getParentPinAttemptState(A, tabOne)).toMatchObject({ attempts: 0, isBlocked: false });
  });
  it('fails closed when the rate store cannot be read or written', async () => {
    const options = stores();
    await saveParentPin(A, '2468', withRecentAuth(options));
    options.localStorage.setItem.mockImplementation(() => { throw new Error(); });
    const onUnlock = vi.fn();
    const result = await createParentPinSubmission().submit({ ...setup(options), setupMode: false, onUnlock });
    expect(result.code).toBe('parent_pin_rate_storage_unavailable');
    expect(onUnlock).not.toHaveBeenCalled();
    expect(getParentPinAttemptState(A, options).attempts).toBe(0);
    expect(getParentPinAttemptState(A, { localStorage: null }).isBlocked).toBe(true);
    expect(() => recordParentPinFailure(A, { localStorage: null })).toThrow('parent_pin_rate_storage_unavailable');
  });
  it('does not probe PBKDF2 during capability checks', () => {
    const crypto = vi.spyOn(globalThis.crypto.subtle, 'deriveBits');
    const options = stores();
    expect(probeParentAccessCapabilities(options)).toMatchObject({ cryptoAvailable: true, localStorageUsable: true, rateLimitStorageUsable: true, sessionStorageUsable: true });
    expect(crypto).not.toHaveBeenCalled();
    expect(options.localStorage.values.size).toBe(0);
    expect(options.sessionStorage.values.size).toBe(0);
  });
});
