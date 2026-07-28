import React from 'react';
import StudyBlockItem from './StudyBlockItem.jsx';
import { formatDurationLabel, formatFriendlyDate, formatSubjectList } from '../../utils/displayFormatter.js';

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text && text !== 'undefined' && text !== 'null' ? text : fallback;
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isToday(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

export default function WeeklyPlanList({ weeklyPlan = null, className = '' }) {
  const titleId = 'weekly-plan-list-title';
  const days = Array.isArray(weeklyPlan?.days) ? weeklyPlan.days.slice(0, 7) : [];
  const todayDay = React.useMemo(() => days.find(day => isToday(day?.date)) || days[0] || null, [days]);
  const todayKey = todayDay ? `${safeText(todayDay?.date, 'today')}-${safeText(todayDay?.dayLabel, 'today')}` : '';
  const [expandedToday, setExpandedToday] = React.useState(Boolean(todayDay));
  const [expandedExtraKey, setExpandedExtraKey] = React.useState('');

  React.useEffect(() => {
    setExpandedToday(Boolean(todayDay));
    setExpandedExtraKey('');
  }, [todayKey, todayDay]);

  if (!weeklyPlan) {
    return (
      <section className={`card weekly-plan-list ${className}`.trim()} aria-labelledby={titleId}>
        <p className="eyebrow">Pelan Mingguan</p>
        <h3 id={titleId}>Pelan Mingguan</h3>
        <p className="memory-last" role="status">Pelan mingguan belum tersedia.</p>
      </section>
    );
  }

  return (
    <section className={`card weekly-plan-list ${className}`.trim()} aria-labelledby={titleId}>
      <p className="eyebrow">Pelan Mingguan</p>
      <h3 id={titleId}>Pelan Mingguan</h3>
      {days.length ? (
        <div className="parent-topic-list weekly-plan-day-list">
          {days.map((day, index) => {
            const blocks = Array.isArray(day?.blocks) ? day.blocks : [];
            const dayLabel = safeText(day?.dayLabel, formatFriendlyDate(day?.date) || `Hari ${index + 1}`);
            const dayKey = `${safeText(day?.date, 'day')}-${index}`;
            const summarySubjects = formatSubjectList(blocks.map(block => block?.subjectId || block?.subject)) || 'Tiada subjek';
            const totalMinutes = safeNumber(day?.totalMinutes, 0);
            const totalBlocks = blocks.length;
            const compactState = blocks.length
              ? `${summarySubjects} · ${formatDurationLabel(totalMinutes)} · ${totalBlocks} blok`
              : 'Tiada aktiviti dijadualkan';
            const isTodayRow = dayKey === todayKey;
            const expanded = isTodayRow ? expandedToday : expandedExtraKey === dayKey;
            const panelId = `weekly-plan-panel-${index}`;

            return (
              <div className={`parent-topic-item weekly-plan-day ${expanded ? 'expanded' : 'collapsed'} ${isTodayRow ? 'today' : ''}`.trim()} key={dayKey}>
                <button
                  type="button"
                  className="weekly-plan-toggle"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => {
                    if (isTodayRow) {
                      setExpandedToday(value => !value);
                      return;
                    }
                    setExpandedExtraKey(current => (current === dayKey ? '' : dayKey));
                  }}
                >
                  <span className="weekly-plan-label-group">
                    <b>{dayLabel}</b>
                    {isTodayRow && <span className="badge weekly-plan-today-badge">Hari ini</span>}
                  </span>
                  <span className="weekly-plan-summary">{compactState}</span>
                </button>
                <div id={panelId} hidden={!expanded} className="weekly-plan-panel">
                  {blocks.length ? (
                    <div className="timeline">
                      {blocks.map((block, blockIndex) => (
                        <StudyBlockItem
                          key={`${safeText(block?.subjectId, 'subject')}-${safeText(block?.topicId, 'topic')}-${blockIndex}`}
                          block={block}
                          compact
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="memory-last weekly-plan-empty" role="status">Tiada aktiviti dijadualkan untuk hari ini.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="memory-last" role="status">Tiada jadual mingguan tersedia.</p>
      )}
    </section>
  );
}
