import assert from 'node:assert/strict';
import { extractSpeechTranscript, collectSpeechTranscriptFragments, createSpeechSession, cancelActiveSpeechRecognition } from '../../src/ai/speech/speechEngine.js';
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

function createBacaanAttemptHarness(targetText = 'Ayah pergi ke pasar kemudian ke kedai') {
  const finalFragmentsRef = { current: [] };
  const interimTranscriptRef = { current: '' };
  const seenResultKeysRef = { current: new Set() };
  const hasAnyTranscriptRef = { current: false };
  const sessionFinalizedRef = { current: false };
  const recognitionRef = { current: null };
  const cleanupTimerRef = { current: null };
  const silenceTimerRef = { current: null };
  const transcriptRef = { current: '' };
  const resultRef = { current: null };
  const sessionCounterRef = { current: 0 };
  const activeSessionIdRef = { current: 0 };

  function makeEmptyResult(message = 'Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.') {
    return {
      status: 'empty',
      transcript: '',
      correct: false,
      confidence: 0,
      matched: [],
      matchedKeywords: [],
      tertinggal: [],
      missingWords: [],
      missed: [],
      words: [],
      errorCode: 'no-result',
      message,
      score: 0
    };
  }

  function clearTimer(ref) {
    if (ref.current) {
      clearTimeout(ref.current);
      ref.current = null;
    }
  }

  function resetSessionState() {
    const sessionId = ++sessionCounterRef.current;
    activeSessionIdRef.current = sessionId;
    clearTimer(silenceTimerRef);
    clearTimer(cleanupTimerRef);
    finalFragmentsRef.current = [];
    interimTranscriptRef.current = '';
    seenResultKeysRef.current = new Set();
    hasAnyTranscriptRef.current = false;
    sessionFinalizedRef.current = false;
    transcriptRef.current = '';
    resultRef.current = null;
    return sessionId;
  }

  function isActiveSession(sessionId) {
    return sessionId && sessionId === activeSessionIdRef.current;
  }

  function bufferedTranscript() {
    const finalTranscript = finalFragmentsRef.current.join(' ').trim();
    const interimTranscript = typeof interimTranscriptRef.current === 'string' ? interimTranscriptRef.current.trim() : '';
    if (!finalTranscript) return interimTranscript;
    if (!interimTranscript) return finalTranscript;
    if (finalTranscript === interimTranscript) return finalTranscript;
    if (finalTranscript.endsWith(interimTranscript)) return finalTranscript;
    return [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
  }

  function finalize(sessionId, nextTranscript, status = 'completed') {
    if (!isActiveSession(sessionId) || sessionFinalizedRef.current) return resultRef.current;
    sessionFinalizedRef.current = true;
    clearTimer(silenceTimerRef);
    clearTimer(cleanupTimerRef);
    const transcript = typeof nextTranscript === 'string' ? nextTranscript.trim() : '';
    transcriptRef.current = transcript;
    resultRef.current = transcript
      ? {
          status,
          transcript,
          correct: true,
          confidence: 100,
          matched: [],
          matchedKeywords: [],
          tertinggal: [],
          missingWords: [],
          missed: [],
          words: [],
          errorCode: '',
          message: '',
          score: 100
        }
      : makeEmptyResult('Suara belum dapat dikesan. Cuba bercakap lebih dekat dengan mikrofon.');
    return resultRef.current;
  }

  function start() {
    const sessionId = resetSessionState();
    const recognition = new FakeRecognition();
    recognitionRef.current = recognition;
    const fireSilenceTimeout = () => {
      if (!isActiveSession(sessionId) || sessionFinalizedRef.current) return;
      recognition.stop?.();
    };
    const fireHardTimeout = () => {
      if (!isActiveSession(sessionId) || sessionFinalizedRef.current) return;
      const transcript = bufferedTranscript();
      recognition.stop?.();
      finalize(sessionId, transcript, transcript ? 'completed' : 'empty');
    };
    recognition.onstart = () => {
      if (!isActiveSession(sessionId)) return;
    };
    recognition.onresult = event => {
      if (!isActiveSession(sessionId) || sessionFinalizedRef.current) return;
      const { nextFinalFragments, interimTranscript, hasTranscript } = collectSpeechTranscriptFragments(event, seenResultKeysRef.current, Number.isInteger(event?.resultIndex) ? event.resultIndex : 0);
      if (!hasTranscript) return;
      hasAnyTranscriptRef.current = true;
      if (nextFinalFragments.length) {
        finalFragmentsRef.current = [...finalFragmentsRef.current, ...nextFinalFragments];
      }
      interimTranscriptRef.current = interimTranscript;
      transcriptRef.current = bufferedTranscript();
      clearTimer(silenceTimerRef);
      silenceTimerRef.current = { sessionId, fire: fireSilenceTimeout };
      if (transcriptRef.current) {
        resultRef.current = {
          status: 'processing',
          transcript: transcriptRef.current,
          correct: false,
          confidence: 0,
          score: 0,
          matched: [],
          matchedKeywords: [],
          tertinggal: [],
          missingWords: [],
          missed: [],
          words: [],
          errorCode: '',
          message: ''
        };
      }
    };
    recognition.onerror = event => {
      if (!isActiveSession(sessionId) || sessionFinalizedRef.current) return;
      const error = event?.error || 'unknown_error';
      if (error === 'aborted') return;
      const transcript = bufferedTranscript();
      if (transcript) {
        recognition.stop?.();
        return;
      }
      if (error === 'no-speech') {
        finalize(sessionId, '', 'empty');
        return;
      }
      if (error === 'audio-capture') {
        finalize(sessionId, '', 'empty');
        return;
      }
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        finalize(sessionId, '', 'empty');
        return;
      }
      finalize(sessionId, '', 'error');
    };
    recognition.onend = () => {
      if (!isActiveSession(sessionId) || sessionFinalizedRef.current) return;
      const transcript = bufferedTranscript();
      finalize(sessionId, transcript, 'completed');
    };
    cleanupTimerRef.current = { sessionId, fire: fireHardTimeout };
    recognition.start();
    return {
      sessionId,
      recognition,
      fireSilenceTimeout,
      fireHardTimeout,
      get transcript() {
        return transcriptRef.current;
      },
      get result() {
        return resultRef.current;
      },
      get activeSessionId() {
        return activeSessionIdRef.current;
      },
      resetSessionState,
      invalidate() {
        activeSessionIdRef.current = ++sessionCounterRef.current;
      },
      dispose() {
        activeSessionIdRef.current = ++sessionCounterRef.current;
        clearTimer(silenceTimerRef);
        clearTimer(cleanupTimerRef);
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.onnomatch = null;
        try {
          recognition.stop?.();
        } catch {
          // ignore
        }
        try {
          recognition.abort?.();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }

  return { start, resetSessionState, state: { finalFragmentsRef, interimTranscriptRef, seenResultKeysRef, hasAnyTranscriptRef, sessionFinalizedRef, recognitionRef, cleanupTimerRef, silenceTimerRef, transcriptRef, resultRef, sessionCounterRef, activeSessionIdRef } };
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

  const bacaanHarness = createBacaanAttemptHarness();
  const attempt1 = bacaanHarness.start();
  assert.equal(FakeRecognition.instances.length, 1, 'First attempt should create one recognition instance.');
  attempt1.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  attempt1.recognition.emitEnd();
  assert.equal(attempt1.transcript, 'Ayah pergi ke pasar', 'Attempt 1 transcript should be preserved.');
  assert.equal(attempt1.result.status, 'completed', 'Attempt 1 should complete successfully.');
  attempt1.dispose();

  const attempt2 = bacaanHarness.start();
  assert.equal(FakeRecognition.instances.length, 2, 'Second attempt should create a fresh recognition instance.');
  attempt2.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  attempt2.recognition.emitEnd();
  assert.equal(attempt2.transcript, 'Ayah pergi ke pasar', 'Attempt 2 should accept the same sentence.');
  assert.equal(attempt2.result.status, 'completed', 'Attempt 2 should also complete successfully.');
  attempt2.dispose();

  const attempt3 = bacaanHarness.start();
  attempt3.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  attempt3.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' }), makeResult({ transcript: 'kemudian ke kedai' })], 1);
  attempt3.recognition.emitEnd();
  assert.equal(attempt3.transcript, 'Ayah pergi ke pasar kemudian ke kedai', 'Multi-sentence attempt should keep both sentences.');
  assert.equal(attempt3.result.status, 'completed', 'Multi-sentence attempt should complete.');
  attempt3.dispose();

  const attempt4 = bacaanHarness.start();
  attempt4.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  attempt4.recognition.emitEnd();
  attempt4.dispose();
  const attempt5 = bacaanHarness.start();
  attempt5.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  attempt5.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' }), makeResult({ transcript: 'kemudian ke kedai' })], 1);
  attempt5.recognition.emitEnd();
  assert.equal(attempt5.transcript, 'Ayah pergi ke pasar kemudian ke kedai', 'Retry after one sentence should still allow two sentences.');
  assert.equal(attempt5.result.status, 'completed', 'Retry attempt should complete.');
  attempt5.dispose();

  const attempt6 = bacaanHarness.start();
  attempt6.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' }), makeResult({ transcript: 'kemudian ke kedai' })], 1);
  attempt6.recognition.emitEnd();
  attempt6.dispose();
  const attempt7 = bacaanHarness.start();
  attempt7.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  attempt7.recognition.emitEnd();
  assert.equal(attempt7.transcript, 'Ayah pergi ke pasar', 'Retry after two sentences should still allow one sentence.');
  attempt7.dispose();

  const attempt8 = bacaanHarness.start();
  const oldOnEndRecognition = attempt8.recognition;
  const attempt9 = bacaanHarness.start();
  oldOnEndRecognition.emitEnd();
  attempt9.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  attempt9.recognition.emitEnd();
  assert.equal(attempt9.transcript, 'Ayah pergi ke pasar', 'Old onend should not interfere with the new attempt.');
  attempt9.dispose();

  const attempt10 = bacaanHarness.start();
  const oldTimeout = attempt10.fireHardTimeout;
  const attempt11 = bacaanHarness.start();
  oldTimeout();
  attempt11.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  attempt11.recognition.emitEnd();
  assert.equal(attempt11.transcript, 'Ayah pergi ke pasar', 'Old timeout should not interfere with the new attempt.');
  attempt11.dispose();

  const attempt12 = bacaanHarness.start();
  attempt12.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  attempt12.recognition.emitEnd();
  attempt12.dispose();
  const attempt13 = bacaanHarness.start();
  attempt13.recognition.emitResult([makeResult({ transcript: 'Ayah pergi ke pasar' })], 0);
  attempt13.recognition.emitEnd();
  assert.equal(attempt13.transcript, 'Ayah pergi ke pasar', 'Identical transcript in a new session should still be accepted.');
  attempt13.dispose();

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
