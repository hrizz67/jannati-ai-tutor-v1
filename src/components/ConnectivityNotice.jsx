import React, { useEffect, useState } from 'react';
import { ACCOUNT_CONNECTIVITY_EVENT } from '../services/accountErrorMessages.js';

function getInitialStatus() {
  if (typeof navigator === 'undefined') return 'idle';
  return navigator.onLine === false ? 'offline' : 'idle';
}

export default function ConnectivityNotice() {
  const [status, setStatus] = useState(getInitialStatus);

  useEffect(() => {
    const handleOffline = () => setStatus('offline');
    const handleOnline = () => setStatus(current => current === 'offline' ? 'restored' : 'idle');
    const handleAccountConnectivity = event => {
      const accountStatus = event?.detail?.status;
      if (accountStatus === 'offline') setStatus('offline');
      else if (accountStatus === 'unreachable') setStatus('account-unreachable');
      else if (accountStatus === 'reachable') {
        setStatus(current => current === 'account-unreachable' ? 'account-restored' : 'idle');
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener(ACCOUNT_CONNECTIVITY_EVENT, handleAccountConnectivity);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener(ACCOUNT_CONNECTIVITY_EVENT, handleAccountConnectivity);
    };
  }, []);

  useEffect(() => {
    if (!['restored', 'account-restored'].includes(status)) return undefined;
    const timer = window.setTimeout(() => setStatus('idle'), 4500);
    return () => window.clearTimeout(timer);
  }, [status]);

  if (status === 'idle') return null;

  return (
    <div
      className={`connectivity-notice connectivity-notice-${status}`}
      data-network-status={status}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {status === 'offline'
        ? 'Peranti sedang luar talian. Pembelajaran dan simpanan pada peranti masih boleh diteruskan.'
        : status === 'account-unreachable'
          ? 'Internet tersedia, tetapi pelayan akaun belum dapat dicapai. Mod Free pada peranti masih boleh digunakan.'
          : status === 'account-restored'
            ? 'Pelayan akaun boleh dicapai semula.'
            : 'Sambungan internet kembali. Pelayan akaun akan diperiksa apabila diperlukan.'}
    </div>
  );
}
