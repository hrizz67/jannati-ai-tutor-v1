import { DEFAULT_PROFILE, PROFILE_VERSION, createDefaultProfile } from './studentProfile.js';

const STORAGE_KEY = 'jannati.adaptive.studentProfile';

function hasStorage() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function cloneProfile(profile) {
  return JSON.parse(JSON.stringify(profile));
}

function migrateProfile(rawProfile = {}) {
  const base = createDefaultProfile();
  const merged = {
    ...base,
    ...rawProfile,
    subjects: {
      ...base.subjects,
      ...(rawProfile.subjects || {})
    },
    topics: {
      ...base.topics,
      ...(rawProfile.topics || {})
    }
  };

  merged.version = PROFILE_VERSION;
  return merged;
}

export function loadProfile() {
  if (!hasStorage()) {
    return cloneProfile(DEFAULT_PROFILE);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneProfile(DEFAULT_PROFILE);
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return cloneProfile(DEFAULT_PROFILE);
    }

    return migrateProfile(parsed);
  } catch {
    return cloneProfile(DEFAULT_PROFILE);
  }
}

export function saveProfile(profile = DEFAULT_PROFILE) {
  const safeProfile = migrateProfile(profile);

  if (!hasStorage()) {
    return safeProfile;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeProfile));
  } catch {
    // Ignore storage write failures so adaptive learning never crashes the app.
  }

  return safeProfile;
}

export function resetProfile() {
  const freshProfile = cloneProfile(DEFAULT_PROFILE);

  if (hasStorage()) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage removal failures.
    }
  }

  return freshProfile;
}
