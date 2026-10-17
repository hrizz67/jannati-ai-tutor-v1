import React from 'react';

function appendUnique(parts, value) {
  const normalized = String(value || '').trim();
  if (!normalized) return;
  if (parts.some(part => part.toLocaleLowerCase() === normalized.toLocaleLowerCase())) return;
  parts.push(normalized);
}

export function buildQuizFeedbackAnnouncement({
  title = '',
  message = '',
  answerChecked = false,
  canRetry = false,
  retryLabel = 'Cuba Lagi',
  nextLabel = 'Seterusnya'
} = {}) {
  const parts = [];
  appendUnique(parts, title);
  appendUnique(parts, message);
  if (answerChecked) appendUnique(parts, `${canRetry ? retryLabel : nextLabel} tersedia.`);
  return parts.join(' ');
}

export default function QuizFeedbackAccessibility(props) {
  const announcement = buildQuizFeedbackAnnouncement(props);
  if (!announcement) return null;
  return <p
    className="interactive-screen-reader-only"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    data-quiz-feedback-announcement
  >{announcement}</p>;
}
