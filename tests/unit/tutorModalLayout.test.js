import React from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import TutorAIModal, { TutorAINoticeStack } from '../../src/components/ai/TutorAIModal.jsx';

const SAFETY_DISCLOSURE = 'Tutor AI membantu pembelajaran dan boleh tersilap. Jangan kongsi maklumat peribadi; semak perkara penting bersama guru atau penjaga.';
const STATUS_LABELS = {
  idle: '',
  loading: 'Tutor AI sedang menaip...',
  error: 'Tutor AI belum dapat menjawab.',
  fallback: 'Menggunakan jawapan sandaran yang selamat.'
};

function directChildClasses(markup, rootClass) {
  const rootPattern = new RegExp(`<([a-z][\\w-]*)[^>]*class="[^"]*\\b${rootClass}\\b[^"]*"[^>]*>`, 'i');
  const rootMatch = rootPattern.exec(markup);
  expect(rootMatch).not.toBeNull();
  const tagPattern = /<\/?([a-z][\w-]*)\b[^>]*>/gi;
  tagPattern.lastIndex = rootMatch.index + rootMatch[0].length;
  const classes = [];
  let depth = 0;
  let match;
  while ((match = tagPattern.exec(markup))) {
    const token = match[0];
    const tag = match[1].toLowerCase();
    if (token.startsWith('</')) {
      if (depth === 0 && tag === rootMatch[1].toLowerCase()) break;
      depth -= 1;
      continue;
    }
    if (depth === 0) classes.push(token.match(/class="([^"]*)"/i)?.[1] || '');
    if (!token.endsWith('/>') && !['input', 'br', 'hr', 'img', 'meta', 'link'].includes(tag)) depth += 1;
  }
  return classes;
}

function renderRegions(status) {
  return renderToStaticMarkup(
    React.createElement(
      'section',
      { className: 'ai-chat ai-modal-shell' },
      React.createElement('header', { className: 'ai-chat-head' }, 'Header'),
      React.createElement(TutorAINoticeStack, { status, statusLabel: STATUS_LABELS[status] }),
      React.createElement('div', { className: 'ai-chat-body' }, 'Conversation'),
      React.createElement('div', { className: 'ai-chat-input ai-modal-footer' }, 'Composer')
    )
  );
}

describe('Tutor AI modal layout-state contract', () => {
  it.each(['idle', 'loading', 'error', 'fallback'])('keeps four rendered regions when status is %s', status => {
    const markup = renderRegions(status);
    expect(directChildClasses(markup, 'ai-modal-shell')).toEqual([
      'ai-chat-head',
      'tutor-ai-notice-stack',
      'ai-chat-body',
      'ai-chat-input ai-modal-footer'
    ]);
    expect(markup.split(SAFETY_DISCLOSURE)).toHaveLength(2);
    expect(markup.includes(`chat-status-${status}`)).toBe(status !== 'idle');
  });

  it('keeps the body as the sole flexible scroll region and the composer outside it', () => {
    const styles = readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');
    const stage7d = styles.slice(styles.lastIndexOf('/* Stage 7D'));
    expect(stage7d).toMatch(/grid-template-rows:\s*auto auto minmax\(0, 1fr\) auto/);
    expect(stage7d).toMatch(/\.ai-chat-body,[\s\S]*?min-height:\s*0;[\s\S]*?overflow-y:\s*auto;/);
    expect(directChildClasses(renderRegions('loading'), 'ai-modal-shell').at(-1)).toBe('ai-chat-input ai-modal-footer');
  });

  it('does not reveal the expected answer before the policy threshold', () => {
    const props = {
      open: true,
      selectedSubject: { id: 'math', title: 'Matematik' },
      selectedTopic: { id: 'wang', title: 'Wang' },
      question: { id: 'layout-answer-policy', q: 'Berapakah jumlahnya?', answer: 'RAHSIA-42' },
      expectedAnswer: 'RAHSIA-42',
      feedback: { status: 'incorrect' },
      onTutup: () => {}
    };
    const protectedMarkup = renderToStaticMarkup(React.createElement(TutorAIModal, { ...props, attemptCount: 2 }));
    const revealAllowedMarkup = renderToStaticMarkup(React.createElement(TutorAIModal, { ...props, attemptCount: 3 }));
    expect(protectedMarkup).not.toContain('RAHSIA-42');
    expect(revealAllowedMarkup).toContain('RAHSIA-42');
  });
});
