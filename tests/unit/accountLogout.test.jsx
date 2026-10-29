// @vitest-environment jsdom
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountLogoutButton } from '../../src/dashboard/HomeDashboard.jsx';
import { settleLogoutStep, signOutCurrentBrowserSession } from '../../src/utils/accountLogout.js';

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
});
