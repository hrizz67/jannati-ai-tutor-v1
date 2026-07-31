import React, { useRef } from 'react';
import BrandLogo from '../BrandLogo';
import MascotCard from '../MascotCard';
import VoiceButton from '../VoiceButton.jsx';
import { sanitizeChildFacingText } from '../../utils/childText.js';
import { dedupeContent, dedupeSections } from '../../utils/dedupeText.js';
import { renderModalPortal, useModalRuntime } from './modalRuntime.js';

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

export default function AIExplainModal({ open, data, context = null, question, character = 'jati', onTutup, onTryAgain, onTeach }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useModalRuntime({
    open,
    modalRef,
    initialFocusRef: closeButtonRef,
    onClose: onTutup
  });

  if (!open || !data) return null;
  if (context && ((data.generatedMode && data.generatedMode !== 'explain') || (data.sourceQuestionId && data.sourceQuestionId !== context.questionId) || (data.sourceSubjectId && data.sourceSubjectId !== context.subjectId) || (data.sourceTopicId && data.sourceTopicId !== context.topicId))) return null;

  const sections = data.sections && typeof data.sections === 'object' ? data.sections : {};
  const focus = pickMeaningfulText(sections.focus, sections.summary, 'Fokus pada kemahiran dalam soalan ini.');
  const summary = pickMeaningfulText(sections.simpleExplanation, data.simpleExplanation, sections.summary, data.explanation, 'Penerangan mudah untuk soalan ini.');
  const whyCorrect = pickMeaningfulText(sections.whyCorrect, data.explanation, data.simpleExplanation, context?.expectedAnswer ? `Jawapan perlu dipadankan dengan maksud soalan: ${context.expectedAnswer}.` : '');
  const hint = pickMeaningfulText(sections.hint, data.hint, 'Cari kata kunci penting dalam soalan.');
  const steps = safeList(sections.steps || data.steps);
  const examples = safeList(sections.example ? [sections.example] : data.examples);
  const extraExamples = safeList(data.extraExamples).filter(item => !isGenericText(item));
  const commonMistakes = safeList(sections.commonMistake ? [sections.commonMistake] : data.commonMistakes);
  const memoryTips = safeList(sections.memoryTip ? [sections.memoryTip] : (Array.isArray(data.memoryTips) && data.memoryTips.length ? data.memoryTips : (data.memoryTip ? [data.memoryTip] : [])));
  const followUpQuestions = safeList(data.followUpQuestions);
  const [uniqueSteps, uniqueExamples, uniqueExtraExamples, uniqueMistakes, uniqueMemoryTips, uniqueFollowUps] = dedupeSections([steps, examples, extraExamples, commonMistakes, memoryTips, followUpQuestions]);
  const coachMessage = pickMeaningfulText(sections.coachMessage, data.encouragement, 'Kamu sedang belajar dengan baik.');
  const answerText = pickMeaningfulText(sections.correctAnswer, data.correctAnswer, question?.answer);
  const showCorrectAnswer = data.showCorrectAnswer !== false && Boolean(answerText);

  const voiceText = [
    focus,
    summary,
    whyCorrect,
    hint,
    ...uniqueSteps,
    ...uniqueExamples,
    ...uniqueExtraExamples,
    ...uniqueMistakes,
    ...uniqueMemoryTips,
    ...uniqueFollowUps,
    coachMessage,
    showCorrectAnswer ? `Jawapan betul ${answerText}` : ''
  ].filter(Boolean).join('. ');

  const modalNode = (
    <div className="ai-explain-overlay" data-modal-open="true">
      <section
        ref={modalRef}
        className="ai-explain-modal ai-modal-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-explain-title"
        aria-describedby="ai-explain-description"
        tabIndex={-1}
      >
        <div className="ai-explain-head">
          <div className="modal-brand-title">
            <BrandLogo iconOnly size="sm" />
            <div>
              <p className="eyebrow">Penerangan AI Luar Talian</p>
              <h2 id="ai-explain-title">Terangkan</h2>
              <span className="modal-context-badge">{context?.subjectTitle || 'Semua subjek'}{context?.topicTitle ? ` · ${context.topicTitle}` : ''}</span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            className="ghost modal-close-button"
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            data-close-glyph="times"
          >
            ×
          </button>
          <p className="ai-modal-context-line" id="ai-explain-description">
            {pickMeaningfulText(summary, whyCorrect, hint, 'Penerangan AI membantu kamu faham langkah demi langkah.')}
          </p>
        </div>

        <div className="ai-explain-body" tabIndex="-1">
          <VoiceButton text={voiceText} label="Baca Penerangan" title="Baca penerangan AI" className="voice-inline" />
          <section className="explain-section explain-context-card" aria-label="Konteks penerangan">
            <h3>Fokus penerangan</h3>
            <p>{focus}</p>
          </section>
          {renderTextSection('Penerangan mudah', summary)}
          {renderTextSection('Kenapa jawapan itu betul', whyCorrect)}

          <MascotCard character={character} mood="thinking" size="md" animation="gentle" message={coachMessage} />

          {showCorrectAnswer && (
            <section className="explain-section">
              <h3>Jawapan betul</h3>
              <div className="explain-answer-box">
                <span>Jawapan betul</span>
                <b>{answerText}</b>
              </div>
            </section>
          )}

          {renderListSection('Contoh langkah demi langkah', uniqueSteps)}
          <details className="explain-details">
            <summary>Lihat bahan tambahan</summary>
            {renderListSection('Contoh', uniqueExamples)}
            {renderListSection('Contoh lain', uniqueExtraExamples)}
            {renderListSection('Kesilapan biasa', uniqueMistakes)}
            {renderListSection('Tip ingatan', uniqueMemoryTips)}
            {renderListSection('Soalan susulan', uniqueFollowUps)}
          </details>

        </div>

        <div className="ai-explain-footer actions ai-modal-footer" data-modal-footer="true">
          <button className="secondary" type="button" onClick={onTeach}>Ajar Saya</button>
          <button type="button" onClick={onTryAgain}>Cuba Lagi</button>
          <button className="secondary" type="button" onClick={onTutup}>Tutup</button>
        </div>
      </section>
    </div>
  );

  return renderModalPortal(modalNode);
}
