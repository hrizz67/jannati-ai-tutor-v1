import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyAdminSubscriptionChange,
  buildAdminSubscriptionCsv,
  buildSubscriptionPreview,
  createRequestId,
  deriveAdminDisplayStatus,
  formatMalaysiaDateTime,
  loadAdminConsoleSummary,
  loadAdminCustomerDetails,
  malaysiaEndOfDayUtc,
  searchAdminCustomers
} from '../services/premiumEntitlement.js';

const ACTION_LABELS = Object.freeze({
  ACTIVATE_PREMIUM: 'Aktifkan Premium',
  EXTEND_PREMIUM: 'Perbaharui Premium',
  SET_EXPIRY: 'Tetapkan Tarikh Tamat',
  START_TRIAL: 'Mulakan Percubaan',
  MARK_COMPLIMENTARY: 'Beri Akses Complimentary',
  CANCEL_PREMIUM: 'Batalkan Premium',
  EXPIRE_PREMIUM: 'Tamatkan Sekarang'
});

const FILTERS = Object.freeze([
  ['all', 'Semua'], ['active', 'Aktif'], ['expiring_7', 'Tamat ≤7 hari'],
  ['expiring_30', 'Tamat ≤30 hari'], ['expired', 'Tamat'],
  ['trial', 'Percubaan'], ['complimentary', 'Complimentary']
]);

const STATUS_META = Object.freeze({
  active: ['✓', 'AKTIF'], expiring_soon: ['!', 'AKAN TAMAT'], expired: ['×', 'TAMAT'],
  trial: ['◷', 'PERCUBAAN'], complimentary: ['★', 'COMPLIMENTARY'],
  cancelled: ['—', 'DIBATALKAN'], free: ['○', 'FREE']
});

function errorMessage(error, fallback) {
  const code = String(error?.message || error?.code || '').toLowerCase();
  if (code.includes('admin_required') || code.includes('permission') || code.includes('row-level')) return 'Akses admin tidak dibenarkan untuk akaun ini.';
  if (code.includes('target_user_not_found')) return 'Akaun pelanggan tidak ditemui.';
  if (code.includes('future_expiry_required')) return 'Tarikh tamat mesti selepas masa server sekarang.';
  if (code.includes('payment_reference_required')) return 'Rujukan pembayaran diperlukan apabila status bayaran ialah Dibayar.';
  if (code.includes('active_entitlement_cannot_start_trial')) return 'Percubaan tidak boleh menggantikan entitlement aktif.';
  if (code.includes('permanent_complimentary_requires_expiry_change')) return 'Tukar akses complimentary kekal melalui tindakan bertarikh atau Aktifkan Premium.';
  return fallback;
}

function SummaryCard({ label, value, filter, onFilter }) {
  const content = <><strong>{Number(value) || 0}</strong><span>{label}</span></>;
  return filter
    ? <button type="button" className="admin-premium-summary-card" onClick={() => onFilter(filter)}>{content}</button>
    : <div className="admin-premium-summary-card">{content}</div>;
}

function StatusBadge({ account, serverNow }) {
  const status = deriveAdminDisplayStatus(account, serverNow);
  const [icon, label] = STATUS_META[status] || STATUS_META.free;
  return <span className={`admin-status-badge status-${status}`}><span aria-hidden="true">{icon}</span>{label}</span>;
}

function AccountResult({ account, selected, serverNow, onSelect }) {
  const childLabel = Number(account.childCount) === 1 ? '1 profil anak' : `${Number(account.childCount) || 0} profil anak`;
  const daysLabel = account.isPermanent ? 'Tanpa had' : `${Number(account.daysRemaining) || 0} hari`;
  const childNames = Array.isArray(account.children)
    ? account.children.map(child => {
      const year = String(child?.year || '').trim();
      const yearLabel = year ? (/^tahun\b/i.test(year) ? year : `Tahun ${year}`) : '';
      return [child?.name, yearLabel].filter(Boolean).join(' · ');
    }).filter(Boolean).join(', ')
    : '';
  return <button type="button" className={`admin-premium-result ${selected ? 'selected' : ''}`} onClick={() => onSelect(account)} aria-pressed={selected}>
    <span className="admin-customer-main">
      <strong>{account.displayName || 'Akaun'}</strong>
      <small>{account.email || 'E-mel tidak tersedia'}</small>
      <small>ID: {account.accountId}</small>
      <small>Daftar: {formatMalaysiaDateTime(account.createdAt)}</small>
      <small>{childLabel}{childNames ? ` · ${childNames}` : ''}</small>
    </span>
    <span className="admin-customer-subscription">
      <StatusBadge account={account} serverNow={serverNow} />
      <small>Pelan: {account.plan || 'free'} · Baki: {daysLabel}</small>
      <small>Mula: {formatMalaysiaDateTime(account.startsAt)}</small>
      <small>{account.isPermanent ? 'Tamat: tidak berkenaan (kekal)' : account.expiresAt ? `Tamat: ${formatMalaysiaDateTime(account.expiresAt)}` : 'Tiada entitlement'}</small>
      <small>Sumber: {account.source || 'none'}</small>
      <small>Renew terakhir: {formatMalaysiaDateTime(account.lastRenewalAt)}</small>
      {account.lastPaymentReference || account.lastPaymentStatus ? <small>Bayaran terakhir: {account.lastPaymentReference || 'Tiada rujukan'} · {String(account.lastPaymentStatus || 'tidak diketahui').toUpperCase()}</small> : null}
      {account.lastPaymentNote ? <small>Catatan: {account.lastPaymentNote}</small> : null}
    </span>
  </button>;
}

function DefinitionGrid({ items }) {
  return <dl className="admin-premium-details">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>;
}

function ConfirmationDialog({ command, account, acknowledged, submitting, onAcknowledge, onCancel, onConfirm }) {
  if (!command || !account) return null;
  const requiresAcknowledgement = Boolean(command.reductionWarning);
  return <div className="admin-confirm-backdrop" role="presentation"><section className="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="premium-confirm-title">
    <p className="eyebrow">Pengesahan wajib</p><h2 id="premium-confirm-title">Sahkan perubahan langganan</h2>
    {requiresAcknowledgement ? <p className="admin-danger-warning" role="alert">Amaran: tindakan ini akan mengurangkan atau menamatkan tempoh Premium pelanggan.</p> : null}
    <dl>
      <div><dt>Pelanggan</dt><dd>{account.email || account.accountId}</dd></div>
      <div><dt>Tindakan</dt><dd>{ACTION_LABELS[command.action]}</dd></div>
      <div><dt>Tarikh semasa</dt><dd>{account.isPermanent ? 'Complimentary kekal' : account.expiresAt ? formatMalaysiaDateTime(account.expiresAt) : 'Tiada'}</dd></div>
      <div><dt>Tambahan</dt><dd>{command.durationDays ? `${command.durationDays} hari` : 'Tarikh/status khusus'}</dd></div>
      <div><dt>Tarikh baharu</dt><dd>{command.permanentComplimentary ? 'Kekal (tanpa tarikh tamat)' : command.action === 'CANCEL_PREMIUM' ? 'Dibatalkan serta-merta' : command.action === 'EXPIRE_PREMIUM' ? 'Tamat sekarang' : formatMalaysiaDateTime(command.previewExpiry)}</dd></div>
      {command.paymentStatus ? <div><dt>Pembayaran</dt><dd>{command.paymentStatus === 'paid' ? `RM ${Number(command.paymentAmount || 0).toFixed(2)}` : command.paymentStatus.toUpperCase()}</dd></div> : null}
      {command.paymentReference ? <div><dt>Rujukan</dt><dd>{command.paymentReference}</dd></div> : null}
      <div><dt>Zon masa</dt><dd>Asia/Kuala_Lumpur</dd></div>
    </dl>
    {requiresAcknowledgement ? <label className="admin-confirm-checkbox"><input type="checkbox" checked={acknowledged} onChange={event => onAcknowledge(event.target.checked)} />Saya faham tindakan ini mengurangkan akses sedia ada.</label> : null}
    <div className="admin-confirm-actions"><button type="button" className="secondary" onClick={onCancel} disabled={submitting}>Kembali</button><button type="button" onClick={onConfirm} disabled={submitting || (requiresAcknowledgement && !acknowledged)}>{submitting ? 'Menyimpan…' : 'Sahkan Perubahan'}</button></div>
  </section></div>;
}

function PaymentHistory({ payments = [] }) {
  if (!payments.length) return <p className="admin-empty-copy">Belum ada rekod pembayaran atau pembaharuan.</p>;
  return <div className="admin-history-list">{payments.map(payment => <article key={payment.id} className="admin-history-item"><div><strong>{ACTION_LABELS[payment.action] || payment.action}</strong><small>{formatMalaysiaDateTime(payment.createdAt)}</small></div><div><b>{payment.paymentStatus === 'paid' ? `${payment.currency} ${Number(payment.amount || 0).toFixed(2)}` : String(payment.paymentStatus || '').toUpperCase()}</b><small>{payment.paymentReference || 'Tiada rujukan'}</small></div></article>)}</div>;
}

function AuditHistory({ events = [] }) {
  if (!events.length) return <p className="admin-empty-copy">Belum ada perubahan pentadbiran.</p>;
  return <div className="admin-history-list">{events.map(event => <article key={event.id} className="admin-history-item"><div><strong>{ACTION_LABELS[event.action] || event.action}</strong><small>{event.reason || 'Tiada catatan'}</small></div><div><b>{event.oldStatus} → {event.newStatus}</b><small>{formatMalaysiaDateTime(event.createdAt)}</small></div></article>)}</div>;
}

export default function AdminPremiumPage({ supabase, accountUser, onBack, onEntitlementChanged }) {
  const [authorization, setAuthorization] = useState('checking');
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchResult, setSearchResult] = useState({ accounts: [], total: 0, pageSize: 20, pageOffset: 0, serverNow: '' });
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [note, setNote] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('duitnow');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [statusMessage, setStatusMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [command, setCommand] = useState(null);
  const [dangerAcknowledged, setDangerAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submissionRef = useRef(false);

  const refreshSummary = useCallback(async () => {
    if (!supabase || !accountUser?.id) { setAuthorization('denied'); return; }
    try { setSummary(await loadAdminConsoleSummary(supabase)); setAuthorization('authorized'); }
    catch (error) { setAuthorization('denied'); setStatusMessage(errorMessage(error, 'Semakan akses admin gagal.')); }
  }, [accountUser?.id, supabase]);

  const runSearch = useCallback(async (offset = 0, nextFilter = filter) => {
    setSearching(true); setStatusMessage('');
    try {
      const result = await searchAdminCustomers(supabase, query, { statusFilter: nextFilter, pageSize: 20, pageOffset: offset });
      setSearchResult(result);
      setStatusMessage(result.accounts?.length ? `${result.total} akaun ditemui.` : 'Tiada akaun sepadan.');
      if (selected && !result.accounts?.some(account => account.accountId === selected.accountId)) { setSelected(null); setDetails(null); }
    } catch (error) { setStatusMessage(errorMessage(error, 'Carian akaun gagal. Cuba lagi.')); }
    finally { setSearching(false); }
  }, [filter, query, selected, supabase]);

  const refreshDetails = useCallback(async accountId => {
    if (!accountId) return;
    setLoadingDetails(true);
    try {
      const nextDetails = await loadAdminCustomerDetails(supabase, accountId);
      setDetails(nextDetails);
      setSelected(current => current?.accountId === accountId ? { ...current, ...(nextDetails?.subscription || {}) } : current);
    } catch (error) { setStatusMessage(errorMessage(error, 'Butiran pelanggan gagal dimuatkan.')); }
    finally { setLoadingDetails(false); }
  }, [supabase]);

  useEffect(() => { void refreshSummary(); }, [refreshSummary]);
  useEffect(() => { if (authorization === 'authorized') void runSearch(0, filter); }, [authorization, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const serverNow = details?.serverNow || searchResult.serverNow || summary?.serverNow || new Date().toISOString();
  const activeAccount = useMemo(() => ({ ...selected, ...(details?.subscription || {}) }), [details?.subscription, selected]);
  const chooseAccount = useCallback(account => { setSelected(account); setDetails(null); void refreshDetails(account.accountId); }, [refreshDetails]);

  const prepareAction = useCallback((action, durationDays = null, options = {}) => {
    if (!activeAccount?.accountId || submissionRef.current) return;
    let expiresAt = null;
    if (action === 'SET_EXPIRY' || options.customTrial || options.customComplimentary) {
      expiresAt = malaysiaEndOfDayUtc(expiryDate);
      if (!expiresAt || new Date(expiresAt).getTime() <= new Date(serverNow).getTime()) { setStatusMessage('Pilih tarikh tamat Malaysia yang masih akan datang.'); return; }
    }
    const billable = ['ACTIVATE_PREMIUM', 'EXTEND_PREMIUM', 'SET_EXPIRY'].includes(action);
    if (billable && paymentStatus === 'paid' && (paymentAmount === '' || !Number.isFinite(Number(paymentAmount)) || Number(paymentAmount) < 0)) { setStatusMessage('Masukkan jumlah pembayaran yang sah.'); return; }
    if (billable && paymentStatus === 'paid' && !paymentReference.trim()) { setStatusMessage('Masukkan rujukan pembayaran, atau pilih status Pending/Waived.'); return; }
    const baseCommand = {
      targetUserId: activeAccount.accountId, action, durationDays, expiresAt,
      permanentComplimentary: Boolean(options.permanentComplimentary),
      plan: action === 'START_TRIAL' ? 'premium_trial' : action === 'MARK_COMPLIMENTARY' ? 'premium_complimentary' : 'premium',
      source: 'admin-console-v2', note: note.trim(), paymentAmount: billable ? paymentAmount : 0,
      paymentCurrency: 'MYR', paymentMethod: billable ? paymentMethod : action === 'MARK_COMPLIMENTARY' ? 'complimentary' : 'promotion',
      paymentReference: billable ? paymentReference.trim() : '', paymentStatus: billable ? paymentStatus : 'waived', requestId: createRequestId()
    };
    setDangerAcknowledged(false);
    setCommand(buildSubscriptionPreview(activeAccount, baseCommand, serverNow));
  }, [activeAccount, expiryDate, note, paymentAmount, paymentMethod, paymentReference, paymentStatus, serverNow]);

  const submitAction = useCallback(async () => {
    if (!command || submissionRef.current) return;
    submissionRef.current = true; setSubmitting(true); setStatusMessage('');
    try {
      const updated = await applyAdminSubscriptionChange(supabase, command);
      setStatusMessage(updated?.duplicate ? 'Permintaan ini telah diproses; tiada perubahan berganda.' : 'Langganan, rekod bayaran dan audit berjaya dikemas kini secara atomik.');
      setCommand(null); setDangerAcknowledged(false);
      await Promise.all([refreshSummary(), runSearch(searchResult.pageOffset || 0, filter), refreshDetails(activeAccount.accountId)]);
      if (activeAccount.accountId === accountUser?.id) await onEntitlementChanged?.();
    } catch (error) { setStatusMessage(errorMessage(error, 'Perubahan gagal. Tiada rekod separa disimpan.')); }
    finally { submissionRef.current = false; setSubmitting(false); }
  }, [accountUser?.id, activeAccount?.accountId, command, filter, onEntitlementChanged, refreshDetails, refreshSummary, runSearch, searchResult.pageOffset, supabase]);

  const copyEmail = useCallback(async () => {
    if (!activeAccount?.email) return;
    try { await navigator.clipboard.writeText(activeAccount.email); setStatusMessage('E-mel pelanggan telah disalin.'); }
    catch { setStatusMessage(`Salin e-mel ini: ${activeAccount.email}`); }
  }, [activeAccount?.email]);

  const exportCsv = useCallback(() => {
    const blob = new Blob([buildAdminSubscriptionCsv(searchResult.accounts)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `jannati-subscriptions-${filter}.csv`; link.click(); URL.revokeObjectURL(url);
  }, [filter, searchResult.accounts]);

  if (authorization === 'checking') return <main className="admin-premium-page"><div className="card"><h1>Konsol Admin Jannati</h1><p>Mengesahkan peranan admin pada server…</p></div></main>;
  if (authorization !== 'authorized') return <main className="admin-premium-page"><div className="card"><p className="eyebrow">Akses dilindungi</p><h1>Akses tidak dibenarkan</h1><p>{accountUser ? 'Peranan admin mesti disahkan oleh pangkalan data.' : 'Log masuk menggunakan akaun admin untuk meneruskan.'}</p><button type="button" onClick={onBack}>Kembali</button></div></main>;

  const offset = Number(searchResult.pageOffset) || 0;
  const pageSize = Number(searchResult.pageSize) || 20;
  const total = Number(searchResult.total) || 0;
  const overview = details?.overview || {};
  const subscription = details?.subscription || activeAccount || {};

  return <main className="admin-premium-page">
    <header className="admin-premium-header"><div><p className="eyebrow">Operasi dalaman · server-authorized</p><h1>Konsol Admin Jannati</h1><p>Pelanggan, langganan, percubaan, bayaran dan audit dalam satu tempat.</p></div><button type="button" className="secondary" onClick={onBack}>Papan Utama</button></header>

    <section className="admin-premium-summary" aria-label="Ringkasan akaun dan langganan">
      <SummaryCard label="Jumlah Akaun" value={summary?.totalAccounts} />
      <SummaryCard label="Premium Aktif" value={summary?.activePremium} filter="active" onFilter={setFilter} />
      <SummaryCard label="Tamat ≤7 Hari" value={summary?.expiringIn7Days} filter="expiring_7" onFilter={setFilter} />
      <SummaryCard label="Tamat ≤30 Hari" value={summary?.expiringIn30Days} filter="expiring_30" onFilter={setFilter} />
      <SummaryCard label="Telah Tamat" value={summary?.expired} filter="expired" onFilter={setFilter} />
      <SummaryCard label="Percubaan" value={summary?.trialAccounts} filter="trial" onFilter={setFilter} />
      <SummaryCard label="Complimentary" value={summary?.complimentaryAccounts} filter="complimentary" onFilter={setFilter} />
    </section>

    <section className="card admin-premium-search-panel">
      <div className="admin-section-heading"><div><p className="eyebrow">Pengurusan pelanggan</p><h2>Cari dan tapis akaun</h2></div><button type="button" className="secondary" disabled={!searchResult.accounts?.length} onClick={exportCsv}>Eksport CSV Paparan</button></div>
      <form onSubmit={event => { event.preventDefault(); void runSearch(0, filter); }}><label htmlFor="premium-account-search">E-mel, nama ibu bapa, ID akaun atau nama anak</label><div className="admin-premium-search-row"><input id="premium-account-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari pelanggan…" autoComplete="off" /><button type="submit" disabled={searching}>{searching ? 'Mencari…' : 'Cari'}</button></div></form>
      <div className="admin-filter-row" aria-label="Tapis status">{FILTERS.map(([value, label]) => <button type="button" key={value} className={filter === value ? 'active' : 'secondary'} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      {statusMessage ? <p className="admin-premium-status" role="status">{statusMessage}</p> : null}
      <div className="admin-premium-results">{(searchResult.accounts || []).map(account => <AccountResult key={account.accountId} account={account} selected={selected?.accountId === account.accountId} serverNow={serverNow} onSelect={chooseAccount} />)}</div>
      {total > pageSize ? <div className="admin-premium-pagination"><button type="button" className="secondary" disabled={offset <= 0 || searching} onClick={() => void runSearch(Math.max(0, offset - pageSize), filter)}>Sebelumnya</button><span>{offset + 1}–{Math.min(total, offset + pageSize)} daripada {total}</span><button type="button" className="secondary" disabled={offset + pageSize >= total || searching} onClick={() => void runSearch(offset + pageSize, filter)}>Seterusnya</button></div> : null}
    </section>

    {selected ? <section className="card admin-premium-account-panel" aria-busy={loadingDetails}>
      <div className="admin-premium-account-heading"><div><p className="eyebrow">Butiran pelanggan</p><h2>{overview.displayName || selected.displayName || selected.email}</h2><p>{overview.email || selected.email}</p></div><div className="admin-heading-actions"><button type="button" className="secondary" onClick={copyEmail}>Salin E-mel</button><button type="button" className="secondary" onClick={() => void refreshDetails(selected.accountId)}>Muat Semula</button></div></div>
      <section className="admin-detail-section"><h3>Ringkasan Akaun</h3><DefinitionGrid items={[
        ['Nama ibu bapa', overview.displayName || selected.displayName], ['E-mel', overview.email || selected.email], ['ID akaun', selected.accountId], ['Tarikh daftar', formatMalaysiaDateTime(overview.createdAt || selected.createdAt)], ['Bilangan anak', String(overview.childCount ?? selected.childCount ?? 0)], ['Log masuk terakhir', formatMalaysiaDateTime(overview.lastSignInAt)]
      ]} /></section>
      <section className="admin-detail-section"><div className="admin-section-heading"><h3>Langganan</h3><StatusBadge account={subscription} serverNow={serverNow} /></div><DefinitionGrid items={[
        ['Pelan', subscription.plan || 'free'], ['Status server', subscription.effectiveStatus || 'free'], ['Mula', formatMalaysiaDateTime(subscription.startsAt)], ['Tamat', subscription.isPermanent ? 'Kekal · tiada tarikh tamat' : formatMalaysiaDateTime(subscription.expiresAt)], ['Baki hari', subscription.isPermanent ? 'Tanpa had' : String(subscription.daysRemaining ?? selected.daysRemaining ?? 0)], ['Sumber', subscription.source || 'none'], ['Pembaharuan terakhir', formatMalaysiaDateTime(selected.lastRenewalAt)], ['Catatan admin', subscription.notes || '—']
      ]} /></section>
      <section className="admin-detail-section"><h3>Bayaran dan Catatan Dalaman</h3><div className="admin-premium-form-grid">
        <label>Jumlah (RM)<input type="number" min="0" step="0.01" value={paymentAmount} onChange={event => setPaymentAmount(event.target.value)} placeholder="0.00" /></label>
        <label>Kaedah<select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}><option value="duitnow">DuitNow</option><option value="bank_transfer">Pindahan bank</option><option value="cash">Tunai</option><option value="manual">Manual</option><option value="promotion">Promosi</option><option value="other">Lain-lain</option></select></label>
        <label>Status bayaran<select value={paymentStatus} onChange={event => setPaymentStatus(event.target.value)}><option value="paid">Dibayar</option><option value="pending">Pending</option><option value="waived">Dikecualikan</option></select></label>
        <label>Rujukan pembayaran<input value={paymentReference} onChange={event => setPaymentReference(event.target.value)} maxLength={200} placeholder="Contoh: DN-20260906-001" /></label>
        <label className="admin-note-field">Catatan admin<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={2000} placeholder="Catatan dalaman; tidak dipaparkan kepada pelanggan atau anak" /></label>
        <label>Tarikh khusus Malaysia<input type="date" value={expiryDate} onChange={event => setExpiryDate(event.target.value)} /><small>Akan tamat pada 11:59:59 malam Asia/Kuala_Lumpur.</small></label>
      </div></section>
      <section className="admin-detail-section"><h3>Tindakan Premium</h3><div className="admin-premium-actions"><button type="button" onClick={() => prepareAction('ACTIVATE_PREMIUM', 30)}>Aktifkan Premium</button>{[30, 90, 365].map(days => <button type="button" key={days} disabled={Boolean(subscription.isPermanent)} title={subscription.isPermanent ? 'Gunakan Aktifkan Premium atau tarikh khusus untuk menukar complimentary kekal.' : undefined} onClick={() => prepareAction('EXTEND_PREMIUM', days)}>Renew {days} Hari</button>)}<button type="button" className="secondary" onClick={() => prepareAction('SET_EXPIRY')}>Tarikh Tamat Khusus</button></div></section>
      <section className="admin-detail-section"><h3>Percubaan</h3><p className="admin-section-copy">Percubaan tamat secara automatik berdasarkan masa server.</p><div className="admin-premium-actions">{[3, 7, 14].map(days => <button type="button" className="secondary" key={days} disabled={Boolean(subscription.accessAllowed)} onClick={() => prepareAction('START_TRIAL', days)}>Trial {days} Hari</button>)}<button type="button" className="secondary" disabled={Boolean(subscription.accessAllowed)} onClick={() => prepareAction('START_TRIAL', null, { customTrial: true })}>Trial Tarikh Khusus</button></div></section>
      <section className="admin-detail-section"><h3>Complimentary</h3><p className="admin-section-copy">Akses kekal mesti dipilih secara jelas; sistem tidak menggunakan tarikh tahun palsu.</p><div className="admin-premium-actions"><button type="button" className="secondary" onClick={() => prepareAction('MARK_COMPLIMENTARY', 30)}>Complimentary 30 Hari</button><button type="button" className="secondary" onClick={() => prepareAction('MARK_COMPLIMENTARY', null, { customComplimentary: true })}>Complimentary Tarikh Khusus</button><button type="button" className="secondary" onClick={() => prepareAction('MARK_COMPLIMENTARY', null, { permanentComplimentary: true })}>Complimentary Kekal</button></div></section>
      <section className="admin-detail-section admin-danger-zone"><h3>Zon Tindakan Berbahaya</h3><div className="admin-premium-actions"><button type="button" className="danger-button" onClick={() => prepareAction('CANCEL_PREMIUM')}>Batalkan Premium</button><button type="button" className="danger-button" onClick={() => prepareAction('EXPIRE_PREMIUM')}>Tamatkan Sekarang</button></div></section>
      <section className="admin-detail-section"><h3>Profil Anak</h3>{details?.children?.length ? <div className="admin-children-grid">{details.children.map(child => <article key={child.id}><strong>{child.name}</strong><span>{child.year}</span></article>)}</div> : <p className="admin-empty-copy">Tiada profil anak aktif.</p>}</section>
      <section className="admin-detail-section"><h3>Sejarah Pembayaran / Pembaharuan</h3><PaymentHistory payments={details?.payments} /></section>
      <section className="admin-detail-section"><h3>Audit Perubahan</h3><AuditHistory events={details?.auditHistory} /></section>
    </section> : null}
    <ConfirmationDialog command={command} account={activeAccount} acknowledged={dangerAcknowledged} submitting={submitting} onAcknowledge={setDangerAcknowledged} onCancel={() => { setCommand(null); setDangerAcknowledged(false); }} onConfirm={() => void submitAction()} />
  </main>;
}
