import React from 'react';
import Mascot from './Mascot';
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

  return (
    <aside className={`mascot-card mascot-card-${size} mascot-card-${animation}`} aria-label={`${personality.name}: ${displayMessage}`}>
      {normalizedCharacter === 'janna'
        ? (
          <div className="mascot-card-avatar" aria-hidden="true">
            <JannaAvatar size={64} className="mascot-card-avatar-image" />
          </div>
        )
        : <Mascot character={normalizedCharacter} mood={mood} size={size} />}
      <div className="mascot-card-copy">
        {normalizedCharacter === 'janna'
          ? <>
              <p className="eyebrow">JANNA</p>
              <b>Rakan Pembelajaran AI</b>
            </>
          : <>
              <p className="eyebrow">{personality.name}</p>
              <b>{personality.role}</b>
            </>}
        <span>{displayMessage}</span>
      </div>
    </aside>
  );
}
