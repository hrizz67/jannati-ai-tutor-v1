import { getLocalDateKey } from '../../utils/localDate.js';
import { getLearningIdentityMismatch, getLearningStorageScope, stampLearningIdentity } from '../../services/studentIdentity.js';

export const GAMIFICATION_STORAGE_KEY = 'jannati.gamification.profile';
export const GAMIFICATION_VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function hasStorage() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function toIsoDate(value, fallback = '') {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function uniqueEntries(values, keySelector = item => item?.id || item?.date || JSON.stringify(item)) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).filter(item => {
    const key = keySelector(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function createDefaultGamificationProfile(overrides = {}) {
  return {
    version: GAMIFICATION_VERSION,
    xp: 0,
    level: 1,
    coins: 0,
    currentStreak: 0,
    bestStreak: 0,
    brokenStreak: 0,
    recoveryStreak: 0,
    badges: [],
    achievements: [],
    dailyRewards: [],
    processedEventKeys: [],
    lastRewardDate: '',
    updatedAt: '',
    ...overrides
  };
}

function migrateGamificationProfile(rawProfile = {}) {
  const base = createDefaultGamificationProfile();
  const merged = {
    ...base,
    ...rawProfile,
    badges: uniqueEntries(Array.isArray(rawProfile.badges) ? rawProfile.badges : base.badges),
    achievements: uniqueEntries(Array.isArray(rawProfile.achievements) ? rawProfile.achievements : base.achievements),
    dailyRewards: uniqueEntries(Array.isArray(rawProfile.dailyRewards) ? rawProfile.dailyRewards : base.dailyRewards, item => item?.date || item?.id || JSON.stringify(item)),
    processedEventKeys: uniqueEntries(Array.isArray(rawProfile.processedEventKeys) ? rawProfile.processedEventKeys : base.processedEventKeys, item => item)
  };

  merged.version = GAMIFICATION_VERSION;
  merged.updatedAt = toIsoDate(rawProfile.updatedAt, base.updatedAt);
  merged.lastRewardDate = getLocalDateKey(rawProfile.lastRewardDate) || base.lastRewardDate;
  merged.xp = Math.max(0, Number(merged.xp) || 0);
  merged.level = Math.max(1, Number(merged.level) || 1);
  merged.coins = Math.max(0, Number(merged.coins) || 0);
  merged.currentStreak = Math.max(0, Number(merged.currentStreak) || 0);
  merged.bestStreak = Math.max(0, Number(merged.bestStreak) || 0);
  merged.brokenStreak = Math.max(0, Number(merged.brokenStreak) || 0);
  merged.recoveryStreak = Math.max(0, Number(merged.recoveryStreak) || 0);
  merged.processedEventKeys = Array.isArray(merged.processedEventKeys)
    ? [...new Set(merged.processedEventKeys.filter(key => typeof key === 'string' && key))]
    : [];
  return merged;
}

function createScopedDefault(identityInput = {}) {
  const identity = getLearningStorageScope(identityInput);
  const fresh = clone(createDefaultGamificationProfile());
  return identity.explicit ? stampLearningIdentity(fresh, identity) : fresh;
}

export function loadGamificationProfile(identityInput = {}) {
  const identity = getLearningStorageScope(identityInput);
  if (!hasStorage()) {
    return createScopedDefault(identity);
  }

  try {
    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!raw) return createScopedDefault(identity);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createScopedDefault(identity);
    if (getLearningIdentityMismatch(parsed, identity)) return createScopedDefault(identity);
    const migrated = migrateGamificationProfile(parsed);
    return identity.explicit ? stampLearningIdentity(migrated, identity) : migrated;
  } catch {
    return createScopedDefault(identity);
  }
}

export function saveGamificationProfile(profile = createDefaultGamificationProfile(), identityInput = profile) {
  const identity = getLearningStorageScope(identityInput);
  if (getLearningIdentityMismatch(profile, identity)) return loadGamificationProfile(identity);
  const migrated = migrateGamificationProfile(profile);
  const safeProfile = identity.explicit ? stampLearningIdentity(migrated, identity) : migrated;

  if (hasStorage()) {
    try {
      const currentRaw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
      if (currentRaw) {
        try {
          const currentParsed = JSON.parse(currentRaw);
          if (getLearningIdentityMismatch(currentParsed, identity)) return safeProfile;
          const current = migrateGamificationProfile(currentParsed);
          const currentUpdatedAt = new Date(current.updatedAt || 0).getTime();
          const incomingUpdatedAt = new Date(safeProfile.updatedAt || 0).getTime();
          if (currentUpdatedAt > incomingUpdatedAt) {
            return current;
          }
        } catch {
          // Ignore corrupted current storage and overwrite below.
        }
      }
      localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(safeProfile));
    } catch {
      // Gamification persistence must never block the app.
    }
  }

  return safeProfile;
}

export function resetGamificationProfile() {
  const fresh = clone(createDefaultGamificationProfile());
  if (hasStorage()) {
    try {
      localStorage.removeItem(GAMIFICATION_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }
  return fresh;
}

export default {
  GAMIFICATION_STORAGE_KEY,
  GAMIFICATION_VERSION,
  createDefaultGamificationProfile,
  loadGamificationProfile,
  saveGamificationProfile,
  resetGamificationProfile
};
