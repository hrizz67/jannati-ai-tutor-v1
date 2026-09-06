import { describe, expect, it } from 'vitest';
import { applyScopedLearningSnapshot } from '../../src/services/childScopedStorage.js';
import {
  LEARNING_IDENTITY_MIGRATION_PREFIX,
  migrateLegacyStudentData
} from '../../src/services/legacyStudentMigration.js';
import { CHILD_MERGED_BACKUP_PREFIX } from '../../src/services/learningSync.js';
import { getLearningStorageScope, stampLearningIdentity } from '../../src/services/studentIdentity.js';

class MemoryStorage {
  constructor(seed = {}, shouldThrow = () => false) {
    this.values = new Map(Object.entries(seed).map(([key, value]) => [String(key), String(value)]));
    this.shouldThrow = shouldThrow;
  }

  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  removeItem(key) { this.values.delete(String(key)); }
  setItem(key, value) {
    if (this.shouldThrow(String(key), String(value))) {
      const error = new Error('storage quota reached');
      error.name = 'QuotaExceededError';
      throw error;
    }
    this.values.set(String(key), String(value));
  }
}

const accountId = 'account-1';
const child = { id: 'child-1', name: 'Fayyadh', year: 'Tahun 2' };
const identity = getLearningStorageScope({ accountId, childId: child.id });

describe('transactional learning storage', () => {
  it('rolls back every write when a scoped snapshot exceeds browser storage', () => {
    let throwOnce = true;
    const originalProfile = JSON.stringify(stampLearningIdentity({ xp: 140 }, identity));
    const originalAdaptive = JSON.stringify(stampLearningIdentity({ xp: 140 }, identity));
    const storage = new MemoryStorage({
      jannati_v151_profile: originalProfile,
      'jannati.adaptive.studentProfile': originalAdaptive
    }, key => {
      if (key === 'jannati.adaptive.studentProfile' && throwOnce) {
        throwOnce = false;
        return true;
      }
      return false;
    });

    const result = applyScopedLearningSnapshot(storage, {
      jannati_v151_profile: JSON.stringify({ xp: 970 }),
      'jannati.adaptive.studentProfile': JSON.stringify({ xp: 970 })
    }, identity);

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({ key: '', reason: 'storage-quota-exceeded' });
    expect(storage.getItem('jannati_v151_profile')).toBe(originalProfile);
    expect(storage.getItem('jannati.adaptive.studentProfile')).toBe(originalAdaptive);
  });

  it('contains a legacy-backup quota failure without changing learning data', () => {
    const originalProfile = JSON.stringify({ name: child.name, year: child.year, xp: 970 });
    const storage = new MemoryStorage({ jannati_v151_profile: originalProfile }, key => (
      key.startsWith(CHILD_MERGED_BACKUP_PREFIX)
    ));

    const result = migrateLegacyStudentData({ storage, accountId, child, profiles: [child] });

    expect(result.migrated).toBe(false);
    expect(result.reason).toBe('storage-quota-exceeded');
    expect(storage.getItem('jannati_v151_profile')).toBe(originalProfile);
    expect(storage.getItem(`${LEARNING_IDENTITY_MIGRATION_PREFIX}${identity.scopeKey}`)).toBeNull();
  });

  it('does not duplicate a backup when learning data is already child-scoped', () => {
    const storage = new MemoryStorage({
      jannati_v151_profile: JSON.stringify(stampLearningIdentity({
        name: child.name,
        year: child.year,
        xp: 970
      }, identity))
    });

    const result = migrateLegacyStudentData({ storage, accountId, child, profiles: [child] });

    expect(result).toMatchObject({ migrated: false, reason: 'already-scoped' });
    expect([...storage.values.keys()].some(key => key.startsWith(CHILD_MERGED_BACKUP_PREFIX))).toBe(false);
    expect(storage.getItem(`${LEARNING_IDENTITY_MIGRATION_PREFIX}${identity.scopeKey}`)).toBe('complete');
  });
});
