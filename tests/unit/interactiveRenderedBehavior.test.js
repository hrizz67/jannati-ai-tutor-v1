import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getAnswerRevealPolicy } from '../../src/ai/policy/answerRevealPolicy.js';
import InteractiveQuestionEngine, {
  ChoiceGrid,
  FillBlankQuestion,
  MultiSelectQuestion
} from '../../src/components/questions/InteractiveQuestionEngine.jsx';
import QuizFeedbackAccessibility, {
  buildQuizFeedbackAnnouncement
} from '../../src/components/questions/QuizFeedbackAccessibility.jsx';
import { loadAllSubjects } from '../../src/data/subjects/index.js';
import { smartCheck } from '../../src/utils/smartCheck.js';

const subjects = await loadAllSubjects();
const questions = subjects.flatMap(subject => subject.topics.flatMap(topic => topic.questions));
const byId = new Map(questions.map(question => [question.id, question]));

function renderEngine(questionId, value = '', feedback = null) {
  const question = byId.get(questionId);
  return renderToStaticMarkup(React.createElement(InteractiveQuestionEngine, {
    question,
    value,
    feedback,
    onChange: () => {}
  }));
}

function childrenOf(element) {
  return React.Children.toArray(element?.props?.children);
}

function findChild(element, predicate) {
  if (!React.isValidElement(element)) return null;
  if (predicate(element)) return element;
  for (const child of childrenOf(element)) {
    const found = findChild(child, predicate);
    if (found) return found;
  }
  return null;
}

describe('rendered interactive question behavior', () => {
  it.each([
    ['MATH-JISIM-ISI-PADU-PILOT-004', 'imageChoice'],
    ['ENG-VERBS-018', 'fillBlank'],
    ['MATH-BAHAGI-PILOT-001', 'visualMath'],
    ['MATH-PANJANG-PILOT-002', 'measurement']
  ])('renders the real %s %s component with accessible input semantics', (id, type) => {
    const markup = renderEngine(id);
    expect(markup).toContain(`type-${type}`);
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('role="radio"');
    expect(markup).toContain('aria-checked="false"');
    expect(markup).toContain(id.startsWith('ENG-')
      ? 'Use touch, mouse or keyboard.'
      : 'Boleh guna sentuhan, tetikus atau papan kekunci.');
  });

  it('keeps Arabic glyph direction and accessible option labels intact', () => {
    const markup = renderEngine('ARAB-HURUF_HIJAIYAH-032');
    expect(markup).toContain('lang="ar"');
    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain('aria-label="Huruf Arab ت"');
  });

  it('handles pointer selection and keyboard focus movement in choice inputs', () => {
    const config = byId.get('MATH-BAHAGI-PILOT-001').interaction;
    const onChange = vi.fn();
    const tree = ChoiceGrid({ config, value: '', onChange, feedback: null, visualMath: true });
    const group = findChild(tree, child => child.props?.role === 'radiogroup');
    const buttons = childrenOf(group);

    buttons[1].props.onClick();
    expect(onChange).toHaveBeenLastCalledWith(String(config.options[1].value));

    const preventDefault = vi.fn();
    const focus = vi.fn();
    buttons[0].props.onKeyDown({
      key: 'ArrowRight',
      preventDefault,
      currentTarget: { parentElement: { querySelector: () => ({ focus }) } }
    });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenLastCalledWith(String(config.options[1].value));
    expect(focus).toHaveBeenCalledOnce();
  });

  it('handles pointer selection, keyboard focus and reset state in fill-blank inputs', () => {
    const question = byId.get('ENG-VERBS-018');
    const config = question.interaction;
    const onChange = vi.fn();
    const tree = FillBlankQuestion({ config, value: '', onChange, feedback: null, subjectId: 'english' });
    const group = findChild(tree, child => child.props?.role === 'radiogroup');
    const buttons = childrenOf(group);

    buttons[0].props.onClick();
    expect(onChange).toHaveBeenCalledWith(String(config.options[0].value));

    const focus = vi.fn();
    buttons[0].props.onKeyDown({
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      currentTarget: { parentElement: { querySelector: () => ({ focus }) } }
    });
    expect(onChange).toHaveBeenLastCalledWith(String(config.options[1].value));
    expect(focus).toHaveBeenCalledOnce();

    const resetMarkup = renderEngine('ENG-VERBS-018', '');
    expect(resetMarkup).not.toContain('aria-checked="true"');
    expect(resetMarkup).toContain('tabindex="0"');
  });

  it('locks submitted choices and exposes a non-colour status without revealing the answer early', () => {
    const question = byId.get('MATH-BAHAGI-PILOT-001');
    const wrongValue = '2';
    const policy = getAnswerRevealPolicy({
      status: 'wrong',
      attemptCount: 1
    });
    expect(policy.canRevealAnswer).toBe(false);
    expect(smartCheck(wrongValue, question).status).not.toBe('correct');
    expect(smartCheck('6', question).status).toBe('correct');

    const markup = renderEngine(question.id, wrongValue, {
      status: 'wrong',
      answerRevealPolicy: policy
    });
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('Jawapan dipilih belum tepat.');
    expect(markup).not.toContain('Jawapan dipilih betul.');
  });

  it('preserves the third-attempt answer-reveal policy for composite responses', () => {
    const config = {
      version: 1,
      type: 'multiSelect',
      instruction: 'Pilih dua jawapan.',
      options: [
        { id: 'a', label: 'A', value: 'A' },
        { id: 'b', label: 'B', value: 'B' },
        { id: 'c', label: 'C', value: 'C' }
      ],
      correctOptionIds: ['a', 'b']
    };
    const earlyPolicy = getAnswerRevealPolicy({ status: 'wrong', attemptCount: 2 });
    const revealPolicy = getAnswerRevealPolicy({ status: 'wrong', attemptCount: 3 });
    expect(earlyPolicy.canRevealAnswer).toBe(false);
    expect(revealPolicy.canRevealAnswer).toBe(true);
    const early = renderToStaticMarkup(React.createElement(MultiSelectQuestion, {
      config,
      value: 'C',
      onChange: () => {},
      feedback: { status: 'wrong', answerRevealPolicy: earlyPolicy }
    }));
    expect(early).toContain('Pilihan dihantar; jawapan keseluruhan belum tepat.');
    expect(early).not.toContain('Jawapan betul yang belum dipilih.');
    expect(early).not.toContain('multi-select-option missed');

    const revealed = renderToStaticMarkup(React.createElement(MultiSelectQuestion, {
      config,
      value: 'C',
      onChange: () => {},
      feedback: { status: 'wrong', answerRevealPolicy: revealPolicy }
    }));
    expect(revealed).toContain('Jawapan betul yang belum dipilih.');
    expect(revealed).toContain('multi-select-option missed');
  });
});

describe('quiz feedback accessibility', () => {
  it('announces feedback and the available next action exactly once', () => {
    const markup = renderToStaticMarkup(React.createElement(QuizFeedbackAccessibility, {
      title: 'Cuba lagi',
      message: 'Fikir semula dan cuba satu kali lagi.',
      answerChecked: true,
      canRetry: true,
      retryLabel: 'Cuba Lagi',
      nextLabel: 'Seterusnya'
    }));
    expect(markup.match(/role="status"/g)).toHaveLength(1);
    expect(markup.match(/aria-live="polite"/g)).toHaveLength(1);
    expect(markup).toContain('Cuba Lagi tersedia.');
  });

  it('deduplicates repeated text and never invents an answer', () => {
    expect(buildQuizFeedbackAnnouncement({
      title: 'Cuba lagi',
      message: 'Cuba lagi',
      answerChecked: true,
      canRetry: true
    })).toBe('Cuba lagi Cuba Lagi tersedia.');
    expect(buildQuizFeedbackAnnouncement({
      title: 'Belum tepat',
      message: 'Gunakan petunjuk.',
      answerChecked: true,
      canRetry: true
    })).not.toContain('Jawapan tepat');
  });
});
