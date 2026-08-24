import React from 'react';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export default function LevelProgress({
  currentValue = 0,
  maxValue = 100,
  progressPercent = 0,
  level = 1,
  levelTitle = '',
  nextLevelTitle = ''
}) {
  const safeCurrent = Math.max(0, safeNumber(currentValue, 0));
  const safeMax = Math.max(1, safeNumber(maxValue, 100));
  const safeProgress = clamp(Math.round(safeNumber(progressPercent, 0)), 0, 100);
  const safeLevel = Math.max(1, safeNumber(level, 1));
  const safeLevelTitle = String(levelTitle || `Tahap ${safeLevel}`).trim();
  const safeNextLevelTitle = String(nextLevelTitle || `Tahap ${safeLevel + 1}`).trim();

  return (
    <div className="gamification-level-progress">
      <div className="gamification-level-progress-copy">
        <p className="eyebrow">Kemajuan Tahap</p>
        <h3>{safeLevelTitle}</h3>
        <p>{safeCurrent} daripada {safeMax} XP ke tahap seterusnya</p>
      </div>
      <progress
        className="gamification-progress-bar"
        value={safeCurrent}
        max={safeMax}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeCurrent}
        aria-valuetext={`${safeProgress}% lengkap`}
        aria-label="Kemajuan ke tahap seterusnya"
      >
        {safeProgress}%
      </progress>
      <div className="gamification-level-progress-foot">
        <span>{safeProgress}% lengkap</span>
        <span>Sasaran seterusnya: {safeNextLevelTitle}</span>
      </div>
    </div>
  );
}
