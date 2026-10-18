// P1.17-V06: isolated, fail-closed Quiz STT pilot Worker.
// Do not route Bacaan/Bertutur traffic here. No request, transcript or audio logging.
const MODEL = '@cf/openai/whisper-large-v3-turbo';
const PATH = '/v1/quiz/transcribe';
const MAX_AUDIO_BYTES = 1024 * 1024;
const MAX_TRANSCRIPT_LENGTH = 4000;
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
function fail(code, status, origin = '') {
  return respond({ error: code }, status, origin);
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
  return /^[0-9a-f]{8}-[0-9a-f-]{27,50}$/i.test(userId || '')
    && String(env.QUIZ_PILOT_ALLOWED_USER_IDS || '').split(',').some(s => s.trim() === userId);
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
async function verifyUser(request, env, fetchImpl) {
  const auth = String(request.headers.get('Authorization') || '');
  const match = /^Bearer ([A-Za-z0-9._~-]{32,8192})$/.exec(auth);
  if (!match) return { error: 'authentication-required', status: 401 };
  const config = authServiceConfig(env);
  if (!config || typeof fetchImpl !== 'function') return { error: 'auth-unavailable', status: 503 };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetchImpl(config.url, {
      method: 'GET',
      headers: { apikey: config.key, Authorization: `Bearer ${match[1]}`, Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal
    });
    if (response.status === 401 || response.status === 403) return { error: 'authentication-required', status: 401 };
    if (!response.ok) return { error: 'auth-unavailable', status: 503 };
    const user = await response.json();
    if (typeof user?.id !== 'string' || !user.id) return { error: 'authentication-required', status: 401 };
    return { id: user.id };
  } catch {
    return { error: 'auth-unavailable', status: 503 };
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

export async function handleRequest(request, env = {}, { fetchImpl = globalThis.fetch } = {}) {
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

  const user = await verifyUser(request, env, fetchImpl);
  if (user.error) return fail(user.error, user.status, origin);
  if (!allowedUserId(env, user.id)) return fail('pilot-access-denied', 403, origin);
  // Independent per-account and global quotas: never trust the query string,
  // supplied user ID or CORS origin as authorization.
  const accountLimit = await consume(env.QUIZ_ACCOUNT_RATE_LIMITER, `quiz-account:${user.id}`);
  if (accountLimit !== 'ok') return fail(accountLimit === 'limited' ? 'stt-rate-limited' : 'rate-limit-unavailable', accountLimit === 'limited' ? 429 : 503, origin);
  const globalLimit = await consume(env.QUIZ_GLOBAL_RATE_LIMITER, 'quiz-pilot:global');
  if (globalLimit !== 'ok') return fail(globalLimit === 'limited' ? 'stt-rate-limited' : 'rate-limit-unavailable', globalLimit === 'limited' ? 429 : 503, origin);

  let audio;
  try {
    audio = await request.arrayBuffer();
  } catch {
    return fail('invalid-audio', 400, origin);
  }
  if (!audio.byteLength) return fail('empty-audio', 400, origin);
  if (audio.byteLength > MAX_AUDIO_BYTES) return fail('audio-too-large', 413, origin);
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
      metadata: { language, model: MODEL }
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
