import React from 'react';

function safeText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

const ACTIVITY_LABELS = {
  review: 'Ulang kaji',
  practice: 'Latihan',
  challenge: 'Cabaran',
  revision: 'Pengukuhan'
};

const PRIORITY_LABELS = {
  high: 'Keutamaan tinggi',
  medium: 'Keutamaan sederhana',
  low: 'Keutamaan rendah'
};

function formatDuration(minutes = 0) {
  const value = Math.max(5, Math.min(60, safeNumber(minutes, 0)));
  if (value >= 60) return '1 jam';
  return `${value} minit`;
}

export default function StudyBlockItem({ block = {}, compact = false }) {
  const subject = safeText(block.subject, 'Subjek');
  const topic = safeText(block.topic, 'Topik');
  const reason = safeText(block.reason, 'Perlu latihan seimbang.');
  const durationLabel = formatDuration(block.durationMinutes);
  const priorityLabel = PRIORITY_LABELS[block.priority] || 'Keutamaan sederhana';
  const activityLabel = ACTIVITY_LABELS[block.activityType] || 'Latihan';
  const recommendationKey = safeText(block.recommendationKey, 'review');

  return (
    <article className={`study-block-item ${compact ? 'compact' : ''}`.trim()}>
      <header className="study-block-item-head">
        <b>{subject}</b>
        <span>{topic}</span>
      </header>
      <p>{reason}</p>
      <div className="recommend-meta study-block-meta">
        <span>{durationLabel}</span>
        <span>{priorityLabel}</span>
        <span>{activityLabel}</span>
        <span>{recommendationKey}</span>
      </div>
    </article>
  );
}
