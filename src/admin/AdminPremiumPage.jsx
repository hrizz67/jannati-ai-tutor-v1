import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateRenewalExpiry,
  createRequestId,
  formatMalaysiaDateTime,
  loadAdminPremiumSummary,
  malaysiaEndOfDayUtc,
  managePremiumEntitlement,
  searchAdminPremiumAccounts
} from '../services/premiumEntitlement.js';

const ACTION_LABELS = Object.freeze({
  ACTIVATE_PREMIUM: 'Aktifkan Premium',
  EXTEND_PREMIUM: 'Lanjutkan Premium',
  SET_EXPIRY: 'Tetapkan Tarikh Tamat',
  CANCEL_PREMIUM: 'Batalkan Premium',
  MARK_COMPLIMENTARY: 'Tandakan Complimentary'
});

function errorMessage(error, fallback) {
  const code = String(error?.message || error?.code || '').toLowerCase();
  if (code.includes('admin_required') || code.includes('permission') || code.includes('row-level')) {
    return 'Akses admin tidak dibenarkan untuk akaun ini.';
  }
  if (code.includes('search_text_too_short')) return 'Masukkan sekurang-kurangnya 2 aksara.';
  if (code.includes('future_expiry_required')) return 'Tarikh tamat mesti selepas masa server sekarang.';
  return fallback;
}

function SummaryCard({ label, value }) {
  return <div className="admin-premium-summary-card"><strong>{Number(value) || 0}</strong><span>{label}</span></div>;
}

function AccountResult({ account, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`admin-premium-result ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(account)}
      aria-pressed={selected}
    >
      <span><strong>{account.displayName || 'Akaun'}</strong><small>{account.email || 'E-mel tidak tersedia'}</small></span>
      <span><b>{account.effectiveStatus || 'free'}</b><small>{account.expiresAt ? formatMalaysiaDateTime(account.expiresAt) : 'Tiada entitlement'}</small></span>
    </button>
  );
}

function ConfirmationDialog({ command, account, submitting, onCancel, onConfirm }) {
  if (!command || !account) return null;
  return (
    <div className="admin-confirm-backdrop" role="presentation">
      <section className="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="premium-confirm-title">
        <p className="eyebrow">Pengesahan wajib</p>
        <h2 id="premium-confirm-title">Sahkan perubahan Premium</h2>
        <dl>
          <div><dt>Akaun</dt><dd>{account.email || account.accountId}</dd></div>
          <div><dt>Tindakan</dt><dd>{ACTION_LABELS[command.action]}</dd></div>
          <div><dt>Tarikh semasa</dt><dd>{account.expiresAt ? formatMalaysiaDateTime(account.expiresAt) : 'Tiada'}</dd></div>
          <div><dt>Tarikh baharu</dt><dd>{command.action === 'CANCEL_PREMIUM' ? 'Akses dibatalkan serta-merta' : formatMalaysiaDateTime(command.previewExpiry)}</dd></div>
        </dl>
        <div className="admin-confirm-actions">
          <button type="button" className="secondary" onClick={onCancel} disabled={submitting}>Kembali</button>
          <button type="button" onClick={onConfirm} disabled={submitting}>{submitting ? 'Menyimpan…' : 'Sahkan'}</button>
        </div>
      </section>
    </div>
  );
}

export default function AdminPremiumPage({ supabase, accountUser, onBack, onEntitlementChanged }) {
  const [authorization, setAuthorization] = useState('checking');
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState({ accounts: [], total: 0, pageSize: 20, pageOffset: 0, serverNow: '' });
  const [selected, setSelected] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [note, setNote] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [command, setCommand] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionRef = useRef(false);

  const refreshSummary = useCallback(async () => {
    if (!supabase || !accountUser?.id) {
      setAuthorization('denied');
      return;
    }
    try {
      const nextSummary = await loadAdminPremiumSummary(supabase);
      setSummary(nextSummary);
      setAuthorization('authorized');
    } catch (error) {
      setAuthorization('denied');
      setStatusMessage(errorMessage(error, 'Semakan akses admin gagal.'));
    }
  }, [accountUser?.id, supabase]);

  useEffect(() => { void refreshSummary(); }, [refreshSummary]);

  const runSearch = useCallback(async (offset = 0) => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setStatusMessage('Masukkan sekurang-kurangnya 2 aksara untuk mencari akaun.');
      return;
    }
    setSearching(true);
    setStatusMessage('');
    try {
      const result = await searchAdminPremiumAccounts(supabase, normalized, { pageSize: 20, pageOffset: offset });
      setSearchResult(result);
      if (!result.accounts?.length) setSelected(null);
      setStatusMessage(result.accounts?.length ? `${result.total} akaun ditemui.` : 'Tiada akaun sepadan.');
    } catch (error) {
      setStatusMessage(errorMessage(error, 'Carian akaun gagal. Cuba lagi.'));
    } finally {
      setSearching(false);
    }
  }, [query, supabase]);

  const serverNow = searchResult.serverNow || summary?.serverNow || new Date().toISOString();
  const selectedIsActive = Boolean(selected?.accessAllowed);

  const prepareAction = useCallback((action, durationDays = null) => {
    if (!selected || submissionRef.current) return;
    let expiresAt = null;
    if (action === 'SET_EXPIRY') {
      expiresAt = malaysiaEndOfDayUtc(expiryDate);
      if (!expiresAt || new Date(expiresAt).getTime() <= new Date(serverNow).getTime()) {
        setStatusMessage('Pilih tarikh tamat Malaysia yang masih akan datang.');
        return;
      }
    } else if (action !== 'CANCEL_PREMIUM') {
      expiresAt = calculateRenewalExpiry({
        expiresAt: selected.expiresAt,
        serverNow,
        days: durationDays ?? (action === 'MARK_COMPLIMENTARY' ? 365 : 30),
        accessAllowed: selectedIsActive
      });
    }
    setCommand({
      targetUserId: selected.accountId,
      action,
      durationDays,
      expiresAt: action === 'SET_EXPIRY' ? expiresAt : null,
      previewExpiry: expiresAt,
      plan: 'premium',
      source: 'admin-dashboard',
      note: note.trim(),
      requestId: createRequestId()
    });
  }, [expiryDate, note, selected, selectedIsActive, serverNow]);

  const submitAction = useCallback(async () => {
    if (!command || submissionRef.current) return;
    submissionRef.current = true;
    setSubmitting(true);
    setStatusMessage('');
    try {
      const updated = await managePremiumEntitlement(supabase, command);
      setStatusMessage(updated?.duplicate ? 'Permintaan ini telah diproses; tiada lanjutan berganda berlaku.' : 'Entitlement Premium berjaya dikemas kini dan direkodkan.');
      setCommand(null);
      await Promise.all([refreshSummary(), runSearch(searchResult.pageOffset || 0)]);
      if (selected?.accountId === accountUser?.id) await onEntitlementChanged?.();
    } catch (error) {
      setStatusMessage(errorMessage(error, 'Perubahan Premium gagal disimpan. Tiada perubahan separa dibuat.'));
    } finally {
      submissionRef.current = false;
      setSubmitting(false);
    }
  }, [accountUser?.id, command, onEntitlementChanged, refreshSummary, runSearch, searchResult.pageOffset, selected?.accountId, supabase]);

  const selectedDetails = useMemo(() => selected ? [
    ['Nama', selected.displayName || 'Akaun'],
    ['E-mel', selected.email || '—'],
    ['ID akaun', selected.accountId],
    ['Pelan', selected.plan || 'free'],
    ['Status server', selected.effectiveStatus || 'free'],
    ['Mula', formatMalaysiaDateTime(selected.startsAt)],
    ['Tamat', formatMalaysiaDateTime(selected.expiresAt)],
    ['Baki hari', String(Number(selected.daysRemaining) || 0)],
    ['Sumber', selected.source || 'none'],
    ['Kemas kini', formatMalaysiaDateTime(selected.updatedAt)]
  ] : [], [selected]);

  if (authorization === 'checking') return <main className="admin-premium-page"><div className="card"><h1>Pengurusan Premium</h1><p>Mengesahkan akses admin pada server…</p></div></main>;
  if (authorization !== 'authorized') {
    return <main className="admin-premium-page"><div className="card"><p className="eyebrow">Akses dilindungi</p><h1>Halaman admin tidak dibenarkan</h1><p>{accountUser ? 'Peranan admin mesti disahkan oleh pangkalan data.' : 'Log masuk menggunakan akaun admin untuk meneruskan.'}</p><button type="button" onClick={onBack}>Kembali</button></div></main>;
  }

  const offset = Number(searchResult.pageOffset) || 0;
  const pageSize = Number(searchResult.pageSize) || 20;
  const total = Number(searchResult.total) || 0;

  return (
    <main className="admin-premium-page">
      <header className="admin-premium-header">
        <div><p className="eyebrow">Pentadbiran selamat</p><h1>Pengurusan Premium</h1><p>Entitlement berpusat, masa server dan audit automatik.</p></div>
        <button type="button" className="secondary" onClick={onBack}>Papan Utama</button>
      </header>

      <section className="admin-premium-summary" aria-label="Ringkasan Premium">
        <SummaryCard label="Premium aktif" value={summary?.activePremium} />
        <SummaryCard label="Tamat dalam 7 hari" value={summary?.expiringIn7Days} />
        <SummaryCard label="Telah tamat" value={summary?.expired} />
        <SummaryCard label="Complimentary" value={summary?.complimentary} />
      </section>

      <section className="card admin-premium-search-panel">
        <h2>Cari akaun</h2>
        <form onSubmit={event => { event.preventDefault(); void runSearch(0); }}>
          <label htmlFor="premium-account-search">E-mel, ID akaun atau nama ibu bapa</label>
          <div className="admin-premium-search-row">
            <input id="premium-account-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="contoh@email.com" autoComplete="off" />
            <button type="submit" disabled={searching}>{searching ? 'Mencari…' : 'Cari'}</button>
          </div>
        </form>
        {statusMessage ? <p className="admin-premium-status" role="status">{statusMessage}</p> : null}
        <div className="admin-premium-results">
          {(searchResult.accounts || []).map(account => <AccountResult key={account.accountId} account={account} selected={selected?.accountId === account.accountId} onSelect={setSelected} />)}
        </div>
        {total > pageSize ? <div className="admin-premium-pagination"><button type="button" className="secondary" disabled={offset <= 0 || searching} onClick={() => void runSearch(Math.max(0, offset - pageSize))}>Sebelumnya</button><span>{offset + 1}–{Math.min(total, offset + pageSize)} daripada {total}</span><button type="button" className="secondary" disabled={offset + pageSize >= total || searching} onClick={() => void runSearch(offset + pageSize)}>Seterusnya</button></div> : null}
      </section>

      {selected ? <section className="card admin-premium-account-panel">
        <div className="admin-premium-account-heading"><div><p className="eyebrow">Akaun dipilih</p><h2>{selected.displayName || selected.email}</h2></div><button type="button" className="secondary" onClick={() => void runSearch(offset)}>Refresh / Semak Semula</button></div>
        <dl className="admin-premium-details">{selectedDetails.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <div className="admin-premium-form-grid">
          <label>Tarikh tamat (akhir hari Malaysia)<input type="date" value={expiryDate} onChange={event => setExpiryDate(event.target.value)} /></label>
          <label>Catatan audit<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={2000} placeholder="Sebab perubahan atau rujukan pembayaran" /></label>
        </div>
        <div className="admin-premium-actions" aria-label="Tindakan Premium">
          <button type="button" onClick={() => prepareAction('ACTIVATE_PREMIUM', 30)}>Aktifkan Premium</button>
          <button type="button" onClick={() => prepareAction('EXTEND_PREMIUM', 30)}>Renew / Extend Premium</button>
          <button type="button" onClick={() => prepareAction('SET_EXPIRY')}>Set Expiry Date</button>
          <button type="button" className="secondary" onClick={() => prepareAction('EXTEND_PREMIUM', 30)}>Tambah 30 Hari</button>
          <button type="button" className="secondary" onClick={() => prepareAction('EXTEND_PREMIUM', 90)}>Tambah 90 Hari</button>
          <button type="button" className="secondary" onClick={() => prepareAction('EXTEND_PREMIUM', 365)}>Tambah 365 Hari</button>
          <button type="button" className="secondary" onClick={() => prepareAction('MARK_COMPLIMENTARY', 365)}>Mark Complimentary</button>
          <button type="button" className="danger-button" onClick={() => prepareAction('CANCEL_PREMIUM')}>Cancel Premium</button>
        </div>
      </section> : null}

      <ConfirmationDialog command={command} account={selected} submitting={submitting} onCancel={() => setCommand(null)} onConfirm={() => void submitAction()} />
    </main>
  );
}
