import React from 'react';
import JannaAvatar from './JannaAvatar';
import { AI_PERSONALITIES } from '../brand/personalities';

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

  return (
    <aside className={`mascot-card mascot-card-${size} mascot-card-${animation}`} aria-label={`${personality.name}: ${displayMessage}`}>
      <div className="mascot-card-avatar" aria-hidden="true">
        {normalizedCharacter === 'janna'
          ? <JannaAvatar size={64} className="mascot-card-avatar-image" />
          : <div className="mascot-card-avatar-fallback">JT</div>}
      </div>
      <div className="mascot-card-copy">
        <p className="eyebrow">{displayName}</p>
        <b>{personality.role}</b>
        <span>{displayMessage}</span>
      </div>
    </aside>
  );
}
