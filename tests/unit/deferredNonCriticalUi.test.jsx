/** @vitest-environment jsdom */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuizDiagnosticsPanel from '../../src/components/questions/QuizDiagnosticsPanel.jsx';
import BetaFeedbackButton from '../../src/components/feedback/BetaFeedbackButton.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const source = readFileSync('src/App.jsx', 'utf8');

describe('Deferred non-critical UI boundaries', () => {
  it('preserves diagnostic fields without retaining their markup in initial App code', () => {
    expect(source).toContain("React.lazy(() => import('./components/questions/QuizDiagnosticsPanel.jsx'))");
    expect(source).toContain('isInternalUiSurfaceEnabled() && <React.Suspense');
    expect(source).toContain('qipRow={qipRow} debugRow={debugRow}');
    expect(source).not.toContain('<details className="qde-debug-panel">');

    const markup = renderToStaticMarkup(<QuizDiagnosticsPanel
      qipRow={{ metadata: { questionId: 'BM-001', difficulty: 'easy' }, reasonSelected: 'sample reason' }}
      debugRow={{ reason: 'fallback reason' }}
      question={{ id: 'BM-001', q: 'Soalan' }}
      diversityScore={{ overallDiversity: 80 }}
    />);
    expect(markup).toContain('<details class="qde-debug-panel">');
    expect(markup).toContain('Panel Bantuan');
    expect(markup).toContain('BM-001');
    expect(markup).toContain('sample reason');
    expect(markup).toContain('80');
  });

  it('preserves lazy internal feedback and the existing device-local save callback', () => {
    expect(source).toContain("React.lazy(() => import('./components/feedback/BetaFeedbackButton.jsx'))");
    expect(source).toContain('onSaveFeedback={saveFeedbackItem}');
    expect(source).toContain('betaStatus={BETA_STATUS}');
    expect(source).not.toContain("function BetaFeedbackButton({ suppressed = false })");
  });
});

describe('Deferred internal beta feedback interaction', () => {
  let host;
  let root;
  const IconGlyph = ({ name }) => <span data-icon={name} />;
  const BrandLogo = () => <span>Jannati</span>;
  const onSaveFeedback = vi.fn();

  beforeEach(() => {
    onSaveFeedback.mockClear();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  it('does not mount UI when suppressed, and opens/closes with Escape when shown', async () => {
    const baseProps = { onSaveFeedback, IconGlyph, BrandLogo, version: '3.13.42', betaStatus: 'owner-only', buildDate: '2026-11-17' };
    await act(async () => root.render(<BetaFeedbackButton {...baseProps} suppressed />));
    expect(host.textContent).toBe('');
    await act(async () => root.render(<BetaFeedbackButton {...baseProps} />));
    const launch = host.querySelector('button.beta-feedback-fab');
    expect(launch?.getAttribute('aria-label')).toBe('Maklum Balas Beta');
    await act(async () => launch.click());
    expect(host.querySelector('[role="dialog"]')).not.toBeNull();
    expect(host.querySelector('[aria-modal="true"]')).not.toBeNull();
    expect(host.querySelector('#feedback-comment')).not.toBeNull();
    expect(host.querySelector('button.full')?.disabled).toBe(true);
    expect(onSaveFeedback).not.toHaveBeenCalled();
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });
});
