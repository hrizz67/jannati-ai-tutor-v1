import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaSttError } from '../../src/ai/speech/mediaSttCapture.js';
import {
  createDeterministicSttAdapter,
  createRuntimeSttAdapter,
  createSttAdapter,
  getDeterministicSttPreviewTranscript,
  isDeterministicSttPreviewRequested,
  STT_ADAPTER_MAX_BYTES,
  STT_ADAPTER_MAX_DURATION_MS
} from '../../src/ai/speech/sttAdapter.js';

const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';

function audioBlob(size = 5, type = 'audio/mp4;codecs=mp4a.40.2') {
  return new Blob(['a'.repeat(size)], { type });
}

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete globalThis.window;
});

describe('P1.9 provider-neutral STT adapter', () => {
  it('normalizes transcript, confidence, provider and privacy-filtered metadata', async () => {
    const request = vi.fn(async () => ({
      transcript: '  Saya   suka membaca  ',
      confidence: 0.875,
      provider: 'future-provider',
      metadata: {
        requestId: 'safe-123',
        transcriptCopy: 'SECRET transcript',
        audioPayload: 'SECRET audio',
        stable: true
      }
    }));
    const adapter = createSttAdapter({ provider: 'configured-provider', request });
    const blob = audioBlob();
    const result = await adapter.transcribe({
      blob,
      mimeType: blob.type,
      language: 'ms-MY',
      context: { activity: 'reading', contextKey: 'reading:bm:0', durationMs: 6000 }
    });

    expect(result).toEqual({
      transcript: 'Saya suka membaca',
      confidence: 87.5,
      provider: 'future-provider',
      metadata: {
        requestId: 'safe-123',
        stable: true,
        language: 'ms-MY',
        contextKey: 'reading:bm:0',
        activity: 'reading',
        durationMs: 6000,
        size: blob.size,
        mimeType: 'audio/mp4;codecs=mp4a.40.2'
      }
    });
    expect(JSON.stringify(result.metadata)).not.toContain('SECRET');
  });

  it('forwards the exact Blob, MIME, language, context and an AbortSignal', async () => {
    const request = vi.fn(async () => ({ transcript: 'hello', confidence: 55 }));
    const adapter = createSttAdapter({ request });
    const blob = audioBlob(12);
    const context = { activity: 'speaking', contextKey: 'speaking:english:intro:1', durationMs: 4000 };
    await adapter.transcribe({ blob, mimeType: blob.type, language: 'en-US', context });

    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toMatchObject({ blob, mimeType: blob.type, language: 'en-US', context });
    expect(request.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal);
  });

  it('supports external abort and bounded provider timeout', async () => {
    const never = () => new Promise(() => {});
    const abortedAdapter = createSttAdapter({ request: never, timeoutMs: 5000 });
    const controller = new AbortController();
    const aborted = abortedAdapter.transcribe({ blob: audioBlob(), signal: controller.signal });
    controller.abort();
    await expect(aborted).rejects.toMatchObject({ code: 'cancelled' });

    vi.useFakeTimers();
    const timedAdapter = createSttAdapter({ request: never, timeoutMs: 50 });
    const timed = timedAdapter.transcribe({ blob: audioBlob() });
    const timedExpectation = expect(timed).rejects.toMatchObject({ code: 'stt-timeout' });
    await vi.advanceTimersByTimeAsync(50);
    await timedExpectation;
  });

  it('normalizes provider errors, empty results and unavailable adapters', async () => {
    const unavailable = createSttAdapter();
    await expect(unavailable.transcribe({ blob: audioBlob() })).rejects.toMatchObject({ code: 'stt-unavailable' });

    const providerError = createSttAdapter({ request: async () => { throw new Error('SECRET provider detail'); } });
    await expect(providerError.transcribe({ blob: audioBlob() })).rejects.toMatchObject({ code: 'stt-error' });

    const explicitUnavailable = createSttAdapter({
      request: async () => { throw new MediaSttError('stt-unavailable', 'provider-disabled'); }
    });
    await expect(explicitUnavailable.transcribe({ blob: audioBlob() })).rejects.toMatchObject({ code: 'stt-unavailable' });

    const empty = createSttAdapter({ request: async () => ({ transcript: '   ' }) });
    await expect(empty.transcribe({ blob: audioBlob() })).rejects.toMatchObject({ code: 'no-audio' });
    await expect(empty.transcribe({ blob: new Blob([]) })).rejects.toMatchObject({ code: 'no-audio' });
  });

  it('enforces maximum size and duration before provider work', async () => {
    const request = vi.fn(async () => ({ transcript: 'never called' }));
    const adapter = createSttAdapter({ request });
    const oversized = { size: STT_ADAPTER_MAX_BYTES + 1, type: 'audio/mp4' };
    await expect(adapter.transcribe({ blob: oversized })).rejects.toMatchObject({
      code: 'stt-error',
      reason: 'max-size-exceeded'
    });
    await expect(adapter.transcribe({
      blob: audioBlob(),
      context: { durationMs: STT_ADAPTER_MAX_DURATION_MS + 1 }
    })).rejects.toMatchObject({
      code: 'stt-error',
      reason: 'max-duration-exceeded'
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('gates deterministic physical preview behind iOS mode, diagnostics and explicit mock text', async () => {
    const enabledSearch = '?iosSpeechMode=media-stt&speechDiag=1&mockSpeechTranscript=Saya%20membaca';
    expect(isDeterministicSttPreviewRequested({
      search: enabledSearch,
      userAgent: IOS_UA,
      maxTouchPoints: 5
    })).toBe(true);
    expect(getDeterministicSttPreviewTranscript(enabledSearch)).toBe('Saya membaca');
    expect(isDeterministicSttPreviewRequested({
      search: '?iosSpeechMode=media-stt&mockSpeechTranscript=Saya',
      userAgent: IOS_UA,
      maxTouchPoints: 5
    })).toBe(false);
    expect(isDeterministicSttPreviewRequested({
      search: enabledSearch,
      userAgent: DESKTOP_UA,
      maxTouchPoints: 0
    })).toBe(false);

    const preview = createRuntimeSttAdapter({
      search: enabledSearch,
      userAgent: IOS_UA,
      maxTouchPoints: 5
    });
    await expect(preview.transcribe({ blob: audioBlob(), language: 'ms-MY' })).resolves.toMatchObject({
      transcript: 'Saya membaca',
      provider: 'deterministic-preview'
    });

    const normalProduction = createRuntimeSttAdapter({
      search: '?iosSpeechMode=media-stt',
      userAgent: IOS_UA,
      maxTouchPoints: 5
    });
    await expect(normalProduction.transcribe({ blob: audioBlob() })).rejects.toMatchObject({ code: 'stt-unavailable' });
  });

  it('removes the deterministic delay abort listener after successful completion', async () => {
    vi.useFakeTimers();
    const addSpy = vi.spyOn(AbortSignal.prototype, 'addEventListener');
    const removeSpy = vi.spyOn(AbortSignal.prototype, 'removeEventListener');
    const adapter = createDeterministicSttAdapter({ transcript: 'done', delayMs: 25 });
    const resultPromise = adapter.transcribe({ blob: audioBlob() });
    await vi.advanceTimersByTimeAsync(25);
    await expect(resultPromise).resolves.toMatchObject({ transcript: 'done' });
    const abortRegistration = addSpy.mock.calls.find(call => call[0] === 'abort');
    expect(abortRegistration).toBeTruthy();
    expect(removeSpy).toHaveBeenCalledWith('abort', abortRegistration[1]);
  });

  it('contains no transport, storage, object URL, device enumeration or provider credential', () => {
    const source = readFileSync(new URL('../../src/ai/speech/sttAdapter.js', import.meta.url), 'utf8');
    [
      'fetch(',
      'XMLHttpRequest',
      'localStorage',
      'sessionStorage',
      'createObjectURL',
      'enumerateDevices',
      'SpeechRecognition',
      'speechSynthesis',
      'apiKey',
      'Authorization'
    ].forEach(forbidden => expect(source).not.toContain(forbidden));
  });
});
