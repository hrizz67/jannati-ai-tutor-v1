import { generateRecommendation } from '../adaptive/recommendationEngine.js';
import { rankWeakTopics } from '../adaptive/weakTopicEngine.js';
import { getMistakeContext } from '../mistakes/index.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const offsetMinutes = -date.getTimezoneOffset();
  const local = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function daysSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function getTopicRecords(profile = {}) {
  const subjects = profile.topics && typeof profile.topics === 'object' ? profile.topics : {};
  return Object.entries(subjects).flatMap(([subjectId, subjectTopics]) => {
    if (!subjectTopics || typeof subjectTopics !== 'object') return [];
    return Object.entries(subjectTopics).map(([topicId, record]) => ({
      subjectId,
      topicId,
      title: record?.title || topicId,
      record: record && typeof record === 'object' ? { ...record } : {}
    }));
  });
}

function getWeakTopicMap(profile = {}) {
  return new Map(rankWeakTopics(profile, { limit: 100, includeLowConfidence: true }).map(topic => [
    `${topic.subjectId}_${topic.topicId}`,
    topic
  ]));
}

function getRecentTopicMap(profile = {}) {
  const recent = getTopicRecords(profile)
    .filter(entry => entry.record.lastPlayed)
    .sort((a, b) => String(b.record.lastPlayed).localeCompare(String(a.record.lastPlayed)));
  return new Map(recent.map(entry => [`${entry.subjectId}_${entry.topicId}`, entry]));
}

function normalizeTopic(entry = {}, weakTopicMap = new Map(), recentTopicMap = new Map(), nowKey = localDateKey()) {
  const record = entry.record || {};
  const weakTopic = weakTopicMap.get(`${entry.subjectId}_${entry.topicId}`) || {};
  const lastPlayed = record.lastPlayed || weakTopic.lastPlayed || null;
  const lastPlayedDays = daysSince(lastPlayed);

  return {
    subjectId: entry.subjectId,
    topicId: entry.topicId,
    title: record.title || weakTopic.title || entry.title || entry.topicId,
    mastery: clamp(toNumber(record.mastery, weakTopic.mastery ?? 0), 0, 100),
    confidence: clamp(toNumber(record.confidence, weakTopic.confidence ?? 0), 0, 100),
    accuracy: clamp(toNumber(record.accuracy, weakTopic.accuracy ?? 0), 0, 100),
    total: Math.max(0, toNumber(record.total, weakTopic.attempts ?? 0)),
    correct: Math.max(0, toNumber(record.correct, weakTopic.correct ?? 0)),
    wrong: Math.max(0, toNumber(record.wrong, weakTopic.wrong ?? 0)),
    priority: clamp(toNumber(weakTopic.priority, 0), 0, 100),
    weakStatus: weakTopic.status || 'developing',
    lastPlayed,
    lastPlayedDays: lastPlayedDays == null ? 999 : lastPlayedDays,
    recencyScore: clamp(100 - ((lastPlayedDays ?? 999) * 12), 0, 100),
    recentActivity: recentTopicMap.has(`${entry.subjectId}_${entry.topicId}`) ? 1 : 0,
    nowKey
  };
}

function estimateQuestionCount(planSize = 10, topicCount = 0) {
  if (topicCount <= 0) return 0;
  return Math.max(1, Math.floor(planSize / topicCount));
}

export function calculateRevisionPriority(topic = {}) {
  const masteryNeed = 100 - clamp(toNumber(topic.mastery, 0), 0, 100);
  const confidenceNeed = 100 - clamp(toNumber(topic.confidence, 0), 0, 100);
  const recencyNeed = clamp(toNumber(topic.recencyScore, 0), 0, 100);
  const weakPriority = clamp(toNumber(topic.priority, 0), 0, 100);
  const score = (
    masteryNeed * 0.4 +
    confidenceNeed * 0.2 +
    recencyNeed * 0.2 +
    weakPriority * 0.2
  );
  return clamp(Math.round(score), 0, 100);
}

function buildCandidateList(profile = {}) {
  const records = getTopicRecords(profile);
  const weakMap = getWeakTopicMap(profile);
  const recentMap = getRecentTopicMap(profile);
  const today = localDateKey();
  const mistakeContext = getMistakeContext(profile, '', '');

  return records.map(entry => {
    const topic = normalizeTopic(entry, weakMap, recentMap, today);
    const priority = calculateRevisionPriority(topic);
    const topicKey = `${entry.subjectId}_${entry.topicId}`;
    const repeatedMistakeBonus = Math.max(
      0,
      Math.min(
        20,
        (profile.mistakes?.byTopic?.[`${entry.subjectId}:${entry.topicId}`]?.count || 0) * 4 +
        (profile.mistakes?.byType?.[mistakeContext.focusMistake]?.count || 0) * 2
      )
    );
    return {
      ...topic,
      priority: clamp(priority + repeatedMistakeBonus, 0, 100),
      repeatedMistakeCount: profile.mistakes?.byTopic?.[`${entry.subjectId}:${entry.topicId}`]?.count || 0,
      focusMistake: profile.mistakes?.byTopic?.[`${entry.subjectId}:${entry.topicId}`]?.mistakeType || mistakeContext.focusMistake || 'UNKNOWN_MISTAKE',
      topicKey
    };
  }).sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (b.mastery !== a.mastery) return a.mastery - b.mastery;
    if (a.lastPlayedDays !== b.lastPlayedDays) return b.lastPlayedDays - a.lastPlayedDays;
    return `${a.subjectId}_${a.topicId}`.localeCompare(`${b.subjectId}_${b.topicId}`);
  });
}

function allocateQuestionsBySubject(topics = [], totalQuestions = 0) {
  if (!topics.length || totalQuestions <= 0) return [];

  const subjectGroups = new Map();
  topics.forEach(topic => {
    if (!subjectGroups.has(topic.subjectId)) {
      subjectGroups.set(topic.subjectId, []);
    }
    subjectGroups.get(topic.subjectId).push(topic);
  });

  const subjectOrder = [...subjectGroups.keys()].sort((a, b) => {
    const firstA = subjectGroups.get(a)[0]?.priority || 0;
    const firstB = subjectGroups.get(b)[0]?.priority || 0;
    if (firstB !== firstA) return firstB - firstA;
    return a.localeCompare(b);
  });

  const weightedSubjects = subjectOrder.map(subjectId => {
    const items = subjectGroups.get(subjectId);
    const subjectPriority = items.reduce((sum, topic) => sum + topic.priority, 0) / Math.max(1, items.length);
    return {
      subjectId,
      topics: items,
      weight: Math.max(1, Math.round(subjectPriority))
    };
  });

  const weightTotal = weightedSubjects.reduce((sum, subject) => sum + subject.weight, 0) || 1;
  const seeded = weightedSubjects.map(subject => ({
    ...subject,
    questionCount: Math.floor((subject.weight / weightTotal) * totalQuestions)
  }));

  let remaining = totalQuestions - seeded.reduce((sum, subject) => sum + subject.questionCount, 0);
  const rankedByRemainder = weightedSubjects
    .map(subject => ({
      ...subject,
      remainder: ((subject.weight / weightTotal) * totalQuestions) - Math.floor((subject.weight / weightTotal) * totalQuestions)
    }))
    .sort((a, b) => {
      if (b.remainder !== a.remainder) return b.remainder - a.remainder;
      return b.weight - a.weight;
    });

  let index = 0;
  while (remaining > 0 && rankedByRemainder.length > 0) {
    const subject = rankedByRemainder[index % rankedByRemainder.length];
    const current = seeded.find(item => item.subjectId === subject.subjectId);
    current.questionCount += 1;
    remaining -= 1;
    index += 1;
  }

  return seeded.map(subject => ({
    subjectId: subject.subjectId,
    topics: subject.topics,
    questionCount: subject.questionCount
  }));
}

export function estimateRevisionTime(plan = {}) {
  const questions = Math.max(0, toNumber(plan.totalQuestions, 0));
  const subjects = Array.isArray(plan.subjects) ? plan.subjects : [];
  const subjectMinutes = subjects.reduce((sum, subject) => {
    const subjectQuestions = Math.max(0, toNumber(subject.questions, 0));
    return sum + Math.max(4, subjectQuestions * 3);
  }, 0);
  return Math.max(0, Math.round(subjectMinutes || questions * 3));
}

export function groupRevisionBySubject(plan = {}) {
  return Array.isArray(plan.subjects) ? clone(plan.subjects) : [];
}

export function generateRevisionPlan(profile = {}, options = {}) {
  const planSize = Math.max(1, toNumber(options.questionCount, 10));
  const candidates = buildCandidateList(profile);
  if (!candidates.length) {
    return {
      generatedAt: new Date().toISOString(),
      totalQuestions: 0,
      estimatedMinutes: 0,
      subjects: [],
      priorityTopics: [],
      summary: 'Belum cukup data untuk pelan ulang kaji.'
    };
  }
  const recommendation = generateRecommendation(profile, { ...options, questionCount: planSize, mode: options.mode || 'revision' });
  const recommendedFocus = recommendation?.summary?.recommendedFocus || [];
  const focusKeys = new Set(recommendedFocus.map(topic => `${topic.subjectId}_${topic.topicId}`));

  const priorityTopics = candidates
    .slice(0, Math.max(3, Math.min(8, candidates.length)))
    .map(topic => ({
      subjectId: topic.subjectId,
      topicId: topic.topicId,
      title: topic.title,
      priority: topic.priority,
      mastery: topic.mastery,
      confidence: topic.confidence,
      recencyScore: topic.recencyScore
    }));

  const mergedSelection = [
    ...candidates.filter(topic => focusKeys.has(`${topic.subjectId}_${topic.topicId}`)),
    ...candidates.filter(topic => !focusKeys.has(`${topic.subjectId}_${topic.topicId}`))
  ];

  const selected = mergedSelection.slice(0, Math.max(1, Math.min(planSize, mergedSelection.length || candidates.length)));
  const grouped = allocateQuestionsBySubject(selected, planSize);

  const subjects = grouped.map(subject => ({
    subjectId: subject.subjectId,
    questions: subject.questionCount,
    estimatedMinutes: Math.max(4, Math.round(subject.questionCount * 3)),
    topics: subject.topics
      .slice()
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        if (b.mastery !== a.mastery) return a.mastery - b.mastery;
        return `${a.subjectId}_${a.topicId}`.localeCompare(`${b.subjectId}_${b.topicId}`);
      })
      .slice(0, Math.max(1, Math.min(subject.questionCount, subject.topics.length)))
      .map(topic => ({
        topicId: topic.topicId,
        title: topic.title,
        priority: topic.priority,
        mastery: topic.mastery,
        confidence: topic.confidence,
        recencyScore: topic.recencyScore,
        questionCount: estimateQuestionCount(subject.questionCount, subject.topics.length)
      }))
  }));

  const totalQuestions = subjects.reduce((sum, subject) => sum + subject.questions, 0) || planSize;
  const estimatedMinutes = estimateRevisionTime({ subjects, totalQuestions });
  const summary = selected.length
    ? `Fokus pada ${selected[0].title} dan ulang topik yang masih kerap salah hari ini.`
    : 'Belum cukup data untuk pelan ulang kaji.';

  return {
    generatedAt: new Date().toISOString(),
    totalQuestions,
    estimatedMinutes,
    subjects,
    priorityTopics,
    summary
  };
}

export function getTodayRevision(profile = {}) {
  return generateRevisionPlan(profile, { questionCount: 10, mode: 'today' });
}

export default {
  calculateRevisionPriority,
  estimateRevisionTime,
  generateRevisionPlan,
  getTodayRevision,
  groupRevisionBySubject
};
