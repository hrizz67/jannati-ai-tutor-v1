/** @vitest-environment jsdom */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TutorAIModal from '../../src/components/ai/TutorAIModal.jsx';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const speechBackends = vi.hoisted(() => []);

vi.mock('../../src/utils/tutorResponseService.js', () => ({
  getTutorResponse: vi.fn()
}));

vi.mock('../../src/ai/speech/speechEngine.js', () => ({
  supportsSpeechRecognition: () => true,
  cancelActiveSpeechRecognition: vi.fn(),
  mergeSpeechTranscript(current = '', transcript = '') {
    return [current, transcript].map(value => String(value || '').trim()).filter(Boolean).join(' ');
  },
  createSpeechSession: vi.fn(options => {
    const backend = {
      options,
      start: vi.fn(() => ({ status: 'listening' })),
      stop: vi.fn(),
      cancel: vi.fn(),
      getState: vi.fn(() => ({ status: 'listening' }))
    };
    speechBackends.push(backend);
    return { supported: true, ...backend };
  })
}));

vi.mock('../../src/components/VoiceButton.jsx', () => ({
  default: ({ label = 'Dengar' }) => <button type="button">{label}</button>
}));

vi.mock('../../src/components/JannaAvatar.jsx', () => ({
  default: () => <span aria-hidden="true">Janna</span>
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function tutorProps(overrides = {}) {
  return {
    open: true,
    conversationKey: 'account-a::child-a::bm::kata-nama::session-a::q1',
    initialMessages: [],
    profile: { studentId: 'child-a', name: 'Aina' },
    adaptiveProfile: { studentId: 'child-a', name: 'Aina' },
    selectedSubject: { id: 'bm', title: 'Bahasa Melayu' },
    selectedTopic: { id: 'kata-nama', title: 'Kata Nama', learningObjective: 'Mengenal kata nama.' },
    question: { id: 'q1', q: 'Apakah kata nama?', instruction: 'Terangkan maksud.', answer: 'nama' },
    onTutup: vi.fn(),
    ...overrides
  };
}

async function flushEffects() {
  await act(async () => {
    await new Promise(resolve => window.setTimeout(resolve, 0));
  });
}

async function setInputValue(input, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    valueSetter.call(input, value);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

async function pressEnter(input) {
  await act(async () => {
    input.dispatchEvent(new window.KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      cancelable: true
    }));
  });
}

describe('P2.5-C1 mounted Tutor accessibility and focus reliability', () => {
  let container;
  let opener;
  let root;
  let currentProps;

  async function renderTutor(overrides = {}) {
    currentProps = tutorProps({ ...currentProps, ...overrides });
    await act(async () => {
      root.render(<TutorAIModal {...currentProps} />);
    });
    await flushEffects();
  }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    speechBackends.length = 0;
    vi.mocked(getTutorResponse).mockReset();
    document.body.replaceChildren();
    opener = document.createElement('button');
    opener.textContent = 'Buka Tutor';
    document.body.append(opener);
    container = document.createElement('div');
    document.body.append(container);
    opener.focus();
    window.scrollTo = vi.fn();
    root = createRoot(container);
    currentProps = {};
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.replaceChildren();
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });

  it('announces only the appended Tutor reply and preserves focus plus a newly typed draft', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor();

    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    const body = document.querySelector('#tutor-ai-body');
    const announcer = document.querySelector('[data-tutor-announcement="true"]');
    expect(announcer).not.toBeNull();
    expect(announcer).toHaveProperty('textContent', '');
    expect(document.querySelectorAll('[data-tutor-announcement="true"]')).toHaveLength(1);

    input.focus();
    await setInputValue(input, 'Terangkan kata nama');
    await pressEnter(input);

    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(announcer.textContent).toBe('Tutor AI sedang menaip...');
    expect(document.querySelector('.chat-status-loading').hasAttribute('aria-live')).toBe(false);

    await setInputValue(input, 'Draf soalan seterusnya');
    expect(document.activeElement).toBe(input);
    response.resolve({ shortText: 'Kata nama ialah nama orang, haiwan, benda atau tempat.' });
    await flushEffects();

    expect(input.value).toBe('Draf soalan seterusnya');
    expect(document.activeElement).toBe(input);
    expect(document.activeElement).not.toBe(body);
    expect(announcer.textContent).toBe('Kata nama ialah nama orang, haiwan, benda atau tempat.');
    expect(announcer.getAttribute('role')).toBe('status');
    expect(announcer.getAttribute('aria-live')).toBe('polite');
    expect(announcer.getAttribute('aria-atomic')).toBe('true');
  });

  it('restores the submitted draft after async failure when the composer was untouched', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor();

    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    input.focus();
    await setInputValue(input, 'Draf A');
    await pressEnter(input);
    expect(input.value).toBe('');

    response.reject(new Error('offline'));
    await flushEffects();

    expect(input.value).toBe('Draf A');
    expect(document.activeElement).toBe(input);
    expect(document.querySelector('[data-tutor-announcement="true"]').textContent)
      .toBe('Saya belum memahami soalan itu dengan tepat. Cuba tanya semula dengan ayat lain.');
  });

  it('preserves a replacement draft after the submitted request fails', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor();

    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    await setInputValue(input, 'Draf A');
    await pressEnter(input);
    await setInputValue(input, 'Draf B');

    response.reject(new Error('offline'));
    await flushEffects();

    expect(input.value).toBe('Draf B');
  });

  it('preserves a deliberate blank after a replacement draft is typed then deleted', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor();

    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    await setInputValue(input, 'Draf A');
    await pressEnter(input);
    await setInputValue(input, 'Draf B');
    await setInputValue(input, '');

    response.reject(new Error('offline'));
    await flushEffects();

    expect(input.value).toBe('');
  });

  it('does not restore a submitted draft when its failed request is stale after a context switch', async () => {
    const q1Response = deferred();
    vi.mocked(getTutorResponse).mockReturnValueOnce(q1Response.promise);
    await renderTutor();

    const q1Input = document.querySelector('input[aria-label="Tanya Janna"]');
    await setInputValue(q1Input, 'Draf A untuk Q1');
    await pressEnter(q1Input);

    await renderTutor({
      conversationKey: 'account-a::child-a::bm::kata-nama::session-a::q2',
      question: {
        id: 'q2',
        q: 'Pilih kata nama am.',
        instruction: 'Pilih jawapan yang betul.',
        answer: 'sekolah'
      }
    });
    q1Response.reject(new Error('stale offline failure'));
    await flushEffects();

    expect(document.querySelector('input[aria-label="Tanya Janna"]').value).toBe('');
    expect(document.querySelector('[data-tutor-announcement="true"]').textContent).toBe('');
    expect(document.querySelector('.chat-status-error')).toBeNull();
  });

  it('does not announce hydrated history or duplicate visible loading and error status regions', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor({
      initialMessages: [
        { role: 'user', text: 'Soalan lama' },
        { role: 'ai', text: 'Jawapan lama', suggestions: [] }
      ]
    });

    const announcer = document.querySelector('[data-tutor-announcement="true"]');
    expect(document.body.textContent).toContain('Jawapan lama');
    expect(announcer.textContent).toBe('');
    expect(document.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);

    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    input.focus();
    await setInputValue(input, 'Boleh cuba lagi?');
    await pressEnter(input);
    expect(announcer.textContent).toBe('Tutor AI sedang menaip...');

    response.reject(new Error('offline'));
    await flushEffects();
    expect(announcer.textContent).toBe('Saya belum memahami soalan itu dengan tepat. Cuba tanya semula dengan ayat lain.');
    expect(document.querySelector('.chat-status-error').hasAttribute('aria-live')).toBe(false);
    expect(document.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
  });

  it('keeps initial focus, focus trap, close restoration and body scroll lifecycle reliable', async () => {
    await renderTutor();
    const closeButton = document.querySelector('button[aria-label="Tutup"]');
    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    expect(document.activeElement).toBe(closeButton);
    expect(document.body.style.position).toBe('fixed');

    input.focus();
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(closeButton);
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(input);

    await renderTutor({ open: false });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.position).toBe('');
  });

  it('discards stale async replies and announcements after an exact-question context switch', async () => {
    const q1Response = deferred();
    vi.mocked(getTutorResponse).mockReturnValueOnce(q1Response.promise);
    await renderTutor();

    const q1Input = document.querySelector('input[aria-label="Tanya Janna"]');
    q1Input.focus();
    await setInputValue(q1Input, 'Soalan untuk Q1');
    await pressEnter(q1Input);
    expect(document.querySelector('[data-tutor-announcement="true"]').textContent).toBe('Tutor AI sedang menaip...');

    await renderTutor({
      conversationKey: 'account-a::child-a::bm::kata-nama::session-a::q2',
      question: {
        id: 'q2',
        q: 'Pilih kata nama am.',
        instruction: 'Pilih jawapan yang betul.',
        answer: 'sekolah'
      }
    });
    expect(document.querySelector('[data-tutor-announcement="true"]').textContent).toBe('');

    q1Response.resolve({ shortText: 'BALASAN LAPUK Q1' });
    await flushEffects();
    expect(document.body.textContent).not.toContain('BALASAN LAPUK Q1');
    expect(document.querySelector('[data-tutor-announcement="true"]').textContent).toBe('');
  });

  it('cancels the mounted microphone on context change and preserves typed fallback after late callbacks', async () => {
    await renderTutor();
    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    await setInputValue(input, 'Jawapan taip saya');
    const micButton = document.querySelector('.tutor-ai-mic-button');
    await act(async () => micButton.click());

    const q1Speech = speechBackends.at(-1);
    expect(q1Speech.start).toHaveBeenCalledTimes(1);
    await act(async () => q1Speech.options.onError('not-allowed'));
    await flushEffects();
    expect(input.value).toBe('Jawapan taip saya');
    expect(document.querySelector('.tutor-ai-mic-status').textContent).toContain('masih boleh menaip');

    await renderTutor({
      conversationKey: 'account-a::child-a::bm::kata-nama::session-a::q2',
      question: {
        id: 'q2',
        q: 'Soalan baharu',
        instruction: 'Jawab soalan baharu.',
        answer: 'jawapan'
      }
    });
    expect(q1Speech.cancel).toHaveBeenCalledTimes(1);
    await act(async () => q1Speech.options.onResult({ transcript: 'transkrip lapuk' }));
    await flushEffects();
    expect(document.querySelector('input[aria-label="Tanya Janna"]').value).not.toContain('transkrip lapuk');
    expect(document.querySelector('.tutor-ai-mic-status')).toBeNull();
  });

  it('anchors a long new Tutor response at its beginning without jumping to the bottom', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor();

    const body = document.querySelector('#tutor-ai-body');
    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 1900 });
    Object.defineProperty(body, 'clientHeight', { configurable: true, value: 360 });
    const rectSpy = vi.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function () {
        if (this.id === 'tutor-ai-body') return { top: 100, bottom: 460, height: 360 };
        if (this.classList.contains('chat-bubble') && this.classList.contains('ai')) {
          return { top: 330, bottom: 850, height: 520 };
        }
        return { top: 0, bottom: 0, height: 0 };
      });
    try {
      body.scrollTop = 360;
      await setInputValue(input, 'Cikgu, terangkan perlahan-lahan');
      await pressEnter(input);
      expect(body.scrollTop).toBe(360);
      response.resolve({ shortText: 'Ini penerangan panjang yang mesti dibaca dari ayat pertama.' });
      await flushEffects();
      expect(body.scrollTop).toBe(578);
      expect(body.scrollTop).not.toBe(body.scrollHeight);
      expect(document.activeElement).not.toBe(body);
    } finally {
      rectSpy.mockRestore();
    }
  });

  it('keeps a fully visible short reply in place without disturbing reading continuity', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor();
    const body = document.querySelector('#tutor-ai-body');
    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    body.scrollTop = 360;
    const spy = vi.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function () {
        if (this.id === 'tutor-ai-body') return { top: 100, bottom: 460, height: 360 };
        if (this.classList.contains('chat-bubble') && this.classList.contains('ai')) {
          return { top: 330, bottom: 415, height: 85 };
        }
        return { top: 0, bottom: 0, height: 0 };
      });
    try {
      await setInputValue(input, 'Apakah kata nama?');
      await pressEnter(input);
      response.resolve({ shortText: 'Kata nama ialah nama orang, tempat, benda atau haiwan.' });
      await flushEffects();
      expect(body.scrollTop).toBe(360);
      expect(document.querySelector('.tutor-ai-new-reply-button')).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it('reveals only the hidden bottom of a partly visible short reply', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor();
    const body = document.querySelector('#tutor-ai-body');
    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    body.scrollTop = 360;
    const spy = vi.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function () {
        if (this.id === 'tutor-ai-body') return { top: 100, bottom: 460, height: 360 };
        if (this.classList.contains('chat-bubble') && this.classList.contains('ai')) {
          return { top: 350, bottom: 480, height: 130 };
        }
        return { top: 0, bottom: 0, height: 0 };
      });
    try {
      await setInputValue(input, 'Beri petunjuk');
      await pressEnter(input);
      response.resolve({ shortText: 'Cari perkataan yang menunjukkan tempat.' });
      await flushEffects();
      expect(body.scrollTop).toBe(392);
    } finally {
      spy.mockRestore();
    }
  });

  it('ignores delayed programmatic scroll events after switching question context', async () => {
    await renderTutor();
    const body = document.querySelector('#tutor-ai-body');
    Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(body, 'clientHeight', { configurable: true, value: 360 });
    body.scrollTop = 600;
    await renderTutor({
      conversationKey: 'account-a::child-a::bm::kata-nama::session-a::q2',
      question: { id: 'q2', q: 'Pilih tempat.', answer: 'taman' }
    });
    expect(body.scrollTop).toBe(0);
    await act(async () => body.dispatchEvent(new window.Event('scroll', { bubbles: true })));
    expect(document.querySelector('.tutor-ai-new-reply-button')).toBeNull();
  });

  it('does not steal a manual scroll-up position while Tutor reply is pending', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor();

    const body = document.querySelector('#tutor-ai-body');
    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(body, 'clientHeight', { configurable: true, value: 360 });
    await setInputValue(input, 'Tolong bagi contoh');
    await pressEnter(input);
    body.scrollTop = 120;
    await act(async () => {
      body.dispatchEvent(new window.Event('touchstart', { bubbles: true }));
      body.dispatchEvent(new window.Event('scroll', { bubbles: true }));
    });
    response.resolve({ shortText: 'Balasan baru selepas murid scroll ke atas.' });
    await flushEffects();
    expect(body.scrollTop).toBe(120);
    const notice = document.querySelector('.tutor-ai-new-reply-button');
    expect(notice.textContent).toContain('Balasan baharu');
    notice.focus();
    expect(document.activeElement).toBe(notice);
    await act(async () => notice.click());
    const dialog = document.querySelector('[role="dialog"]');
    const replies = document.querySelectorAll('#tutor-ai-body .chat-bubble.ai:not(.chat-bubble-loading)');
    const latestReply = replies[replies.length - 1];
    expect(document.querySelector('.tutor-ai-new-reply-button')).toBeNull();
    expect(document.activeElement).toBe(latestReply);
    expect(latestReply.tabIndex).toBe(-1);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('keeps keyboard focus inside modal after a focused new-reply button unmounts', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor();

    const body = document.querySelector('#tutor-ai-body');
    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    const dialog = document.querySelector('[role="dialog"]');
    const closeButton = document.querySelector('button[aria-label="Tutup"]');
    const outsideButton = opener;
    Object.defineProperty(body, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(body, 'clientHeight', { configurable: true, value: 360 });

    await setInputValue(input, 'Terangkan satu langkah');
    await pressEnter(input);
    await setInputValue(input, 'Draf baru yang belum dihantar');
    body.scrollTop = 120;
    await act(async () => {
      body.dispatchEvent(new window.Event('touchstart', { bubbles: true }));
      body.dispatchEvent(new window.Event('scroll', { bubbles: true }));
    });
    response.resolve({ shortText: 'Baca petunjuk pertama dahulu.' });
    await flushEffects();

    const button = document.querySelector('.tutor-ai-new-reply-button');
    expect(button).not.toBeNull();
    button.focus();
    expect(document.activeElement).toBe(button);
    await act(async () => button.click());

    const replies = document.querySelectorAll('#tutor-ai-body .chat-bubble.ai:not(.chat-bubble-loading)');
    const lastReply = replies[replies.length - 1];
    expect(document.querySelector('.tutor-ai-new-reply-button')).toBeNull();
    expect(document.activeElement).toBe(lastReply);
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(document.body);
    expect(input.value).toBe('Draf baru yang belum dihantar');

    // JSDOM does not synthesize native Tab traversal. Verify the adjacent
    // focusable target is in the modal, then the modal's last-control trap.
    const nextFocusable = lastReply.querySelector('button:not([disabled])');
    expect(nextFocusable).not.toBeNull();
    nextFocusable.focus();
    expect(dialog.contains(document.activeElement)).toBe(true);

    const sendButton = dialog.querySelector('.ai-chat-input button:last-of-type');
    expect(sendButton).not.toBeNull();
    sendButton.focus();
    await act(async () => {
      window.dispatchEvent(new window.KeyboardEvent('keydown', {
        key: 'Tab', bubbles: true, cancelable: true
      }));
    });
    expect(document.activeElement).toBe(closeButton);
    expect(document.activeElement).not.toBe(outsideButton);
  });

  it('does not jump when loading changes or Tutor tool panels are toggled', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValue(response.promise);
    await renderTutor();

    const body = document.querySelector('#tutor-ai-body');
    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    body.scrollTop = 175;
    await act(async () => document.querySelector('.tutor-ai-tool-button[aria-expanded]')?.click());
    expect(body.scrollTop).toBe(175);
    await setInputValue(input, 'Saya perlukan petunjuk');
    await pressEnter(input);
    expect(body.scrollTop).toBe(175);
    response.resolve({ shortText: 'Petunjuk ialah...' });
    await flushEffects();
  });

  it('starts a new question context at the question, not the prior chat bottom', async () => {
    await renderTutor();
    const body = document.querySelector('#tutor-ai-body');
    body.scrollTop = 430;
    await renderTutor({
      conversationKey: 'account-a::child-a::bm::kata-nama::session-a::q2',
      question: { id: 'q2', q: 'Cari kata nama bagi tempat.', answer: 'taman' }
    });
    expect(body.scrollTop).toBe(0);
    expect(document.querySelector('.ai-chat-context-card').textContent).toContain('Cari kata nama bagi tempat.');
  });

  it.each([
    ['bm', 'Bahasa Melayu', 'ms', 'Apakah kata nama?', 'Kata nama ialah nama benda.', 'ltr'],
    ['english', 'English', 'en', 'What is a noun?', 'A noun names a person, place or thing.', 'ltr'],
    ['arab', 'Bahasa Arab', 'ar', 'مَا هَذَا؟', 'هَذَا كِتَابٌ', 'rtl']
  ])('uses accessible composer and announcement language semantics for %s', async (subjectId, title, language, questionText, reply, direction) => {
    vi.mocked(getTutorResponse).mockResolvedValue({ shortText: reply });
    await renderTutor({
      conversationKey: `account-a::child-a::${subjectId}::topic::session-a::q1`,
      selectedSubject: { id: subjectId, title },
      selectedTopic: { id: 'topic', title, learningObjective: questionText },
      question: {
        id: 'q1',
        q: questionText,
        instruction: questionText,
        answer: 'approved-answer'
      }
    });

    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    expect(input.getAttribute('lang')).toBe(language);
    expect(input.getAttribute('dir')).toBe('auto');
    input.focus();
    await setInputValue(input, questionText);
    await pressEnter(input);
    await flushEffects();

    const announcer = document.querySelector('[data-tutor-announcement="true"]');
    expect(announcer.textContent).toBe(reply);
    expect(announcer.getAttribute('lang')).toBe(language);
    expect(announcer.getAttribute('dir')).toBe(direction);
  });
});
