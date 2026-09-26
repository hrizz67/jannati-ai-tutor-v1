import { getLocalDateKey } from '../utils/localDate.js';

export const ACCESS_STATUS = Object.freeze({
  FREE: 'free',
  PENDING: 'pending',
  PREMIUM: 'premium',
  EXPIRED: 'expired',
  BLOCKED: 'blocked'
});

export const FREE_DAILY_QUESTION_LIMIT = 10;
export const PREMIUM_FEATURES = Object.freeze({
  tutorAi: 'Tutor AI',
  uasa: 'Pentaksiran Sumatif',
  parent: 'Laporan Ibu Bapa',
  bacaan: 'Latihan Bacaan',
  mendengar: 'Makmal Mendengar',
  bertutur: 'Jurulatih Bertutur',
  menulis: 'Jurulatih Menulis'
});

export function normalizeAccessStatus(status) {
  return Object.values(ACCESS_STATUS).includes(status) ? status : ACCESS_STATUS.FREE;
}

export function isPremiumAccess(access) {
  if (!access || normalizeAccessStatus(access.access_status) !== ACCESS_STATUS.PREMIUM) return false;
  return access.server_verified === true && access.server_access_allowed === true;
}

export function formatAccessExpiry(access) {
  if (!access?.access_expires_at) return '';
  const expiry = new Date(access.access_expires_at);
  if (Number.isNaN(expiry.getTime())) return '';
  return expiry.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' });
}

export function getAccessLabel(access) {
  const status = normalizeAccessStatus(access?.access_status);
  const expiry = formatAccessExpiry(access);
  const expiryLabel = expiry ? ` · Tamat ${expiry}` : '';
  const serverNowMs = new Date(access?.server_now).getTime();
  const expiryMs = new Date(access?.access_expires_at).getTime();
  const daysRemaining = !access?.is_permanent && Number.isFinite(serverNowMs) && Number.isFinite(expiryMs) && expiryMs > serverNowMs
    ? Math.ceil((expiryMs - serverNowMs) / 86400000)
    : null;
  const activeExpiryLabel = daysRemaining !== null && daysRemaining <= 7
    ? ` · Tamat ${daysRemaining} hari lagi`
    : expiryLabel;
  return {
    [ACCESS_STATUS.FREE]: 'Versi Free',
    [ACCESS_STATUS.PENDING]: 'Menunggu semakan',
    [ACCESS_STATUS.PREMIUM]: isPremiumAccess(access) ? `Premium aktif${activeExpiryLabel}` : `Premium tamat${expiryLabel}`,
    [ACCESS_STATUS.EXPIRED]: `Premium tamat${expiryLabel}`,
    [ACCESS_STATUS.BLOCKED]: 'Akses disekat'
  }[status];
}

export function resolveAuthoritativeAccess(accountId, access) {
  const activeAccountId = String(accountId || '').trim();
  const accessAccountId = String(access?.id || '').trim();
  const matchesActiveAccount = Boolean(activeAccountId && accessAccountId === activeAccountId);
  const declaredStatus = matchesActiveAccount
    ? normalizeAccessStatus(access?.access_status)
    : ACCESS_STATUS.FREE;
  const serverCandidate = {
    ...(matchesActiveAccount ? access : {}),
    id: activeAccountId || null,
    access_status: declaredStatus,
    access_expires_at: matchesActiveAccount ? access?.access_expires_at || null : null,
  };
  const premiumActive = matchesActiveAccount && isPremiumAccess(serverCandidate);
  const resolved = {
    ...serverCandidate,
    access_status: declaredStatus === ACCESS_STATUS.PREMIUM && !premiumActive
      ? ACCESS_STATUS.EXPIRED
      : declaredStatus,
    access_source: matchesActiveAccount
      ? access?.access_source || 'server'
      : activeAccountId ? 'unverified' : 'local',
    verifiedForAccount: matchesActiveAccount
  };

  return {
    ...resolved,
    isPremium: premiumActive,
    accessLabel: getAccessLabel(resolved)
  };
}

export function getAccessStatus(access) {
  return normalizeAccessStatus(access?.access_status);
}

export function canUsePremiumFeature(access) {
  return isPremiumAccess(access);
}

export function getAccessFeatureLabel(feature) {
  return PREMIUM_FEATURES[feature] || 'Ciri Premium';
}

function normalizeQuotaIdentity(value) {
  return String(value || '').trim().toLowerCase();
}

function getQuotaRecordAliases(item, day) {
  const questionId = normalizeQuotaIdentity(item?.questionId);
  const sessionId = normalizeQuotaIdentity(item?.sessionId);
  const subjectId = normalizeQuotaIdentity(item?.subjectId || item?.subject);
  const topicId = normalizeQuotaIdentity(item?.topicId || item?.topic);
  const aliases = [];

  if (sessionId && questionId) aliases.push(`session-question:${sessionId}:${questionId}`);
  for (const [label, value] of [
    ['event', item?.eventId],
    ['attempt', item?.attemptId],
    ['result', item?.resultId]
  ]) {
    const normalized = normalizeQuotaIdentity(value);
    if (normalized) aliases.push(`${label}:${normalized}`);
  }

  // Older records have no session dimension. Collapse the same question within
  // the same subject/topic/day so missing legacy metadata cannot overcharge a
  // learner. Distinct old sessions may therefore be conservatively undercounted.
  if (!sessionId && questionId) {
    aliases.push(`legacy-question:${day}:${subjectId}:${topicId}:${questionId}`);
  }

  if (!questionId && item?.eventType === 'quiz-answer') {
    const timestamp = String(item?.answeredAt || item?.date || item?.createdAt || '').trim();
    const attemptNumber = Number.isFinite(Number(item?.attemptNumber))
      ? Math.max(1, Math.floor(Number(item.attemptNumber)))
      : 1;
    aliases.push(`legacy-event:${day}:${subjectId}:${topicId}:${timestamp}:${attemptNumber}`);
  }

  return aliases;
}

function countIdentityGroups(records = []) {
  const parents = records.map((_, index) => index);
  const find = index => {
    let root = index;
    while (parents[root] !== root) root = parents[root];
    while (parents[index] !== index) {
      const parent = parents[index];
      parents[index] = root;
      index = parent;
    }
    return root;
  };
  const unite = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parents[rightRoot] = leftRoot;
  };
  const firstIndexByAlias = new Map();

  records.forEach((record, index) => {
    record.aliases.forEach(alias => {
      if (firstIndexByAlias.has(alias)) unite(index, firstIndexByAlias.get(alias));
      else firstIndexByAlias.set(alias, index);
    });
  });

  return new Set(records.map((_, index) => find(index))).size;
}

export function getDailyQuestionCount(profile = {}, adaptiveProfile = {}, dateKey = '', subjectId = '') {
  const day = getLocalDateKey(dateKey || new Date());
  if (!day) return 0;
  const subject = normalizeQuotaIdentity(subjectId);
  const records = [
    ...(Array.isArray(profile.history) ? profile.history : []),
    ...(Array.isArray(adaptiveProfile.learningHistory) ? adaptiveProfile.learningHistory : [])
  ];
  const eligibleRecords = records.flatMap(item => {
    const timestamp = item?.answeredAt || item?.date || item?.createdAt;
    const questionId = normalizeQuotaIdentity(item?.questionId);
    const itemSubject = normalizeQuotaIdentity(item?.subjectId || item?.subject);
    if (!timestamp
      || getLocalDateKey(timestamp) !== day
      || (subject && itemSubject !== subject)
      || (!questionId && item?.eventType !== 'quiz-answer')) return [];
    const aliases = getQuotaRecordAliases(item, day);
    return aliases.length ? [{ aliases }] : [];
  });
  return countIdentityGroups(eligibleRecords);
}

export function resolveQuestionQuotaSubjectId(question = {}, ...fallbacks) {
  const candidates = [question?.subjectId, ...fallbacks];
  for (const candidate of candidates) {
    const normalized = normalizeQuotaIdentity(candidate?.id || candidate);
    if (normalized && normalized !== 'adaptive') return normalized;
  }
  return '';
}

export function hasQuestionAttemptInSession(answers = [], questionId = '', sessionId = '', dateKey = '') {
  const targetQuestionId = normalizeQuotaIdentity(questionId);
  const targetSessionId = normalizeQuotaIdentity(sessionId);
  const targetDay = dateKey ? getLocalDateKey(dateKey) : '';
  if (!targetQuestionId) return false;
  return (Array.isArray(answers) ? answers : []).some(attempt => {
    const status = normalizeQuotaIdentity(attempt?.status);
    const attemptSessionId = normalizeQuotaIdentity(attempt?.sessionId);
    const attemptDay = targetDay ? getLocalDateKey(attempt?.answeredAt || attempt?.date || '') : '';
    return normalizeQuotaIdentity(attempt?.questionId) === targetQuestionId
      && ['wrong', 'almost', 'correct'].includes(status)
      && (!targetSessionId || !attemptSessionId || attemptSessionId === targetSessionId)
      && (!targetDay || attemptDay === targetDay);
  });
}

export function canSubmitFreeQuestion({
  dailyQuestionCount = 0,
  questionId = '',
  sessionId = '',
  sessionAnswers = [],
  dateKey = '',
  limit = FREE_DAILY_QUESTION_LIMIT
} = {}) {
  const safeCount = Math.max(0, Number(dailyQuestionCount) || 0);
  const safeLimit = Math.max(0, Number(limit) || 0);
  return safeCount < safeLimit
    || hasQuestionAttemptInSession(sessionAnswers, questionId, sessionId, dateKey);
}

export function capQuestionCountToRemainingQuota(requestedCount, dailyQuestionCount, limit = FREE_DAILY_QUESTION_LIMIT) {
  const requested = Math.max(0, Math.floor(Number(requestedCount) || 0));
  const used = Math.max(0, Math.floor(Number(dailyQuestionCount) || 0));
  const safeLimit = Math.max(0, Math.floor(Number(limit) || 0));
  return Math.min(requested, Math.max(0, safeLimit - used));
}
