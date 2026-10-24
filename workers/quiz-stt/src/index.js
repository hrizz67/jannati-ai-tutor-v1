// P1.17-V06: isolated, fail-closed Quiz STT pilot Worker.
// Do not route Bacaan/Bertutur traffic here. No request, transcript or audio logging.
const MODEL = '@cf/openai/whisper-large-v3-turbo';
const PATH = '/v1/quiz/transcribe';
const MAX_AUDIO_BYTES = 1024 * 1024;
const MAX_TRANSCRIPT_LENGTH = 4000;
const AUTH_TIMEOUT_MS = 4000;
const DAILY_QUOTA_OBJECT_NAME = 'quiz-stt-global-v1';
const MAX_DAILY_INFERENCES = 100;
const AUTH_DIAGNOSTIC_STAGES = new Set([
  'bearer-missing',
  'config-invalid',
  'fetch-unavailable',
  'upstream-auth-rejected',
  'upstream-redirect-rejected',
  'upstream-service-rejected',
  'upstream-response-invalid',
  'fetch-timeout',
  'fetch-failed'
]);
const LANGUAGES = new Map([
  ['ms-my', 'ms'], ['ms', 'ms'], ['en-us', 'en'], ['en', 'en'],
  ['ar-sa', 'ar'], ['ar', 'ar']
]);
const AUDIO_TYPES = new Set(['audio/mp4', 'audio/webm', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg']);

function respond(payload, status, origin = '') {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  });
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  return new Response(JSON.stringify(payload), { status, headers });
}
function safeAuthDiagnostic(env, diagnostic) {
  if (env.QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED !== 'true' || !diagnostic
      || !AUTH_DIAGNOSTIC_STAGES.has(diagnostic.stage)) return null;
  const httpStatus = Number(diagnostic.httpStatus);
  const elapsedMs = Number(diagnostic.elapsedMs);
  return {
    stage: diagnostic.stage,
    httpStatus: Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599 ? httpStatus : null,
    elapsedMs: Number.isFinite(elapsedMs) ? Math.max(0, Math.min(60000, Math.round(elapsedMs))) : 0
  };
}
function fail(code, status, origin = '', authDiagnostic = null) {
  const payload = { error: code };
  if (authDiagnostic) payload.authDiagnostic = authDiagnostic;
  return respond(payload, status, origin);
}
function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  return String(env.CORS_ALLOW_ORIGINS || '').split(',').map(s => s.trim()).some(allowed => {
    try {
      const p = new URL(allowed);
      return p.origin === origin && allowed === origin && p.protocol === 'https:';
    } catch {
      return false;
    }
  }) ? origin : '';
}
function allowedUserId(env, userId) {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,50}$/i.test(userId || '')) return 'denied';
  const accessMode = String(env.QUIZ_STT_ACCESS_MODE || 'allowlist').trim().toLowerCase();
  if (accessMode === 'registered') return 'allowed';
  if (accessMode !== 'allowlist') return 'unavailable';
  return String(env.QUIZ_PILOT_ALLOWED_USER_IDS || '').split(',').some(s => s.trim() === userId)
    ? 'allowed'
    : 'denied';
}
function authServiceConfig(env) {
  try {
    const url = new URL(String(env.SUPABASE_URL || ''));
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
    const key = String(env.SUPABASE_PUBLISHABLE_KEY || '');
    if (!key || key.length > 512) return null;
    return { url: url.origin + '/auth/v1/user', key };
  } catch {
    return null;
  }
}
async function verifyUser(request, env, fetchImpl, {
  now = () => Date.now(),
  timeoutMs = AUTH_TIMEOUT_MS
} = {}) {
  const startedAt = now();
  const failure = (error, status, stage, httpStatus = null) => ({
    error,
    status,
    diagnostic: {
      stage,
      httpStatus,
      elapsedMs: now() - startedAt
    }
  });
  const auth = String(request.headers.get('Authorization') || '');
  const match = /^Bearer ([A-Za-z0-9._~-]{32,8192})$/.exec(auth);
  if (!match) return failure('authentication-required', 401, 'bearer-missing');
  const config = authServiceConfig(env);
  if (!config) return failure('auth-unavailable', 503, 'config-invalid');
  if (typeof fetchImpl !== 'function') return failure('auth-unavailable', 503, 'fetch-unavailable');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(config.url, {
      method: 'GET',
      headers: { apikey: config.key, Authorization: `Bearer ${match[1]}`, Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal
    });
    if (response.status >= 300 && response.status <= 399) {
      return failure('auth-unavailable', 503, 'upstream-redirect-rejected', response.status);
    }
    if (response.status === 401 || response.status === 403) {
      return failure('authentication-required', 401, 'upstream-auth-rejected', response.status);
    }
    if (!response.ok) {
      return failure('auth-unavailable', 503, 'upstream-service-rejected', response.status);
    }
    let user;
    try {
      user = await response.json();
    } catch {
      return failure('auth-unavailable', 503, 'upstream-response-invalid', response.status);
    }
    if (typeof user?.id !== 'string' || !user.id) {
      return failure('auth-unavailable', 503, 'upstream-response-invalid', response.status);
    }
    return { id: user.id };
  } catch {
    return failure('auth-unavailable', 503, controller.signal.aborted ? 'fetch-timeout' : 'fetch-failed');
  } finally {
    clearTimeout(timer);
  }
}
async function consume(binding, key) {
  if (!binding || typeof binding.limit !== 'function') return 'unavailable';
  try {
    const result = await binding.limit({ key });
    return result?.success === true ? 'ok' : 'limited';
  } catch {
    return 'unavailable';
  }
}
function utcDayKey(value = Date.now()) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return '';
  try {
    return new Date(timestamp).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}
function configuredDailyInferenceLimit(env) {
  const configured = Number(env.QUIZ_STT_DAILY_MAX_INFERENCES);
  return Number.isInteger(configured) && configured > 0 && configured <= MAX_DAILY_INFERENCES
    ? configured
    : 0;
}
async function reserveDailyInference(env, now = Date.now) {
  const limit = configuredDailyInferenceLimit(env);
  const day = utcDayKey(now());
  if (!limit || !day || !env.QUIZ_DAILY_USAGE || typeof env.QUIZ_DAILY_USAGE.getByName !== 'function') {
    return { status: 'unavailable' };
  }
  try {
    const result = await env.QUIZ_DAILY_USAGE.getByName(DAILY_QUOTA_OBJECT_NAME).reserve({ day, limit });
    if (result?.status === 'limited') return { status: 'limited' };
    if (result?.status !== 'ok'
        || !Number.isInteger(result.remaining)
        || result.remaining < 0
        || result.remaining >= limit) return { status: 'unavailable' };
    const resetAt = new Date(Date.parse(`${day}T00:00:00Z`) + 86400000).toISOString();
    return { status: 'ok', remaining: result.remaining, limit, resetAt };
  } catch {
    return { status: 'unavailable' };
  }
}
function base64(bytes) {
  const data = new Uint8Array(bytes);
  let out = '';
  for (let i = 0; i < data.length; i += 32768) {
    out += String.fromCharCode(...data.subarray(i, i + 32768));
  }
  return btoa(out);
}
function normalText(value) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_TRANSCRIPT_LENGTH)
    : '';
}
function normalizeConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.min(100, Math.max(0, n > 0 && n <= 1 ? n * 100 : n)) * 100) / 100;
}
function preflight(request, origin) {
  if (request.headers.get('Access-Control-Request-Method') !== 'POST') return fail('method-not-allowed', 405, origin);
  const requested = (request.headers.get('Access-Control-Request-Headers') || '')
    .toLowerCase().split(',').map(v => v.trim()).filter(Boolean);
  if (requested.some(k => !['authorization', 'content-type', 'x-stt-language'].includes(k))) {
    return fail('headers-not-allowed', 403, origin);
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type, x-stt-language',
      'Access-Control-Max-Age': '600',
      'Cache-Control': 'no-store',
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function handleRequest(request, env = {}, {
  fetchImpl = globalThis.fetch,
  now,
  authTimeoutMs
} = {}) {
  const url = new URL(request.url);
  if (url.pathname !== PATH) return fail('not-found', 404);
  const origin = allowedOrigin(request, env);
  if (!origin) return fail('origin-not-allowed', 403);
  // The pilot is OFF unless an operator explicitly configures server-side access.
  if (env.QUIZ_STT_PILOT_ENABLED !== 'true') return fail('pilot-disabled', 503, origin);
  if (request.method === 'OPTIONS') return preflight(request, origin);
  if (request.method !== 'POST') return fail('method-not-allowed', 405, origin);

  const type = (request.headers.get('Content-Type') || '').split(';', 1)[0].toLowerCase().trim();
  if (!AUDIO_TYPES.has(type)) return fail('unsupported-audio-type', 415, origin);
  const language = LANGUAGES.get((request.headers.get('X-STT-Language') || '').trim().toLowerCase());
  if (!language) return fail('unsupported-language', 400, origin);
  const length = request.headers.get('Content-Length');
  if (length && (!/^\d+$/.test(length) || Number(length) < 1)) return fail('empty-audio', 400, origin);
  if (length && Number(length) > MAX_AUDIO_BYTES) return fail('audio-too-large', 413, origin);
  if (!env.AI || typeof env.AI.run !== 'function') return fail('stt-unavailable', 503, origin);
  if (!env.QUIZ_ACCOUNT_RATE_LIMITER || !env.QUIZ_GLOBAL_RATE_LIMITER) {
    return fail('rate-limit-unavailable', 503, origin);
  }

  // Spend global quota before remote token introspection as well: a malicious
  // origin/spoofed client must not create an unlimited Supabase Auth workload.
  const globalLimit = await consume(env.QUIZ_GLOBAL_RATE_LIMITER, 'quiz-pilot:global');
  if (globalLimit !== 'ok') return fail(globalLimit === 'limited' ? 'stt-rate-limited' : 'rate-limit-unavailable', globalLimit === 'limited' ? 429 : 503, origin);
  const user = await verifyUser(request, env, fetchImpl, { now, timeoutMs: authTimeoutMs });
  if (user.error) return fail(user.error, user.status, origin, safeAuthDiagnostic(env, user.diagnostic));
  const access = allowedUserId(env, user.id);
  if (access === 'unavailable') return fail('access-policy-unavailable', 503, origin);
  if (access !== 'allowed') return fail('pilot-access-denied', 403, origin);
  // Per-account quota is keyed ONLY from the verified Supabase user ID.
  const accountLimit = await consume(env.QUIZ_ACCOUNT_RATE_LIMITER, `quiz-account:${user.id}`);
  if (accountLimit !== 'ok') return fail(accountLimit === 'limited' ? 'stt-rate-limited' : 'rate-limit-unavailable', accountLimit === 'limited' ? 429 : 503, origin);

  let audio;
  try {
    audio = await request.arrayBuffer();
  } catch {
    return fail('invalid-audio', 400, origin);
  }
  if (!audio.byteLength) return fail('empty-audio', 400, origin);
  if (audio.byteLength > MAX_AUDIO_BYTES) return fail('audio-too-large', 413, origin);
  // Reserve one strongly-consistent global inference slot only after auth,
  // access policy, rate limits and payload guards have passed. A reservation
  // is never refunded after a provider failure: the budget remains
  // conservative and cannot overshoot because of retries.
  const dailyQuota = await reserveDailyInference(env, now || Date.now);
  if (dailyQuota.status !== 'ok') {
    return fail(dailyQuota.status === 'limited' ? 'daily-ai-quota-exhausted' : 'daily-ai-quota-unavailable',
      dailyQuota.status === 'limited' ? 429 : 503, origin);
  }
  try {
    const result = await env.AI.run(MODEL, {
      audio: base64(audio), task: 'transcribe', language,
      vad_filter: true, condition_on_previous_text: false
    });
    const transcript = normalText(result?.text || result?.transcription_info?.text);
    if (!transcript) return fail('no-speech', 422, origin);
    return respond({
      transcript,
      confidence: normalizeConfidence(result?.transcription_info?.language_probability ?? result?.language_probability),
      provider: 'cloudflare-workers-ai',
      metadata: {
        language,
        model: MODEL,
        quota: {
          dailyInferenceLimit: dailyQuota.limit,
          dailyInferenceRemaining: dailyQuota.remaining,
          resetsAt: dailyQuota.resetAt
        }
      }
    }, 200, origin);
  } catch (err) {
    const status = Number(err?.status || err?.statusCode);
    if (status === 408) return fail('stt-timeout', 504, origin);
    if (status === 429) return fail('stt-rate-limited', 429, origin);
    return fail('stt-provider-error', 502, origin);
  }
}
export default { fetch: handleRequest };
export const QUIZ_STT_MAX_AUDIO_BYTES = MAX_AUDIO_BYTES;
export const QUIZ_STT_MAX_DAILY_INFERENCES = MAX_DAILY_INFERENCES;

// Stores only one UTC date and a global count. It never receives or stores a
// user ID, token, audio, transcript or learner content.
export class QuizDailyUsageQuota {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async reserve({ day, limit } = {}) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')
        || !Number.isInteger(limit)
        || limit < 1
        || limit > MAX_DAILY_INFERENCES
        || !this.ctx?.storage?.transaction) return { status: 'unavailable' };
    try {
      return await this.ctx.storage.transaction(async storage => {
        const previous = await storage.get('usage');
        const used = previous?.day === day && Number.isInteger(previous?.used) && previous.used >= 0
          ? previous.used
          : 0;
        if (used >= limit) return { status: 'limited', remaining: 0 };
        const next = used + 1;
        await storage.put('usage', { day, used: next });
        return { status: 'ok', remaining: limit - next };
      });
    } catch {
      return { status: 'unavailable' };
    }
  }
}
