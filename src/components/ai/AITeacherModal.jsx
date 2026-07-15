import React from 'react';
import BrandLogo from '../BrandLogo';
import MascotCard from '../MascotCard';
import VoiceButton from '../VoiceButton.jsx';

export default function AITeacherModal({ open, data, character = 'jati', onTutup, onLatih }) {
  if (!open || !data) return null;

  const examples = Array.isArray(data.examples) ? data.examples : [];
  const commonMistakes = Array.isArray(data.commonMistakes) ? data.commonMistakes : [];
  const voiceText = [
    data.explanation,
    ...examples,
    ...commonMistakes,
    data.memoryTip,
    data.practicePrompt
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
            <p>{data.explanation || 'Jawapan ini sesuai dengan soalan.'}</p>
          </div>

          <MascotCard character={character} mood="teaching" size="md" animation="gentle" message="Jom belajar langkah demi langkah." />

          <div className="explain-section">
            <h3>Contoh</h3>
            <ul>{examples.map((example, index) => <li key={index}>{example}</li>)}</ul>
          </div>

          <div className="explain-section">
            <h3>Kesilapan biasa</h3>
            <ul>{commonMistakes.map((mistake, index) => <li key={index}>{mistake}</li>)}</ul>
          </div>

          <div className="explain-answer-box">
            <span>Tip ingatan</span>
            <b style={{ whiteSpace: 'pre-line' }}>{data.memoryTip || 'Ulang baca soalan dengan teliti.'}</b>
          </div>

          <p className="explain-encouragement">{data.practicePrompt || 'Cuba sekali lagi selepas membaca penerangan ini.'}</p>
        </div>

        <div className="ai-explain-footer actions">
          <button type="button" onClick={onLatih}>Latih</button>
          <button className="secondary" type="button" onClick={onTutup}>Tutup</button>
        </div>
      </section>
    </div>
  );
}
