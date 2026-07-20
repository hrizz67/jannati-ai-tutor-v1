import React from 'react';
import StudyBlockItem from './StudyBlockItem.jsx';

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export default function DailyPlanCard({ plan = null, className = '' }) {
  const titleId = 'daily-plan-card-title';
  const blocks = Array.isArray(plan?.blocks) ? plan.blocks : [];
  const onboarding = Boolean(plan?.onboarding);
  const availableMinutes = safeNumber(plan?.availableMinutes, 0);

  if (!plan) {
    return (
      <section className={`card daily-plan-card ${className}`.trim()} aria-labelledby={titleId}>
        <p className="eyebrow">Pelan Hari Ini</p>
        <h3 id={titleId}>Pelan Hari Ini</h3>
        <p className="memory-last" role="status">Pelan belum tersedia.</p>
      </section>
    );
  }

  return (
    <section className={`card daily-plan-card ${className}`.trim()} aria-labelledby={titleId}>
      <p className="eyebrow">Pelan Hari Ini</p>
      <h3 id={titleId}>{onboarding ? 'Pelan Permulaan Hari Ini' : 'Pelan Hari Ini'}</h3>
      <p className="memory-last" role="status">
        {onboarding
          ? 'Pelan permulaan ini membantu murid membina rutin belajar yang seimbang.'
          : `Cadangan harian disesuaikan dengan ${availableMinutes || 0} minit masa belajar.`}
      </p>
      {blocks.length ? (
        <div className="timeline">
          {blocks.slice(0, 4).map((block, index) => (
            <StudyBlockItem key={`${block.subjectId || 'sub'}-${block.topicId || 'topic'}-${index}`} block={block} />
          ))}
        </div>
      ) : (
        <p className="memory-last" role="status">Tiada blok harian tersedia.</p>
      )}
    </section>
  );
}
