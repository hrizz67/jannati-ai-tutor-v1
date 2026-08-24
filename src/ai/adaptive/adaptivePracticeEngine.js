import { generateStudyPlan } from './recommendationEngine.js';

const ALLOWED_COUNTS = [10, 20, 30, 40, 50];
const ALLOWED_MODES = new Set(['daily', 'revision', 'exam', 'balanced']);
const RECENT_LIMIT = 40;

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampCount(value) {
  const parsed = toNumber(value, 10);
  if (ALLOWED_COUNTS.includes(parsed)) return parsed;
  return parsed <= 10 ? 10 : parsed <= 20 ? 20 : parsed <= 30 ? 30 : parsed <= 40 ? 40 : 50;
}

function normalizeMode(mode) {
  const normalized = String(mode || 'balanced').toLowerCase();
  return ALLOWED_MODES.has(normalized) ? normalized : 'balanced';
}

function makeSeed(value) {
  const text = String(value || 'adaptive-practice');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed = Date.now()) {
  let state = makeSeed(seed) || 1;
  return () => {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed(items = [], seed = Date.now()) {
  const rng = createRng(seed);
  const list = [...items];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }
  return list;
}

function normalizeQuestionBank(questionBank) {
  if (!questionBank) return [];
  if (Array.isArray(questionBank)) {
    return questionBank
      .filter(item => item && typeof item === 'object')
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

function getRecentQuestionIds(profile = {}, limit = RECENT_LIMIT) {
  const ids = [];
  const log = Array.isArray(profile.questionLog) ? profile.questionLog : [];
  for (const entry of log) {
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

function flattenQuestions(questionBank) {
  return normalizeQuestionBank(questionBank).flatMap(subject => {
    return (subject.topics || []).flatMap(topic => {
      const questions = Array.isArray(topic.questions) ? topic.questions : [];
      return questions.map(question => ({
        ...clone(question),
        subjectId: question.subjectId || subject.id || subject.subjectId || '',
        topicId: question.topicId || topic.id || topic.topicId || '',
        subjectTitle: question.subjectTitle || subject.title || subject.short || subject.id || '',
        topicTitle: question.topicTitle || topic.title || topic.id || ''
      }));
    });
  });
}

function buildBalancedFallbackPlan(questionBank, totalQuestions, options = {}) {
  const subjects = normalizeQuestionBank(questionBank);
  const topicEntries = [];

  subjects.forEach(subject => {
    (subject.topics || []).forEach(topic => {
      const questions = Array.isArray(topic.questions) ? topic.questions : [];
      if (!questions.length) return;
      topicEntries.push({
        subjectId: subject.id,
        subjectTitle: subject.title,
        topicId: topic.id,
        topicTitle: topic.title,
        questionCount: 1,
        estimatedMinutes: 3,
        priority: 50,
        status: 'balanced',
        questions
      });
    });
  });

  const ranked = shuffleWithSeed(topicEntries, options.seed || Date.now());
  const selected = ranked.slice(0, Math.max(1, totalQuestions));
  return {
    subjects: selected.reduce((acc, entry) => {
      const existing = acc.find(item => item.subjectId === entry.subjectId);
      if (existing) {
        existing.topics.push({
          topicId: entry.topicId,
          questionCount: entry.questionCount,
          estimatedMinutes: entry.estimatedMinutes,
          priority: entry.priority,
          status: entry.status
        });
      } else {
        acc.push({
          subjectId: entry.subjectId,
          topics: [{
            topicId: entry.topicId,
            questionCount: entry.questionCount,
            estimatedMinutes: entry.estimatedMinutes,
            priority: entry.priority,
            status: entry.status
          }]
        });
      }
      return acc;
    }, []),
    totalQuestions: selected.length,
    estimatedMinutes: selected.reduce((sum, entry) => sum + entry.estimatedMinutes, 0),
    metadata: {
      adaptive: true,
      fallbackUsed: true,
      insufficientEvidence: true,
      skippedTopics: [],
      shortfall: Math.max(0, totalQuestions - selected.length)
    }
  };
}

function buildPlanTopicIndex(plan = {}) {
  const subjectMap = new Map();
  (plan.subjects || []).forEach(subject => {
    const topicMap = new Map();
    (subject.topics || []).forEach(topic => {
      topicMap.set(topic.topicId, { ...topic });
    });
    subjectMap.set(subject.subjectId, topicMap);
  });
  return subjectMap;
}

function matchQuestionsForTopic(subject, topic, recentQuestionIds, excludedQuestionIds, seed) {
  const questions = Array.isArray(topic?.questions) ? topic.questions : [];
  const usedIds = new Set();
  const exclude = new Set([...(excludedQuestionIds || []), ...recentQuestionIds]);
  const scored = questions
    .filter(question => question && typeof question === 'object' && question.id)
    .map(question => ({
      question: {
        ...clone(question),
        subjectId: question.subjectId || subject.id || '',
        topicId: question.topicId || topic.id || '',
        subjectTitle: question.subjectTitle || subject.title || subject.short || subject.id || '',
        topicTitle: question.topicTitle || topic.title || topic.id || ''
      },
      excluded: exclude.has(String(question.id))
    }));

  const preferred = shuffleWithSeed(scored.filter(item => !item.excluded), `${seed}:${subject.id}:${topic.id}:preferred`);
  const fallback = shuffleWithSeed(scored.filter(item => item.excluded), `${seed}:${subject.id}:${topic.id}:fallback`);

  return [...preferred, ...fallback].map(item => item.question).filter(question => {
    const key = String(question.id);
    if (usedIds.has(key)) return false;
    usedIds.add(key);
    return true;
  });
}

export function validateAdaptivePlan(plan, questionBank) {
  const bank = normalizeQuestionBank(questionBank);
  const existing = new Map(bank.map(subject => [subject.id, subject]));
  const issues = [];

  if (!plan || typeof plan !== 'object') {
    return { valid: false, issues: ['missing_plan'] };
  }

  (plan.subjects || []).forEach(subject => {
    const bankSubject = existing.get(subject.subjectId);
    if (!bankSubject) {
      issues.push(`missing_subject:${subject.subjectId}`);
      return;
    }
    (subject.topics || []).forEach(topic => {
      const bankTopic = (bankSubject.topics || []).find(item => item.id === topic.topicId);
      if (!bankTopic) issues.push(`missing_topic:${subject.subjectId}:${topic.topicId}`);
    });
  });

  return {
    valid: issues.length === 0,
    issues
  };
}

export function resolveAdaptiveQuestions(plan, questionBank, options = {}) {
  const bank = normalizeQuestionBank(questionBank);
  const recentQuestionIds = getRecentQuestionIds(options.profile || {});
  const excludedQuestionIds = Array.isArray(options.excludeQuestionIds) ? options.excludeQuestionIds.map(String) : [];
  const seed = options.seed || Date.now();
  const questionLimit = clampCount(options.questionCount || plan?.totalQuestions || 10);
  const topicIndex = buildPlanTopicIndex(plan || {});
  const questions = [];
  const skippedTopics = [];

  for (const subject of bank) {
    const plannedTopics = topicIndex.get(subject.id) || new Map();
    for (const topic of subject.topics || []) {
      const planned = plannedTopics.get(topic.id);
      if (!planned) continue;
      const resolved = matchQuestionsForTopic(subject, topic, recentQuestionIds, excludedQuestionIds, `${seed}:${subject.id}:${topic.id}`);
      if (!resolved.length) {
        skippedTopics.push({ subjectId: subject.id, topicId: topic.id });
        continue;
      }

      const takeCount = Math.max(1, planned.questionCount || 1);
      for (const question of resolved.slice(0, takeCount)) {
        if (questions.length >= questionLimit) break;
        const key = String(question.id);
        if (questions.some(item => String(item.id) === key)) continue;
        questions.push(question);
      }
    }
  }

  if (questions.length < questionLimit) {
    const available = flattenQuestions(bank)
      .filter(question => !excludedQuestionIds.includes(String(question.id)))
      .filter(question => !questions.some(item => String(item.id) === String(question.id)));
    const shuffled = shuffleWithSeed(available, `${seed}:fallback`);
    for (const question of shuffled) {
      if (questions.length >= questionLimit) break;
      questions.push(question);
    }
  }

  const uniqueQuestions = questions.filter((question, index, list) => {
    const key = String(question.id);
    return list.findIndex(item => String(item.id) === key) === index;
  });

  const shortfall = Math.max(0, questionLimit - uniqueQuestions.length);
  return {
    questions: uniqueQuestions.slice(0, questionLimit),
    metadata: {
      adaptive: true,
      fallbackUsed: skippedTopics.length > 0 || uniqueQuestions.length < questionLimit,
      insufficientEvidence: Boolean(options.insufficientEvidence),
      skippedTopics,
      shortfall
    }
  };
}

export function buildAdaptivePracticeSession(profile, questionBank, options = {}) {
  const questionCount = clampCount(options.questionCount || 10);
  const mode = normalizeMode(options.mode || 'balanced');
  const difficulty = String(options.difficulty || 'medium').toLowerCase();
  const seed = options.seed || Date.now();
  const subjectFilter = options.subjectId || null;
  const bank = normalizeQuestionBank(questionBank).filter(subject => !subjectFilter || subject.id === subjectFilter);

  const recommendationPlan = generateStudyPlan(profile, {
    questionCount,
    mode,
    difficulty,
    subjectId: subjectFilter,
    seed
  });

  let plan = clone(recommendationPlan);
  let validation = validateAdaptivePlan(plan, bank);
  let insufficientEvidence = !plan.subjects?.length || validation.issues.length > 0;
  let fallbackUsed = false;

  if (insufficientEvidence) {
    const fallbackPlan = buildBalancedFallbackPlan(bank, questionCount, { seed });
    plan = fallbackPlan;
    validation = validateAdaptivePlan(plan, bank);
    fallbackUsed = true;
  }

  const resolved = resolveAdaptiveQuestions(plan, bank, {
    questionCount,
    seed,
    profile,
    excludeQuestionIds: options.excludeQuestionIds || [],
    insufficientEvidence
  });

  const questions = resolved.questions;
  const totalQuestions = questions.length;
  const estimatedMinutes = plan.estimatedMinutes || Math.max(1, Math.round(totalQuestions * 3));
  const sessionId = options.sessionId || `adaptive_practice_${seed}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    sessionId,
    mode,
    requestedQuestions: questionCount,
    totalQuestions,
    estimatedMinutes,
    plan,
    questions,
    metadata: {
      adaptive: true,
      fallbackUsed: fallbackUsed || resolved.metadata.fallbackUsed,
      insufficientEvidence,
      skippedTopics: [...new Map((resolved.metadata.skippedTopics || []).map(item => [`${item.subjectId}:${item.topicId}`, item])).values()],
      shortfall: resolved.metadata.shortfall,
      validationIssues: validation.issues || []
    }
  };
}

export function getAdaptivePracticeSummary(session) {
  const subjects = Array.isArray(session?.plan?.subjects) ? session.plan.subjects : [];
  const focusTopics = subjects.flatMap(subject => (subject.topics || []).map(topic => ({
    subjectId: subject.subjectId,
    topicId: topic.topicId,
    questionCount: topic.questionCount,
    estimatedMinutes: topic.estimatedMinutes,
    priority: topic.priority,
    status: topic.status
  })));

  return {
    sessionId: session?.sessionId || null,
    mode: session?.mode || 'balanced',
    requestedQuestions: session?.requestedQuestions || 0,
    totalQuestions: session?.totalQuestions || 0,
    estimatedMinutes: session?.estimatedMinutes || 0,
    focusTopics,
    metadata: session?.metadata || {}
  };
}

export default {
  buildAdaptivePracticeSession,
  resolveAdaptiveQuestions,
  validateAdaptivePlan,
  getAdaptivePracticeSummary
};
