// @vitest-environment jsdom
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountLogoutButton } from '../../src/dashboard/HomeDashboard.jsx';
import {
  clearAuthenticatedBrowserStorage,
  executeAuthenticatedLogout,
  settleLogoutStep,
  signOutCurrentBrowserSession
} from '../../src/utils/accountLogout.js';

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    entries() { return Object.fromEntries(values); }
  };
}

function MountedLogoutFlow({ auth, storage }) {
  const [status, setStatus] = React.useState('idle');
  const [screen, setScreen] = React.useState('dashboard');
  const onLogout = async () => {
    setStatus('pending');
    const result = await executeAuthenticatedLogout({
      auth,
      clearAuthenticatedState: () => clearAuthenticatedBrowserStorage(storage, {
        isAccountDataKey: key => key === 'jannati_child_profiles',
        accountScopeKey: 'jannati_active_account_id'
      })
    });
    setStatus(result.ok ? 'idle' : 'error');
    if (result.ok) setScreen('login');
  };
  return screen === 'dashboard'
    ? <AccountLogoutButton onLogout={onLogout} status={status} />
    : <p data-testid="signed-out">Log masuk akaun</p>;
}

describe('authenticated account logout contract', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('signs out only the current browser session', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });

    await expect(signOutCurrentBrowserSession({ signOut })).resolves.toEqual({ ok: true });
    expect(signOut).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('does not report success when authentication is unavailable or rejects logout', async () => {
    await expect(signOutCurrentBrowserSession(null)).resolves.toMatchObject({
      ok: false,
      errorCode: 'auth-unavailable'
    });
    await expect(signOutCurrentBrowserSession({
      signOut: vi.fn().mockResolvedValue({ error: new Error('network') })
    })).resolves.toMatchObject({ ok: false, errorCode: 'signout-failed' });
  });

  it('bounds a stalled logout operation instead of leaving the dashboard waiting forever', async () => {
    vi.useFakeTimers();
    const pending = settleLogoutStep(() => new Promise(() => {}), {
      timeoutMs: 25,
      timeoutCode: 'synthetic-timeout'
    });

    await vi.advanceTimersByTimeAsync(25);
    await expect(pending).resolves.toEqual({ ok: false, errorCode: 'synthetic-timeout' });
  });

  it('shows a disabled, busy control while logout is pending', async () => {
    const onLogout = vi.fn();
    await act(async () => root.render(<AccountLogoutButton onLogout={onLogout} status="pending" />));

    const button = container.querySelector('button');
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.textContent).toContain('Sedang log keluar');
    button.click();
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('keeps the account visibly active and offers retry feedback after failure', async () => {
    const onLogout = vi.fn();
    await act(async () => root.render(<AccountLogoutButton onLogout={onLogout} status="error" />));

    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Sesi masih aktif');
    await act(async () => container.querySelector('button').click());
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('completes the mounted dashboard-to-login flow without leaving stale child data for refresh', async () => {
    const storage = memoryStorage({
      jannati_active_account_id: 'account-a',
      jannati_child_profiles: '[{"id":"child-a"}]'
    });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    await act(async () => root.render(<MountedLogoutFlow auth={{ signOut }} storage={storage} />));

    await act(async () => container.querySelector('button').click());

    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(container.querySelector('[data-testid="signed-out"]')?.textContent).toBe('Log masuk akaun');
    expect(storage.getItem('jannati_active_account_id')).toBeNull();
    expect(storage.getItem('jannati_child_profiles')).toBeNull();
  });

  it('runs pending sync, local session invalidation and verified cleanup in order', async () => {
    const order = [];
    const result = await executeAuthenticatedLogout({
      auth: { signOut: vi.fn(async () => { order.push('signout'); return { error: null }; }) },
      hasPendingChanges: true,
      syncPendingChanges: async () => { order.push('sync'); return true; },
      invalidatePendingWork: () => { order.push('invalidate'); },
      clearAuthenticatedState: () => { order.push('cleanup'); return { ok: true }; }
    });

    expect(result).toEqual({ ok: true, signedOut: true, syncAcknowledged: true });
    expect(order).toEqual(['sync', 'invalidate', 'signout', 'cleanup']);
  });

  it('cancels before session invalidation when pending sync times out and the owner declines', async () => {
    vi.useFakeTimers();
    const signOut = vi.fn();
    const pending = executeAuthenticatedLogout({
      auth: { signOut },
      hasPendingChanges: true,
      syncPendingChanges: () => new Promise(() => {}),
      confirmUnsynced: vi.fn().mockReturnValue(false),
      timeoutMs: 25
    });

    await vi.advanceTimersByTimeAsync(25);
    await expect(pending).resolves.toMatchObject({ ok: false, cancelled: true, errorCode: 'unsynced-cancelled' });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('can continue after an acknowledged sync timeout without treating it as synced', async () => {
    vi.useFakeTimers();
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const pending = executeAuthenticatedLogout({
      auth: { signOut },
      hasPendingChanges: true,
      syncPendingChanges: () => new Promise(() => {}),
      confirmUnsynced: vi.fn().mockReturnValue(true),
      clearAuthenticatedState: () => ({ ok: true }),
      timeoutMs: 25
    });

    await vi.advanceTimersByTimeAsync(25);
    await expect(pending).resolves.toEqual({ ok: true, signedOut: true, syncAcknowledged: false });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('does not clear browser learning state when sign-out fails or stalls', async () => {
    const cleanup = vi.fn();
    await expect(executeAuthenticatedLogout({
      auth: { signOut: vi.fn().mockResolvedValue({ error: new Error('network') }) },
      clearAuthenticatedState: cleanup
    })).resolves.toMatchObject({ ok: false, signedOut: false, errorCode: 'signout-failed' });
    expect(cleanup).not.toHaveBeenCalled();

    vi.useFakeTimers();
    const timedOut = executeAuthenticatedLogout({
      auth: { signOut: vi.fn(() => new Promise(() => {})) },
      clearAuthenticatedState: cleanup,
      timeoutMs: 25
    });
    await vi.advanceTimersByTimeAsync(25);
    await expect(timedOut).resolves.toMatchObject({ ok: false, signedOut: false, errorCode: 'signout-timeout' });
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('reports a signed-out cleanup failure without claiming the old session is active', async () => {
    await expect(executeAuthenticatedLogout({
      auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
      clearAuthenticatedState: () => ({ ok: false, errorCode: 'storage-cleanup-incomplete' })
    })).resolves.toEqual({
      ok: false,
      signedOut: true,
      syncAcknowledged: true,
      errorCode: 'storage-cleanup-incomplete'
    });
  });

  it('removes active child/account data for refresh while preserving scoped recovery snapshots', () => {
    const storage = memoryStorage({
      jannati_active_account_id: 'account-a',
      jannati_profile_v152: '{"name":"Child A"}',
      jannati_child_profiles: '[{"id":"child-a"}]',
      'jannati_account_snapshot:account-a': '{"backup":true}',
      'jannati_parent_security:account-a': '{"pin":true}',
      unrelated: 'keep'
    });
    const activeDataKey = key => key === 'jannati_profile_v152' || key === 'jannati_child_profiles';

    const result = clearAuthenticatedBrowserStorage(storage, {
      isAccountDataKey: activeDataKey,
      accountScopeKey: 'jannati_active_account_id'
    });

    expect(result).toMatchObject({ ok: true });
    expect(storage.getItem('jannati_active_account_id')).toBeNull();
    expect(storage.getItem('jannati_profile_v152')).toBeNull();
    expect(storage.getItem('jannati_child_profiles')).toBeNull();
    expect(storage.getItem('jannati_account_snapshot:account-a')).toBe('{"backup":true}');
    expect(storage.getItem('jannati_parent_security:account-a')).toBe('{"pin":true}');
    expect(storage.getItem('unrelated')).toBe('keep');
  });

  it('fails closed when stale child data cannot be removed before account switching', () => {
    const storage = memoryStorage({
      jannati_active_account_id: 'account-a',
      jannati_child_profiles: '[{"id":"child-a"}]'
    });
    storage.removeItem = vi.fn();

    expect(clearAuthenticatedBrowserStorage(storage, {
      isAccountDataKey: key => key === 'jannati_child_profiles',
      accountScopeKey: 'jannati_active_account_id'
    })).toMatchObject({ ok: false, errorCode: 'storage-cleanup-incomplete' });
    expect(storage.getItem('jannati_child_profiles')).not.toBeNull();
    expect(storage.getItem('jannati_active_account_id')).toBe('account-a');
  });
});
