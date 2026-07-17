import { generateRevisionPlan, getStrongTopics, getWeakTopics, loadStudentProfile } from '../profile/index.js';
import { getMistakeContext, getMistakeSummary, loadMistakeProfile } from '../mistakes/index.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function topicKey(subjectId = '', topicId = '') {
  return `${subjectId || ''}::${topicId || ''}`;
}

function extractRecentHistory(profile = {}, limit = 40) {
  const history = Array.isArray(profile?.history) ? profile.history : [];
  return history
    .slice()
    .reverse()
    .slice(0, Math.max(0, toNumber(limit, 40)))
    .map(entry => ({
      questionId: String(entry?.questionId || entry?.id || entry?.question?.id || ''),
      subjectId: String(entry?.subjectId || entry?.subject || ''),
      topicId: String(entry?.topicId || entry?.topic || ''),
      difficulty: String(entry?.difficulty || entry?.level || entry?.smartQuestion?.recommendedDifficulty || ''),
      answeredAt: String(entry?.answeredAt || entry?.date || entry?.timestamp || '')
    }))
    .filter(entry => entry.questionId || entry.subjectId || entry.topicId);
}

function buildCountMap(rows = [], keySelector = row => row) {
  const map = new Map();
  rows.forEach(row => {
    const key = keySelector(row);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

function buildTopicSets(topics = []) {
  const set = new Set();
  (Array.isArray(topics) ? topics : []).forEach(topic => {
    if (!topic) return;
    set.add(topicKey(topic.subjectId, topic.topicId));
  });
  return set;
}

export function buildAdaptiveStatistics(candidates = [], options = {}) {
  const profile = options.profile && typeof options.profile === 'object'
    ? options.profile
    : loadStudentProfile(options.studentId || 'default');
  const mistakeProfile = options.mistakeProfile && typeof options.mistakeProfile === 'object'
    ? options.mistakeProfile
    : loadMistakeProfile(profile.studentId || options.studentId || 'default', profile);
  const revisionPlan = options.revisionPlan || generateRevisionPlan(profile.studentId || options.studentId || 'default', {
    limit: options.revisionLimit || 6
  }, profile);
  const weakTopics = options.weakTopics || getWeakTopics(profile.studentId || options.studentId || 'default', options.weakLimit || 20, profile);
  const strongTopics = options.strongTopics || getStrongTopics(profile.studentId || options.studentId || 'default', options.strongLimit || 20, profile);
  const recentHistory = Array.isArray(options.recentHistory) ? options.recentHistory : extractRecentHistory(profile, options.historyLimit || 40);
  const recentQuestionIds = new Set(recentHistory.map(item => item.questionId).filter(Boolean));
  const recentTopicKeys = new Set(recentHistory.map(item => topicKey(item.subjectId, item.topicId)).filter(key => key !== '::'));
  const recentDifficulty = recentHistory.map(item => item.difficulty).filter(Boolean);
  const revisionTopics = new Set(
    (revisionPlan?.subjects || []).flatMap(subject => (subject?.topics || []).map(topic => topicKey(topic.subjectId, topic.topicId)))
  );
  const weakTopicKeys = buildTopicSets(weakTopics);
  const strongTopicKeys = buildTopicSets(strongTopics);
  const candidateTopicCounts = buildCountMap(candidates, question => topicKey(question?.subjectId || question?.qip?.metadata?.subject || '', question?.topicId || question?.qip?.metadata?.topic || ''));
  const candidateSubjectCounts = buildCountMap(candidates, question => String(question?.subjectId || question?.qip?.metadata?.subject || ''));
  const typeCounts = buildCountMap(recentHistory, row => row.difficulty || 'unknown');
  const mistakeContext = getMistakeContext(mistakeProfile || profile, options.subjectId || '', options.topicId || '');
  const mistakeSummary = getMistakeSummary(mistakeProfile || profile);

  return {
    profile,
    mistakeProfile,
    revisionPlan,
    weakTopics,
    strongTopics,
    weakTopicKeys,
    strongTopicKeys,
    revisionTopics,
    mistakeContext,
    mistakeSummary,
    recentHistory,
    recentQuestionIds,
    recentTopicKeys,
    recentDifficulty,
    candidateTopicCounts,
    candidateSubjectCounts,
    difficultyCounts: typeCounts,
    sessionTopicCounts: new Map(),
    sessionSubjectCounts: new Map(),
    topRevisionTopics: new Set(
      (revisionPlan?.subjects || []).flatMap(subject => (subject?.topics || []).slice(0, 3).map(topic => topicKey(topic.subjectId, topic.topicId)))
    )
  };
}

export function updateSessionCounts(statistics = {}, question = {}) {
  const next = statistics;
  const subjectId = String(question?.subjectId || question?.qip?.metadata?.subject || '');
  const topicId = String(question?.topicId || question?.qip?.metadata?.topic || '');
  const topic = topicKey(subjectId, topicId);
  next.sessionTopicCounts = next.sessionTopicCounts instanceof Map ? next.sessionTopicCounts : new Map();
  next.sessionSubjectCounts = next.sessionSubjectCounts instanceof Map ? next.sessionSubjectCounts : new Map();
  if (topic !== '::') {
    next.sessionTopicCounts.set(topic, (next.sessionTopicCounts.get(topic) || 0) + 1);
  }
  if (subjectId) {
    next.sessionSubjectCounts.set(subjectId, (next.sessionSubjectCounts.get(subjectId) || 0) + 1);
  }
  return next;
}

export function getSessionBalancePenalty(statistics = {}, question = {}) {
  const subjectId = String(question?.subjectId || question?.qip?.metadata?.subject || '');
  const topicId = String(question?.topicId || question?.qip?.metadata?.topic || '');
  const topic = topicKey(subjectId, topicId);
  const topicCount = statistics.sessionTopicCounts instanceof Map ? statistics.sessionTopicCounts.get(topic) || 0 : 0;
  const subjectCount = statistics.sessionSubjectCounts instanceof Map ? statistics.sessionSubjectCounts.get(subjectId) || 0 : 0;
  return clamp((Math.max(0, topicCount - 1) * 8) + (Math.max(0, subjectCount - 3) * 4), 0, 30);
}

export default {
  buildAdaptiveStatistics,
  getSessionBalancePenalty,
  updateSessionCounts
};
