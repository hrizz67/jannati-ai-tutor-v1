import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import QuestionVisual from '../../src/components/questions/QuestionVisual.jsx';
import { INTERACTIVE_QUESTION_TYPES, validateInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';

function config(visual) {
  return {
    version: 1,
    type: 'visualMath',
    instruction: 'Perhatikan garis nombor dan pilih jawapan.',
    visual,
    options: [
      { id: 'one', label: 'Satu', value: '1' },
      { id: 'two', label: 'Dua', value: '2' }
    ]
  };
}

function issues(visual) {
  return validateInteractiveQuestionConfig(config(visual));
}

function count(markup, className) {
  return (markup.match(new RegExp(`class="${className}"`, 'g')) || []).length;
}

describe('number line visual validation', () => {
  it.each([
    ['repeated jumps', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: 8 }],
    ['count jumps', { kind: 'numberLine', mode: 'countJumps', end: 35, step: 5 }],
    ['repeated jumps boundary', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 10, step: 10 }],
    ['count jumps boundary', { kind: 'numberLine', mode: 'countJumps', end: 100, step: 10 }]
  ])('accepts %s', (_label, visual) => {
    expect(issues(visual)).toEqual([]);
  });

  it.each([
    ['unknown mode', { kind: 'numberLine', mode: 'unknown', jumps: 5, step: 8 }],
    ['zero step', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: 0 }],
    ['step above ten', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: 11 }],
    ['fractional step', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: 2.5 }],
    ['non-finite step', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: Number.NaN }],
    ['zero jumps', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 0, step: 8 }],
    ['jumps above ten', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 11, step: 8 }],
    ['fractional jumps', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 5.5, step: 8 }],
    ['product above one hundred', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 10, step: 11 }],
    ['zero end', { kind: 'numberLine', mode: 'countJumps', end: 0, step: 5 }],
    ['end above one hundred', { kind: 'numberLine', mode: 'countJumps', end: 105, step: 5 }],
    ['fractional end', { kind: 'numberLine', mode: 'countJumps', end: 35.5, step: 5 }],
    ['non-finite end', { kind: 'numberLine', mode: 'countJumps', end: Number.POSITIVE_INFINITY, step: 5 }],
    ['end not divisible by step', { kind: 'numberLine', mode: 'countJumps', end: 34, step: 5 }],
    ['more than ten jumps to end', { kind: 'numberLine', mode: 'countJumps', end: 99, step: 9 }],
    ['repeated jumps carrying end', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: 8, end: 40 }],
    ['count jumps carrying jumps', { kind: 'numberLine', mode: 'countJumps', end: 35, step: 5, jumps: 7 }],
    ['answer field', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: 8, answer: 40 }],
    ['result field', { kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: 8, result: 40 }],
    ['solution field', { kind: 'numberLine', mode: 'countJumps', end: 35, step: 5, solution: 7 }],
    ['correct answer field', { kind: 'numberLine', mode: 'countJumps', end: 35, step: 5, correctAnswer: 7 }],
    ['equation field', { kind: 'numberLine', mode: 'countJumps', end: 35, step: 5, equation: '35 ÷ 5 = 7' }]
  ])('rejects %s with a stable issue code', (_label, visual) => {
    expect(issues(visual)).toContain('invalid_number_line_visual');
  });

  it('keeps numberLine inside visualMath and existing visuals unchanged', () => {
    expect(INTERACTIVE_QUESTION_TYPES).not.toContain('numberLine');
    expect(issues({ kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4 })).toEqual([]);
    expect(issues({ kind: 'shape', shape: 'rectangle', label: 'Segi empat tepat' })).toEqual([]);
  });

  it('does not mutate visual metadata during validation', () => {
    const visual = { kind: 'numberLine', mode: 'countJumps', end: 35, step: 5 };
    const before = JSON.stringify(visual);
    expect(issues(visual)).toEqual([]);
    expect(JSON.stringify(visual)).toBe(before);
  });
});

describe('number line visual rendering', () => {
  it('renders repeated jumps without exposing the derived endpoint', () => {
    const markup = renderToStaticMarkup(React.createElement(QuestionVisual, {
      visual: { kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: 8 }
    }));
    expect(count(markup, 'number-line-jump')).toBe(5);
    expect(markup).toContain('aria-label="Bermula pada 0. Buat 5 lompatan sama besar, setiap lompatan bernilai 8. Tentukan titik akhir."');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('>+8</text>');
    expect(markup).not.toContain('>40</text>');
    expect(markup).not.toContain('titik akhir ialah 40');
    expect(markup).not.toContain('5 × 8 = 40');
    expect(markup).not.toContain('<button');
  });

  it('renders count-jump evidence without announcing the derived jump count', () => {
    const markup = renderToStaticMarkup(React.createElement(QuestionVisual, {
      visual: { kind: 'numberLine', mode: 'countJumps', end: 35, step: 5 }
    }));
    expect(count(markup, 'number-line-jump')).toBe(7);
    expect(markup).toContain('aria-label="Bermula pada 0 hingga 35 dengan lompatan 5. Tentukan bilangan lompatan."');
    expect(markup).toContain('>35</text>');
    expect(markup).not.toContain('terdapat 7 lompatan');
    expect(markup).not.toContain('35 ÷ 5 = 7');
    expect(markup).not.toContain('<button');
  });
});
