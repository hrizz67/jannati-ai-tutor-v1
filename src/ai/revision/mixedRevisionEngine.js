import { generateRevisionPlan } from './revisionPlannerEngine.js';
import { getReviewQueue } from './spacedRepetitionEngine.js';
import { buildDifficultyPlan } from './difficultyEngine.js';
import { generateRecommendation } from '../adaptive/recommendationEngine.js';

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

function normalizeQuestionBank(questionBank) {
  if (!questionBank) return [];
  if (Array.isArray(questionBank)) {
    return questionBank
      .filter(subject => subject && typeof subject === 'object')
      .map(subject => ({
        id: subject.id,
        title: subject.title || subject.short || subject.id || '',
        short: subject.short || subject.title || subject.id || '',
        icon: subject.icon || '📘',
        topics: Array.isArray(subject.topics) ? subject.topics : []
      }));
  }

  if (typeof questionBank === 'object') {
    return Object.entries(questionBank).map(([id, subject]) => ({
      id,
      title: subject?.title || subject?.short || id,
      short: subject?.short || subject?.title || id,
      icon: subject?.icon || '📘',
      topics: Array.isArray(subject?.topics) ? subject.topics : []
    }));
  }

  return [];
}

function flattenQuestionBank(questionBank) {
  return normalizeQuestionBank(questionBank).flatMap(subject => (subject.topics || []).flatMap(topic => {
    const questions = Array.isArray(topic.questions) ? topic.questions : [];
    return questions.map(question => ({
      ...clone(question),
      subjectId: question.subjectId || subject.id || '',
      subjectTitle: question.subjectTitle || subject.title || subject.short || subject.id || '',
      topicId: question.topicId || topic.id || topic.topicId || '',
      topicTitle: question.topicTitle || topic.title || topic.id || ''
    }));
  }));
}

function getCurrentDate() {
  return localDateKey();
}

function getRecentQuestionIds(profile = {}, limit = 40) {
  const ids = [];
  const questionLog = Array.isArray(profile.questionLog) ? profile.questionLog : [];
  for (const entry of questionLog) {
    if (entry?.questionId) ids.push(String(entry.questionId));
    if (ids.length >= limit) break;
  }
  const history = Array.isArray(profile.learningHistory) ? profile.learningHistory : [];
  for (const entry of history) {
    if (entry?.questionId) ids.push(String(entry.questionId));
    if (ids.length >= limit) break;
  }
  return new Set(ids);
}

function getTopicMeta(topicRecord = {}) {
  const mastery = clamp(toNumber(topicRecord.mastery, 0), 0, 100);
  const confidence = clamp(toNumber(topicRecord.confidence, 0), 0, 100);
  const total = Math.max(0, toNumber(topicRecord.total, 0));
  const correct = Math.max(0, toNumber(topicRecord.correct, 0));
  const wrong = Math.max(0, toNumber(topicRecord.wrong, 0));
  const lastPlayed = topicRecord.lastPlayed || null;
  return {
    mastery,
    confidence,
    total,
    correct,
    wrong,
    lastPlayed
  };
}

function getTopicScore(record = {}, queueItem = {}) {
  const mastery = clamp(toNumber(record.mastery, 0), 0, 100);
  const confidence = clamp(toNumber(record.confidence, 0), 0, 100);
  const wrong = Math.max(0, toNumber(record.wrong, 0));
  const total = Math.max(0, toNumber(record.total, 0));
  const overdue = queueItem?.priority === 'critical' || queueItem?.priority === 'high';
  const weakWeight = queueItem?.priorityScore || 0;
  return clamp(Math.round((100 - mastery) * 0.35 + (100 - confidence) * 0.2 + (wrong / Math.max(1, total)) * 100 * 0.2 + (overdue ? 15 : 0) + weakWeight * 0.25), 0, 100);
}

function getDifficultyLabel(record = {}) {
  const mastery = clamp(toNumber(record.mastery, 0), 0, 100);
  const confidence = clamp(toNumber(record.confidence, 0), 0, 100);
  if (mastery < 40) return 'mudah';
  if (mastery <= 60) return confidence < 60 ? 'mudah' : 'sederhana';
  if (mastery <= 80) return 'sederhana';
  if (mastery <= 90) return confidence < 70 ? 'sederhana' : 'sukar';
  return confidence > 90 ? 'sukar' : 'sederhana';
}

function topicKey(topic = {}) {
  return `${topic.subjectId}_${topic.topicId}`;
}

function pickCandidateTopics(profile = {}, questionBank = [], options = {}) {
  const revisionPlan = generateRevisionPlan(profile, { questionCount: options.questionCount || 10, mode: 'revision' });
  const reviewQueue = getReviewQueue(profile);
  const difficultyPlan = buildDifficultyPlan(profile);
  const recommendation = generateRecommendation(profile, { questionCount: options.questionCount || 10, mode: 'revision' });
  const allQuestions = flattenQuestionBank(questionBank);
  const recentQuestionIds = getRecentQuestionIds(profile, 60);
  const selectedByKey = new Set();
  const selected = [];

  const queueTopics = [
    ...(reviewQueue.overdueTopics || []),
    ...(reviewQueue.dueTopics || []),
    ...(revisionPlan.priorityTopics || [])
  ];
  const weakRecommended = (recommendation?.summary?.recommendedFocus || []).map(topic => ({
    subjectId: topic.subjectId,
    topicId: topic.topicId
  }));
  const priorityMap = new Map(queueTopics.map((topic, index) => [topicKey(topic), {
    ...topic,
    queueRank: index
  }]));

  const byTopic = new Map();
  allQuestions.forEach(question => {
    const key = topicKey(question);
    if (!byTopic.has(key)) byTopic.set(key, []);
    byTopic.get(key).push(question);
  });

  const topicOrder = [];
  queueTopics.forEach(topic => {
    const key = topicKey(topic);
    if (!topicOrder.includes(key)) topicOrder.push(key);
  });
  weakRecommended.forEach(topic => {
    const key = topicKey(topic);
    if (!topicOrder.includes(key)) topicOrder.push(key);
  });
  (difficultyPlan.topics || []).forEach(topic => {
    const key = topicKey(topic);
    if (!topicOrder.includes(key)) topicOrder.push(key);
  });
  allQuestions.forEach(question => {
    const key = topicKey(question);
    if (!topicOrder.includes(key)) topicOrder.push(key);
  });

  const totalQuestions = Math.max(1, options.questionCount || 20);
  const targetWeak = Math.max(1, Math.round(totalQuestions * 0.5));
  const targetDeveloping = Math.max(1, Math.round(totalQuestions * 0.3));
  const targetStrong = Math.max(1, totalQuestions - targetWeak - targetDeveloping);
  const targetByBucket = {
    weak: targetWeak,
    developing: targetDeveloping,
    strong: targetStrong
  };
  const bucketCount = {
    weak: 0,
    developing: 0,
    strong: 0
  };

  const bucketForTopic = topic => {
    const mastery = clamp(toNumber(topic.mastery, 0), 0, 100);
    if (mastery < 60) return 'weak';
    if (mastery < 80) return 'developing';
    return 'strong';
  };

  const orderedTopics = topicOrder
    .map(key => {
      const queueItem = priorityMap.get(key) || {};
      const questions = byTopic.get(key) || [];
      const record = profile.topics?.[queueItem.subjectId]?.[queueItem.topicId] || {};
      const meta = getTopicMeta(record);
      const difficultyInfo = (difficultyPlan.topics || []).find(topic => topicKey(topic) === key) || {};
      return {
        key,
        subjectId: queueItem.subjectId || questions[0]?.subjectId || key.split('_')[0] || '',
        topicId: queueItem.topicId || questions[0]?.topicId || key.split('_')[1] || '',
        subjectTitle: questions[0]?.subjectTitle || '',
        topicTitle: questions[0]?.topicTitle || '',
        questions,
        queuePriority: queueItem.priority || 0,
        queueRank: queueItem.queueRank || 999,
        difficultyScore: difficultyInfo.score || 0,
        difficultyDistribution: difficultyInfo.distribution || { mudah: 33, sederhana: 34, sukar: 33 },
        recommendedDifficulty: difficultyInfo.recommendedDifficulty || getDifficultyLabel(meta),
        ...meta
      };
    })
    .sort((a, b) => {
      if (b.queuePriority !== a.queuePriority) return b.queuePriority - a.queuePriority;
      if (a.mastery !== b.mastery) return a.mastery - b.mastery;
      if (a.queueRank !== b.queueRank) return a.queueRank - b.queueRank;
      return a.key.localeCompare(b.key);
    });

  for (const topic of orderedTopics) {
    if (!topic.questions.length) continue;
    const bucket = bucketForTopic(topic);
    if (bucketCount[bucket] >= targetByBucket[bucket]) continue;
    const usableQuestions = topic.questions.filter(question => question && question.id && !recentQuestionIds.has(String(question.id)));
    const questionList = usableQuestions.length ? usableQuestions : topic.questions;

    for (const question of questionList) {
      const questionId = String(question.id);
      if (selectedByKey.has(questionId)) continue;
      selectedByKey.add(questionId);
      selected.push({
        ...clone(question),
        subjectId: question.subjectId || topic.subjectId || '',
        subjectTitle: question.subjectTitle || topic.subjectTitle || '',
        topicId: question.topicId || topic.topicId || '',
        topicTitle: question.topicTitle || topic.topicTitle || '',
        revisionBucket: bucket,
        difficulty: topic.recommendedDifficulty,
        difficultyScore: topic.difficultyScore,
        priorityScore: topic.queuePriority
      });
      bucketCount[bucket] += 1;
      if (selected.length >= totalQuestions) break;
      if (bucketCount[bucket] >= targetByBucket[bucket]) break;
    }
    if (selected.length >= totalQuestions) break;
  }

  if (selected.length < totalQuestions) {
    for (const question of allQuestions) {
      const questionId = String(question.id);
      if (!question.id || selectedByKey.has(questionId)) continue;
      if (recentQuestionIds.has(questionId)) continue;
      selectedByKey.add(questionId);
      const record = profile.topics?.[question.subjectId]?.[question.topicId] || {};
      const meta = getTopicMeta(record);
      selected.push({
        ...clone(question),
        revisionBucket: meta.mastery < 60 ? 'weak' : meta.mastery < 80 ? 'developing' : 'strong',
        difficulty: getDifficultyLabel(meta)
      });
      if (selected.length >= totalQuestions) break;
    }
  }

  if (selected.length < totalQuestions) {
    for (const question of allQuestions) {
      const questionId = String(question.id);
      if (!question.id || selectedByKey.has(questionId)) continue;
      selectedByKey.add(questionId);
      const record = profile.topics?.[question.subjectId]?.[question.topicId] || {};
      selected.push({
        ...clone(question),
        revisionBucket: 'balanced',
        difficulty: getDifficultyLabel(record)
      });
      if (selected.length >= totalQuestions) break;
    }
  }

  return selected.slice(0, totalQuestions);
}

function buildSubjects(session = []) {
  const subjectMap = new Map();
  session.forEach(question => {
    if (!subjectMap.has(question.subjectId)) {
      subjectMap.set(question.subjectId, {
        subjectId: question.subjectId,
        questions: 0,
        estimatedMinutes: 0,
        topics: []
      });
    }
    const subject = subjectMap.get(question.subjectId);
    subject.questions += 1;
    subject.estimatedMinutes += 3;
    let topic = subject.topics.find(item => item.topicId === question.topicId);
    if (!topic) {
      topic = {
        topicId: question.topicId,
        questionCount: 0,
        estimatedMinutes: 0,
        priority: question.priorityScore || 0,
        difficulty: question.difficulty || 'sederhana'
      };
      subject.topics.push(topic);
    }
    topic.questionCount += 1;
    topic.estimatedMinutes += 3;
  });
  return [...subjectMap.values()];
}

function buildDifficultyDistribution(session = []) {
  return session.reduce((acc, question) => {
    const difficulty = String(question.difficulty || 'sederhana').toLowerCase();
    if (difficulty === 'mudah') acc.mudah += 1;
    else if (difficulty === 'sukar') acc.sukar += 1;
    else acc.sederhana += 1;
    return acc;
  }, { mudah: 0, sederhana: 0, sukar: 0 });
}

export function removeDuplicateQuestions(session = []) {
  const seen = new Set();
  return session.filter(question => {
    const id = String(question?.id || question?.questionId || '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function balanceSubjects(session = []) {
  return [...session].sort((a, b) => {
    const aScore = toNumber(a.priorityScore, 0);
    const bScore = toNumber(b.priorityScore, 0);
    if (bScore !== aScore) return bScore - aScore;
    return String(a.subjectId).localeCompare(String(b.subjectId));
  });
}

export function balanceDifficulty(session = []) {
  const cloneSession = session.map(item => ({ ...item }));
  const distribution = buildDifficultyDistribution(cloneSession);
  const total = Math.max(1, cloneSession.length);
  const ratio = {
    mudah: distribution.mudah / total,
    sederhana: distribution.sederhana / total,
    sukar: distribution.sukar / total
  };
  return cloneSession.map(item => {
    if (!item.difficulty) {
      item.difficulty = item.revisionBucket === 'weak' ? 'mudah' : item.revisionBucket === 'developing' ? 'sederhana' : 'sukar';
    }
    return item;
  }).sort((a, b) => {
    const order = { mudah: 0, sederhana: 1, sukar: 2 };
    if (order[a.difficulty] !== order[b.difficulty]) return order[a.difficulty] - order[b.difficulty];
    return String(a.id).localeCompare(String(b.id));
  }).map(item => ({
    ...item,
    difficultyBalance: ratio
  }));
}

export function validateMixedSession(session = {}) {
  const questions = Array.isArray(session.questions) ? session.questions : [];
  const uniqueIds = new Set();
  for (const question of questions) {
    const id = String(question?.id || '');
    if (!id || uniqueIds.has(id)) return false;
    uniqueIds.add(id);
  }
  return questions.length === uniqueIds.size;
}

export function allocateRevisionQuestions(plan = {}) {
  const questions = Array.isArray(plan.questions) ? plan.questions : [];
  return removeDuplicateQuestions(questions);
}

export function buildMixedRevisionSession(profile = {}, questionBank, options = {}) {
  const totalQuestions = clamp(toNumber(options.questionCount, 20), 10, 50);
  const plan = generateRevisionPlan(profile, { ...options, questionCount: totalQuestions, mode: 'revision' });
  const revisionQueue = getReviewQueue(profile);
  const candidateQuestions = pickCandidateTopics(profile, questionBank, { questionCount: totalQuestions, plan, revisionQueue });
  const sessionQuestions = removeDuplicateQuestions(candidateQuestions).slice(0, totalQuestions);
  const balancedQuestions = balanceDifficulty(balanceSubjects(sessionQuestions));
  const subjects = buildSubjects(balancedQuestions);
  const difficultyDistribution = buildDifficultyDistribution(balancedQuestions);
  const selectedTopics = balancedQuestions.map(question => ({
    subjectId: question.subjectId,
    topicId: question.topicId,
    questionId: question.id,
    difficulty: question.difficulty,
    revisionBucket: question.revisionBucket
  }));
  const estimatedMinutes = subjects.reduce((sum, subject) => sum + subject.estimatedMinutes, 0) || Math.round(totalQuestions * 3);
  const metadata = {
    fallbackUsed: balancedQuestions.length < totalQuestions,
    insufficientEvidence: !profile || !profile.topics || Object.keys(profile.topics || {}).length === 0,
    revisionPlan: plan,
    reviewQueue: revisionQueue,
    generatedAt: new Date().toISOString()
  };
  const session = {
    generatedAt: new Date().toISOString(),
    totalQuestions: balancedQuestions.length,
    estimatedMinutes,
    subjects,
    difficultyDistribution,
    selectedTopics,
    questions: balancedQuestions,
    metadata
  };

  return session;
}

export default {
  allocateRevisionQuestions,
  balanceDifficulty,
  balanceSubjects,
  buildMixedRevisionSession,
  removeDuplicateQuestions,
  validateMixedSession
};
