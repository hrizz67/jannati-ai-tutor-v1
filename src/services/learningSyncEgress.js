import {
  CLOUD_SYNC_PROTOCOL_VERSION,
  loadCloudLearningDataResult
} from './learningSync.js';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeRevision(value) {
  const revision = Number(value);
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : null;
}

function isMissingRevisionRpc(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || error || '');
  return code === 'PGRST202'
    || code === '42883'
    || /get_learning_revision_v1|schema cache|does not exist/i.test(message);
}

export async function loadCloudLearningRevisionResult(client, options = {}) {
  if (!client) {
    return {
      revision: 0,
      protocolVersion: 0,
      serverUpdatedAt: '',
      migrationRequired: false,
      error: new Error('cloud_client_unavailable')
    };
  }
  try {
    const request = client.rpc('get_learning_revision_v1');
    const { data, error } = await (options.signal && typeof request?.abortSignal === 'function'
      ? request.abortSignal(options.signal)
      : request);
    if (error) {
      return {
        revision: 0,
        protocolVersion: 0,
        serverUpdatedAt: '',
        migrationRequired: isMissingRevisionRpc(error),
        error
      };
    }
    const envelope = isObject(data) ? data : {};
    const revision = normalizeRevision(envelope.revision);
    const protocolVersion = Number(envelope.protocolVersion) || 0;
    if (revision === null || protocolVersion < CLOUD_SYNC_PROTOCOL_VERSION) {
      return {
        revision: 0,
        protocolVersion,
        serverUpdatedAt: '',
        migrationRequired: protocolVersion < CLOUD_SYNC_PROTOCOL_VERSION,
        error: new Error('invalid_learning_revision_envelope')
      };
    }
    return {
      revision,
      protocolVersion,
      serverUpdatedAt: String(envelope.serverUpdatedAt || ''),
      migrationRequired: false,
      error: null
    };
  } catch (error) {
    return {
      revision: 0,
      protocolVersion: 0,
      serverUpdatedAt: '',
      migrationRequired: isMissingRevisionRpc(error),
      error
    };
  }
}

export async function loadCloudLearningDataIfChanged(client, {
  knownRevision = 0,
  signaledRevision,
  signaledServerUpdatedAt = '',
  signal
} = {}) {
  const normalizedKnownRevision = normalizeRevision(knownRevision) ?? 0;
  const normalizedSignal = normalizeRevision(signaledRevision);
  const revisionResult = normalizedSignal === null
    ? await loadCloudLearningRevisionResult(client, { signal })
    : {
      revision: normalizedSignal,
      protocolVersion: CLOUD_SYNC_PROTOCOL_VERSION,
      serverUpdatedAt: String(signaledServerUpdatedAt || ''),
      migrationRequired: false,
      error: null
    };

  if (revisionResult.error || revisionResult.revision <= normalizedKnownRevision) {
    return { ...revisionResult, changed: false, data: null };
  }

  const cloudResult = await loadCloudLearningDataResult(client, { signal });
  return {
    ...cloudResult,
    changed: !cloudResult.error,
    migrationRequired: false
  };
}

export function startCloudLearningRevisionSync({
  client,
  accountId,
  getKnownRevision,
  hasPendingChanges,
  isWritePending,
  getLastMutationAt,
  queuePendingSave,
  isCurrentAccount,
  onCloudData,
  onError,
  onMigrationRequired,
  pollIntervalMs = 60000,
  windowTarget = globalThis.window,
  documentTarget = globalThis.document,
  navigatorTarget = globalThis.navigator,
  now = () => Date.now()
} = {}) {
  let cancelled = false;
  let inFlight = false;
  let requestController = null;
  const isVisible = () => documentTarget?.visibilityState !== 'hidden';
  const isOnline = () => navigatorTarget?.onLine !== false;
  const isCurrent = () => !cancelled && (!isCurrentAccount || isCurrentAccount());

  const checkNow = async ({ signaledRevision, signaledServerUpdatedAt } = {}) => {
    if (!isCurrent() || inFlight || !isVisible() || !isOnline()) return { skipped: true };
    if (hasPendingChanges?.()) {
      queuePendingSave?.();
      return { skipped: true };
    }
    if (isWritePending?.() || now() - Number(getLastMutationAt?.() || 0) < 5000) {
      return { skipped: true };
    }

    inFlight = true;
    requestController = typeof AbortController === 'function' ? new AbortController() : null;
    try {
      const result = await loadCloudLearningDataIfChanged(client, {
        knownRevision: getKnownRevision?.() || 0,
        signaledRevision,
        signaledServerUpdatedAt,
        signal: requestController?.signal
      });
      if (!isCurrent()) return { skipped: true };
      if (result.migrationRequired) onMigrationRequired?.(result.error);
      else if (result.error) onError?.(result.error);
      else if (result.changed && result.data) await onCloudData?.(result);
      return result;
    } finally {
      inFlight = false;
      requestController = null;
    }
  };

  const onRealtimeChange = payload => {
    const row = payload?.new;
    if (row?.id && String(row.id) !== String(accountId)) return;
    void checkNow({
      signaledRevision: normalizeRevision(row?.learning_revision) ?? undefined,
      signaledServerUpdatedAt: row?.updated_at
    });
  };
  const onFocus = () => { void checkNow(); };
  const onOnline = () => { void checkNow(); };
  const onVisibilityChange = () => {
    if (isVisible()) void checkNow();
  };

  const realtimeChannel = typeof client?.channel === 'function'
    ? client
      .channel(`learning-revision:${accountId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${accountId}`,
        select: ['id', 'learning_revision', 'updated_at']
      }, onRealtimeChange)
      .subscribe()
    : null;
  const interval = windowTarget?.setInterval?.(
    () => { void checkNow(); },
    Math.max(60000, Number(pollIntervalMs) || 60000)
  );
  windowTarget?.addEventListener?.('focus', onFocus);
  windowTarget?.addEventListener?.('online', onOnline);
  documentTarget?.addEventListener?.('visibilitychange', onVisibilityChange);

  return {
    checkNow,
    dispose() {
      cancelled = true;
      requestController?.abort();
      if (interval !== undefined) windowTarget?.clearInterval?.(interval);
      if (realtimeChannel && typeof client?.removeChannel === 'function') void client.removeChannel(realtimeChannel);
      windowTarget?.removeEventListener?.('focus', onFocus);
      windowTarget?.removeEventListener?.('online', onOnline);
      documentTarget?.removeEventListener?.('visibilitychange', onVisibilityChange);
    }
  };
}
