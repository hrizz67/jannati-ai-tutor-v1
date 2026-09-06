import { DEFAULT_PROFILE, PROFILE_VERSION, createDefaultProfile } from './studentProfile.js';
import { getLearningIdentityMismatch, getLearningStorageScope, stampLearningIdentity } from '../../services/studentIdentity.js';

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

function createScopedDefault(identityInput = {}) {
  const identity = getLearningStorageScope(identityInput);
  const fresh = cloneProfile(DEFAULT_PROFILE);
  return identity.explicit ? stampLearningIdentity(fresh, identity) : fresh;
}

export function loadProfile(identityInput = {}) {
  const identity = getLearningStorageScope(identityInput);
  if (!hasStorage()) {
    return createScopedDefault(identity);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createScopedDefault(identity);
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return createScopedDefault(identity);
    }
    if (getLearningIdentityMismatch(parsed, identity)) return createScopedDefault(identity);
    const migrated = migrateProfile(parsed);
    return identity.explicit ? stampLearningIdentity(migrated, identity) : migrated;
  } catch {
    return createScopedDefault(identity);
  }
}

export function saveProfile(profile = DEFAULT_PROFILE, identityInput = profile) {
  const identity = getLearningStorageScope(identityInput);
  if (getLearningIdentityMismatch(profile, identity)) return loadProfile(identity);
  const migrated = migrateProfile(profile);
  const safeProfile = identity.explicit ? stampLearningIdentity(migrated, identity) : migrated;

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
