import React from 'react';

export default function AITeacherModal({ open, data, onTutup, onLatih }) {
  if (!open || !data) return null;

  return <div className="ai-explain-overlay" role="dialog" aria-modal="true" aria-label="Guru AI">
    <section className="ai-explain-modal ai-teacher-modal">
      <div className="ai-explain-head">
        <div>
          <p className="eyebrow">Guru AI Luar Talian</p>
          <h2>📖 Ajar Saya</h2>
        </div>
        <button className="ghost" onClick={onTutup}>✕</button>
      </div>
      <div className="explain-section">
        <h3>Penerangan</h3>
        <p>{data.explanation}</p>
      </div>
      <div className="explain-section">
        <h3>Contoh</h3>
        <ul>{(data.examples || []).map((example, index) => <li key={index}>{example}</li>)}</ul>
      </div>
      <div className="explain-section">
        <h3>Kesilapan biasa</h3>
        <ul>{(data.commonMistakes || []).map((mistake, index) => <li key={index}>{mistake}</li>)}</ul>
      </div>
      <div className="explain-answer-box">
        <span>Tip ingatan</span>
        <b>{data.memoryTip}</b>
      </div>
      <p className="explain-encouragement">{data.practicePrompt}</p>
      <div className="actions">
        <button onClick={onLatih}>Latih</button>
        <button className="secondary" onClick={onTutup}>Tutup</button>
      </div>
    </section>
  </div>;
}
