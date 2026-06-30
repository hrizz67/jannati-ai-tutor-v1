import React from 'react';

export default function AIExplainModal({ open, data, question, onClose, onTryAgain }) {
  if (!open || !data) return null;

  return <div className="ai-explain-overlay" role="dialog" aria-modal="true" aria-label="AI Explain">
    <section className="ai-explain-modal">
      <div className="ai-explain-head">
        <div>
          <p className="eyebrow">Offline AI Explain</p>
          <h2>🤖 Terangkan</h2>
        </div>
        <button className="ghost" onClick={onClose}>✕</button>
      </div>
      <div className="explain-answer-box">
        <span>Jawapan betul</span>
        <b>{question?.answer || '-'}</b>
      </div>
      <div className="explain-section">
        <h3>Kenapa jawapan itu betul</h3>
        <p>{data.explanation}</p>
      </div>
      <div className="explain-section">
        <h3>Hint</h3>
        <p>{data.hint}</p>
      </div>
      <div className="explain-section">
        <h3>Contoh lain</h3>
        <ul>{(data.examples || []).map((example, index) => <li key={index}>{example}</li>)}</ul>
      </div>
      <p className="explain-encouragement">{data.encouragement}</p>
      <div className="actions">
        <button onClick={onTryAgain}>Cuba Lagi</button>
        <button className="secondary" onClick={onClose}>Tutup</button>
      </div>
    </section>
  </div>;
}
