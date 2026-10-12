import React from 'react';

function normalizeMetricText(value, fallback = 'Belum tersedia') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  if (!text || text === '-' || text === 'undefined' || text === 'null') return fallback;
  return text;
}

export function getMetricValueKind(value, displayValue = value) {
  if (typeof value === 'number' && Number.isFinite(value)) return 'numeric';
  const text = String(displayValue ?? '').trim();
  if (/^(?:RM\s*)?[+-]?\d+(?:[.,]\d+)?%?$/i.test(text)) return 'numeric';
  if (text.length > 18 || text.split(/\s+/).filter(Boolean).length > 2) return 'long-text';
  return 'text';
}

export function MetricValue({ value, children, kind = '', className = '' }) {
  const resolvedKind = kind || getMetricValueKind(value, children ?? value);
  return (
    <b
      className={`metric-value metric-value--${resolvedKind} ${className}`.trim()}
      data-value-kind={resolvedKind}
    >
      {children ?? value}
    </b>
  );
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
  const valueKind = isUnknown ? 'unknown' : getMetricValueKind(value, safeValue);
  const ariaLabel = [safeLabel, safeValue, safeSubtitle].filter(Boolean).join('. ');

  return (
    <div
      className={`metric-card ${isUnknown ? 'metric-card-unknown' : ''} ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
    >
      <span className="metric-card-label">{safeLabel}</span>
      <MetricValue value={value} kind={valueKind} className={`metric-card-value ${isUnknown ? 'is-unknown' : ''}`.trim()}>{safeValue}</MetricValue>
      {safeSubtitle ? <small className="metric-card-subtitle">{safeSubtitle}</small> : null}
    </div>
  );
}
