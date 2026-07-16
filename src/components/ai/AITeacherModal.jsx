import React from 'react';
import BrandLogo from '../BrandLogo';
import MascotCard from '../MascotCard';
import VoiceButton from '../VoiceButton.jsx';

function safeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
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

export default function AITeacherModal({ open, data, character = 'jati', onTutup, onLatih }) {
  if (!open || !data) return null;

  const examples = safeList(data.examples);
  const extraExamples = safeList(data.extraExamples);
  const tips = safeList(data.tips);
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
  const letterRecognitionTips = safeList(data.letterRecognitionTips);
  const writingTips = safeList(data.writingTips);
  const vocabularyGroups = safeList(data.vocabularyGroups);
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
  const practicePrompt = data.practicePrompt || followUpQuestions[0] || 'Cuba sekali lagi selepas membaca penerangan ini.';
  const voiceText = [
    data.explanation,
    ...tips,
    ...examples,
    ...extraExamples,
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
    ...letterRecognitionTips,
    ...writingTips,
    ...vocabularyGroups,
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
    ...commonMistakes,
    ...followUpQuestions,
    ...memoryTips,
    practicePrompt
  ].filter(Boolean).join('. ');

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
          <div className="explain-section">
            <h3>Penerangan mudah</h3>
            <p>{data.explanation || data.simpleExplanation || 'Jawapan ini sesuai dengan soalan.'}</p>
          </div>

          <MascotCard character={character} mood="teaching" size="md" animation="gentle" message="Jom belajar langkah demi langkah." />

          {renderListSection('Tip', tips)}
          {renderListSection('Contoh', examples)}
          {renderListSection('Contoh lain', extraExamples)}
          {renderListSection('Worked examples', workedExamples)}
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
          {renderListSection('Kenal huruf', letterRecognitionTips)}
          {renderListSection('Tip tulisan', writingTips)}
          {renderListSection('Kumpulan kosa kata', vocabularyGroups)}
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
          {renderListSection('Kesilapan biasa', commonMistakes)}
          {renderListSection('Soalan susulan', followUpQuestions)}

          <div className="explain-section">
            <h3>Tip ingatan</h3>
            <ul>{memoryTips.length ? memoryTips.map((tip, index) => <li key={`memory-${index}`}>{tip}</li>) : <li>Ulang baca soalan dengan teliti.</li>}</ul>
          </div>

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
