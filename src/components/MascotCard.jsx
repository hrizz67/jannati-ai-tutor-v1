import React from 'react';
import JannaAvatar from './JannaAvatar';
import JatiAvatar from './JatiAvatar';
import { AI_PERSONALITIES } from '../brand/personalities';

function normalizeMood(mood = 'happy') {
  const value = `${mood}`.toLowerCase();
  if (['bangga', 'bersemangat', 'ceria', 'happy', 'celebrating'].includes(value)) return 'celebrating';
  if (['fokus', 'yakin', 'sokongan', 'thinking'].includes(value)) return 'thinking';
  if (['mesra', 'encouraging', 'supportive'].includes(value)) return 'encouraging';
  if (['waiting', 'loading'].includes(value)) return 'waiting';
  if (['teaching', 'analitikal', 'tenang-tegas', 'sabar-tersusun', 'tenang-berstruktur'].includes(value)) return 'teaching';
  return value || 'happy';
}

export default function MascotCard({
  character = 'janna',
  message = '',
  mood = 'happy',
  size = 'md',
  animation = 'gentle',
}) {
  const normalizedCharacter = character === 'jati' ? 'jati' : 'janna';
  const personality = AI_PERSONALITIES[normalizedCharacter];
  const displayMessage = message || (normalizedCharacter === 'jati'
    ? 'Jom fikir bersama. Kamu boleh buat.'
    : 'Syabas! Teruskan usaha kamu.');
  const displayName = normalizedCharacter === 'jati' ? 'JATI' : 'JANNA';
  const normalizedMood = normalizeMood(mood);

  return (
    <aside className={`mascot-card mascot-card-${size} mascot-card-${animation} mascot-card-${normalizedMood}`} data-mood={normalizedMood} aria-label={`${personality.name}: ${displayMessage}`}>
      <div className="mascot-card-avatar" aria-hidden="true">
        {normalizedCharacter === 'janna'
          ? <JannaAvatar size={64} className="mascot-card-avatar-image" />
          : <JatiAvatar size={64} className="mascot-card-avatar-image" />}
      </div>
      <div className="mascot-card-copy">
        <p className="eyebrow">{displayName}</p>
        <b>{personality.role}</b>
        <span>{displayMessage}</span>
      </div>
    </aside>
  );
}
