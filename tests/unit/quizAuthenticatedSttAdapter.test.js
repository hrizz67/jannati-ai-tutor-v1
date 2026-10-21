import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  createAuthenticatedQuizSttAdapter,
  getQuizSttPilotEndpoint
} from '../../src/ai/speech/quizAuthenticatedSttAdapter.js';

const ENDPOINT = 'https://quiz-pilot.example.workers.dev/v1/quiz/transcribe';
const BLOB = new Blob(['abc'], { type: 'audio/mp4' });
const TOKEN = 'test-access-token';
function context() {
  return { activity: 'quiz', contextKey: 'quiz:bm:0', captureDurationMs: 8000, durationMs: 1200, stopReason: 'manual-stop' };
}
const client = () => Promise.resolve({
  auth: { getSession: async () => ({ data: { session: { access_token: TOKEN } } }) }
});
function adapter(fetchImpl, getClient = client, endpoint = ENDPOINT) {
  return createAuthenticatedQuizSttAdapter({ endpoint, fetchImpl, getClient });
}
function result(data = { transcript: 'kucing', confidence: 91, provider: 'cloudflare-workers-ai' }, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
function transcribe(speechAdapter) {
  return speechAdapter.transcribe({ blob: BLOB, mimeType: 'audio/mp4', language: 'ms-MY', context: context() });
}

describe('P1.17-V06 authenticated opt-in Quiz STT adapter', () => {
  it('only accepts dedicated quiz endpoint (never the reading/speaking worker)', () => {
    expect(getQuizSttPilotEndpoint(ENDPOINT)).toBe(ENDPOINT);
    expect(getQuizSttPilotEndpoint('https://quiz-pilot.example.workers.dev/v1/transcribe')).toBe('');
    expect(getQuizSttPilotEndpoint('http://evil.example/v1/quiz/transcribe')).toBe('');
    expect(getQuizSttPilotEndpoint('https://quiz-pilot.example.workers.dev/v1/quiz/transcribe?token=abc')).toBe('');
  });

  it('attaches Supabase bearer only to quiz endpoint when an authenticated session exists', async () => {
    const fetchImpl = vi.fn(async () => result());
    const value = await transcribe(adapter(fetchImpl));
    expect(value.transcript).toBe('kucing');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(ENDPOINT, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer ' + TOKEN,
        'Content-Type': 'audio/mp4',
        'X-STT-Language': 'ms-MY'
      }),
      credentials: 'omit', referrerPolicy: 'no-referrer'
    }));
  });

  it('cannot send audio or leak tokens when session is missing', async () => {
    const fetchImpl = vi.fn(async () => result());
    const getClient = async () => ({ auth: { getSession: async () => ({ data: { session: null } }) } });
    await expect(transcribe(adapter(fetchImpl, getClient))).rejects.toMatchObject({ code: 'stt-unavailable' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fails closed before fetching if pilot endpoint is missing or is shared legacy endpoint', async () => {
    const fetchImpl = vi.fn(async () => result());
    await expect(transcribe(adapter(fetchImpl, client, 'https://quiz-pilot.example.workers.dev/v1/transcribe')))
      .rejects.toMatchObject({ code: 'stt-unavailable' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([[401, 'stt-unavailable'], [403, 'stt-unavailable'], [429, 'stt-rate-limited'], [504, 'stt-timeout'], [422, 'no-speech']])(
    'maps Worker %s to the safe UI error %s',
    async (status, error) => {
      await expect(transcribe(adapter(async () => result({ error: 'sample' }, status))))
        .rejects.toMatchObject({ code: error });
    }
  );

  it('scopes the dedicated production endpoint to tagged build steps and preserves authenticated adapter loading', () => {
    const workflow = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');
    const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const source = readFileSync(new URL('../../src/ai/speech/quizMobileSttPilot.js', import.meta.url), 'utf8');
    const quiz = app.split('function Quiz({')[1].split('function UasaSimulator(')[0];
    expect(workflow).not.toContain('VITE_QUIZ_MOBILE_STT_PILOT_ENABLED');
    expect(workflow).toContain("VITE_QUIZ_MOBILE_STT_AUTO_ENABLED: 'true'");
    expect(workflow.match(/VITE_QUIZ_STT_ENDPOINT:/g)).toHaveLength(2);
    expect(quiz).toContain("import('./ai/speech/quizAuthenticatedSttAdapter.js')");
    expect(quiz).toContain('quizMobileSttPilot.enabled && hasAccountSession');
    expect(quiz).toContain("quizMobileSttPilot.requested && ['starting', 'recording', 'stopping', 'processing'].includes(speechState)");
    expect(source).toContain('VITE_QUIZ_STT_ENDPOINT');
    expect(source).toContain('VITE_QUIZ_MOBILE_STT_AUTO_ENABLED');
    expect(source).toContain("'/v1/quiz/transcribe'");
  });
});
