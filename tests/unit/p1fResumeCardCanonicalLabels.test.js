import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ResumePracticeCard from '../../src/components/ResumePracticeCard.jsx';
import { formatResumeTitle } from '../../src/utils/displayFormatter.js';

const callbacks = { onResume: () => {}, onRestartResume: () => {} };

const render = resume => renderToStaticMarkup(React.createElement(ResumePracticeCard, {
  selectedSubjectId: 'bm',
  resume,
  ...callbacks
}));

describe('P1-F canonical resume card labels', () => {
  it('uses Arabic subject and writing mode rather than stale mixed language metadata', () => {
    const markup = render({
      mode: 'writing',
      subjectId: 'arab',
      topicId: 'bm_arrange',
      currentIndex: 0,
      metadata: {
        displayTitle: 'Bahasa Arab Menulis 1',
        subjectTitle: 'Bahasa Arab Menulis 1',
        topicTitle: 'Bm Arrange'
      }
    });
    expect(markup).toContain('<b>Bahasa Arab</b>');
    expect(markup).toContain('Menulis');
    expect(markup).toContain('Sambung lintas subjek');
    expect(markup).not.toContain('Bm Arrange');
    expect(markup).not.toContain('Bahasa Arab Menulis 1');
    expect(markup).not.toContain('Topik:');
  });

  it('uses canonical question-mode subject and topic IDs despite stale titles', () => {
    const markup = render({
      mode: 'quiz',
      subjectId: 'bm',
      topicId: 'kata_kerja',
      currentIndex: 2,
      metadata: {
        displayTitle: 'Bahasa Arab Menulis 1',
        subjectTitle: 'Bahasa Arab',
        topicTitle: 'Nombor Arab'
      }
    });
    expect(markup).toContain('<b>Bahasa Melayu</b>');
    expect(markup).toContain('Topik: <b>Kata Kerja</b>');
    expect(markup).toContain('Soalan: <b>3</b>');
    expect(markup).not.toContain('Bahasa Arab');
    expect(markup).not.toContain('Nombor Arab');
  });

  it('keeps mode titles canonical, with backward-compatible fallback for an unknown mode', () => {
    expect(formatResumeTitle({ mode: 'writing', metadata: { displayTitle: 'Bahasa Arab Menulis 1' } })).toBe('Menulis');
    expect(formatResumeTitle({ mode: 'quiz', metadata: { displayTitle: 'Nombor Arab' } })).toBe('Latihan');
    expect(formatResumeTitle({ mode: 'legacy_mode', metadata: { displayTitle: 'Latihan Khas' } })).toBe('Latihan Khas');
  });

  it('does not render completed or missing resume cards', () => {
    expect(render(null)).toBe('');
    expect(render({ completed: true, mode: 'quiz', subjectId: 'bm' })).toBe('');
  });
});
