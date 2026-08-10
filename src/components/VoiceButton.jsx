import React from 'react';
import { speak, supportsVoice } from '../ai/index.js';
import IconGlyph from './IconGlyph.jsx';
import GameBadge from './GameBadge.jsx';
import mendengarBadge from '../assets/icons/3d/mendengar-badge.webp';

function resolveVoiceLanguage(language = 'ms-MY') {
  const value = String(language || '').toLowerCase();
  if (value.startsWith('en')) return 'en-US';
  if (value.startsWith('ar')) return 'ar-SA';
  return 'ms-MY';
}

export default function VoiceButton({ text = '', label = 'Baca', className = '', title = 'Baca kuat', size = 'sm', lang = 'ms-MY' }) {
  if (!supportsVoice() || !String(text || '').trim()) return null;

  return (
    <button
      type="button"
      className={`voice-button voice-button-${size} ${className}`.trim()}
      aria-label={title}
      title={title}
      onClick={() => speak(text, { lang: resolveVoiceLanguage(lang) })}
    >
      {/* motion="sound" is preserved as the semantic audio affordance while the visual uses the 3D badge. */}
      <GameBadge className="voice-button-badge" src={mendengarBadge} />
      <span>{label}</span>
    </button>
  );
}

