import { createCanonicalProgress } from './canonicalProgress.js';
import { calculateLevelProgress } from '../gamification/levelEngine.js';

export const CANONICAL_GAMIFICATION_SOURCE_VERSION = 'v31-stage7c-canonical-v1';
export const GLOBAL_GAMIFICATION_SOURCE_PRECEDENCE = Object.freeze([
  'adaptiveProfile',
  'profile',
  'gamificationProfile'
]);

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function int(value, fallback = 0) {
  return Math.round(num(value, fallback));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nonEmptyText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function hasPositiveValue(value) {
  return num(value, 0) > 0;
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function hasLevelEvidence(source = {}) {
  return hasPositiveValue(source?.level)
    || hasPositiveValue(source?.globalLevel)
    || hasPositiveValue(source?.xpProgress)
    || hasPositiveValue(source?.levelXp)
    || hasPositiveValue(source?.xpIntoLevel)
    || hasPositiveValue(source?.xpToNextLevel)
    || hasPositiveValue(source?.nextLevelXP)
    || hasPositiveValue(source?.progressPercent)
    || hasPositiveValue(source?.levelProgress);
}

function hasSourceEvidence(source = {}) {
  if (!source || typeof source !== 'object') return false;
  return hasPositiveValue(source?.xp)
    || hasPositiveValue(source?.totalXp)
    || hasPositiveValue(source?.streak)
    || hasPositiveValue(source?.currentStreak)
    || hasPositiveValue(source?.bestStreak)
    || hasPositiveValue(source?.coins)
    || hasPositiveValue(source?.stars)
    || hasPositiveValue(source?.starCount)
    || (Array.isArray(source?.achievements) && source.achievements.length > 0)
    || (source?.subjectXp && typeof source.subjectXp === 'object' && Object.keys(source.subjectXp).length > 0)
    || hasLevelEvidence(source);
}

function getSourceVersion(source = {}) {
  return nonEmptyText(
    source?.sourceVersion
      ?? source?.canonicalSourceVersion
      ?? source?.canonicalVersion
      ?? source?.versionTag,
    ''
  );
}

function isCurrentCanonicalVersion(version = '') {
  return nonEmptyText(version, '') === CANONICAL_GAMIFICATION_SOURCE_VERSION;
}

function getPreferredGlobalSource(input = {}) {
  const candidates = GLOBAL_GAMIFICATION_SOURCE_PRECEDENCE.map(key => [key, input[key]]);

  for (const [key, value] of candidates) {
    if (hasSourceEvidence(value)) return { key, value };
  }

  return { key: 'none', value: {} };
}

function getSubjectMetric(source = {}, subjectId = '', key = 'xp') {
  if (!subjectId || !source || typeof source !== 'object') return 0;
  const normalizedId = String(subjectId).trim().toLowerCase();
  const directMap = source[key];
  if (directMap && typeof directMap === 'object') {
    for (const [mapKey, mapValue] of Object.entries(directMap)) {
      if (String(mapKey).trim().toLowerCase() === normalizedId) {
        return Math.max(0, num(mapValue, 0));
      }
    }
  }
  const subjectMap = source.subjects;
  if (subjectMap && typeof subjectMap === 'object') {
    for (const [mapKey, mapValue] of Object.entries(subjectMap)) {
      if (String(mapKey).trim().toLowerCase() === normalizedId) {
        return Math.max(0, num(mapValue?.[key], 0));
      }
    }
  }
  return 0;
}

function resolveProgressMetrics(xp = 0, source = {}, explicitLevel = 0) {
  const derived = calculateLevelProgress(Math.max(0, num(xp, 0)));
  const sourceIntoLevel = source?.globalXpIntoLevel ?? source?.xpIntoLevel ?? source?.xpProgress ?? source?.levelXp;
  const sourceNextLevel = source?.globalXpForNextLevel ?? source?.nextLevelXP ?? source?.xpForNextLevel;
  const sourceProgressPercent = source?.globalProgressPercent ?? source?.progressPercent ?? source?.levelProgress;
  const sourceXpToNext = source?.xpToNextLevel ?? source?.xpNeeded;
  const derivedLevel = derived.currentLevel;
  const safeExplicitLevel = Math.max(0, int(explicitLevel, 0));
  const hasExplicitProgress = hasPositiveValue(sourceIntoLevel)
    || hasPositiveValue(sourceNextLevel)
    || hasPositiveValue(sourceProgressPercent)
    || hasPositiveValue(sourceXpToNext);

  if (!hasExplicitProgress) {
    if (safeExplicitLevel > 0) {
      const fallbackCurrent = clamp(int(sourceIntoLevel, xp % 100), 0, 100);
      const fallbackMax = Math.max(1, int(sourceNextLevel, sourceXpToNext ? fallbackCurrent + num(sourceXpToNext, 0) : 100));
      return {
        globalLevel: safeExplicitLevel,
        globalXpIntoLevel: clamp(fallbackCurrent, 0, fallbackMax),
        globalXpForNextLevel: fallbackMax,
        globalProgressPercent: clamp(Math.round((fallbackCurrent / fallbackMax) * 100), 0, 100)
      };
    }

    return {
      globalLevel: derivedLevel,
      globalXpIntoLevel: derived.xpIntoLevel,
      globalXpForNextLevel: Math.max(1, derived.nextLevelXp - derived.currentLevelXp),
      globalProgressPercent: derived.progressPercent
    };
  }

  if (!safeExplicitLevel || safeExplicitLevel === derivedLevel) {
    return {
      globalLevel: safeExplicitLevel || derivedLevel,
      globalXpIntoLevel: derived.xpIntoLevel,
      globalXpForNextLevel: Math.max(1, derived.nextLevelXp - derived.currentLevelXp),
      globalProgressPercent: derived.progressPercent
    };
  }

  const fallbackMax = Math.max(1, int(sourceNextLevel, sourceXpToNext ? num(sourceIntoLevel, 0) + num(sourceXpToNext, 0) : 100));
  const fallbackCurrent = clamp(int(sourceIntoLevel, xp % fallbackMax), 0, fallbackMax);
  const fallbackPercent = clamp(
    hasPositiveValue(sourceProgressPercent)
      ? int(sourceProgressPercent, 0)
      : Math.round((fallbackCurrent / fallbackMax) * 100),
    0,
    100
  );

  return {
    globalLevel: safeExplicitLevel,
    globalXpIntoLevel: fallbackCurrent,
    globalXpForNextLevel: fallbackMax,
    globalProgressPercent: fallbackPercent
  };
}

function pickLatestSessionXp(input = {}, sources = []) {
  const explicit = input.latestSessionXp ?? input.sessionXp;
  if (hasPositiveValue(explicit)) return Math.max(0, int(explicit, 0));
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    const candidate = source.latestSessionXp ?? source.lastSessionXp ?? source.recentXp ?? source.sessionXp ?? source.rewardSummary?.sessionXp;
    if (hasPositiveValue(candidate)) return Math.max(0, int(candidate, 0));
  }
  return 0;
}

function getAchievementRows(input = {}, sources = []) {
  if (Array.isArray(input.achievements)) return input.achievements.filter(Boolean);
  for (const source of sources) {
    if (Array.isArray(source?.achievements) && source.achievements.length) {
      return source.achievements.filter(Boolean);
    }
  }
  return [];
}

function buildLevelTitle(level = 1) {
  const safeLevel = Math.max(1, int(level, 1));
  if (safeLevel >= 20) return `Tahap Cemerlang ${safeLevel}`;
  if (safeLevel >= 10) return `Tahap Maju ${safeLevel}`;
  if (safeLevel >= 5) return `Tahap Berkembang ${safeLevel}`;
  return `Tahap ${safeLevel}`;
}

function shouldPreserveExplicitLevel(input = {}, sourceKey = 'none', source = {}) {
  if (isCurrentCanonicalVersion(getSourceVersion(input))) return true;
  if (sourceKey === 'adaptiveProfile' || sourceKey === 'profile') return true;
  if (sourceKey === 'gamificationProfile') return isCurrentCanonicalVersion(getSourceVersion(source));
  return false;
}

export function createCanonicalGamification(input = {}) {
  const progress = input.canonicalProgress || createCanonicalProgress({
    ...(input.profile || {}),
    ...(input.adaptiveProfile || {}),
    history: input.profile?.history || input.adaptiveProfile?.events || [],
    subjects: input.adaptiveProfile?.subjects || input.profile?.subjects,
    topics: input.adaptiveProfile?.topics || input.profile?.topics
  });

  const { key: globalSourceKey, value: globalSource } = getPreferredGlobalSource(input);
  const sources = [input.adaptiveProfile, input.profile, input.gamificationProfile, globalSource];

  const progressXp = num(progress.global?.totalXp, 0);
  // These stores are redundant projections of one global total, not values to
  // add together. Taking the monotonic maximum prevents a lower adaptive or
  // gamification cache from hiding the richer cloud profile on one device.
  const globalXp = Math.max(0, ...[
    input.globalXp,
    globalSource?.totalXp,
    globalSource?.xp,
    input.profile?.totalXp,
    input.profile?.xp,
    input.adaptiveProfile?.totalXp,
    input.adaptiveProfile?.xp,
    input.gamificationProfile?.totalXp,
    input.gamificationProfile?.xp,
    progressXp
  ].map(value => int(value, 0)));

  const allowStoredLevel = shouldPreserveExplicitLevel(input, globalSourceKey, globalSource);
  const sourceLevel = firstDefined(input.globalLevel, globalSource?.globalLevel, globalSource?.level, input.profile?.level, input.adaptiveProfile?.level);
  const requestedLevel = allowStoredLevel && hasPositiveValue(sourceLevel) ? sourceLevel : 0;

  const progressMetrics = resolveProgressMetrics(globalXp, allowStoredLevel ? globalSource : {}, requestedLevel);
  const subjectId = nonEmptyText(input.subjectId || input.selectedSubjectId || input.selectedSubject?.id, '');
  const subjectXp = Math.max(
    0,
    int(
      input.subjectXp
        ?? getSubjectMetric(input.gamificationProfile, subjectId, 'subjectXp')
        ?? getSubjectMetric(input.gamificationProfile, subjectId, 'xp')
        ?? 0,
      0
    )
  );
  const explicitSubjectLevel = input.subjectLevel
    ?? getSubjectMetric(input.gamificationProfile, subjectId, 'subjectLevel')
    ?? getSubjectMetric(input.gamificationProfile, subjectId, 'level');
  const subjectLevel = Math.max(
    0,
    int(
      explicitSubjectLevel,
      subjectXp > 0 ? calculateLevelProgress(subjectXp).currentLevel : 0
    )
  );
  const achievementRows = getAchievementRows(input, sources);
  const achievementCount = Math.max(
    0,
    int(
      input.achievementCount
        ?? input.gamificationProfile?.achievementCount
        ?? input.rewardSummary?.achievementCount
        ?? achievementRows.length,
      0
    )
  );
  const currentStreak = Math.max(
    0,
    int(
      input.currentStreak
        ?? progress.global?.streakCurrent
        ?? globalSource?.currentStreak
        ?? globalSource?.streak
        ?? input.profile?.currentStreak
        ?? input.profile?.streak
        ?? 0,
      0
    )
  );
  const bestStreak = Math.max(
    currentStreak,
    int(
      input.bestStreak
        ?? progress.global?.streakBest
        ?? globalSource?.bestStreak
        ?? globalSource?.longestStreak
        ?? globalSource?.maxStreak
        ?? 0,
      currentStreak
    )
  );
  const starCount = Math.max(
    0,
    int(
      input.starCount
        ?? globalSource?.starCount
        ?? globalSource?.stars
        ?? globalSource?.coins
        ?? input.profile?.starCount
        ?? input.profile?.stars
        ?? input.profile?.coins
        ?? input.adaptiveProfile?.starCount
        ?? input.adaptiveProfile?.stars
        ?? input.adaptiveProfile?.coins
        ?? input.gamificationProfile?.coins
        ?? 0,
      0
    )
  );
  const latestSessionXp = pickLatestSessionXp(input, sources);

  const hasEvidence = Boolean(
    globalXp > 0
    || currentStreak > 0
    || bestStreak > 0
    || achievementCount > 0
    || starCount > 0
    || subjectXp > 0
    || latestSessionXp > 0
    || num(progress.global?.totalAttempts, 0) > 0
  );

  return {
    hasEvidence,
    globalXp,
    globalLevel: Math.max(1, int(progressMetrics.globalLevel, 1)),
    globalXpIntoLevel: Math.max(0, int(progressMetrics.globalXpIntoLevel, 0)),
    globalXpForNextLevel: Math.max(1, int(progressMetrics.globalXpForNextLevel, 100)),
    globalProgressPercent: clamp(int(progressMetrics.globalProgressPercent, 0), 0, 100),
    subjectId,
    subjectXp,
    subjectLevel: Math.max(0, int(subjectLevel, 0)),
    currentStreak,
    bestStreak,
    achievementCount,
    starCount,
    latestSessionXp,
    levelTitle: buildLevelTitle(progressMetrics.globalLevel),
    nextLevelTitle: buildLevelTitle(Math.max(1, int(progressMetrics.globalLevel, 1) + 1)),
    scope: subjectId ? (subjectXp > 0 ? 'global+subject' : 'global') : 'global',
    sourceVersion: CANONICAL_GAMIFICATION_SOURCE_VERSION,
    achievements: achievementRows,
    globalSourceKey,
    globalSourceVersion: getSourceVersion(globalSource),
    precedenceOrder: [...GLOBAL_GAMIFICATION_SOURCE_PRECEDENCE]
  };
}

export default {
  createCanonicalGamification
};
