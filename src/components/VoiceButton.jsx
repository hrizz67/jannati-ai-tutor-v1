import React, { useState } from 'react';
import { speak, VOICE_RESULT_CODES } from '../ai/voice/voiceEngine.js';
import { supportsVoice } from '../ai/voice/voiceCapability.js';
import GameBadge from './GameBadge.jsx';
import mendengarBadge from '../assets/icons/3d/mendengar-badge.webp';

export default function VoiceButton({ text = '', label = 'Baca', className = '', title = 'Baca kuat', size = 'sm', lang = 'ms-MY' }) {
  if (!supportsVoice() || !String(text || '').trim()) return null;
  return <VoiceButtonControl text={text} label={label} className={className} title={title} size={size} lang={lang} />;
}

function VoiceButtonControl({ text, label, className, title, size, lang }) {
  const [status, setStatus] = useState('');

  function getFailureMessage(code) {
    if (code === VOICE_RESULT_CODES.SPEECH_NOT_SUPPORTED) {
      return 'Pelayar ini tidak menyokong bacaan suara. Cuba Safari atau Chrome biasa.';
    }
    if (code === VOICE_RESULT_CODES.VOICE_NOT_AVAILABLE) {
      return 'Voice bahasa ini tiada pada peranti. Pasang pek suara bahasa dalam tetapan peranti.';
    }
    return 'Bacaan suara gagal. Semak kelantangan dan mod senyap, kemudian cuba lagi.';
  }

  async function handleSpeak() {
    setStatus('');
    try {
      const played = await speak(text, { language: lang });
      if (!played.success && played.code !== 'CANCELLED') {
        setStatus(getFailureMessage(played.code));
      }
    } catch {
      setStatus(getFailureMessage(VOICE_RESULT_CODES.SPEECH_ERROR));
    }
  }

  return (
    <span className="voice-button-wrap">
      <button
        type="button"
        className={`voice-button voice-button-${size} ${className}`.trim()}
        aria-label={title}
        title={title}
        onClick={handleSpeak}
      >
        {/* motion="sound" is preserved as the semantic audio affordance while the visual uses the 3D badge. */}
        <GameBadge className="voice-button-badge" src={mendengarBadge} />
        <span>{label}</span>
      </button>
      {status && <small className="voice-button-status" role="status">{status}</small>}
    </span>
  );
}
