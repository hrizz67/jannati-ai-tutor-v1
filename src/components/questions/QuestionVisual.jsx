import React from 'react';

function ShapeSvg({ shape, label }) {
  return <svg className="interactive-shape-svg" viewBox="0 0 120 90" role="img" aria-label={label || shape}>
    {shape === 'triangle' && <polygon points="60,10 108,78 12,78" />}
    {shape === 'square' && <rect x="22" y="8" width="76" height="76" rx="4" />}
    {shape === 'rectangle' && <rect x="10" y="18" width="100" height="54" rx="4" />}
    {shape === 'circle' && <circle cx="60" cy="45" r="36" />}
    {shape === 'cube' && <g className="interactive-shape-lines"><path d="M30 25 62 10 94 28 62 44Z" /><path d="M30 25v38l32 18V44Z" /><path d="M94 28v37L62 81V44Z" /></g>}
    {shape === 'cylinder' && <g className="interactive-shape-lines"><ellipse cx="60" cy="19" rx="35" ry="12" /><path d="M25 19v50c0 7 16 13 35 13s35-6 35-13V19" /><path d="M25 68c0 7 16 13 35 13s35-6 35-13" /></g>}
  </svg>;
}

function PlaceValueVisual({ columns = [] }) {
  return <div className="place-value-model" role="img" aria-label={columns.map(column => `${column.value} ${column.label}`).join(', ')}>
    {columns.map(column => <div className="place-value-column" key={column.id}>
      <b>{column.label}</b>
      <div className={`place-value-blocks block-${column.block || 'one'}`} aria-hidden="true">
        {Array.from({ length: Math.max(0, Math.min(10, Number(column.value) || 0)) }, (_, index) => <span key={index} />)}
      </div>
      <strong>{column.value}</strong>
    </div>)}
  </div>;
}

function ClockVisual({ hour = 12, minute = 0, label }) {
  const normalizedMinute = Math.max(0, Math.min(59, Number(minute) || 0));
  const hourAngle = ((Number(hour) || 0) % 12) * 30 + normalizedMinute * .5;
  const minuteAngle = normalizedMinute * 6;
  const numbers = Array.from({ length: 12 }, (_, index) => {
    const value = index + 1;
    const angle = value * Math.PI / 6;
    return { value, x: 60 + Math.sin(angle) * 43, y: 64 - Math.cos(angle) * 43 };
  });
  return <svg className="interactive-clock-svg" viewBox="0 0 120 120" role="img" aria-label={label || `Pukul ${hour}:${String(normalizedMinute).padStart(2, '0')}`}>
    <circle className="clock-face" cx="60" cy="60" r="55" />
    {numbers.map(number => <text x={number.x} y={number.y} key={number.value}>{number.value}</text>)}
    <line className="clock-hand hour" x1="60" y1="64" x2="60" y2="34" transform={`rotate(${hourAngle} 60 60)`} />
    <line className="clock-hand minute" x1="60" y1="66" x2="60" y2="20" transform={`rotate(${minuteAngle} 60 60)`} />
    <circle className="clock-pin" cx="60" cy="60" r="4" />
  </svg>;
}

function PlantDiagram({ label }) {
  return <svg className="interactive-plant-svg" viewBox="0 0 320 400" role="img" aria-label={label || 'Rajah tumbuhan'}>
    <rect className="plant-sky" width="320" height="305" rx="26" />
    <path className="plant-soil" d="M18 300C72 282 118 310 166 295s91-9 136 5v82H18Z" />
    <path className="plant-stem" d="M160 307C158 250 160 186 160 105" />
    <path className="plant-root" d="M160 300c-4 31-28 45-49 68m49-64c10 26 35 39 54 62m-54-45c-1 25-8 42-18 58m20-63c7 25 6 43 4 62" />
    <g className="plant-leaves">
      <ellipse cx="119" cy="205" rx="48" ry="23" transform="rotate(22 119 205)" />
      <ellipse cx="208" cy="172" rx="52" ry="24" transform="rotate(-24 208 172)" />
      <ellipse cx="120" cy="135" rx="42" ry="20" transform="rotate(18 120 135)" />
    </g>
    <g className="plant-flower">
      {Array.from({ length: 6 }, (_, index) => <ellipse key={index} cx="160" cy="72" rx="17" ry="34" transform={`rotate(${index * 60} 160 104)`} />)}
      <circle cx="160" cy="104" r="20" />
    </g>
  </svg>;
}

function RulerVisual({ visual }) {
  const maxCm = Math.max(1, Math.round(Number(visual.maxCm) || 15));
  const startCm = Math.max(0, Math.min(maxCm, Number(visual.startCm) || 0));
  const endCm = Math.max(startCm, Math.min(maxCm, Number(visual.endCm) || maxCm));
  const left = 32;
  const width = 576;
  const point = value => left + (value / maxCm) * width;
  return <svg className="interactive-ruler-svg" viewBox="0 0 640 184" role="img" aria-label={`${visual.objectLabel || 'Objek'} bermula pada ${startCm} sentimeter dan berakhir pada ${endCm} sentimeter`}>
    <line className="ruler-object" x1={point(startCm)} y1="40" x2={point(endCm)} y2="40" />
    <line className="ruler-object-end" x1={point(startCm)} y1="26" x2={point(startCm)} y2="54" />
    <line className="ruler-object-end" x1={point(endCm)} y1="26" x2={point(endCm)} y2="54" />
    <text className="ruler-object-label" x={(point(startCm) + point(endCm)) / 2} y="22">{visual.objectLabel || 'Objek'}</text>
    <rect className="ruler-body" x="20" y="72" width="600" height="92" rx="12" />
    {Array.from({ length: maxCm + 1 }, (_, value) => <g key={value}>
      <line className="ruler-tick" x1={point(value)} y1="73" x2={point(value)} y2={value % 5 === 0 ? 116 : 104} />
      <text className="ruler-number" x={point(value)} y="145">{value}</text>
    </g>)}
    <text className="ruler-unit" x="606" y="178">cm</text>
  </svg>;
}

export default function QuestionVisual({ visual, className = '' }) {
  if (!visual) return null;
  if (visual.kind === 'placeValue') return <PlaceValueVisual columns={visual.columns} />;
  if (visual.kind === 'clock') return <ClockVisual hour={visual.hour} minute={visual.minute} label={visual.label} />;
  if (visual.kind === 'plantDiagram') return <PlantDiagram label={visual.label} />;
  if (visual.kind === 'ruler') return <RulerVisual visual={visual} />;
  if (visual.kind === 'shape') return <ShapeSvg shape={visual.shape} label={visual.label} />;
  if (visual.kind === 'object') {
    return <span
      className={`interactive-object-symbol ${visual.lang === 'ar' ? 'arabic-glyph' : ''} ${className}`}
      role="img"
      aria-label={visual.label || 'Objek'}
      lang={visual.lang}
      dir={visual.dir}
    >{visual.symbol || '●'}</span>;
  }
  return null;
}
