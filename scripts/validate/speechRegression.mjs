import assert from 'node:assert/strict';
import { extractSpeechTranscript, collectSpeechTranscriptFragments, createSpeechSession, cancelActiveSpeechRecognition } from '../../src/ai/speech/speechEngine.js';
import { createReadingSpeechSession } from '../../src/ai/speech/speechSession.js';
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
  result.isFinal = alternatives[0]?.isFinal !== false;
  return result;
}

function createTranscriptAccumulator() {
  const seenResultKeys = new Set();
  let finalFragments = [];
  let interimTranscript = '';

  function combineTranscript() {
    const finalTranscript = finalFragments.join(' ').trim();
    const safeInterim = typeof interimTranscript === 'string' ? interimTranscript.trim() : '';
    if (!finalTranscript) return safeInterim;
    if (!safeInterim) return finalTranscript;
    if (finalTranscript === safeInterim) return finalTranscript;
    if (finalTranscript.endsWith(safeInterim)) return finalTranscript;
    return [finalTranscript, safeInterim].filter(Boolean).join(' ').trim();
  }

  return {
    push(event, resultIndex = 0) {
      const nextState = collectSpeechTranscriptFragments(event, seenResultKeys, resultIndex);
      if (nextState.nextFinalFragments.length) {
        finalFragments = [...finalFragments, ...nextState.nextFinalFragments];
      }
      interimTranscript = nextState.interimTranscript;
      return combineTranscript();
    },
    snapshot() {
      return {
        final: finalFragments.join(' ').trim(),
        interim: interimTranscript,
        combined: combineTranscript()
      };
    },
    clear() {
      finalFragments = [];
      interimTranscript = '';
      seenResultKeys.clear();
    }
  };
}

function installTimerStubs() {
  const pendingTimers = new Map();
  let timerId = 0;
  const realSetTimeout = globalThis.setTimeout;
  const realClearTimeout = globalThis.clearTimeout;

  globalThis.setTimeout = (callback, delay, ...args) => {
    const id = ++timerId;
    pendingTimers.set(id, { callback, delay: Number(delay) || 0, args });
    return id;
  };

  globalThis.clearTimeout = id => {
    pendingTimers.delete(id);
  };

  return {
    pendingTimers,
    fireNext(delayPredicate = () => true) {
      const entry = [...pendingTimers.entries()].find(([, timer]) => delayPredicate(timer));
      if (!entry) return false;
      const [id, timer] = entry;
      pendingTimers.delete(id);
      timer.callback?.(...timer.args);
      return true;
    },
    fireAll(delayPredicate = () => true) {
      let fired = false;
      while (this.fireNext(delayPredicate)) {
        fired = true;
      }
      return fired;
    },
    restore() {
      globalThis.setTimeout = realSetTimeout;
      globalThis.clearTimeout = realClearTimeout;
    }
  };
}

function createReadingSessionHarness(targetText = 'Ayah pergi ke pasar kemudian ke kedai') {
  const onChangeStates = [];
  const onResults = [];
  const onEmpties = [];
  const onStops = [];
  const timers = installTimerStubs();
  const session = createReadingSpeechSession({
    lang: 'ms-MY',
    resultFactory: transcript => {
      const safeTranscript = String(transcript ?? '').trim();
      return {
        status: safeTranscript ? 'completed' : 'empty',
        transcript: safeTranscript,
        correct: safeTranscript === targetText,
        confidence: safeTranscript ? 100 : 0,
        score: safeTranscript === targetText ? 100 : 0,
        matched: [],
        matchedKeywords: [],
        tertinggal: [],
        missingWords: [],
        missed: [],
        words: [],
        errorCode: safeTranscript ? '' : 'no-result',
        message: safeTranscript ? '' : 'Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.'
      };
    },
    onChange: state => onChangeStates.push(state),
    onResult: result => onResults.push(result),
    onEmpty: result => onEmpties.push(result),
    onStopped: reason => onStops.push(reason)
  });

  session.start();
  const recognition = session.recognition;

  function fireTimer(delayPredicate = () => true) {
    return timers.fireNext(delayPredicate);
  }

  function fireTimed(delay) {
    return fireTimer(timer => timer.delay === delay);
  }

  function dispose() {
    session.cancel();
    timers.restore();
  }

  return {
    session,
    recognition,
    timers,
    onChangeStates,
    onResults,
    onEmpties,
    onStops,
    fireTimer,
    fireTimed,
    dispose
  };
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

  const bacaanAccumulator = createTranscriptAccumulator();
  assert.equal(
    bacaanAccumulator.push({ results: [makeResult({ transcript: 'Ayah pergi ke pasar' })], resultIndex: 0 }),
    'Ayah pergi ke pasar',
    'Single sentence should remain intact.'
  );
  assert.deepEqual(
    {
      final: bacaanAccumulator.snapshot().final,
      interim: bacaanAccumulator.snapshot().interim
    },
    { final: 'Ayah pergi ke pasar', interim: '' },
    'Single sentence should be buffered as final text.'
  );

  bacaanAccumulator.clear();
  assert.equal(
    bacaanAccumulator.push({ results: [makeResult({ transcript: 'Ayah pergi ke pasar' })], resultIndex: 0 }),
    'Ayah pergi ke pasar',
    'First sentence should be buffered.'
  );
  assert.equal(
    bacaanAccumulator.push({ results: [makeResult({ transcript: 'Ayah pergi ke pasar' }), makeResult({ transcript: 'kemudian ke kedai' })], resultIndex: 1 }),
    'Ayah pergi ke pasar kemudian ke kedai',
    'Second sentence should append without dropping the first.'
  );
  assert.equal(
    bacaanAccumulator.push({ results: [makeResult({ transcript: 'Ayah pergi ke pasar' }), makeResult({ transcript: 'kemudian ke kedai' })], resultIndex: 0 }),
    'Ayah pergi ke pasar kemudian ke kedai',
    'Repeated cumulative results should not duplicate transcript fragments.'
  );
  assert.equal(
    bacaanAccumulator.push({ results: [makeResult({ transcript: 'Ayah pergi ke pasar', isFinal: true }), makeResult({ transcript: 'kemudian ke kedai', isFinal: false })], resultIndex: 1 }),
    'Ayah pergi ke pasar kemudian ke kedai',
    'Final plus interim fragments should stay visible together until end.'
  );
  assert.equal(
    bacaanAccumulator.snapshot().final,
    'Ayah pergi ke pasar kemudian ke kedai',
    'Final buffer should keep the whole spoken phrase.'
  );
  assert.equal(
    bacaanAccumulator.snapshot().interim,
    'kemudian ke kedai',
    'Interim fragment should remain available until finalization.'
  );
  bacaanAccumulator.clear();
  assert.equal(bacaanAccumulator.push({ results: [], resultIndex: 0 }), '', 'Empty transcript stream should stay empty.');
  bacaanAccumulator.clear();
  assert.equal(
    bacaanAccumulator.push({ results: [makeResult({ transcript: 'mereka semua' })], resultIndex: 0 }),
    'mereka semua',
    'Valid transcript should not be lost when only one sentence is present.'
  );

  const readingAttempt1 = createReadingSessionHarness();
  assert.equal(FakeRecognition.instances.length, 1, 'First reading attempt should create one recognition instance.');
  readingAttempt1.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt1.recognition.emitEnd();
  assert.equal(readingAttempt1.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar', 'Attempt 1 transcript should be preserved.');
  assert.equal(readingAttempt1.onResults.at(-1)?.status, 'completed', 'Attempt 1 should complete successfully.');
  assert.equal(readingAttempt1.recognition.stopCalls >= 1 || readingAttempt1.recognition.abortCalls >= 1, true, 'Attempt 1 microphone should be disposed after completion.');
  readingAttempt1.dispose();

  const readingAttempt2 = createReadingSessionHarness();
  assert.equal(FakeRecognition.instances.length, 2, 'Second reading attempt should create a fresh recognition instance.');
  readingAttempt2.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt2.recognition.emitEnd();
  assert.equal(readingAttempt2.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar', 'Attempt 2 should accept the same sentence.');
  assert.equal(readingAttempt2.onResults.at(-1)?.status, 'completed', 'Attempt 2 should also complete successfully.');
  readingAttempt2.dispose();

  const readingAttempt3 = createReadingSessionHarness();
  readingAttempt3.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt3.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' }), makeResult({ transcript: 'kemudian ke kedai' })], 1);
  readingAttempt3.recognition.emitEnd();
  assert.equal(readingAttempt3.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar kemudian ke kedai', 'Multi-sentence attempt should keep both sentences.');
  assert.equal(readingAttempt3.onResults.at(-1)?.status, 'completed', 'Multi-sentence attempt should complete.');
  readingAttempt3.dispose();

  const readingAttempt3b = createReadingSessionHarness();
  readingAttempt3b.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt3b.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' }), makeResult({ transcript: 'Ayah pergi ke pasar' }), makeResult({ transcript: 'kemudian ke kedai' })], 0);
  readingAttempt3b.recognition.emitEnd();
  assert.equal(readingAttempt3b.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar kemudian ke kedai', 'Cumulative Safari result list should not duplicate fragments.');
  readingAttempt3b.dispose();

  const readingAttempt4 = createReadingSessionHarness();
  readingAttempt4.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt4.recognition.emitEnd();
  readingAttempt4.dispose();
  const readingAttempt5 = createReadingSessionHarness();
  readingAttempt5.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt5.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' }), makeResult({ transcript: 'kemudian ke kedai' })], 1);
  readingAttempt5.recognition.emitEnd();
  assert.equal(readingAttempt5.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar kemudian ke kedai', 'Retry after one sentence should still allow two sentences.');
  readingAttempt5.dispose();

  const readingAttempt6 = createReadingSessionHarness();
  readingAttempt6.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' }), makeResult({ transcript: 'kemudian ke kedai' })], 1);
  readingAttempt6.recognition.emitEnd();
  readingAttempt6.dispose();
  const readingAttempt7 = createReadingSessionHarness();
  readingAttempt7.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt7.recognition.emitEnd();
  assert.equal(readingAttempt7.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar', 'Retry after two sentences should still allow one sentence.');
  readingAttempt7.dispose();

  const readingAttempt8 = createReadingSessionHarness();
  const oldOnEndRecognition = readingAttempt8.recognition;
  const readingAttempt9 = createReadingSessionHarness();
  oldOnEndRecognition.emitEnd();
  readingAttempt9.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt9.recognition.emitEnd();
  assert.equal(readingAttempt9.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar', 'Old onend should not interfere with the new attempt.');
  readingAttempt9.dispose();

  const readingAttempt10 = createReadingSessionHarness();
  const oldHardTimeoutTimer = [...readingAttempt10.timers.pendingTimers.entries()].find(([, timer]) => timer.delay === 15000);
  const readingAttempt11 = createReadingSessionHarness();
  if (oldHardTimeoutTimer) {
    oldHardTimeoutTimer[1].callback?.(...oldHardTimeoutTimer[1].args);
  }
  readingAttempt11.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt11.recognition.emitEnd();
  assert.equal(readingAttempt11.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar', 'Old timeout should not interfere with the new attempt.');
  readingAttempt11.dispose();

  const readingAttempt12 = createReadingSessionHarness();
  readingAttempt12.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt12.recognition.emitEnd();
  readingAttempt12.dispose();
  const readingAttempt13 = createReadingSessionHarness();
  readingAttempt13.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  readingAttempt13.recognition.emitEnd();
  assert.equal(readingAttempt13.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar', 'Identical transcript in a new session should still be accepted.');
  readingAttempt13.dispose();

  const readingAttempt14 = createReadingSessionHarness();
  readingAttempt14.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  const oldSilenceTimer = [...readingAttempt14.timers.pendingTimers.entries()].find(([, timer]) => timer.delay === 1800);
  const readingAttempt15 = createReadingSessionHarness();
  if (oldSilenceTimer) {
    oldSilenceTimer[1].callback?.(...oldSilenceTimer[1].args);
  }
  readingAttempt15.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar kemudian ke kedai' })], 0);
  readingAttempt15.recognition.emitEnd();
  assert.equal(readingAttempt15.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar kemudian ke kedai', 'Old silence timer should not interfere with the new attempt.');
  readingAttempt15.dispose();

  const readingAttempt16 = createReadingSessionHarness();
  readingAttempt16.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  const timeoutTimer = [...readingAttempt16.timers.pendingTimers.entries()].find(([, timer]) => timer.delay === 15000);
  if (timeoutTimer) {
    timeoutTimer[1].callback?.(...timeoutTimer[1].args);
  }
  assert.equal(readingAttempt16.onResults.at(-1)?.transcript, 'Ayah pergi ke pasar', 'Hard timeout should preserve the partial transcript.');
  readingAttempt16.dispose();

  const readingAttempt17 = createReadingSessionHarness();
  readingAttempt17.session.cancel();
  readingAttempt17.session.cancel();
  assert.equal(readingAttempt17.recognition.stopCalls >= 1 || readingAttempt17.recognition.abortCalls >= 1, true, 'Cancel should be idempotent and dispose recognition safely.');
  readingAttempt17.dispose();

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
