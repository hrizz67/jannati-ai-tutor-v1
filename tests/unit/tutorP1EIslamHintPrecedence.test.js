import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { textContainsExpectedAnswer } from '../../src/ai/policy/answerRevealPolicy.js';

const question = {
  id: 'ISLAM-IBADAH-001',
  q: 'Solat fardu sehari semalam ada ________ waktu.',
  answer: 'lima',
  accepted: ['lima'],
  hint: 'Kira waktu solat fardu.',
  explanation: 'Solat fardu ada lima waktu sehari semalam.'
};
const base = {
  student: { id: 'synthetic-child', studentId: 'synthetic-child' },
  childId: 'synthetic-child',
  subject: { id: 'islam', title: 'Pendidikan Islam Tahun 2' },
  topic: { id: 'ibadah', title: 'Ibadah' },
  question,
  expectedAnswer: question.answer,
  acceptedAnswers: question.accepted,
  conversationKey: 'synthetic-account::synthetic-child::islam::ibadah::ISLAM-IBADAH-001',
  attemptCount: 0,
  history: [],
  prompt: 'Beri saya petunjuk'
};

describe('P1-E2 Islam question-specific and answer-safe hints', () => {
  it('uses the authored five-prayer question hint ahead of a generic adab lead', async () => {
    const response = await getTutorResponse(base);
    expect(response.studentTurn.intent).toBe('hint');
    expect(response.sections.hint).toMatch(/kira waktu solat fardu/iu);
    expect(response.sections.hint).not.toMatch(/beradab|fakta yang tepat/iu);
    expect(response.expectedAnswer).toBe('');
    expect(response.acceptedAnswers).toEqual([]);
    expect(response.correctAnswer).toBe('');
    expect(response.remoteAttempted).toBe(false);
    expect(response.generativeUsed).toBe(false);
    for (const key of ['score', 'xp', 'stars', 'coins', 'rewards']) {
      expect(response).not.toHaveProperty(key);
    }
  });

  it('rejects an authored hint that reveals the protected answer and falls back safely', async () => {
    const unsafe = { ...question, id: 'ISLAM-IBADAH-TEST-UNSAFE', hint: 'Jawapan ialah lima.' };
    const response = await getTutorResponse({
      ...base,
      question: unsafe,
      conversationKey: 'synthetic-account::synthetic-child::islam::ibadah::ISLAM-IBADAH-TEST-UNSAFE',
      expectedAnswer: unsafe.answer,
      acceptedAnswers: unsafe.accepted
    });
    expect(response.studentTurn.intent).toBe('hint');
    expect(response.sections.hint).not.toMatch(/jawapan ialah lima/iu);
    expect(textContainsExpectedAnswer(response.sections.hint, ['lima'])).toBe(false);
    expect(response.expectedAnswer).toBe('');
    expect(response.acceptedAnswers).toEqual([]);
  });

  it('retains a subject-specific fallback when an authored question hint is missing', async () => {
    const withoutHint = { ...question, id: 'ISLAM-IBADAH-TEST-NO-HINT', hint: '' };
    const response = await getTutorResponse({
      ...base,
      question: withoutHint,
      conversationKey: 'synthetic-account::synthetic-child::islam::ibadah::ISLAM-IBADAH-TEST-NO-HINT',
      expectedAnswer: withoutHint.answer,
      acceptedAnswers: withoutHint.accepted
    });
    expect(response.sections.hint).toMatch(/ibadah|konsep|kata kunci/iu);
    expect(response.expectedAnswer).toBe('');
  });
});
