import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
} from '../../services/parentAccess.js';

function getBlockedSeconds(state) {
  return Math.max(1, Math.ceil((Number(state?.remainingMs) || 0) / 1000));
}

export default function ParentAccessGate({ accountId, authMarker, onUnlock, onBack, onLogout }) {
  const inputRef = useRef(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [tick, setTick] = useState(Date.now());
  const pinExists = useMemo(() => hasParentPin(accountId), [accountId]);
  const recoveryAllowed = useMemo(() => canRecoverParentPin(accountId, authMarker), [accountId, authMarker]);
  const [setupMode, setSetupMode] = useState(!pinExists || recoveryAllowed);
  const attemptState = getParentPinAttemptState(accountId, { now: tick });

  useEffect(() => {
    setPin('');
    setConfirmPin('');
    setMessage('');
    setSetupMode(!hasParentPin(accountId) || canRecoverParentPin(accountId, authMarker));
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [accountId, authMarker]);

  useEffect(() => {
    if (!attemptState.isBlocked) return undefined;
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [attemptState.isBlocked, attemptState.blockedUntil]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!accountId || busy) return;
    const currentAttempts = getParentPinAttemptState(accountId);
    if (!setupMode && currentAttempts.isBlocked) {
      setTick(Date.now());
      setMessage(`Terlalu banyak cubaan. Cuba semula dalam ${getBlockedSeconds(currentAttempts)} saat.`);
      return;
    }
    if (!isValidParentPin(pin)) {
      setMessage('Masukkan PIN 4 hingga 6 digit.');
      return;
    }
    if (setupMode && pin !== confirmPin) {
      setMessage('Pengesahan PIN tidak sepadan.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      if (setupMode) {
        if (pinExists) await replaceParentPinAfterReauthentication(accountId, pin, authMarker);
        else await saveParentPin(accountId, pin);
        clearParentPinAttempts(accountId);
        onUnlock?.();
      } else if (await verifyParentPin(accountId, pin)) {
        clearParentPinAttempts(accountId);
        onUnlock?.();
      } else {
        const failed = recordParentPinFailure(accountId);
        setPin('');
        setTick(Date.now());
        setMessage(failed.isBlocked
          ? `PIN tidak tepat. Cuba semula dalam ${getBlockedSeconds(failed)} saat.`
          : 'PIN tidak tepat. Maklumat anak masih dikunci.');
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
    } catch (error) {
      setMessage(error?.message === 'parent_pin_crypto_unavailable'
        ? 'Pengesahan selamat tidak tersedia dalam pelayar ini.'
        : 'PIN tidak dapat disimpan dengan selamat. Cuba semula.');
    } finally {
      setBusy(false);
    }
  }

  async function startRecovery() {
    if (!accountId || busy) return;
    requestParentPinRecovery(accountId, authMarker);
    setMessage('Log masuk semula diperlukan sebelum PIN boleh ditetapkan semula.');
    await onLogout?.();
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
            disabled={busy || (!setupMode && attemptState.isBlocked)}
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
            {attemptState.isBlocked
              ? `Terlalu banyak cubaan. Cuba semula dalam ${getBlockedSeconds(attemptState)} saat.`
              : message}
          </p>
          <button type="submit" className="full" disabled={busy || (!setupMode && attemptState.isBlocked)}>
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
