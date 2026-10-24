import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import QuizSpeechConsent from '../../src/components/speech/QuizSpeechConsent.jsx';

const app = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const component = fs.readFileSync(new URL('../../src/components/speech/QuizSpeechConsent.jsx', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');

describe('P1.17 production Quiz speech consent', () => {
  it('renders an accessible adult-consent gate with typing fallback', () => {
    const markup = renderToStaticMarkup(React.createElement(QuizSpeechConsent, {
      open: true,
      onConfirm() {},
      onDecline() {}
    }));
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain('Kebenaran rakaman suara');
    expect(markup).toContain('ibu bapa/penjaga sah kepada murid ini');
    expect(markup).toContain('untuk satu rakaman audio pendek ini');
    expect(markup).toContain('hanya selepas butang mula ditekan');
    expect(markup).toContain('diproses sementara dan tidak disimpan oleh Jannati');
    expect(markup).toContain('dihantar bagi ditukar kepada teks');
    expect(markup).toContain('Taip sahaja');
    expect(markup).toMatch(/type="checkbox"/);
    expect(markup).toMatch(/disabled=""[^>]*>Benarkan dan mula/);
  });

  it('does not render or persist anything while closed', () => {
    expect(renderToStaticMarkup(React.createElement(QuizSpeechConsent, {
      open: false,
      onConfirm() {},
      onDecline() {}
    }))).toBe('');
    expect(component).not.toMatch(/localStorage|sessionStorage|fetch\(|supabase/i);
  });

  it('gates MediaRecorder start until adult confirmation and never auto-grades', () => {
    const quiz = app.split('function Quiz({')[1].split('function UasaSimulator(')[0];
    expect(quiz).toContain('if (!quizSpeechConsentGrantedRef.current)');
    expect(quiz).toContain('setQuizSpeechConsentOpen(true)');
    expect(quiz).toContain('quizSpeechConsentGrantedRef.current = true');
    expect(quiz).toContain('quizSpeechConsentGrantedRef.current = false');
    expect(quiz.indexOf('quizSpeechConsentGrantedRef.current = false')).toBeLessThan(quiz.indexOf('mobileSession.start()'));
    expect(quiz.indexOf('if (!quizSpeechConsentGrantedRef.current)')).toBeLessThan(quiz.indexOf('mobileSession.start()'));
    expect(quiz).toContain('Tiada rakaman dibuat. Kamu masih boleh menaip jawapan.');
    expect(quiz).not.toContain('onCheckAnswer(safeTranscript)');
  });

  it('provides mobile safe-area and focus treatment without new runtime dependencies', () => {
    expect(styles).toContain('.quiz-speech-consent-backdrop');
    expect(styles).toContain('env(safe-area-inset-bottom)');
    expect(styles).toContain('.quiz-speech-consent-dialog h2:focus');
    expect(component).toContain("event.key === 'Escape'");
  });
});
