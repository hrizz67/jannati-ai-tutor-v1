import React, { useRef } from 'react';
import BrandLogo from '../BrandLogo';
import MascotCard from '../MascotCard';
import VoiceButton from '../VoiceButton.jsx';
import { sanitizeChildFacingText } from '../../utils/childText.js';
import { dedupeContent, dedupeSections } from '../../utils/dedupeText.js';
import { renderModalPortal, useModalRuntime } from './modalRuntime.js';

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
  if (Array.isArray(value)) return dedupeContent(value.filter(Boolean).map(item => normalizeText(item, '')).filter(Boolean));
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

export default function AITeacherModal({ open, data, context = null, character = 'jati', onTutup, onLatih }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useModalRuntime({
    open,
    modalRef,
    initialFocusRef: closeButtonRef,
    onClose: onTutup
  });

  if (!open || !data) return null;
  if (context && ((data.generatedMode && data.generatedMode !== 'teach') || (data.sourceQuestionId && data.sourceQuestionId !== context.questionId) || (data.sourceSubjectId && data.sourceSubjectId !== context.subjectId) || (data.sourceTopicId && data.sourceTopicId !== context.topicId))) return null;

  const sections = data.sections && typeof data.sections === 'object' ? data.sections : {};
  const summary = pickMeaningfulText(sections.summary, data.shortText, data.explanation, data.simpleExplanation, context?.questionText ? `Kita belajar melalui soalan: ${context.questionText}` : '');
  const whyCorrect = pickMeaningfulText(sections.whyCorrect, data.explanation, data.simpleExplanation, context?.expectedAnswer ? `Mari hubungkan jawapan ${context.expectedAnswer} dengan soalan.` : '');
  const hint = pickMeaningfulText(sections.hint, data.hint, 'Cari kata kunci penting dalam soalan.');
  const steps = safeList(sections.steps || data.steps);
  const examples = safeList(data.examples);
  const extraExamples = safeList(data.extraExamples);
  const commonMistakes = safeList(sections.commonMistake ? [sections.commonMistake] : data.commonMistakes);
  const memoryTip = pickMeaningfulText(sections.memoryTip, data.memoryTip, data.memoryTips);
  const [uniqueSteps, uniqueExamples, uniqueExtraExamples, uniqueMistakes] = dedupeSections([steps, examples, extraExamples, commonMistakes]);
  const practicePrompt = pickMeaningfulText(sections.practicePrompt, data.practicePrompt, data.followUpQuestions?.[0], 'Cuba sekali lagi selepas membaca penerangan ini.');
  const coachMessage = pickMeaningfulText(sections.coachMessage, data.encouragement, practicePrompt);
  const voiceText = [
    summary,
    whyCorrect,
    hint,
    ...uniqueSteps,
    ...uniqueExamples,
    ...uniqueExtraExamples,
    ...uniqueMistakes,
    memoryTip,
    coachMessage,
    practicePrompt
  ].filter(Boolean).join('. ');

  const modalNode = (
    <div className="ai-explain-overlay" data-modal-open="true">
      <section
        ref={modalRef}
        className="ai-explain-modal ai-teacher-modal ai-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-teacher-title"
        aria-describedby="ai-teacher-description"
        tabIndex={-1}
      >
        <div className="ai-explain-head ai-teacher-head">
          <div className="modal-brand-title">
            <BrandLogo iconOnly size="sm" />
            <div>
              <p className="eyebrow">Janna AI Luar Talian</p>
              <h2 id="ai-teacher-title">Ajar Saya</h2>
              <span className="modal-context-badge">{context?.subjectTitle || 'Semua subjek'}{context?.topicTitle ? ` · ${context.topicTitle}` : ''}</span>
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
          <p className="ai-modal-context-line" id="ai-teacher-description">
            {pickMeaningfulText(summary, whyCorrect, coachMessage, 'Belajar langkah demi langkah dengan Janna AI.')}
          </p>
        </div>

        <div className="ai-explain-body ai-teacher-body" tabIndex="-1">
          <VoiceButton text={voiceText} label="Baca Ajaran" title="Baca penerangan Ajar Saya" className="voice-inline" />
          <section className="explain-section explain-context-card" aria-label="Fokus pembelajaran">
            <h3>Fokus pembelajaran</h3>
            <p>{context?.questionText || 'Ajar Saya membantu kamu belajar semula langkah penting untuk soalan ini.'}</p>
          </section>
          {renderTextSection('Penerangan mudah', summary)}
          {renderTextSection('Kenapa jawapan itu betul', whyCorrect)}

          <MascotCard character={character} mood="teaching" size="md" animation="gentle" message={pickMeaningfulText(whyCorrect, summary, coachMessage, 'Jom belajar langkah demi langkah.')} />

          {renderTextSection('Petunjuk', hint)}
          {renderListSection('Langkah demi langkah', uniqueSteps)}
          {renderListSection('Contoh', uniqueExamples)}

          <details className="explain-details">
            <summary>Lihat panduan tambahan</summary>
            {renderListSection('Contoh lain', uniqueExtraExamples)}
            {renderListSection('Kesilapan biasa', uniqueMistakes)}
            {renderTextSection('Tip ingatan', memoryTip)}
          </details>

          <div className="explain-answer-box">
            <span>Latih semula</span>
            <b style={{ whiteSpace: 'pre-line' }}>{practicePrompt}</b>
          </div>
        </div>

        <div className="ai-explain-footer ai-teacher-footer actions ai-modal-footer" data-modal-footer="true">
          <button type="button" onClick={onLatih}>Latih</button>
          <button className="secondary" type="button" onClick={onTutup}>Tutup</button>
        </div>
      </section>
    </div>
  );

  return renderModalPortal(modalNode);
}
