import React from 'react';
import AchievementBadge from './AchievementBadge.jsx';
import LevelProgress from './LevelProgress.jsx';
import { createCanonicalGamification } from '../../gamification/index.js';

function safeText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function getLatestAchievement(achievements = []) {
  const rows = Array.isArray(achievements) ? achievements.filter(Boolean) : [];
  if (!rows.length) return null;
  return [...rows].sort((a, b) => {
    const earnedA = `${a.earnedAt || ''}`;
    const earnedB = `${b.earnedAt || ''}`;
    return earnedB.localeCompare(earnedA) || `${b.id || ''}`.localeCompare(`${a.id || ''}`);
  })[0] || null;
}

function buildFallbackCanonical(profile = {}, rewardSummary = null) {
  if (rewardSummary && typeof rewardSummary === 'object') {
    return createCanonicalGamification({
      gamificationProfile: {
        xp: rewardSummary.xp,
        level: rewardSummary.level,
        nextLevelXP: rewardSummary.nextLevelXP,
        progressPercent: rewardSummary.progressPercent,
        currentStreak: rewardSummary.streak?.current,
        bestStreak: rewardSummary.streak?.best,
        achievements: rewardSummary.achievements,
        coins: rewardSummary.rewards?.coins,
        latestSessionXp: rewardSummary.sessionXp
      }
    });
  }

  return createCanonicalGamification({ gamificationProfile: profile || {} });
}

export default function GamificationPanel({
  canonical = null,
  rewardSummary = null,
  profile = null,
  className = ''
}) {
  const detailPanelId = React.useId();
  const titleId = React.useId();
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const summary = canonical && typeof canonical === 'object'
    ? canonical
    : buildFallbackCanonical(profile || {}, rewardSummary);
  const latestAchievement = getLatestAchievement(summary.achievements);
  const hasSecondaryDetails = summary.subjectXp > 0 || summary.subjectLevel > 0 || summary.bestStreak > summary.currentStreak || summary.latestSessionXp > 0 || summary.starCount > 0;

  if (!summary.hasEvidence) {
    return (
      <section className={`card gamification-panel ${className}`.trim()} aria-labelledby={titleId}>
        <p className="eyebrow">Gamifikasi Pembelajaran</p>
        <h2 id={titleId}>Ganjaran Pembelajaran</h2>
        <div className="gamification-empty-state" role="status">
          <p><strong>Belum ada data ganjaran.</strong></p>
          <p>Lengkapkan latihan untuk mula mengumpul XP dan pencapaian.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`card gamification-panel ${className}`.trim()} aria-labelledby={titleId}>
      <p className="eyebrow">Gamifikasi Pembelajaran</p>
      <h2 id={titleId}>Ganjaran Pembelajaran</h2>

      <div className="mastery-summary-grid gamification-summary-grid">
        <div><b>{summary.globalXp}</b><span>Jumlah XP</span></div>
        <div><b>{summary.globalLevel}</b><span>Tahap Semasa</span></div>
        <div><b>{summary.currentStreak}</b><span>Streak Semasa</span></div>
        <div><b>{summary.achievementCount}</b><span>Pencapaian</span></div>
      </div>

      <LevelProgress
        level={summary.globalLevel}
        levelTitle={summary.levelTitle}
        nextLevelTitle={summary.nextLevelTitle}
        currentValue={summary.globalXpIntoLevel}
        maxValue={summary.globalXpForNextLevel}
        progressPercent={summary.globalProgressPercent}
      />

      {hasSecondaryDetails && (
        <div className="gamification-details">
          <button
            type="button"
            className="gamification-details-toggle"
            aria-expanded={detailsOpen}
            aria-controls={detailPanelId}
            onClick={() => setDetailsOpen(open => !open)}
          >
            <span className="gamification-details-toggle__title">Butiran Lanjut</span>
            <span className="gamification-details-toggle__summary">Lihat data subjek dan ganjaran tambahan</span>
          </button>
          <div
            id={detailPanelId}
            className="recommend-meta gamification-meta"
            hidden={!detailsOpen}
          >
            {summary.subjectXp > 0 ? <span>XP subjek semasa: <strong>{summary.subjectXp}</strong></span> : null}
            {summary.subjectLevel > 0 ? <span>Tahap subjek semasa: <strong>{summary.subjectLevel}</strong></span> : null}
            {summary.bestStreak > summary.currentStreak ? <span>Streak terbaik: <strong>{summary.bestStreak}</strong></span> : null}
            {summary.latestSessionXp > 0 ? <span>XP sesi terbaru: <strong>{summary.latestSessionXp}</strong></span> : null}
            {summary.starCount > 0 ? <span>Bintang terkumpul: <strong>{summary.starCount}</strong></span> : null}
          </div>
        </div>
      )}

      <div className="gamification-achievement-block">
        <p className="eyebrow">Pencapaian Terkini</p>
        <AchievementBadge achievement={latestAchievement} />
        {!latestAchievement ? <p className="gamification-achievement-note">{safeText('', 'Teruskan latihan untuk membuka pencapaian pertama.')}</p> : null}
      </div>
    </section>
  );
}
