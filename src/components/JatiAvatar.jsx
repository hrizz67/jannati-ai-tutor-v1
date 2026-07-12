import React, { useState } from 'react';
import jatiAvatar from '../assets/mascot/jati.png';

export default function JatiAvatar({ size = 64, className = '' }) {
  const resolvedSize = typeof size === 'number' ? size : 64;
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <div
        className={`jati-avatar-fallback ${className}`.trim()}
        style={{
          width: resolvedSize,
          height: resolvedSize,
          borderRadius: '50%',
          backgroundColor: '#fff',
          border: '3px solid #F4B400',
          boxShadow: '0 6px 16px rgba(0,0,0,.12)',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 900,
          color: '#0f8a43',
          lineHeight: 1,
        }}
      >
        JT
      </div>
    );
  }

  return (
    <img
      src={jatiAvatar}
      alt="Jati"
      className={`jati-avatar ${className}`.trim()}
      onError={() => setImageFailed(true)}
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
