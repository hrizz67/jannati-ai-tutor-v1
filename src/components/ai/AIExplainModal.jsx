import React from 'react';
import BrandLogo from '../BrandLogo';
import MascotCard from '../MascotCard';
import VoiceButton from '../VoiceButton.jsx';

export default function AIExplainModal({ open, data, question, character = 'jati', onTutup, onTryAgain, onTeach }) {
  if (!open || !data) return null;

  const examples = Array.isArray(data.examples) ? data.examples : [];
  const commonMistakes = Array.isArray(data.commonMistakes) ? data.commonMistakes : [];
  const voiceText = [
    data.explanation,
    data.simpleExplanation,
    data.hint,
    ...examples,
    ...commonMistakes,
    data.memoryTip,
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
          <button className="ghost" type="button" onClick={onTutup}>✕</button>
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

          <div className="explain-section">
            <h3>Contoh lain</h3>
            <ul>{examples.map((example, index) => <li key={index}>{example}</li>)}</ul>
          </div>

          <div className="explain-section">
            <h3>Kesilapan biasa</h3>
            <ul>{commonMistakes.map((mistake, index) => <li key={index}>{mistake}</li>)}</ul>
          </div>

          <div className="explain-section">
            <h3>Tip ingatan</h3>
            <p style={{ whiteSpace: 'pre-line' }}>{data.memoryTip || 'Ulang baca soalan dengan teliti.'}</p>
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
