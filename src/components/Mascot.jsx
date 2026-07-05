import React from 'react';

const CHARACTER_META = {
  janna: {
    name: 'Janna',
    initials: 'Jn',
    role: 'Rakan belajar',
    defaultMessage: 'Syabas! Teruskan usaha kamu.',
  },
  jati: {
    name: 'Jati',
    initials: 'Jt',
    role: 'Guru AI',
    defaultMessage: 'Guru AI akan bantu kamu faham.',
  },
};

const MOOD_MESSAGES = {
  happy: 'Syabas! Teruskan usaha kamu.',
  thinking: 'Mari kita cuba sekali lagi.',
  teaching: 'Guru AI akan bantu kamu faham.',
  celebrating: 'Hebat! Kamu semakin mahir.',
  encouraging: 'Mari kita cuba sekali lagi.',
  waiting: 'Sedang menyediakan pembelajaran terbaik untuk kamu...',
};

const VALID_MOODS = new Set(['happy', 'thinking', 'teaching', 'celebrating', 'encouraging', 'waiting']);
const VALID_SIZES = new Set(['sm', 'md', 'lg']);

export default function Mascot({
  character = 'janna',
  mood = 'happy',
  size = 'md',
  showSpeechBubble = false,
  message = '',
}) {
  const normalizedCharacter = character === 'jati' ? 'jati' : 'janna';
  const normalizedMood = VALID_MOODS.has(mood) ? mood : 'happy';
  const normalizedSize = VALID_SIZES.has(size) ? size : 'md';
  const meta = CHARACTER_META[normalizedCharacter];
  const bubbleMessage = message || MOOD_MESSAGES[normalizedMood] || meta.defaultMessage;

  return (
    <div
      className={`mascot mascot-${normalizedCharacter} mascot-${normalizedMood} mascot-${normalizedSize}`}
      aria-label={`${meta.name}, ${meta.role}, ${normalizedMood}`}
    >
      <div className="mascot-avatar" aria-hidden="true">
        <span>{meta.initials}</span>
      </div>
      <div className="mascot-caption">
        <b>{meta.name}</b>
        <small>{meta.role}</small>
      </div>
      {showSpeechBubble && <p className="mascot-speech">{bubbleMessage}</p>}
    </div>
  );
}
