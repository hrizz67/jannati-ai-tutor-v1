import { getSupabaseClient } from './supabaseClient.js';

export const QUIZ_STT_PRIVACY_NOTICE_VERSION = 'quiz-stt-cloudflare-bm-v1';

const CONSENT_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanChildId(value) {
  const childId = String(value || '').trim();
  return /^child-[A-Za-z0-9._:-]{1,194}$/.test(childId) ? childId : '';
}

function unavailable(reason = 'consent-unavailable') {
  return { ok: false, eligible: false, granted: false, status: 'unavailable', reason };
}

function normalizeConsentResult(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return unavailable();
  const status = ['granted', 'revoked', 'missing', 'child-not-found'].includes(data.status)
    ? data.status
    : 'unavailable';
  const eligible = data.eligible === true;
  const versionMatches = data.noticeVersion === QUIZ_STT_PRIVACY_NOTICE_VERSION;
  const consentToken = CONSENT_TOKEN_PATTERN.test(data.consentToken || '') ? data.consentToken : '';
  const granted = eligible && data.granted === true && versionMatches && Boolean(consentToken);
  return {
    ok: status !== 'unavailable',
    eligible,
    granted,
    status: data.granted === true && !granted ? 'missing' : status,
    consentToken: granted ? consentToken : '',
    noticeVersion: typeof data.noticeVersion === 'string' ? data.noticeVersion : '',
    changedAt: typeof data.changedAt === 'string' ? data.changedAt : ''
  };
}

export async function getQuizSttGuardianConsent(childId, { getClient = getSupabaseClient } = {}) {
  const normalizedChildId = cleanChildId(childId);
  if (!normalizedChildId) return unavailable('invalid-child');
  try {
    const client = await getClient();
    if (!client?.rpc) return unavailable();
    const { data, error } = await client.rpc('get_quiz_stt_guardian_consent_v1', {
      p_child_id: normalizedChildId
    });
    if (error) return unavailable();
    return normalizeConsentResult(data);
  } catch {
    return unavailable();
  }
}

export async function setQuizSttGuardianConsent({ childId, granted }, { getClient = getSupabaseClient } = {}) {
  const normalizedChildId = cleanChildId(childId);
  if (!normalizedChildId || typeof granted !== 'boolean') return unavailable('invalid-request');
  try {
    const client = await getClient();
    if (!client?.rpc) return unavailable();
    const { data, error } = await client.rpc('set_quiz_stt_guardian_consent_v1', {
      p_child_id: normalizedChildId,
      p_granted: granted,
      p_notice_version: QUIZ_STT_PRIVACY_NOTICE_VERSION
    });
    if (error) return unavailable();
    return normalizeConsentResult(data);
  } catch {
    return unavailable();
  }
}

export default {
  getQuizSttGuardianConsent,
  setQuizSttGuardianConsent,
  QUIZ_STT_PRIVACY_NOTICE_VERSION
};
