function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function uniqueById(items = []) {
  const seen = new Set();
  return items.filter(item => {
    const id = item?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export const ACHIEVEMENTS = [
  {
    id: 'first-question',
    label: 'First Question',
    description: 'Complete your first question.',
    isUnlocked: profile => toNumber(profile.totalQuestions, 0) >= 1
  },
  {
    id: 'first-perfect-score',
    label: 'First Perfect Score',
    description: 'Earn a perfect score in one session.',
    isUnlocked: profile => Array.isArray(profile.sessionHistory) && profile.sessionHistory.some(session => toNumber(session?.accuracy, 0) >= 100)
  },
  {
    id: '7-day-streak',
    label: '7-Day Streak',
    description: 'Study for 7 consecutive days.',
    isUnlocked: profile => toNumber(profile.currentStreak, 0) >= 7 || toNumber(profile.bestStreak, 0) >= 7
  },
  {
    id: '100-questions',
    label: '100 Questions',
    description: 'Answer 100 questions in total.',
    isUnlocked: profile => toNumber(profile.totalQuestions, 0) >= 100
  },
  {
    id: 'math-explorer',
    label: 'Math Explorer',
    description: 'Show strong progress in Mathematics.',
    isUnlocked: profile => toNumber(profile.subjects?.math?.mastery, 0) >= 80
  },
  {
    id: 'english-reader',
    label: 'English Reader',
    description: 'Show strong progress in English.',
    isUnlocked: profile => toNumber(profile.subjects?.english?.mastery, 0) >= 80
  },
  {
    id: 'science-explorer',
    label: 'Science Explorer',
    description: 'Show strong progress in Science.',
    isUnlocked: profile => toNumber(profile.subjects?.sains?.mastery, 0) >= 80
  }
];

export function getAchievementDefinitions() {
  return ACHIEVEMENTS.map(item => ({ ...item }));
}

export function evaluateAchievements(profile = {}, context = {}) {
  const earnedAt = normalizeDateKey(context.today || new Date());
  const unlocked = ACHIEVEMENTS
    .filter(definition => {
      try {
        return Boolean(definition.isUnlocked(profile, context));
      } catch {
        return false;
      }
    })
    .map(definition => ({
      id: definition.id,
      label: definition.label,
      description: definition.description,
      earnedAt,
      category: definition.id.includes('streak') ? 'streak' : definition.id.includes('perfect') ? 'mastery' : 'progress'
    }));

  return uniqueById(unlocked);
}

export default {
  ACHIEVEMENTS,
  getAchievementDefinitions,
  evaluateAchievements
};
