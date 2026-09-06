import React, { useEffect, useRef, useState } from 'react';
import ParentAccessGate from './ParentAccessGate.jsx';
import ParentDashboard from '../../dashboard/ParentDashboard.jsx';

const PARENT_INACTIVITY_MS = 10 * 60 * 1000;

export default function ParentModeBoundary({
  accountId,
  accountEmail,
  authMarker,
  activeChildId,
  onBack,
  onLogout,
  ...dashboardProps
}) {
  const [unlockedAccountId, setUnlockedAccountId] = useState('');
  const [lockMessage, setLockMessage] = useState('');
  const reportRef = useRef(null);

  useEffect(() => {
    setUnlockedAccountId('');
    setLockMessage('');
  }, [accountId, activeChildId]);

  useEffect(() => {
    if (!accountId || unlockedAccountId !== accountId) return undefined;
    let timer = null;
    const lock = () => {
      setUnlockedAccountId('');
      setLockMessage('Sesi Ibu Bapa dikunci semula selepas 10 minit tidak aktif.');
    };
    const resetTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(lock, PARENT_INACTIVITY_MS);
    };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach(eventName => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach(eventName => window.removeEventListener(eventName, resetTimer));
    };
  }, [accountId, unlockedAccountId]);

  useEffect(() => {
    if (unlockedAccountId !== accountId) return;
    window.requestAnimationFrame(() => reportRef.current?.focus());
  }, [accountId, unlockedAccountId]);

  function leaveParentMode() {
    setUnlockedAccountId('');
    onBack?.();
  }

  if (!accountId || unlockedAccountId !== accountId) {
    return (
      <>
        {lockMessage && <p className="parent-lock-message" role="status">{lockMessage}</p>}
        <ParentAccessGate
          accountId={accountId}
          authMarker={authMarker}
          onUnlock={() => {
            setLockMessage('');
            setUnlockedAccountId(accountId);
          }}
          onBack={onBack}
          onLogout={onLogout}
        />
      </>
    );
  }

  return (
    <div ref={reportRef} className="parent-unlocked-session" tabIndex={-1} aria-label="Laporan Ibu Bapa dibuka">
      <div className="parent-session-banner print-hide" role="status">
        <span>Mod Ibu Bapa dibuka untuk sesi ini sahaja.</span>
        <button type="button" className="ghost" onClick={() => setUnlockedAccountId('')}>Kunci Sekarang</button>
      </div>
      <ParentDashboard key={activeChildId || 'active-child'} {...dashboardProps} activeChildId={activeChildId} onBack={leaveParentMode} />
    </div>
  );
}
