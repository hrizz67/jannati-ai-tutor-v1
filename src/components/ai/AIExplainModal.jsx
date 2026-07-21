import React, { useEffect, useRef } from 'react';
import BrandLogo from '../BrandLogo';
import MascotCard from '../MascotCard';
import VoiceButton from '../VoiceButton.jsx';
import { sanitizeChildFacingText } from '../../utils/childText.js';

const GENERIC_TEXTS = [
  'jawapan ini sesuai dengan soalan',
  'cari kata kunci penting dalam soalan',
  'baca soalan perlahan-lahan dan cari kata kunci',
  'kamu sedang belajar dengan baik',
  'tak mengapa kita cuba sekali lagi',
  'bagus teruskan usaha kamu',
  'jangan risau',
  'jom kita fahami bersama'
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

export default function AIExplainModal({ open, data, question, character = 'jati', onTutup, onTryAgain, onTeach }) {
  const closeButtonRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const onTutupRef = useRef(onTutup);

  onTutupRef.current = onTutup;

  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => closeButtonRef.current?.focus?.(), 0);
    function onKeyDown(event) {
      if (event.key === 'Escape') onTutupRef.current?.();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open || !data) return null;

  const sections = data.sections && typeof data.sections === 'object' ? data.sections : {};
  const summary = pickMeaningfulText(sections.summary, data.shortText, data.explanation, data.simpleExplanation, `Mari kita semak soalan ini bersama-sama.`);
  const whyCorrect = pickMeaningfulText(sections.whyCorrect, data.explanation, data.simpleExplanation);
  const hint = pickMeaningfulText(sections.hint, data.hint, 'Cari kata kunci penting dalam soalan.');
  const steps = safeList(sections.steps || data.steps);
  const examples = safeList(sections.example ? [sections.example] : data.examples);
  const extraExamples = safeList(data.extraExamples).filter(item => !isGenericText(item));
  const commonMistakes = safeList(sections.commonMistake ? [sections.commonMistake] : data.commonMistakes);
  const memoryTips = safeList(sections.memoryTip ? [sections.memoryTip] : (Array.isArray(data.memoryTips) && data.memoryTips.length ? data.memoryTips : (data.memoryTip ? [data.memoryTip] : [])));
  const followUpQuestions = safeList(data.followUpQuestions);
  const coachMessage = pickMeaningfulText(sections.coachMessage, data.encouragement, 'Kamu sedang belajar dengan baik.');
  const answerText = pickMeaningfulText(sections.correctAnswer, data.correctAnswer, question?.answer);
  const showCorrectAnswer = data.showCorrectAnswer !== false && Boolean(answerText);

  const voiceText = [
    summary,
    whyCorrect,
    hint,
    ...steps,
    ...examples,
    ...extraExamples,
    ...commonMistakes,
    ...memoryTips,
    ...followUpQuestions,
    coachMessage,
    showCorrectAnswer ? `Jawapan betul ${answerText}` : ''
  ].filter(Boolean).join('. ');

  const advancedHasContent = steps.length || examples.length || extraExamples.length || commonMistakes.length || memoryTips.length || followUpQuestions.length;

  return (
    <div className="ai-explain-overlay" role="dialog" aria-modal="true" aria-label="Penerangan AI">
      <section className="ai-explain-modal">
        <div className="ai-explain-head">
          <div className="modal-brand-title">
            <BrandLogo iconOnly size="sm" />
            <div>
              <p className="eyebrow">Penerangan AI Luar Talian</p>
              <h2>Terangkan</h2>
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
          <VoiceButton text={voiceText} label="Baca Penerangan" title="Baca penerangan AI" className="voice-inline" />
          {renderTextSection('Penerangan mudah', summary)}
          {renderTextSection('Kenapa jawapan itu betul', whyCorrect)}

          <MascotCard character={character} mood="thinking" size="md" animation="gentle" message={pickMeaningfulText(whyCorrect, hint, summary, coachMessage, 'Jom kita fahami bersama.')} />

          {renderTextSection('Petunjuk', hint)}

          {showCorrectAnswer && (
            <section className="explain-section">
              <h3>Jawapan betul</h3>
              <div className="explain-answer-box">
                <span>Jawapan betul</span>
                <b>{answerText}</b>
              </div>
            </section>
          )}

          <details className="explain-details">
            <summary>Lihat penerangan lanjut</summary>
          {renderListSection('Contoh langkah demi langkah', steps)}
            {renderListSection('Contoh', examples)}
            {renderListSection('Contoh lain', extraExamples)}
            {renderListSection('Kesilapan biasa', commonMistakes)}
            {renderListSection('Tip ingatan', memoryTips)}
            {renderListSection('Soalan susulan', followUpQuestions)}
          </details>

          <p className="explain-encouragement">{pickMeaningfulText(coachMessage, whyCorrect, summary)}</p>
        </div>

        <div className="ai-explain-footer actions">
          <button className="secondary" type="button" onClick={onTeach}>Ajar Saya</button>
          <button type="button" onClick={onTryAgain}>Cuba Lagi</button>
          <button className="secondary" type="button" onClick={onTutup}>Tutup</button>
        </div>
      </section>
    </div>
  );
}
