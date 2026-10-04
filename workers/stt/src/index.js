const MODEL = '@cf/openai/whisper-large-v3-turbo';
const TRANSCRIBE_PATH = '/v1/transcribe';
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const MAX_TRANSCRIPT_LENGTH = 4000;
const CORS_MAX_AGE_SECONDS = 600;

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mp4',
  'audio/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg'
]);

const LANGUAGE_MAP = new Map([
  ['ms', 'ms'],
  ['ms-my', 'ms'],
  ['en', 'en'],
  ['en-my', 'en'],
  ['en-us', 'en'],
  ['en-gb', 'en'],
  ['ar', 'ar'],
  ['ar-my', 'ar'],
  ['ar-sa', 'ar']
]);

function jsonResponse(payload, status, origin = '') {
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

function errorResponse(code, status, origin = '') {
  return jsonResponse({ error: code }, status, origin);
}

function resolveAllowedOrigins(value) {
  if (typeof value !== 'string') return new Set();
  return new Set(value.split(',').map(entry => entry.trim()).filter(entry => {
    try {
      const parsed = new URL(entry);
      return parsed.origin === entry && ['https:', 'http:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }));
}

function resolveRequestOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  return resolveAllowedOrigins(env.CORS_ALLOW_ORIGINS).has(origin) ? origin : '';
}

function resolveMimeType(value) {
  return String(value || '').split(';', 1)[0].trim().toLowerCase();
}

function resolveLanguage(value) {
  return LANGUAGE_MAP.get(String(value || '').trim().toLowerCase()) || '';
}

function parseContentLength(value) {
  if (value == null || value === '') return null;
  if (!/^\d+$/.test(value)) return Number.NaN;
  return Number(value);
}

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function normalizeTranscript(value) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_TRANSCRIPT_LENGTH)
    : '';
}

function normalizeConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const percentage = number > 0 && number <= 1 ? number * 100 : number;
  return Math.round(Math.max(0, Math.min(100, percentage)) * 100) / 100;
}

function preflightResponse(request, origin) {
  if (request.headers.get('Access-Control-Request-Method') !== 'POST') {
    return errorResponse('method-not-allowed', 405, origin);
  }
  const requestedHeaders = String(request.headers.get('Access-Control-Request-Headers') || '')
    .split(',')
    .map(header => header.trim().toLowerCase())
    .filter(Boolean);
  if (requestedHeaders.some(header => !['content-type', 'x-stt-language'].includes(header))) {
    return errorResponse('headers-not-allowed', 403, origin);
  }
  const headers = new Headers({
    'Access-Control-Allow-Headers': 'content-type, x-stt-language',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Max-Age': String(CORS_MAX_AGE_SECONDS),
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff'
  });
  return new Response(null, { status: 204, headers });
}

async function handleTranscription(request, env, origin) {
  const mimeType = resolveMimeType(request.headers.get('Content-Type'));
  if (!ALLOWED_AUDIO_TYPES.has(mimeType)) return errorResponse('unsupported-audio-type', 415, origin);

  const language = resolveLanguage(request.headers.get('X-STT-Language'));
  if (!language) return errorResponse('unsupported-language', 400, origin);

  const contentLength = parseContentLength(request.headers.get('Content-Length'));
  if (Number.isNaN(contentLength) || contentLength === 0) return errorResponse('empty-audio', 400, origin);
  if (contentLength != null && contentLength > MAX_AUDIO_BYTES) {
    return errorResponse('audio-too-large', 413, origin);
  }
  if (!env.AI || typeof env.AI.run !== 'function') {
    return errorResponse('stt-unavailable', 503, origin);
  }
  if (!env.STT_RATE_LIMITER || typeof env.STT_RATE_LIMITER.limit !== 'function') {
    return errorResponse('rate-limit-unavailable', 503, origin);
  }
  try {
    const rateLimit = await env.STT_RATE_LIMITER.limit({ key: `stt:${origin}` });
    if (!rateLimit?.success) return errorResponse('stt-rate-limited', 429, origin);
  } catch {
    return errorResponse('rate-limit-unavailable', 503, origin);
  }

  let audio;
  try {
    audio = await request.arrayBuffer();
  } catch {
    return errorResponse('invalid-audio', 400, origin);
  }
  if (audio.byteLength === 0) return errorResponse('empty-audio', 400, origin);
  if (audio.byteLength > MAX_AUDIO_BYTES) return errorResponse('audio-too-large', 413, origin);

  try {
    const result = await env.AI.run(MODEL, {
      audio: bytesToBase64(audio),
      task: 'transcribe',
      language,
      vad_filter: true,
      condition_on_previous_text: false
    });
    const transcript = normalizeTranscript(result?.text || result?.transcription_info?.text);
    if (!transcript) return errorResponse('no-speech', 422, origin);
    const confidence = normalizeConfidence(
      result?.transcription_info?.language_probability ?? result?.language_probability
    );
    return jsonResponse({
      transcript,
      confidence,
      provider: 'cloudflare-workers-ai',
      metadata: { model: MODEL, language }
    }, 200, origin);
  } catch (error) {
    const status = Number(error?.status || error?.statusCode);
    if (status === 408) return errorResponse('stt-timeout', 504, origin);
    if (status === 429) return errorResponse('stt-rate-limited', 429, origin);
    return errorResponse('stt-provider-error', 502, origin);
  }
}

export async function handleRequest(request, env = {}) {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/health') {
    return jsonResponse({ ok: true, model: MODEL }, 200);
  }
  if (url.pathname !== TRANSCRIBE_PATH) return errorResponse('not-found', 404);

  const origin = resolveRequestOrigin(request, env);
  if (!origin) return errorResponse('origin-not-allowed', 403);
  if (request.method === 'OPTIONS') return preflightResponse(request, origin);
  if (request.method !== 'POST') return errorResponse('method-not-allowed', 405, origin);
  return handleTranscription(request, env, origin);
}

export default {
  fetch: handleRequest
};

export const STT_WORKER_MODEL = MODEL;
export const STT_WORKER_MAX_AUDIO_BYTES = MAX_AUDIO_BYTES;
