import React from 'react';
import BrandLogo from '../BrandLogo';
import MascotCard from '../MascotCard';

export default function AIExplainModal({ open, data, question, character = 'jati', onTutup, onTryAgain, onTeach }) {
  if (!open || !data) return null;

  return <div className="ai-explain-overlay" role="dialog" aria-modal="true" aria-label="Penerangan AI">
    <section className="ai-explain-modal">
      <div className="ai-explain-head">
        <div className="modal-brand-title">
          <BrandLogo iconOnly size="sm" />
          <div>
          <p className="eyebrow">Penerangan AI Luar Talian</p>
          <h2>🤖 Terangkan</h2>
                  </div>
        </div>
        <button className="ghost" onClick={onTutup}>✕</button>
      </div>
      <div className="explain-answer-box">
        <span>Jawapan betul</span>
        <b>{question?.answer || '-'}</b>
      </div>
      <MascotCard character={character} mood="thinking" size="md" animation="gentle" message="Guru AI akan bantu kamu faham." />
      <div className="explain-section">
        <h3>Kenapa jawapan itu betul</h3>
        <p>{data.explanation}</p>
      </div>
      <div className="explain-section">
        <h3>Petunjuk</h3>
        <p>{data.hint}</p>
      </div>
      <div className="explain-section">
        <h3>Contoh lain</h3>
        <ul>{(data.examples || []).map((example, index) => <li key={index}>{example}</li>)}</ul>
      </div>
      <p className="explain-encouragement">{data.encouragement}</p>
      <div className="actions">
        <button className="secondary" onClick={onTeach}>📖 Ajar Saya</button>
        <button onClick={onTryAgain}>Cuba Lagi</button>
        <button className="secondary" onClick={onTutup}>Tutup</button>
      </div>
    </section>
  </div>;
}


