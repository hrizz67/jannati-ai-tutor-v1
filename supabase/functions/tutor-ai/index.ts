import {
  buildOpenAITutorRequest,
  buildTutorSafetyResponse,
  detectTutorSafetyRisk,
  extractOpenAIOutputText,
  sanitizeTutorGatewayPayload,
  sanitizeTutorModelOutput
} from '../_shared/tutorPolicy.js';

const requestWindows = new Map<string, { startedAt: number; count: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;

function getAllowedOrigins() {
  const configured = (Deno.env.get('TUTOR_AI_ALLOWED_ORIGINS') || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  return new Set([
    'https://hrizz67.github.io',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4174',
    'http://127.0.0.1:4174',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...configured
  ]);
}

function corsHeaders(origin = '') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

function jsonResponse(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function decodeJwtSubject(authorization = '') {
  try {
    const token = authorization.replace(/^Bearer\s+/i, '');
    const encoded = token.split('.')[1];
    if (!encoded) return '';
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return String(JSON.parse(atob(padded))?.sub || '');
  } catch {
    return '';
  }
}

function getPublishableKey() {
  const legacy = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}');
    return String(keys?.default || Object.values(keys || {})[0] || '');
  } catch {
    return '';
  }
}

function premiumIsActive(profile: Record<string, unknown> | null) {
  if (profile?.access_status !== 'premium') return false;
  if (!profile.access_expires_at) return true;
  const expiry = new Date(String(profile.access_expires_at)).getTime();
  return Number.isFinite(expiry) && expiry > Date.now();
}

async function loadCallerAccess(userId: string, authorization: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const publishableKey = getPublishableKey();
  if (!supabaseUrl || !publishableKey) return null;
  const response = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=access_status,access_expires_at&id=eq.${encodeURIComponent(userId)}&limit=1`,
    { headers: { Authorization: authorization, apikey: publishableKey } }
  );
  if (!response.ok) return null;
  return (await response.json())?.[0] || null;
}

function withinRateLimit(userId: string) {
  const now = Date.now();
  const current = requestWindows.get(userId);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    requestWindows.set(userId, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= RATE_LIMIT) return false;
  current.count += 1;
  return true;
}

async function buildSafetyIdentifier(userId: string, salt: string) {
  const input = new TextEncoder().encode(`${salt}:${userId}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return `tutor_${hash.slice(0, 64)}`;
}

async function moderateTutorText(apiKey: string, text: string, signal: AbortSignal) {
  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
    signal
  });
  if (!response.ok) return { available: false, flagged: false };
  const result = await response.json();
  return {
    available: true,
    flagged: Boolean(Array.isArray(result?.results) && result.results.some((item: Record<string, unknown>) => item?.flagged === true))
  };
}

Deno.serve(async request => {
  const requestOrigin = request.headers.get('Origin') || '';
  const allowedOrigin = getAllowedOrigins().has(requestOrigin) ? requestOrigin : '';
  if (requestOrigin && !allowedOrigin) return jsonResponse({ ok: false, code: 'origin_not_allowed' }, 403, '');
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(allowedOrigin) });
  if (request.method !== 'POST') return jsonResponse({ ok: false, code: 'method_not_allowed' }, 405, allowedOrigin);

  const authorization = request.headers.get('Authorization') || '';
  const userId = decodeJwtSubject(authorization);
  if (!userId) return jsonResponse({ ok: false, code: 'not_authenticated' }, 401, allowedOrigin);
  if (!withinRateLimit(userId)) return jsonResponse({ ok: false, code: 'rate_limited' }, 429, allowedOrigin);

  const callerAccess = await loadCallerAccess(userId, authorization);
  if (!premiumIsActive(callerAccess)) return jsonResponse({ ok: false, code: 'premium_required' }, 403, allowedOrigin);

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return jsonResponse({ ok: false, code: 'invalid_json' }, 400, allowedOrigin);
  }

  const rawRecord = rawPayload as Record<string, unknown>;
  const rawMessage = String(rawRecord?.message || '');
  const rawHistory = Array.isArray(rawRecord?.history)
    ? rawRecord.history.map(item => String((item as Record<string, unknown>)?.text || '')).join(' ')
    : '';
  const safetyRisk = detectTutorSafetyRisk(`${rawMessage} ${rawHistory}`);
  if (safetyRisk) {
    return jsonResponse({
      ok: true,
      response: {
        ...buildTutorSafetyResponse(safetyRisk),
        intent: 'child_safety',
        confidence: 100,
        canAnswerSafely: true,
        source: 'child-safety'
      }
    }, 200, allowedOrigin);
  }

  const payload = sanitizeTutorGatewayPayload(rawPayload as Record<string, unknown>);
  if (!payload) return jsonResponse({ ok: false, code: 'personal_data_or_invalid_payload' }, 422, allowedOrigin);

  const generativeEnabled = Deno.env.get('TUTOR_AI_GENERATIVE_ENABLED') === 'true';
  const complianceConfirmed = Deno.env.get('TUTOR_AI_U18_COMPLIANCE_CONFIRMED') === 'true';
  const apiKey = Deno.env.get('OPENAI_API_KEY') || '';
  const model = Deno.env.get('OPENAI_TUTOR_MODEL') || '';
  const safetySalt = Deno.env.get('TUTOR_AI_SAFETY_SALT') || '';
  if (!generativeEnabled || !complianceConfirmed || !apiKey || !model || !safetySalt) {
    return jsonResponse({ ok: false, code: 'generative_not_configured' }, 503, allowedOrigin);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9_000);
  try {
    const moderationInput = [
      payload.message,
      ...payload.history.filter(item => item.role === 'user').map(item => item.text)
    ].join('\n');
    const inputModeration = await moderateTutorText(apiKey, moderationInput, controller.signal);
    if (!inputModeration.available) return jsonResponse({ ok: false, code: 'moderation_unavailable' }, 502, allowedOrigin);
    if (inputModeration.flagged) {
      return jsonResponse({
        ok: true,
        response: {
          ...buildTutorSafetyResponse(''),
          intent: 'child_safety',
          confidence: 100,
          canAnswerSafely: true,
          source: 'child-safety'
        }
      }, 200, allowedOrigin);
    }

    const safetyIdentifier = await buildSafetyIdentifier(userId, safetySalt);
    const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildOpenAITutorRequest(payload, model, safetyIdentifier)),
      signal: controller.signal
    });
    if (!openAIResponse.ok) return jsonResponse({ ok: false, code: 'model_unavailable' }, 502, allowedOrigin);
    const modelPayload = await openAIResponse.json();
    const outputText = extractOpenAIOutputText(modelPayload);
    if (!outputText) return jsonResponse({ ok: false, code: 'model_refused_or_empty' }, 422, allowedOrigin);

    let parsedOutput: unknown;
    try {
      parsedOutput = JSON.parse(outputText);
    } catch {
      return jsonResponse({ ok: false, code: 'invalid_model_output' }, 502, allowedOrigin);
    }
    const safeOutput = sanitizeTutorModelOutput(parsedOutput as Record<string, unknown>);
    if (!safeOutput?.canAnswerSafely) return jsonResponse({ ok: false, code: 'model_cannot_answer_safely' }, 422, allowedOrigin);
    const outputModeration = await moderateTutorText(apiKey, safeOutput.text, controller.signal);
    if (!outputModeration.available) return jsonResponse({ ok: false, code: 'moderation_unavailable' }, 502, allowedOrigin);
    if (outputModeration.flagged) return jsonResponse({ ok: false, code: 'model_output_blocked' }, 422, allowedOrigin);
    return jsonResponse({ ok: true, response: { ...safeOutput, source: 'openai-responses' } }, 200, allowedOrigin);
  } catch (error) {
    return jsonResponse({ ok: false, code: error instanceof DOMException && error.name === 'AbortError' ? 'model_timeout' : 'model_error' }, 502, allowedOrigin);
  } finally {
    clearTimeout(timeoutId);
  }
});
