const SUBJECT_IDS = ['bm', 'english', 'math', 'sains', 'arab', 'islam', 'pj', 'pk'];

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, number(value, min)));
const firstNumber = (...values) => values.find(value => value !== undefined && value !== null && Number.isFinite(Number(value))) !== undefined
  ? number(values.find(value => value !== undefined && value !== null && Number.isFinite(Number(value))))
  : null;

function explicitHistoryTotals(history) {
  return history.reduce((totals, item) => {
    if (!item || typeof item !== 'object') return totals;
    const attempts = firstNumber(item.attempts, item.total, item.totalQuestions);
    const correct = firstNumber(item.correct, item.correctCount, item.totalCorrect);
    const wrong = firstNumber(item.wrong, item.incorrect, item.incorrectCount, item.totalWrong);
    if (attempts !== null) totals.attempts += Math.max(0, attempts);
    if (correct !== null) totals.correct += Math.max(0, correct);
    if (wrong !== null) totals.wrong += Math.max(0, wrong);
    return totals;
  }, { attempts: 0, correct: 0, wrong: 0 });
}

export function createCanonicalProgress(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const history = Array.isArray(source.history) ? source.history : [];
  const historyTotals = explicitHistoryTotals(history);
  const subjects = {};
  for (const id of SUBJECT_IDS) {
    const sourceSubject = source.subjects?.[id] || {};
    const topicSource = source.topics?.[id] && typeof source.topics[id] === 'object' ? source.topics[id] : {};
    const topicRecords = Object.values(topicSource).filter(record => record && typeof record === 'object');
    const topicTotals = topicRecords.reduce((totals, record) => {
      totals.attempts += Math.max(0, number(record.attempts ?? record.total, 0));
      totals.correct += Math.max(0, number(record.correct ?? record.correctCount, 0));
      totals.wrong += Math.max(0, number(record.wrong ?? record.incorrect, 0));
      return totals;
    }, { attempts: 0, correct: 0, wrong: 0 });
    const record = { ...sourceSubject, ...(Object.keys(topicSource).length ? {
      attempts: topicTotals.attempts,
      correct: topicTotals.correct,
      wrong: topicTotals.wrong,
      topicMastery: topicSource
    } : {}) };
    const attempts = number(record.attempts ?? record.totalQuestions, topicTotals.attempts);
    const correct = number(record.correct ?? record.correctQuestions, topicTotals.correct);
    subjects[id] = {
      xp: number(record.xp, 0),
      level: Math.max(1, Math.round(number(record.level, 1))),
      attempts,
      correct,
      wrong: Math.max(0, number(record.wrong ?? record.incorrectQuestions, attempts - correct)),
      studySeconds: Math.max(0, number(record.studySeconds, number(record.studyMinutes, 0) * 60)),
      topicMastery: record.topicMastery && typeof record.topicMastery === 'object' ? record.topicMastery : {}
    };
  }
  const subjectTotals = Object.values(subjects).reduce((totals, subject) => ({
    attempts: totals.attempts + subject.attempts,
    correct: totals.correct + subject.correct,
    wrong: totals.wrong + subject.wrong
  }), { attempts: 0, correct: 0, wrong: 0 });
  const totalAttempts = firstNumber(source.totalQuestions, source.totals?.questionsAnswered, historyTotals.attempts, subjectTotals.attempts) ?? 0;
  const totalCorrect = firstNumber(source.correctQuestions, source.totalCorrect, source.totals?.correct, historyTotals.correct || null, subjectTotals.correct) ?? 0;
  const totalWrong = firstNumber(source.incorrectQuestions, source.totalWrong, source.totals?.wrong, historyTotals.wrong || null, subjectTotals.wrong, Math.max(0, totalAttempts - totalCorrect)) ?? 0;
  return {
    version: 1,
    global: {
      totalXp: Math.max(0, number(source.xp ?? source.totalXp, 0)),
      globalLevel: Math.max(1, Math.round(number(source.level ?? source.globalLevel, 1))),
      streakCurrent: Math.max(0, number(source.streak ?? source.totals?.currentStreak, 0)),
      streakBest: Math.max(
        Math.max(0, number(source.bestStreak ?? source.totals?.longestStreak, 0)),
        Math.max(0, number(source.streak ?? source.totals?.currentStreak, 0))
      ),
      totalAttempts: Math.max(0, totalAttempts),
      totalCorrect: Math.max(0, totalCorrect),
      totalWrong: Math.max(0, totalWrong),
      totalStudySeconds: Math.max(0, number(source.totalStudySeconds, number(source.studyMinutes, 0) * 60)),
      achievements: Array.isArray(source.achievements) ? source.achievements : []
    },
    subjects,
    sessions: Array.isArray(source.sessions) ? source.sessions : [],
    activities: history,
    revisionQueue: Array.isArray(source.revisionQueue) ? source.revisionQueue : [],
    uasa: {
      activeBySubject: source.uasa?.activeBySubject && typeof source.uasa.activeBySubject === 'object' ? source.uasa.activeBySubject : {},
      historyBySubject: source.uasa?.historyBySubject && typeof source.uasa.historyBySubject === 'object' ? source.uasa.historyBySubject : {}
    }
  };
}

export function toParentProgressProfile(progress = {}, baseProfile = {}) {
  const safeBase = baseProfile && typeof baseProfile === 'object' ? baseProfile : {};
  const global = progress.global || {};
  const topics = Object.fromEntries(Object.entries(progress.subjects || {}).map(([subjectId, record]) => [subjectId, record.topicMastery || {}]));
  return {
    ...safeBase,
    studentId: safeBase.studentId || 'student',
    name: safeBase.name || safeBase.displayName || '',
    totals: {
      ...(safeBase.totals || {}),
      questionsAnswered: global.totalAttempts || 0,
      correct: global.totalCorrect || 0,
      wrong: global.totalWrong || 0,
      accuracy: global.totalAttempts ? Math.round((global.totalCorrect / global.totalAttempts) * 100) : 0,
      studyMinutes: Math.round((global.totalStudySeconds || 0) / 60),
      currentStreak: global.streakCurrent || 0,
      longestStreak: global.streakBest || 0
    },
    xp: global.totalXp || 0,
    level: global.globalLevel || 1,
    streak: global.streakCurrent || 0,
    bestStreak: global.streakBest || 0,
    topics,
    history: progress.activities || safeBase.history || [],
    uasa: progress.uasa || safeBase.uasa || {}
  };
}

export function getCanonicalAccuracy(progress = {}) {
  const attempts = number(progress.global?.totalAttempts, 0);
  return attempts ? clamp((number(progress.global?.totalCorrect, 0) / attempts) * 100, 0, 100) : 0;
}

export default { createCanonicalProgress, getCanonicalAccuracy, toParentProgressProfile };
