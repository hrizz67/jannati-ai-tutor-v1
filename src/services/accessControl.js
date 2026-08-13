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
  if (!access.access_expires_at) return true;
  return new Date(access.access_expires_at).getTime() > Date.now();
}

export function formatAccessExpiry(access) {
  if (!access?.access_expires_at) return '';
  const expiry = new Date(access.access_expires_at);
  if (Number.isNaN(expiry.getTime())) return '';
  return expiry.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getAccessLabel(access) {
  const status = normalizeAccessStatus(access?.access_status);
  const expiry = formatAccessExpiry(access);
  const expiryLabel = expiry ? ` · Tamat ${expiry}` : '';
  return {
    [ACCESS_STATUS.FREE]: 'Versi Free',
    [ACCESS_STATUS.PENDING]: 'Menunggu semakan',
    [ACCESS_STATUS.PREMIUM]: isPremiumAccess(access) ? `Premium aktif${expiryLabel}` : `Premium tamat${expiryLabel}`,
    [ACCESS_STATUS.EXPIRED]: `Premium tamat${expiryLabel}`,
    [ACCESS_STATUS.BLOCKED]: 'Akses disekat'
  }[status];
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

export function getDailyQuestionCount(profile = {}, adaptiveProfile = {}, dateKey = '', subjectId = '') {
  const day = dateKey || new Date().toISOString().slice(0, 10);
  const subject = String(subjectId || '').trim();
  const records = [
    ...(Array.isArray(profile.history) ? profile.history : []),
    ...(Array.isArray(adaptiveProfile.learningHistory) ? adaptiveProfile.learningHistory : [])
  ];
  return records.filter(item => {
    const timestamp = item?.answeredAt || item?.date || item?.createdAt;
    return timestamp
      && String(timestamp).slice(0, 10) === day
      && (!subject || String(item?.subjectId || item?.subject || '').trim() === subject)
      && (item?.questionId || item?.eventType === 'quiz-answer');
  }).length;
}
