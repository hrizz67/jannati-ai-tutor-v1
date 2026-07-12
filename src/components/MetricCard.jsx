import React from 'react';

export default function MetricCard({ value, label, subtitle = '', className = '' }) {
  return (
    <div className={`metric-card ${className}`.trim()}>
      <b className="metric-card-value">{value}</b>
      <span className="metric-card-label">{label}</span>
      {subtitle ? <small className="metric-card-subtitle">{subtitle}</small> : null}
    </div>
  );
}
