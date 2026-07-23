import React from 'react';

const ICON_PATHS = {
  home: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11V10.5" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  bot: (
    <>
      <rect x="6" y="8" width="12" height="10" rx="3" />
      <path d="M9 8V6h6v2" />
      <path d="M9 12h0" />
      <path d="M15 12h0" />
      <path d="M12 13.5v1.5" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 5h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4V5Z" />
      <path d="M9 13h6" />
      <path d="M10 15h4" />
      <path d="M10 18h4" />
      <path d="M6 6h2a3 3 0 0 1-3 3V7a1 1 0 0 1 1-1Zm12 0h-2a3 3 0 0 0 3 3V7a1 1 0 0 0-1-1Z" />
    </>
  ),
  family: (
    <>
      <circle cx="8" cy="9" r="2" />
      <circle cx="16" cy="9" r="2" />
      <path d="M5.5 18a4.5 4.5 0 0 1 5-4 4.5 4.5 0 0 1 5 4" />
      <path d="M14 18a3.5 3.5 0 0 1 4-3" />
      <path d="M5.5 18a3.5 3.5 0 0 1 4-3" />
    </>
  ),
  spark: (
    <>
      <path d="M12 4 13.8 9.2 19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8L12 4Z" />
    </>
  ),
  play: (
    <>
      <path d="M9 7v10l8-5-8-5Z" />
    </>
  ),
  repeat: (
    <>
      <path d="M7 7h8a3 3 0 0 1 3 3v1" />
      <path d="M17 5v4h-4" />
      <path d="M17 17H9a3 3 0 0 1-3-3v-1" />
      <path d="M7 19v-4h4" />
    </>
  ),
  headphones: (
    <>
      <path d="M5 12a7 7 0 0 1 14 0" />
      <rect x="4" y="12" width="3" height="7" rx="1.5" />
      <rect x="17" y="12" width="3" height="7" rx="1.5" />
      <path d="M7 19v-2.5A5 5 0 0 1 12 11a5 5 0 0 1 5 5.5V19" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="4" width="6" height="10" rx="3" />
      <path d="M7 11a5 5 0 0 0 10 0" />
      <path d="M12 14v4" />
      <path d="M9 18h6" />
    </>
  ),
  pen: (
    <>
      <path d="M5 19h4l10-10-4-4L5 15v4Z" />
      <path d="M13 7l4 4" />
    </>
  ),
  chart: (
    <>
      <path d="M5 19h14" />
      <path d="M7 19V10" />
      <path d="M12 19V6" />
      <path d="M17 19v-7" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3" />
      <path d="M21 12h-3" />
      <path d="M12 21v-3" />
      <path d="M3 12h3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </>
  ),
  check: (
    <>
      <path d="M5 13l4 4 10-10" />
    </>
  ),
  gift: (
    <>
      <path d="M4 9h16v4H4z" />
      <path d="M12 9v10" />
      <path d="M7 5a2 2 0 0 0 0 4h10a2 2 0 0 0 0-4 3 3 0 0 0-5 2 3 3 0 0 0-5-2Z" />
    </>
  ),
  fire: (
    <>
      <path d="M13 3s1 3-1 5-1 3 1 4 4 3 4 6a5 5 0 0 1-10 0c0-3 2-5 4-7s1-5 1-8Z" />
    </>
  ),
  star: (
    <>
      <path d="M12 4l2.7 5.5 6.1.9-4.4 4.2 1 6.1L12 18l-5.4 2.7 1-6.1L3.2 10.4l6.1-.9L12 4Z" />
    </>
  ),
  bell: (
    <>
      <path d="M12 4a4 4 0 0 0-4 4v2.2c0 1-.3 1.9-.9 2.7L6 14h12l-.1-.1c-.6-.8-.9-1.7-.9-2.7V8a4 4 0 0 0-4-4Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </>
  ),
  book: (
    <>
      <path d="M6 5h10a2 2 0 0 1 2 2v12H8a2 2 0 0 0-2 2V5Z" />
      <path d="M8 9h8" />
      <path d="M8 12h8" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2M8 18h2m4 0h2" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
      <path d="M8 15h8" />
    </>
  ),
  language: (
    <>
      <path d="M4 5h9M8.5 5c0 5-2 8-5 10M5 10c1.5 1.5 3 2.5 5 3" />
      <path d="m14 20 3.5-9L21 20M15.2 17h4.6" />
    </>
  ),
  arabic: (
    <>
      <path d="M5 7c2-2 4 0 3 2s-3 2-3 4 2 3 4 1" />
      <path d="M14 7c2-2 4 0 3 2s-3 2-3 4 2 3 4 1" />
      <path d="M8 19h8" />
    </>
  ),
  mosque: (
    <>
      <path d="M4 20h16M6 20v-7h12v7M4 13h16M8 10l4-4 4 4M12 6V3M10 20v-4h4v4" />
    </>
  ),
  heart: (
    <path d="M20 8.5c0 5-8 10-8 10s-8-5-8-10A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 2.5Z" />
  ),
  move: (
    <>
      <circle cx="12" cy="5" r="2" /><path d="M12 7v6m0 0-4 4m4-4 4 4M8 10l-3 2m11-2 3 2" />
    </>
  ),
  arrowDown: <path d="M12 4v15m0 0-5-5m5 5 5-5" />,
  lock: <><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  medal: <><circle cx="12" cy="15" r="5" /><path d="m9 3 3 4 3-4M9 3l-2 5m8-5 2 5" /></>
};

const SUBJECT_ICON_NAMES = {
  bm: 'book', english: 'language', math: 'calculator', sains: 'flask', arab: 'arabic',
  islam: 'mosque', pj: 'move', pk: 'heart', seni: 'spark'
};

export function SubjectIcon({ subjectId, ...props }) {
  return <IconGlyph name={SUBJECT_ICON_NAMES[subjectId] || 'book'} {...props} />;
}

export default function IconGlyph({
  name = 'spark',
  className = '',
  title = '',
  motion = 'none',
  active = false,
  decorative = false,
  ...props
}) {
  const content = ICON_PATHS[name] || ICON_PATHS.spark;
  const activeClass = active ? 'icon-active' : '';
  const decorativeProps = decorative || !title
    ? { 'aria-hidden': 'true', focusable: 'false' }
    : { role: 'img' };
  return (
    <svg
      viewBox="0 0 24 24"
      className={`icon-glyph ${activeClass} ${className}`.trim()}
      data-motion={motion !== 'none' ? motion : undefined}
      data-active={active ? 'true' : undefined}
      {...decorativeProps}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {content}
    </svg>
  );
}
