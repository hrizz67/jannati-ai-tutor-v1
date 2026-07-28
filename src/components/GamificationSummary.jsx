import React from 'react';
import GamificationPanel from './gamification/GamificationPanel.jsx';
import { createCanonicalGamification } from '../utils/canonicalGamification.js';

export default function GamificationSummary({ profile = {}, source = null, canonical = null, className = '' }) {
  const resolvedCanonical = canonical && typeof canonical === 'object'
    ? canonical
    : createCanonicalGamification(
      source && typeof source === 'object'
        ? { ...source, gamificationProfile: source.gamificationProfile || profile }
        : { gamificationProfile: profile }
    );

  return <GamificationPanel canonical={resolvedCanonical} className={className} />;
}
