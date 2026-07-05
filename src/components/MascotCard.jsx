import React from 'react';
import Mascot from './Mascot';
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

  return (
    <aside className={`mascot-card mascot-card-${size} mascot-card-${animation}`} aria-label={`${personality.name}: ${displayMessage}`}>
      <Mascot character={normalizedCharacter} mood={mood} size={size} />
      <div className="mascot-card-copy">
        <p className="eyebrow">{personality.name}</p>
        <b>{personality.role}</b>
        <span>{displayMessage}</span>
      </div>
    </aside>
  );
}
