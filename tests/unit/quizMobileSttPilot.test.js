import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  QUIZ_MOBILE_STT_CAPTURE_DURATION_MS,
  QUIZ_MOBILE_STT_BUILD_ENABLED,
  resolveQuizMobileSttPilot
} from '../../src/ai/speech/quizMobileSttPilot.js';
import { createMobileMediaSttSession } from '../../src/ai/mobileMediaSttSession.js';

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';
const ENDPOINT = 'https://example.workers.dev/v1/quiz/transcribe';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function pilot(search, userAgent = IOS, overrides = {}) {
  return resolveQuizMobileSttPilot({
    search,
    userAgent,
    endpoint: ENDPOINT,
    mediaCaptureSupported: true,
    buildEnabled: true,
    ...overrides
  });
}

function environment(userAgent) {
  const listeners = new Map();
  const browserWindow = {
    MediaRecorder: class {},
    Blob,
    location: { search: '?quizMobileSttPilot=1' },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    }
  };
  const browserNavigator = { userAgent, mediaDevices: { getUserMedia: vi.fn() } };
  vi.stubGlobal('window', browserWindow);
  vi.stubGlobal('navigator', browserNavigator);
  return { browserWindow, browserNavigator, listeners };
}

function mockCapture() {
  const stop = vi.fn(() => true);
  const cancel = vi.fn(() => true);
  const capture = vi.fn(async ({ durationMs }) => ({
    blob: new Blob(['audio'], { type: 'audio/mp4' }),
    mimeType: 'audio/mp4',
    durationMs: Math.min(durationMs, 2000),
    captureDurationMs: durationMs,
    stopReason: 'manual-stop'
  }));
  return { factory: () => ({ capture, stop, cancel }), capture, stop, cancel };
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

describe('P1.17-V01 opt-in quiz media-STT', () => {
  it('keeps tagged production automatic media-STT disabled while preserving the ordinary mobile Quiz path', () => {
    const deployWorkflow = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');
    expect(QUIZ_MOBILE_STT_BUILD_ENABLED).toBe(false);
    expect(deployWorkflow.match(/VITE_QUIZ_MOBILE_STT_AUTO_ENABLED: 'false'/g)).toHaveLength(2);
    expect(deployWorkflow).not.toContain("VITE_QUIZ_MOBILE_STT_AUTO_ENABLED: 'true'");
    expect(deployWorkflow).toContain('VITE_QUIZ_STT_ENDPOINT: https://jannati-ai-tutor-quiz-stt.');
    expect(pilot('', IOS, { buildEnabled: false, autoEnabled: false })).toMatchObject({
      requested: false,
      enabled: false,
      activationReason: 'inactive'
    });
    expect(pilot('', ANDROID, { buildEnabled: false, autoEnabled: false })).toMatchObject({
      requested: false,
      enabled: false,
      activationReason: 'inactive'
    });
    expect(resolveQuizMobileSttPilot({
      search: '?quizMobileSttPilot=1',
      userAgent: IOS,
      endpoint: ENDPOINT,
      mediaCaptureSupported: true
    })).toMatchObject({
      requested: true,
      buildEnabled: false,
      enabled: false
    });
    expect(pilot('?quizMobileSttPilot=1', IOS, { buildEnabled: false }).enabled).toBe(false);
    expect(pilot('?quizMobileSttPilot=1', ANDROID, { buildEnabled: false }).enabled).toBe(false);
  });

  it('keeps the production Worker kill switch committed OFF', () => {
    const productionWorker = readFileSync(new URL('../../workers/quiz-stt/wrangler.production.jsonc', import.meta.url), 'utf8');
    expect(productionWorker).toContain('"QUIZ_STT_PILOT_ENABLED": "false"');
    expect(productionWorker).toContain('"QUIZ_STT_AUTH_DIAGNOSTICS_ENABLED": "false"');
  });

  it.each([['iPhone Safari', IOS], ['Android Chrome', ANDROID]])(
    '%s uses existing mobile STT only with a build permit and explicit opt-in',
    (_label, userAgent) => {
      expect(pilot('', userAgent).enabled).toBe(false);
      expect(pilot('?quizMobileSttPilot=0', userAgent).enabled).toBe(false);
      expect(pilot('?quizMobileSttPilot=1', userAgent).enabled).toBe(true);
      expect(pilot('?quizMobileSttPilot=1', userAgent, { endpoint: '' }).enabled).toBe(false);
      expect(pilot('?quizMobileSttPilot=1', userAgent, { mediaCaptureSupported: false }).enabled).toBe(false);
    }
  );

  it.each([['iPhone Safari', IOS], ['Android Chrome', ANDROID]])(
    '%s activates production mobile STT without a query only under the release auto permit',
    (_label, userAgent) => {
      expect(pilot('', userAgent, { buildEnabled: false, autoEnabled: true })).toMatchObject({
        requested: true,
        explicitRequested: false,
        autoEnabled: true,
        activationReason: 'production-mobile-auto',
        enabled: true
      });
      expect(pilot('', userAgent, { buildEnabled: false, autoEnabled: true, endpoint: '' }).enabled).toBe(false);
      expect(pilot('?quizMobileSttPilot=1', userAgent, { buildEnabled: false, autoEnabled: true }).enabled).toBe(true);
      expect(pilot('', userAgent, { buildEnabled: false, autoEnabled: true, mediaCaptureSupported: false }))
        .toMatchObject({ requested: false, enabled: false });
    }
  );

  it('never activates a quiz pilot against the shared reading/speaking Worker endpoint', () => {
    expect(pilot('?quizMobileSttPilot=1', IOS, {
      endpoint: 'https://example.workers.dev/v1/transcribe'
    }).enabled).toBe(false);
    expect(pilot('?quizMobileSttPilot=1', ANDROID, {
      endpoint: 'https://example.workers.dev/v1/transcribe'
    }).enabled).toBe(false);
  });

  it('does not activate on desktop or when an explicit iOS manual bypass is requested', () => {
    expect(pilot('?quizMobileSttPilot=1', DESKTOP)).toMatchObject({
      enabled: false,
      platformFamily: 'desktop'
    });
    expect(pilot('?quizMobileSttPilot=1&iosSpeechBypass=1', IOS).enabled).toBe(false);
    expect(pilot('?quizMobileSttPilot=1&speechDiag=1&speechMode=legacy-simple', IOS).enabled).toBe(false);
    expect(pilot('', DESKTOP, { autoEnabled: true })).toMatchObject({ requested: false, enabled: false });
  });

  it.each([['iPhone Safari', IOS, 'ios'], ['Android Chrome', ANDROID, 'android']])(
    '%s Q1 transcript completes; Q2 remains idle until a fresh explicit start',
    async (_label, userAgent, platformFamily) => {
      const { browserWindow, browserNavigator, listeners } = environment(userAgent);
      const capture = mockCapture();
      const transcribe = vi.fn(async () => ({ transcript: 'jawapan pertama', confidence: 93, provider: 'test' }));
      const received = [];
      const makeSession = (question, onTranscript = text => received.push(text)) => createMobileMediaSttSession({
        activity: 'quiz',
        language: 'ms-MY',
        platformFamily,
        contextKey: 'quiz:' + question,
        getCurrentContextKey: () => 'quiz:' + question,
        captureDurationMs: QUIZ_MOBILE_STT_CAPTURE_DURATION_MS,
        captureFactory: capture.factory,
        adapterFactory: () => ({ transcribe }),
        getWindow: () => browserWindow,
        getNavigator: () => browserNavigator,
        onTranscript
      });
      const q1 = makeSession('Q1');
      expect(q1.getState()).toMatchObject({ status: 'ready', active: false });
      expect(transcribe).not.toHaveBeenCalled();
      expect(await q1.start()).toMatchObject({ started: true, transcriptLength: 15 });
      expect(received).toEqual(['jawapan pertama']);
      expect(capture.capture).toHaveBeenCalledWith(expect.objectContaining({
        durationMs: QUIZ_MOBILE_STT_CAPTURE_DURATION_MS
      }));
      expect(q1.getState()).toMatchObject({ status: 'review', active: false });
      expect(listeners.get('pagehide')?.size || 0).toBe(0);
      const q2 = makeSession('Q2');
      expect(q2.getState()).toMatchObject({ status: 'ready', active: false });
      expect(transcribe).toHaveBeenCalledTimes(1);
      expect(await q2.start()).toMatchObject({ started: true, transcriptLength: 15 });
      expect(transcribe).toHaveBeenCalledTimes(2);
    }
  );

  it.each([['iOS', IOS, 'ios'], ['Android', ANDROID, 'android']])(
    '%s Q1 in-flight provider is cancelled on Q2 navigation; Q1 callback cannot populate Q2',
    async (_label, userAgent, platformFamily) => {
      const { browserWindow, browserNavigator } = environment(userAgent);
      let currentContextKey = 'quiz:Q1';
      const pending = deferred();
      const transcripts = [];
      const capture = mockCapture();
      const q1 = createMobileMediaSttSession({
        activity: 'quiz',
        language: 'ms-MY',
        platformFamily,
        contextKey: 'quiz:Q1',
        getCurrentContextKey: () => currentContextKey,
        captureFactory: capture.factory,
        adapterFactory: () => ({ transcribe: () => pending.promise }),
        getWindow: () => browserWindow,
        getNavigator: () => browserNavigator,
        onTranscript: text => transcripts.push(text)
      });
      const first = q1.start();
      await Promise.resolve();
      await Promise.resolve();
      currentContextKey = 'quiz:Q2';
      expect(q1.cancel('context-changed')).toBe(true);
      pending.resolve({ transcript: 'jawapan lama', confidence: 95 });
      await expect(first).resolves.toMatchObject({ stale: true });
      expect(transcripts).toEqual([]);
      expect(q1.getState()).toMatchObject({ status: 'ready', active: false });
      expect(capture.cancel).toHaveBeenCalledTimes(1);
    }
  );

  it('wires the quiz to the shared factory, records only after a tap, and does not auto-grade a transcript', () => {
    const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const quiz = app.split('function Quiz({')[1].split('function UasaSimulator(')[0];
    expect(quiz).toContain('resolveQuizMobileSttPilot()');
    expect(quiz).toContain('loadMobileMediaSessionFactory()');
    expect(quiz).toContain('captureDurationMs: QUIZ_MOBILE_STT_CAPTURE_DURATION_MS');
    expect(quiz).toContain('getCurrentContextKey: () => activeSpeechContextRef.current');
    expect(quiz).toContain("speechSessionRef.current?.cancel?.('context-changed')");
    expect(quiz).toContain("speechSessionRef.current?.cancel?.('component-unmount')");
    expect(quiz).toContain("speechSessionRef.current?.cancel?.('answer-checked')");
    expect(quiz).toContain('mobileSession.start()');
    expect(quiz).toContain('onAnswerChange(safeTranscript)');
    expect(quiz).not.toContain('onCheckAnswer(safeTranscript)');
    const start = quiz.indexOf('function handleSpeechStart()');
    expect(quiz.indexOf('mobileSession.start()', start)).toBeGreaterThan(start);
    expect(quiz).toContain('Henti rakaman');
    expect(quiz).toContain("speechResult.source !== 'mobile-stt'");
  });
});
