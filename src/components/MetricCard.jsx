import React from 'react';

function normalizeMetricText(value, fallback = 'Belum tersedia') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  if (!text || text === '-' || text === 'undefined' || text === 'null') return fallback;
  return text;
}

export default function MetricCard({
  value,
  label,
  subtitle = '',
  className = '',
  unknownLabel = 'Belum tersedia'
}) {
  const safeLabel = normalizeMetricText(label, 'Maklumat');
  const safeValue = normalizeMetricText(value, unknownLabel);
  const safeSubtitle = normalizeMetricText(subtitle, '');
  const isUnknown = safeValue === unknownLabel;
  const ariaLabel = [safeLabel, safeValue, safeSubtitle].filter(Boolean).join('. ');

  return (
    <div
      className={`metric-card ${isUnknown ? 'metric-card-unknown' : ''} ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
    >
      <span className="metric-card-label">{safeLabel}</span>
      <b className={`metric-card-value ${isUnknown ? 'is-unknown' : ''}`.trim()}>{safeValue}</b>
      {safeSubtitle ? <small className="metric-card-subtitle">{safeSubtitle}</small> : null}
    </div>
  );
}
