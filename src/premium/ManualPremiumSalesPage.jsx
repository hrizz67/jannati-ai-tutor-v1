import React, { useMemo, useState } from 'react';
import manualSalesConfig from '../config/manualSalesConfig.js';
import {
  buildManualPaymentSummary,
  buildWhatsAppPaymentUrl,
  formatManualSalesPlanPrice,
  getEnabledManualSalesPlans,
  getManualSalesAccessPresentation,
  shortenAccountId
} from '../services/manualPremiumSales.js';
import './manual-premium-sales.css';

async function copyText(value) {
  if (!globalThis.navigator?.clipboard?.writeText) throw new Error('clipboard_unavailable');
  await globalThis.navigator.clipboard.writeText(value);
}

export default function ManualPremiumSalesPage({ accountUser = null, accessProfile = {}, onBack, onLogin }) {
  const plans = useMemo(() => getEnabledManualSalesPlans(manualSalesConfig), []);
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || '');
  const [copyStatus, setCopyStatus] = useState('');
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId) || plans[0] || null;
  const accountEmail = String(accountUser?.email || '').trim();
  const accountId = String(accountUser?.id || '').trim();
  const access = getManualSalesAccessPresentation(accessProfile);
  const details = { accountEmail, accountId, plan: selectedPlan, config: manualSalesConfig };
  const whatsAppUrl = accountId ? buildWhatsAppPaymentUrl(details) : '';
  const title = access.state === 'active' ? 'Perbaharui Premium' : 'Naik Taraf Premium';

  async function handleCopy(label, value) {
    try {
      await copyText(value);
      setCopyStatus(`${label} telah disalin.`);
    } catch {
      setCopyStatus('Salinan automatik tidak tersedia. Pilih dan salin maklumat secara manual.');
    }
  }

  if (!manualSalesConfig.enabled) {
    return <main className="manual-sales-page"><section className="manual-sales-shell"><h1>Jannati Premium</h1><p>Permohonan Premium belum tersedia.</p><button type="button" onClick={onBack}>Kembali</button></section></main>;
  }

  return (
    <main className="manual-sales-page">
      <section className="manual-sales-shell" aria-labelledby="manual-sales-title">
        <header className="manual-sales-header">
          <div><p className="eyebrow">Jannati Premium</p><h1 id="manual-sales-title">{title}</h1><p>Akses ciri pembelajaran Premium untuk akaun keluarga.</p></div>
          <button type="button" className="secondary" onClick={onBack}>Kembali</button>
        </header>

        <section className={`manual-sales-status ${access.state}`} aria-label="Status Premium semasa">
          <b>{access.label}</b>
          {access.expiryLabel ? <span>{access.expiryLabel}</span> : null}
          {access.daysRemaining !== null ? <span>{access.daysRemaining} hari berbaki berdasarkan status server.</span> : null}
        </section>

        <section className="manual-sales-card">
          <h2>Pilih pelan</h2>
          <div className="manual-plan-grid" role="radiogroup" aria-label="Pilihan pelan Premium">
            {plans.map(plan => (
              <label className={`manual-plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`} key={plan.id}>
                <input type="radio" name="manual-premium-plan" value={plan.id} checked={selectedPlan?.id === plan.id} onChange={() => setSelectedPlanId(plan.id)} />
                <span className="manual-plan-title">{plan.label}</span>
                <strong>{formatManualSalesPlanPrice(plan, manualSalesConfig.currency)}</strong>
                {plan.badge ? <small className="manual-plan-badge">{plan.badge}</small> : null}
                <small>{plan.description}</small>
              </label>
            ))}
          </div>
          <p className="manual-sales-note">Pembayaran disahkan secara manual oleh Admin sebelum Premium diaktifkan.</p>
        </section>

        <section className="manual-sales-card" aria-labelledby="manual-account-title">
          <h2 id="manual-account-title">Maklumat akaun</h2>
          {accountId ? <div className="manual-account-grid">
            <div><span>E-mel akaun</span><b>{accountEmail || 'E-mel tidak tersedia'}</b><button type="button" className="secondary" aria-label="Salin e-mel akaun" onClick={() => handleCopy('E-mel akaun', accountEmail)} disabled={!accountEmail}>Salin</button></div>
            <div><span>ID akaun</span><b title={shortenAccountId(accountId)}>{shortenAccountId(accountId)}</b><button type="button" className="secondary" aria-label="Salin ID akaun" onClick={() => handleCopy('ID akaun', accountId)}>Salin</button></div>
            <div><span>Pelan dipilih</span><b>{selectedPlan?.label || 'Belum dipilih'}</b></div>
          </div> : <div className="manual-login-required"><p>Log masuk dahulu supaya Admin boleh memadankan pembayaran dengan akaun yang betul.</p><button type="button" onClick={onLogin}>Log masuk akaun</button></div>}
        </section>

        <section className="manual-sales-card" aria-labelledby="manual-payment-title">
          <h2 id="manual-payment-title">Cara Bayar</h2>
          <ol className="manual-payment-steps">
            <li>Pilih pelan.</li><li>Buat pembayaran melalui kaedah manual yang dinyatakan.</li><li>Simpan bukti atau rujukan transaksi.</li><li>Hubungi Admin.</li><li>Admin akan semak pembayaran.</li><li>Premium aktif selepas pembayaran disahkan.</li>
          </ol>
          {manualSalesConfig.paymentInstructions.length
            ? <ul className="manual-payment-details">{manualSalesConfig.paymentInstructions.map(item => <li key={item}>{item}</li>)}</ul>
            : <p className="manual-sales-fallback">Maklumat pembayaran akan diberikan oleh Admin.</p>}
        </section>

        <section className="manual-sales-card manual-contact-card" aria-labelledby="manual-contact-title">
          <h2 id="manual-contact-title">Hubungi Admin</h2>
          <p>Mesej atau salinan maklumat bukan bukti bayaran. Status Premium hanya berubah selepas Admin menyemak pembayaran sebenar.</p>
          <div className="manual-contact-actions">
            {whatsAppUrl ? <a className="button-link" href={whatsAppUrl} target="_blank" rel="noreferrer" aria-label="Buka WhatsApp untuk meminta semakan pembayaran">Saya Dah Bayar</a> : <span className="manual-contact-unavailable">WhatsApp belum dikonfigurasi. Gunakan maklumat salinan untuk menghubungi Admin.</span>}
            <button type="button" className="secondary" disabled={!accountId || !selectedPlan} onClick={() => handleCopy('Maklumat pembayaran', buildManualPaymentSummary(details))}>Salin Maklumat</button>
          </div>
          {copyStatus ? <p className="manual-copy-status" role="status" aria-live="polite">{copyStatus}</p> : null}
        </section>
      </section>
    </main>
  );
}
