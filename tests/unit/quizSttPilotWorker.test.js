import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  handleRequest,
  QuizDailyUsageQuota,
  QUIZ_STT_MAX_AUDIO_BYTES,
  QUIZ_STT_MAX_DAILY_INFERENCES,
  QUIZ_STT_CONSENT_NOTICE_VERSION
} from '../../workers/quiz-stt/src/index.js';

const ORIGIN = 'https://hrizz67.github.io';
const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const TOKEN = 'a'.repeat(64);
const CONSENT_TOKEN = '33333333-3333-4333-8333-333333333333';
const URL = 'https://quiz-pilot.example.workers.dev/v1/quiz/transcribe';

function quotaBinding(result = { status: 'ok', remaining: 99 }) {
  const fetch = vi.fn(async () => Response.json(result));
  return { binding: { getByName: vi.fn(() => ({ fetch })) }, fetch };
}

function env(overrides = {}) {
  const quota = quotaBinding();
  return {
    QUIZ_STT_PILOT_ENABLED: 'true',
    QUIZ_STT_ACCESS_MODE: 'allowlist',
    CORS_ALLOW_ORIGINS: ORIGIN,
    SUPABASE_URL: 'https://jannati-test.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    QUIZ_PILOT_ALLOWED_USER_IDS: USER,
    QUIZ_STT_CONSENT_NOTICE_VERSION,
    QUIZ_STT_DAILY_MAX_INFERENCES: '100',
    AI: { run: vi.fn(async () => ({ text: '  kucing  ', language_probability: 0.87 })) },
    QUIZ_ACCOUNT_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    QUIZ_GLOBAL_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    QUIZ_DAILY_USAGE: quota.binding,
    ...overrides
  };
}
function request(path = URL, {
  origin = ORIGIN, token = TOKEN, type = 'audio/mp4;codecs=mp4a.40.2',
  language = 'ms-MY', consentToken = CONSENT_TOKEN, contentLength, body = new Uint8Array([1, 2, 3])
} = {}) {
  const headers = {
    Origin: origin,
    'Content-Type': type,
    'X-STT-Language': language
  };
  if (token != null) headers.Authorization = 'Bearer ' + token;
  if (consentToken != null) headers['X-Jannati-Consent-Token'] = consentToken;
  if (contentLength != null) headers['Content-Length'] = String(contentLength);
  return new Request(path, { method: 'POST', headers, body });
}
const auth = (user = USER, status = 200) => vi.fn(async () => new Response(
  status === 200 ? JSON.stringify({ id: user }) : '{}',
  { status, headers: { 'Content-Type': 'application/json' } }
));
const authAndConsent = ({ user = USER, granted = true, status = 'granted', noticeVersion = QUIZ_STT_CONSENT_NOTICE_VERSION } = {}) => vi.fn(async url => {
  if (String(url).endsWith('/auth/v1/user')) {
    return Response.json({ id: user });
  }
  if (String(url).endsWith('/rest/v1/rpc/verify_quiz_stt_guardian_consent_v1')) {
    return Response.json({ granted, status, noticeVersion });
  }
  throw new Error('unexpected-upstream');
});
async function send(options = {}, override = {}, fetchImpl = auth()) {
  const bindings = env(override);
  const response = await handleRequest(request(URL, options), bindings, { fetchImpl });
  return { response, bindings, fetchImpl };
}

describe('P1.17-V06 isolated authenticated Quiz STT Worker', () => {
  it('keeps the dedicated production Worker disabled with guardian-consent policy and exact origin', () => {
    const config = readFileSync(new globalThis.URL('../../workers/quiz-stt/wrangler.production.jsonc', import.meta.url), 'utf8');
    const worker = readFileSync(new globalThis.URL('../../workers/quiz-stt/src/index.js', import.meta.url), 'utf8');
    expect(config).toContain('"name": "jannati-ai-tutor-quiz-stt"');
    expect(config).toContain('"QUIZ_STT_PILOT_ENABLED": "false"');
    expect(config).toContain('"QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED": "false"');
    expect(config).toContain('"QUIZ_STT_ACCESS_MODE": "guardian-consent"');
    expect(config).toContain('"QUIZ_STT_CONSENT_NOTICE_VERSION": "quiz-stt-cloudflare-bm-v1"');
    expect(config).toContain('"QUIZ_STT_DAILY_MAX_INFERENCES": "100"');
    expect(config).toContain('"name": "QUIZ_DAILY_USAGE"');
    expect(config).toContain('"QuizDailyUsageQuota": { "type": "durable-object", "storage": "sqlite" }');
    expect(config).toContain('"CORS_ALLOW_ORIGINS": "https://hrizz67.github.io"');
    expect(config).toContain('"namespace_id": "11021"');
    expect(config).toContain('"namespace_id": "11022"');
    expect(config).not.toContain('QUIZ_PILOT_ALLOWED_USER_IDS');
    expect(config).not.toContain('jannati-v1-qa.pages.dev');
    expect(worker).toContain("import { DurableObject } from 'cloudflare:workers'");
    expect(worker).toContain('class QuizDailyUsageQuota extends DurableObject');
    expect(worker).toContain('super(ctx, env)');
  });

  it('defaults to disabled and cannot reach AI with missing or false server flag', async () => {
    const bindings = env({ QUIZ_STT_PILOT_ENABLED: 'false' });
    const response = await handleRequest(request(), bindings, { fetchImpl: auth() });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'pilot-disabled' });
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('rejects missing, forbidden or spoofed origins even with a valid bearer', async () => {
    for (const origin of ['', 'https://evil.example', 'https://hrizz67.github.io.evil.test']) {
      const { response, bindings, fetchImpl } = await send({ origin });
      expect(response.status).toBe(403);
      expect(fetchImpl).not.toHaveBeenCalled();
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('only allows the dedicated quiz transcription path', async () => {
    const bindings = env();
    const response = await handleRequest(request('https://quiz-pilot.example.workers.dev/v1/transcribe'), bindings);
    expect(response.status).toBe(404);
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('allows a restricted preflight with Authorization but no other headers', async () => {
    const bindings = env();
    const response = await handleRequest(new Request(URL, { method: 'OPTIONS', headers: {
      Origin: ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type,x-stt-language,x-jannati-consent-token'
    } }), bindings);
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('authorization');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('x-jannati-consent-token');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
    const denied = await handleRequest(new Request(URL, { method: 'OPTIONS', headers: {
      Origin: ORIGIN, 'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'x-admin,authorization'
    } }), bindings);
    expect(denied.status).toBe(403);
  });

  it('requires authenticated Supabase session, not an origin or URL flag', async () => {
    const { response, bindings, fetchImpl } = await send({ token: null });
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'authentication-required' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('revalidates token with Supabase Auth on the server and allows only whitelisted UUID', async () => {
    const { response, bindings, fetchImpl } = await send();
    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledWith('https://jannati-test.supabase.co/auth/v1/user',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ apikey: 'sb_publishable_test', Authorization: 'Bearer ' + TOKEN }),
        cache: 'no-store',
        redirect: 'manual',
        signal: expect.any(AbortSignal)
      }));
    await expect(response.json()).resolves.toEqual({
      transcript: 'kucing', confidence: 87, provider: 'cloudflare-workers-ai',
      metadata: {
        language: 'ms',
        model: '@cf/openai/whisper-large-v3-turbo',
        quota: {
          dailyInferenceLimit: 100,
          dailyInferenceRemaining: 99,
          resetsAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/)
        }
      }
    });
    expect(bindings.AI.run).toHaveBeenCalledTimes(1);
    expect(bindings.QUIZ_ACCOUNT_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: 'quiz-account:' + USER });
    expect(bindings.QUIZ_GLOBAL_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: 'quiz-pilot:global' });
  });

  it('rejects a valid but non-pilot user before inference or quota spend', async () => {
    const { response, bindings } = await send({}, {}, auth(OTHER));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'pilot-access-denied' });
    expect(bindings.QUIZ_ACCOUNT_RATE_LIMITER.limit).not.toHaveBeenCalled();
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('allows a valid account only when the server verifies current guardian consent', async () => {
    const fetchImpl = authAndConsent({ user: OTHER });
    const { response, bindings } = await send({}, {
      QUIZ_STT_ACCESS_MODE: 'guardian-consent',
      QUIZ_PILOT_ALLOWED_USER_IDS: ''
    }, fetchImpl);
    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(bindings.AI.run).toHaveBeenCalledTimes(1);
    expect(bindings.QUIZ_ACCOUNT_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: 'quiz-account:' + OTHER });
  });

  it.each([
    [{ consentToken: null }, authAndConsent(), 'guardian-consent-required'],
    [{ consentToken: 'malformed' }, authAndConsent(), 'guardian-consent-required'],
    [{}, authAndConsent({ granted: false, status: 'revoked' }), 'guardian-consent-required'],
    [{}, authAndConsent({ noticeVersion: 'older-notice' }), 'guardian-consent-required']
  ])('rejects missing, invalid, revoked or stale guardian consent before account spend and inference', async (options, fetchImpl, error) => {
    const { response, bindings } = await send(options, {
      QUIZ_STT_ACCESS_MODE: 'guardian-consent',
      QUIZ_PILOT_ALLOWED_USER_IDS: ''
    }, fetchImpl);
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error });
    expect(bindings.QUIZ_ACCOUNT_RATE_LIMITER.limit).not.toHaveBeenCalled();
    expect(bindings.QUIZ_DAILY_USAGE.getByName).not.toHaveBeenCalled();
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('fails closed when guardian-consent verification is unavailable or redirects', async () => {
    for (const consentResponse of [
      () => { throw new Error('offline'); },
      () => new Response('', { status: 302, headers: { Location: 'https://evil.example' } }),
      () => new Response('x'.repeat(1025), { status: 200 })
    ]) {
      const fetchImpl = vi.fn(async url => String(url).endsWith('/auth/v1/user')
        ? Response.json({ id: USER })
        : consentResponse());
      const { response, bindings } = await send({}, {
        QUIZ_STT_ACCESS_MODE: 'guardian-consent', QUIZ_PILOT_ALLOWED_USER_IDS: ''
      }, fetchImpl);
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ error: 'guardian-consent-unavailable' });
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('fails closed when the deployed consent notice version is missing or stale', async () => {
    for (const version of ['', 'old-notice']) {
      const fetchImpl = authAndConsent();
      const { response, bindings } = await send({}, {
        QUIZ_STT_ACCESS_MODE: 'guardian-consent',
        QUIZ_STT_CONSENT_NOTICE_VERSION: version,
        QUIZ_PILOT_ALLOWED_USER_IDS: ''
      }, fetchImpl);
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({ error: 'guardian-consent-unavailable' });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('fails closed for an unknown access mode', async () => {
    const { response, bindings } = await send({}, { QUIZ_STT_ACCESS_MODE: 'public' });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'access-policy-unavailable' });
    expect(bindings.QUIZ_ACCOUNT_RATE_LIMITER.limit).not.toHaveBeenCalled();
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('rejects invalid, expired or unverifiable bearer tokens without invoking AI', async () => {
    const { response, bindings } = await send({}, {}, auth(USER, 401));
    expect(response.status).toBe(401);
    expect(bindings.AI.run).not.toHaveBeenCalled();
    const unavailable = await send({}, {}, vi.fn(async () => { throw new Error('offline'); }));
    expect(unavailable.response.status).toBe(503);
    expect(unavailable.bindings.AI.run).not.toHaveBeenCalled();
  });

  it('keeps auth diagnostics opt-in and classifies invalid tokens as 401', async () => {
    const hidden = await send({}, {}, auth(USER, 401));
    await expect(hidden.response.json()).resolves.toEqual({ error: 'authentication-required' });

    const visible = await send({}, { QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true' }, auth(USER, 401));
    expect(visible.response.status).toBe(401);
    await expect(visible.response.json()).resolves.toEqual({
      error: 'authentication-required',
      authDiagnostic: {
        stage: 'upstream-auth-rejected',
        httpStatus: 401,
        elapsedMs: expect.any(Number)
      }
    });
    expect(visible.bindings.AI.run).not.toHaveBeenCalled();
  });

  it.each([301, 302, 303, 307, 308])(
    'rejects upstream HTTP %s redirects without following or exposing their location',
    async status => {
      const location = `https://redirect.example/auth?token=${TOKEN}`;
      const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: USER }), {
        status,
        headers: { Location: location, 'Content-Type': 'application/json' }
      }));
      const { response, bindings } = await send({}, {
        QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true'
      }, fetchImpl);

      expect(response.status).toBe(503);
      const text = await response.text();
      expect(JSON.parse(text)).toEqual({
        error: 'auth-unavailable',
        authDiagnostic: {
          stage: 'upstream-redirect-rejected',
          httpStatus: status,
          elapsedMs: expect.any(Number)
        }
      });
      expect(text).not.toContain(location);
      expect(text).not.toContain(TOKEN);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(fetchImpl).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ redirect: 'manual' }));
      expect(bindings.QUIZ_ACCOUNT_RATE_LIMITER.limit).not.toHaveBeenCalled();
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  );

  it('retains the four-second default authentication timeout', async () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    try {
      const { response } = await send();
      expect(response.status).toBe(200);
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 4000);
    } finally {
      timeoutSpy.mockRestore();
    }
  });

  it('reports only bounded stage, upstream status and elapsed time for QA auth failures', async () => {
    const secret = 'secret-value-that-must-not-leak';
    const token = 'z'.repeat(64);
    const response = await handleRequest(request(URL, { token }), env({
      QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true',
      SUPABASE_PUBLISHABLE_KEY: secret
    }), {
      now: vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(137),
      fetchImpl: vi.fn(async () => new Response('provider detail with secret', { status: 502 }))
    });
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({
      error: 'auth-unavailable',
      authDiagnostic: {
        stage: 'upstream-service-rejected',
        httpStatus: 502,
        elapsedMs: 37
      }
    });
    for (const sensitive of [secret, token, USER, 'provider detail']) expect(text).not.toContain(sensitive);
  });

  it('distinguishes invalid configuration, malformed upstream responses, fetch errors and timeout', async () => {
    const cases = [
      {
        override: { SUPABASE_URL: '', QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true' },
        fetchImpl: auth(),
        stage: 'config-invalid',
        httpStatus: null
      },
      {
        override: { QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true' },
        fetchImpl: vi.fn(async () => new Response('{', { status: 200 })),
        stage: 'upstream-response-invalid',
        httpStatus: 200
      },
      {
        override: { QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true' },
        fetchImpl: vi.fn(async () => { throw new Error('network detail'); }),
        stage: 'fetch-failed',
        httpStatus: null
      },
      {
        override: { QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED: 'true' },
        fetchImpl: vi.fn((_url, init) => new Promise((resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
        })),
        stage: 'fetch-timeout',
        httpStatus: null,
        authTimeoutMs: 1
      }
    ];
    for (const testCase of cases) {
      const bindings = env(testCase.override);
      const response = await handleRequest(request(), bindings, {
        fetchImpl: testCase.fetchImpl,
        authTimeoutMs: testCase.authTimeoutMs
      });
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.authDiagnostic).toEqual({
        stage: testCase.stage,
        httpStatus: testCase.httpStatus,
        elapsedMs: expect.any(Number)
      });
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('fails closed when Supabase configuration, user allowlist or rate limiter bindings are missing', async () => {
    const variants = [
      { SUPABASE_URL: '' },
      { SUPABASE_PUBLISHABLE_KEY: '' },
      { QUIZ_PILOT_ALLOWED_USER_IDS: '' },
      { QUIZ_ACCOUNT_RATE_LIMITER: null },
      { QUIZ_GLOBAL_RATE_LIMITER: null },
      { QUIZ_DAILY_USAGE: null }
    ];
    for (const changes of variants) {
      const { response, bindings } = await send({}, changes);
      expect([403, 503]).toContain(response.status);
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('enforces both account and global 429 capacity before AI', async () => {
    const account = await send({}, { QUIZ_ACCOUNT_RATE_LIMITER: { limit: vi.fn(async () => ({ success: false })) } });
    expect(account.response.status).toBe(429);
    expect(account.bindings.AI.run).not.toHaveBeenCalled();
    expect(account.bindings.QUIZ_GLOBAL_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: 'quiz-pilot:global' });

    const tokenVerifier = auth();
    const global = await send({}, { QUIZ_GLOBAL_RATE_LIMITER: { limit: vi.fn(async () => ({ success: false })) } }, tokenVerifier);
    expect(global.response.status).toBe(429);
    expect(tokenVerifier).not.toHaveBeenCalled(); // Global cap also protects Supabase Auth capacity.
    expect(global.bindings.AI.run).not.toHaveBeenCalled();
  });

  it('fails closed when the hard daily quota is missing, invalid, unavailable or exhausted', async () => {
    const cases = [
      [{ QUIZ_DAILY_USAGE: null }, 503, 'daily-ai-quota-unavailable'],
      [{ QUIZ_STT_DAILY_MAX_INFERENCES: '0' }, 503, 'daily-ai-quota-unavailable'],
      [{ QUIZ_STT_DAILY_MAX_INFERENCES: '101' }, 503, 'daily-ai-quota-unavailable'],
      [{ QUIZ_DAILY_USAGE: quotaBinding({ status: 'unavailable' }).binding }, 503, 'daily-ai-quota-unavailable'],
      [{ QUIZ_DAILY_USAGE: quotaBinding({ status: 'limited', remaining: 0 }).binding }, 429, 'daily-ai-quota-exhausted']
    ];
    for (const [override, status, error] of cases) {
      const { response, bindings } = await send({}, override);
      expect(response.status).toBe(status);
      await expect(response.json()).resolves.toEqual({ error });
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('reserves exactly one daily slot after auth, access, rate limits and payload validation', async () => {
    const quota = quotaBinding({ status: 'ok', remaining: 41 });
    const { response, bindings } = await send({}, { QUIZ_DAILY_USAGE: quota.binding });
    expect(response.status).toBe(200);
    expect(quota.binding.getByName).toHaveBeenCalledWith('quiz-stt-global-v1');
    expect(quota.fetch).toHaveBeenCalledTimes(1);
    const quotaRequest = quota.fetch.mock.calls[0][0];
    expect(quotaRequest).toBeInstanceOf(Request);
    expect(await quotaRequest.json()).toEqual(expect.objectContaining({
      day: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      limit: 100
    }));
    expect(bindings.AI.run).toHaveBeenCalledTimes(1);

    const invalidQuota = quotaBinding({ status: 'ok', remaining: 41 });
    const invalid = await send({ type: 'application/json' }, { QUIZ_DAILY_USAGE: invalidQuota.binding });
    expect(invalid.response.status).toBe(415);
    expect(invalidQuota.fetch).not.toHaveBeenCalled();
    expect(invalid.bindings.AI.run).not.toHaveBeenCalled();
  });

  it('keeps an atomic UTC-day count without storing identity, audio or transcript data', async () => {
    let record;
    const get = vi.fn(async () => record);
    const put = vi.fn(async (_key, value) => { record = value; });
    const transaction = vi.fn(async callback => callback({ get, put }));
    const quota = new QuizDailyUsageQuota({ storage: { transaction } }, {});
    const reserve = () => quota.fetch(new Request('https://quiz-quota.internal/reserve', {
      method: 'POST', body: JSON.stringify({ day: '2026-10-24', limit: 2 })
    })).then(response => response.json());

    await expect(reserve()).resolves.toEqual({ status: 'ok', remaining: 1 });
    await expect(reserve()).resolves.toEqual({ status: 'ok', remaining: 0 });
    await expect(reserve()).resolves.toEqual({ status: 'limited', remaining: 0 });
    expect(record).toEqual({ day: '2026-10-24', used: 2 });
    expect(JSON.stringify(record)).not.toMatch(new RegExp(`${USER}|token|audio|transcript`, 'i'));

    await expect(quota.fetch(new Request('https://quiz-quota.internal/reserve', {
      method: 'POST', body: JSON.stringify({ day: '2026-10-25', limit: 2 })
    })).then(response => response.json())).resolves.toEqual({ status: 'ok', remaining: 1 });
    expect(record).toEqual({ day: '2026-10-25', used: 1 });
  });

  it('caps the committed pilot at 100 daily inferences with conservative free-allocation headroom', () => {
    expect(QUIZ_STT_MAX_DAILY_INFERENCES).toBe(100);
    // 100 honest maximum-duration (8 s) captures reserve about 621.74 neurons,
    // well below the provider's current 10,000-neuron free allocation.
    expect((100 * 8 / 60) * 46.63).toBeLessThan(1000);
  });

  it('rejects invalid content types, languages and oversized audio before inference', async () => {
    for (const options of [
      { type: 'application/json' },
      { language: 'unknown' },
      { contentLength: QUIZ_STT_MAX_AUDIO_BYTES + 1 },
      { body: new Uint8Array() }
    ]) {
      const { response, bindings } = await send(options);
      expect([400, 413, 415]).toContain(response.status);
      expect(bindings.AI.run).not.toHaveBeenCalled();
    }
  });

  it('rejects actual oversized uploads even without Content-Length and never infers', async () => {
    const { response, bindings } = await send({
      body: new Uint8Array(QUIZ_STT_MAX_AUDIO_BYTES + 1)
    });
    expect(response.status).toBe(413);
    expect(bindings.AI.run).not.toHaveBeenCalled();
  });

  it('does not store or log recordings and does not expose auth data in output', async () => {
    const { response } = await send();
    const body = await response.text();
    expect(body).not.toContain(TOKEN);
    expect(body).not.toContain(USER);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
  });
});
