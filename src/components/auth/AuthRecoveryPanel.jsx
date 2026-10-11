import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '../../services/supabaseClient.js';
import {
  AUTH_PASSWORD_MIN_LENGTH,
  RECOVERY_SIGN_OUT_FAILED_MESSAGE,
  endRecoverySession,
  requestPasswordReset,
  resendSignupConfirmation,
  updateRecoveryPasswordAndFinalize
} from '../../services/authRecoveryActions.js';

async function resolveAuth(auth, onSupabaseReady) {
  if (auth) return auth;
  const client = await getSupabaseClient();
  if (client) onSupabaseReady?.(client);
  return client?.auth || null;
}

export default function AuthRecoveryPanel({
  mode = 'request-reset',
  auth = null,
  initialEmail = '',
  redirectTo,
  onSupabaseReady,
  onBack,
  onComplete
}) {
  const panelRef = useRef(null);
  const [activeMode, setActiveMode] = useState(mode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [recoveryFinalized, setRecoveryFinalized] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setActiveMode(mode);
    setMessage('');
    setMessageKind('');
    setPasswordUpdated(false);
    setRecoveryFinalized(false);
    panelRef.current?.focus();
  }, [mode]);

  async function runAction(action) {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setMessageKind('');
    try {
      const resolvedAuth = await resolveAuth(auth, onSupabaseReady);
      const result = await action(resolvedAuth);
      setMessage(result.message);
      setMessageKind(result.ok ? 'success' : 'error');
    } catch {
      setMessage('Akaun tidak dapat diproses sekarang. Cuba lagi sebentar.');
      setMessageKind('error');
    } finally {
      setBusy(false);
    }
  }

  async function handleResetRequest(event) {
    event.preventDefault();
    await runAction(resolvedAuth => requestPasswordReset({ auth: resolvedAuth, email, redirectTo }));
  }

  async function handleResend(event) {
    event.preventDefault();
    await runAction(resolvedAuth => resendSignupConfirmation({ auth: resolvedAuth, email, emailRedirectTo: redirectTo }));
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    setMessageKind('');
    try {
      const resolvedAuth = await resolveAuth(auth, onSupabaseReady);
      const result = await updateRecoveryPasswordAndFinalize({ auth: resolvedAuth, password, confirmation });
      setMessage(result.message);
      setMessageKind(result.ok ? 'success' : 'error');
      setPasswordUpdated(Boolean(result.passwordUpdated));
      setRecoveryFinalized(Boolean(result.finalized));
      if (result.passwordUpdated) {
        setPassword('');
        setConfirmation('');
      }
    } catch {
      setMessage('Akaun tidak dapat diproses sekarang. Cuba lagi sebentar.');
      setMessageKind('error');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOutRetry() {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setMessageKind('');
    try {
      const resolvedAuth = await resolveAuth(auth, onSupabaseReady);
      const result = await endRecoverySession({ auth: resolvedAuth });
      setMessage(result.message);
      setMessageKind(result.ok ? 'success' : 'error');
      setPasswordUpdated(true);
      setRecoveryFinalized(Boolean(result.finalized));
    } catch {
      setMessage(RECOVERY_SIGN_OUT_FAILED_MESSAGE);
      setMessageKind('error');
      setPasswordUpdated(true);
      setRecoveryFinalized(false);
    } finally {
      setBusy(false);
    }
  }

  if (activeMode === 'pending-link') {
    return <section ref={panelRef} tabIndex={-1} className="auth-recovery-panel" aria-labelledby="auth-recovery-title">
      <p className="eyebrow">Akaun Jannati</p>
      <h1 id="auth-recovery-title">Menyediakan tetapan kata laluan</h1>
      <p role="status" aria-live="polite">Pautan sedang disahkan. Sebentar ya.</p>
    </section>;
  }

  if (activeMode === 'invalid-link') {
    return <section ref={panelRef} tabIndex={-1} className="auth-recovery-panel" aria-labelledby="auth-recovery-title">
      <p className="eyebrow">Akaun Jannati</p>
      <h1 id="auth-recovery-title">Pautan e-mel tidak sah atau telah tamat tempoh.</h1>
      <p>Pilih tindakan yang sesuai untuk akaun kamu atau kembali ke log masuk.</p>
      <button type="button" onClick={() => setActiveMode('request-reset')}>Tetapkan semula kata laluan</button>
      <button type="button" className="secondary" onClick={() => setActiveMode('resend-signup')}>Hantar semula e-mel pengesahan</button>
      <button type="button" className="secondary" onClick={onBack}>Kembali ke log masuk</button>
    </section>;
  }

  if (activeMode === 'update-password') {
    return <section ref={panelRef} tabIndex={-1} className="auth-recovery-panel" aria-labelledby="auth-recovery-title">
      <p className="eyebrow">Akaun Jannati</p>
      <h1 id="auth-recovery-title">Tetapkan kata laluan baharu</h1>
      {!passwordUpdated && <form className="account-login-form" onSubmit={handlePasswordUpdate}>
        <label htmlFor="recovery-password">Kata laluan baharu</label>
        <input id="recovery-password" type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={AUTH_PASSWORD_MIN_LENGTH} autoComplete="new-password" required />
        <small>Minimum {AUTH_PASSWORD_MIN_LENGTH} aksara.</small>
        <label htmlFor="recovery-password-confirmation">Sahkan kata laluan baharu</label>
        <input id="recovery-password-confirmation" type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} minLength={AUTH_PASSWORD_MIN_LENGTH} autoComplete="new-password" required />
        {message && <p className="autosave-note" role="alert" aria-live="assertive">{message}</p>}
        <button type="submit" className="full" disabled={busy}>{busy ? 'Mengemas kini...' : 'Kemas kini kata laluan'}</button>
      </form>}
      {passwordUpdated && !recoveryFinalized && <>
        <p className="autosave-note" role="alert" aria-live="assertive">{message}</p>
        <button type="button" className="full" onClick={handleSignOutRetry} disabled={busy}>{busy ? 'Menamatkan sesi...' : 'Cuba tamatkan sesi semula'}</button>
      </>}
      {recoveryFinalized && <>
        <p className="autosave-note" role="status" aria-live="polite">{message}</p>
        <button type="button" onClick={onComplete}>Log masuk</button>
      </>}
    </section>;
  }

  const resendMode = activeMode === 'resend-signup';
  return <section ref={panelRef} tabIndex={-1} className="auth-recovery-panel" aria-labelledby="auth-recovery-title">
    <p className="eyebrow">Akaun Jannati</p>
    <h1 id="auth-recovery-title">{resendMode ? 'Hantar semula e-mel pengesahan' : 'Tetapkan semula kata laluan'}</h1>
    <p>{resendMode ? 'Masukkan e-mel akaun untuk menerima pautan pengesahan baharu.' : 'Masukkan e-mel akaun untuk menerima pautan tetapan semula.'}</p>
    <form className="account-login-form" onSubmit={resendMode ? handleResend : handleResetRequest}>
      <label htmlFor="recovery-email">E-mel</label>
      <input id="recovery-email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required autoFocus />
      {message && <p className="autosave-note" role={messageKind === 'error' ? 'alert' : 'status'} aria-live={messageKind === 'error' ? 'assertive' : 'polite'}>{message}</p>}
      <button type="submit" className="full" disabled={busy}>{busy ? 'Menghantar...' : resendMode ? 'Hantar semula e-mel pengesahan' : 'Hantar pautan tetapan semula'}</button>
    </form>
    <button type="button" className="text-button" onClick={onBack}>Kembali ke log masuk</button>
  </section>;
}
