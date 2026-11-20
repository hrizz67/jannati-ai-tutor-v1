import { recoverOrphanedCloudOutbox } from './learningSync.js';

function normalizeChildId(childId) {
  return String(childId || '').trim();
}

/**
 * Atomically records a child-level cloud mutation. A pending account marker is
 * only valid when it has a concrete child outbox entry.
 */
export function markCloudMutation(dirtyChildIds, mutationVersions, childId) {
  const normalizedChildId = normalizeChildId(childId);
  if (!normalizedChildId || !dirtyChildIds || !mutationVersions) {
    return { marked: false, childId: '', mutationVersion: 0 };
  }
  const mutationVersion = (mutationVersions.get(normalizedChildId) || 0) + 1;
  dirtyChildIds.add(normalizedChildId);
  mutationVersions.set(normalizedChildId, mutationVersion);
  return { marked: true, childId: normalizedChildId, mutationVersion };
}

/**
 * Clears only the mutations included in an acknowledged write. Mutations that
 * arrived while the request was in flight remain queued.
 */
export function acknowledgeCloudMutations(dirtyChildIds, mutationVersions, submittedMutationVersions) {
  for (const [childId, submittedVersion] of submittedMutationVersions || []) {
    if ((mutationVersions.get(childId) || 0) !== submittedVersion) continue;
    dirtyChildIds.delete(childId);
    mutationVersions.delete(childId);
  }
  return [...dirtyChildIds];
}

/**
 * Applies the fallible local effects of an acknowledged server save in a
 * strict order. Outboxes must remain pending when merged metadata cannot be
 * persisted or an earlier acknowledgement step fails.
 */
export function applyCloudPostSaveEffects({
  applyMetadata,
  acknowledgeResume,
  acknowledgeMutations
} = {}) {
  let metadataResult;
  try {
    metadataResult = applyMetadata?.();
  } catch (error) {
    return { ok: false, phase: 'local_metadata', error };
  }
  if (!metadataResult?.persisted) {
    return { ok: false, phase: 'local_metadata', error: null };
  }

  try {
    const pendingResumeDelete = Boolean(acknowledgeResume?.());
    const remainingDirtyChildIds = acknowledgeMutations?.() || [];
    return {
      ok: true,
      phase: 'complete',
      activeChildId: String(metadataResult.activeChildId || ''),
      pendingResumeDelete,
      remainingDirtyChildIds
    };
  } catch (error) {
    return { ok: false, phase: 'outbox_acknowledgement', error };
  }
}

/**
 * Resolves a legacy/interrupted pending marker against the cached cloud
 * envelope. It either reconstructs a child outbox or proves the marker stale.
 */
export function resolvePendingCloudOutbox({
  pending = false,
  dirtyChildIds = [],
  localPayload = {},
  cloudPayload = {},
  localActiveChildId = '',
  accountId = ''
} = {}) {
  return recoverOrphanedCloudOutbox(localPayload, cloudPayload, {
    pending,
    dirtyChildIds,
    localActiveChildId,
    accountId
  });
}

export default {
  acknowledgeCloudMutations,
  applyCloudPostSaveEffects,
  markCloudMutation,
  resolvePendingCloudOutbox
};
