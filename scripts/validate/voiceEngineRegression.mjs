import assert from 'node:assert/strict';
import { loadBrowserVoices, selectBestVoice } from '../../src/ai/voice/browserVoiceProvider.js';
import {
  detectArabicScript,
  normalizeVoiceLanguage,
  resolveVoiceLanguage,
  segmentMixedLanguageText
} from '../../src/ai/voice/languageDetector.js';

const voice = (name, lang, localService = true) => ({ name, lang, localService });

assert.equal(normalizeVoiceLanguage('ms-MY'), 'ms');
assert.equal(normalizeVoiceLanguage('EN_gb'), 'en');
assert.equal(normalizeVoiceLanguage('Bahasa Arab'), 'ar');
assert.equal(detectArabicScript('كتاب'), true);
assert.equal(detectArabicScript('buku'), false);
assert.equal(resolveVoiceLanguage('كتاب'), 'ar');
assert.equal(resolveVoiceLanguage('Baca كتاب ini'), 'ms', 'Mixed text should retain the Malay base language.');
assert.equal(resolveVoiceLanguage('كتاب', { language: 'en-GB' }), 'en', 'Explicit context must beat text detection.');
assert.equal(resolveVoiceLanguage('Hello', { subjectId: 'arab' }), 'ar', 'Subject context must beat text detection.');

assert.deepEqual(
  segmentMixedLanguageText('Baca كتاب ini.', 'ms').map(segment => ({ text: segment.text.trim(), language: segment.language })),
  [
    { text: 'Baca', language: 'ms' },
    { text: 'كتاب', language: 'ar' },
    { text: 'ini.', language: 'ms' }
  ]
);

const voices = [
  voice('Microsoft Osman', 'ms-MY'),
  voice('Microsoft Yasmin', 'ms-MY'),
  voice('English United States', 'en-US'),
  voice('English United Kingdom', 'en-GB'),
  voice('Arabic Egypt', 'ar-EG'),
  voice('Arabic Saudi Arabia', 'ar-SA'),
  voice('Bahasa Indonesia', 'id-ID')
];

assert.equal(selectBestVoice(voices, 'ms')?.name, 'Microsoft Yasmin');
assert.equal(selectBestVoice(voices, 'en')?.lang, 'en-GB');
assert.equal(selectBestVoice(voices, 'ar')?.lang, 'ar-SA');
assert.equal(selectBestVoice([voice('English', 'en-US'), voice('Indonesia', 'id-ID')], 'ms'), null, 'Malay must never fall back to English or Indonesian.');
assert.equal(selectBestVoice([voice('English', 'en-US')], 'ar'), null, 'Arabic must never fall back to English.');

const spoken = [];
let availableVoices = voices;
let voicesChangedHandler = null;
let nextSpeechError = '';
globalThis.window = {
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  SpeechSynthesisUtterance: class {
    constructor(text) {
      this.text = text;
      this.lang = '';
      this.voice = null;
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
    }
  },
  speechSynthesis: {
    speaking: false,
    pending: false,
    paused: false,
    getVoices() {
      return availableVoices;
    },
    addEventListener(event, handler) {
      if (event === 'voiceschanged') voicesChangedHandler = handler;
    },
    removeEventListener(event, handler) {
      if (event === 'voiceschanged' && voicesChangedHandler === handler) voicesChangedHandler = null;
    },
    cancel() {
      this.speaking = false;
      this.pending = false;
    },
    speak(utterance) {
      this.speaking = true;
      spoken.push(utterance);
      utterance.onstart?.();
      queueMicrotask(() => {
        this.speaking = false;
        if (nextSpeechError) {
          const error = nextSpeechError;
          nextSpeechError = '';
          utterance.onerror?.({ error });
        } else {
          utterance.onend?.();
        }
      });
    },
    pause() {
      this.paused = true;
    },
    resume() {
      this.paused = false;
    }
  }
};

const {
  speak,
  replay,
  stop,
  getAvailableVoices,
  getVoiceStatus,
  VOICE_RESULT_CODES
} = await import('../../src/ai/voice/voiceEngine.js');

assert.equal((await speak('')).code, VOICE_RESULT_CODES.EMPTY_TEXT);

const malayResult = await speak('Selamat belajar', { language: 'ms', rate: 9 });
assert.equal(malayResult.success, true);
assert.equal(spoken.at(-1).voice.name, 'Microsoft Yasmin');
assert.equal(spoken.at(-1).rate, 1.5, 'Rate must be clamped to the safe maximum.');

const beforeMixed = spoken.length;
const mixedResult = await speak('Baca كتاب ini', { language: 'ms' });
assert.equal(mixedResult.success, true);
assert.deepEqual(spoken.slice(beforeMixed).map(item => normalizeVoiceLanguage(item.lang)), ['ms', 'ar', 'ms']);

const beforeReplay = spoken.length;
assert.equal((await replay()).success, true);
assert.equal(spoken.length, beforeReplay + 3, 'Replay should repeat the last successful mixed request.');

const beforeQueued = spoken.length;
const firstQueued = speak('Pertama', { language: 'ms' });
const secondQueued = speak('Kedua', { language: 'ms', interrupt: false });
assert.equal((await firstQueued).success, true);
assert.equal((await secondQueued).success, true);
assert.equal(spoken.length, beforeQueued + 2, 'Non-interrupt requests must wait without overlapping or being lost.');

availableVoices = [];
const delayedVoices = loadBrowserVoices({ timeoutMs: 100 });
setTimeout(() => {
  availableVoices = voices;
  voicesChangedHandler?.();
}, 0);
assert.equal((await delayedVoices).length, voices.length, 'voiceschanged must resolve delayed mobile voice loading.');

availableVoices = [voice('English United Kingdom', 'en-GB')];
const systemFallback = await speak('Selamat', { language: 'ms' });
assert.equal(systemFallback.code, VOICE_RESULT_CODES.SPOKEN, 'The operating system must get a chance to auto-select ms-MY when its voice list is incomplete.');
assert.equal(systemFallback.success, true);
assert.equal(spoken.at(-1).voice, null, 'An unrelated installed voice must not be selected explicitly as the Malay voice.');
assert.equal(spoken.at(-1).lang, 'ms-MY');

nextSpeechError = 'language-unavailable';
const unavailable = await speak('Selamat', { language: 'ms' });
assert.equal(unavailable.code, VOICE_RESULT_CODES.VOICE_NOT_AVAILABLE, 'A real system language failure still needs actionable device guidance.');
assert.equal(unavailable.success, false);

availableVoices = voices;
assert.equal((await getAvailableVoices()).length, voices.length);
assert.equal(getVoiceStatus().speaking, false);
stop();

delete globalThis.window;
console.log('voiceEngineRegression: PASS');
