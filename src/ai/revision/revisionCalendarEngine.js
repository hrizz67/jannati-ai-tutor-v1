function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function startOfDay(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function rollingDays(days = 30) {
  const count = Math.max(1, Math.floor(toNumber(days, 30)));
  const today = startOfDay(localDateKey());
  const list = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    list.push(localDateKey(addDays(today, -index)));
  }
  return list;
}

function getHistory(profile = {}) {
  return Array.isArray(profile.learningHistory) ? profile.learningHistory : [];
}

function getSessionHistory(profile = {}) {
  return Array.isArray(profile.sessionHistory) ? profile.sessionHistory : [];
}

function getQuestionLog(profile = {}) {
  return Array.isArray(profile.questionLog) ? profile.questionLog : [];
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : localDateKey(date);
}

function buildDailyMap(profile = {}) {
  const map = new Map();
  const insert = (date, item) => {
    const key = normalizeDate(date);
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(item);
  };

  getHistory(profile).forEach(entry => insert(entry.answeredAt || entry.date || entry.createdAt || entry.updatedAt, { ...entry, source: 'learning' }));
  getSessionHistory(profile).forEach(entry => insert(entry.startedAt || entry.endedAt || entry.date || entry.createdAt, { ...entry, source: 'session' }));
  getQuestionLog(profile).forEach(entry => insert(entry.answeredAt || entry.date || entry.createdAt || entry.updatedAt, { ...entry, source: 'question' }));
  return map;
}

function getDayStatus(day, todayKey, dailyMap) {
  if (day === todayKey) return 'today';
  const entries = dailyMap.get(day) || [];
  if (!entries.length) {
    return day > todayKey ? 'future' : 'missed';
  }
  const hasStudy = entries.some(item => item.source === 'learning' || item.source === 'session' || item.source === 'question');
  return hasStudy ? 'study' : 'revision';
}

function getCalendarEntries(profile = {}, days = 30) {
  const dayList = rollingDays(days);
  const todayKey = localDateKey();
  const dailyMap = buildDailyMap(profile);
  return dayList.map(date => ({
    date,
    status: getDayStatus(date, todayKey, dailyMap),
    hasActivity: (dailyMap.get(date) || []).length > 0
  }));
}

function buildWeeklyGoals(profile = {}) {
  const totalQuestions = Math.max(0, toNumber(profile.totalQuestions, 0));
  const activeDays = new Set((getHistory(profile).concat(getSessionHistory(profile)).concat(getQuestionLog(profile))).map(entry => normalizeDate(entry.answeredAt || entry.date || entry.createdAt || entry.updatedAt)).filter(Boolean));
  const correctQuestions = Math.max(0, toNumber(profile.correctQuestions, 0));
  const accuracy = totalQuestions ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
  const studyMinutes = Math.max(0, Math.round(toNumber(profile.studyMinutes, 0)));
  const streak = Math.max(0, toNumber(profile.streak, 0));

  return {
    questions: 100,
    studyDays: 5,
    accuracy: 80,
    studyMinutes: 120,
    progress: {
      questions: totalQuestions,
      studyDays: activeDays.size,
      accuracy,
      studyMinutes
    },
    streak
  };
}

function getMilestoneDefinitions() {
  return [
    { id: 'questions-100', label: '100 Soalan', type: 'questions', target: 100 },
    { id: 'questions-500', label: '500 Soalan', type: 'questions', target: 500 },
    { id: 'questions-1000', label: '1000 Soalan', type: 'questions', target: 1000 },
    { id: 'xp-500', label: '500 XP', type: 'xp', target: 500 },
    { id: 'xp-1000', label: '1000 XP', type: 'xp', target: 1000 },
    { id: 'streak-7', label: 'Streak 7 Hari', type: 'streak', target: 7 },
    { id: 'streak-30', label: 'Streak 30 Hari', type: 'streak', target: 30 },
    { id: 'bm-mastered', label: 'Semua topik BM dikuasai', type: 'subjectMastery', subjectId: 'bm', target: 80 },
    { id: 'math-mastered', label: 'Semua topik Matematik dikuasai', type: 'subjectMastery', subjectId: 'math', target: 80 }
  ];
}

function getSubjectMastery(profile = {}, subjectId) {
  const topics = Object.values(profile.topics?.[subjectId] || {});
  if (!topics.length) return 0;
  const total = topics.reduce((sum, topic) => sum + Math.max(0, toNumber(topic.mastery, 0)), 0);
  return Math.round(total / topics.length);
}

function getAllSubjectMastery(profile = {}) {
  return Object.keys(profile.topics || {}).reduce((acc, subjectId) => {
    acc[subjectId] = getSubjectMastery(profile, subjectId);
    return acc;
  }, {});
}

export function getCalendarDay(profile = {}, date) {
  const todayKey = localDateKey();
  const dateKey = normalizeDate(date);
  if (!dateKey) return null;
  const dailyMap = buildDailyMap(profile);
  return {
    date: dateKey,
    status: getDayStatus(dateKey, todayKey, dailyMap),
    hasActivity: (dailyMap.get(dateKey) || []).length > 0
  };
}

export function buildRevisionCalendar(profile = {}, options = {}) {
  const days = Math.max(1, Math.floor(toNumber(options.days, 30)));
  const calendar = getCalendarEntries(profile, days);
  const weeklyGoals = buildWeeklyGoals(profile);
  const goalProgress = getGoalProgress(profile);
  const milestones = getMilestones(profile);
  const studyCount = calendar.filter(day => day.status === 'study').length;
  const revisionCount = calendar.filter(day => day.status === 'revision').length;
  const missedCount = calendar.filter(day => day.status === 'missed').length;

  return {
    calendar,
    weeklyGoals,
    goalProgress,
    milestones,
    summary: {
      studyDays: studyCount,
      revisionDays: revisionCount,
      missedDays: missedCount,
      totalDays: calendar.length
    }
  };
}

export function getWeeklyGoals(profile = {}) {
  return clone(buildWeeklyGoals(profile));
}

export function getGoalProgress(profile = {}) {
  const goals = buildWeeklyGoals(profile);
  return {
    questions: Math.min(100, Math.round((goals.progress.questions / goals.questions) * 100)),
    studyDays: Math.min(100, Math.round((goals.progress.studyDays / goals.studyDays) * 100)),
    accuracy: Math.min(100, Math.round((goals.progress.accuracy / goals.accuracy) * 100)),
    studyMinutes: Math.min(100, Math.round((goals.progress.studyMinutes / goals.studyMinutes) * 100))
  };
}

export function getMilestones(profile = {}) {
  const milestones = getMilestoneDefinitions();
  const totalQuestions = Math.max(0, toNumber(profile.totalQuestions, 0));
  const xp = Math.max(0, toNumber(profile.xp, 0));
  const streak = Math.max(0, toNumber(profile.streak, 0));
  const masteryBySubject = getAllSubjectMastery(profile);

  return milestones.map(item => {
    let completed = false;
    if (item.type === 'questions') completed = totalQuestions >= item.target;
    if (item.type === 'xp') completed = xp >= item.target;
    if (item.type === 'streak') completed = streak >= item.target;
    if (item.type === 'subjectMastery') completed = Math.max(0, masteryBySubject[item.subjectId] || 0) >= item.target;
    return {
      ...item,
      completed
    };
  });
}

export default {
  buildRevisionCalendar,
  getCalendarDay,
  getGoalProgress,
  getMilestones,
  getWeeklyGoals
};
