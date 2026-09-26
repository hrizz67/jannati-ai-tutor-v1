import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assessCommunicationText,
  confirmCommunicationSpeechCandidate,
  createCommunicationSpeechErrorResult,
  createCommunicationSpeechSession,
  createSpeechReviewCandidate,
  getCommunicationSpeechErrorMessage,
  playCommunicationAudio,
  resolveCommunicationSpeechLocale
} from '../../src/ai/speech/communicationSpeech.js';
import { cancelActiveSpeechRecognition } from '../../src/ai/speech/speechEngine.js';
import { createReadingSpeechSession } from '../../src/ai/speech/speechSession.js';
import {
  appendUniqueCommunicationResult,
  normalizeCommunicationResult
} from '../../src/utils/communicationResult.js';

class FakeSpeechRecognition {
  static instances = [];

  constructor() {
    this.lang = '';
    this.interimResults = false;
    this.continuous = false;
    this.maxAlternatives = 0;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
    FakeSpeechRecognition.instances.push(this);
  }

  start() {
    this.startCalls += 1;
    this.onstart?.();
  }

  stop() {
    this.stopCalls += 1;
  }

  abort() {
    this.abortCalls += 1;
  }

  emitResult(transcript, { isFinal = true, confidence = 0.9 } = {}) {
    const result = [{ transcript, confidence }];
    result.isFinal = isFinal;
    this.onresult?.({ resultIndex: 0, results: [result] });
  }

  emitError(error) {
    this.onerror?.({ error });
  }

  emitEnd() {
    this.onend?.();
  }
}

function installRecognition() {
  FakeSpeechRecognition.instances = [];
  globalThis.window = {
    SpeechRecognition: FakeSpeechRecognition,
    webkitSpeechRecognition: null,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout
  };
}

function completeRecognition(session, transcript) {
  session.start();
  const recognition = session.recognition;
  recognition.emitResult(transcript);
  recognition.emitEnd();
  return recognition;
}

beforeEach(() => {
  installRecognition();
});

afterEach(() => {
  cancelActiveSpeechRecognition();
  vi.useRealTimers();
  delete globalThis.window;
});

describe('communication speech locale integrity', () => {
  it.each([
    ['bm', 'ms-MY'],
    ['english', 'en-US'],
    ['arab', 'ar-SA']
  ])('passes %s locale %s to the active recognition instance', (id, speechLang) => {
    const session = createReadingSpeechSession({ lang: speechLang });
    session.start();
    expect(session.recognition.lang).toBe(speechLang);
    expect(session.recognition.continuous).toBe(true);
    expect(session.recognition.interimResults).toBe(true);
    session.cancel();
  });

  it('honours explicit speechLang instead of inferring from a label', () => {
    expect(resolveCommunicationSpeechLocale({ id: 'english', language: 'BM', speechLang: 'en-US' })).toBe('en-US');
  });

  it('uses the language id mapping only when explicit speechLang is absent', () => {
    expect(resolveCommunicationSpeechLocale({ id: 'arab', language: 'English' })).toBe('ar-SA');
  });
});

describe('Bacaan recognition flow', () => {
  it.each([
    ['bm', 'ms-MY', 'Saya membaca buku'],
    ['english', 'en-US', 'I read a book'],
    ['arab', 'ar-SA', 'أنا أقرأ كتابا']
  ])('streams and completes %s transcript through the shared session', (id, speechLang, spokenText) => {
    const transcripts = [];
    const results = [];
    const session = createCommunicationSpeechSession({
      activity: 'reading',
      selectedSet: { id, speechLang },
      contextKey: `reading:${id}`,
      getCurrentContextKey: () => `reading:${id}`,
      resultFactory: transcript => ({ status: 'completed', transcript, score: 100, correct: true }),
      onTranscript: transcript => transcripts.push(transcript),
      onResult: result => results.push(result)
    });

    const recognition = completeRecognition(session, spokenText);
    expect(recognition.lang).toBe(speechLang);
    expect(transcripts.at(-1)).toBe(spokenText);
    expect(results).toHaveLength(1);
    expect(results[0].transcript).toBe(spokenText);
  });
});

describe('Bertutur review and confirmation flow', () => {
  it.each([
    ['bm', 'ms-MY', 'Saya makan nasi'],
    ['english', 'en-US', 'I eat rice'],
    ['arab', 'ar-SA', 'أنا آكل الأرز']
  ])('keeps %s recognition non-assessed until explicit confirmation', (id, speechLang, spokenText) => {
    const reviews = [];
    let history = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id, speechLang },
      contextKey: `speaking:${id}:intro`,
      getCurrentContextKey: () => `speaking:${id}:intro`,
      resultFactory: transcript => ({ status: 'captured', transcript, confidence: 0.8 }),
      onCandidate: review => reviews.push(review)
    });

    const recognition = completeRecognition(session, spokenText);
    expect(recognition.lang).toBe(speechLang);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].candidate.text).toBe(spokenText);
    expect(normalizeCommunicationResult(reviews[0].result).isAssessed).toBe(false);
    expect(history).toEqual([]);

    const confirmed = confirmCommunicationSpeechCandidate(
      reviews[0].candidate,
      transcript => ({ score: transcript === spokenText ? 100 : 0, correct: true })
    );
    history = appendUniqueCommunicationResult(history, confirmed, { itemKey: `${id}:intro:0` });
    expect(confirmed.source).toBe('speech-confirmed');
    expect(history).toEqual([100]);
  });

  it('allows a review candidate to be edited or cleared without assessing it', () => {
    const review = createSpeechReviewCandidate({ transcript: 'draft text', confidence: 0.5 });
    review.candidate.text = 'edited text';
    expect(review.candidate.text).toBe('edited text');
    expect(normalizeCommunicationResult(review.result).isAssessed).toBe(false);
    expect(createSpeechReviewCandidate({ transcript: '' })).toBeNull();
  });

  it('keeps manual typing available when recognition is unsupported', () => {
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      sessionFactory: options => ({
        supported: false,
        start() {
          const unsupported = { unsupported: true, transcript: '' };
          options.onChange?.({ status: 'unsupported', result: unsupported });
          return unsupported;
        },
        cancel() {}
      }),
      onFailure: result => failures.push(result)
    });
    session.start();
    const manual = assessCommunicationText('typed answer', () => ({ score: 100, correct: true }));
    expect(failures[0].manualFallbackAvailable).toBe(true);
    expect(manual.source).toBe('manual');
    expect(normalizeCommunicationResult(manual).isAssessed).toBe(true);
  });
});

describe('visible controlled recognition failures', () => {
  it.each([
    ['not-allowed', 'Mikrofon tidak dibenarkan'],
    ['service-not-allowed', 'Mikrofon tidak dibenarkan'],
    ['no-speech', 'Tiada suara dikesan'],
    ['no-result', 'Tiada suara dikesan'],
    ['audio-capture', 'Mikrofon tidak dapat dikesan'],
    ['network', 'Semak sambungan internet'],
    ['language-not-supported', 'Bahasa suara ini tidak disokong'],
    ['bad-grammar', 'tidak dapat memproses bahasa'],
    ['unknown-provider-error', 'Pengecaman suara menghadapi masalah']
  ])('maps %s to an actionable manual-fallback message', (errorCode, expectedText) => {
    const result = createCommunicationSpeechErrorResult(errorCode);
    expect(result.message).toContain(expectedText);
    expect(result.message.toLowerCase()).toMatch(/taip|menaip/);
    expect(result.isAssessed).toBe(false);
    expect(result.manualFallbackAvailable).toBe(true);
  });

  it.each([
    ['english', 'en-US'],
    ['arab', 'ar-SA']
  ])('surfaces a generic %s recognition error without an assessed result', (id, speechLang) => {
    const failures = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id, speechLang },
      contextKey: `speaking:${id}`,
      getCurrentContextKey: () => `speaking:${id}`,
      onFailure: result => failures.push(result)
    });
    session.start();
    session.recognition.emitError('network');
    expect(failures).toHaveLength(1);
    expect(failures[0].message).toContain('taip jawapan secara manual');
    expect(normalizeCommunicationResult(failures[0]).isAssessed).toBe(false);
  });

  it('surfaces engine-specific permission and capture errors once', () => {
    for (const errorCode of ['not-allowed', 'audio-capture']) {
      const failures = [];
      const session = createCommunicationSpeechSession({
        activity: 'reading',
        selectedSet: { id: 'bm', speechLang: 'ms-MY' },
        onFailure: result => failures.push(result)
      });
      session.start();
      session.recognition.emitError(errorCode);
      expect(failures).toHaveLength(1);
      expect(failures[0].errorCode).toBe(errorCode);
    }
  });

  it('never appends empty or technical speech failures to score history', () => {
    const empty = createCommunicationSpeechErrorResult('no-speech');
    const technical = createCommunicationSpeechErrorResult('network');
    let history = appendUniqueCommunicationResult([], empty, { itemKey: 'empty' });
    history = appendUniqueCommunicationResult(history, technical, { itemKey: 'technical' });
    expect(history).toEqual([]);
  });

  it('keeps the public error copy actionable for unknown locale/provider failures', () => {
    expect(getCommunicationSpeechErrorMessage('language-unavailable')).toContain('pelayar atau peranti');
    expect(getCommunicationSpeechErrorMessage('unexpected')).toContain('taip jawapan secara manual');
  });
});

describe('session isolation and retry', () => {
  it('cancels a changed context and ignores its stale transcript and completion callbacks', () => {
    let currentContext = 'speaking:english:intro';
    let callbacks = null;
    let cancelCalls = 0;
    const transcripts = [];
    const candidates = [];
    const session = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: currentContext,
      getCurrentContextKey: () => currentContext,
      sessionFactory(options) {
        callbacks = options;
        return {
          supported: true,
          start: () => ({ status: 'listening' }),
          cancel: () => { cancelCalls += 1; }
        };
      },
      onTranscript: transcript => transcripts.push(transcript),
      onCandidate: candidate => candidates.push(candidate)
    });
    session.start();
    currentContext = 'speaking:arab:intro';
    session.cancel();
    callbacks.onTranscript('stale English');
    callbacks.onComplete({ transcript: 'stale English' });
    expect(cancelCalls).toBe(1);
    expect(transcripts).toEqual([]);
    expect(candidates).toEqual([]);
  });

  it('starts a fresh retry and prevents old results from overwriting it', () => {
    const runs = [];
    const createFakeSession = options => {
      const run = { options, cancelled: false };
      runs.push(run);
      return {
        supported: true,
        start: () => ({ status: 'listening' }),
        cancel: () => { run.cancelled = true; }
      };
    };
    const accepted = [];
    const first = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: 'retry-context',
      getCurrentContextKey: () => 'retry-context',
      sessionFactory: createFakeSession,
      onCandidate: review => accepted.push(review.candidate.text)
    });
    first.start();
    first.cancel();
    const second = createCommunicationSpeechSession({
      activity: 'speaking',
      selectedSet: { id: 'english', speechLang: 'en-US' },
      contextKey: 'retry-context',
      getCurrentContextKey: () => 'retry-context',
      sessionFactory: createFakeSession,
      onCandidate: review => accepted.push(review.candidate.text)
    });
    second.start();
    runs[0].options.onComplete({ transcript: 'old result' });
    runs[1].options.onComplete({ transcript: 'fresh result' });
    expect(runs[0].cancelled).toBe(true);
    expect(accepted).toEqual(['fresh result']);
  });
});

describe('Mendengar TTS locale and failure integrity', () => {
  it.each([
    ['BM', 'ms-MY'],
    ['Bahasa Inggeris', 'en-US'],
    ['Bahasa Arab', 'ar-SA']
  ])('passes %s item locale %s to TTS', async (languageLabel, speechLang) => {
    const calls = [];
    const result = await playCommunicationAudio({
      item: { prompt: 'Prompt', speechLang },
      languageLabel,
      speak: async (text, options) => {
        calls.push({ text, options });
        return { success: true };
      }
    });
    expect(result.success).toBe(true);
    expect(calls).toEqual([{ text: 'Prompt', options: { language: speechLang } }]);
  });

  it('returns an actionable TTS failure without mutating assessed history', async () => {
    const history = [80];
    const result = await playCommunicationAudio({
      item: { prompt: 'Hello', speechLang: 'en-US' },
      languageLabel: 'Bahasa Inggeris',
      speak: async () => ({ success: false })
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain('voice pack Bahasa Inggeris');
    expect(history).toEqual([80]);
  });

  it('contains provider exceptions and returns visible audio guidance', async () => {
    const result = await playCommunicationAudio({
      item: { prompt: 'مرحبا', speechLang: 'ar-SA' },
      languageLabel: 'Bahasa Arab',
      speak: async () => { throw new Error('provider failed'); }
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain('Audio tidak dapat dimainkan');
  });
});
