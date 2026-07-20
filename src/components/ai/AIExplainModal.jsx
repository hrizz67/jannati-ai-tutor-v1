import React, { useEffect, useRef } from 'react';
import BrandLogo from '../BrandLogo';
import MascotCard from '../MascotCard';
import VoiceButton from '../VoiceButton.jsx';

function safeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(item => String(item));
  if (value === null || value === undefined || value === '') return [];
  return [String(value)];
}

function renderListSection(title, items) {
  if (!items.length) return null;
  return (
    <div className="explain-section">
      <h3>{title}</h3>
      <ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul>
    </div>
  );
}

export default function AIExplainModal({ open, data, question, character = 'jati', onTutup, onTryAgain, onTeach }) {
  const closeButtonRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    restoreFocusRef.current = document.activeElement;
    const timer = window.setTimeout(() => closeButtonRef.current?.focus?.(), 0);
    function onKeyDown(event) {
      if (event.key === 'Escape') onTutup?.();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onTutup]);

  if (!open || !data) return null;

  const examples = safeList(data.examples);
  const extraExamples = safeList(data.extraExamples);
  const steps = safeList(data.steps);
  const tips = safeList(data.tips);
  const learningTip = safeList(data.learningTip);
  const memoryTips = safeList(Array.isArray(data.memoryTips) && data.memoryTips.length ? data.memoryTips : (data.memoryTip ? [data.memoryTip] : []));
  const commonMistakes = safeList(data.commonMistakes);
  const followUpQuestions = safeList(data.followUpQuestions);
  const workedExamples = safeList(data.workedExamples);
  const problemSolvingSteps = safeList(data.problemSolvingSteps);
  const scientificFacts = safeList(data.scientificFacts);
  const observationPrompts = safeList(data.observationPrompts);
  const comparisonPrompts = safeList(data.comparisonPrompts);
  const investigationIdeas = safeList(data.investigationIdeas);
  const realLifeConnections = safeList(data.realLifeConnections);
  const safetyNotes = safeList(data.safetyNotes);
  const misconceptions = safeList(data.misconceptions);
  const evidenceQuestions = safeList(data.evidenceQuestions);
  const pronunciationTips = safeList(data.pronunciationTips);
  const pronunciationGuide = safeList(data.pronunciationGuide);
  const readingSteps = safeList(data.readingSteps);
  const letterBreakdown = safeList(data.letterBreakdown);
  const listeningTips = safeList(data.listeningTips);
  const letterRecognitionTips = safeList(data.letterRecognitionTips);
  const writingTips = safeList(data.writingTips);
  const vocabularyGroups = safeList(data.vocabularyGroups);
  const wordMeaning = safeList(data.wordMeaning);
  const exampleSentences = safeList(data.exampleSentences);
  const translationHints = safeList(data.translationHints);
  const readingPractice = safeList(data.readingPractice);
  const listeningPractice = safeList(data.listeningPractice);
  const speakingPractice = safeList(data.speakingPractice);
  const writingPractice = safeList(data.writingPractice);
  const dailyPractice = safeList(data.dailyPractice);
  const adabApplications = safeList(data.adabApplications);
  const realLifeExamples = safeList(data.realLifeExamples);
  const ayahOrHadithReference = safeList(data.ayahOrHadithReference);
  const reflectionQuestions = safeList(data.reflectionQuestions);
  const goodDeedsIdeas = safeList(data.goodDeedsIdeas);
  const whyQuestions = safeList(data.whyQuestions);
  const predictionQuestions = safeList(data.predictionQuestions);
  const comparisonQuestions = safeList(data.comparisonQuestions);
  const realLifeApplications = safeList(data.realLifeApplications);

  const voiceText = [
    data.explanation,
    data.simpleExplanation,
    data.hint,
    ...tips,
    ...learningTip,
    ...examples,
    ...extraExamples,
    ...steps,
    ...workedExamples,
    ...problemSolvingSteps,
    ...scientificFacts,
    ...observationPrompts,
    ...comparisonPrompts,
    ...investigationIdeas,
    ...realLifeConnections,
    ...safetyNotes,
    ...misconceptions,
    ...evidenceQuestions,
    ...pronunciationTips,
    ...pronunciationGuide,
    ...readingSteps,
    ...letterBreakdown,
    ...listeningTips,
    ...letterRecognitionTips,
    ...writingTips,
    ...vocabularyGroups,
    ...wordMeaning,
    ...exampleSentences,
    ...translationHints,
    ...readingPractice,
    ...listeningPractice,
    ...speakingPractice,
    ...writingPractice,
    ...dailyPractice,
    ...adabApplications,
    ...realLifeExamples,
    ...ayahOrHadithReference,
    ...reflectionQuestions,
    ...goodDeedsIdeas,
    ...whyQuestions,
    ...predictionQuestions,
    ...comparisonQuestions,
    ...realLifeApplications,
    ...commonMistakes,
    ...followUpQuestions,
    ...memoryTips,
    data.encouragement,
    question?.answer ? `Jawapan betul ${question.answer}` : ''
  ].filter(Boolean).join('. ');

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
          <div className="explain-section">
            <h3>Kenapa jawapan itu betul</h3>
            <p>{data.explanation || 'Jawapan ini sesuai dengan soalan.'}</p>
          </div>

          <div className="explain-section">
            <h3>Penerangan mudah</h3>
            <p>{data.simpleExplanation || data.explanation || 'Jawapan ini sesuai dengan soalan.'}</p>
          </div>

          <MascotCard character={character} mood="thinking" size="md" animation="gentle" message="Jom kita fahami bersama." />

          <div className="explain-section">
            <h3>Petunjuk</h3>
            <p>{data.hint || 'Cari kata kunci penting dalam soalan.'}</p>
          </div>

          {renderListSection('Langkah', steps)}
          {renderListSection('Tip', tips)}
          {renderListSection('Tip belajar', learningTip)}
          {renderListSection('Contoh lain', extraExamples)}
          {renderListSection('Contoh', examples)}
          {renderListSection('Contoh langkah demi langkah', workedExamples)}
          {renderListSection('Langkah penyelesaian', problemSolvingSteps)}
          {renderListSection('Fakta sains', scientificFacts)}
          {renderListSection('Pemerhatian', observationPrompts)}
          {renderListSection('Perbandingan', comparisonPrompts)}
          {renderListSection('Penyiasatan', investigationIdeas)}
          {renderListSection('Kaitan kehidupan', realLifeConnections)}
          {renderListSection('Nota keselamatan', safetyNotes)}
          {renderListSection('Salah faham biasa', misconceptions)}
          {renderListSection('Soalan bukti', evidenceQuestions)}
          {renderListSection('Tip sebutan', pronunciationTips)}
          {renderListSection('Panduan sebutan', pronunciationGuide)}
          {renderListSection('Langkah baca', readingSteps)}
          {renderListSection('Pecahan huruf', letterBreakdown)}
          {renderListSection('Tip dengar', listeningTips)}
          {renderListSection('Kenal huruf', letterRecognitionTips)}
          {renderListSection('Tip tulisan', writingTips)}
          {renderListSection('Kumpulan kosa kata', vocabularyGroups)}
          {renderListSection('Maksud kata', wordMeaning)}
          {renderListSection('Ayat contoh', exampleSentences)}
          {renderListSection('Petunjuk terjemahan', translationHints)}
          {renderListSection('Latihan baca', readingPractice)}
          {renderListSection('Latihan dengar', listeningPractice)}
          {renderListSection('Latihan sebut', speakingPractice)}
          {renderListSection('Latihan tulis', writingPractice)}
          {renderListSection('Amalan harian', dailyPractice)}
          {renderListSection('Aplikasi adab', adabApplications)}
          {renderListSection('Contoh kehidupan', realLifeExamples)}
          {renderListSection('Rujukan ayat/hadis', ayahOrHadithReference)}
          {renderListSection('Soalan renungan', reflectionQuestions)}
          {renderListSection('Idea amal baik', goodDeedsIdeas)}
          {renderListSection('Soalan kenapa', whyQuestions)}
          {renderListSection('Soalan ramalan', predictionQuestions)}
          {renderListSection('Soalan banding', comparisonQuestions)}
          {renderListSection('Aplikasi kehidupan', realLifeApplications)}
          {renderListSection('Kesilapan biasa', commonMistakes)}
          {renderListSection('Soalan susulan', followUpQuestions)}

          <div className="explain-section">
            <h3>Tip ingatan</h3>
            <ul>{memoryTips.length ? memoryTips.map((tip, index) => <li key={`memory-${index}`}>{tip}</li>) : <li>Ulang baca soalan dengan teliti.</li>}</ul>
          </div>

          <p className="explain-encouragement">{data.encouragement || 'Kamu sedang belajar dengan baik.'}</p>
          <div className="explain-answer-box">
            <span>Jawapan betul</span>
            <b>{question?.answer || '-'}</b>
          </div>
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
