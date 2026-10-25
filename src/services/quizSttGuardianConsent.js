import {
  getSupabaseClient,
  getSupabaseReauthenticationClient
} from './supabaseClient.js';

export const QUIZ_STT_PRIVACY_NOTICE_VERSION = 'quiz-stt-cloudflare-bm-v1';

const CONSENT_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (!normalizedChildId || granted !== false) return unavailable('invalid-request');
  try {
    const client = await getClient();
    if (!client?.rpc) return unavailable();
    const { data, error } = await client.rpc('set_quiz_stt_guardian_consent_v1', {
      p_child_id: normalizedChildId,
      p_granted: false,
      p_notice_version: QUIZ_STT_PRIVACY_NOTICE_VERSION,
      p_guardian_challenge: null
    });
    if (error) return unavailable();
    return normalizeConsentResult(data);
  } catch {
    return unavailable();
  }
}

export async function grantQuizSttGuardianConsent(
  { childId, password },
  {
    getClient = getSupabaseClient,
    getReauthenticationClient = getSupabaseReauthenticationClient
  } = {}
) {
  const normalizedChildId = cleanChildId(childId);
  if (!normalizedChildId || typeof password !== 'string' || !password) {
    return unavailable('invalid-request');
  }
  try {
    const client = await getClient();
    if (!client?.rpc || !client?.auth?.getSession) return unavailable();
    const priorSession = await client.auth.getSession();
    const priorUserId = priorSession?.data?.session?.user?.id;
    const normalizedEmail = String(priorSession?.data?.session?.user?.email || '').trim();
    if (typeof priorUserId !== 'string' || !priorUserId || !EMAIL_PATTERN.test(normalizedEmail)) {
      return unavailable('guardian-reauth-required');
    }

    const challengeResult = await client.rpc('begin_quiz_stt_guardian_authorization_v1', {
      p_child_id: normalizedChildId
    });
    const challengeToken = challengeResult?.data?.challengeToken;
    if (challengeResult?.error || !CONSENT_TOKEN_PATTERN.test(challengeToken || '')) {
      return unavailable('guardian-reauth-required');
    }

    const reauthenticationClient = await getReauthenticationClient();
    if (!reauthenticationClient?.rpc || !reauthenticationClient?.auth?.signInWithPassword) {
      return unavailable('guardian-reauth-required');
    }
    const reauthentication = await reauthenticationClient.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });
    if (reauthentication?.error || reauthentication?.data?.user?.id !== priorUserId) {
      return unavailable('guardian-reauth-failed');
    }

    const { data, error } = await reauthenticationClient.rpc('set_quiz_stt_guardian_consent_v1', {
      p_child_id: normalizedChildId,
      p_granted: true,
      p_notice_version: QUIZ_STT_PRIVACY_NOTICE_VERSION,
      p_guardian_challenge: challengeToken
    });
    if (error) return unavailable('guardian-authorization-rejected');
    return normalizeConsentResult(data);
  } catch {
    return unavailable('guardian-reauth-failed');
  }
}

export default {
  grantQuizSttGuardianConsent,
  getQuizSttGuardianConsent,
  setQuizSttGuardianConsent,
  QUIZ_STT_PRIVACY_NOTICE_VERSION
};
