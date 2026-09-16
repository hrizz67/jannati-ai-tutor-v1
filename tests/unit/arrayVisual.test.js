import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import QuestionVisual from '../../src/components/questions/QuestionVisual.jsx';
import { INTERACTIVE_QUESTION_TYPES, validateInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';

function config(visual) {
  return {
    version: 1,
    type: 'visualMath',
    instruction: 'Perhatikan tatasusunan dan pilih jawapan.',
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

describe('array visual validation', () => {
  it.each([
    ['one by one', { kind: 'array', mode: 'multiplication', rows: 1, columns: 1 }],
    ['two by three', { kind: 'array', mode: 'multiplication', rows: 2, columns: 3 }],
    ['four by five', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5 }],
    ['six by ten boundary', { kind: 'array', mode: 'multiplication', rows: 6, columns: 10 }],
    ['ten by six boundary', { kind: 'array', mode: 'multiplication', rows: 10, columns: 6 }]
  ])('accepts %s', (_label, visual) => {
    expect(issues(visual)).toEqual([]);
  });

  it.each([
    ['unknown mode', { kind: 'array', mode: 'division', rows: 4, columns: 5 }],
    ['zero rows', { kind: 'array', mode: 'multiplication', rows: 0, columns: 5 }],
    ['zero columns', { kind: 'array', mode: 'multiplication', rows: 4, columns: 0 }],
    ['rows above ten', { kind: 'array', mode: 'multiplication', rows: 11, columns: 1 }],
    ['columns above ten', { kind: 'array', mode: 'multiplication', rows: 1, columns: 11 }],
    ['fractional rows', { kind: 'array', mode: 'multiplication', rows: 2.5, columns: 3 }],
    ['fractional columns', { kind: 'array', mode: 'multiplication', rows: 2, columns: 3.5 }],
    ['NaN rows', { kind: 'array', mode: 'multiplication', rows: Number.NaN, columns: 3 }],
    ['NaN columns', { kind: 'array', mode: 'multiplication', rows: 2, columns: Number.NaN }],
    ['product above sixty', { kind: 'array', mode: 'multiplication', rows: 7, columns: 9 }],
    ['missing rows', { kind: 'array', mode: 'multiplication', columns: 5 }],
    ['missing columns', { kind: 'array', mode: 'multiplication', rows: 4 }],
    ['total field', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5, total: 20 }],
    ['answer field', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5, answer: 20 }],
    ['result field', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5, result: 20 }],
    ['product field', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5, product: 20 }],
    ['solution field', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5, solution: 20 }],
    ['correct answer field', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5, correctAnswer: 20 }],
    ['equation field', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5, equation: '4 x 5 = 20' }],
    ['caption field', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5, caption: '20 objek' }],
    ['label field', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5, label: 'Tatasusunan 20 objek' }],
    ['answer label field', { kind: 'array', mode: 'multiplication', rows: 4, columns: 5, answerLabel: '20' }]
  ])('rejects %s with a stable issue code', (_label, visual) => {
    expect(issues(visual)).toContain('invalid_array_visual');
  });

  it('keeps array inside visualMath and existing visual kinds unchanged', () => {
    expect(INTERACTIVE_QUESTION_TYPES).not.toContain('array');
    expect(issues({ kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4 })).toEqual([]);
    expect(issues({ kind: 'numberLine', mode: 'repeatedJumps', jumps: 5, step: 8 })).toEqual([]);
  });

  it('does not mutate visual metadata during validation', () => {
    const visual = { kind: 'array', mode: 'multiplication', rows: 4, columns: 5 };
    const before = JSON.stringify(visual);
    expect(issues(visual)).toEqual([]);
    expect(JSON.stringify(visual)).toBe(before);
  });
});

describe('array visual rendering', () => {
  it('renders four rows by five columns without exposing the product', () => {
    const markup = renderToStaticMarkup(React.createElement(QuestionVisual, {
      visual: { kind: 'array', mode: 'multiplication', rows: 4, columns: 5 }
    }));
    expect(count(markup, 'array-row')).toBe(4);
    expect(count(markup, 'array-counter')).toBe(20);
    expect(markup).toContain('data-rows="4"');
    expect(markup).toContain('data-columns="5"');
    expect(markup).toContain('aria-label="Tatasusunan mempunyai 4 baris dengan 5 objek pada setiap baris. Tentukan jumlah objek."');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('20 objek');
    expect(markup).not.toContain('4 x 5 = 20');
    expect(markup).not.toContain('4 × 5 = 20');
    expect(markup).not.toContain('hasilnya 20');
    expect(markup).not.toContain('<button');
  });

  it('renders two rows by three columns with exactly six counters', () => {
    const markup = renderToStaticMarkup(React.createElement(QuestionVisual, {
      visual: { kind: 'array', mode: 'multiplication', rows: 2, columns: 3 }
    }));
    expect(count(markup, 'array-row')).toBe(2);
    expect(count(markup, 'array-counter')).toBe(6);
  });
});
