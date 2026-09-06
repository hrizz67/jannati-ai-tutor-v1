export const PREMIUM_ENTITLEMENT_CACHE_MS = 5 * 60 * 1000;
export const MALAYSIA_TIME_ZONE = 'Asia/Kuala_Lumpur';

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

  return {
    id: normalizedAccountId || null,
    plan: matchesAccount ? asText(payload?.plan, serverAllowed ? 'premium' : 'free') : 'free',
    entitlement_status: matchesAccount ? effectiveStatus : 'free',
    stored_status: matchesAccount ? asText(payload?.storedStatus || payload?.stored_status, effectiveStatus) : 'free',
    access_status: serverAllowed ? 'premium' : effectiveStatus === 'cancelled' || effectiveStatus === 'expired' ? 'expired' : 'free',
    access_expires_at: expiresAt,
    access_source: 'server-entitlement',
    server_access_allowed: serverAllowed,
    server_verified: matchesAccount && Boolean(serverNow),
    server_now: serverNow,
    starts_at: matchesAccount ? asTimestamp(payload?.startsAt || payload?.starts_at) : null,
    source: matchesAccount ? asText(payload?.source, 'none') : 'none',
    notes: matchesAccount ? asText(payload?.notes) : '',
    updated_at: matchesAccount ? asTimestamp(payload?.updatedAt || payload?.updated_at) : null,
    revision: matchesAccount ? Math.max(0, Number(payload?.revision) || 0) : 0,
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
  const serverNow = new Date(access?.server_now).getTime();
  const expiresAt = new Date(access?.access_expires_at).getTime();
  return Number.isFinite(serverNow) && Number.isFinite(expiresAt)
    && expiresAt > serverNow + Math.max(0, now - verifiedAt);
}

export function getEntitlementExpiryDelay(access, now = Date.now()) {
  if (!access?.server_access_allowed) return null;
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
  const { data, error } = await supabase.rpc('admin_manage_premium_entitlement', {
    target_user_id: command.targetUserId,
    requested_action: command.action,
    duration_days: command.durationDays ?? null,
    requested_expires_at: command.expiresAt || null,
    requested_plan: asText(command.plan, 'premium'),
    requested_source: asText(command.source, 'admin-dashboard'),
    requested_note: asText(command.note) || null,
    request_id: command.requestId
  });
  if (error) throw error;
  return data;
}

export function createRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
