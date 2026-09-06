import { CHILD_MERGED_BACKUP_PREFIX } from './learningSync.js';
import { applyScopedLearningSnapshot, isChildSensitiveStorageKey } from './childScopedStorage.js';
import { getLearningIdentityMismatch, getLearningStorageScope } from './studentIdentity.js';

export const LEARNING_IDENTITY_MIGRATION_PREFIX = 'jannati_learning_identity_migration:';

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ms')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sameLegacyLearner(left = {}, right = {}) {
  return Boolean(
    normalizeText(left.name)
    && normalizeText(left.name) === normalizeText(right.name)
    && normalizeText(left.year) === normalizeText(right.year)
  );
}

function readObject(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function collectLegacySnapshot(storage) {
  const snapshot = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && isChildSensitiveStorageKey(key)) snapshot[key] = storage.getItem(key);
  }
  return snapshot;
}

export function migrateLegacyStudentData({ storage, accountId = '', child = null, profiles = [] } = {}) {
  if (!storage || !child?.id) return { migrated: false, reason: 'missing-target' };
  const identity = getLearningStorageScope({ accountId, childId: child.id });
  const markerKey = `${LEARNING_IDENTITY_MIGRATION_PREFIX}${identity.scopeKey}`;
  try {
    if (storage.getItem(markerKey) === 'complete') return { migrated: false, reason: 'already-complete', identity };

    const firstChild = Array.isArray(profiles) ? profiles[0] : null;
    const legacyProfile = readObject(storage, 'jannati_v151_profile')
      || readObject(storage, 'jannati_v150_profile')
      || readObject(storage, 'jannati_v140_profile');
    const evidenceSupportsTarget = firstChild?.id === child.id
      && (profiles.length === 1 || sameLegacyLearner(legacyProfile || {}, child));
    if (!evidenceSupportsTarget) return { migrated: false, reason: 'insufficient-evidence', identity };

    const declaredChildId = String(legacyProfile?.childId || legacyProfile?.studentId || '').trim();
    const declaredAccountId = String(legacyProfile?.accountId || '').trim();
    const alreadyScoped = declaredChildId === identity.childId
      && (!declaredAccountId || declaredAccountId === identity.accountId)
      && !getLearningIdentityMismatch(legacyProfile || {}, identity);
    if (alreadyScoped) {
      try {
        storage.setItem(markerKey, 'complete');
      } catch {
        return { migrated: false, reason: 'already-scoped-marker-pending', identity };
      }
      return { migrated: false, reason: 'already-scoped', identity };
    }

    const legacySnapshot = collectLegacySnapshot(storage);
    if (!Object.keys(legacySnapshot).length) {
      storage.setItem(markerKey, 'complete');
      return { migrated: false, reason: 'nothing-to-migrate', identity };
    }

    const backupKey = `${CHILD_MERGED_BACKUP_PREFIX}legacy-identity-${encodeURIComponent(identity.scopeKey)}`;
    if (!storage.getItem(backupKey)) {
      storage.setItem(backupKey, JSON.stringify({
        version: 1,
        reason: 'legacy-identity-migration',
        migratedAt: new Date().toISOString(),
        identity,
        snapshot: legacySnapshot
      }));
    }

    const result = applyScopedLearningSnapshot(storage, legacySnapshot, identity);
    if (!result.ok) return { migrated: false, reason: 'migration-write-failed', identity, issues: result.issues, backupKey };
    try {
      storage.setItem(markerKey, 'complete');
    } catch {
      return { migrated: true, reason: 'scoped-marker-pending', identity, backupKey };
    }
    return { migrated: true, reason: 'scoped', identity, backupKey };
  } catch (error) {
    return {
      migrated: false,
      reason: error?.name === 'QuotaExceededError' ? 'storage-quota-exceeded' : 'storage-unavailable',
      identity
    };
  }
}

export default {
  LEARNING_IDENTITY_MIGRATION_PREFIX,
  migrateLegacyStudentData
};
