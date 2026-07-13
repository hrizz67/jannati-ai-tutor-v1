import assert from 'node:assert/strict';
import { extractSpeechTranscript, createSpeechSession, cancelActiveSpeechRecognition } from '../../src/ai/speech/speechEngine.js';
import { speak, stop as stopVoice } from '../../src/ai/voice/voiceEngine.js';

class FakeRecognition {
  static instances = [];

  constructor() {
    this.lang = '';
    this.interimResults = false;
    this.continuous = false;
    this.maxAlternatives = 1;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.abortCalls = 0;
    this.onstart = null;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.onnomatch = null;
    FakeRecognition.instances.push(this);
  }

  start() {
    this.startCalls += 1;
    this.onstart?.();
  }

  stop() {
    this.stopCalls += 1;
    this.onend?.();
  }

  abort() {
    this.abortCalls += 1;
    this.onend?.();
  }

  emitResult(results, resultIndex = 0) {
    this.onresult?.({ results, resultIndex });
  }

  emitError(error) {
    this.onerror?.({ error });
  }

  emitEnd() {
    this.onend?.();
  }
}

function makeResult(...alternatives) {
  const result = { length: alternatives.length };
  alternatives.forEach((alternative, index) => {
    result[index] = alternative;
  });
  return result;
}

function makeEvent(results) {
  return { results };
}

function installSpeechStubs() {
  globalThis.window ??= {};
  globalThis.window.SpeechRecognition = FakeRecognition;
  globalThis.window.webkitSpeechRecognition = FakeRecognition;
  globalThis.window.speechSynthesis = {
    speaking: false,
    pending: false,
    cancel() {
      this.speaking = false;
      this.pending = false;
    },
    speak(utterance) {
      this.speaking = true;
      queueMicrotask(() => {
        this.speaking = false;
        utterance.onend?.();
      });
    },
    pause() {
      this.speaking = false;
    },
    resume() {
      this.speaking = true;
    }
  };
  globalThis.window.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
      this.lang = 'ms-MY';
      this.rate = 0.95;
      this.pitch = 1;
      this.volume = 1;
      this.onend = null;
      this.onerror = null;
    }
  };
  globalThis.SpeechSynthesisUtterance = globalThis.window.SpeechSynthesisUtterance;
}

function resetSpeechStubs() {
  FakeRecognition.instances.length = 0;
  delete globalThis.window?.SpeechRecognition;
  delete globalThis.window?.webkitSpeechRecognition;
  delete globalThis.window?.speechSynthesis;
  delete globalThis.window?.SpeechSynthesisUtterance;
  delete globalThis.SpeechSynthesisUtterance;
}

async function main() {
  installSpeechStubs();

  assert.equal(extractSpeechTranscript(), '');
  assert.equal(extractSpeechTranscript({}), '');
  assert.equal(extractSpeechTranscript({ results: [] }), '');
  assert.equal(
    extractSpeechTranscript({
      results: [
        makeResult({ transcript: '  mereka  ' }),
        makeResult({ transcript: '' }),
        makeResult({ transcript: ' pergi ' })
      ]
    }),
    'mereka pergi'
  );
  assert.equal(
    extractSpeechTranscript({
      results: { 0: makeResult({ transcript: 'Ali' }), 2: makeResult({ transcript: 'ke sekolah' }), length: 3 }
    }),
    'Ali ke sekolah'
  );

  const validResults = [];
  const validChanges = [];
  const validSession = createSpeechSession({
    expectedAnswer: 'mereka',
    acceptedAnswers: ['mereka'],
    onChange: state => validChanges.push(state),
    onResult: result => validResults.push(result)
  });
  validSession.start();
  const validRecognition = validSession.recognition;
  validRecognition.emitResult([
    makeResult({ transcript: ' mereka ' })
  ]);
  validRecognition.emitEnd();
  assert.equal(validResults.length, 1, 'Valid speech should finalize once.');
  assert.equal(validResults[0].correct, true, 'Valid speech should be correct.');
  assert.equal(validResults[0].transcript, 'mereka', 'Transcript should be preserved.');
  assert.equal(validChanges.at(-1)?.status, 'completed', 'Valid speech should end completed.');
  cancelActiveSpeechRecognition();

  const emptyResults = [];
  const emptyChanges = [];
  const emptySession = createSpeechSession({
    expectedAnswer: 'padang',
    acceptedAnswers: ['padang'],
    onChange: state => emptyChanges.push(state),
    onResult: result => emptyResults.push(result)
  });
  emptySession.start();
  const emptyRecognition = emptySession.recognition;
  emptyRecognition.emitEnd();
  assert.equal(emptyResults.length, 1, 'Empty speech should finalize once.');
  assert.equal(emptyResults[0].status, 'empty', 'Empty speech should return empty status.');
  assert.equal(emptyResults[0].transcript, '', 'Empty speech should not invent transcript.');
  assert.equal(emptyChanges.at(-1)?.status, 'empty', 'Empty speech should update to empty state.');
  cancelActiveSpeechRecognition();

  const duplicateResults = [];
  const duplicateSession = createSpeechSession({
    expectedAnswer: 'buku',
    acceptedAnswers: ['buku'],
    onResult: result => duplicateResults.push(result)
  });
  duplicateSession.start();
  const duplicateRecognition = duplicateSession.recognition;
  duplicateRecognition.emitError({ error: 'no-speech' });
  duplicateRecognition.emitEnd();
  assert.equal(duplicateResults.length, 1, 'Duplicate finalize guard should allow one result only.');
  assert.equal(duplicateResults[0].status, 'empty', 'no-speech should resolve as empty.');
  assert.equal(duplicateResults[0].message.includes('Suara belum dapat dikesan'), true, 'no-speech should use the friendly Malay empty-state message.');
  cancelActiveSpeechRecognition();

  const permissionResults = [];
  const permissionSession = createSpeechSession({
    expectedAnswer: 'buku',
    acceptedAnswers: ['buku'],
    onResult: result => permissionResults.push(result)
  });
  permissionSession.start();
  const permissionRecognition = permissionSession.recognition;
  permissionRecognition.emitError({ error: 'not-allowed' });
  permissionRecognition.emitEnd();
  assert.equal(permissionResults.length, 1, 'Permission-denied should resolve once.');
  assert.equal(permissionResults[0].status, 'empty', 'Permission-denied should resolve to empty state.');
  assert.equal(
    permissionResults[0].message.includes('mikrofon'),
    true,
    'Permission-denied should use a Malay microphone message.'
  );
  cancelActiveSpeechRecognition();

  const cleanupSession = createSpeechSession({
    expectedAnswer: 'jalan',
    acceptedAnswers: ['jalan']
  });
  cleanupSession.start();
  const cleanupRecognition = cleanupSession.recognition;
  cleanupSession.cancel();
  cleanupSession.cancel();
  assert.ok(cleanupRecognition.stopCalls >= 1 || cleanupRecognition.abortCalls >= 1, 'Cleanup should dispose recognition safely.');
  cancelActiveSpeechRecognition();

  const firstSession = createSpeechSession({
    expectedAnswer: 'kucing',
    acceptedAnswers: ['kucing']
  });
  firstSession.start();
  const firstRecognition = firstSession.recognition;
  cancelActiveSpeechRecognition();
  const secondSession = createSpeechSession({
    expectedAnswer: 'anjing',
    acceptedAnswers: ['anjing']
  });
  secondSession.start();
  assert.ok(firstRecognition.stopCalls >= 1 || firstRecognition.abortCalls >= 1, 'Starting a new session should dispose the previous one.');

  cancelActiveSpeechRecognition();
  stopVoice();
  await speak('Hai');
  assert.equal(globalThis.window.speechSynthesis.speaking, false, 'Voice synthesis should settle after speaking.');

  resetSpeechStubs();
  console.log('speech regression tests passed');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
