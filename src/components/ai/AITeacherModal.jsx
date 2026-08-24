import React, { useEffect, useRef } from 'react';
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

const SUBJECT_COACH_MESSAGES = {
  math: 'Semak nombor dan operasi. Cuba selesaikan langkah demi langkah.',
  sains: 'Perhatikan ciri atau proses dalam soalan. Cuba semak jawapan kamu.',
  english: 'Read the sentence carefully and check your answer.',
  arab: 'Semak perkataan dan maksudnya sekali lagi.',
  islam: 'Semak semula amalan atau istilah yang ditanya.',
  pj: 'Semak langkah pergerakan dan ikut arahan keselamatan.',
  pk: 'Semak tindakan yang selamat dan sesuai untuk kesihatan.'
};

function hasGenericCoachMessage(value = '') {
  return /baca semula soalan|cuba sekali lagi selepas|jawapan ini sesuai|jom belajar langkah demi langkah|kita ulang perlahan|jangan risau/i.test(value);
}

function pickMeaningfulText(...values) {
  for (const value of values) {
    const text = normalizeText(value, '');
    if (text && !isGenericText(text)) return text;
  }
  return '';
}

function isQuestionEcho(value, context = null) {
  const text = normalizeText(value, '').toLowerCase();
  if (!text) return true;
  if (/^(soalan|question)\s*:/i.test(text)) return true;
  const question = normalizeText(context?.questionText || context?.question || '', '').toLowerCase();
  return Boolean(question && (text === question || text.includes(question)));
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

function pickLearningFocus(context, subjectId, ...values) {
  for (const value of values) {
    const text = normalizeText(value, '');
    if (text && !isGenericText(text) && !isQuestionEcho(text, context)) return text;
  }
  const defaults = {
    math: 'Memahami nombor dan operasi dalam soalan.',
    sains: 'Memahami ciri dan proses Sains dalam soalan.',
    english: 'Recognise the language skill asked in the question.',
    arab: 'Memahami perkataan dan maksud yang ditanya.',
    islam: 'Memahami amalan atau istilah yang ditanya.',
    pj: 'Memahami pergerakan dan keselamatan semasa aktiviti.',
    pk: 'Memahami tindakan yang baik untuk kesihatan.'
  };
  return defaults[subjectId] || 'Fokus pada kemahiran yang sedang dipelajari.';
}

function getPronounContext(context) {
  const expectedAnswer = normalizeText(context?.expectedAnswer, '').toLowerCase();
  const topicText = normalizeText(`${context?.topicId || ''} ${context?.topicTitle || ''}`, '').toLowerCase();
  if (!expectedAnswer || !/kata[-_ ]ganti[-_ ]nama/.test(topicText)) return null;
  const pronoun = expectedAnswer.match(/\b(saya|kami|kita|awak|kamu|dia|beliau|mereka|anda|aku)\b/)?.[1];
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
  return reasons[pronoun] ? {
    pronoun,
    explanation: `Kata ganti nama diri yang betul ialah “${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)}” kerana ${reasons[pronoun]}.`
  } : null;
}

function getPronounExamples(pronoun) {
  const examples = {
    saya: ['Saya membaca buku.', 'Saya menulis di meja belajar.', 'Kata ganti nama diri pertama ialah saya.'],
    kami: ['Kami membaca buku.', 'Kami menulis di meja belajar.', 'Kata ganti nama diri pertama jamak ialah kami.'],
    kita: ['Kita membaca buku bersama-sama.', 'Kita belajar di dalam kelas.', 'Kata ganti nama yang melibatkan penutur dan pendengar ialah kita.'],
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

export default function AITeacherModal({ open, data, context = null, character = 'jati', onTutup, onLatih }) {
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
      const body = modalRef.current?.querySelector('.ai-teacher-body');
      if (body) body.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, data?.sourceQuestionId]);

  if (!open || !data) return null;
  if (context && ((data.generatedMode && data.generatedMode !== 'teach') || (data.sourceQuestionId && data.sourceQuestionId !== context.questionId) || (data.sourceSubjectId && data.sourceSubjectId !== context.subjectId) || (data.sourceTopicId && data.sourceTopicId !== context.topicId))) return null;

  const characterName = character === 'jati' ? 'Jati' : 'Janna';

  const sections = data.sections && typeof data.sections === 'object' ? data.sections : {};
  const pronounContext = getPronounContext(context);
  const subjectId = String(context?.subjectId || data.subjectId || '').toLowerCase();
  const isEnglish = subjectId === 'english';
  const labels = isEnglish
    ? { offline: `${characterName} Offline Tutor`, title: 'Teach Me', focus: 'Learning focus', simple: 'Simple explanation', hint: 'Hint', steps: 'Step by step', additional: 'View more help', examples: 'Examples', extra: 'More examples', mistakes: 'Common mistakes', memory: 'Memory tip', practice: 'Try again', train: 'Practise', close: 'Close', read: 'Read lesson' }
    : { offline: `${characterName} AI Luar Talian`, title: 'Ajar Saya', focus: 'Fokus pembelajaran', simple: 'Penerangan mudah', hint: 'Petunjuk', steps: 'Langkah demi langkah', additional: 'Lihat bahan tambahan', examples: 'Contoh', extra: 'Contoh lain', mistakes: 'Kesilapan biasa', memory: 'Tip ingatan', practice: 'Latih semula', train: 'Latih', close: 'Tutup', read: 'Baca Ajaran' };
  const rawFocus = pickLearningFocus(
    context,
    subjectId,
    sections.focus,
    sections.learningObjective,
    data.learningObjective,
    context?.learningObjective,
    sections.summary,
  );
  const focus = isEnglish && isLikelyMalay(rawFocus) ? 'Identify the language skill asked in the question.' : rawFocus;
  const summary = pronounContext?.explanation || pickLanguageText(isEnglish, sections.simpleExplanation, data.simpleExplanation, sections.summary, data.explanation) || (isEnglish ? 'Read the sentence and identify what the question asks for.' : 'Baca ayat dan kenal pasti perkara yang ditanya.');
  const whyCorrect = pronounContext?.explanation || pickLanguageText(isEnglish, sections.whyCorrect, data.explanation, data.simpleExplanation) || (isEnglish ? 'The answer matches the meaning of the sentence.' : (context?.expectedAnswer ? `Mari hubungkan jawapan ${context.expectedAnswer} dengan soalan.` : ''));
  const hint = pickLanguageText(isEnglish, sections.hint, data.hint) || (isEnglish ? 'Look for the key word or phrase in the question.' : 'Cari kata kunci penting dalam soalan.');
  const steps = safeList(sections.steps || data.steps);
  const languageFilter = item => !isEnglish || !isLikelyMalay(item);
  const examples = pronounContext ? getPronounExamples(pronounContext.pronoun) : safeList(data.examples).filter(languageFilter);
  const extraExamples = safeList(data.extraExamples).filter(languageFilter);
  const commonMistakes = safeList(sections.commonMistake ? [sections.commonMistake] : data.commonMistakes).filter(languageFilter);
  const memoryTip = pickLanguageText(isEnglish, sections.memoryTip, data.memoryTip, data.memoryTips) || (isEnglish ? 'Use the key word in the sentence to guide your answer.' : 'Baca soalan perlahan-lahan dan cari kata kunci.');
  const [uniqueSteps, uniqueExamples, uniqueExtraExamples, uniqueMistakes] = dedupeSections([steps, examples, extraExamples, commonMistakes]);
  const practicePrompt = pickLanguageText(isEnglish, sections.practicePrompt, data.practicePrompt, data.followUpQuestions?.[0]) || (isEnglish ? 'Read the question again and try once more.' : 'Baca semula soalan dan cuba sekali lagi.');
  const rawCoachMessage = pickLanguageText(isEnglish, sections.coachMessage, data.encouragement, practicePrompt);
  const coachMessage = subjectId !== 'bm' && hasGenericCoachMessage(rawCoachMessage)
    ? (SUBJECT_COACH_MESSAGES[subjectId] || rawCoachMessage)
    : rawCoachMessage;
  const voiceText = [
    focus,
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
              <p className="eyebrow">{labels.offline}</p>
              <h2 id="ai-teacher-title">{labels.title}</h2>
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
          <VoiceButton text={voiceText} lang={context?.sourceLanguage} label={labels.read} title={labels.read} className="voice-inline" />
          <section className="explain-section explain-context-card" aria-label="Fokus pembelajaran">
            <h3>{labels.focus}</h3>
            <p>{focus}</p>
          </section>
          {renderTextSection(labels.simple, summary)}
          <MascotCard character={character} mood="teaching" size="md" animation="gentle" message={coachMessage} />

          {renderTextSection(labels.hint, hint)}
          {renderListSection(labels.steps, uniqueSteps)}
          <details className="explain-details">
            <summary>{labels.additional}</summary>
            {renderListSection(labels.examples, uniqueExamples)}
            {renderListSection(labels.extra, uniqueExtraExamples)}
            {renderListSection(labels.mistakes, uniqueMistakes)}
            {renderTextSection(labels.memory, memoryTip)}
          </details>

          <div className="explain-answer-box">
            <span>{labels.practice}</span>
            <b style={{ whiteSpace: 'pre-line' }}>{practicePrompt}</b>
          </div>
        </div>

        <div className="ai-explain-footer ai-teacher-footer actions ai-modal-footer" data-modal-footer="true">
          <button type="button" onClick={onLatih}>{labels.train}</button>
          <button className="secondary" type="button" onClick={onTutup}>{labels.close}</button>
        </div>
      </section>
    </div>
  );

  return renderModalPortal(modalNode);
}
