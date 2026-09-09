import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ADMIN_ERROR_TYPES,
  ADMIN_MUTATION_STATES,
  ADMIN_PENDING_OPERATION_KEY,
  AdminSubscriptionTimeoutError,
  canReenterSubscriptionOperation,
  canRetrySubscriptionOperation,
  classifyAdminSubscriptionError,
  clearPendingSubscriptionOperation,
  loadPendingSubscriptionOperation,
  normalizeSubscriptionVerification,
  reconcileSubscriptionOperation,
  savePendingSubscriptionOperation,
  shortAdminRequestId,
  verificationMutationState,
  verifySubscriptionOperation,
  withAdminRequestTimeout
} from '../../src/services/adminSubscriptionRecovery.js';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const ACCOUNT_ID = '22222222-2222-4222-8222-222222222222';
const operation = { requestId: REQUEST_ID, targetUserId: ACCOUNT_ID, accountId: ACCOUNT_ID, action: 'EXTEND_PREMIUM' };

function memoryStorage() {
  const values = new Map();
  return {
    getItem: vi.fn(key => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn(key => values.delete(key)),
    values
  };
}

afterEach(() => vi.useRealTimers());

describe('Admin subscription recovery acceptance matrix', () => {
  it('1. success exits submitting state', async () => {
    const result = await reconcileSubscriptionOperation({ operation, submit: async () => ({ ok: true }), verify: vi.fn() });
    expect(result.state).toBe(ADMIN_MUTATION_STATES.SUCCESS);
  });

  it('2. database validation is a known failure', () => {
    expect(classifyAdminSubscriptionError(new Error('future_expiry_required'))).toBe(ADMIN_ERROR_TYPES.DATABASE_VALIDATION);
  });

  it('3. unauthorized admin is a known failure', () => {
    expect(classifyAdminSubscriptionError(new Error('admin_required'))).toBe(ADMIN_ERROR_TYPES.ADMIN_UNAUTHORIZED);
  });

  it('4. browser offline is classified separately', () => {
    expect(classifyAdminSubscriptionError(new Error('Failed to fetch'), { online: false })).toBe(ADMIN_ERROR_TYPES.NETWORK_OFFLINE);
  });

  it('5. connection failure is ambiguous', () => {
    expect(classifyAdminSubscriptionError(new Error('Network connection lost'), { online: true })).toBe(ADMIN_ERROR_TYPES.NETWORK_CONNECTION);
  });

  it('6. a never-settling request reaches the canonical timeout', async () => {
    vi.useFakeTimers();
    const pending = withAdminRequestTimeout(() => new Promise(() => {}), { timeoutMs: 20 });
    const expectation = expect(pending).rejects.toBeInstanceOf(AdminSubscriptionTimeoutError);
    await vi.advanceTimersByTimeAsync(21);
    await expectation;
  });

  it('7. a slow request that completes before timeout succeeds', async () => {
    await expect(withAdminRequestTimeout(() => Promise.resolve('ok'), { timeoutMs: 50 })).resolves.toBe('ok');
  });

  it('7a. a timed-out write is not aborted before server verification', async () => {
    vi.useFakeTimers();
    let requestSignal;
    const pending = withAdminRequestTimeout(signal => {
      requestSignal = signal;
      return new Promise(() => {});
    }, { timeoutMs: 20, abortOnTimeout: false });
    const expectation = expect(pending).rejects.toBeInstanceOf(AdminSubscriptionTimeoutError);
    await vi.advanceTimersByTimeAsync(21);
    await expectation;
    expect(requestSignal.aborted).toBe(false);
  });

  it('7b. reads keep the default abort-on-timeout behaviour', async () => {
    vi.useFakeTimers();
    let requestSignal;
    const pending = withAdminRequestTimeout(signal => {
      requestSignal = signal;
      return new Promise(() => {});
    }, { timeoutMs: 20 });
    const expectation = expect(pending).rejects.toBeInstanceOf(AdminSubscriptionTimeoutError);
    await vi.advanceTimersByTimeAsync(21);
    await expectation;
    expect(requestSignal.aborted).toBe(true);
  });

  it('8. lost success response is recovered by server verification', async () => {
    const result = await reconcileSubscriptionOperation({
      operation,
      submit: async () => { throw new AdminSubscriptionTimeoutError(); },
      verify: async () => ({ status: 'success', requestId: REQUEST_ID, accountId: ACCOUNT_ID, auditRecordFound: true, paymentRecordFound: true })
    });
    expect(result.state).toBe(ADMIN_MUTATION_STATES.SUCCESS);
  });

  it('9. a request absent from server is explicitly not executed', async () => {
    const result = await reconcileSubscriptionOperation({
      operation,
      submit: async () => { throw new Error('Failed to fetch'); },
      verify: async () => ({ status: 'not_found', requestId: REQUEST_ID }),
      verificationRetryDelaysMs: []
    });
    expect(result.state).toBe(ADMIN_MUTATION_STATES.NOT_EXECUTED);
  });

  it('10. incomplete server records remain uncertain', async () => {
    const result = await reconcileSubscriptionOperation({
      operation,
      submit: async () => { throw new AdminSubscriptionTimeoutError(); },
      verify: async () => ({ status: 'incomplete', requestId: REQUEST_ID, auditRecordFound: false, paymentRecordFound: true })
    });
    expect(result.state).toBe(ADMIN_MUTATION_STATES.UNCERTAIN);
  });

  it('11. manual verification can confirm success', async () => {
    const result = await verifySubscriptionOperation({ operation, verify: async () => ({ status: 'success', requestId: REQUEST_ID }) });
    expect(result.state).toBe(ADMIN_MUTATION_STATES.SUCCESS);
  });

  it('12. manual verification can confirm not executed', async () => {
    const result = await verifySubscriptionOperation({ operation, verify: async () => ({ status: 'not_found', requestId: REQUEST_ID }), retryDelaysMs: [] });
    expect(result.state).toBe(ADMIN_MUTATION_STATES.NOT_EXECUTED);
  });

  it('13. failed verification remains recoverable and uncertain', async () => {
    const result = await verifySubscriptionOperation({ operation, verify: async () => { throw new Error('offline'); } });
    expect(result.state).toBe(ADMIN_MUTATION_STATES.UNCERTAIN);
  });

  it('14. direct success never calls verification', async () => {
    const verify = vi.fn();
    await reconcileSubscriptionOperation({ operation, submit: async () => ({ ok: true }), verify });
    expect(verify).not.toHaveBeenCalled();
  });

  it('15. status verification never calls the mutation function', async () => {
    const mutate = vi.fn();
    await verifySubscriptionOperation({ operation, verify: async () => ({ status: 'success' }), mutate });
    expect(mutate).not.toHaveBeenCalled();
  });

  it('16. idempotent replay is treated as one success', async () => {
    const result = await reconcileSubscriptionOperation({ operation, submit: async () => ({ ok: true, duplicate: true }), verify: vi.fn() });
    expect(result).toMatchObject({ state: 'success', idempotentReplay: true });
  });

  it('17. retry is allowed only after confirmed not executed', () => {
    expect(canRetrySubscriptionOperation({ state: 'not_executed', operation })).toBe(true);
  });

  it('18. uncertain operation cannot be retried', () => {
    expect(canRetrySubscriptionOperation({ state: 'uncertain', operation })).toBe(false);
  });

  it('19. pending operation persists only recovery metadata', () => {
    const storage = memoryStorage();
    savePendingSubscriptionOperation(storage, { ...operation, paymentReference: 'SECRET-1', note: 'private' }, '2026-09-07T01:00:00.000Z');
    expect(JSON.parse(storage.values.get(ADMIN_PENDING_OPERATION_KEY))).toEqual({ requestId: REQUEST_ID, accountId: ACCOUNT_ID, action: 'EXTEND_PREMIUM', startedAt: '2026-09-07T01:00:00.000Z', durationDays: null });
  });

  it('20. pending storage excludes payment and note fields', () => {
    const storage = memoryStorage();
    savePendingSubscriptionOperation(storage, { ...operation, paymentAmount: 99, paymentReference: 'DN-X', note: 'secret' });
    expect(storage.values.get(ADMIN_PENDING_OPERATION_KEY)).not.toMatch(/DN-X|secret|paymentAmount/);
  });

  it('21. a valid pending operation survives reload', () => {
    const storage = memoryStorage();
    savePendingSubscriptionOperation(storage, operation, '2026-09-07T01:00:00.000Z');
    expect(loadPendingSubscriptionOperation(storage)?.requestId).toBe(REQUEST_ID);
  });

  it('22. corrupt pending data fails closed', () => {
    const storage = memoryStorage();
    storage.values.set(ADMIN_PENDING_OPERATION_KEY, '{broken');
    expect(loadPendingSubscriptionOperation(storage)).toBeNull();
  });

  it('23. matching request clears pending recovery data', () => {
    const storage = memoryStorage();
    savePendingSubscriptionOperation(storage, operation);
    clearPendingSubscriptionOperation(storage, REQUEST_ID);
    expect(storage.values.has(ADMIN_PENDING_OPERATION_KEY)).toBe(false);
  });

  it('24. a stale response cannot clear another request', () => {
    const storage = memoryStorage();
    savePendingSubscriptionOperation(storage, operation);
    clearPendingSubscriptionOperation(storage, '33333333-3333-4333-8333-333333333333');
    expect(storage.values.has(ADMIN_PENDING_OPERATION_KEY)).toBe(true);
  });

  it('25. snake-case verification payload is normalized', () => {
    expect(normalizeSubscriptionVerification({ status: 'success', request_id: REQUEST_ID, account_id: ACCOUNT_ID, audit_record_found: true }, REQUEST_ID)).toMatchObject({ requestId: REQUEST_ID, accountId: ACCOUNT_ID, auditRecordFound: true });
  });

  it('26. unknown verification response fails closed as uncertain', () => {
    expect(verificationMutationState(normalizeSubscriptionVerification({ status: 'mystery' }, REQUEST_ID))).toBe(ADMIN_MUTATION_STATES.UNCERTAIN);
  });

  it('27. request IDs are shortened safely for UI history', () => {
    expect(shortAdminRequestId(REQUEST_ID)).toBe('11111111…1111');
  });

  it('28. state transition records submitting then success', async () => {
    const states = [];
    await reconcileSubscriptionOperation({ operation, submit: async () => ({ ok: true }), verify: vi.fn(), onState: state => states.push(state) });
    expect(states).toEqual(['submitting', 'success']);
  });

  it('29. timeout transition records submitting, verifying, then success', async () => {
    const states = [];
    await reconcileSubscriptionOperation({ operation, submit: async () => { throw new AdminSubscriptionTimeoutError(); }, verify: async () => ({ status: 'success' }), onState: state => states.push(state) });
    expect(states).toEqual(['submitting', 'verifying', 'success']);
  });

  it('30. UI exposes recovery, safe retry and non-infinite state labels', () => {
    const source = fs.readFileSync(new URL('../../src/admin/AdminPremiumPage.jsx', import.meta.url), 'utf8');
    expect(source).toContain('Semak Status Transaksi');
    expect(source).toContain('Cuba Lagi (ID Sama)');
    expect(source).toContain('Menyemak status…');
    expect(source).toContain('{ abortOnTimeout: false }');
    expect(source).toContain('Punca: sambungan ke Supabase terputus atau tidak stabil.');
  });

  it('31. verification retries a transient not-found result before succeeding', async () => {
    const verify = vi.fn()
      .mockResolvedValueOnce({ status: 'not_found', requestId: REQUEST_ID })
      .mockResolvedValueOnce({ status: 'success', requestId: REQUEST_ID, accountId: ACCOUNT_ID });
    const sleep = vi.fn(async () => {});
    const result = await verifySubscriptionOperation({ operation, verify, retryDelaysMs: [400], sleep });
    expect(result).toMatchObject({ state: 'success', attempts: 2 });
    expect(sleep).toHaveBeenCalledWith(400);
  });

  it('32. in-progress verification is retained and retried', async () => {
    const verify = vi.fn()
      .mockResolvedValueOnce({ status: 'in_progress', requestId: REQUEST_ID })
      .mockResolvedValueOnce({ status: 'success', requestId: REQUEST_ID, accountId: ACCOUNT_ID });
    const result = await verifySubscriptionOperation({ operation, verify, retryDelaysMs: [0], sleep: async () => {} });
    expect(result).toMatchObject({ state: 'success', attempts: 2 });
  });

  it('33. safe recovery metadata retains the original renewal duration', () => {
    const storage = memoryStorage();
    savePendingSubscriptionOperation(storage, { ...operation, durationDays: 30, paymentReference: 'SECRET-2' });
    expect(loadPendingSubscriptionOperation(storage)).toMatchObject({ durationDays: 30 });
    expect(storage.values.get(ADMIN_PENDING_OPERATION_KEY)).not.toContain('SECRET-2');
  });
});

describe('Release recovery safety gates', () => {
  it.each([null, {}, { ok: false }, { ok: true, status: 'incomplete' }])('verifies an ambiguous mutation payload: %j', async payload => {
    const verify = vi.fn(async () => ({ status: 'not_found', requestId: REQUEST_ID }));
    const result = await reconcileSubscriptionOperation({ operation, submit: async () => payload, verify, verificationRetryDelaysMs: [] });
    expect(result.state).toBe('not_executed');
    expect(verify).toHaveBeenCalledWith(REQUEST_ID);
  });

  it.each([
    { requestId: ACCOUNT_ID }, { accountId: REQUEST_ID }, { action: 'EXPIRE_PREMIUM' }
  ])('rejects verification for a different operation: %j', async mismatch => {
    const result = await verifySubscriptionOperation({ operation, verify: async () => ({ status: 'success', requestId: REQUEST_ID, accountId: ACCOUNT_ID, ...mismatch }) });
    expect(result.state).toBe('uncertain');
  });

  it('does not permit retry while the server transaction is in progress', async () => {
    const result = await verifySubscriptionOperation({ operation, verify: async () => ({ status: 'in_progress', requestId: REQUEST_ID }), retryDelaysMs: [] });
    expect(result.state).toBe('uncertain');
    expect(canRetrySubscriptionOperation(result)).toBe(false);
  });

  it('re-enters a restored form only for the verified original account and action', () => {
    const result = { state: 'not_executed', operation };
    expect(canReenterSubscriptionOperation(result, operation, ACCOUNT_ID, operation.action)).toBe(true);
    expect(canReenterSubscriptionOperation(result, operation, REQUEST_ID, operation.action)).toBe(false);
    expect(canReenterSubscriptionOperation(result, operation, ACCOUNT_ID, 'EXPIRE_PREMIUM')).toBe(false);
    expect(canReenterSubscriptionOperation({ ...result, state: 'uncertain' }, operation, ACCOUNT_ID, operation.action)).toBe(false);
  });

  it('verifies a conflicting ID instead of discarding its recovery metadata', async () => {
    const result = await reconcileSubscriptionOperation({ operation, submit: async () => { throw new Error('request_id_conflict'); }, verify: async () => ({ status: 'success', requestId: REQUEST_ID, accountId: REQUEST_ID }) });
    expect(result.state).toBe('uncertain');
  });

  it('preserves the timeout classification when abort also rejects immediately', async () => {
    vi.useFakeTimers();
    const request = withAdminRequestTimeout(signal => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))), { timeoutMs: 20 });
    const assertion = expect(request).rejects.toBeInstanceOf(AdminSubscriptionTimeoutError);
    await vi.advanceTimersByTimeAsync(21);
    await assertion;
  });

  it('bounds refresh reads and ignores out-of-order customer details', () => {
    const source = fs.readFileSync(new URL('../../src/admin/AdminPremiumPage.jsx', import.meta.url), 'utf8');
    expect(source).toContain('withAdminRequestTimeout(signal => loadAdminConsoleSummary');
    expect(source).toContain('withAdminRequestTimeout(signal => searchAdminCustomers');
    expect(source).toContain('withAdminRequestTimeout(signal => loadAdminCustomerDetails');
    expect(source).toContain('if (!isCurrent()) return;');
    expect(source).toContain('void refreshAuthoritativeViews(result.operation.accountId)');
    expect(source).toContain('reenterPending ? pendingOperation.requestId : createRequestId()');
  });

  it('locks verification and mutation by request ID in both schema sources', () => {
    for (const path of ['supabase/migrations/20260907090000_admin_subscription_recovery.sql', 'supabase/schemas/public/functions/admin_console_v2.sql']) {
      const sql = fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
      expect(sql).toContain("pg_try_advisory_xact_lock(hashtextextended('admin-subscription:' || $1::text, 0))");
      expect(sql).toContain("pg_advisory_xact_lock(hashtextextended('admin-subscription:' || $8::text, 0))");
      expect(sql).toContain("lower(trim(coalesce(nullif($12, ''), 'manual')));");
      expect(sql).toContain("lower(trim(coalesce(nullif($14, ''), 'paid')));");
    }
  });
});
