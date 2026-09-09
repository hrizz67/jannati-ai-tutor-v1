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
  searchAdminCustomers,
  verifyAdminSubscriptionRequest
} from '../services/premiumEntitlement.js';
import {
  ADMIN_MUTATION_STATES,
  canReenterSubscriptionOperation,
  canRetrySubscriptionOperation,
  clearPendingSubscriptionOperation,
  createPendingSubscriptionOperation,
  getAdminRecoveryStorage,
  loadPendingSubscriptionOperation,
  reconcileSubscriptionOperation,
  savePendingSubscriptionOperation,
  shortAdminRequestId,
  verifySubscriptionOperation,
  withAdminRequestTimeout
} from '../services/adminSubscriptionRecovery.js';

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
  if (code.includes('admin_subscription_timeout')) return 'Pelayan mengambil masa terlalu lama. Status pembaharuan sedang disemak.';
  if (code.includes('failed to fetch') || code.includes('network') || code.includes('connection')) return 'Sambungan ke pangkalan data terganggu.';
  if (code.includes('42883') || code.includes('could not find the function')) return 'Operasi langganan belum tersedia pada pangkalan data. Semak migration Admin Console V2.';
  if (code.includes('admin_required') || code.includes('permission') || code.includes('row-level')) return 'Akses admin tidak dibenarkan untuk akaun ini.';
  if (code.includes('target_user_not_found')) return 'Akaun pelanggan tidak ditemui.';
  if (code.includes('future_expiry_required')) return 'Tarikh tamat mesti selepas masa server sekarang.';
  if (code.includes('payment_reference_required')) return 'Rujukan pembayaran diperlukan apabila status bayaran ialah Dibayar.';
  if (code.includes('active_entitlement_cannot_start_trial')) return 'Percubaan tidak boleh menggantikan entitlement aktif.';
  if (code.includes('permanent_complimentary_requires_expiry_change')) return 'Tukar akses complimentary kekal melalui tindakan bertarikh atau Aktifkan Premium.';
  return fallback;
}

function recoveryCauseMessage(mutation = {}) {
  const type = mutation.errorType || mutation.verificationErrorType;
  return {
    timeout: 'Punca: pelayan melepasi had menunggu UI. Permintaan tulis dibiarkan selesai dan disemak menggunakan ID yang sama.',
    network_offline: 'Punca: peranti berada di luar talian ketika permintaan dihantar.',
    network_connection: 'Punca: sambungan ke Supabase terputus atau tidak stabil.',
    rpc_missing: 'Punca: RPC pembaharuan tidak tersedia pada database produksi.',
    admin_unauthorized: 'Punca: server tidak mengesahkan peranan admin bagi sesi ini.',
    database_validation: 'Punca: butiran pembaharuan ditolak oleh validasi server.',
    database_transaction: 'Punca: transaksi database gagal sebelum disahkan.',
    ambiguous_result: 'Punca: jawapan server tidak lengkap atau tidak sepadan dengan permintaan asal.',
    unknown: 'Punca asal belum dapat dikenal pasti daripada jawapan rangkaian.'
  }[type] || '';
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

function ConfirmationDialog({ command, account, acknowledged, mutationState, onAcknowledge, onCancel, onConfirm }) {
  if (!command || !account) return null;
  const requiresAcknowledgement = Boolean(command.reductionWarning);
  const busy = [ADMIN_MUTATION_STATES.SUBMITTING, ADMIN_MUTATION_STATES.VERIFYING].includes(mutationState);
  const confirmLabel = mutationState === ADMIN_MUTATION_STATES.VERIFYING ? 'Menyemak status…' : busy ? 'Menyimpan…' : 'Sahkan Perubahan';
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
    <div className="admin-confirm-actions"><button type="button" className="secondary" onClick={onCancel} disabled={busy}>Kembali</button><button type="button" onClick={onConfirm} disabled={busy || (requiresAcknowledgement && !acknowledged)}>{confirmLabel}</button></div>
  </section></div>;
}

function RecoveryPanel({ mutation, pending, retryAvailable, onVerify, onRetry, onClose }) {
  const operation = mutation?.operation || pending;
  if (!operation) return null;
  const state = mutation?.state || ADMIN_MUTATION_STATES.UNCERTAIN;
  if ([ADMIN_MUTATION_STATES.IDLE, ADMIN_MUTATION_STATES.CONFIRMING].includes(state)) return null;
  const busy = state === ADMIN_MUTATION_STATES.VERIFYING || state === ADMIN_MUTATION_STATES.SUBMITTING;
  const meta = {
    [ADMIN_MUTATION_STATES.SUBMITTING]: ['Permintaan sedang dihantar', 'Jangan hantar semula. Sistem sedang menunggu jawapan server.'],
    [ADMIN_MUTATION_STATES.VERIFYING]: ['Menyemak status transaksi', 'Sistem sedang menyemak rekod audit dan pembayaran menggunakan ID permintaan yang sama.'],
    [ADMIN_MUTATION_STATES.SUCCESS]: ['Transaksi disahkan berjaya', 'Rekod audit server membuktikan perubahan telah disimpan.'],
    [ADMIN_MUTATION_STATES.FAILED]: ['Transaksi gagal', 'Server mengembalikan kegagalan yang diketahui; transaksi separa tidak dianggap berjaya.'],
    [ADMIN_MUTATION_STATES.NOT_EXECUTED]: ['Transaksi belum direkodkan', retryAvailable ? 'ID ini belum direkodkan selepas semakan berulang. Cuba semula menggunakan ID yang sama.' : `Masukkan semula jumlah dan rujukan bayaran, kemudian pilih ${ACTION_LABELS[operation.action] || 'tindakan asal'}${operation.durationDays ? ` ${operation.durationDays} hari` : ''}. Sistem akan menggunakan ID permintaan asal.`],
    [ADMIN_MUTATION_STATES.UNCERTAIN]: ['Status transaksi belum dapat dipastikan', 'Jangan ulang pembaharuan. Semak status transaksi apabila sambungan kembali stabil.']
  }[state] || ['Pemulihan transaksi', 'Semak status transaksi sebelum melakukan tindakan lain.'];
  const verification = mutation?.verification;
  const checkedAt = verification?.serverNow || mutation?.checkedAt;
  const cause = recoveryCauseMessage(mutation);
  return <aside className={`admin-recovery-panel state-${state}`} role="status" aria-live="polite">
    <div><p className="eyebrow">Pemulihan transaksi</p><h3>{meta[0]}</h3><p>{meta[1]}</p>{cause ? <p className="admin-recovery-cause">{cause}</p> : null}</div>
    <dl>
      <div><dt>ID permintaan</dt><dd title={operation.requestId}>{shortAdminRequestId(operation.requestId)}</dd></div>
      <div><dt>Tindakan</dt><dd>{ACTION_LABELS[operation.action] || operation.action}{operation.durationDays ? ` · ${operation.durationDays} hari` : ''}</dd></div>
      <div><dt>Akaun</dt><dd>{operation.accountId || operation.targetUserId}</dd></div>
      <div><dt>Dimulakan</dt><dd>{formatMalaysiaDateTime(operation.startedAt)}</dd></div>
      <div><dt>Keadaan semasa</dt><dd>{state.replaceAll('_', ' ')}</dd></div>
      <div><dt>Semakan terakhir</dt><dd>{formatMalaysiaDateTime(checkedAt)}</dd></div>
      <div><dt>Keputusan</dt><dd>{verification?.status || state}</dd></div>
      {mutation?.attempts ? <div><dt>Semakan server</dt><dd>{mutation.attempts} percubaan</dd></div> : null}
      {verification?.newExpiry ? <div><dt>Tarikh server</dt><dd>{formatMalaysiaDateTime(verification.newExpiry)}</dd></div> : null}
    </dl>
    <div className="admin-recovery-actions">
      <button type="button" onClick={onVerify} disabled={busy}>{busy ? 'Menyemak…' : 'Semak Status Transaksi'}</button>
      {retryAvailable ? <button type="button" className="secondary" onClick={onRetry} disabled={busy}>Cuba Lagi (ID Sama)</button> : null}
      <button type="button" className="secondary" onClick={onClose} disabled={busy}>Tutup</button>
    </div>
  </aside>;
}

function PaymentHistory({ payments = [] }) {
  if (!payments.length) return <p className="admin-empty-copy">Belum ada rekod pembayaran atau pembaharuan.</p>;
  return <div className="admin-history-list">{payments.map(payment => <article key={payment.id} className="admin-history-item"><div><strong>{ACTION_LABELS[payment.action] || payment.action}</strong><small>{formatMalaysiaDateTime(payment.createdAt)} · {payment.paymentMethod || 'manual'}</small><small>ID: {shortAdminRequestId(payment.requestId)}</small></div><div><b>{payment.paymentStatus === 'paid' ? `${payment.currency} ${Number(payment.amount || 0).toFixed(2)}` : String(payment.paymentStatus || '').toUpperCase()}</b><small>{payment.paymentReference || 'Tiada rujukan'}</small><small>{formatMalaysiaDateTime(payment.previousExpiry)} → {formatMalaysiaDateTime(payment.newExpiry)}</small></div></article>)}</div>;
}

function AuditHistory({ events = [] }) {
  if (!events.length) return <p className="admin-empty-copy">Belum ada perubahan pentadbiran.</p>;
  return <div className="admin-history-list">{events.map(event => <article key={event.id} className="admin-history-item"><div><strong>{ACTION_LABELS[event.action] || event.action}</strong><small>{event.reason || 'Tiada catatan'}</small><small>ID: {shortAdminRequestId(event.requestId)}</small></div><div><b>{event.oldStatus} → {event.newStatus}</b><small>{formatMalaysiaDateTime(event.createdAt)}</small><small>{formatMalaysiaDateTime(event.oldExpiry)} → {formatMalaysiaDateTime(event.newExpiry)}</small></div></article>)}</div>;
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
  const [mutation, setMutation] = useState({ state: ADMIN_MUTATION_STATES.IDLE });
  const [pendingOperation, setPendingOperation] = useState(null);
  const [recoveryHidden, setRecoveryHidden] = useState(false);
  const submissionRef = useRef(false);
  const mountedRef = useRef(true);
  const currentRequestRef = useRef('');
  const restoredAutoCheckRef = useRef('');
  const selectedAccountRef = useRef('');
  const detailsRequestRef = useRef(0);
  const searchRequestRef = useRef(0);

  const refreshSummary = useCallback(async () => {
    if (!supabase || !accountUser?.id) { setAuthorization('denied'); return; }
    try {
      const nextSummary = await withAdminRequestTimeout(signal => loadAdminConsoleSummary(supabase, { signal }));
      if (mountedRef.current) { setSummary(nextSummary); setAuthorization('authorized'); }
    } catch (error) {
      if (!mountedRef.current) return;
      const denied = /admin_required|not_authenticated|permission|row-level/i.test(String(error?.message || ''));
      setAuthorization(current => denied ? 'denied' : current === 'authorized' ? current : 'error');
      setStatusMessage(errorMessage(error, 'Semakan akses admin gagal. Cuba semula.'));
    }
  }, [accountUser?.id, supabase]);

  const runSearch = useCallback(async (offset = 0, nextFilter = filter) => {
    const searchId = ++searchRequestRef.current;
    setSearching(true); setStatusMessage('');
    try {
      const result = await withAdminRequestTimeout(signal => searchAdminCustomers(supabase, query, { statusFilter: nextFilter, pageSize: 20, pageOffset: offset, signal }));
      if (!mountedRef.current || searchId !== searchRequestRef.current) return;
      setSearchResult(result);
      setStatusMessage(result.accounts?.length ? `${result.total} akaun ditemui.` : 'Tiada akaun sepadan.');
      if (selected && selectedAccountRef.current === selected.accountId && !result.accounts?.some(account => account.accountId === selected.accountId)) { selectedAccountRef.current = ''; setSelected(null); setDetails(null); setLoadingDetails(false); }
    } catch (error) { if (mountedRef.current && searchId === searchRequestRef.current) setStatusMessage(errorMessage(error, 'Carian akaun gagal. Cuba lagi.')); }
    finally { if (mountedRef.current && searchId === searchRequestRef.current) setSearching(false); }
  }, [filter, query, selected, supabase]);

  const refreshDetails = useCallback(async accountId => {
    if (!accountId || selectedAccountRef.current !== accountId) return;
    const detailsId = ++detailsRequestRef.current;
    const isCurrent = () => mountedRef.current && selectedAccountRef.current === accountId && detailsId === detailsRequestRef.current;
    setLoadingDetails(true);
    try {
      const nextDetails = await withAdminRequestTimeout(signal => loadAdminCustomerDetails(supabase, accountId, { signal }));
      if (!isCurrent()) return;
      setDetails(nextDetails);
      setSelected(current => current?.accountId === accountId ? { ...current, ...(nextDetails?.subscription || {}) } : current);
    } catch (error) { if (isCurrent()) setStatusMessage(errorMessage(error, 'Butiran pelanggan gagal dimuatkan.')); }
    finally { if (isCurrent()) setLoadingDetails(false); }
  }, [supabase]);

  useEffect(() => { void refreshSummary(); }, [refreshSummary]);
  useEffect(() => { if (authorization === 'authorized') void runSearch(0, filter); }, [authorization, filter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    mountedRef.current = true;
    const restored = loadPendingSubscriptionOperation(getAdminRecoveryStorage());
    if (restored) {
      setPendingOperation(restored);
      setRecoveryHidden(false);
      setMutation({ state: ADMIN_MUTATION_STATES.UNCERTAIN, operation: restored, restored: true });
    }
    return () => { mountedRef.current = false; currentRequestRef.current = ''; };
  }, []);

  const serverNow = details?.serverNow || searchResult.serverNow || summary?.serverNow || new Date().toISOString();
  const activeAccount = useMemo(() => ({ ...selected, ...(details?.subscription || {}) }), [details?.subscription, selected]);
  const chooseAccount = useCallback(account => { selectedAccountRef.current = account.accountId; setSelected(account); setDetails(null); void refreshDetails(account.accountId); }, [refreshDetails]);

  const prepareAction = useCallback((action, durationDays = null, options = {}) => {
    if (!activeAccount?.accountId || submissionRef.current) return;
    const reenterPending = canReenterSubscriptionOperation(mutation, pendingOperation, activeAccount.accountId, action);
    if (pendingOperation?.requestId && !reenterPending) { setRecoveryHidden(false); setStatusMessage('Selesaikan semakan transaksi terdahulu sebelum membuat perubahan baharu.'); return; }
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
      paymentReference: billable ? paymentReference.trim() : '', paymentStatus: billable ? paymentStatus : 'waived', requestId: reenterPending ? pendingOperation.requestId : createRequestId()
    };
    setDangerAcknowledged(false);
    setRecoveryHidden(false);
    const prepared = buildSubscriptionPreview(activeAccount, baseCommand, serverNow);
    setCommand(prepared);
    setMutation({ state: ADMIN_MUTATION_STATES.CONFIRMING, operation: createPendingSubscriptionOperation(prepared) });
  }, [activeAccount, expiryDate, mutation, note, paymentAmount, paymentMethod, paymentReference, paymentStatus, pendingOperation, serverNow]);

  const refreshAuthoritativeViews = useCallback(async accountId => {
    await Promise.allSettled([
      refreshSummary(),
      runSearch(searchResult.pageOffset || 0, filter),
      refreshDetails(accountId),
      accountId === accountUser?.id ? withAdminRequestTimeout(() => onEntitlementChanged?.()) : Promise.resolve()
    ]);
  }, [accountUser?.id, filter, onEntitlementChanged, refreshDetails, refreshSummary, runSearch, searchResult.pageOffset]);

  const finishMutation = useCallback(async result => {
    if (!mountedRef.current || currentRequestRef.current !== result?.operation?.requestId) return;
    const requestId = result.operation.requestId;
    const verifiedAccountId = result.verification?.accountId;
    if (result.state === ADMIN_MUTATION_STATES.SUCCESS && verifiedAccountId && verifiedAccountId !== result.operation.accountId) {
      setMutation({ ...result, state: ADMIN_MUTATION_STATES.UNCERTAIN, mismatch: true });
      setStatusMessage('Amaran: akaun transaksi tidak sepadan. Jangan ulang tindakan; semak audit server.');
      return;
    }

    setMutation(result);
    if (result.state === ADMIN_MUTATION_STATES.SUCCESS) {
      clearPendingSubscriptionOperation(getAdminRecoveryStorage(), requestId);
      setPendingOperation(null);
      setCommand(null);
      setDangerAcknowledged(false);
      const expiry = result.verification?.newExpiry || result.data?.newExpiry || result.data?.expiresAt;
      const successMessage = `${result.idempotentReplay || result.data?.duplicate ? 'Transaksi idempoten telah disahkan' : 'Transaksi berjaya disahkan oleh server'}.${expiry ? ` Tarikh tamat: ${formatMalaysiaDateTime(expiry)}.` : ''}`;
      setStatusMessage(successMessage);
      // Refresh failures must not hold the mutation lock after confirmed success.
      void refreshAuthoritativeViews(result.operation.accountId);
    } else if (result.state === ADMIN_MUTATION_STATES.FAILED) {
      clearPendingSubscriptionOperation(getAdminRecoveryStorage(), requestId);
      setPendingOperation(null);
      setCommand(null);
      setStatusMessage(errorMessage(result.error, 'Transaksi gagal dan tidak ditandakan sebagai berjaya.'));
    } else if (result.state === ADMIN_MUTATION_STATES.NOT_EXECUTED) {
      setStatusMessage('Transaksi belum direkodkan pada masa semakan. Percubaan semula mesti menggunakan ID permintaan yang sama.');
    } else {
      setStatusMessage('Status transaksi belum dapat dipastikan. Jangan hantar pembaharuan baharu; gunakan Semak Status Transaksi.');
    }
  }, [refreshAuthoritativeViews]);

  const submitAction = useCallback(async () => {
    if (!command || submissionRef.current) return;
    const commandSnapshot = command;
    const pending = savePendingSubscriptionOperation(getAdminRecoveryStorage(), commandSnapshot, pendingOperation?.startedAt) || createPendingSubscriptionOperation(commandSnapshot, pendingOperation?.startedAt);
    const operation = { ...commandSnapshot, accountId: commandSnapshot.targetUserId, startedAt: pending.startedAt };
    submissionRef.current = true;
    currentRequestRef.current = operation.requestId;
    setPendingOperation(pending);
    setStatusMessage('');
    try {
      const result = await reconcileSubscriptionOperation({
        operation,
        // Never abort an idempotent write at the UI timeout. A cancelled fetch
        // can prevent the RPC from reaching Supabase, which leaves no audit row.
        submit: current => withAdminRequestTimeout(
          signal => applyAdminSubscriptionChange(supabase, current, { signal }),
          { abortOnTimeout: false }
        ),
        verify: requestId => withAdminRequestTimeout(signal => verifyAdminSubscriptionRequest(supabase, requestId, { signal })),
        onState: (state, payload) => {
          if (mountedRef.current && currentRequestRef.current === operation.requestId) setMutation({ state, ...payload });
        }
      });
      await finishMutation(result);
    } finally {
      if (currentRequestRef.current === operation.requestId) submissionRef.current = false;
    }
  }, [command, finishMutation, pendingOperation?.startedAt, supabase]);

  const verifyPendingTransaction = useCallback(async operationOverride => {
    const operation = operationOverride || mutation.operation || pendingOperation;
    if (!operation?.requestId || submissionRef.current) return;
    submissionRef.current = true;
    currentRequestRef.current = operation.requestId;
    try {
      const result = await verifySubscriptionOperation({
        operation,
        verify: requestId => withAdminRequestTimeout(signal => verifyAdminSubscriptionRequest(supabase, requestId, { signal })),
        onState: (state, payload) => {
          if (mountedRef.current && currentRequestRef.current === operation.requestId) setMutation({ state, ...payload });
        }
      });
      await finishMutation(result);
    } finally {
      if (currentRequestRef.current === operation.requestId) submissionRef.current = false;
    }
  }, [finishMutation, mutation.operation, pendingOperation, supabase]);

  useEffect(() => {
    if (authorization !== 'authorized' || !pendingOperation?.requestId || mutation.state !== ADMIN_MUTATION_STATES.UNCERTAIN || submissionRef.current) return;
    if (restoredAutoCheckRef.current === pendingOperation.requestId) return;
    restoredAutoCheckRef.current = pendingOperation.requestId;
    void verifyPendingTransaction(pendingOperation);
  }, [authorization, mutation.state, pendingOperation, verifyPendingTransaction]);

  useEffect(() => {
    const verifyOnReconnect = () => {
      if (authorization === 'authorized' && pendingOperation?.requestId && !submissionRef.current) void verifyPendingTransaction(pendingOperation);
    };
    globalThis.addEventListener?.('online', verifyOnReconnect);
    return () => globalThis.removeEventListener?.('online', verifyOnReconnect);
  }, [authorization, pendingOperation, verifyPendingTransaction]);

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
  if (authorization === 'error') return <main className="admin-premium-page"><div className="card"><h1>Semakan admin terganggu</h1><p role="status">{statusMessage}</p><button type="button" onClick={() => { setAuthorization('checking'); void refreshSummary(); }}>Cuba Semula</button><button type="button" onClick={onBack}>Kembali</button></div></main>;
  if (authorization !== 'authorized') return <main className="admin-premium-page"><div className="card"><p className="eyebrow">Akses dilindungi</p><h1>Akses tidak dibenarkan</h1><p>{accountUser ? 'Peranan admin mesti disahkan oleh pangkalan data.' : 'Log masuk menggunakan akaun admin untuk meneruskan.'}</p><button type="button" onClick={onBack}>Kembali</button></div></main>;

  const offset = Number(searchResult.pageOffset) || 0;
  const pageSize = Number(searchResult.pageSize) || 20;
  const total = Number(searchResult.total) || 0;
  const overview = details?.overview || {};
  const subscription = details?.subscription || activeAccount || {};
  const retryAvailable = canRetrySubscriptionOperation(mutation)
    && Boolean(command?.requestId)
    && command.requestId === mutation.operation?.requestId;

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
      {!recoveryHidden ? <RecoveryPanel
        mutation={mutation}
        pending={pendingOperation}
        retryAvailable={retryAvailable}
        onVerify={() => void verifyPendingTransaction()}
        onRetry={() => void submitAction()}
        onClose={() => setRecoveryHidden(true)}
      /> : null}
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
    <ConfirmationDialog command={[ADMIN_MUTATION_STATES.CONFIRMING, ADMIN_MUTATION_STATES.SUBMITTING, ADMIN_MUTATION_STATES.VERIFYING].includes(mutation.state) ? command : null} account={activeAccount} acknowledged={dangerAcknowledged} mutationState={mutation.state} onAcknowledge={setDangerAcknowledged} onCancel={() => { setCommand(null); setDangerAcknowledged(false); setMutation(pendingOperation ? { state: ADMIN_MUTATION_STATES.UNCERTAIN, operation: pendingOperation } : { state: ADMIN_MUTATION_STATES.IDLE }); }} onConfirm={() => void submitAction()} />
  </main>;
}
