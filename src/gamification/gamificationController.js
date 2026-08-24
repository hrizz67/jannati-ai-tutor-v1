import { awardXp } from './xpEngine.js';
import { calculateLevelProgress } from './levelEngine.js';
import { updateStreak } from './streakEngine.js';
import { evaluateAchievements } from './achievementEngine.js';
import { buildRewardSummary } from './rewardSummary.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeSubjectKey(subject = '') {
  return String(subject || '').trim().toLowerCase();
}

function applySubjectAchievementHints(profile, achievements) {
  const subjectAchievements = new Set((achievements || []).map(item => item.id));
  const nextProfile = clone(profile);
  nextProfile.achievements = achievements;
  nextProfile.subjectMilestones = {
    math: subjectAchievements.has('math-explorer'),
    english: subjectAchievements.has('english-reader'),
    sains: subjectAchievements.has('science-explorer')
  };
  return nextProfile;
}

export function updateGamification(profile = {}, event = {}) {
  const current = clone(profile);
  const subjectKey = normalizeSubjectKey(event.subject);
  const xpResult = awardXp(current, event);
  const streakResult = updateStreak(current, event);
  const answeredDelta = Number(event.answeredQuestions ?? (event.type === 'quiz-answer' ? 1 : 0)) || 0;
  const correctDelta = event.correct ? 1 : 0;
  let merged = {
    ...current,
    totalXp: xpResult.totalXp,
    xp: xpResult.totalXp,
    totalQuestions: Math.max(0, toNumber(current.totalQuestions, 0) + Math.max(0, answeredDelta)),
    correctQuestions: Math.max(0, toNumber(current.correctQuestions, 0) + Math.max(0, correctDelta)),
    wrongQuestions: Math.max(0, toNumber(current.wrongQuestions, 0) + Math.max(0, answeredDelta - correctDelta)),
    streak: streakResult.currentStreak,
    currentStreak: streakResult.currentStreak,
    bestStreak: Math.max(toNumber(current.bestStreak, 0), streakResult.bestStreak),
    lastActivityDate: streakResult.lastActivityDate || current.lastActivityDate || '',
    subjectXp: {
      ...(current.subjectXp || {}),
      [subjectKey || 'general']: Math.max(0, toNumber((current.subjectXp || {})[subjectKey || 'general'], 0) + xpResult.xpGained)
    },
    lastEventType: String(event.type || 'event')
  };

  const level = calculateLevelProgress(merged.totalXp);
  merged.level = level.currentLevel;
  merged.nextLevelXP = level.nextLevelXp;
  merged.levelProgress = level.progressPercent;
  merged.achievements = evaluateAchievements(merged, event);
  merged = applySubjectAchievementHints(merged, merged.achievements);

  return {
    ...merged,
    rewardSummary: buildRewardSummary(merged),
    xpBreakdown: xpResult.breakdown
  };
}

export function getRewardSummary(profile = {}) {
  return buildRewardSummary(profile);
}

export function getLevelSummary(profile = {}) {
  const totalXp = Math.max(0, toNumber(profile.totalXp ?? profile.xp, 0));
  return calculateLevelProgress(totalXp);
}

export default {
  updateGamification,
  getRewardSummary,
  getLevelSummary
};
