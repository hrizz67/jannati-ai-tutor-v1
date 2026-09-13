import {
  CLOUD_SYNC_PROTOCOL_VERSION,
  loadCloudLearningDataResult,
  mergeCloudLearningPayload
} from './learningSync.js';
import { compactCloudLearningPayload, getCloudLearningPayloadSizeError, getPendingResumeTombstones } from './cloudPayloadCompaction.js';

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function isMissingRevisionedRpc(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || error || '');
  return code === 'PGRST202' || code === '42883' || /schema cache|does not exist/i.test(message);
}

function operationId() {
  try { return crypto.randomUUID(); } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, token => {
      const value = Math.floor(Math.random() * 16);
      return (token === 'x' ? value : (value & 0x3) | 0x8).toString(16);
    });
  }
}

function isRetryable(error) {
  const rawStatus = error?.status ?? error?.statusCode;
  const status = Number(rawStatus);
  const code = String(error?.code || '');
  const message = String(error?.message || error || '');
  if (code === 'P0001' && /learning_payload_too_large/i.test(message)) return false;
  return (rawStatus !== undefined && status === 0)
    || status === 408
    || status === 429
    || status >= 500
    || ['57014', 'PGRST000', 'PGRST001', 'PGRST002'].includes(code)
    || /failed to fetch|fetch failed|network|timeout|timed out|connection|temporarily unavailable/i.test(message);
}

export async function saveRevisionedCloudLearningData(client, {
  payload = {},
  expectedRevision = 0,
  operationId: requestOperationId = operationId(),
  deviceId = '',
  dirtyChildIds = [],
  transportMaxAttempts = 3,
  retryBaseDelayMs = 300
} = {}) {
  if (!client || !isObject(payload)) return { ok: false, conflict: false, error: new Error('invalid_revisioned_sync_request') };
  const sizeError = getCloudLearningPayloadSizeError(payload);
  if (sizeError) return { ok: false, unchanged: false, conflict: false, operationId: requestOperationId, error: sizeError };
  const maxAttempts = Math.max(1, Math.min(3, Number(transportMaxAttempts) || 1));
  const rpcArguments = {
    payload,
    expected_revision: Number(expectedRevision) || 0,
    operation_id: requestOperationId,
    device_id: String(deviceId || ''),
    dirty_child_ids: [...new Set((dirtyChildIds || []).map(String).filter(Boolean))]
  };
  let lastError = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      let response = await client.rpc('save_learning_data_v4', rpcArguments);
      if (isMissingRevisionedRpc(response?.error) && /save_learning_data_v4/i.test(String(response.error?.message || ''))) {
        response = await client.rpc('save_learning_data_v3', rpcArguments);
      }
      const { data, error } = response;
      if (error) {
        lastError = error;
        if (!isRetryable(error) || attempt + 1 >= maxAttempts) break;
      } else {
        const result = isObject(data) ? data : {};
        return {
          ok: Boolean(result.ok),
          unchanged: Boolean(result.unchanged),
          conflict: Boolean(result.conflict),
          duplicate: Boolean(result.duplicate),
          payload: isObject(result.payload) ? result.payload : null,
          revision: Number(result.revision) || 0,
          serverUpdatedAt: String(result.serverUpdatedAt || ''),
          operationId: requestOperationId,
          error: null
        };
      }
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt + 1 >= maxAttempts) break;
    }
    await new Promise(resolve => setTimeout(resolve, Math.max(0, (Number(retryBaseDelayMs) || 0) * (2 ** attempt))));
  }
  return { ok: false, unchanged: false, conflict: false, operationId: requestOperationId, error: lastError || new Error('cloud_sync_transport_failed') };
}

export async function syncRevisionedCloudLearning(client, localPayload = {}, options = {}) {
  const maxAttempts = Math.max(1, Math.min(5, Number(options.maxAttempts) || 4));
  let envelope = options.cloudEnvelope || await loadCloudLearningDataResult(client);
  if (envelope.error) return { ok: false, conflict: false, error: envelope.error };
  if (envelope.protocolVersion < CLOUD_SYNC_PROTOCOL_VERSION) {
    return { ok: false, conflict: false, protocolVersion: envelope.protocolVersion, error: new Error('cloud_sync_migration_required') };
  }
  let conflictCount = 0;
  const pendingResumeTombstones = getPendingResumeTombstones(localPayload, { accountId: options.accountId });
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const requestOperationId = attempt === 0 && options.operationId ? options.operationId : operationId();
    const mergedPayload = mergeCloudLearningPayload(localPayload, envelope.data, { ...options, mergeDirtySnapshots: true });
    const payload = compactCloudLearningPayload(mergedPayload, [localPayload, envelope.data], {
      accountId: options.accountId,
      childId: options.localActiveChildId
    });
    const result = await saveRevisionedCloudLearningData(client, {
      payload,
      expectedRevision: envelope.revision,
      operationId: requestOperationId,
      deviceId: options.deviceId,
      dirtyChildIds: options.dirtyChildIds,
      transportMaxAttempts: options.transportMaxAttempts,
      retryBaseDelayMs: options.retryBaseDelayMs
    });
    if (result.ok) return {
      ...result,
      payload: result.payload || payload,
      protocolVersion: CLOUD_SYNC_PROTOCOL_VERSION,
      conflictCount,
      acknowledgedResumeTombstones: pendingResumeTombstones
    };
    if (!result.conflict) return { ...result, conflictCount };
    conflictCount += 1;
    envelope = {
      data: result.payload,
      revision: result.revision,
      protocolVersion: CLOUD_SYNC_PROTOCOL_VERSION,
      serverUpdatedAt: result.serverUpdatedAt,
      error: null
    };
  }
  return { ok: false, conflict: true, conflictCount, error: new Error('cloud_sync_conflict_retry_exhausted') };
}
