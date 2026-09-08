import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  canRecoverParentPin,
  createParentPinSubmission,
  getParentAccessMessage,
  getParentPinAttemptState,
  getParentPinStatus,
  requestParentPinRecovery
} from '../../services/parentAccess.js';

function getBlockedSeconds(state) {
  return Math.max(1, Math.ceil((Number(state?.remainingMs) || 0) / 1000));
}

export default function ParentAccessGate({ accountId, authMarker, activeChildId, onUnlock, onBack, onLogout }) {
  const inputRef = useRef(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [tick, setTick] = useState(Date.now());
  const [pinStatus, setPinStatus] = useState(() => getParentPinStatus(accountId));
  const pinExists = pinStatus.exists;
  const [recoveryAllowed, setRecoveryAllowed] = useState(() => canRecoverParentPin(accountId, authMarker));
  const [setupMode, setSetupMode] = useState((!pinExists && !pinStatus.errorCode) || recoveryAllowed);
  const [submission] = useState(() => createParentPinSubmission());
  const contextRef = useRef(null);
  const attemptState = getParentPinAttemptState(accountId, { now: tick });
  const rateBlocked = !setupMode && attemptState.isBlocked && !attemptState.errorCode;

  useLayoutEffect(() => {
    const context = { accountId, authMarker, activeChildId };
    contextRef.current = context;
    submission.invalidate();
    return () => { contextRef.current = null; submission.invalidate(); };
  }, [accountId, authMarker, activeChildId, submission]);

  useEffect(() => {
    setPin('');
    setConfirmPin('');
    setMessage('');
    setBusy(false);
    const refreshStatus = () => {
      const status = getParentPinStatus(accountId);
      const recovery = canRecoverParentPin(accountId, authMarker);
      setPinStatus(status);
      setRecoveryAllowed(recovery);
      setSetupMode((!status.exists && !status.errorCode) || recovery);
    };
    refreshStatus();
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    window.addEventListener('storage', refreshStatus);
    return () => { window.clearTimeout(timer); window.removeEventListener('storage', refreshStatus); };
  }, [accountId, authMarker, activeChildId]);

  useEffect(() => {
    if (!rateBlocked) return undefined;
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [rateBlocked, attemptState.blockedUntil]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!accountId || busy) return;
    const context = contextRef.current;
    const isCurrent = () => context && contextRef.current === context;
    setBusy(true);
    setMessage('');
    const result = await submission.submit({ accountId, authMarker, pin, confirmPin, setupMode, isCurrent, onUnlock: () => onUnlock?.(context) });
    // A duplicate handler must not release the first request's busy state.
    if (!isCurrent() || result.status === 'busy' || result.status === 'stale') return;
    setBusy(false);
    setTick(Date.now());
    if (result.saved) {
      setPinStatus(getParentPinStatus(accountId));
      setSetupMode(false);
      setRecoveryAllowed(false);
      setPin('');
      setConfirmPin('');
    }
    if (result.status === 'incorrect') {
      setPin('');
      setMessage(result.attempts.isBlocked
        ? `PIN tidak tepat. Cuba semula dalam ${getBlockedSeconds(result.attempts)} saat.`
        : 'PIN tidak tepat. Maklumat anak masih dikunci.');
      inputRef.current?.focus();
    } else if (result.code) {
      setMessage(getParentAccessMessage(result.code));
    }
  }

  async function startRecovery() {
    if (!accountId || busy) return;
    const context = contextRef.current;
    if (!requestParentPinRecovery(accountId, authMarker)) {
      setMessage(getParentAccessMessage('parent_pin_session_storage_unavailable'));
      return;
    }
    setBusy(true);
    setMessage('Log masuk semula diperlukan sebelum PIN boleh ditetapkan semula.');
    try { await onLogout?.(); }
    catch { if (contextRef.current === context) setMessage('Log keluar belum berjaya. Cuba log keluar dan log masuk semula sebelum menetapkan PIN.'); }
    finally { if (contextRef.current === context) setBusy(false); }
  }

  if (!accountId) {
    return (
      <main className="app parent-access-page">
        <section className="card parent-access-card" aria-labelledby="parent-access-title">
          <p className="eyebrow">Kawasan Ibu Bapa</p>
          <h1 id="parent-access-title">Log masuk diperlukan</h1>
          <p>Maklumat prestasi anak hanya boleh dibuka melalui akaun ibu bapa yang sah.</p>
          <button type="button" className="full" onClick={onBack}>Kembali ke Papan Utama</button>
        </section>
      </main>
    );
  }

  return (
    <main className="app parent-access-page">
      <div className="topbar print-hide">
        <button type="button" className="ghost" onClick={onBack}>Papan Utama</button>
        <span className="pill">Pengesahan Ibu Bapa</span>
      </div>
      <section className="card parent-access-card" aria-labelledby="parent-access-title">
        <p className="eyebrow">Kawasan Ibu Bapa</p>
        <h1 id="parent-access-title">{setupMode ? (pinExists ? 'Tetapkan semula PIN' : 'Cipta PIN ibu bapa') : 'Masukkan PIN ibu bapa'}</h1>
        <p>{setupMode
          ? 'Gunakan 4 hingga 6 digit yang hanya diketahui oleh ibu bapa atau penjaga.'
          : 'Laporan pembelajaran anak akan kekal tersembunyi sehingga PIN disahkan.'}</p>
        <p className="parent-account-hint">Akaun ibu bapa telah disahkan.</p>

        <form className="parent-pin-form" onSubmit={handleSubmit}>
          <label htmlFor="parent-pin">PIN ibu bapa</label>
          <input
            ref={inputRef}
            id="parent-pin"
            name="parent-pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4,6}"
            minLength={4}
            maxLength={6}
            autoComplete="current-password"
            value={pin}
            onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={busy || rateBlocked}
            aria-describedby="parent-pin-help parent-pin-status"
            required
          />
          <small id="parent-pin-help">PIN tidak disimpan sebagai teks biasa dan tidak dimasukkan dalam backup pembelajaran.</small>
          {setupMode && (
            <>
              <label htmlFor="parent-pin-confirm">Sahkan PIN</label>
              <input
                id="parent-pin-confirm"
                name="parent-pin-confirm"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                minLength={4}
                maxLength={6}
                autoComplete="new-password"
                value={confirmPin}
                onChange={event => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={busy}
                required
              />
            </>
          )}
          <p id="parent-pin-status" className="parent-pin-status" role="status" aria-live="polite">
            {rateBlocked
              ? `Terlalu banyak cubaan. Cuba semula dalam ${getBlockedSeconds(attemptState)} saat.`
              : message || (pinStatus.errorCode && !recoveryAllowed ? getParentAccessMessage(pinStatus.errorCode) : '')}
          </p>
          <button type="submit" className="full" disabled={busy || rateBlocked}>
            {busy ? 'Mengesahkan…' : setupMode ? 'Simpan dan Buka Laporan' : 'Buka Laporan Ibu Bapa'}
          </button>
        </form>

        {!setupMode && (
          <button type="button" className="ghost parent-recovery-action" onClick={startRecovery} disabled={busy}>
            Lupa PIN? Log keluar untuk tetapkan semula
          </button>
        )}
        {recoveryAllowed && <p className="parent-recovery-note" role="status">Login semula disahkan. Anda boleh mencipta PIN baharu.</p>}
      </section>
    </main>
  );
}
