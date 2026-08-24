const PERMISSION_DENIED_CODES = new Set([
  'not-allowed',
  'service-not-allowed',
  'permission-denied',
  'mic-denied'
]);

const EMPTY_ATTEMPT_CODES = new Set([
  'empty',
  'blank',
  'whitespace',
  'no-result',
  'no-speech',
  'no-response'
]);

const TECHNICAL_ERROR_CODES = new Set([
  'technical-error',
  'error',
  'audio-capture',
  'audio-unavailable',
  'playback-error',
  'speech-unavailable',
  'transcription-error',
  'validation-error',
  'unknown_error'
]);

function clampScore(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : null;
}

function inferCommunicationState(status, errorCode, message, hasScore) {
  if ((status === 'completed' || status === 'assessed') && hasScore) return 'assessed';
  if (PERMISSION_DENIED_CODES.has(errorCode) || /kebenaran mikrofon/i.test(message)) return 'permission-denied';
  if (TECHNICAL_ERROR_CODES.has(status) || TECHNICAL_ERROR_CODES.has(errorCode)) return 'technical-error';
  if (status === 'empty' || EMPTY_ATTEMPT_CODES.has(errorCode)) return 'empty';
  if (/belum ada percubaan yang sah|jawapan belum diterima|suara belum dapat dikesan/i.test(message)) return 'empty';
  if (/audio tidak dapat dimainkan|rakaman tidak dapat digunakan|cuba sekali lagi/i.test(message)) return 'technical-error';
  return 'idle';
}

function inferReason(state) {
  switch (state) {
    case 'assessed':
      return 'assessed';
    case 'permission-denied':
      return 'permission-denied';
    case 'technical-error':
      return 'technical-error';
    case 'empty':
      return 'empty-attempt';
    default:
      return 'idle';
  }
}

export function normalizeCommunicationResult(value, options = {}) {
  const input = value && typeof value === 'object' ? value : {};
  const rawStatus = typeof input.status === 'string' ? input.status : 'idle';
  const errorCode = typeof input.errorCode === 'string' && input.errorCode ? input.errorCode : null;
  const message = typeof input.message === 'string' ? input.message : '';
  const scorePercent = clampScore(input.score);
  const state = inferCommunicationState(rawStatus, errorCode, message, scorePercent !== null);
  const isAssessed = state === 'assessed' && scorePercent !== null;
  const reason = inferReason(state);
  const contract = {
    state,
    validAttempt: isAssessed,
    completed: isAssessed,
    score: isAssessed ? scorePercent : null,
    canAdvance: isAssessed,
    canRetry: state !== 'idle',
    errorCode,
    message,
    isAssessed,
    isTechnicalError: state === 'technical-error',
    isEmptyAttempt: state === 'empty',
    isPermissionDenied: state === 'permission-denied',
    scorePercent: isAssessed ? scorePercent : null,
    completedDelta: isAssessed ? 1 : 0,
    shouldAppendHistory: isAssessed,
    canProceed: isAssessed,
    reason,
    attemptKey: typeof input.attemptKey === 'string' && input.attemptKey.trim() ? input.attemptKey.trim() : ''
  };
  return {
    ...contract,
    ...(options && typeof options === 'object' ? options : {})
  };
}

export function normalizeCommunicationAttempt(value, options = {}) {
  const input = value && typeof value === 'object' ? value : {};
  const normalizedOptions = { ...(options && typeof options === 'object' ? options : {}) };
  if (!normalizedOptions.attemptKey) {
    normalizedOptions.attemptKey = createCommunicationAttemptKey(
      input.attemptKey,
      input.language,
      input.title,
      input.mode,
      input.sessionIndex,
      input.itemKey,
      input.id
    );
  }
  return normalizeCommunicationResult(input, normalizedOptions);
}

export function idleCommunicationResult() {
  return normalizeCommunicationResult(null);
}

export function isAssessedCommunicationAttempt(value) {
  return normalizeCommunicationAttempt(value).isAssessed;
}

export function sanitizeCommunicationScoreHistory(values = []) {
  return (Array.isArray(values) ? values : [])
    .map(value => clampScore(value))
    .filter(value => value !== null);
}

export function createCommunicationAttemptKey(...parts) {
  return parts
    .flat()
    .map(part => String(part ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join('::');
}

export function appendUniqueCommunicationResult(history = [], value, options = {}) {
  const normalized = normalizeCommunicationAttempt(value, options);
  if (!normalized.shouldAppendHistory) {
    return sanitizeCommunicationScoreHistory(history);
  }
  const nextHistory = sanitizeCommunicationScoreHistory(history);
  const attemptKey = normalized.attemptKey || createCommunicationAttemptKey(options?.itemKey);
  const seenKeys = options?.seenKeys instanceof Set ? options.seenKeys : null;
  if (seenKeys && attemptKey) {
    if (seenKeys.has(attemptKey)) return nextHistory;
    seenKeys.add(attemptKey);
  }
  return [...nextHistory, normalized.scorePercent];
}

function inferLegacyAssessedRow(row = {}) {
  if (typeof row.isAssessed === 'boolean') return row.isAssessed;
  const score = clampScore(row.score ?? row.averageScore ?? row.finalItemScore ?? row.latestPercent);
  const contract = normalizeCommunicationResult(row);
  if (contract.isAssessed) return true;
  if (sanitizeCommunicationScoreHistory(row.scoreHistory).length > 0) return true;
  if (Number(row.completedItems) > 0 || Number(row.completedPassages) > 0) return true;
  if (Number(row.totalTargetWords) > 0 || Number(row.totalKeywords) > 0 || Number(row.total) > 0) return score !== null;
  if (typeof row.transcript === 'string' && row.transcript.trim() && score !== null) return true;
  if (typeof row.answer === 'string' && row.answer.trim() && score !== null) return true;
  return false;
}

export function filterAssessedCommunicationHistory(rows = []) {
  return (Array.isArray(rows) ? rows : []).filter(row => row && typeof row === 'object' && inferLegacyAssessedRow(row));
}

export function filterLegacyInvalidCommunicationRows(rows = []) {
  const dedupe = new Set();
  return filterAssessedCommunicationHistory(rows).filter((row, index) => {
    const normalized = normalizeCommunicationAttempt(row, {
      attemptKey: createCommunicationAttemptKey(
        row?.attemptKey,
        row?.language,
        row?.title,
        row?.mode,
        row?.sessionIndex,
        row?.itemKey,
        row?.id,
        index
      )
    });
    if (!normalized.isAssessed) return false;
    if (!normalized.attemptKey) return true;
    if (dedupe.has(normalized.attemptKey)) return false;
    dedupe.add(normalized.attemptKey);
    return true;
  });
}

export function summarizeCommunicationHistory(rows = []) {
  const assessedRows = filterLegacyInvalidCommunicationRows(rows);
  const scores = assessedRows
    .map(row => clampScore(row.latestPercent ?? row.finalItemScore ?? row.averageScore ?? row.score))
    .filter(value => value !== null);
  if (!scores.length) {
    return {
      hasEvidence: false,
      completedItems: 0,
      averagePercent: null,
      bestPercent: null,
      latestPercent: null,
      latestLanguage: null
    };
  }
  return {
    hasEvidence: true,
    completedItems: assessedRows.length,
    averagePercent: Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length),
    bestPercent: Math.max(...scores),
    latestPercent: scores[0],
    latestLanguage: typeof assessedRows[0]?.language === 'string' && assessedRows[0].language.trim() ? assessedRows[0].language : null
  };
}

export function buildCommunicationSessionSummary(values = []) {
  if (Array.isArray(values) && values.every(value => typeof value === 'number' || value === null || value === undefined)) {
    const scores = sanitizeCommunicationScoreHistory(values);
    if (!scores.length) {
      return {
        hasEvidence: false,
        completedItems: 0,
        averagePercent: null,
        bestPercent: null,
        latestPercent: null
      };
    }
    return {
      hasEvidence: true,
      completedItems: scores.length,
      averagePercent: Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length),
      bestPercent: Math.max(...scores),
      latestPercent: scores[scores.length - 1]
    };
  }
  return summarizeCommunicationHistory(values);
}
