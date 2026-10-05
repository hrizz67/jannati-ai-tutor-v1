export function createBoundedRecoveryNoticeTracker(limit = 16) {
  const seen = new Set();
  const order = [];
  const maxEntries = Math.max(1, Number(limit) || 16);

  return {
    shouldAnnounce(input = {}) {
      const accountId = String(input.accountId || 'guest').trim() || 'guest';
      const reason = String(input.reason || 'recovery_cache_unavailable').trim();
      const failedKey = String(input.failedKey || '').trim();
      const key = `${accountId}::${reason}::${failedKey}`;
      if (seen.has(key)) return false;
      seen.add(key);
      order.push(key);
      while (order.length > maxEntries) seen.delete(order.shift());
      return true;
    },
    get size() {
      return seen.size;
    }
  };
}

export default { createBoundedRecoveryNoticeTracker };
