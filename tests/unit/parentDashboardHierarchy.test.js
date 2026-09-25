import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ParentDashboard from '../../src/dashboard/ParentDashboard.jsx';

function extractElementByAttribute(markup, tagName, attribute) {
  const openingPattern = new RegExp(`<${tagName}\\b[^>]*${attribute}[^>]*>`, 'i');
  const openingMatch = openingPattern.exec(markup);
  if (!openingMatch) return '';

  const start = openingMatch.index;
  const tagPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  tagPattern.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tagPattern.exec(markup))) {
    depth += match[0].startsWith(`</${tagName}`) ? -1 : 1;
    if (depth === 0) return markup.slice(start, tagPattern.lastIndex);
  }
  return '';
}

function renderParentDashboard() {
  return renderToStaticMarkup(React.createElement(ParentDashboard, {
    profile: null,
    adaptiveProfile: null,
    allSubjects: [],
    adaptivePracticeCount: 4,
    readiness: { level: 'needs_support', message: 'Masih memerlukan sokongan.' },
    onStartAdaptivePractice: () => {},
    onBack: () => {}
  }));
}

const dashboardSource = fs.readFileSync(new URL('../../src/dashboard/ParentDashboard.jsx', import.meta.url), 'utf8');
const stylesheet = fs.readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');

describe('Parent Dashboard default hierarchy', () => {
  it('renders one selectable subject surface without the duplicate metric grid', () => {
    const markup = renderParentDashboard();
    const subjectSection = extractElementByAttribute(markup, 'section', 'data-parent-section="subjects"');

    expect(subjectSection).not.toBe('');
    expect(markup.match(/data-parent-subject-chooser="true"/g)).toHaveLength(1);
    expect(subjectSection.match(/class="[^"]*report-box/g)).toHaveLength(8);
    expect(subjectSection).not.toMatch(/class="[^"]*metric-grid/);
    expect(subjectSection).toContain('aria-pressed="true"');
    expect(subjectSection).toContain('role="progressbar"');
  });

  it('keeps focus visible and all long-form surfaces in one closed disclosure', () => {
    const markup = renderParentDashboard();
    const advanced = extractElementByAttribute(markup, 'details', 'data-parent-advanced="true"');
    const openingTag = advanced.match(/^<details\b[^>]*>/)?.[0] || '';
    const focusIndex = markup.indexOf('data-parent-section="focus"');
    const advancedIndex = markup.indexOf('data-parent-advanced="true"');
    const printIndex = markup.indexOf('data-parent-section="print"');

    expect(advanced).not.toBe('');
    expect(openingTag).not.toMatch(/\sopen(?:\s|=|>)/);
    expect(focusIndex).toBeGreaterThan(-1);
    expect(focusIndex).toBeLessThan(advancedIndex);
    expect(advancedIndex).toBeLessThan(printIndex);
    expect(advanced).toContain('data-parent-section="revision"');
    expect(advanced).toContain('parent-advanced-planner');
    expect(advanced).toContain('data-parent-section="assessment-history"');
    expect(advanced).toContain('data-parent-section="recent-activity"');
    expect(advanced).toContain('Perancangan &amp; Sejarah');
  });

  it('preserves report and practice wiring while forcing advanced content into print', () => {
    const markup = renderParentDashboard();

    expect(markup).toContain('Cetak Laporan');
    expect(dashboardSource).toMatch(/parent-primary-action[^>]*[\s\S]{0,180}onClick=\{\(\) => startParentPractice\(\)\}/);
    expect(dashboardSource).toContain("source: 'parent-subject-action'");
    expect(dashboardSource).toContain("printParentReport('parent-print-report')");
    expect(stylesheet).toMatch(/\.parent-print-report \.parent-advanced-disclosure > summary\s*\{\s*display:\s*none !important;/);
    expect(stylesheet).toMatch(/\.parent-print-report \.parent-advanced-disclosure > \.parent-advanced-content\s*\{\s*display:\s*grid !important;/);
  });
});
