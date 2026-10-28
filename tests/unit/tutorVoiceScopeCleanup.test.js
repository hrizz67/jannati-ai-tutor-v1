import React from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TutorAIModal from '../../src/components/ai/TutorAIModal.jsx';
import {
  createTutorSpeechInputSession,
  mergeTutorSpeechDraft
} from '../../src/ai/speech/tutorSpeechInput.js';

function harness() {
  let currentContext = 'account-a::child-a::bm::q1';
  let draft = 'Saya ';
  let handlers;
  const updates = [];
  const states = [];
  const notices = [];
  const cancel = vi.fn();
  const stopSpeaking = vi.fn();
  const start = vi.fn(() => ({ started: true }));
  const session = createTutorSpeechInputSession({
    contextKey: currentContext,
    getCurrentContextKey: () => currentContext,
    getDraft: () => draft,
    lang: 'ms-MY',
    onDraftChange(next) { updates.push(next); draft = next; },
    onStateChange(status) { states.push(status); },
    onMessage(message) { notices.push(message); },
    sessionFactory(options) {
      handlers = options;
      return {
        supported: true, start, cancel,
        stop: vi.fn(), getState: () => ({ status: 'listening' })
      };
    },
    stopSpeaking
  });
  return {
    session, get handlers() { return handlers; },
    updates, states, notices, cancel, start, stopSpeaking,
    setContext(value) { currentContext = value; },
    getDraft() { return draft; }
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('P2.5-B Tutor microphone context and manual fallback', () => {
  it('keeps speech as an editable ungraded draft and never submits a quiz answer', () => {
    const h = harness();
    expect(h.session.supported).toBe(true);
    h.session.start();
    expect(h.start).toHaveBeenCalledTimes(1);
    expect(h.stopSpeaking).toHaveBeenCalledTimes(1);
    expect(h.handlers.resultFactory('Kata nama')).toMatchObject({
      correct: false, transcript: 'Kata nama', matchedAnswer: '', acceptedAnswers: []
    });
    h.handlers.onResult({ transcript: 'kata nama' });
    expect(h.getDraft()).toBe('Saya kata nama');
    expect(h.states.at(-1)).toBe('ready');
    expect(h.notices.at(-1)).toContain('Semak dahulu sebelum hantar');
    expect(mergeTutorSpeechDraft('Lepas tu?', 'Lepas tu?')).toBe('Lepas tu?');
  });

  it.each([
    'account-a::child-a::bm::q2',
    'account-a::child-a::english::q1',
    'account-a::child-b::bm::q1',
    'account-b::child-a::bm::q1'
  ])('ignores stale transcript/status and message after context switch to %s', (nextContext) => {
    const h = harness();
    h.session.start();
    h.setContext(nextContext);
    h.handlers.onChange({ status: 'completed', transcript: 'old answer' });
    h.handlers.onResult({ transcript: 'old answer' });
    h.handlers.onEmpty({ message: 'Old microphone error' });
    h.handlers.onError('not-allowed');
    expect(h.updates).toEqual([]);
    expect(h.states).toEqual([]);
    expect(h.notices).toEqual([]);
    expect(h.getDraft()).toBe('Saya ');
    h.session.cancel();
    expect(h.cancel).toHaveBeenCalledTimes(1);
    h.handlers.onResult({ transcript: 'late answer' });
    expect(h.updates).toEqual([]);
  });

  it('preserves typed text and displays recoverable microphone failures', () => {
    const h = harness();
    h.session.start();
    h.handlers.onEmpty({ message: 'Permission denied' });
    expect(h.states.at(-1)).toBe('error');
    expect(h.notices.at(-1)).toBe('Permission denied');
    expect(h.getDraft()).toBe('Saya ');
    h.handlers.onError('aborted');
    expect(h.notices).toHaveLength(1);
    h.handlers.onResult({ unsupported: true });
    expect(h.states.at(-1)).toBe('unsupported');
    h.handlers.onError('not-allowed');
    expect(h.notices.at(-1)).toContain('menaip jawapan');
    expect(h.getDraft()).toBe('Saya ');
  });

  it('cancellation suppresses all late onResult and state updates', () => {
    const h = harness();
    h.session.start();
    h.session.cancel();
    h.session.cancel();
    h.handlers.onChange({ status: 'completed', transcript: 'late' });
    h.handlers.onResult({ transcript: 'late' });
    h.handlers.onEmpty({ message: 'late' });
    expect(h.updates).toEqual([]);
    expect(h.states).toEqual([]);
    expect(h.notices).toEqual([]);
  });

  it('keeps only the newest Q3 transcript after rapid Q1 to Q2 to Q3 cancellation', () => {
    let current = 'account-a::child-a::bm::q1';
    let draft = 'Saya ';
    const updates = [];
    const all = [];
    function makeSession(contextKey) {
      let callbacks;
      const cancel = vi.fn();
      const session = createTutorSpeechInputSession({
        contextKey,
        getCurrentContextKey: () => current,
        getDraft: () => draft,
        onDraftChange(value) { draft = value; updates.push(value); },
        sessionFactory(config) {
          callbacks = config;
          return {
            supported: true,
            start: () => ({ status: 'listening' }),
            stop: vi.fn(),
            cancel
          };
        },
        stopSpeaking: vi.fn()
      });
      const item = { session, cancel, get callbacks() { return callbacks; } };
      all.push(item);
      return item;
    }

    const q1 = makeSession(current);
    q1.session.start();
    current = 'account-a::child-a::bm::q2';
    q1.session.cancel();
    const q2 = makeSession(current);
    q2.session.start();
    current = 'account-a::child-a::bm::q3';
    q2.session.cancel();
    const q3 = makeSession(current);
    q3.session.start();

    q2.callbacks.onResult({ transcript: 'jawapan soalan dua' });
    q1.callbacks.onResult({ transcript: 'jawapan soalan satu' });
    q1.callbacks.onEmpty({ message: 'gagal' });
    q2.callbacks.onError('permission-denied');
    expect(updates).toEqual([]);

    q3.callbacks.onResult({ transcript: 'soalan tiga' });
    expect(updates).toEqual(['Saya soalan tiga']);
    expect(draft).not.toContain('soalan satu');
    expect(draft).not.toContain('soalan dua');
    expect(all.map(item => item.cancel.mock.calls.length)).toEqual([1, 1, 0]);
  });

  it('does not reactivate a cancelled mic or overwrite typed fallback after late native callbacks', () => {
    const h = harness();
    h.session.start();
    h.session.cancel();
    expect(h.session.start()).toBeNull();
    expect(h.session.getState()).toMatchObject({ status: 'listening' });
    h.handlers.onChange({ status: 'completed', transcript: 'stale text' });
    h.handlers.onResult({ transcript: 'stale text' });
    h.handlers.onError('not-allowed');
    expect(h.updates).toEqual([]);
    expect(h.notices).toEqual([]);
    expect(h.states).toEqual([]);
    expect(h.getDraft()).toBe('Saya ');
    expect(h.cancel).toHaveBeenCalledTimes(1);
  });

  it('the Tutor modal actively cancels microphones on exact question/topic/child context changes', () => {
    const source = readFileSync(
      new URL('../../src/components/ai/TutorAIModal.jsx', import.meta.url), 'utf8'
    );
    expect(source).toContain('const requestContextKey =');
    expect(source).toContain('::${activeSubject?.id');
    expect(source).toContain('::${activeTopic?.id');
    const effect = source.slice(
      source.indexOf("  useEffect(() => {"),
      source.indexOf("  useEffect(() => () =>")
    );
    expect(effect).toContain("}, [open, requestContextKey, speechSupported]);");
    expect(effect).toContain("speechSessionRef.current?.cancel?.();");
    expect(effect).toContain("if (speechSupported) setSpeechState('idle');");
    expect(effect).toContain("setSpeechMessage('');");
  });

  it('keeps the typed composer available even without browser Web Speech support', () => {
    vi.stubGlobal('window', { SpeechRecognition: null, webkitSpeechRecognition: null });
    const html = renderToStaticMarkup(React.createElement(TutorAIModal, {
      open: true, selectedSubject: { id: 'bm', title: 'Bahasa Melayu' },
      selectedTopic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      question: { id: 'q1', q: 'Pilih kata nama' }, onTutup() {}
    }));
    expect(html).toContain('placeholder="Tanya Janna..."');
    expect(html).toContain('aria-label="Tanya Janna"');
    expect(html).toContain('>Hantar</button>');
    expect(html).not.toContain('class="secondary tutor-ai-mic-button"');
  });
});
