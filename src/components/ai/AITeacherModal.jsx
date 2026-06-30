import React from 'react';

export default function AITeacherModal({ open, data, onClose, onPractice }) {
  if (!open || !data) return null;

  return <div className="ai-explain-overlay" role="dialog" aria-modal="true" aria-label="AI Teacher">
    <section className="ai-explain-modal ai-teacher-modal">
      <div className="ai-explain-head">
        <div>
          <p className="eyebrow">Offline AI Teacher</p>
          <h2>📖 Teach Me</h2>
        </div>
        <button className="ghost" onClick={onClose}>✕</button>
      </div>
      <div className="explain-section">
        <h3>Explanation</h3>
        <p>{data.explanation}</p>
      </div>
      <div className="explain-section">
        <h3>Examples</h3>
        <ul>{(data.examples || []).map((example, index) => <li key={index}>{example}</li>)}</ul>
      </div>
      <div className="explain-section">
        <h3>Common mistakes</h3>
        <ul>{(data.commonMistakes || []).map((mistake, index) => <li key={index}>{mistake}</li>)}</ul>
      </div>
      <div className="explain-answer-box">
        <span>Memory tip</span>
        <b>{data.memoryTip}</b>
      </div>
      <p className="explain-encouragement">{data.practicePrompt}</p>
      <div className="actions">
        <button onClick={onPractice}>Practice</button>
        <button className="secondary" onClick={onClose}>Close</button>
      </div>
    </section>
  </div>;
}
