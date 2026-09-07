export const PREMIUM_ENTITLEMENT_CACHE_MS = 5 * 60 * 1000;
export const MALAYSIA_TIME_ZONE = 'Asia/Kuala_Lumpur';
export const ADMIN_CUSTOMER_FILTERS = Object.freeze([
  'all', 'active', 'expiring_7', 'expiring_30', 'expired', 'trial', 'complimentary'
]);

const ALLOWED_SERVER_STATUSES = new Set(['active', 'trial', 'complimentary']);

function asText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function asTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatMalaysiaDateTime(value, options = {}) {
  const timestamp = asTimestamp(value);
  if (!timestamp) return '—';
  return new Intl.DateTimeFormat('ms-MY', {
    timeZone: MALAYSIA_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }).format(new Date(timestamp));
}

export function malaysiaEndOfDayUtc(dateValue) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateValue || '').trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const candidate = new Date(`${year}-${month}-${day}T15:59:59.999Z`);
  if (Number.isNaN(candidate.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MALAYSIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(candidate);
  return parts === `${year}-${month}-${day}` ? candidate.toISOString() : null;
}

export function calculateRenewalExpiry({ expiresAt, serverNow, days, accessAllowed = false } = {}) {
  const duration = Number(days);
  const nowMs = new Date(serverNow).getTime();
  const expiryMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(duration) || duration < 1 || duration > 3650 || !Number.isFinite(nowMs)) return null;
  const baseMs = accessAllowed && Number.isFinite(expiryMs) && expiryMs > nowMs ? expiryMs : nowMs;
  return new Date(baseMs + Math.round(duration) * 86400000).toISOString();
}

export function normalizeServerEntitlement(accountId, payload = {}, extras = {}) {
  const normalizedAccountId = asText(accountId);
  const payloadAccountId = asText(payload?.accountId || payload?.account_id);
  const matchesAccount = Boolean(normalizedAccountId && payloadAccountId === normalizedAccountId);
  const effectiveStatus = asText(payload?.effectiveStatus || payload?.effective_status, 'free').toLowerCase();
  const serverAllowed = matchesAccount
    && payload?.accessAllowed === true
    && ALLOWED_SERVER_STATUSES.has(effectiveStatus);
  const expiresAt = matchesAccount ? asTimestamp(payload?.expiresAt || payload?.expires_at) : null;
  const serverNow = matchesAccount ? asTimestamp(payload?.serverNow || payload?.server_now) : null;
  const isPermanent = matchesAccount && Boolean(payload?.isPermanent ?? payload?.is_permanent);

  return {
    id: normalizedAccountId || null,
    plan: matchesAccount ? asText(payload?.plan, serverAllowed ? 'premium' : 'free') : 'free',
    entitlement_status: matchesAccount ? effectiveStatus : 'free',
    stored_status: matchesAccount ? asText(payload?.storedStatus || payload?.stored_status, effectiveStatus) : 'free',
    access_status: serverAllowed ? 'premium' : effectiveStatus === 'cancelled' || effectiveStatus === 'expired' ? 'expired' : 'free',
    access_expires_at: expiresAt,
    is_permanent: isPermanent,
    access_source: 'server-entitlement',
    server_access_allowed: serverAllowed,
    server_verified: matchesAccount && Boolean(serverNow),
    server_now: serverNow,
    starts_at: matchesAccount ? asTimestamp(payload?.startsAt || payload?.starts_at) : null,
    source: matchesAccount ? asText(payload?.source, 'none') : 'none',
    notes: matchesAccount ? asText(payload?.notes) : '',
    updated_at: matchesAccount ? asTimestamp(payload?.updatedAt || payload?.updated_at) : null,
    revision: matchesAccount ? Math.max(0, Number(payload?.revision) || 0) : 0,
    days_remaining: matchesAccount && !isPermanent ? Math.max(0, Number(payload?.daysRemaining ?? payload?.days_remaining) || 0) : null,
    verified_at: new Date().toISOString(),
    is_admin: Boolean(extras.isAdmin)
  };
}

export function createSafeFreeEntitlement(accountId, source = 'safe-free', extras = {}) {
  return {
    ...normalizeServerEntitlement(accountId, {
      accountId,
      plan: 'free',
      effectiveStatus: 'free',
      storedStatus: 'free',
      accessAllowed: false,
      serverNow: new Date().toISOString()
    }, extras),
    access_source: source,
    server_verified: false
  };
}

export function isFreshAuthenticatedEntitlement(access, accountId, now = Date.now()) {
  if (!access?.server_verified || String(access?.id || '') !== String(accountId || '')) return false;
  const verifiedAt = new Date(access?.verified_at).getTime();
  if (!Number.isFinite(verifiedAt) || now - verifiedAt > PREMIUM_ENTITLEMENT_CACHE_MS) return false;
  if (!access.server_access_allowed) return true;
  if (access.is_permanent) return true;
  const serverNow = new Date(access?.server_now).getTime();
  const expiresAt = new Date(access?.access_expires_at).getTime();
  return Number.isFinite(serverNow) && Number.isFinite(expiresAt)
    && expiresAt > serverNow + Math.max(0, now - verifiedAt);
}

export function getEntitlementExpiryDelay(access, now = Date.now()) {
  if (!access?.server_access_allowed) return null;
  if (access.is_permanent) return null;
  const serverNow = new Date(access?.server_now).getTime();
  const expiresAt = new Date(access?.access_expires_at).getTime();
  const verifiedAt = new Date(access?.verified_at).getTime();
  if (![serverNow, expiresAt, verifiedAt].every(Number.isFinite)) return 0;
  const estimatedServerNow = serverNow + Math.max(0, now - verifiedAt);
  return Math.max(0, expiresAt - estimatedServerNow);
}

export async function loadMyPremiumEntitlement(supabase, accountId, { signal, isAdmin = false } = {}) {
  if (!supabase || !accountId) {
    return { data: createSafeFreeEntitlement(accountId, 'client-unavailable', { isAdmin }), error: new Error('entitlement_client_unavailable') };
  }
  let request = supabase.rpc('get_my_premium_entitlement');
  if (signal && typeof request?.abortSignal === 'function') request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error || !data) return { data: null, error: error || new Error('entitlement_unavailable') };
  return { data: normalizeServerEntitlement(accountId, data, { isAdmin }), error: null };
}

export async function loadAdminPremiumSummary(supabase) {
  const { data, error } = await supabase.rpc('admin_premium_summary');
  if (error) throw error;
  return data;
}

export async function searchAdminPremiumAccounts(supabase, searchText, { pageSize = 20, pageOffset = 0 } = {}) {
  const { data, error } = await supabase.rpc('admin_search_premium_accounts', {
    search_text: asText(searchText),
    page_size: pageSize,
    page_offset: pageOffset
  });
  if (error) throw error;
  return data || { accounts: [], total: 0, pageSize, pageOffset };
}

export async function managePremiumEntitlement(supabase, command = {}) {
  return applyAdminSubscriptionChange(supabase, {
    ...command,
    source: asText(command.source, 'admin-console-v2-compatibility'),
    paymentAmount: 0,
    paymentMethod: 'manual',
    paymentReference: '',
    paymentStatus: 'waived'
  });
}

export function calculateDaysRemaining(expiresAt, serverNow, isPermanent = false) {
  if (isPermanent) return null;
  const expiryMs = new Date(expiresAt).getTime();
  const serverMs = new Date(serverNow).getTime();
  if (!Number.isFinite(expiryMs) || !Number.isFinite(serverMs) || expiryMs <= serverMs) return 0;
  return Math.ceil((expiryMs - serverMs) / 86400000);
}

export function deriveAdminDisplayStatus(account = {}, serverNow = new Date().toISOString()) {
  const stored = asText(account.storedStatus || account.stored_status || account.effectiveStatus || account.effective_status, 'free').toLowerCase();
  const permanent = Boolean(account.isPermanent ?? account.is_permanent);
  const expiry = account.expiresAt || account.expires_at;
  const allowed = ['active', 'trial', 'complimentary'].includes(stored)
    && (permanent || new Date(expiry).getTime() > new Date(serverNow).getTime());
  if (stored === 'cancelled') return 'cancelled';
  if (!allowed && stored !== 'free') return 'expired';
  if (stored === 'trial') return 'trial';
  if (stored === 'complimentary') return 'complimentary';
  if (stored === 'active' && calculateDaysRemaining(expiry, serverNow, permanent) <= 7) return 'expiring_soon';
  return stored === 'active' ? 'active' : 'free';
}

export function requiresReductionWarning(account = {}, previewExpiry = null, action = '', nextPermanent = false) {
  const normalizedAction = asText(action).toUpperCase();
  if (['CANCEL_PREMIUM', 'EXPIRE_PREMIUM'].includes(normalizedAction)) return true;
  if (account.isPermanent && !nextPermanent) return true;
  if (nextPermanent || !previewExpiry) return false;
  const currentMs = new Date(account.expiresAt || account.expires_at).getTime();
  const previewMs = new Date(previewExpiry).getTime();
  return Number.isFinite(currentMs) && Number.isFinite(previewMs) && previewMs < currentMs;
}

export function buildSubscriptionPreview(account = {}, command = {}, serverNow = new Date().toISOString()) {
  const action = asText(command.action).toUpperCase();
  let previewExpiry = command.expiresAt || null;
  if (!previewExpiry && ['ACTIVATE_PREMIUM', 'EXTEND_PREMIUM'].includes(action)) {
    previewExpiry = calculateRenewalExpiry({
      expiresAt: account.expiresAt,
      serverNow,
      days: command.durationDays || 30,
      accessAllowed: Boolean(account.accessAllowed) && !account.isPermanent
    });
  }
  if (!previewExpiry && action === 'START_TRIAL') {
    previewExpiry = calculateRenewalExpiry({ serverNow, days: command.durationDays || 7, accessAllowed: false });
  }
  if (!previewExpiry && action === 'MARK_COMPLIMENTARY' && !command.permanentComplimentary) {
    previewExpiry = calculateRenewalExpiry({
      expiresAt: account.expiresAt,
      serverNow,
      days: command.durationDays || 30,
      accessAllowed: Boolean(account.accessAllowed) && !account.isPermanent
    });
  }
  return {
    ...command,
    previewExpiry,
    reductionWarning: requiresReductionWarning(account, previewExpiry, action, Boolean(command.permanentComplimentary))
  };
}

export async function loadAdminConsoleSummary(supabase, { signal } = {}) {
  let request = supabase.rpc('admin_console_summary');
  if (signal && typeof request?.abortSignal === 'function') request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function searchAdminCustomers(supabase, searchText = '', { statusFilter = 'all', pageSize = 20, pageOffset = 0, signal } = {}) {
  const normalizedFilter = ADMIN_CUSTOMER_FILTERS.includes(statusFilter) ? statusFilter : 'all';
  let request = supabase.rpc('admin_search_customers', {
    search_text: asText(searchText),
    status_filter: normalizedFilter,
    page_size: pageSize,
    page_offset: pageOffset
  });
  if (signal && typeof request?.abortSignal === 'function') request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return data || { accounts: [], total: 0, pageSize, pageOffset, filter: normalizedFilter };
}

export async function loadAdminCustomerDetails(supabase, accountId, options = {}) {
  let request = supabase.rpc('admin_get_customer_details', { target_user_id: accountId });
  if (options.signal && typeof request?.abortSignal === 'function') request = request.abortSignal(options.signal);
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function applyAdminSubscriptionChange(supabase, command = {}, options = {}) {
  let request = supabase.rpc('admin_apply_subscription_change', {
    target_user_id: command.targetUserId,
    requested_action: command.action,
    duration_days: command.durationDays ?? null,
    requested_expires_at: command.expiresAt || null,
    requested_plan: asText(command.plan, 'premium'),
    requested_source: asText(command.source, 'admin-console-v2'),
    requested_note: asText(command.note) || null,
    request_id: command.requestId,
    permanent_complimentary: Boolean(command.permanentComplimentary),
    payment_amount: command.paymentAmount === '' || command.paymentAmount == null ? null : Number(command.paymentAmount),
    payment_currency: asText(command.paymentCurrency, 'MYR').toUpperCase(),
    payment_method: asText(command.paymentMethod, 'manual').toLowerCase(),
    payment_reference: asText(command.paymentReference) || null,
    payment_status: asText(command.paymentStatus, 'paid').toLowerCase(),
    payment_paid_at: command.paymentPaidAt || null
  });
  if (options.signal && typeof request?.abortSignal === 'function') request = request.abortSignal(options.signal);
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function verifyAdminSubscriptionRequest(supabase, requestId, options = {}) {
  let request = supabase.rpc('admin_verify_subscription_request', {
    target_request_id: requestId
  });
  if (options.signal && typeof request?.abortSignal === 'function') request = request.abortSignal(options.signal);
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildAdminSubscriptionCsv(accounts = []) {
  const header = ['email', 'parent_name', 'plan', 'status', 'expires_at', 'days_remaining'];
  const rows = accounts.map(account => [
    account.email,
    account.displayName,
    account.plan || 'free',
    account.effectiveStatus || 'free',
    account.isPermanent ? 'permanent' : account.expiresAt || '',
    account.isPermanent ? '' : account.daysRemaining ?? ''
  ]);
  return [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}

export function createRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
