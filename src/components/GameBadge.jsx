import React from 'react';

export default function GameBadge({ src, alt = '', className = '' }) {
  return <img className={`game-badge-icon ${className}`.trim()} src={src} alt={alt} aria-hidden={!alt} loading="lazy" decoding="async" draggable="false" />;
}
