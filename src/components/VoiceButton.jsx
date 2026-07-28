import React from 'react';
import { speak, supportsVoice } from '../ai/index.js';
import IconGlyph from './IconGlyph.jsx';

export default function VoiceButton({ text = '', label = 'Baca', className = '', title = 'Baca kuat', size = 'sm' }) {
  if (!supportsVoice() || !String(text || '').trim()) return null;

  return (
    <button
      type="button"
      className={`voice-button voice-button-${size} ${className}`.trim()}
      aria-label={title}
      title={title}
      onClick={() => speak(text)}
    >
      <IconGlyph name="volume" motion="sound" decorative />
      <span>{label}</span>
    </button>
  );
}

