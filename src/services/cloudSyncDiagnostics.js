export const CLOUD_SYNC_DIAGNOSTIC_KEY = 'jannati_cloud_sync_diag_v1';

const MESSAGE_LIMIT = 160;
const KNOWN_PHASES = new Set(['read', 'write', 'runtime']);
const KNOWN_RPCS = new Set([
  'get_learning_data_v3',
  'get_learning_data',
  'save_learning_data_v4',
  'save_learning_data_v3'
]);

let latestDiagnostic = null;

function diagnosticWindow() {
  return typeof window === 'undefined' ? null : window;
}

export function isCloudSyncDiagnosticEnabled() {
  const target = diagnosticWindow();
  if (!target) return false;
  try {
    return new URLSearchParams(target.location?.search || '').get('cloudSyncDiag') === '1';
  } catch {
    return false;
  }
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function boundedCount(value) {
  const number = finiteNumber(value);
  return number === null ? 0 : Math.max(0, Math.floor(number));
}

export function sanitizeCloudSyncDiagnosticText(value, limit = MESSAGE_LIMIT) {
  if (value === null || value === undefined) return '';
  try {
    const sanitized = String(value)
      .replace(/[\u0000-\u001f\u007f]+/g, ' ')
      .replace(/\bBearer\s+[^\s,;]+/gi, '[REDACTED_BEARER]')
      .replace(/\b(access[_ -]?token|refresh[_ -]?token|api[_ -]?key|apikey|supabase[_ -]?key|authorization)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED_SECRET]')
      .replace(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_JWT]')
      .replace(/https?:\/\/[^\s<>'"]+/gi, '[REDACTED_URL]')
      .replace(/\b[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}\b/g, '[REDACTED_UUID]')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]')
      .replace(/\b[A-Za-z0-9_-]{24,}\b/g, '[REDACTED_TOKEN]')
      .replace(/\s+/g, ' ')
      .trim();
    if (/\bBearer\s+|\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(sanitized)) {
      return '';
    }
    return sanitized.slice(0, Math.max(0, Math.min(MESSAGE_LIMIT, Number(limit) || MESSAGE_LIMIT)));
  } catch {
    return '';
  }
}

function sanitizeCode(value) {
  const symbolicCode = String(value || '').trim();
  if (/^[A-Z][A-Z0-9_]{1,47}$/.test(symbolicCode)) return symbolicCode;
  const code = sanitizeCloudSyncDiagnosticText(value, 48);
  return /^[A-Za-z0-9_.:-]{1,48}$/.test(code) ? code : '';
}

function normalizeTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function normalizeRecord(input = {}) {
  const phase = KNOWN_PHASES.has(input.phase) ? input.phase : 'runtime';
  const rpc = KNOWN_RPCS.has(input.rpc)
    ? input.rpc
    : phase === 'read' ? 'get_learning_data_v3' : 'save_learning_data_v4';
  return Object.freeze({
    phase,
    rpc,
    status: finiteNumber(input.status),
    code: sanitizeCode(input.code),
    message: sanitizeCloudSyncDiagnosticText(input.message),
    attempt: boundedCount(input.attempt),
    maxAttempts: boundedCount(input.maxAttempts),
    fallbackAttempted: input.fallbackAttempted === true,
    conflictCount: boundedCount(input.conflictCount),
    cachedEnvelopeUsed: input.cachedEnvelopeUsed === true,
    currentRevision: boundedCount(input.currentRevision),
    expectedRevision: boundedCount(input.expectedRevision),
    protocolVersion: boundedCount(input.protocolVersion),
    dirtyChildCount: boundedCount(input.dirtyChildCount),
    pendingMutation: input.pendingMutation === true,
    accountScopeMatch: input.accountScopeMatch === true,
    childScopeMatch: input.childScopeMatch === true,
    online: input.online !== false,
    timestamp: normalizeTimestamp(input.timestamp)
  });
}

function exposeLatestDiagnostic(target) {
  try {
    Object.defineProperty(target, '__JANNATI_CLOUD_SYNC_DIAG__', {
      configurable: true,
      enumerable: false,
      get: () => latestDiagnostic ? Object.freeze({ ...latestDiagnostic }) : null
    });
  } catch {
    // Diagnostic access must never affect the learning flow.
  }
}

function clearDiagnosticAccess(target) {
  latestDiagnostic = null;
  try { target.sessionStorage?.removeItem(CLOUD_SYNC_DIAGNOSTIC_KEY); } catch { /* no-op */ }
  try { delete target.__JANNATI_CLOUD_SYNC_DIAG__; } catch { /* no-op */ }
}

export function initializeCloudSyncDiagnostic() {
  const target = diagnosticWindow();
  if (!target) return false;
  if (!isCloudSyncDiagnosticEnabled()) {
    clearDiagnosticAccess(target);
    return false;
  }
  try {
    const stored = target.sessionStorage?.getItem(CLOUD_SYNC_DIAGNOSTIC_KEY);
    latestDiagnostic = stored ? normalizeRecord(JSON.parse(stored)) : null;
  } catch {
    latestDiagnostic = null;
    try { target.sessionStorage?.removeItem(CLOUD_SYNC_DIAGNOSTIC_KEY); } catch { /* no-op */ }
  }
  exposeLatestDiagnostic(target);
  return true;
}

export function recordCloudSyncDiagnostic(input = {}) {
  const target = diagnosticWindow();
  if (!target || !isCloudSyncDiagnosticEnabled()) return null;
  const record = normalizeRecord(input);
  latestDiagnostic = record;
  exposeLatestDiagnostic(target);
  try {
    target.sessionStorage?.setItem(CLOUD_SYNC_DIAGNOSTIC_KEY, JSON.stringify(record));
  } catch {
    // Storage may be unavailable in private mode; the read-only getter remains useful.
  }
  return record;
}
