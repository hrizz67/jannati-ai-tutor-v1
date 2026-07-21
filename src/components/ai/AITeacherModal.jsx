import React, { useEffect, useRef } from 'react';
import BrandLogo from '../BrandLogo';
import MascotCard from '../MascotCard';
import VoiceButton from '../VoiceButton.jsx';
import { sanitizeChildFacingText } from '../../utils/childText.js';

const GENERIC_TEXTS = [
  'jawapan ini sesuai dengan soalan',
  'kita ulang perlahan-lahan',
  'cuba sekali lagi selepas membaca penerangan ini',
  'kamu sedang belajar dengan baik',
  'jangan risau',
  'jom belajar langkah demi langkah'
];

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value)) return normalizeText(value[0], fallback);
  const text = sanitizeChildFacingText(String(value).replace(/\s+/g, ' ').trim());
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function safeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(item => normalizeText(item, '')).filter(Boolean);
  if (value === null || value === undefined || value === '') return [];
  return [normalizeText(value, '')].filter(Boolean);
}

function isGenericText(value = '') {
  const text = normalizeText(value, '');
  if (!text) return true;
  const lower = text.toLowerCase();
  return GENERIC_TEXTS.some(item => lower.includes(item));
}

function pickMeaningfulText(...values) {
  for (const value of values) {
    const text = normalizeText(value, '');
    if (text && !isGenericText(text)) return text;
  }
  return '';
}

function renderListSection(title, items) {
  const filtered = safeList(items).filter(item => !isGenericText(item));
  if (!filtered.length) return null;
  return (
    <section className="explain-section">
      <h3>{title}</h3>
      <ul>{filtered.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul>
    </section>
  );
}

function renderTextSection(title, value) {
  const text = pickMeaningfulText(value);
  if (!text) return null;
  return (
    <section className="explain-section">
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}

export default function AITeacherModal({ open, data, character = 'jati', onTutup, onLatih }) {
  const closeButtonRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => closeButtonRef.current?.focus?.(), 0);
    function onKeyDown(event) {
      if (event.key === 'Escape') onTutup?.();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onTutup]);

  if (!open || !data) return null;

  const sections = data.sections && typeof data.sections === 'object' ? data.sections : {};
  const summary = pickMeaningfulText(sections.summary, data.shortText, data.explanation, data.simpleExplanation, 'Mari kita belajar langkah demi langkah.');
  const whyCorrect = pickMeaningfulText(sections.whyCorrect, data.explanation, data.simpleExplanation);
  const hint = pickMeaningfulText(sections.hint, data.hint, 'Cari kata kunci penting dalam soalan.');
  const steps = safeList(sections.steps || data.steps);
  const examples = safeList(data.examples);
  const extraExamples = safeList(data.extraExamples);
  const commonMistakes = safeList(sections.commonMistake ? [sections.commonMistake] : data.commonMistakes);
  const memoryTip = pickMeaningfulText(sections.memoryTip, data.memoryTip, data.memoryTips);
  const practicePrompt = pickMeaningfulText(sections.practicePrompt, data.practicePrompt, data.followUpQuestions?.[0], 'Cuba sekali lagi selepas membaca penerangan ini.');
  const coachMessage = pickMeaningfulText(sections.coachMessage, data.encouragement, practicePrompt);
  const voiceText = [
    summary,
    whyCorrect,
    hint,
    ...steps,
    ...examples,
    ...extraExamples,
    ...commonMistakes,
    memoryTip,
    coachMessage,
    practicePrompt
  ].filter(Boolean).join('. ');

  const advancedHasContent = steps.length || examples.length || extraExamples.length || commonMistakes.length || memoryTip.length;

  return (
    <div className="ai-explain-overlay" role="dialog" aria-modal="true" aria-label="Guru AI">
      <section className="ai-explain-modal ai-teacher-modal">
        <div className="ai-explain-head">
          <div className="modal-brand-title">
            <BrandLogo iconOnly size="sm" />
            <div>
              <p className="eyebrow">Janna AI Luar Talian</p>
              <h2>Ajar Saya</h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            className="ghost modal-close-button"
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div className="ai-explain-body">
          <VoiceButton text={voiceText} label="Baca Ajaran" title="Baca penerangan Ajar Saya" className="voice-inline" />
          {renderTextSection('Penerangan mudah', summary)}
          {renderTextSection('Kenapa jawapan itu betul', whyCorrect)}

          <MascotCard character={character} mood="teaching" size="md" animation="gentle" message={pickMeaningfulText(whyCorrect, summary, coachMessage, 'Jom belajar langkah demi langkah.')} />

          {renderTextSection('Petunjuk', hint)}
          {renderListSection('Contoh langkah demi langkah', steps)}

          <details className="explain-details">
            <summary>Lihat penerangan lanjut</summary>
            {renderListSection('Contoh', examples)}
            {renderListSection('Contoh lain', extraExamples)}
            {renderListSection('Kesilapan biasa', commonMistakes)}
            {renderTextSection('Tip ingatan', memoryTip)}
          </details>

          <div className="explain-answer-box">
            <span>Latih semula</span>
            <b style={{ whiteSpace: 'pre-line' }}>{practicePrompt}</b>
          </div>
        </div>

        <div className="ai-explain-footer actions">
          <button type="button" onClick={onLatih}>Latih</button>
          <button className="secondary" type="button" onClick={onTutup}>Tutup</button>
        </div>
      </section>
    </div>
  );
}
