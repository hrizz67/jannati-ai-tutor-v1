import React, { useEffect, useState } from 'react';

function getInitialStatus() {
  if (typeof navigator === 'undefined') return 'online';
  return navigator.onLine === false ? 'offline' : 'online';
}

export default function ConnectivityNotice() {
  const [status, setStatus] = useState(getInitialStatus);

  useEffect(() => {
    const handleOffline = () => setStatus('offline');
    const handleOnline = () => setStatus(current => current === 'offline' ? 'restored' : 'online');

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (status !== 'restored') return undefined;
    const timer = window.setTimeout(() => setStatus('online'), 4500);
    return () => window.clearTimeout(timer);
  }, [status]);

  if (status === 'online') return null;

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
        : 'Sambungan kembali. Perubahan akaun akan disegerakkan semula.'}
    </div>
  );
}
