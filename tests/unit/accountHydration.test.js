import { describe, expect, it, vi } from 'vitest';
import { settleAccountHydration } from '../../src/services/accountHydration.js';

describe('account hydration', () => {
  it('returns both remote results when they complete in time', async () => {
    const result = await settleAccountHydration({
      loadProfile: async () => ({ data: { id: 'account-1' }, error: null }),
      loadLearning: async () => ({ data: { progress: true }, error: null }),
      loadAccess: async () => ({ data: { access_status: 'premium' }, error: null }),
      timeoutMs: 100
    });

    expect(result.timedOut).toBe(false);
    expect(result.profileResult.data.id).toBe('account-1');
    expect(result.learningResult.data.progress).toBe(true);
    expect(result.accessResult.data.access_status).toBe('premium');
  });

  it('contains a rejected request without discarding the other result', async () => {
    const result = await settleAccountHydration({
      loadProfile: async () => { throw new Error('profile_failed'); },
      loadLearning: async () => ({ data: { progress: true }, error: null }),
      loadAccess: async () => ({ data: { access_status: 'free' }, error: null }),
      timeoutMs: 100
    });

    expect(result.timedOut).toBe(false);
    expect(result.profileResult.error.message).toBe('profile_failed');
    expect(result.learningResult.data.progress).toBe(true);
  });

  it('aborts and returns a safe timeout result instead of hanging login', async () => {
    vi.useFakeTimers();
    const loadProfile = vi.fn(signal => new Promise(resolve => {
      signal?.addEventListener('abort', () => resolve({ data: null, error: signal.reason }));
    }));
    const pendingLearning = new Promise(() => {});
    const hydration = settleAccountHydration({
      loadProfile,
      loadLearning: () => pendingLearning,
      loadAccess: () => pendingLearning,
      timeoutMs: 20
    });

    await vi.advanceTimersByTimeAsync(20);
    const result = await hydration;
    vi.useRealTimers();

    expect(result.timedOut).toBe(true);
    expect(result.profileResult.error.name).toBe('TimeoutError');
    expect(result.accessResult.error.name).toBe('TimeoutError');
    expect(loadProfile.mock.calls[0][0].aborted).toBe(true);
  });
});
