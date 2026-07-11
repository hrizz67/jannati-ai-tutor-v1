import React from 'react';
import jannaAvatar from '../assets/mascot/janna.png';

export default function JannaAvatar({ size = 64, className = '' }) {
  const resolvedSize = typeof size === 'number' ? size : 64;

  return (
    <img
      src={jannaAvatar}
      alt="Janna"
      className={`janna-avatar ${className}`.trim()}
      style={{
        width: resolvedSize,
        height: resolvedSize,
        borderRadius: '50%',
        backgroundColor: '#fff',
        border: '3px solid #F4B400',
        boxShadow: '0 6px 16px rgba(0,0,0,.12)',
        objectFit: 'cover',
        display: 'block',
      }}
      loading="eager"
      decoding="async"
    />
  );
}
