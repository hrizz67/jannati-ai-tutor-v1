import React from 'react';

export default function CommunicationContentErrorFallback({
  title,
  onDashboard,
  onReload = () => window.location.reload()
}) {
  return <main className="app">
    <section className="card">
      <div className="empty-state" role="alert">
        <b>{title}</b>
        <p>Jangan risau. Latihan ini belum dapat dibuka. Kembali ke Papan Utama untuk belajar perkara lain, atau tekan Muat semula aplikasi untuk membukanya semula.</p>
        <div className="actions">
          <button type="button" className="secondary" onClick={onDashboard}>Papan Utama</button>
          <button type="button" onClick={onReload}>Muat semula aplikasi</button>
        </div>
      </div>
    </section>
  </main>;
}
