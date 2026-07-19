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

export default function WeeklyPlanList({ weeklyPlan = null, className = '' }) {
  const days = Array.isArray(weeklyPlan?.days) ? weeklyPlan.days : [];

  if (!weeklyPlan) {
    return (
      <section className={`card weekly-plan-list ${className}`.trim()} aria-labelledby="weekly-plan-title">
        <p className="eyebrow">Pelan Mingguan</p>
        <h3 id="weekly-plan-title">Pelan Mingguan</h3>
        <p className="memory-last" role="status">Pelan mingguan belum tersedia.</p>
      </section>
    );
  }

  return (
    <section className={`card weekly-plan-list ${className}`.trim()} aria-labelledby="weekly-plan-title">
      <p className="eyebrow">Pelan Mingguan</p>
      <h3 id="weekly-plan-title">Pelan Mingguan</h3>
      {days.length ? (
        <div className="parent-topic-list weekly-plan-day-list">
          {days.slice(0, 7).map((day, index) => {
            const blocks = Array.isArray(day?.blocks) ? day.blocks : [];
            const dayLabel = safeText(day?.dayLabel, `Hari ${index + 1}`);
            const subjectList = blocks
              .map(block => safeText(block?.subject, 'Subjek'))
              .filter(Boolean)
              .join(', ') || 'Tiada subjek';
            const totalMinutes = safeNumber(day?.totalMinutes, 0);
            const totalBlocks = blocks.length;

            return (
              <details className="parent-topic-item weekly-plan-day" key={`${safeText(day?.date, 'day')}-${index}`}>
                <summary>
                  <b>{dayLabel}</b>
                  <span>{subjectList}</span>
                  <span>{totalMinutes >= 60 ? '1 jam' : `${totalMinutes} minit`}</span>
                  <span>{totalBlocks} blok</span>
                </summary>
                <div className="timeline">
                  {blocks.length ? (
                    blocks.map((block, blockIndex) => (
                      <StudyBlockItem
                        key={`${safeText(block?.subjectId, 'subject')}-${safeText(block?.topicId, 'topic')}-${blockIndex}`}
                        block={block}
                        compact
                      />
                    ))
                  ) : (
                    <p className="memory-last" role="status">Tiada blok untuk hari ini.</p>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      ) : (
        <p className="memory-last" role="status">Tiada jadual mingguan tersedia.</p>
      )}
    </section>
  );
}
