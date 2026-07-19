import React from 'react';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export default function LevelProgress({
  currentXP = 0,
  progressPercent = 0,
  nextLevelXP = 0,
  level = 1
}) {
  const safeXP = Math.max(0, safeNumber(currentXP, 0));
  const safeProgress = clamp(Math.round(safeNumber(progressPercent, 0)), 0, 100);
  const safeNext = Math.max(0, safeNumber(nextLevelXP, 0));
  const safeLevel = Math.max(1, safeNumber(level, 1));

  return (
    <div className="gamification-level-progress">
      <div className="gamification-level-progress-head">
        <span>XP {safeXP}</span>
        <span>Tahap {safeLevel}</span>
      </div>
      <div
        className="progress-wrap"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeProgress}
        aria-label={`Kemajuan tahap ${safeLevel} sebanyak ${safeProgress} peratus`}
      >
        <div className="progress" style={{ width: `${safeProgress}%` }} />
      </div>
      <div className="gamification-level-progress-foot">
        <span>{safeProgress}%</span>
        <span>XP ke {safeNext || 'tahap seterusnya'}</span>
      </div>
    </div>
  );
}
