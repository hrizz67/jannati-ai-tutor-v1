import React from 'react';

function getBadgeLabel(badge) {
  if (!badge) return 'Belum ada lencana';
  if (typeof badge === 'string') return badge;
  return badge.label || badge.name || badge.title || 'Belum ada lencana';
}

export default function GamificationSummary({ profile = {}, className = '' }) {
  const badges = Array.isArray(profile.badges) ? profile.badges : [];
  const newestBadge = getBadgeLabel(badges[0]);

  return (
    <div className={`recommend-meta gamification-summary ${className}`.trim()} aria-label="Ringkasan gamifikasi">
      <span><b>{Number(profile.xp) || 0}</b> XP</span>
      <span>Tahap <b>{Number(profile.level) || 1}</b></span>
      <span>Syiling <b>{Number(profile.coins) || 0}</b></span>
      <span>Streak <b>{Number(profile.currentStreak) || 0}</b></span>
      <span>Lencana <b>{newestBadge}</b></span>
    </div>
  );
}
