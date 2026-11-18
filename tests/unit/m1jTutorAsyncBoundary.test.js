/** @vitest-environment jsdom */
/* global window, document */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TutorAIModal from '../../src/components/ai/TutorAIModal.jsx';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

vi.mock('../../src/utils/tutorResponseService.js', () => ({
  getTutorResponse: vi.fn()
}));

vi.mock('../../src/ai/speech/speechEngine.js', () => ({
  supportsSpeechRecognition: () => false
}));

vi.mock('../../src/components/VoiceButton.jsx', () => ({
  default: () => React.createElement('button', { type: 'button' }, 'Dengar')
}));

vi.mock('../../src/components/JannaAvatar.jsx', () => ({
  default: () => React.createElement('span', { 'aria-hidden': 'true' }, 'Janna')
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((next, fail) => {
    resolve = next;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function props(overrides = {}) {
  return {
    open: true,
    conversationKey: 'account-a::child-a::bm::kata-nama::session-a::q1',
    initialMessages: [],
    profile: { studentId: 'child-a', name: 'Murid Sintetik' },
    selectedSubject: { id: 'bm', title: 'Bahasa Melayu' },
    selectedTopic: { id: 'kata-nama', title: 'Kata Nama', learningObjective: 'Mengenal kata nama.' },
    question: { id: 'q1', q: 'Pilih kata nama.', instruction: 'Pilih perkataan yang menamakan benda.', answer: 'buku' },
    onTutup: vi.fn(),
    ...overrides
  };
}

async function flushEffects() {
  await act(async () => {
    await new Promise(resolve => window.setTimeout(resolve, 0));
  });
}

async function typeAndSend(text) {
  const input = document.querySelector('input[aria-label="Tanya Janna"]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    setter.call(input, text);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  await act(async () => {
    input.dispatchEvent(new window.KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', bubbles: true, cancelable: true
    }));
  });
  return input;
}

describe('M1-J Tutor late-response ownership', () => {
  let root;
  let host;
  let currentProps;

  async function renderTutor(overrides = {}) {
    currentProps = props({ ...currentProps, ...overrides });
    await act(async () => root.render(React.createElement(TutorAIModal, currentProps)));
    await flushEffects();
  }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.mocked(getTutorResponse).mockReset();
    document.body.replaceChildren();
    host = document.createElement('div');
    document.body.append(host);
    window.scrollTo = vi.fn();
    root = createRoot(host);
    currentProps = {};
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    document.body.replaceChildren();
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });

  it('MJ-07 drops a child-A reply after switching to child B, including persistence and announcement', async () => {
    const response = deferred();
    const onMessagesChange = vi.fn();
    vi.mocked(getTutorResponse).mockReturnValueOnce(response.promise);
    await renderTutor({ onMessagesChange });
    await typeAndSend('Beri petunjuk untuk soalan ini');

    await renderTutor({
      conversationKey: 'account-a::child-b::bm::kata-nama::session-b::q1',
      profile: { studentId: 'child-b', name: 'Murid Sintetik B' },
      onMessagesChange
    });
    response.resolve({ shortText: 'BALASAN LAPUK MILIK CHILD A' });
    await flushEffects();

    expect(document.body.textContent).not.toContain('BALASAN LAPUK MILIK CHILD A');
    expect(document.querySelector('[data-tutor-announcement="true"]').textContent).toBe('');
    expect(JSON.stringify(onMessagesChange.mock.calls)).not.toContain('BALASAN LAPUK MILIK CHILD A');
  });

  it('MJ-08 blocks an A-to-B-to-A reply from the first A epoch', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValueOnce(response.promise);
    await renderTutor();
    await typeAndSend('Saya tak faham');

    await renderTutor({
      conversationKey: 'account-a::child-b::bm::kata-nama::session-b::q1',
      profile: { studentId: 'child-b', name: 'Murid Sintetik B' }
    });
    await renderTutor({
      conversationKey: 'account-a::child-a::bm::kata-nama::session-a::q1',
      profile: { studentId: 'child-a', name: 'Murid Sintetik' }
    });
    response.resolve({ shortText: 'BALASAN ABA LAPUK' });
    await flushEffects();

    expect(document.body.textContent).not.toContain('BALASAN ABA LAPUK');
    expect(document.querySelector('[data-tutor-announcement="true"]').textContent).toBe('');
  });

  it('MJ-09 keeps a reopened modal and its new draft isolated from an old request', async () => {
    const response = deferred();
    vi.mocked(getTutorResponse).mockReturnValueOnce(response.promise);
    await renderTutor();
    await typeAndSend('Cikgu, sambung balik');
    await renderTutor({ open: false });
    await renderTutor({ open: true });
    const input = document.querySelector('input[aria-label="Tanya Janna"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => {
      setter.call(input, 'Draf selepas buka semula');
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
    });

    response.resolve({ shortText: 'BALASAN SEBELUM MODAL DITUTUP' });
    await flushEffects();

    expect(document.body.textContent).not.toContain('BALASAN SEBELUM MODAL DITUTUP');
    expect(document.querySelector('input[aria-label="Tanya Janna"]').value)
      .toBe('Draf selepas buka semula');
    expect(document.querySelector('[data-tutor-announcement="true"]').textContent).toBe('');
  });
});
