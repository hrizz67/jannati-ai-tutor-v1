import React from 'react';
import IconGlyph from '../IconGlyph.jsx';

function safeText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

export default function AchievementBadge({ achievement = null }) {
  if (!achievement) {
    return <span className="achievement-badge empty">Belum ada pencapaian</span>;
  }

  return (
    <div className="achievement-badge" aria-label={`Pencapaian ${safeText(achievement.label)}`}>
      <span className="achievement-badge-icon" aria-hidden="true"><IconGlyph name="trophy" motion="celebrate" active={Boolean(achievement)} /></span>
      <span className="achievement-badge-text">
        <b>{safeText(achievement.label, 'Belum ada pencapaian')}</b>
        <small>{safeText(achievement.description, '')}</small>
      </span>
    </div>
  );
}
