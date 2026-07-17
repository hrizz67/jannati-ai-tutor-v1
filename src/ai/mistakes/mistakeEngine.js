import { buildMistakeStatistics, buildMistakeReport, summarizeMistakeImprovement } from './mistakeStatistics.js';
import { classifyMistake } from './mistakeClassifier.js';
import { loadStudentProfile, saveStudentProfile } from '../profile/studentProfile.js';

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

function ensureMistakeShape(profile = {}) {
  const next = clone(profile);
  if (!isObject(next.mistakes)) {
    next.mistakes = {};
  }
  next.mistakes.total = Math.max(0, toNumber(next.mistakes.total, 0));
  next.mistakes.repeatedMistakes = Math.max(0, toNumber(next.mistakes.repeatedMistakes, 0));
  next.mistakes.topMistakes = Array.isArray(next.mistakes.topMistakes) ? next.mistakes.topMistakes : [];
  next.mistakes.recentMistakes = Array.isArray(next.mistakes.recentMistakes) ? next.mistakes.recentMistakes : [];
  next.mistakes.weeklyMistakes = Array.isArray(next.mistakes.weeklyMistakes) ? next.mistakes.weeklyMistakes : [];
  next.mistakes.monthlyMistakes = Array.isArray(next.mistakes.monthlyMistakes) ? next.mistakes.monthlyMistakes : [];
  next.mistakes.byType = isObject(next.mistakes.byType) ? next.mistakes.byType : {};
  next.mistakes.bySubject = isObject(next.mistakes.bySubject) ? next.mistakes.bySubject : {};
  next.mistakes.byTopic = isObject(next.mistakes.byTopic) ? next.mistakes.byTopic : {};
  next.mistakes.improvementTrend = Math.max(-100, Math.min(100, toNumber(next.mistakes.improvementTrend, 0)));
  return next;
}

function trimList(items = [], max = 50) {
  const rows = Array.isArray(items) ? items.slice() : [];
  if (rows.length <= max) return rows;
  return rows.slice(rows.length - max);
}

function updateCountMap(map, key, record) {
  if (!key) return;
  const current = map[key] && isObject(map[key]) ? map[key] : { count: 0 };
  map[key] = {
    ...current,
    count: Math.max(0, toNumber(current.count, 0)) + 1,
    lastAt: record.timestamp || current.lastAt || null,
    subjectId: record.subject || record.subjectId || current.subjectId || null,
    topicId: record.topic || record.topicId || current.topicId || null,
    topicTitle: record.topicTitle || current.topicTitle || '',
    subjectTitle: record.subjectTitle || current.subjectTitle || '',
    mistakeType: record.mistakeType || current.mistakeType || key,
    teacherSuggestion: record.teacherSuggestion || current.teacherSuggestion || '',
    recommendedPractice: record.recommendedPractice || current.recommendedPractice || '',
    confidence: Math.max(0, Math.min(100, toNumber(record.confidence, current.confidence ?? 0)))
  };
}

function rebuildMistakeRollups(profile = {}) {
  const records = Array.isArray(profile.mistakes?.recentMistakes) ? profile.mistakes.recentMistakes : [];
  const weekly = Array.isArray(profile.mistakes?.weeklyMistakes) ? profile.mistakes.weeklyMistakes : [];
  const monthly = Array.isArray(profile.mistakes?.monthlyMistakes) ? profile.mistakes.monthlyMistakes : [];
  const combined = [...monthly, ...weekly, ...records];
  const stats = buildMistakeStatistics(combined);
  profile.mistakes.total = stats.total;
  profile.mistakes.repeatedMistakes = stats.repeatedMistakes;
  profile.mistakes.topMistakes = stats.topMistakes.slice(0, 10);
  profile.mistakes.improvementTrend = stats.improvementTrend;
  return profile;
}

function syncTopicMistakes(profile = {}, record = {}) {
  const subjectId = record.subject || record.subjectId || '';
  const topicId = record.topic || record.topicId || '';
  if (!subjectId || !topicId) return;
  if (!profile.subjects || !isObject(profile.subjects)) return;
  const subject = profile.subjects[subjectId];
  if (!subject) return;
  if (!isObject(subject.topics)) subject.topics = {};
  const topic = subject.topics[topicId];
  if (!topic || !isObject(topic)) return;
  topic.mistakeCount = Math.max(0, toNumber(topic.mistakeCount, 0)) + 1;
  topic.recentMistakes = trimList([record, ...(Array.isArray(topic.recentMistakes) ? topic.recentMistakes : [])], 10);
  const topicStats = buildMistakeReport(topic.recentMistakes);
  topic.topMistakes = topicStats.top10.slice(0, 5);
}

function syncSubjectMistakes(profile = {}, record = {}) {
  const subjectId = record.subject || record.subjectId || '';
  if (!subjectId || !profile.subjects || !isObject(profile.subjects)) return;
  const subject = profile.subjects[subjectId];
  if (!subject) return;
  subject.mistakeCount = Math.max(0, toNumber(subject.mistakeCount, 0)) + 1;
  subject.recentMistakes = trimList([record, ...(Array.isArray(subject.recentMistakes) ? subject.recentMistakes : [])], 10);
  const subjectStats = buildMistakeReport(subject.recentMistakes);
  subject.topMistakes = subjectStats.top10.slice(0, 5);
  subject.mostRepeatedMistake = subjectStats.top10[0] || null;
  subject.improvementTrend = subjectStats.improvementTrend;
}

export function loadMistakeProfile(studentId = 'default', seedProfile = null) {
  const profile = loadStudentProfile(studentId, seedProfile || undefined);
  return ensureMistakeShape(profile);
}

export function saveMistakeProfile(profile = {}, studentId = profile?.studentId || 'default') {
  const normalized = ensureMistakeShape(profile);
  normalized.mistakes = rebuildMistakeRollups(normalized).mistakes;
  return saveStudentProfile(normalized, studentId);
}

export function recordMistake(profile = {}, input = {}) {
  const normalizedProfile = ensureMistakeShape(profile);
  const record = classifyMistake(input);
  const enrichedRecord = {
    ...record,
    subjectId: record.subject || input.subjectId || input.subject?.id || null,
    topicId: record.topic || input.topicId || input.topic?.id || null,
    subjectTitle: record.subjectTitle || input.subject?.title || '',
    topicTitle: record.topicTitle || input.topic?.title || '',
    timestamp: record.timestamp || input.timestamp || new Date().toISOString()
  };

  normalizedProfile.mistakes.total += 1;
  normalizedProfile.mistakes.recentMistakes = trimList([enrichedRecord, ...normalizedProfile.mistakes.recentMistakes], 50);
  normalizedProfile.mistakes.weeklyMistakes = trimList([enrichedRecord, ...normalizedProfile.mistakes.weeklyMistakes], 100);
  normalizedProfile.mistakes.monthlyMistakes = trimList([enrichedRecord, ...normalizedProfile.mistakes.monthlyMistakes], 200);
  updateCountMap(normalizedProfile.mistakes.byType, enrichedRecord.mistakeType, enrichedRecord);
  updateCountMap(normalizedProfile.mistakes.bySubject, enrichedRecord.subjectId || enrichedRecord.subject || '', enrichedRecord);
  updateCountMap(normalizedProfile.mistakes.byTopic, `${enrichedRecord.subjectId || enrichedRecord.subject || ''}:${enrichedRecord.topicId || enrichedRecord.topic || ''}`, enrichedRecord);
  syncSubjectMistakes(normalizedProfile, enrichedRecord);
  syncTopicMistakes(normalizedProfile, enrichedRecord);
  rebuildMistakeRollups(normalizedProfile);
  return normalizedProfile;
}

export function recordMistakes(profile = {}, inputs = []) {
  const rows = Array.isArray(inputs) ? inputs : [inputs];
  return rows.reduce((state, input) => recordMistake(state, input), profile);
}

export function getTopMistakes(profile = {}, limit = 10) {
  const normalized = ensureMistakeShape(profile);
  const stats = buildMistakeStatistics([
    ...(normalized.mistakes.monthlyMistakes || []),
    ...(normalized.mistakes.weeklyMistakes || []),
    ...(normalized.mistakes.recentMistakes || [])
  ]);
  return stats.topMistakes.slice(0, Math.max(0, Number(limit) || 0));
}

export function getRecentMistakes(profile = {}, limit = 10) {
  const normalized = ensureMistakeShape(profile);
  return normalized.mistakes.recentMistakes.slice(0, Math.max(0, Number(limit) || 0));
}

export function getWeeklyMistakes(profile = {}) {
  const normalized = ensureMistakeShape(profile);
  return normalized.mistakes.weeklyMistakes.slice(0, 20);
}

export function getMonthlyMistakes(profile = {}) {
  const normalized = ensureMistakeShape(profile);
  return normalized.mistakes.monthlyMistakes.slice(0, 50);
}

export function getMistakeSummary(profile = {}) {
  const normalized = ensureMistakeShape(profile);
  const stats = buildMistakeStatistics([
    ...(normalized.mistakes.monthlyMistakes || []),
    ...(normalized.mistakes.weeklyMistakes || []),
    ...(normalized.mistakes.recentMistakes || [])
  ]);
  return {
    total: stats.total,
    repeatedMistakes: stats.repeatedMistakes,
    topMistakes: stats.topMistakes.slice(0, 10),
    recentMistakes: stats.recentMistakes.slice(0, 10),
    weeklyMistakes: stats.weeklyMistakes.slice(0, 10),
    monthlyMistakes: stats.monthlyMistakes.slice(0, 10),
    improvementTrend: stats.improvementTrend,
    byType: stats.byType,
    bySubject: stats.bySubject,
    byTopic: stats.byTopic
  };
}

export function getMistakeContext(profile = {}, subjectId = '', topicId = '') {
  const normalized = ensureMistakeShape(profile);
  const topicKey = `${subjectId || ''}:${topicId || ''}`;
  const byTopic = normalized.mistakes.byTopic?.[topicKey] || null;
  const bySubject = normalized.mistakes.bySubject?.[subjectId || ''] || null;
  const topMistakes = getTopMistakes(normalized, 5);
  const recentMistakes = getRecentMistakes(normalized, 5);
  return {
    total: normalized.mistakes.total,
    repeatedMistakes: normalized.mistakes.repeatedMistakes,
    improvementTrend: normalized.mistakes.improvementTrend,
    topMistakes,
    recentMistakes,
    bySubject,
    byTopic,
    currentTopic: byTopic || null,
    currentSubject: bySubject || null,
    focusMistake: byTopic?.mistakeType || bySubject?.mistakeType || topMistakes[0]?.mistakeType || 'UNKNOWN_MISTAKE'
  };
}

export default {
  loadMistakeProfile,
  saveMistakeProfile,
  recordMistake,
  recordMistakes,
  getTopMistakes,
  getRecentMistakes,
  getWeeklyMistakes,
  getMonthlyMistakes,
  getMistakeSummary,
  getMistakeContext
};
