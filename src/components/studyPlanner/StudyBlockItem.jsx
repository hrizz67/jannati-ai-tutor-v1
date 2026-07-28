import React from 'react';
import { formatDurationLabel, formatPriority, formatRecommendationKey, formatSubjectName, formatTopicName } from '../../utils/displayFormatter.js';

function safeText(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

const ACTIVITY_LABELS = {
  review: 'Ulang Kaji',
  practice: 'Latihan',
  challenge: 'Cabaran',
  revision: 'Pengukuhan'
};

export default function StudyBlockItem({ block = {}, compact = false }) {
  const subject = formatSubjectName(block.subjectId || block.subject || 'Subjek');
  const topic = formatTopicName(block.topicId || block.topic || 'Topik');
  const reason = safeText(block.reason, 'Perlu latihan seimbang.');
  const durationLabel = formatDurationLabel(Math.max(5, Math.min(60, safeNumber(block.durationMinutes, 0))));
  const priorityLabel = `Keutamaan ${formatPriority(block.priority)}`;
  const activityLabel = ACTIVITY_LABELS[block.activityType] || 'Latihan';
  const recommendationLabel = formatRecommendationKey(safeText(block.recommendationKey, 'review'));

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
        <span>{recommendationLabel}</span>
      </div>
    </article>
  );
}
