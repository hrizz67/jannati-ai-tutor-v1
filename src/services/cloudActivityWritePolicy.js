export const CLOUD_WRITE_DEBOUNCE_MS = 700;

/**
 * Keep question-level changes in the local outbox until the learner reaches an
 * activity boundary. The outbox remains durable; this policy only decides
 * whether a network write timer may start.
 */
export function createCloudActivityWritePolicy() {
  let activity = null;
  let deferredMutations = 0;

  return {
    begin({ activityId = '', childId = '' } = {}) {
      activity = {
        activityId: String(activityId || 'learning-activity'),
        childId: String(childId || '')
      };
      deferredMutations = 0;
    },
    deferMutation(childId = '') {
      if (!activity) return false;
      const mutationChildId = String(childId || '');
      if (activity.childId && mutationChildId && activity.childId !== mutationChildId) return false;
      deferredMutations += 1;
      return true;
    },
    isActive(childId = '') {
      if (!activity) return false;
      const requestedChildId = String(childId || '');
      return !activity.childId || !requestedChildId || activity.childId === requestedChildId;
    },
    finish() {
      const result = {
        wasActive: Boolean(activity),
        shouldFlush: Boolean(activity && deferredMutations > 0),
        deferredMutations,
        activityId: activity?.activityId || '',
        childId: activity?.childId || ''
      };
      activity = null;
      deferredMutations = 0;
      return result;
    },
    reset() {
      activity = null;
      deferredMutations = 0;
    },
    snapshot() {
      return {
        active: Boolean(activity),
        activityId: activity?.activityId || '',
        childId: activity?.childId || '',
        deferredMutations
      };
    }
  };
}
