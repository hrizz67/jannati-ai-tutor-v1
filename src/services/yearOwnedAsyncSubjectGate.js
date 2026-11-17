// Small, fail-closed lease for Year 2 subject promises. It has no storage,
// network or browser dependencies and never changes the requested subject bank.
export function createYear2AsyncOwnerGate(initialOwner = {}) {
  const ownerKey = owner => JSON.stringify([
    String(owner?.accountId || ''),
    String(owner?.childId || ''),
    String(owner?.year || '')
  ]);
  let key = ownerKey(initialOwner);
  let year = String(initialOwner?.year || '');
  let epoch = 0;

  return {
    setOwner(owner = {}) {
      const next = ownerKey(owner);
      if (next === key) return false;
      key = next;
      year = String(owner?.year || '');
      epoch += 1;
      return true;
    },
    invalidate() { epoch += 1; },
    capture() { return { key, epoch }; },
    isCurrent(token) {
      return year === 'Tahun 2' && Boolean(token)
        && token.key === key && token.epoch === epoch;
    }
  };
}
