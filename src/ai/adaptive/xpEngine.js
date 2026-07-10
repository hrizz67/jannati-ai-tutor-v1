import { calculateLevel } from './levelEngine.js';
import { createDefaultProfile } from './studentProfile.js';

const DIFFICULTY_BONUS = {
  easy: 5,
  medium: 10,
  hard: 15
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cloneProfile(profile) {
  return JSON.parse(JSON.stringify(profile || createDefaultProfile()));
}

function recalculateProfile(profile) {
  const nextProfile = cloneProfile(profile);
  nextProfile.level = calculateLevel(nextProfile.xp || 0);
  return nextProfile;
}

export function calculateXP(correct = 0, difficulty = 'medium') {
  const safeCorrect = Math.max(0, Number(correct) || 0);
  const bonus = DIFFICULTY_BONUS[String(difficulty).toLowerCase()] ?? DIFFICULTY_BONUS.medium;
  return safeCorrect * bonus;
}

export function addXP(profile = createDefaultProfile(), xp = 0) {
  const nextProfile = cloneProfile(profile);
  const gain = Math.max(0, Number(xp) || 0);
  nextProfile.xp = (nextProfile.xp || 0) + gain;
  return recalculateProfile(nextProfile);
}

export function removeXP(profile = createDefaultProfile(), xp = 0) {
  const nextProfile = cloneProfile(profile);
  const loss = Math.max(0, Number(xp) || 0);
  nextProfile.xp = clamp((nextProfile.xp || 0) - loss, 0, Number.MAX_SAFE_INTEGER);
  return recalculateProfile(nextProfile);
}
