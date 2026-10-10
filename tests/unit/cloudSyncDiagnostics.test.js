import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CLOUD_SYNC_DIAGNOSTIC_KEY,
  initializeCloudSyncDiagnostic,
  recordCloudSyncDiagnostic,
  sanitizeCloudSyncDiagnosticText
} from '../../src/services/cloudSyncDiagnostics.js';
import {
  CHILD_SNAPSHOT_PREFIX,
  CLOUD_CHILD_STATE_KEY,
  CLOUD_SYNC_META_KEY,
  loadCloudLearningDataResult
} from '../../src/services/learningSync.js';
import { syncRevisionedCloudLearning } from '../../src/services/learningSyncCoordinator.js';

const ACCOUNT_ID = '11111111-2222-4333-8444-555555555555';
const CHILD_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const originalWindow = globalThis.window;

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    get length() { return values.size; }
  };
}

function enableDiagnostics(enabled = true) {
  globalThis.window = {
    location: { search: enabled ? '?cloudSyncDiag=1' : '' },
    sessionStorage: memoryStorage()
  };
  initializeCloudSyncDiagnostic();
  return globalThis.window;
}

function baseFailure(overrides = {}) {
  return {
    phase: 'write',
    rpc: 'save_learning_data_v4',
    status: 503,
    code: 'PGRST000',
    message: 'temporarily unavailable',
    attempt: 3,
    maxAttempts: 3,
    fallbackAttempted: false,
    conflictCount: 0,
    cachedEnvelopeUsed: true,
    currentRevision: 4,
    expectedRevision: 4,
    protocolVersion: 3,
    dirtyChildCount: 1,
    pendingMutation: true,
    accountScopeMatch: true,
    childScopeMatch: true,
    online: true,
    ...overrides
  };
}

function canonicalPayload(xp) {
  const profile = { id: CHILD_ID, childId: CHILD_ID, accountId: ACCOUNT_ID, xp };
  return {
    [CLOUD_CHILD_STATE_KEY]: JSON.stringify({
      version: 3,
      profiles: [profile],
      activeChildId: CHILD_ID,
      deletedChildren: {},
      archivedChildren: {}
    }),
    jannati_child_profiles: JSON.stringify([profile]),
    jannati_active_child_id: CHILD_ID,
    jannati_deleted_child_profiles: '{}',
    jannati_archived_child_profiles: '{}',
    jannati_v151_profile: JSON.stringify(profile),
    [`${CHILD_SNAPSHOT_PREFIX}${CHILD_ID}`]: JSON.stringify({
      __childSnapshotChildId: CHILD_ID,
      __childSnapshotAccountId: ACCOUNT_ID,
      __childSnapshotCapturedAt: 1_759_276_800_000,
      jannati_v151_profile: JSON.stringify(profile)
    }),
    [CLOUD_SYNC_META_KEY]: JSON.stringify({
      version: 3,
      activeChildId: CHILD_ID,
      deviceId: 'diagnostic-device',
      updatedAt: '2026-10-08T00:00:00.000Z'
    })
  };
}

function storedDiagnostic(target = globalThis.window) {
  const raw = target.sessionStorage.getItem(CLOUD_SYNC_DIAGNOSTIC_KEY);
  return raw ? JSON.parse(raw) : null;
}

beforeEach(() => {
  enableDiagnostics(true);
});

afterEach(() => {
  globalThis.window = originalWindow;
});

describe('P1.13 opt-in cloud sync diagnostics', () => {
  it('does not create or retain a diagnostic record when the query flag is disabled', () => {
    const target = globalThis.window;
    recordCloudSyncDiagnostic(baseFailure());
    expect(target.sessionStorage.getItem(CLOUD_SYNC_DIAGNOSTIC_KEY)).not.toBeNull();
    target.location.search = '';
    initializeCloudSyncDiagnostic();
    expect(recordCloudSyncDiagnostic(baseFailure())).toBeNull();
    expect(target.sessionStorage.getItem(CLOUD_SYNC_DIAGNOSTIC_KEY)).toBeNull();
    expect(target.__JANNATI_CLOUD_SYNC_DIAG__).toBeUndefined();
  });

  it('stores and exposes one sanitized latest record when enabled', () => {
    const record = recordCloudSyncDiagnostic(baseFailure());
    expect(storedDiagnostic()).toEqual(record);
    expect(globalThis.window.sessionStorage.length).toBe(1);
    expect(globalThis.window.__JANNATI_CLOUD_SYNC_DIAG__).toEqual(record);
    expect(Object.getOwnPropertyDescriptor(globalThis.window, '__JANNATI_CLOUD_SYNC_DIAG__')?.set).toBeUndefined();
  });

  it('overwrites the first failure with the second failure', () => {
    recordCloudSyncDiagnostic(baseFailure({ code: 'FIRST', message: 'first' }));
    recordCloudSyncDiagnostic(baseFailure({ code: 'SECOND', message: 'second' }));
    expect(storedDiagnostic()).toMatchObject({ code: 'SECOND', message: 'second' });
    expect(globalThis.window.sessionStorage.length).toBe(1);
  });

  it('redacts bearer values, JWTs, UUIDs, emails, URLs and long token-like strings', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signaturevalue';
    const uuidLike = '00000000-0000-0000-0000-000000000000';
    const message = `Bearer secret-token ${jwt} ${uuidLike} pupil@example.com https://example.com/rpc?apikey=secret abcdefghijklmnopqrstuvwxyz012345`;
    const sanitized = sanitizeCloudSyncDiagnosticText(message);
    expect(sanitized).toContain('[REDACTED_BEARER]');
    expect(sanitized).toContain('[REDACTED_JWT]');
    expect(sanitized).toContain('[REDACTED_UUID]');
    expect(sanitized).toContain('[REDACTED_EMAIL]');
    expect(sanitized).toContain('[REDACTED_URL]');
    expect(sanitized).toContain('[REDACTED_TOKEN]');
    expect(sanitized).not.toContain('secret-token');
    expect(sanitized).not.toContain(uuidLike);
    expect(sanitized).not.toContain('pupil@example.com');
  });

  it('bounds the stored error message to 160 characters', () => {
    recordCloudSyncDiagnostic(baseFailure({ message: Array.from({ length: 100 }, (_, index) => `word${index}`).join(' ') }));
    expect(storedDiagnostic().message.length).toBeGreaterThan(0);
    expect(storedDiagnostic().message.length).toBeLessThanOrEqual(160);
  });

  it('preserves the bounded client payload error code without weakening secret redaction', () => {
    recordCloudSyncDiagnostic(baseFailure({
      status: null,
      code: 'CLIENT_PAYLOAD_TOO_LARGE',
      message: 'cloud_learning_payload_exceeds_client_limit',
      attempt: 0
    }));
    expect(storedDiagnostic()).toMatchObject({
      status: null,
      code: 'CLIENT_PAYLOAD_TOO_LARGE',
      message: '[REDACTED_TOKEN]',
      attempt: 0
    });
  });

  it('records a read failure from the selected read RPC', async () => {
    const result = await loadCloudLearningDataResult({
      async rpc(name) {
        expect(name).toBe('get_learning_data_v3');
        return { data: null, error: { status: 401, code: 'PGRST301', message: 'permission denied' } };
      }
    }, { onDiagnostic: recordCloudSyncDiagnostic });

    expect(result.error).toBeTruthy();
    expect(storedDiagnostic()).toMatchObject({
      phase: 'read',
      rpc: 'get_learning_data_v3',
      status: 401,
      code: 'PGRST301',
      fallbackAttempted: false
    });
  });

  it('records a terminal v4 write failure without exposing the payload', async () => {
    const local = canonicalPayload(20);
    const result = await syncRevisionedCloudLearning({
      async rpc(name) {
        expect(name).toBe('save_learning_data_v4');
        return { data: null, error: { status: 403, code: '42501', message: 'permission denied' } };
      }
    }, local, {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: canonicalPayload(10), revision: 7, protocolVersion: 3, error: null },
      retryBaseDelayMs: 0,
      onDiagnostic: recordCloudSyncDiagnostic
    });

    expect(result.ok).toBe(false);
    expect(storedDiagnostic()).toMatchObject({
      phase: 'write',
      rpc: 'save_learning_data_v4',
      status: 403,
      code: '42501',
      currentRevision: 7,
      expectedRevision: 7,
      cachedEnvelopeUsed: true,
      dirtyChildCount: 1
    });
    expect(JSON.stringify(storedDiagnostic())).not.toContain('jannati_v151_profile');
    expect(storedDiagnostic()).not.toHaveProperty('payload');
  });

  it('marks v3 fallback only when the compatibility RPC is actually attempted', async () => {
    const calls = [];
    await syncRevisionedCloudLearning({
      async rpc(name) {
        calls.push(name);
        if (name === 'save_learning_data_v4') {
          return { data: null, error: { code: 'PGRST202', message: 'save_learning_data_v4 does not exist in schema cache' } };
        }
        return { data: null, error: { status: 400, code: 'P0001', message: 'legacy failure' } };
      }
    }, canonicalPayload(20), {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: canonicalPayload(10), revision: 2, protocolVersion: 3, error: null },
      retryBaseDelayMs: 0,
      onDiagnostic: recordCloudSyncDiagnostic
    });
    expect(calls).toEqual(['save_learning_data_v4', 'save_learning_data_v3']);
    expect(storedDiagnostic()).toMatchObject({ rpc: 'save_learning_data_v3', fallbackAttempted: true });

    await syncRevisionedCloudLearning({
      async rpc() {
        return { data: null, error: { status: 400, code: 'P0001', message: 'direct v4 failure' } };
      }
    }, canonicalPayload(30), {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: canonicalPayload(20), revision: 3, protocolVersion: 3, error: null },
      retryBaseDelayMs: 0,
      onDiagnostic: recordCloudSyncDiagnostic
    });
    expect(storedDiagnostic()).toMatchObject({ rpc: 'save_learning_data_v4', fallbackAttempted: false });
  });

  it('records the final bounded attempt after retry exhaustion', async () => {
    let attempts = 0;
    await syncRevisionedCloudLearning({
      async rpc() {
        attempts += 1;
        return { data: null, error: { status: 503, code: 'PGRST002', message: 'temporarily unavailable' } };
      }
    }, canonicalPayload(20), {
      accountId: ACCOUNT_ID,
      localActiveChildId: CHILD_ID,
      dirtyChildIds: [CHILD_ID],
      cloudEnvelope: { data: canonicalPayload(10), revision: 1, protocolVersion: 3, error: null },
      retryBaseDelayMs: 0,
      onDiagnostic: recordCloudSyncDiagnostic
    });
    expect(attempts).toBe(3);
    expect(storedDiagnostic()).toMatchObject({ attempt: 3, maxAttempts: 3 });
  });

  it('wires runtime exceptions at both App read and write boundaries', () => {
    const source = readFileSync('src/App.jsx', 'utf8');
    const queue = source.slice(source.indexOf('function queueCloudLearningSave'), source.indexOf('function scheduleCloudLearningSave'));
    const manual = source.slice(source.indexOf('async function syncLearningDataNow'), source.indexOf('async function loadLearningDataNow'));
    expect(queue).toMatch(/catch \(error\)[\s\S]{0,500}phase: 'runtime'/);
    expect(manual).toMatch(/catch \(error\)[\s\S]{0,500}phase: 'runtime'/);
  });

  it('uses a fixed allowlist so learner payload and arbitrary fields cannot be captured', () => {
    recordCloudSyncDiagnostic(baseFailure({
      payload: { lesson: 'private learner answer' },
      transcript: 'private transcript',
      audio: 'private audio',
      learnerContent: 'private content'
    }));
    const serialized = JSON.stringify(storedDiagnostic());
    expect(serialized).not.toContain('private');
    expect(storedDiagnostic()).not.toHaveProperty('payload');
    expect(storedDiagnostic()).not.toHaveProperty('transcript');
    expect(storedDiagnostic()).not.toHaveProperty('audio');
  });

  it('never captures account or child identifiers and redacts identifiers from messages', () => {
    recordCloudSyncDiagnostic(baseFailure({
      accountId: ACCOUNT_ID,
      childId: CHILD_ID,
      message: `account ${ACCOUNT_ID} child ${CHILD_ID}`
    }));
    const record = storedDiagnostic();
    const serialized = JSON.stringify(record);
    expect(record).not.toHaveProperty('accountId');
    expect(record).not.toHaveProperty('childId');
    expect(serialized).not.toContain(ACCOUNT_ID);
    expect(serialized).not.toContain(CHILD_ID);
    expect(record.message.match(/\[REDACTED_UUID\]/g)).toHaveLength(2);
  });
});
