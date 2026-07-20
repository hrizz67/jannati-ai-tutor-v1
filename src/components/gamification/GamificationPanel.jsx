import React from 'react';
import { buildRewardSummary } from '../../gamification/index.js';
import AchievementBadge from './AchievementBadge.jsx';
import LevelProgress from './LevelProgress.jsx';

function safeText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

export default function GamificationPanel({
  rewardSummary = null,
  profile = null,
  className = ''
}) {
  const summary = rewardSummary && typeof rewardSummary === 'object'
    ? rewardSummary
    : buildRewardSummary(profile || {});

  const xp = Math.max(0, safeNumber(summary.xp, 0));
  const level = Math.max(1, safeNumber(summary.level, 1));
  const progressPercent = Math.max(0, Math.min(100, safeNumber(summary.progressPercent, 0)));
  const nextLevelXP = Math.max(0, safeNumber(summary.nextLevelXP, 0));
  const currentStreak = Math.max(0, safeNumber(summary.streak?.current, 0));
  const bestStreak = Math.max(0, safeNumber(summary.streak?.best, 0));
  const totalAchievements = Array.isArray(summary.achievements) ? summary.achievements.length : 0;
  const latestAchievement = getLatestAchievement(summary.achievements);
  const onboardingMessage = xp === 0 && level === 1 && currentStreak === 0 && totalAchievements === 0
    ? 'Mulakan latihan hari ini untuk kumpul XP, naik tahap, dan buka pencapaian pertama.'
    : '';

  return (
    <section className={`card gamification-panel ${className}`.trim()} aria-labelledby="gamification-panel-title">
      <p className="eyebrow">Gamifikasi Pembelajaran</p>
      <h2 id="gamification-panel-title">Ganjaran Pembelajaran</h2>

      {onboardingMessage && (
        <p className="memory-last gamification-onboarding" role="status">
          {onboardingMessage}
        </p>
      )}

      <div className="mastery-summary-grid gamification-summary-grid">
        <div><b>{xp}</b><span>XP Semasa</span></div>
        <div><b>{level}</b><span>Tahap Semasa</span></div>
        <div><b>{progressPercent}%</b><span>Kemajuan ke Tahap Seterusnya</span></div>
        <div><b>{currentStreak}</b><span>Streak Semasa</span></div>
        <div><b>{bestStreak}</b><span>Streak Terbaik</span></div>
        <div><b>{totalAchievements}</b><span>Jumlah Pencapaian</span></div>
      </div>

      <LevelProgress
        currentXP={xp}
        progressPercent={progressPercent}
        nextLevelXP={nextLevelXP}
        level={level}
      />

      <div className="gamification-achievement-block">
        <p className="eyebrow">Pencapaian Terkini</p>
        <AchievementBadge achievement={latestAchievement} />
        {!latestAchievement && (
          <p className="memory-last" role="status">Belum ada pencapaian</p>
        )}
      </div>

      <details className="gamification-details">
        <summary><span>Butiran Lanjut</span><small>Lihat ringkasan XP dan streak penuh</small></summary>
        <div className="recommend-meta gamification-meta">
          <span>XP semasa: <b>{xp}</b></span>
          <span>Tahap semasa: <b>{level}</b></span>
          <span>Streak: <b>{currentStreak}</b></span>
          <span>Pencapaian: <b>{totalAchievements}</b></span>
        </div>
      </details>
    </section>
  );
}
