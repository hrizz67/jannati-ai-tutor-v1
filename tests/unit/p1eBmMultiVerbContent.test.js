import { describe, expect, it } from 'vitest';
import { bmSubject } from '../../src/data/subjects/bm.js';
import {
  getAcceptedAnswers,
  getQuestionAnswerDisplay,
  isAcceptedQuestionAnswer
} from '../../src/utils/acceptedAnswers.js';
import { getAnswerRevealPolicy } from '../../src/ai/policy/answerRevealPolicy.js';

const question = bmSubject.topics
  .flatMap(topic => topic.questions || [])
  .find(item => item.id === 'BM-KATA_KERJA-001');

describe('P1-E1 Year 2 BM two-verb authored question', () => {
  it('is present and unambiguously requests both verbs', () => {
    expect(question).toBeTruthy();
    expect(question.q).toMatch(/nyatakan dua kata kerja/i);
    expect(question.q).toMatch(/menyanyi.*mengemas/i);
    expect(question.question).toBe(question.q);
    expect(getQuestionAnswerDisplay(question)).toBe('menyanyi dan mengemas');
    expect(question.explanation).toMatch(/menyanyi dan mengemas/i);
  });

  it.each([
    'menyanyi dan mengemas',
    'mengemas dan menyanyi',
    'menyanyi, mengemas',
    'mengemas, menyanyi'
  ])('accepts a complete pair in a valid order/separator: %s', answer => {
    expect(getAcceptedAnswers(question)).toContain(answer);
    expect(isAcceptedQuestionAnswer(answer, question)).toBe(true);
  });

  it.each(['menyanyi', 'mengemas', 'bermain', 'menyanyi dan bermain', 'mengemas dan menyapu'])(
    'rejects missing or unrelated actions for a two-verb question: %s',
    answer => {
      expect(isAcceptedQuestionAnswer(answer, question)).toBe(false);
    }
  );

  it('keeps the pre-submission answer protected and reveals both only at the policy threshold', () => {
    const before = getAnswerRevealPolicy({ status: 'incorrect', isCorrect: false, attemptCount: 2 });
    const after = getAnswerRevealPolicy({ status: 'incorrect', isCorrect: false, attemptCount: 3 });
    expect(before.canRevealAnswer).toBe(false);
    expect(after.canRevealAnswer).toBe(true);
    expect(question.hint).not.toMatch(/menyanyi|mengemas/i);
  });
});
