import React from 'react';
import { speak, supportsVoice } from '../ai/index.js';

function VoiceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a3.5 3.5 0 0 0-1.5-2.9v5.8a3.5 3.5 0 0 0 1.5-2.9zm2.5 0a6 6 0 0 0-3-5.2v10.4a6 6 0 0 0 3-5.2z" />
    </svg>
  );
}

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
      <VoiceIcon />
      <span>{label}</span>
    </button>
  );
}

