export const ADMIN_SUBSCRIPTION_TIMEOUT_MS = 12_000;
export const ADMIN_PENDING_OPERATION_KEY = 'jannati.admin.pending-subscription.v1';

export const ADMIN_MUTATION_STATES = Object.freeze({
  IDLE: 'idle',
  CONFIRMING: 'confirming',
  SUBMITTING: 'submitting',
  VERIFYING: 'verifying',
  SUCCESS: 'success',
  FAILED: 'failed',
  NOT_EXECUTED: 'not_executed',
  UNCERTAIN: 'uncertain'
});

export const ADMIN_ERROR_TYPES = Object.freeze({
  TIMEOUT: 'timeout',
  NETWORK_OFFLINE: 'network_offline',
  NETWORK_CONNECTION: 'network_connection',
  RPC_MISSING: 'rpc_missing',
  ADMIN_UNAUTHORIZED: 'admin_unauthorized',
  DATABASE_VALIDATION: 'database_validation',
  DATABASE_TRANSACTION: 'database_transaction',
  IDEMPOTENT_REPLAY: 'idempotent_replay',
  AMBIGUOUS_RESULT: 'ambiguous_result',
  UNKNOWN: 'unknown'
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KNOWN_VALIDATION_ERRORS = [
  'target_user_not_found', 'request_id_required', 'invalid_premium_action',
  'invalid_duration_days', 'duration_days_required', 'future_expiry_required',
  'trial_duration_required', 'invalid_payment_method', 'invalid_payment_status',
  'invalid_payment_amount', 'payment_reference_required',
  'active_entitlement_cannot_start_trial',
  'permanent_complimentary_requires_expiry_change'
];

export class AdminSubscriptionTimeoutError extends Error {
  constructor(timeoutMs = ADMIN_SUBSCRIPTION_TIMEOUT_MS) {
    super(`admin_subscription_timeout_${timeoutMs}ms`);
    this.name = 'AdminSubscriptionTimeoutError';
    this.code = 'ADMIN_SUBSCRIPTION_TIMEOUT';
    this.timeoutMs = timeoutMs;
  }
}

function abortError() {
  const error = new Error('admin_subscription_aborted');
  error.name = 'AbortError';
  error.code = 'ADMIN_SUBSCRIPTION_ABORTED';
  return error;
}

export async function withAdminRequestTimeout(requestFactory, {
  timeoutMs = ADMIN_SUBSCRIPTION_TIMEOUT_MS,
  signal: externalSignal
} = {}) {
  if (typeof requestFactory !== 'function') throw new TypeError('request_factory_required');
  if (externalSignal?.aborted) throw abortError();

  const controller = new AbortController();
  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener?.('abort', abortFromExternal, { once: true });

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AdminSubscriptionTimeoutError(timeoutMs));
      controller.abort('timeout');
    }, Math.max(1, Number(timeoutMs) || ADMIN_SUBSCRIPTION_TIMEOUT_MS));
  });

  try {
    return await Promise.race([
      Promise.resolve().then(() => requestFactory(controller.signal)),
      timeoutPromise
    ]);
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener?.('abort', abortFromExternal);
  }
}

export function classifyAdminSubscriptionError(error, { online = globalThis.navigator?.onLine } = {}) {
  const raw = `${error?.code || ''} ${error?.name || ''} ${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  if (error instanceof AdminSubscriptionTimeoutError || raw.includes('admin_subscription_timeout')) return ADMIN_ERROR_TYPES.TIMEOUT;
  if (raw.includes('admin_required') || raw.includes('not_authenticated') || raw.includes('permission denied') || raw.includes('row-level security')) return ADMIN_ERROR_TYPES.ADMIN_UNAUTHORIZED;
  if (raw.includes('42883') || raw.includes('could not find the function') || raw.includes('admin_verify_subscription_request') && raw.includes('not found')) return ADMIN_ERROR_TYPES.RPC_MISSING;
  if (KNOWN_VALIDATION_ERRORS.some(code => raw.includes(code))) return ADMIN_ERROR_TYPES.DATABASE_VALIDATION;
  if (raw.includes('ambiguous_result') || raw.includes('request_id_conflict')) return ADMIN_ERROR_TYPES.AMBIGUOUS_RESULT;
  if (raw.includes('duplicate') || raw.includes('idempotent')) return ADMIN_ERROR_TYPES.IDEMPOTENT_REPLAY;
  if (online === false) return ADMIN_ERROR_TYPES.NETWORK_OFFLINE;
  if (raw.includes('failed to fetch') || raw.includes('network') || raw.includes('connection') || raw.includes('load failed') || raw.includes('gateway') || raw.includes('http 5')) return ADMIN_ERROR_TYPES.NETWORK_CONNECTION;
  if (raw.includes('transaction') || raw.includes('database') || raw.includes('postgres') || raw.includes('pgrst')) return ADMIN_ERROR_TYPES.DATABASE_TRANSACTION;
  return ADMIN_ERROR_TYPES.UNKNOWN;
}

export function isAmbiguousAdminSubscriptionError(type) {
  return [
    ADMIN_ERROR_TYPES.TIMEOUT,
    ADMIN_ERROR_TYPES.NETWORK_OFFLINE,
    ADMIN_ERROR_TYPES.NETWORK_CONNECTION,
    ADMIN_ERROR_TYPES.AMBIGUOUS_RESULT,
    ADMIN_ERROR_TYPES.IDEMPOTENT_REPLAY,
    ADMIN_ERROR_TYPES.UNKNOWN
  ].includes(type);
}

export function normalizeSubscriptionVerification(payload = {}, requestId = '') {
  const status = String(payload?.status || '').toLowerCase();
  const normalizedStatus = ['success', 'not_found', 'incomplete'].includes(status) ? status : 'uncertain';
  return {
    ...payload,
    requestId: String(payload?.requestId || payload?.request_id || requestId || ''),
    accountId: String(payload?.accountId || payload?.account_id || ''),
    status: normalizedStatus,
    auditRecordFound: Boolean(payload?.auditRecordFound ?? payload?.audit_record_found),
    paymentRecordFound: Boolean(payload?.paymentRecordFound ?? payload?.payment_record_found),
    entitlementMatches: payload?.entitlementMatches ?? payload?.entitlement_matches ?? null,
    idempotentReplay: Boolean(payload?.idempotentReplay ?? payload?.idempotent_replay)
  };
}

export function verificationMutationState(verification = {}) {
  if (verification.status === 'success') return ADMIN_MUTATION_STATES.SUCCESS;
  if (verification.status === 'not_found') return ADMIN_MUTATION_STATES.NOT_EXECUTED;
  return ADMIN_MUTATION_STATES.UNCERTAIN;
}

function verifiedOperationState(verification, operation) {
  if (verification.requestId !== operation.requestId
    || verification.accountId && verification.accountId !== (operation.accountId || operation.targetUserId)
    || verification.action && verification.action !== operation.action) return ADMIN_MUTATION_STATES.UNCERTAIN;
  return verificationMutationState(verification);
}

export async function reconcileSubscriptionOperation({ operation, submit, verify, onState = () => {}, online } = {}) {
  if (!operation?.requestId || typeof submit !== 'function' || typeof verify !== 'function') throw new TypeError('invalid_admin_subscription_operation');
  onState(ADMIN_MUTATION_STATES.SUBMITTING, { operation });
  try {
    const data = await submit(operation);
    if (data?.ok !== true || data.status && data.status !== 'success'
      || data.requestId && data.requestId !== operation.requestId
      || data.accountId && data.accountId !== (operation.accountId || operation.targetUserId)
      || data.action && data.action !== operation.action) throw new Error('admin_subscription_ambiguous_result');
    const result = { state: ADMIN_MUTATION_STATES.SUCCESS, operation, data, idempotentReplay: Boolean(data?.duplicate || data?.idempotentReplay) };
    onState(result.state, result);
    return result;
  } catch (error) {
    const errorType = classifyAdminSubscriptionError(error, { online });
    if (!isAmbiguousAdminSubscriptionError(errorType)) {
      const result = { state: ADMIN_MUTATION_STATES.FAILED, operation, error, errorType };
      onState(result.state, result);
      return result;
    }

    onState(ADMIN_MUTATION_STATES.VERIFYING, { operation, error, errorType });
    try {
      const verification = normalizeSubscriptionVerification(await verify(operation.requestId), operation.requestId);
      const state = verifiedOperationState(verification, operation);
      const result = { state, operation, error, errorType, verification };
      onState(state, result);
      return result;
    } catch (verificationError) {
      const result = {
        state: ADMIN_MUTATION_STATES.UNCERTAIN,
        operation,
        error,
        errorType,
        verificationError,
        verificationErrorType: classifyAdminSubscriptionError(verificationError, { online })
      };
      onState(result.state, result);
      return result;
    }
  }
}

export async function verifySubscriptionOperation({ operation, verify, onState = () => {} } = {}) {
  if (!operation?.requestId || typeof verify !== 'function') throw new TypeError('invalid_admin_subscription_verification');
  onState(ADMIN_MUTATION_STATES.VERIFYING, { operation });
  try {
    const verification = normalizeSubscriptionVerification(await verify(operation.requestId), operation.requestId);
    const state = verifiedOperationState(verification, operation);
    const result = { state, operation, verification };
    onState(state, result);
    return result;
  } catch (error) {
    const result = {
      state: ADMIN_MUTATION_STATES.UNCERTAIN,
      operation,
      verificationError: error,
      verificationErrorType: classifyAdminSubscriptionError(error)
    };
    onState(result.state, result);
    return result;
  }
}

export function createPendingSubscriptionOperation(command = {}, startedAt = new Date().toISOString()) {
  return {
    requestId: String(command.requestId || ''),
    accountId: String(command.targetUserId || command.accountId || ''),
    action: String(command.action || ''),
    startedAt: String(startedAt || '')
  };
}

export function isValidPendingSubscriptionOperation(operation) {
  return Boolean(
    UUID_PATTERN.test(String(operation?.requestId || ''))
    && UUID_PATTERN.test(String(operation?.accountId || ''))
    && /^[A-Z_]{3,40}$/.test(String(operation?.action || ''))
    && Number.isFinite(new Date(operation?.startedAt).getTime())
  );
}

export function savePendingSubscriptionOperation(storage, command, startedAt) {
  const operation = createPendingSubscriptionOperation(command, startedAt);
  if (!storage?.setItem || !isValidPendingSubscriptionOperation(operation)) return null;
  try {
    storage.setItem(ADMIN_PENDING_OPERATION_KEY, JSON.stringify(operation));
    return operation;
  } catch {
    return null;
  }
}

export function loadPendingSubscriptionOperation(storage) {
  if (!storage?.getItem) return null;
  try {
    const operation = JSON.parse(storage.getItem(ADMIN_PENDING_OPERATION_KEY) || 'null');
    return isValidPendingSubscriptionOperation(operation) ? operation : null;
  } catch {
    return null;
  }
}

export function clearPendingSubscriptionOperation(storage, requestId = '') {
  if (!storage?.removeItem) return;
  const current = loadPendingSubscriptionOperation(storage);
  try {
    if (!requestId || !current || current.requestId === requestId) storage.removeItem(ADMIN_PENDING_OPERATION_KEY);
  } catch {
    // Storage can be blocked in hardened/private browser contexts.
  }
}

export function canRetrySubscriptionOperation(result = {}) {
  return result?.state === ADMIN_MUTATION_STATES.NOT_EXECUTED && Boolean(result?.operation?.requestId);
}

export function canReenterSubscriptionOperation(result, pending, accountId, action) {
  return canRetrySubscriptionOperation(result) && result.operation.requestId === pending?.requestId
    && pending.accountId === accountId && pending.action === action;
}

export function getAdminRecoveryStorage() {
  try { return globalThis.sessionStorage; } catch { return null; }
}

export function shortAdminRequestId(requestId = '') {
  const value = String(requestId || '');
  return value ? `${value.slice(0, 8)}…${value.slice(-4)}` : '—';
}
