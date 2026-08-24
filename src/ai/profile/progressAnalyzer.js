import { loadStudentProfile } from './studentProfile.js';
import { getMistakeSummary } from '../mistakes/index.js';

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function collectTopicRows(profile = {}) {
  const subjects = profile.subjects && typeof profile.subjects === 'object' ? profile.subjects : {};
  return Object.values(subjects).flatMap(subject => {
    const topics = subject.topics && typeof subject.topics === 'object' ? subject.topics : {};
    return Object.values(topics).map(topic => ({
      studentId: profile.studentId || 'default',
      subjectId: subject.subjectId || '',
      subjectTitle: subject.title || subject.short || subject.subjectId || '',
      topicId: topic.topicId || '',
      topicTitle: topic.title || topic.topicId || '',
      attempts: Math.max(0, toNumber(topic.attempts, 0)),
      correct: Math.max(0, toNumber(topic.correct, 0)),
      wrong: Math.max(0, toNumber(topic.wrong, 0)),
      accuracy: Math.max(0, toNumber(topic.accuracy, 0)),
      confidence: Math.max(0, Math.min(100, toNumber(topic.confidence, 50))),
      status: topic.status || 'needs_practice',
      statusLabel: topic.statusLabel || 'Needs Practice',
      lastPractised: topic.lastPractised || null,
      averageResponseTimeMs: Math.max(0, toNumber(topic.averageResponseTimeMs, 0))
    }));
  });
}

function sortWeakFirst(a, b) {
  if (a.confidence !== b.confidence) return a.confidence - b.confidence;
  if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
  if (a.attempts !== b.attempts) return a.attempts - b.attempts;
  if (a.subjectId !== b.subjectId) return a.subjectId.localeCompare(b.subjectId);
  return a.topicId.localeCompare(b.topicId);
}

function sortStrongFirst(a, b) {
  if (b.confidence !== a.confidence) return b.confidence - a.confidence;
  if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
  if (b.attempts !== a.attempts) return b.attempts - a.attempts;
  if (a.subjectId !== b.subjectId) return a.subjectId.localeCompare(b.subjectId);
  return a.topicId.localeCompare(b.topicId);
}

export function analyzeStudentProgress(studentId = 'default', profile = null) {
  const nextProfile = profile && typeof profile === 'object'
    ? profile
    : loadStudentProfile(studentId);
  const rows = collectTopicRows(nextProfile).filter(row => row.attempts > 0);
  const weakTopics = rows.slice().sort(sortWeakFirst);
  const strongTopics = rows.slice().sort(sortStrongFirst);
  const subjectMap = new Map();

  rows.forEach(row => {
    const subject = subjectMap.get(row.subjectId) || {
      subjectId: row.subjectId,
      subjectTitle: row.subjectTitle,
      attempts: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      averageResponseTimeMs: 0,
      weakestTopic: null,
      strongestTopic: null,
      topics: []
    };
    subject.attempts += row.attempts;
    subject.correct += row.correct;
    subject.wrong += row.wrong;
    subject.topics.push(row);
    subject.averageResponseTimeMs += row.averageResponseTimeMs;
    subjectMap.set(row.subjectId, subject);
  });

  const subjects = Array.from(subjectMap.values()).map(subject => {
    subject.accuracy = subject.attempts > 0 ? Math.round((subject.correct / subject.attempts) * 100) : 0;
    subject.averageResponseTimeMs = subject.topics.length > 0
      ? Math.round(subject.averageResponseTimeMs / subject.topics.length)
      : 0;
    const sortedWeak = subject.topics.slice().sort(sortWeakFirst);
    const sortedStrong = subject.topics.slice().sort(sortStrongFirst);
    subject.weakestTopic = sortedWeak[0] || null;
    subject.strongestTopic = sortedStrong[0] || null;
    return subject;
  }).sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return a.subjectId.localeCompare(b.subjectId);
  });

  return {
    studentId: nextProfile.studentId || studentId || 'default',
    name: nextProfile.name || '',
    year: nextProfile.year || 'Tahun 2',
    avatar: nextProfile.avatar || 'janna',
    totals: {
      ...nextProfile.totals,
      accuracy: Math.max(0, toNumber(nextProfile.totals?.accuracy, 0))
    },
    subjects,
    weakTopics,
    strongTopics,
    weakestTopic: weakTopics[0] || null,
    strongestTopic: strongTopics[0] || null,
    mistakeSummary: getMistakeSummary(nextProfile),
    summary: {
      questionsAnswered: Math.max(0, toNumber(nextProfile.totals?.questionsAnswered, 0)),
      correct: Math.max(0, toNumber(nextProfile.totals?.correct, 0)),
      wrong: Math.max(0, toNumber(nextProfile.totals?.wrong, 0)),
      accuracy: Math.max(0, toNumber(nextProfile.totals?.accuracy, 0)),
      currentStreak: Math.max(0, toNumber(nextProfile.totals?.currentStreak, 0)),
      longestStreak: Math.max(0, toNumber(nextProfile.totals?.longestStreak, 0))
    }
  };
}

export function getWeakTopics(studentId = 'default', limit = 8, profile = null) {
  const analysis = analyzeStudentProgress(studentId, profile);
  return analysis.weakTopics.slice(0, Math.max(0, Number(limit) || 0));
}

export function getStrongTopics(studentId = 'default', limit = 8, profile = null) {
  const analysis = analyzeStudentProgress(studentId, profile);
  return analysis.strongTopics.slice(0, Math.max(0, Number(limit) || 0));
}

export function getTopicProgress(studentId = 'default', subjectId = '', topicId = '', profile = null) {
  const analysis = analyzeStudentProgress(studentId, profile);
  return analysis.weakTopics.concat(analysis.strongTopics).find(topic => topic.subjectId === subjectId && topic.topicId === topicId) || null;
}

export function getSubjectProgress(studentId = 'default', subjectId = '', profile = null) {
  const analysis = analyzeStudentProgress(studentId, profile);
  return analysis.subjects.find(subject => subject.subjectId === subjectId) || null;
}

export function getStudentProfileSummary(studentId = 'default', profile = null) {
  return analyzeStudentProgress(studentId, profile);
}

export default {
  analyzeStudentProgress,
  getWeakTopics,
  getStrongTopics,
  getTopicProgress,
  getSubjectProgress,
  getStudentProfileSummary
};
