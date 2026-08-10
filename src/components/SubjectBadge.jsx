import React from 'react';
import GameBadge from './GameBadge.jsx';
import bmBadge from '../assets/icons/3d/bm-badge.webp';
import mathBadge from '../assets/icons/3d/math-badge.webp';
import englishBadge from '../assets/icons/3d/english-badge.webp';
import sainsBadge from '../assets/icons/3d/sains-badge.webp';
import arabBadge from '../assets/icons/3d/arab-badge.webp';
import islamBadge from '../assets/icons/3d/islam-badge.webp';
import pjBadge from '../assets/icons/3d/pj-badge.webp';
import pkBadge from '../assets/icons/3d/pk-badge.webp';
import { SubjectIcon } from './IconGlyph.jsx';

const badges = { bm: bmBadge, math: mathBadge, english: englishBadge, sains: sainsBadge, arab: arabBadge, islam: islamBadge, pj: pjBadge, pk: pkBadge };

export default function SubjectBadge({ subjectId, className = '' }) {
  const source = badges[String(subjectId || '').toLowerCase()];
  return source ? <GameBadge src={source} className={className} /> : <SubjectIcon subjectId={subjectId} size={18} />;
}
