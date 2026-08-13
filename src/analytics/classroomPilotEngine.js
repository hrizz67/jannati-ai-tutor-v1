export const CLASSROOM_PILOT_SCHEMA_VERSION = 1;

export const DEFAULT_CLASSROOM_PILOT_OPTIONS = Object.freeze({
  windowDays: 14,
  minimumAttempts: 10,
  minimumCompletedSessions: 2,
  minimumActiveDays: 2
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function percent(numerator, denominator) {
  return denominator > 0 ? clamp(Math.round((numerator / denominator) * 100), 0, 100) : 0;
}

function roundOne(value) {
  return Math.round(toNumber(value, 0) * 10) / 10;
}

function safeIso(value, fallback = '') {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function subtractDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() - Math.max(0, days));
  return date;
}

function withinWindow(value, start, end) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date <= end;
}

function normalizeOptions(options = {}) {
  const generatedAt = safeIso(options.generatedAt || new Date(), new Date().toISOString());
  const end = new Date(generatedAt);
  const windowDays = Math.max(1, Math.floor(toNumber(options.windowDays, DEFAULT_CLASSROOM_PILOT_OPTIONS.windowDays)));
  const start = subtractDays(end, windowDays - 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return {
    generatedAt,
    windowDays,
    start,
    end,
    minimumAttempts: Math.max(1, Math.floor(toNumber(options.minimumAttempts, DEFAULT_CLASSROOM_PILOT_OPTIONS.minimumAttempts))),
    minimumCompletedSessions: Math.max(1, Math.floor(toNumber(options.minimumCompletedSessions, DEFAULT_CLASSROOM_PILOT_OPTIONS.minimumCompletedSessions))),
    minimumActiveDays: Math.max(1, Math.floor(toNumber(options.minimumActiveDays, DEFAULT_CLASSROOM_PILOT_OPTIONS.minimumActiveDays)))
  };
}

function normalizeParticipantCode(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return /^PILOT-[A-Z0-9]{8,16}$/.test(normalized) ? normalized : 'PILOT-UNASSIGNED';
}

function normalizeLearningEntry(entry = {}, index = 0) {
  const answeredAt = safeIso(entry.answeredAt || entry.timestamp || entry.date || entry.updatedAt, '');
  const attemptNumber = Math.max(1, Math.floor(toNumber(entry.attemptNumber, 1)));
  const sessionId = String(entry.sessionId || '').trim();
  const questionId = String(entry.questionId || '').trim();
  const subjectId = String(entry.subjectId || entry.subject || 'unknown').trim() || 'unknown';
  const topicId = String(entry.topicId || entry.topic || 'unknown').trim() || 'unknown';
  const hasHintSignal = Object.prototype.hasOwnProperty.call(entry, 'usedHint')
    || Object.prototype.hasOwnProperty.call(entry, 'hintsUsed');
  const hasExplainSignal = Object.prototype.hasOwnProperty.call(entry, 'usedExplain')
    || Object.prototype.hasOwnProperty.call(entry, 'explanationsUsed');
  return {
    rowId: `${sessionId || 'legacy'}:${questionId || index}:${attemptNumber}:${answeredAt}`,
    sessionId,
    questionId,
    subjectId,
    topicId,
    attemptNumber,
    correct: Boolean(entry.correct),
    timeSpent: Math.max(0, toNumber(entry.timeSpent ?? entry.timeTaken ?? entry.duration, 0)),
    answeredAt,
    day: dateKey(answeredAt),
    usedHint: Boolean(entry.usedHint ?? toNumber(entry.hintsUsed, 0) > 0),
    usedExplain: Boolean(entry.usedExplain ?? toNumber(entry.explanationsUsed, 0) > 0),
    hasSupportSignal: hasHintSignal || hasExplainSignal,
    misconceptionType: String(entry.misconceptionType || '').trim(),
    masteryBefore: optionalNumber(entry.masteryBefore),
    masteryAfter: optionalNumber(entry.masteryAfter),
    confidenceBefore: optionalNumber(entry.confidenceBefore),
    confidenceAfter: optionalNumber(entry.confidenceAfter)
  };
}

function normalizeSession(entry = {}, source = 'history') {
  const startedAt = safeIso(entry.startedAt || entry.createdAt, '');
  const endedAt = safeIso(entry.endedAt || entry.updatedAt, '');
  const explicitCompletion = typeof entry.completed === 'boolean';
  return {
    startedAt,
    endedAt,
    date: endedAt || startedAt,
    completed: entry.completed === true,
    explicitCompletion,
    ongoing: source === 'current',
    durationSeconds: Math.max(0, toNumber(entry.durationSeconds, 0)),
    plannedQuestionCount: Math.max(0, Math.floor(toNumber(entry.plannedQuestionCount, Array.isArray(entry.questions) ? entry.questions.length : 0))),
    answeredAttempts: Math.max(0, toNumber(entry.correct, 0) + toNumber(entry.wrong, 0))
  };
}

function groupRows(rows = [], keyFn = () => '') {
  return rows.reduce((map, row, index) => {
    const key = keyFn(row, index);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
    return map;
  }, new Map());
}

function questionGroupKey(entry, index) {
  const sessionKey = entry.sessionId || entry.day || `legacy-${index}`;
  return `${sessionKey}:${entry.questionId || `question-${index}`}`;
}

function sortAttempts(rows = []) {
  return [...rows].sort((left, right) => {
    if (left.attemptNumber !== right.attemptNumber) return left.attemptNumber - right.attemptNumber;
    return String(left.answeredAt).localeCompare(String(right.answeredAt));
  });
}

function summarizeComprehension(entries = []) {
  const grouped = groupRows(entries, questionGroupKey);
  const questions = [...grouped.values()].map(sortAttempts);
  const firstAttempts = questions.map(rows => rows[0]).filter(Boolean);
  const finalAttempts = questions.map(rows => rows[rows.length - 1]).filter(Boolean);
  const independentAttempts = entries.filter(entry => !entry.usedHint && !entry.usedExplain);
  const firstWrong = questions.filter(rows => rows[0] && !rows[0].correct);
  const recoveryEligible = firstWrong.filter(rows => rows.length > 1);
  const recovered = recoveryEligible.filter(rows => rows.slice(1).some(entry => entry.correct));
  const supportedRecoveryEligible = firstWrong.filter(rows => rows.slice(1).some(entry => entry.usedHint || entry.usedExplain));
  const supportedRecovered = supportedRecoveryEligible.filter(rows => rows.slice(1).some(entry => entry.correct && (entry.usedHint || entry.usedExplain)));

  return {
    uniqueQuestions: questions.length,
    attemptAccuracy: percent(entries.filter(entry => entry.correct).length, entries.length),
    firstAttemptAccuracy: percent(firstAttempts.filter(entry => entry.correct).length, firstAttempts.length),
    finalAnswerAccuracy: percent(finalAttempts.filter(entry => entry.correct).length, finalAttempts.length),
    independentAccuracy: percent(independentAttempts.filter(entry => entry.correct).length, independentAttempts.length),
    independentAttempts: independentAttempts.length,
    recoveryRate: percent(recovered.length, recoveryEligible.length),
    recoveryOpportunities: recoveryEligible.length,
    supportedRecoveryRate: percent(supportedRecovered.length, supportedRecoveryEligible.length),
    supportedRecoveryOpportunities: supportedRecoveryEligible.length
  };
}

function summarizeSupport(entries = []) {
  const hintAttempts = entries.filter(entry => entry.usedHint).length;
  const explainAttempts = entries.filter(entry => entry.usedExplain).length;
  const supportedAttempts = entries.filter(entry => entry.usedHint || entry.usedExplain).length;
  return {
    hintAttempts,
    hintUseRate: percent(hintAttempts, entries.length),
    explainAttempts,
    explainUseRate: percent(explainAttempts, entries.length),
    supportedAttempts,
    supportUseRate: percent(supportedAttempts, entries.length)
  };
}

function summarizeMisconceptions(entries = []) {
  const wrongEntries = entries.filter(entry => !entry.correct);
  const labeled = wrongEntries.filter(entry => entry.misconceptionType);
  const groups = groupRows(wrongEntries, entry => entry.misconceptionType || 'UNCLASSIFIED');
  const topCategories = [...groups.entries()]
    .map(([type, rows]) => ({
      type,
      count: rows.length,
      rateOfWrongAttempts: percent(rows.length, wrongEntries.length)
    }))
    .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type))
    .slice(0, 8);
  return {
    wrongAttempts: wrongEntries.length,
    classifiedWrongAttempts: labeled.length,
    classificationCoverage: percent(labeled.length, wrongEntries.length),
    distinctCategories: new Set(labeled.map(entry => entry.misconceptionType)).size,
    topCategories
  };
}

function summarizeMastery(entries = []) {
  const eligible = entries.filter(entry => entry.masteryBefore !== null && entry.masteryAfter !== null);
  const grouped = groupRows(eligible, entry => `${entry.subjectId}:${entry.topicId}`);
  const topics = [...grouped.entries()].map(([key, rows]) => {
    const ordered = [...rows].sort((left, right) => String(left.answeredAt).localeCompare(String(right.answeredAt)));
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const [subjectId, ...topicParts] = key.split(':');
    const baseline = clamp(toNumber(first.masteryBefore, 0), 0, 100);
    const current = clamp(toNumber(last.masteryAfter, 0), 0, 100);
    return {
      subjectId,
      topicId: topicParts.join(':'),
      baseline: roundOne(baseline),
      current: roundOne(current),
      change: roundOne(current - baseline),
      evidenceAttempts: ordered.length
    };
  }).sort((left, right) => right.change - left.change || left.subjectId.localeCompare(right.subjectId) || left.topicId.localeCompare(right.topicId));
  const baselineAverage = topics.length ? topics.reduce((sum, topic) => sum + topic.baseline, 0) / topics.length : 0;
  const currentAverage = topics.length ? topics.reduce((sum, topic) => sum + topic.current, 0) / topics.length : 0;
  return {
    topicsWithSnapshots: topics.length,
    baselineAverage: roundOne(baselineAverage),
    currentAverage: roundOne(currentAverage),
    averageChange: roundOne(currentAverage - baselineAverage),
    improvedTopics: topics.filter(topic => topic.change > 0).length,
    stableTopics: topics.filter(topic => topic.change === 0).length,
    declinedTopics: topics.filter(topic => topic.change < 0).length,
    topics
  };
}

function summarizeSessions(adaptiveProfile = {}, window) {
  const history = (Array.isArray(adaptiveProfile.sessionHistory) ? adaptiveProfile.sessionHistory : [])
    .map(entry => normalizeSession(entry, 'history'))
    .filter(entry => entry.date && withinWindow(entry.date, window.start, window.end));
  const current = adaptiveProfile.currentSession
    ? normalizeSession(adaptiveProfile.currentSession, 'current')
    : null;
  const currentRows = current?.date && withinWindow(current.date, window.start, window.end) ? [current] : [];
  const rows = [...history, ...currentRows];
  const completed = rows.filter(entry => !entry.ongoing && entry.explicitCompletion && entry.completed).length;
  const abandoned = rows.filter(entry => !entry.ongoing && entry.explicitCompletion && !entry.completed).length;
  const unknown = rows.filter(entry => !entry.ongoing && !entry.explicitCompletion).length;
  const eligible = completed + abandoned;
  return {
    started: rows.length,
    completed,
    abandoned,
    ongoing: rows.filter(entry => entry.ongoing).length,
    unknownStatus: unknown,
    completionRate: percent(completed, eligible),
    sessionsWithCompletionEvidence: eligible,
    studyMinutes: roundOne(rows.reduce((sum, entry) => sum + entry.durationSeconds, 0) / 60)
  };
}

function summarizeActivity(entries = [], sessionSummary = {}) {
  const activeDays = new Set(entries.map(entry => entry.day).filter(Boolean));
  const answeredSeconds = entries.reduce((sum, entry) => sum + entry.timeSpent, 0);
  return {
    activeDays: activeDays.size,
    attempts: entries.length,
    answeredStudyMinutes: roundOne(answeredSeconds / 60),
    sessionStudyMinutes: roundOne(sessionSummary.studyMinutes || 0)
  };
}

function summarizeCoverage(entries = []) {
  return {
    subjectCount: new Set(entries.map(entry => entry.subjectId).filter(Boolean)).size,
    topicCount: new Set(entries.map(entry => `${entry.subjectId}:${entry.topicId}`).filter(Boolean)).size
  };
}

function summarizeDaily(entries = []) {
  const groups = groupRows(entries, entry => entry.day);
  return [...groups.entries()].filter(([day]) => day).map(([day, rows]) => {
    const support = summarizeSupport(rows);
    return {
      date: day,
      attempts: rows.length,
      correctAttempts: rows.filter(entry => entry.correct).length,
      accuracy: percent(rows.filter(entry => entry.correct).length, rows.length),
      hintUseRate: support.hintUseRate,
      studyMinutes: roundOne(rows.reduce((sum, entry) => sum + entry.timeSpent, 0) / 60)
    };
  }).sort((left, right) => left.date.localeCompare(right.date));
}

function summarizeSubjects(entries = []) {
  const groups = groupRows(entries, entry => entry.subjectId);
  return [...groups.entries()].map(([subjectId, rows]) => {
    const comprehension = summarizeComprehension(rows);
    const support = summarizeSupport(rows);
    const mastery = summarizeMastery(rows);
    return {
      subjectId,
      attempts: rows.length,
      uniqueQuestions: comprehension.uniqueQuestions,
      firstAttemptAccuracy: comprehension.firstAttemptAccuracy,
      finalAnswerAccuracy: comprehension.finalAnswerAccuracy,
      hintUseRate: support.hintUseRate,
      misconceptionCount: rows.filter(entry => !entry.correct).length,
      masteryChange: mastery.averageChange,
      topicCount: new Set(rows.map(entry => entry.topicId)).size
    };
  }).sort((left, right) => right.attempts - left.attempts || left.subjectId.localeCompare(right.subjectId));
}

function buildReadiness({ activity, sessions, entries, options }) {
  const gaps = [];
  if (activity.attempts < options.minimumAttempts) gaps.push(`Perlu sekurang-kurangnya ${options.minimumAttempts} cubaan.`);
  if (sessions.completed < options.minimumCompletedSessions) gaps.push(`Perlu sekurang-kurangnya ${options.minimumCompletedSessions} sesi lengkap.`);
  if (activity.activeDays < options.minimumActiveDays) gaps.push(`Perlu aktiviti pada sekurang-kurangnya ${options.minimumActiveDays} hari.`);
  const masteryCoverage = percent(entries.filter(entry => entry.masteryBefore !== null && entry.masteryAfter !== null).length, entries.length);
  if (masteryCoverage < 80) gaps.push('Snapshot penguasaan belum mencukupi untuk ukuran perubahan yang kukuh.');
  const status = activity.attempts === 0 ? 'no_evidence' : gaps.length ? 'collecting' : 'ready';
  return {
    status,
    ready: status === 'ready',
    label: status === 'ready' ? 'Bukti mencukupi' : status === 'collecting' ? 'Masih mengumpul bukti' : 'Belum ada bukti',
    message: status === 'ready'
      ? 'Data mencukupi untuk semakan formatif pilot pada peringkat murid.'
      : gaps[0] || 'Mulakan aktiviti pembelajaran untuk menjana laporan pilot.',
    gaps
  };
}

function buildDataQuality(entries = [], sessions = {}) {
  const wrongEntries = entries.filter(entry => !entry.correct);
  return {
    supportSignalCoverage: percent(entries.filter(entry => entry.hasSupportSignal).length, entries.length),
    masterySnapshotCoverage: percent(entries.filter(entry => entry.masteryBefore !== null && entry.masteryAfter !== null).length, entries.length),
    misconceptionClassificationCoverage: percent(wrongEntries.filter(entry => entry.misconceptionType).length, wrongEntries.length),
    sessionCompletionEvidence: percent(sessions.sessionsWithCompletionEvidence, Math.max(0, sessions.started - sessions.ongoing)),
    limitations: [
      'Ringkasan menggunakan maksimum 100 rekod jawapan dan 20 rekod sesi yang disimpan pada peranti.',
      'Metrik menunjukkan bukti formatif dan tidak menggantikan pertimbangan profesional guru atau pentaksiran KPM.',
      sessions.unknownStatus > 0 ? `${sessions.unknownStatus} sesi lama tidak mempunyai status selesai yang eksplisit.` : ''
    ].filter(Boolean)
  };
}

export function buildClassroomPilotReport({ adaptiveProfile = {}, participantCode = 'UNASSIGNED', options = {} } = {}) {
  const normalizedOptions = normalizeOptions(options);
  const sourceEntries = Array.isArray(adaptiveProfile.learningHistory) ? adaptiveProfile.learningHistory : [];
  const seenRows = new Set();
  const entries = sourceEntries
    .map(normalizeLearningEntry)
    .filter(entry => entry.answeredAt && withinWindow(entry.answeredAt, normalizedOptions.start, normalizedOptions.end))
    .filter(entry => {
      if (seenRows.has(entry.rowId)) return false;
      seenRows.add(entry.rowId);
      return true;
    });
  const sessions = summarizeSessions(adaptiveProfile, normalizedOptions);
  const comprehension = summarizeComprehension(entries);
  const support = summarizeSupport(entries);
  const misconceptions = summarizeMisconceptions(entries);
  const mastery = summarizeMastery(entries);
  const activity = summarizeActivity(entries, sessions);
  const coverage = summarizeCoverage(entries);
  const readiness = buildReadiness({ activity, sessions, entries, options: normalizedOptions });

  return {
    schemaVersion: CLASSROOM_PILOT_SCHEMA_VERSION,
    reportType: 'classroom-pilot-aggregate',
    metadata: {
      participantCode: normalizeParticipantCode(participantCode),
      generatedAt: normalizedOptions.generatedAt,
      window: {
        startDate: dateKey(normalizedOptions.start),
        endDate: dateKey(normalizedOptions.end),
        days: normalizedOptions.windowDays
      }
    },
    readiness,
    summary: {
      activity,
      sessions,
      comprehension,
      support,
      misconceptions: {
        wrongAttempts: misconceptions.wrongAttempts,
        classifiedWrongAttempts: misconceptions.classifiedWrongAttempts,
        classificationCoverage: misconceptions.classificationCoverage,
        distinctCategories: misconceptions.distinctCategories
      },
      mastery: {
        topicsWithSnapshots: mastery.topicsWithSnapshots,
        baselineAverage: mastery.baselineAverage,
        currentAverage: mastery.currentAverage,
        averageChange: mastery.averageChange,
        improvedTopics: mastery.improvedTopics,
        stableTopics: mastery.stableTopics,
        declinedTopics: mastery.declinedTopics
      },
      coverage
    },
    daily: summarizeDaily(entries),
    subjects: summarizeSubjects(entries),
    misconceptions: {
      topCategories: misconceptions.topCategories
    },
    masteryTopics: mastery.topics,
    dataQuality: buildDataQuality(entries, sessions),
    privacy: {
      aggregationLevel: 'participant-window',
      containsDirectIdentifiers: false,
      containsRawResponses: false,
      participantCodeGeneratedLocally: true,
      excludedData: [
        'nama murid',
        'e-mel dan ID akaun',
        'jawapan mentah',
        'transkrip suara atau tulisan',
        'komen maklum balas beta'
      ]
    }
  };
}

export default {
  buildClassroomPilotReport,
  CLASSROOM_PILOT_SCHEMA_VERSION,
  DEFAULT_CLASSROOM_PILOT_OPTIONS
};
