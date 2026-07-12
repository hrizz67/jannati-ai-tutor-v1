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
  merged.lastRewardDate = toIsoDate(rawProfile.lastRewardDate, base.lastRewardDate).slice(0, 10);
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

export function loadGamificationProfile() {
  if (!hasStorage()) {
    return clone(createDefaultGamificationProfile());
  }

  try {
    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!raw) return clone(createDefaultGamificationProfile());
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return clone(createDefaultGamificationProfile());
    return migrateGamificationProfile(parsed);
  } catch {
    return clone(createDefaultGamificationProfile());
  }
}

export function saveGamificationProfile(profile = createDefaultGamificationProfile()) {
  const safeProfile = migrateGamificationProfile(profile);

  if (hasStorage()) {
    try {
      const currentRaw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
      if (currentRaw) {
        try {
          const current = migrateGamificationProfile(JSON.parse(currentRaw));
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
