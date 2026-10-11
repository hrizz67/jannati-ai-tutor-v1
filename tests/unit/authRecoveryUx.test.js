import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AuthRecoveryPanel from '../../src/components/auth/AuthRecoveryPanel.jsx';
import manualSalesConfig from '../../src/config/manualSalesConfig.js';
import {
  AUTH_PASSWORD_MIN_LENGTH,
  PASSWORD_UPDATED_MESSAGE,
  RECOVERY_SIGN_OUT_FAILED_MESSAGE,
  SAFE_CONFIRMATION_RESENT,
  SAFE_PASSWORD_RESET_SENT,
  endRecoverySession,
  requestPasswordReset,
  resendSignupConfirmation,
  updateRecoveryPassword,
  updateRecoveryPasswordAndFinalize,
  validateNewPassword
} from '../../src/services/authRecoveryActions.js';
import {
  AUTH_RECOVERY_STATUS,
  getInitialAuthRecoveryStatus,
  resolveAuthRecoveryEvent
} from '../../src/services/authRecoveryIntent.js';

const productionUrl = 'https://hrizz67.github.io/jannati-ai-tutor-v1/';
const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const recoveryPanelSource = fs.readFileSync(new URL('../../src/components/auth/AuthRecoveryPanel.jsx', import.meta.url), 'utf8');
const recoveryActionSource = fs.readFileSync(new URL('../../src/services/authRecoveryActions.js', import.meta.url), 'utf8');
const containmentSource = fs.readFileSync(new URL('../../tests/unit/publicLaunchSurfaceContainment.test.js', import.meta.url), 'utf8');
const packageLock = JSON.parse(fs.readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));

describe('P1.15B1 public auth recovery UX', () => {
  it('uses the installed Supabase Auth API version that was audited', () => {
    expect(packageLock.packages['node_modules/@supabase/supabase-js'].version).toBe('2.112.2');
    expect(packageLock.packages['node_modules/@supabase/auth-js'].version).toBe('2.112.2');
  });

  it('shows Lupa kata laluan only from the sign-in branch', () => {
    expect(appSource).toContain("accountMode === 'signin' && <button");
    expect(appSource).toContain('>Lupa kata laluan?</button>');
  });

  it('requests a reset once with the exact production redirect', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ data: {}, error: null });
    const result = await requestPasswordReset({ auth: { resetPasswordForEmail }, email: 'parent@example.com', redirectTo: productionUrl });
    expect(resetPasswordForEmail).toHaveBeenCalledTimes(1);
    expect(resetPasswordForEmail).toHaveBeenCalledWith('parent@example.com', { redirectTo: productionUrl });
    expect(result).toEqual({ ok: true, message: SAFE_PASSWORD_RESET_SENT });
  });

  it('uses neutral reset success copy that does not confirm account existence', () => {
    expect(SAFE_PASSWORD_RESET_SENT).toBe('Jika akaun dengan e-mel itu tersedia, pautan tetapan semula telah dihantar.');
    expect(SAFE_PASSWORD_RESET_SENT).not.toMatch(/akaun (wujud|tidak wujud)|berdaftar/i);
  });

  it('opens password update for a valid PASSWORD_RECOVERY event without ordinary hydration', () => {
    expect(resolveAuthRecoveryEvent({ event: 'PASSWORD_RECOVERY', hasSession: true })).toEqual({
      status: AUTH_RECOVERY_STATUS.READY,
      shouldHydrate: false
    });
  });

  it('marks a PASSWORD_RECOVERY event without a session as invalid', () => {
    expect(resolveAuthRecoveryEvent({ event: 'PASSWORD_RECOVERY', hasSession: false }).status).toBe(AUTH_RECOVERY_STATUS.INVALID);
  });

  it('keeps ordinary SIGNED_IN hydration unchanged when no recovery is pending', () => {
    expect(resolveAuthRecoveryEvent({ event: 'SIGNED_IN', hasSession: true, currentStatus: AUTH_RECOVERY_STATUS.IDLE })).toEqual({
      status: AUTH_RECOVERY_STATUS.IDLE,
      shouldHydrate: true
    });
  });

  it('recognizes recovery intent without retaining callback credentials', () => {
    expect(getInitialAuthRecoveryStatus({ search: '', hash: '#type=recovery&credential=secret-value' })).toBe(AUTH_RECOVERY_STATUS.PENDING);
  });

  it('recognizes an expired recovery callback and supplies a safe route', () => {
    expect(getInitialAuthRecoveryStatus({ search: '?error=access_denied&error_code=otp_expired', hash: '' })).toBe(AUTH_RECOVERY_STATUS.INVALID);
    const markup = renderToStaticMarkup(React.createElement(AuthRecoveryPanel, { mode: 'invalid-link', onBack: () => {} }));
    expect(markup).toContain('Pautan e-mel tidak sah atau telah tamat tempoh.');
    expect(markup).toContain('Tetapkan semula kata laluan');
    expect(markup).toContain('Hantar semula e-mel pengesahan');
    expect(markup).toContain('Kembali ke log masuk');
  });

  it('rejects mismatched passwords before calling the backend', async () => {
    const updateUser = vi.fn();
    const result = await updateRecoveryPassword({ auth: { updateUser }, password: 'abcdef', confirmation: 'abcdeg' });
    expect(result).toEqual({ ok: false, message: 'Kata laluan tidak sepadan.' });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('enforces the existing six-character minimum and rejects an empty password', () => {
    expect(AUTH_PASSWORD_MIN_LENGTH).toBe(6);
    expect(validateNewPassword('', '').valid).toBe(false);
    expect(validateNewPassword('12345', '12345')).toEqual({ valid: false, message: 'Kata laluan mesti sekurang-kurangnya 6 aksara.' });
  });

  it('updates a valid recovery password exactly once', async () => {
    const updateUser = vi.fn().mockResolvedValue({ data: { user: {} }, error: null });
    const result = await updateRecoveryPassword({ auth: { updateUser }, password: 'baharu123', confirmation: 'baharu123' });
    expect(updateUser).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledWith({ password: 'baharu123' });
    expect(result).toEqual({ ok: true, message: PASSWORD_UPDATED_MESSAGE });
  });

  it('updates the password once and signs out the recovery session before finalizing', async () => {
    const calls = [];
    const auth = {
      updateUser: vi.fn().mockImplementation(async () => {
        calls.push('update');
        return { data: { user: {} }, error: null };
      }),
      signOut: vi.fn().mockImplementation(async options => {
        calls.push('sign-out');
        expect(options).toEqual({ scope: 'local' });
        return { error: null };
      })
    };

    const result = await updateRecoveryPasswordAndFinalize({
      auth,
      password: 'baharu123',
      confirmation: 'baharu123'
    });

    expect(calls).toEqual(['update', 'sign-out']);
    expect(auth.updateUser).toHaveBeenCalledTimes(1);
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      finalized: true,
      passwordUpdated: true,
      message: 'Kata laluan berjaya dikemas kini. Sila log masuk semula.'
    });
  });

  it('does not report clean completion when recovery sign-out fails', async () => {
    const auth = {
      updateUser: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: { status: 503, message: 'provider unavailable' } })
    };
    const result = await updateRecoveryPasswordAndFinalize({
      auth,
      password: 'baharu123',
      confirmation: 'baharu123'
    });

    expect(result).toEqual({
      ok: false,
      finalized: false,
      passwordUpdated: true,
      message: RECOVERY_SIGN_OUT_FAILED_MESSAGE
    });
    expect(result.message).not.toContain('Sila log masuk semula');
  });

  it('retries only recovery sign-out after the password was already updated', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const result = await endRecoverySession({ auth: { signOut } });
    expect(signOut).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(result.finalized).toBe(true);
  });

  it('suppresses stale recovery refresh events until the signed-out cleanup event', () => {
    expect(resolveAuthRecoveryEvent({
      event: 'TOKEN_REFRESHED',
      hasSession: true,
      currentStatus: AUTH_RECOVERY_STATUS.READY
    })).toEqual({ status: AUTH_RECOVERY_STATUS.READY, shouldHydrate: false });
    expect(resolveAuthRecoveryEvent({
      event: 'USER_UPDATED',
      hasSession: true,
      currentStatus: AUTH_RECOVERY_STATUS.READY
    })).toEqual({ status: AUTH_RECOVERY_STATUS.READY, shouldHydrate: false });
    expect(resolveAuthRecoveryEvent({
      event: 'SIGNED_OUT',
      hasSession: false,
      currentStatus: AUTH_RECOVERY_STATUS.READY
    })).toEqual({ status: AUTH_RECOVERY_STATUS.READY, shouldHydrate: true });
  });

  it('offers normal login only after the finalized recovery state', () => {
    expect(recoveryPanelSource).toContain('{recoveryFinalized && <>');
    expect(recoveryPanelSource).toContain('>Log masuk</button>');
    expect(appSource).toContain("setAuthRecoveryStatus(AUTH_RECOVERY_STATUS.IDLE)");
    expect(appSource).toContain("setScreen('login')");
  });

  it('resends signup confirmation with the supported exact SDK shape', async () => {
    const resend = vi.fn().mockResolvedValue({ data: {}, error: null });
    const result = await resendSignupConfirmation({ auth: { resend }, email: 'parent@example.com', emailRedirectTo: productionUrl });
    expect(resend).toHaveBeenCalledTimes(1);
    expect(resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'parent@example.com',
      options: { emailRedirectTo: productionUrl }
    });
    expect(result).toEqual({ ok: true, message: SAFE_CONFIRMATION_RESENT });
  });

  it('uses neutral resend success copy', () => {
    expect(SAFE_CONFIRMATION_RESENT).toContain('Jika e-mel itu memerlukan pengesahan');
    expect(SAFE_CONFIRMATION_RESENT).not.toMatch(/akaun (wujud|tidak wujud)|sudah berdaftar/i);
  });

  it('renders associated password labels, minimum guidance, and accessible status regions', () => {
    const markup = renderToStaticMarkup(React.createElement(AuthRecoveryPanel, { mode: 'update-password', auth: { updateUser: () => {} } }));
    expect(markup).toContain('for="recovery-password"');
    expect(markup).toContain('for="recovery-password-confirmation"');
    expect(markup).toContain('Minimum 6 aksara.');
    expect(markup).toContain('minLength="6"');
  });

  it('never renders, logs, or names session credentials in new recovery code', () => {
    const newRecoveryCode = `${recoveryPanelSource}\n${recoveryActionSource}`;
    expect(newRecoveryCode).not.toMatch(/access_token|refresh_token|Bearer|console\./i);
  });

  it('passes every recovery and resend redirect through the unchanged redirect helper', () => {
    expect(appSource).toContain('function getEmailRedirectUrl()');
    expect(appSource).toContain('redirectTo={getEmailRedirectUrl()}');
    expect(appSource).toContain('emailRedirectTo: getEmailRedirectUrl()');
    expect(appSource).not.toContain("redirectTo: 'http://localhost");
  });

  it('keeps signup, sign-in, guest Free, and account-backed hydration paths', () => {
    expect(appSource).toContain('supabase.auth.signInWithPassword');
    expect(appSource).toContain('supabase.auth.signUp');
    expect(appSource).toContain('Mula Belajar Free');
    expect(appSource).toContain('onResumeGuest');
    expect(appSource).toContain('requestAccountSync(session?.user || null)');
    expect(appSource).toContain('Semak e-mel dan tekan pautan pengesahan sebelum log masuk.');
  });

  it('preserves server-authoritative Premium restoration and manual sales configuration', () => {
    expect(appSource).toContain('loadMyPremiumEntitlement');
    expect(manualSalesConfig.plans.map(plan => plan.priceMYR)).toEqual([10, 25, 100]);
    expect(manualSalesConfig.whatsappNumber).toBe('60134425202');
  });

  it('preserves P1.15A internal-surface containment', () => {
    expect(containmentSource).toContain('isInternalUiSurfaceEnabled');
    expect(appSource).toContain('isInternalUiSurfaceEnabled() && <BetaFeedbackButton');
    expect(appSource).toContain('isInternalUiSurfaceEnabled() && <details className="qde-debug-panel"');
  });
});
