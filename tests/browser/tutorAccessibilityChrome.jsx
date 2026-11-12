// Chromium-only QA harness. Never navigate to production, authenticate, or
// transmit real learner data. This is deliberately not part of the public UI.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import TutorAIModal from '../../src/components/ai/TutorAIModal.jsx';
import '../../src/styles/style.css';

const output = document.getElementById('results');
const opener = document.getElementById('qa-opener');
const root = createRoot(document.getElementById('qa-host'));
const lines = [];
let externalRequests = 0;

function assert(test, description) {
  if (!test) throw new Error(description);
}
function pass(message) {
  lines.push('PASS ' + message);
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate, description, limit = 6000) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > limit) throw new Error(description);
    await wait(25);
  }
}
const baseProfile = Object.freeze({ studentId: 'synthetic-chrome-qa-only', name: 'Pelajar Sintetik' });
const messages = Array.from({ length: 16 }, (_, i) => ({
  role: i % 2 === 0 ? 'user' : 'ai',
  text: (i % 2 === 0 ? 'Cikgu, boleh terangkan langkah ini? ' :
    'Cuba baca arahan dahulu dan fikir tentang petunjuk yang jelas. ').repeat(8),
  suggestions: []
}));

async function mount(subjectId, title) {
  flushSync(() => root.render(null));
  opener.focus();
  const key = 'synthetic-browser-f2::' + subjectId;
  flushSync(() => root.render(
    <TutorAIModal
      key={key}
      open
      conversationKey={key}
      initialMessages={messages}
      profile={baseProfile}
      adaptiveProfile={baseProfile}
      selectedSubject={{ id: subjectId, title }}
      selectedTopic={{ id: 'synthetic-topic', title: 'Topik Sintetik' }}
      question={{
        id: 'synthetic-question',
        q: subjectId === 'arab' ? 'اختر اسم المكان.' : 'Pilih perkataan yang menamakan tempat.',
        instruction: subjectId === 'arab' ? 'اقرأ السؤال' : 'Baca soalan ini.',
        answer: 'KUNCI-JAWAPAN-SINTETIK'
      }}
      onTutup={() => flushSync(() => root.render(null))}
    />
  ));
  await until(() => document.querySelector('#tutor-ai-body'), 'Tutor transcript was not mounted');
  await until(() => document.activeElement?.getAttribute('aria-label') === 'Tutup',
    'Initial focus did not reach close button');
  return {
    dialog: document.querySelector('[role="dialog"][aria-modal="true"]'),
    transcript: document.getElementById('tutor-ai-body'),
    input: document.querySelector('input[aria-label="Tanya Janna"]')
  };
}

async function audit() {
  // Block application-level outbound fetch/XHR. Vite HMR localhost traffic
  // is allowed; no Supabase, STT, AI or production traffic is permitted.
  const originalFetch = window.fetch.bind(window);
  window.fetch = (resource, options) => {
    const dest = new URL(typeof resource === 'string' ? resource : resource.url, location.href);
    if (dest.origin !== location.origin) {
      externalRequests += 1;
      throw new Error('External request blocked in QA: ' + dest.origin);
    }
    return originalFetch(resource, options);
  };
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    const dest = new URL(url, location.href);
    if (dest.origin !== location.origin) {
      externalRequests += 1;
      throw new Error('External XHR blocked in QA');
    }
    return originalOpen.call(this, method, url, ...args);
  };

  const cases = [
    { id: 'bm', title: 'Bahasa Melayu', label: 'Sejarah perbualan Tutor AI', lang: 'ms' },
    { id: 'english', title: 'English', label: 'Tutor AI conversation history', lang: 'en' },
    { id: 'arab', title: 'Bahasa Arab', label: 'سجل محادثة المعلّم الذكي', lang: 'ar' }
  ];
  for (const subject of cases) {
    const { dialog, transcript, input } = await mount(subject.id, subject.title);
    assert(dialog && transcript && input, subject.id + ': missing dialog / transcript / composer');
    assert(transcript.getAttribute('role') === 'region', subject.id + ': missing region role');
    assert(transcript.getAttribute('aria-label') === subject.label, subject.id + ': incorrect label');
    assert(transcript.tabIndex === 0, subject.id + ': transcript not tabbable');
    assert(getComputedStyle(transcript).overflowY === 'auto', subject.id + ': scroll overflow is not auto');
    assert(transcript.scrollHeight > transcript.clientHeight, subject.id + ': transcript cannot scroll');
    assert(input.lang === subject.lang && input.dir === 'auto', subject.id + ': composer language/dir wrong');
    assert(dialog.contains(document.activeElement), subject.id + ': focus escaped dialog');
    assert([...document.querySelectorAll('[aria-live="polite"]')].length === 1,
      subject.id + ': duplicate live announcers');
    assert(!dialog.textContent.includes('KUNCI-JAWAPAN-SINTETIK'),
      subject.id + ': synthetic expected answer was exposed');

    for (const button of dialog.querySelectorAll('.tutor-ai-tool-button')) {
      assert(button.getBoundingClientRect().height >= 43.5,
        subject.id + ': tool button below 44px height');
    }
    const composerSend = [...dialog.querySelectorAll('.ai-chat-input button')]
      .find(button => button.textContent.trim() === 'Hantar');
    assert(composerSend && composerSend.getBoundingClientRect().height >= 43.5,
      subject.id + ': send control below 44px');
    transcript.focus();
    assert(document.activeElement === transcript, subject.id + ': browser did not focus transcript');
    transcript.scrollTop = Math.min(180, transcript.scrollHeight - transcript.clientHeight);
    await wait(30);
    assert(transcript.scrollTop > 0, subject.id + ': keyboard-focusable scroll region could not scroll');

    // Empty composer intentionally disables Send; it is not a valid Tab stop.
    // Find the final *enabled and visible* control, matching modalRuntime.js.
    const tabbables = [...dialog.querySelectorAll(
      'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'
    )].filter(element => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    const finalControl = tabbables.at(-1);
    assert(finalControl, subject.id + ': no final keyboard focusable control');
    finalControl.focus();
    assert(document.activeElement === finalControl, subject.id + ': focus did not reach final control');
    window.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'Tab', bubbles: true, cancelable: true }));
    assert(document.activeElement?.getAttribute('aria-label') === 'Tutup',
      subject.id + ': forward Tab trap did not wrap to close');
    pass(subject.id + ': region, scroll, focus, live announcement, language and targets');
  }

  // Geometric check in the real browser renderer (not JSDOM).
  const { dialog, transcript } = await mount('bm', 'Bahasa Melayu');
  const bounds = dialog.getBoundingClientRect();
  assert(bounds.width > 0 && bounds.height > 0, 'Modal has zero dimensions');
  assert(bounds.left >= -1 && bounds.right <= innerWidth + 1, 'Modal overflows viewport horizontally');
  const sections = [...dialog.children].map(element => ({
    className: element.className,
    height: Math.round(element.getBoundingClientRect().height),
    minHeight: getComputedStyle(element).minHeight,
    display: getComputedStyle(element).display
  }));
  assert(transcript.getBoundingClientRect().height >= 50,
    'Reading pane collapsed: ' + JSON.stringify({
      viewport: [innerWidth, innerHeight],
      shell: [Math.round(bounds.width), Math.round(bounds.height)],
      pane: Math.round(transcript.getBoundingClientRect().height),
      rows: getComputedStyle(dialog).gridTemplateRows,
      sections
    }));
  assert(document.documentElement.scrollWidth <= innerWidth + 2, 'Document has horizontal overflow');
  pass('Chromium geometry: viewport ' + innerWidth + 'x' + innerHeight +
    ', modal ' + Math.round(bounds.width) + 'x' + Math.round(bounds.height));

  flushSync(() => root.render(null));
  await wait(20);
  assert(document.activeElement === opener, 'Closing Tutor did not restore opener focus');
  assert(externalRequests === 0, 'External network request was attempted');
  pass('Focus restoration and zero external application requests');
  output.dataset.browserSmoke = 'pass';
  output.textContent = 'CHROMIUM_TUTOR_QA_PASS (' + lines.length + ' checks)\n' + lines.join('\n');
}

audit().catch(error => {
  flushSync(() => root.render(null));
  output.dataset.browserSmoke = 'fail';
  output.textContent = 'CHROMIUM_TUTOR_QA_FAIL: ' + (error?.message || String(error)) +
    '\n' + lines.join('\n');
});
