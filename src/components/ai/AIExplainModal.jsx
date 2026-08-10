import React, { useEffect, useRef } from 'react';
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

function comparableText(value = '') {
  return normalizeText(value, '')
    .toLowerCase()
    .replace(/[“”"'.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickDistinctMeaningfulText(primary, excluded, ...fallbacks) {
  const excludedKey = comparableText(excluded);
  return pickMeaningfulText(
    ...[primary, ...fallbacks].filter(value => comparableText(value) !== excludedKey)
  );
}

function isLikelyMalay(value = '') {
  return /\b(jawapan|soalan|kata kunci|penerangan|kemahiran|dalam|untuk|baca|menjawab|contoh|maksud|tepat|betul|semasa|pelajaran|ulang|semula|cuba)\b/i.test(normalizeText(value, ''));
}

function pickLanguageText(isEnglish, ...values) {
  for (const value of values) {
    const text = normalizeText(value, '');
    if (text && !isGenericText(text) && (!isEnglish || !isLikelyMalay(text))) return text;
  }
  return '';
}

function getPronounContext(context, question) {
  const expectedAnswer = normalizeText(
    question?.answer || question?.correctAnswer || question?.expectedAnswer || context?.expectedAnswer,
    ''
  );
  const topicText = normalizeText(
    `${context?.topicId || ''} ${context?.topicTitle || ''} ${question?.topicId || ''} ${question?.topicTitle || ''}`,
    ''
  ).toLowerCase();
  if (!expectedAnswer || !/kata[-_ ]ganti[-_ ]nama/.test(topicText)) return null;

  const pronoun = expectedAnswer.match(/\b(saya|kami|kita|awak|kamu|dia|beliau|mereka|anda|aku)\b/i)?.[1]?.toLowerCase();
  if (!pronoun) return null;

  const reasons = {
    saya: 'seorang penutur bercakap tentang diri sendiri',
    kami: 'Amir dan Faris bercakap tentang diri mereka tanpa memasukkan pendengar',
    kita: 'penutur bercakap tentang diri sendiri bersama pendengar',
    awak: 'penutur bercakap terus kepada seorang pendengar',
    kamu: 'penutur bercakap terus kepada seorang pendengar',
    dia: 'seorang yang sedang dibicarakan',
    beliau: 'seorang yang dihormati sedang dibicarakan',
    mereka: 'beberapa orang sedang dibicarakan',
    anda: 'penutur bercakap kepada seorang secara sopan',
    aku: 'seorang penutur bercakap tentang diri sendiri dalam situasi tidak rasmi'
  };
  const reason = reasons[pronoun];
  if (!reason) return null;
  const displayAnswer = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
  return {
    answer: displayAnswer,
    pronoun,
    explanation: `Kata ganti nama diri yang betul ialah “${displayAnswer}” kerana ${reason}.`
  };
}

function getPronounExamples(pronoun) {
  const examples = {
    saya: ['Saya membaca buku.', 'Saya menulis di meja belajar.', 'Kata ganti nama diri pertama ialah saya.'],
    kami: ['Kami membaca buku.', 'Kami menulis di meja belajar.', 'Kata ganti nama diri pertama jamak ialah kami.'],
    kita: ['Kita membaca buku bersama-sama.', 'Kita belajar di dalam kelas.', 'Kata ganti nama diri yang melibatkan penutur dan pendengar ialah kita.'],
    awak: ['Awak membaca buku.', 'Awak sudah menyiapkan kerja sekolah.', 'Awak digunakan apabila bercakap dengan pendengar.'],
    kamu: ['Kamu membaca buku.', 'Kamu sudah menyiapkan kerja sekolah.', 'Kamu digunakan apabila bercakap dengan pendengar.'],
    dia: ['Dia membaca buku.', 'Dia sedang belajar di dalam kelas.', 'Dia digunakan untuk seorang yang dibicarakan.'],
    beliau: ['Beliau seorang guru.', 'Beliau sedang mengajar murid.', 'Beliau digunakan dengan sopan untuk orang yang dihormati.'],
    mereka: ['Mereka membaca buku.', 'Mereka bermain di taman.', 'Mereka digunakan untuk beberapa orang yang dibicarakan.'],
    anda: ['Anda boleh membaca arahan ini.', 'Anda perlu menjawab soalan.', 'Anda digunakan untuk bercakap secara sopan.'],
    aku: ['Aku membaca buku.', 'Aku sedang belajar.', 'Aku digunakan dalam situasi tidak rasmi.']
  };
  return examples[pronoun] || [];
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

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      const body = modalRef.current?.querySelector('.ai-explain-body');
      if (body) body.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, data?.sourceQuestionId]);

  if (!open || !data) return null;
  if (context && ((data.generatedMode && data.generatedMode !== 'explain') || (data.sourceQuestionId && data.sourceQuestionId !== context.questionId) || (data.sourceSubjectId && data.sourceSubjectId !== context.subjectId) || (data.sourceTopicId && data.sourceTopicId !== context.topicId))) return null;

  const sections = data.sections && typeof data.sections === 'object' ? data.sections : {};
  const subjectId = String(context?.subjectId || data.subjectId || '').toLowerCase();
  const isEnglish = subjectId === 'english';
  const labels = isEnglish
    ? { offline: 'AI Explanation Offline', title: 'Explain', focus: 'Explanation focus', simple: 'Simple explanation', why: 'Why this answer is correct', answer: 'Correct answer', steps: 'Step-by-step example', extra: 'More examples', mistakes: 'Common mistakes', memory: 'Memory tip', followUp: 'Follow-up question', additional: 'View more help', read: 'Read explanation', retry: 'Try again', close: 'Close', teach: 'Teach me' }
    : { offline: 'Penerangan AI Luar Talian', title: 'Terangkan', focus: 'Fokus penerangan', simple: 'Penerangan mudah', why: 'Kenapa jawapan itu betul', answer: 'Jawapan betul', steps: 'Contoh langkah demi langkah', extra: 'Contoh lain', mistakes: 'Kesilapan biasa', memory: 'Tip ingatan', followUp: 'Soalan susulan', additional: 'Lihat bahan tambahan', read: 'Baca Penerangan', retry: 'Cuba Lagi', close: 'Tutup', teach: 'Ajar Saya' };
  // Coach data can arrive asynchronously. Keep the visible explanation tied to
  // the current question so a stale generic response cannot replace the answer.
  const pronounContext = getPronounContext(context, question);
  const focus = pickLanguageText(isEnglish, sections.focus, sections.summary) || (isEnglish ? 'Focus on the language skill asked in this question.' : 'Fokus pada kemahiran dalam soalan ini.');
  const summary = pronounContext?.explanation || pickLanguageText(isEnglish, sections.simpleExplanation, data.simpleExplanation, sections.summary, data.explanation) || (isEnglish ? 'Read the sentence and identify what the question asks for.' : 'Baca ayat dan kenal pasti perkara yang ditanya.');
  const answerText = pickMeaningfulText(sections.correctAnswer, data.correctAnswer, question?.answer);
  const expectedAnswerText = context?.expectedAnswer ? `Jawapan “${context.expectedAnswer}” tepat kerana menepati kehendak soalan.` : '';
  const answerFallback = answerText ? `Jawapan “${answerText}” tepat kerana sepadan dengan soalan.` : '';
  const whyCorrect = pronounContext?.explanation || pickLanguageText(
    isEnglish,
    sections.whyCorrect,
    data.whyCorrect,
    expectedAnswerText,
    answerFallback
  ) || (isEnglish ? 'The answer matches the meaning of the sentence.' : 'Jawapan ini tepat kerana sepadan dengan maksud soalan.');
  const hint = pickLanguageText(isEnglish, sections.hint, data.hint) || (isEnglish ? 'Look for the key word or phrase in the question.' : 'Cari kata kunci penting dalam soalan.');
  const steps = safeList(sections.steps || data.steps);
  const languageFilter = item => !isEnglish || !isLikelyMalay(item);
  const examples = pronounContext
    ? getPronounExamples(pronounContext.pronoun)
    : safeList(sections.example ? [sections.example] : data.examples).filter(languageFilter);
  const extraExamples = safeList(data.extraExamples).filter(item => !isGenericText(item) && languageFilter(item));
  const commonMistakes = safeList(sections.commonMistake ? [sections.commonMistake] : data.commonMistakes).filter(languageFilter);
  const memoryTips = safeList(sections.memoryTip ? [sections.memoryTip] : (Array.isArray(data.memoryTips) && data.memoryTips.length ? data.memoryTips : (data.memoryTip ? [data.memoryTip] : []))).filter(languageFilter);
  const followUpQuestions = safeList(data.followUpQuestions);
  const [uniqueSteps, uniqueExamples, uniqueExtraExamples, uniqueMistakes, uniqueMemoryTips, uniqueFollowUps] = dedupeSections([steps, examples, extraExamples, commonMistakes, memoryTips, followUpQuestions]);
  const coachMessage = pickLanguageText(isEnglish, sections.coachMessage, data.encouragement) || (isEnglish ? 'Read carefully and check your answer.' : 'Baca dengan teliti dan semak jawapan kamu.');
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
              <p className="eyebrow">{labels.offline}</p>
              <h2 id="ai-explain-title">{labels.title}</h2>
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
          <VoiceButton text={voiceText} lang={context?.sourceLanguage} label={labels.read} title={labels.read} className="voice-inline" />
          <section className="explain-section explain-context-card" aria-label="Konteks penerangan">
            <h3>{labels.focus}</h3>
            <p>{focus}</p>
          </section>
          {renderTextSection(labels.simple, summary)}
          {renderTextSection(labels.why, whyCorrect)}

          <MascotCard character={character} mood="thinking" size="md" animation="gentle" message={coachMessage} />

          {showCorrectAnswer && (
            <section className="explain-section">
              <h3>{labels.answer}</h3>
              <div className="explain-answer-box">
                <span>{labels.answer}</span>
                <b>{answerText}</b>
              </div>
            </section>
          )}

          {renderListSection(labels.steps, uniqueSteps)}
          <details className="explain-details">
            <summary>{labels.additional}</summary>
            {renderListSection(isEnglish ? 'Examples' : 'Contoh', uniqueExamples)}
            {renderListSection(labels.extra, uniqueExtraExamples)}
            {renderListSection(labels.mistakes, uniqueMistakes)}
            {renderListSection(labels.memory, uniqueMemoryTips)}
            {renderListSection(labels.followUp, uniqueFollowUps)}
          </details>

        </div>

        <div className="ai-explain-footer actions ai-modal-footer" data-modal-footer="true">
          <button className="secondary" type="button" onClick={onTeach}>{labels.teach}</button>
          <button type="button" onClick={onTryAgain}>{labels.retry}</button>
          <button className="secondary" type="button" onClick={onTutup}>{labels.close}</button>
        </div>
      </section>
    </div>
  );

  return renderModalPortal(modalNode);
}
