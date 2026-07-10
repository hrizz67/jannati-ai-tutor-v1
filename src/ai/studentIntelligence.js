const STUDENT_CORE_KEY = 'jannati_v152_student_core';
const LEGACY_STUDENT_CORE_KEYS = ['jannati_v151_student_core', 'jannati_v150_student_core'];
const STUDENT_CORE_VERSION = 1;

function progressKey(subjectId, topicId) {
  return `${subjectId}_${topicId}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeKeys(keys = []) {
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage cleanup errors.
    }
  });
}

function buildDefaultProfile() {
  return {
    name: '',
    avatar: '👦',
    year: 'Tahun 2',
    isDemo: false,
    xp: 0,
    coins: 0,
    streak: 0,
    lastStudy: '',
    badges: [],
    progress: {},
    history: [],
    daily: {},
    bookmarks: [],
    favourites: [],
    recommendations: {},
    uasaHistory: []
  };
}

function migrateProfileShape(raw = {}, fallback = buildDefaultProfile()) {
  const merged = { ...fallback, ...(raw || {}) };
  return {
    ...merged,
    xp: Number.isFinite(merged.xp) ? merged.xp : 0,
    coins: Number.isFinite(merged.coins) ? merged.coins : 0,
    streak: Number.isFinite(merged.streak) ? merged.streak : 0,
    badges: Array.isArray(merged.badges) ? merged.badges : [],
    progress: merged.progress && typeof merged.progress === 'object' ? merged.progress : {},
    history: Array.isArray(merged.history) ? merged.history : [],
    daily: merged.daily && typeof merged.daily === 'object' ? merged.daily : {},
    bookmarks: Array.isArray(merged.bookmarks) ? merged.bookmarks : [],
    favourites: Array.isArray(merged.favourites) ? merged.favourites : [],
    recommendations: merged.recommendations && typeof merged.recommendations === 'object' ? merged.recommendations : {},
    uasaHistory: Array.isArray(merged.uasaHistory) ? merged.uasaHistory : []
  };
}

function buildSubjectStats(profile = {}, subjects = []) {
  return (subjects || []).map(subject => {
    const topics = subject.topics || [];
    const topicStats = topics.map(topic => {
      const progress = profile.progress?.[progressKey(subject.id, topic.id)] || {};
      return {
        subjectId: subject.id,
        subjectTitle: subject.title,
        topicId: topic.id,
        topicTitle: topic.title,
        attempts: progress.attempts || 0,
        best: progress.best || 0,
        last: progress.last || 0,
        mastered: (progress.best || 0) >= 80
      };
    });
    const completedTopics = topicStats.filter(item => item.mastered).length;
    const attemptedTopics = topicStats.filter(item => item.attempts > 0).length;
    const averageScore = topics.length
      ? Math.round(topics.reduce((sum, topic) => sum + (profile.progress?.[progressKey(subject.id, topic.id)]?.best || 0), 0) / topics.length)
      : 0;

    return {
      subjectId: subject.id,
      subjectTitle: subject.title,
      subjectShort: subject.short || subject.title,
      icon: subject.icon || '📘',
      totalTopics: topics.length,
      totalQuestions: topics.reduce((sum, topic) => sum + (topic.questions?.length || 0), 0),
      completedTopics,
      attemptedTopics,
      averageScore,
      topicStats
    };
  });
}

function summarizeActivity(profile = {}) {
  const history = Array.isArray(profile.history) ? profile.history : [];
  const recent = history.slice(0, 10);
  const totalQuestions = history.reduce((sum, item) => sum + (item.questions || 0), 0);
  const recentStudyDays = new Set(recent.map(item => item.date).filter(Boolean));
  const latestActivity = recent[0] || null;

  return {
    totalSessions: history.length,
    recentSessions: recent.length,
    totalQuestions,
    recentStudyDays: recentStudyDays.size,
    latestActivity
  };
}

export function loadStudentCore(defaultProfile = buildDefaultProfile()) {
  const freshDefault = buildDefaultProfile();
  try {
    const snapshot = readJson(STUDENT_CORE_KEY);
    if (snapshot?.profile) {
      return migrateProfileShape(snapshot.profile, defaultProfile || freshDefault);
    }

    for (const key of LEGACY_STUDENT_CORE_KEYS) {
      const legacy = readJson(key);
      if (legacy?.profile) {
        const nextProfile = migrateProfileShape(legacy.profile, defaultProfile || freshDefault);
        writeJson(STUDENT_CORE_KEY, { ...legacy, profile: nextProfile, version: STUDENT_CORE_VERSION, updatedAt: new Date().toISOString() });
        return nextProfile;
      }
    }
  } catch {
    removeKeys([STUDENT_CORE_KEY, ...LEGACY_STUDENT_CORE_KEYS]);
  }

  return migrateProfileShape(defaultProfile || freshDefault, freshDefault);
}

export function saveStudentCore(profile = {}, subjects = [], memory = {}) {
  const normalizedProfile = migrateProfileShape(profile);
  const subjectStats = buildSubjectStats(normalizedProfile, subjects);
  const topicStats = subjectStats.flatMap(subject => subject.topicStats);
  const completedTopics = topicStats.filter(topic => topic.mastered).length;
  const attemptedTopics = topicStats.filter(topic => topic.attempts > 0).length;
  const completedQuestions = (normalizedProfile.history || []).length;
  const level = Math.max(1, Math.floor((normalizedProfile.xp || 0) / 100) + 1);
  const xpProgress = (normalizedProfile.xp || 0) % 100;
  const xpToNextLevel = level * 100 - (normalizedProfile.xp || 0);
  const streak = normalizedProfile.streak || 0;
  const streakStatus = streak >= 7 ? 'Mantap' : streak >= 3 ? 'Bagus' : streak > 0 ? 'Baru Mula' : 'Belum Aktif';
  const activity = summarizeActivity(normalizedProfile);
  const weakTopics = Array.isArray(memory.weakTopics) ? memory.weakTopics : [];
  const strongTopics = Array.isArray(memory.strongTopics) ? memory.strongTopics : [];

  const payload = {
    version: STUDENT_CORE_VERSION,
    updatedAt: new Date().toISOString(),
    profile: normalizedProfile,
    core: {
      xp: normalizedProfile.xp || 0,
      level,
      xpProgress,
      xpToNextLevel,
      streak,
      streakStatus,
      coins: normalizedProfile.coins || 0,
      badges: normalizedProfile.badges || [],
      completedTopics,
      attemptedTopics,
      completedQuestions,
      subjectCount: subjectStats.length,
      subjectStats,
      topicStats,
      weakTopics,
      strongTopics,
      activity
    }
  };

  if (writeJson(STUDENT_CORE_KEY, payload)) {
    return payload;
  }

  removeKeys([STUDENT_CORE_KEY]);
  return payload;
}

export function buildStudentIntelligence(profile = {}, subjects = [], memory = {}) {
  const normalizedProfile = migrateProfileShape(profile);
  const subjectStats = buildSubjectStats(normalizedProfile, subjects);
  const topicStats = subjectStats.flatMap(subject => subject.topicStats);
  const completedTopics = topicStats.filter(topic => topic.mastered).length;
  const attemptedTopics = topicStats.filter(topic => topic.attempts > 0).length;
  const totalTopicSlots = subjectStats.reduce((sum, subject) => sum + subject.totalTopics, 0);
  const level = Math.max(1, Math.floor((normalizedProfile.xp || 0) / 100) + 1);
  const xpProgress = (normalizedProfile.xp || 0) % 100;
  const xpToNextLevel = level * 100 - (normalizedProfile.xp || 0);
  const streak = normalizedProfile.streak || 0;
  const activity = summarizeActivity(normalizedProfile);
  const memoryWeakTopics = Array.isArray(memory.weakTopics) ? memory.weakTopics : [];
  const memoryStrongTopics = Array.isArray(memory.strongTopics) ? memory.strongTopics : [];

  return {
    version: STUDENT_CORE_VERSION,
    level,
    xp: normalizedProfile.xp || 0,
    xpProgress,
    xpToNextLevel,
    streak,
    streakStatus: streak >= 7 ? 'Mantap' : streak >= 3 ? 'Bagus' : streak > 0 ? 'Baru Mula' : 'Belum Aktif',
    coins: normalizedProfile.coins || 0,
    subjectCount: subjectStats.length,
    completedTopics,
    attemptedTopics,
    completedQuestions: activity.totalSessions,
    subjectStats,
    topicStats,
    weakTopics: memoryWeakTopics,
    strongTopics: memoryStrongTopics,
    activity,
    topicCompletionRate: topicStats.length ? Math.round((completedTopics / topicStats.length) * 100) : 0,
    subjectCompletionRate: totalTopicSlots ? Math.round((completedTopics / totalTopicSlots) * 100) : 0
  };
}

export function getStudentLevel(xp = 0) {
  const safeXp = clamp(Number(xp) || 0, 0, Number.MAX_SAFE_INTEGER);
  const level = Math.max(1, Math.floor(safeXp / 100) + 1);
  const levelXp = safeXp % 100;
  return {
    level,
    levelXp,
    xpToNextLevel: level * 100 - safeXp
  };
}

