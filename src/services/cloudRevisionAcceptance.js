const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function normalizeOwner(owner = {}) {
  return {
    accountId: String(owner.accountId || '').trim(),
    childId: String(owner.childId || '').trim(),
    year: String(owner.year || '').trim()
  };
}

const ownerKey = owner => JSON.stringify(Object.values(normalizeOwner(owner)));

function getCloudRevisionFingerprint(result = {}) {
  try {
    return JSON.stringify([result.protocolVersion, result.data]);
  } catch {
    return '';
  }
}

// This is the single synchronous reservation point for cloud reads and write
// acknowledgements. A newer revision or owner epoch invalidates older tokens
// before their delayed projection, signature or outbox side effects can run.
export function createCloudRevisionAcceptancePolicy(initialOwner = {}) {
  let owner = normalizeOwner(initialOwner);
  let key = ownerKey(owner);
  let epoch = 0;
  let generation = 0;
  let current = null;

  const isCurrent = token => owner.year === 'Tahun 2'
    && Boolean(owner.accountId && owner.childId && token)
    && token.key === key
    && token.epoch === epoch;
  const reject = reason => ({ accepted: false, reason });
  const createToken = () => ({ key, epoch, generation });

  return {
    setOwner(nextOwner = {}) {
      const normalized = normalizeOwner(nextOwner);
      const nextKey = ownerKey(normalized);
      if (nextKey === key) return false;
      const accountChanged = normalized.accountId !== owner.accountId;
      owner = normalized;
      key = nextKey;
      epoch += 1;
      generation += 1;
      if (accountChanged) current = null;
      return true;
    },
    invalidate() {
      epoch += 1;
      generation += 1;
    },
    reset() {
      epoch += 1;
      generation += 1;
      current = null;
    },
    capture: () => ({ key, epoch }),
    isCurrent,
    accept(token, result = {}, { accountId = '' } = {}) {
      if (!isCurrent(token)) return reject('stale_owner');
      if (String(accountId || '').trim() !== owner.accountId) return reject('wrong_account');
      const revision = result.revision;
      const protocolVersion = result.protocolVersion;
      if (result.error || !isRecord(result.data)
        || !Number.isSafeInteger(revision) || revision < 0
        || !Number.isSafeInteger(protocolVersion) || protocolVersion < 1) {
        return reject('invalid_envelope');
      }
      const fingerprint = getCloudRevisionFingerprint(result);
      if (!fingerprint) return reject('invalid_envelope');
      if (current) {
        if (revision < current.revision) return reject('stale_revision');
        if (revision === current.revision && fingerprint !== current.fingerprint) {
          return reject('conflicting_revision');
        }
        if (revision === current.revision) return {
          accepted: true,
          advanced: false,
          token: createToken()
        };
      }
      generation += 1;
      const envelope = { ...result, accountId: owner.accountId };
      current = { revision, fingerprint, envelope };
      return {
        accepted: true,
        advanced: true,
        envelope,
        token: createToken()
      };
    },
    commit(token) {
      return isCurrent(token) && current && token.generation === generation
        ? current.envelope
        : null;
    },
    isAccepted(token) {
      return isCurrent(token)
        && Boolean(current)
        && token.generation === generation;
    }
  };
}
