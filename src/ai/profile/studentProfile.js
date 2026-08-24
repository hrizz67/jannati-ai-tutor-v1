import { getTopicStatus, getTopicStatusLabel } from './confidenceEngine.js';

const STORAGE_PREFIX = 'jannati.smartPersonalTutor.profile';
const PROFILE_VERSION = 1;
const DEFAULT_STUDENT_ID = 'default';
const LEGACY_PROFILE_KEYS = [
  'jannati_v152_student_core',
  'jannati_v151_profile',
  'jannati_v150_profile',
  'jannati_v140_profile'
];

function hasStorage() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function normalizeStudentId(value = DEFAULT_STUDENT_ID) {
  const text = toText(value, DEFAULT_STUDENT_ID).toLowerCase();
  return text || DEFAULT_STUDENT_ID;
}

function storageKey(studentId = DEFAULT_STUDENT_ID) {
  return `${STORAGE_PREFIX}:${normalizeStudentId(studentId)}`;
}

function readJson(key) {
  if (!hasStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  if (!hasStorage()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeDateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function safeIsoDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function createEmptyTotals() {
  return {
    questionsAnswered: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalStudySeconds: 0,
    averageResponseTimeMs: 0,
    totalResponseTimeMs: 0,
    lastAnsweredAt: null,
    lastStudyDate: null,
    activitiesCompleted: 0
  };
}

function createEmptyMistakeSummary() {
  return {
    total: 0,
    repeatedMistakes: 0,
    topMistakes: [],
    recentMistakes: [],
    weeklyMistakes: [],
    monthlyMistakes: [],
    byType: {},
    bySubject: {},
    byTopic: {},
    improvementTrend: 0,
    updatedAt: null
  };
}

function createEmptySubject(subjectId = '') {
  return {
    subjectId,
    title: '',
    short: '',
    attempts: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    averageResponseTimeMs: 0,
    totalResponseTimeMs: 0,
    strongestTopic: null,
    weakestTopic: null,
    lastPractised: null,
    topicCount: 0,
    mistakeCount: 0,
    topMistakes: [],
    recentMistakes: [],
    mostRepeatedMistake: null,
    improvementTrend: 0,
    topics: {}
  };
}

function createEmptyTopic(subjectId = '', topicId = '') {
  return {
    subjectId,
    topicId,
    title: '',
    attempts: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    confidence: 50,
    status: getTopicStatus(50),
    statusLabel: getTopicStatusLabel(50),
    lastPractised: null,
    lastAttemptAt: null,
    averageResponseTimeMs: 0,
    totalResponseTimeMs: 0,
    firstTryCorrect: 0,
    repeatedWrong: 0
  };
}

function ensureSubject(profile, subjectId = '') {
  if (!profile.subjects || !isObject(profile.subjects)) {
    profile.subjects = {};
  }

  if (!profile.subjects[subjectId] || !isObject(profile.subjects[subjectId])) {
    profile.subjects[subjectId] = createEmptySubject(subjectId);
  }

  const subject = profile.subjects[subjectId];
  if (!subject.topics || !isObject(subject.topics)) {
    subject.topics = {};
  }
  subject.subjectId = subject.subjectId || subjectId;
  return subject;
}

function ensureTopic(profile, subjectId = '', topicId = '') {
  const subject = ensureSubject(profile, subjectId);
  if (!subject.topics[topicId] || !isObject(subject.topics[topicId])) {
    subject.topics[topicId] = createEmptyTopic(subjectId, topicId);
  }
  const topic = subject.topics[topicId];
  topic.subjectId = topic.subjectId || subjectId;
  topic.topicId = topic.topicId || topicId;
  if (!profile.topics || !isObject(profile.topics)) {
    profile.topics = {};
  }
  if (!profile.topics[subjectId] || !isObject(profile.topics[subjectId])) {
    profile.topics[subjectId] = {};
  }
  profile.topics[subjectId][topicId] = topic;
  return topic;
}

function normalizeTopicRecord(topic = {}, subjectId = '', topicId = '') {
  const current = createEmptyTopic(subjectId, topicId);
  const attempts = toNumber(topic.attempts ?? topic.reviewCount, 0);
  const correct = toNumber(topic.correct ?? topic.correctCount, 0);
  const wrong = toNumber(topic.wrong ?? topic.wrongCount, Math.max(0, attempts - correct));
  const total = Math.max(0, attempts || correct + wrong);
  const averageResponseTimeMs = toNumber(topic.averageResponseTimeMs, 0);
  const totalResponseTimeMs = toNumber(topic.totalResponseTimeMs, averageResponseTimeMs * total);
  const confidence = Math.max(
    0,
    Math.min(
      100,
      toNumber(
        topic.confidence,
        toNumber(topic.confidenceSnapshot, toNumber(topic.masterySnapshot, total > 0 ? Math.round((correct / Math.max(1, total)) * 100) : 50))
      )
    )
  );

  current.subjectId = subjectId || topic.subjectId || current.subjectId;
  current.topicId = topicId || topic.topicId || current.topicId;
  current.title = toText(topic.title || topic.topicTitle || '', current.title);
  current.attempts = total;
  current.correct = Math.max(0, correct);
  current.wrong = Math.max(0, wrong);
  current.accuracy = total > 0 ? Math.round((current.correct / total) * 100) : 0;
  current.averageResponseTimeMs = total > 0 ? Math.round(totalResponseTimeMs / total) : 0;
  current.totalResponseTimeMs = Math.max(0, totalResponseTimeMs);
  current.confidence = confidence;
  current.status = getTopicStatus(confidence);
  current.statusLabel = getTopicStatusLabel(confidence);
  current.lastPractised = safeIsoDate(topic.lastPractised || topic.lastAnsweredAt || topic.lastAttemptAt || '');
  current.lastAttemptAt = safeIsoDate(topic.lastAttemptAt || topic.lastPractised || topic.lastAnsweredAt || '');
  current.firstTryCorrect = Math.max(0, toNumber(topic.firstTryCorrect, 0));
  current.repeatedWrong = Math.max(0, toNumber(topic.repeatedWrong, 0));
  current.mistakeCount = Math.max(0, toNumber(topic.mistakeCount, 0));
  current.topMistakes = Array.isArray(topic.topMistakes) ? topic.topMistakes.slice(0, 10) : [];
  current.recentMistakes = Array.isArray(topic.recentMistakes) ? topic.recentMistakes.slice(0, 10) : [];
  return current;
}

function normalizeSubjectRecord(subject = {}, subjectId = '') {
  const current = createEmptySubject(subjectId);
  current.subjectId = subjectId || subject.subjectId || current.subjectId;
  current.title = toText(subject.title || subject.subjectTitle || '', current.title);
  current.short = toText(subject.short || subject.subjectShort || '', current.short);
  current.attempts = Math.max(0, toNumber(subject.attempts, 0));
  current.correct = Math.max(0, toNumber(subject.correct, 0));
  current.wrong = Math.max(0, toNumber(subject.wrong, 0));
  current.accuracy = Math.max(0, toNumber(subject.accuracy, 0));
  current.averageResponseTimeMs = Math.max(0, toNumber(subject.averageResponseTimeMs, 0));
  current.totalResponseTimeMs = Math.max(0, toNumber(subject.totalResponseTimeMs, 0));
  current.strongestTopic = subject.strongestTopic || null;
  current.weakestTopic = subject.weakestTopic || null;
  current.lastPractised = safeIsoDate(subject.lastPractised || subject.lastAnsweredAt || '');
  current.topicCount = Math.max(0, toNumber(subject.topicCount, 0));
  current.mistakeCount = Math.max(0, toNumber(subject.mistakeCount, 0));
  current.topMistakes = Array.isArray(subject.topMistakes) ? subject.topMistakes.slice(0, 10) : [];
  current.recentMistakes = Array.isArray(subject.recentMistakes) ? subject.recentMistakes.slice(0, 10) : [];
  current.mostRepeatedMistake = subject.mostRepeatedMistake || null;
  current.improvementTrend = toNumber(subject.improvementTrend, 0);
  current.topics = {};
  const topics = isObject(subject.topics) ? subject.topics : {};
  Object.entries(topics).forEach(([topicId, topic]) => {
    current.topics[topicId] = normalizeTopicRecord(topic, current.subjectId, topicId);
  });
  return current;
}

function deriveFromProgress(profile, progress = {}) {
  if (!isObject(progress)) return;
  Object.entries(progress).forEach(([progressId, record]) => {
    if (!isObject(record)) return;
    const parts = String(progressId || '').split('_');
    const subjectId = toText(record.subjectId || parts[0] || '', '');
    const topicId = toText(record.topicId || parts.slice(1).join('_') || '', '');
    if (!subjectId || !topicId) return;
    const topic = ensureTopic(profile, subjectId, topicId);
    topic.title = toText(record.title || record.topicTitle || topic.title, topic.title);
    topic.attempts = Math.max(topic.attempts, toNumber(record.attempts, topic.attempts));
    const best = Math.max(0, toNumber(record.best ?? record.last ?? record.correct, 0));
    topic.correct = Math.max(topic.correct, toNumber(record.correct, best > 0 ? Math.round((best / 100) * topic.attempts) : topic.correct));
    topic.wrong = Math.max(0, topic.attempts - topic.correct);
    topic.lastPractised = safeIsoDate(record.lastDate || record.lastPractised || record.last || topic.lastPractised);
    topic.lastAttemptAt = topic.lastPractised || topic.lastAttemptAt;
    topic.confidence = Math.max(topic.confidence, Math.min(100, toNumber(record.confidence, best)));
    topic.status = getTopicStatus(topic.confidence);
    topic.statusLabel = getTopicStatusLabel(topic.confidence);
  });
}

function deriveFromHistory(profile, history = []) {
  if (!Array.isArray(history)) return;
  history.forEach(entry => {
    if (!isObject(entry)) return;
    const subjectId = toText(entry.subjectId || '', '');
    const topicId = toText(entry.topicId || '', '');
    if (!subjectId || !topicId) return;
    const topic = ensureTopic(profile, subjectId, topicId);
    topic.title = toText(entry.topic || entry.title || topic.title, topic.title);
    topic.lastPractised = safeIsoDate(entry.date || entry.lastPractised || topic.lastPractised);
    topic.lastAttemptAt = topic.lastPractised || topic.lastAttemptAt;
  });
}

function deriveFromLegacyProfile(profile, rawProfile = {}) {
  if (!isObject(rawProfile)) return;
  profile.studentId = normalizeStudentId(rawProfile.studentId || rawProfile.id || profile.studentId);
  profile.name = toText(rawProfile.name || profile.name, profile.name);
  profile.year = toText(rawProfile.year || profile.year, profile.year);
  profile.avatar = toText(rawProfile.avatar || profile.avatar, profile.avatar);
  profile.isDemo = Boolean(rawProfile.isDemo ?? profile.isDemo);
  profile.totals.currentStreak = Math.max(profile.totals.currentStreak, toNumber(rawProfile.streak, 0));
  profile.totals.longestStreak = Math.max(profile.totals.longestStreak, toNumber(rawProfile.longestStreak || rawProfile.streak, 0));
  profile.totals.questionsAnswered = Math.max(profile.totals.questionsAnswered, toNumber(rawProfile.totalQuestions || rawProfile.totalQuestionsAnswered, 0));
  profile.totals.correct = Math.max(profile.totals.correct, toNumber(rawProfile.correctQuestions || rawProfile.totalCorrect, 0));
  profile.totals.wrong = Math.max(profile.totals.wrong, toNumber(rawProfile.wrongQuestions || rawProfile.totalWrong, 0));
  profile.totals.totalStudySeconds = Math.max(profile.totals.totalStudySeconds, toNumber(rawProfile.totalStudySeconds || rawProfile.studySeconds, 0));
  profile.totals.lastStudyDate = safeDateKey(rawProfile.lastStudy || rawProfile.lastStudyDate || profile.totals.lastStudyDate);
  profile.totals.lastAnsweredAt = safeIsoDate(rawProfile.lastAnsweredAt || rawProfile.updatedAt || profile.totals.lastAnsweredAt);
  deriveFromProgress(profile, rawProfile.progress || {});
  deriveFromHistory(profile, rawProfile.history || []);
  profile.mistakes = isObject(rawProfile.mistakes) ? {
    ...createEmptyMistakeSummary(),
    ...rawProfile.mistakes,
    topMistakes: Array.isArray(rawProfile.mistakes.topMistakes) ? rawProfile.mistakes.topMistakes.slice(0, 25) : [],
    recentMistakes: Array.isArray(rawProfile.mistakes.recentMistakes) ? rawProfile.mistakes.recentMistakes.slice(0, 50) : [],
    weeklyMistakes: Array.isArray(rawProfile.mistakes.weeklyMistakes) ? rawProfile.mistakes.weeklyMistakes.slice(0, 100) : [],
    monthlyMistakes: Array.isArray(rawProfile.mistakes.monthlyMistakes) ? rawProfile.mistakes.monthlyMistakes.slice(0, 200) : []
  } : createEmptyMistakeSummary();
}

function loadLegacySnapshot(studentId = DEFAULT_STUDENT_ID, seedProfile = null) {
  const orderedKeys = seedProfile ? [] : [...LEGACY_PROFILE_KEYS];
  if (seedProfile) {
    deriveFromLegacyProfile(seedProfile, seedProfile);
    return seedProfile;
  }

  for (const key of orderedKeys) {
    const raw = readJson(key);
    if (!raw) continue;
    const profile = createDefaultStudentProfile(studentId);
    const source = raw.profile || raw;
    deriveFromLegacyProfile(profile, source);
    return profile;
  }

  return null;
}

export function createDefaultStudentProfile(studentId = DEFAULT_STUDENT_ID) {
  const now = new Date().toISOString();
  return {
    version: PROFILE_VERSION,
    studentId: normalizeStudentId(studentId),
    name: '',
    year: 'Tahun 2',
    avatar: 'janna',
    isDemo: false,
    createdAt: now,
    updatedAt: now,
    totals: createEmptyTotals(),
    mistakes: createEmptyMistakeSummary(),
    subjects: {},
    topics: {}
  };
}

function recalculateSubjectStats(profile) {
  const subjects = profile.subjects && isObject(profile.subjects) ? profile.subjects : {};
  Object.values(subjects).forEach(subject => {
    const topics = subject.topics && isObject(subject.topics) ? subject.topics : {};
    const topicList = Object.entries(topics).map(([topicId, topic]) => normalizeTopicRecord(topic, subject.subjectId, topicId));
    subject.topics = Object.fromEntries(topicList.map(topic => [topic.topicId, topic]));
    topicList.forEach(topic => {
      profile.topics[subject.subjectId] = profile.topics[subject.subjectId] || {};
      profile.topics[subject.subjectId][topic.topicId] = topic;
    });
    subject.topicCount = topicList.length;
    subject.attempts = topicList.reduce((sum, topic) => sum + topic.attempts, 0);
    subject.correct = topicList.reduce((sum, topic) => sum + topic.correct, 0);
    subject.wrong = topicList.reduce((sum, topic) => sum + topic.wrong, 0);
    const totalResponseTimeMs = topicList.reduce((sum, topic) => sum + topic.totalResponseTimeMs, 0);
    subject.totalResponseTimeMs = totalResponseTimeMs;
    subject.averageResponseTimeMs = subject.attempts > 0 ? Math.round(totalResponseTimeMs / subject.attempts) : 0;
    subject.accuracy = subject.attempts > 0 ? Math.round((subject.correct / subject.attempts) * 100) : 0;
    subject.lastPractised = topicList.reduce((latest, topic) => {
      const date = topic.lastPractised || topic.lastAttemptAt || '';
      if (!date) return latest;
      if (!latest) return date;
      return String(date) > String(latest) ? date : latest;
    }, subject.lastPractised || null);
    const sortedByStrength = topicList.slice().sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (a.attempts !== b.attempts) return b.attempts - a.attempts;
      return `${a.topicId}`.localeCompare(`${b.topicId}`);
    });
    subject.strongestTopic = sortedByStrength[0]
      ? { topicId: sortedByStrength[0].topicId, title: sortedByStrength[0].title || sortedByStrength[0].topicId, confidence: sortedByStrength[0].confidence, accuracy: sortedByStrength[0].accuracy, status: sortedByStrength[0].status, statusLabel: sortedByStrength[0].statusLabel }
      : null;
    const weakestSorted = topicList.slice().sort((a, b) => {
      if (a.confidence !== b.confidence) return a.confidence - b.confidence;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      if (a.attempts !== b.attempts) return a.attempts - b.attempts;
      return `${a.topicId}`.localeCompare(`${b.topicId}`);
    });
    subject.weakestTopic = weakestSorted[0]
      ? { topicId: weakestSorted[0].topicId, title: weakestSorted[0].title || weakestSorted[0].topicId, confidence: weakestSorted[0].confidence, accuracy: weakestSorted[0].accuracy, status: weakestSorted[0].status, statusLabel: weakestSorted[0].statusLabel }
      : null;
  });

  const subjectList = Object.values(subjects);
  profile.totals.questionsAnswered = subjectList.reduce((sum, subject) => sum + subject.attempts, 0);
  profile.totals.correct = subjectList.reduce((sum, subject) => sum + subject.correct, 0);
  profile.totals.wrong = subjectList.reduce((sum, subject) => sum + subject.wrong, 0);
  profile.totals.accuracy = profile.totals.questionsAnswered > 0
    ? Math.round((profile.totals.correct / profile.totals.questionsAnswered) * 100)
    : 0;
  profile.totals.averageResponseTimeMs = profile.totals.questionsAnswered > 0
    ? Math.round(subjectList.reduce((sum, subject) => sum + subject.totalResponseTimeMs, 0) / profile.totals.questionsAnswered)
    : 0;
  profile.totals.totalResponseTimeMs = subjectList.reduce((sum, subject) => sum + subject.totalResponseTimeMs, 0);
  profile.totals.currentStreak = Math.max(0, toNumber(profile.totals.currentStreak, 0));
  profile.totals.longestStreak = Math.max(profile.totals.currentStreak, toNumber(profile.totals.longestStreak, 0));
  profile.totals.totalStudySeconds = Math.max(0, toNumber(profile.totals.totalStudySeconds, 0));
  profile.totals.activitiesCompleted = Math.max(0, toNumber(profile.totals.activitiesCompleted, 0));
}

export function normalizeStudentProfile(rawProfile = {}, studentId = DEFAULT_STUDENT_ID) {
  const source = isObject(rawProfile) ? clone(rawProfile) : {};
  const normalized = createDefaultStudentProfile(source.studentId || studentId);
  normalized.version = PROFILE_VERSION;
  normalized.studentId = normalizeStudentId(source.studentId || studentId);
  normalized.name = toText(source.name || '', normalized.name);
  normalized.year = toText(source.year || normalized.year, normalized.year);
  normalized.avatar = toText(source.avatar || normalized.avatar, normalized.avatar);
  normalized.isDemo = Boolean(source.isDemo ?? normalized.isDemo);
  normalized.createdAt = safeIsoDate(source.createdAt || normalized.createdAt) || normalized.createdAt;
  normalized.updatedAt = safeIsoDate(source.updatedAt || normalized.updatedAt) || normalized.updatedAt;

  const totals = isObject(source.totals) ? source.totals : {};
  normalized.totals.questionsAnswered = Math.max(0, toNumber(source.totalQuestions ?? totals.questionsAnswered, normalized.totals.questionsAnswered));
  normalized.totals.correct = Math.max(0, toNumber(source.totalCorrect ?? source.correctQuestions ?? totals.correct, normalized.totals.correct));
  normalized.totals.wrong = Math.max(0, toNumber(source.totalWrong ?? totals.wrong, normalized.totals.wrong));
  normalized.totals.accuracy = Math.max(0, toNumber(totals.accuracy, normalized.totals.questionsAnswered > 0 ? Math.round((normalized.totals.correct / normalized.totals.questionsAnswered) * 100) : 0));
  normalized.totals.currentStreak = Math.max(0, toNumber(source.currentStreak ?? source.streak ?? totals.currentStreak, normalized.totals.currentStreak));
  normalized.totals.longestStreak = Math.max(0, toNumber(source.longestStreak ?? totals.longestStreak, normalized.totals.currentStreak));
  normalized.totals.totalStudySeconds = Math.max(0, toNumber(source.totalStudySeconds ?? totals.totalStudySeconds, normalized.totals.totalStudySeconds));
  normalized.totals.averageResponseTimeMs = Math.max(0, toNumber(totals.averageResponseTimeMs, normalized.totals.averageResponseTimeMs));
  normalized.totals.totalResponseTimeMs = Math.max(0, toNumber(totals.totalResponseTimeMs, normalized.totals.totalResponseTimeMs));
  normalized.totals.lastAnsweredAt = safeIsoDate(source.lastAnsweredAt || totals.lastAnsweredAt || '');
  normalized.totals.lastStudyDate = safeDateKey(source.lastStudy || source.lastStudyDate || totals.lastStudyDate || '');
  normalized.totals.activitiesCompleted = Math.max(0, toNumber(totals.activitiesCompleted, normalized.totals.activitiesCompleted));

  const subjects = isObject(source.subjects) ? source.subjects : {};
  Object.entries(subjects).forEach(([subjectId, subject]) => {
    normalized.subjects[subjectId] = normalizeSubjectRecord(subject, subjectId);
  });

  const topics = isObject(source.topics) ? source.topics : {};
  Object.entries(topics).forEach(([subjectId, topicMap]) => {
    if (!isObject(topicMap)) return;
    Object.entries(topicMap).forEach(([topicId, topic]) => {
      const existing = normalized.subjects[subjectId]?.topics?.[topicId] || null;
      const record = normalizeTopicRecord({ ...(existing || {}), ...(topic || {}) }, subjectId, topicId);
      const subject = normalized.subjects[subjectId] || ensureSubject(normalized, subjectId);
      subject.topics[topicId] = record;
      normalized.topics[subjectId] = normalized.topics[subjectId] || {};
      normalized.topics[subjectId][topicId] = record;
    });
  });

  deriveFromProgress(normalized, source.progress || {});
  deriveFromHistory(normalized, source.history || []);
  recalculateSubjectStats(normalized);
  return normalized;
}

export function loadStudentProfile(studentId = DEFAULT_STUDENT_ID, seedProfile = null) {
  const resolvedStudentId = normalizeStudentId(studentId);
  const key = storageKey(resolvedStudentId);
  const stored = readJson(key);
  if (stored) {
    return normalizeStudentProfile(stored, resolvedStudentId);
  }

  const legacySeed = seedProfile && isObject(seedProfile)
    ? seedProfile
    : loadLegacySnapshot(resolvedStudentId);
  const normalized = normalizeStudentProfile(legacySeed || {}, resolvedStudentId);
  saveStudentProfile(normalized, resolvedStudentId);
  return normalized;
}

export function saveStudentProfile(profile = {}, studentId = profile?.studentId || DEFAULT_STUDENT_ID) {
  const normalized = normalizeStudentProfile(profile, studentId);
  normalized.updatedAt = new Date().toISOString();
  writeJson(storageKey(normalized.studentId), normalized);
  return normalized;
}

export function getStudentProfile(studentId = DEFAULT_STUDENT_ID) {
  return loadStudentProfile(studentId);
}

export function cloneStudentProfile(profile = {}) {
  return clone(profile);
}

export function resolveStudentId(profile = {}, fallback = DEFAULT_STUDENT_ID) {
  return normalizeStudentId(profile?.studentId || profile?.id || fallback);
}

export function listKnownStudentIds() {
  if (!hasStorage()) return [];
  try {
    const ids = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(`${STORAGE_PREFIX}:`)) continue;
      ids.push(key.slice(`${STORAGE_PREFIX}:`.length));
    }
    return [...new Set(ids)];
  } catch {
    return [];
  }
}

export { DEFAULT_STUDENT_ID, LEGACY_PROFILE_KEYS, PROFILE_VERSION, STORAGE_PREFIX };

export default {
  createDefaultStudentProfile,
  loadStudentProfile,
  saveStudentProfile,
  getStudentProfile,
  normalizeStudentProfile,
  resolveStudentId,
  listKnownStudentIds,
  cloneStudentProfile
};
