import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import QuestionVisual from '../../src/components/questions/QuestionVisual.jsx';
import { validateInteractiveQuestionConfig } from '../../src/utils/interactiveQuestion.js';

function config(visual) {
  return {
    version: 1,
    type: 'visualMath',
    instruction: 'Perhatikan kumpulan dan pilih jawapan.',
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

describe('equal groups visual validation', () => {
  it.each([
    ['multiplication 3 by 4', { kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4 }],
    ['multiplication 1 by 8', { kind: 'equalGroups', mode: 'multiplication', groups: 1, itemsPerGroup: 8 }],
    ['multiplication boundary 10 by 4', { kind: 'equalGroups', mode: 'multiplication', groups: 10, itemsPerGroup: 4 }],
    ['sharing 24 among 4', { kind: 'equalGroups', mode: 'divisionSharing', total: 24, groups: 4 }],
    ['sharing 16 among 2', { kind: 'equalGroups', mode: 'divisionSharing', total: 16, groups: 2 }],
    ['grouping 25 by 5', { kind: 'equalGroups', mode: 'divisionGrouping', total: 25, itemsPerGroup: 5 }],
    ['grouping 12 by 2', { kind: 'equalGroups', mode: 'divisionGrouping', total: 12, itemsPerGroup: 2 }]
  ])('accepts %s', (_label, visual) => {
    expect(issues(visual)).toEqual([]);
  });

  it.each([
    ['zero groups', { kind: 'equalGroups', mode: 'multiplication', groups: 0, itemsPerGroup: 4 }],
    ['negative groups', { kind: 'equalGroups', mode: 'multiplication', groups: -1, itemsPerGroup: 4 }],
    ['fractional field', { kind: 'equalGroups', mode: 'multiplication', groups: 2.5, itemsPerGroup: 4 }],
    ['NaN total', { kind: 'equalGroups', mode: 'divisionSharing', total: Number.NaN, groups: 4 }],
    ['more than ten groups', { kind: 'equalGroups', mode: 'multiplication', groups: 11, itemsPerGroup: 1 }],
    ['more than ten items per group', { kind: 'equalGroups', mode: 'multiplication', groups: 1, itemsPerGroup: 11 }],
    ['division total above forty', { kind: 'equalGroups', mode: 'divisionSharing', total: 42, groups: 6 }],
    ['more than forty counters', { kind: 'equalGroups', mode: 'multiplication', groups: 5, itemsPerGroup: 9 }],
    ['non-divisible sharing', { kind: 'equalGroups', mode: 'divisionSharing', total: 23, groups: 4 }],
    ['non-divisible grouping', { kind: 'equalGroups', mode: 'divisionGrouping', total: 25, itemsPerGroup: 4 }],
    ['sharing with unknown result', { kind: 'equalGroups', mode: 'divisionSharing', total: 24, groups: 4, itemsPerGroup: 6 }],
    ['grouping with unknown result', { kind: 'equalGroups', mode: 'divisionGrouping', total: 25, itemsPerGroup: 5, groups: 5 }],
    ['multiplication with total', { kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4, total: 12 }],
    ['answer field', { kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4, answer: 12 }],
    ['result field', { kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4, result: 12 }],
    ['equation field', { kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4, equation: '3 x 4 = 12' }],
    ['caption field', { kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4, caption: '12 counters' }],
    ['unexpected label', { kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4, label: 'Three groups' }],
    ['missing required dimension', { kind: 'equalGroups', mode: 'multiplication', itemsPerGroup: 4 }],
    ['unknown mode', { kind: 'equalGroups', mode: 'unknown', groups: 3, itemsPerGroup: 4 }]
  ])('rejects %s with a stable issue code', (_label, visual) => {
    expect(issues(visual)).toContain('invalid_equal_groups_visual');
  });

  it('keeps existing shape and place-value visualMath configs unchanged', () => {
    expect(issues({ kind: 'shape', shape: 'rectangle', label: 'Segi empat tepat' })).toEqual([]);
    expect(issues({ kind: 'placeValue', columns: [{ id: 'ones', label: 'Sa', value: 2 }] })).toEqual([]);
  });

  it('does not mutate visual metadata during validation', () => {
    const visual = { kind: 'equalGroups', mode: 'divisionSharing', total: 24, groups: 4 };
    const before = JSON.stringify(visual);
    expect(issues(visual)).toEqual([]);
    expect(JSON.stringify(visual)).toBe(before);
  });
});

describe('equal groups visual rendering', () => {
  it('renders multiplication dimensions without the computed total', () => {
    const markup = renderToStaticMarkup(React.createElement(QuestionVisual, {
      visual: { kind: 'equalGroups', mode: 'multiplication', groups: 3, itemsPerGroup: 4 }
    }));
    expect(count(markup, 'equal-groups-group')).toBe(3);
    expect(count(markup, 'equal-groups-counter')).toBe(12);
    expect(markup).toContain('aria-label="3 kumpulan, setiap kumpulan mempunyai 4 pembilang."');
    expect(markup).not.toContain('3 × 4 = 12');
    expect(markup).not.toContain('hasil = 12');
  });

  it('renders sharing evidence while keeping the derived quotient out of text', () => {
    const markup = renderToStaticMarkup(React.createElement(QuestionVisual, {
      visual: { kind: 'equalGroups', mode: 'divisionSharing', total: 24, groups: 4 }
    }));
    expect(count(markup, 'equal-groups-group')).toBe(4);
    expect(count(markup, 'equal-groups-counter')).toBe(24);
    expect(markup).toContain('aria-label="24 pembilang dibahagi sama rata kepada 4 kumpulan. Kira bilangan pembilang dalam setiap kumpulan."');
    expect(markup).not.toContain('6 setiap kumpulan');
    expect(markup).not.toContain('24 ÷ 4 = 6');
  });

  it('renders grouping evidence without announcing the derived group count', () => {
    const markup = renderToStaticMarkup(React.createElement(QuestionVisual, {
      visual: { kind: 'equalGroups', mode: 'divisionGrouping', total: 25, itemsPerGroup: 5 }
    }));
    expect(count(markup, 'equal-groups-group')).toBe(5);
    expect(count(markup, 'equal-groups-counter')).toBe(25);
    expect(markup).toContain('aria-label="25 pembilang disusun dengan 5 pembilang dalam setiap kumpulan. Kira bilangan kumpulan."');
    expect(markup).not.toContain('5 groups');
    expect(markup).not.toContain('bilangan kumpulan ialah 5');
    expect(markup).not.toContain('25 ÷ 5 = 5');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('<button');
  });
});
