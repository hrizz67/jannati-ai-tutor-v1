import { describe, expect, it } from 'vitest';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const student = { id: 'synthetic-child-p26b1', studentId: 'synthetic-child-p26b1' };
const scenarios = [
  {
    id: 'english-ack',
    subject: { id: 'english', title: 'English' },
    topic: { id: 'nouns', title: 'Nouns' },
    question: { id: 'p26b1-en-1', q: 'Choose the place noun.', answer: 'school', acceptedAnswers: ['school'] },
    prompt: 'I understand now',
    expectedIntent: 'understanding_confirmation',
    expectedType: 'understanding_signal'
  },
  {
    id: 'arab-ack',
    subject: { id: 'arab', title: 'Bahasa Arab' },
    topic: { id: 'mufradat', title: 'مفردات' },
    question: { id: 'p26b1-ar-1', q: 'اختر اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'] },
    prompt: 'فهمت الآن',
    expectedIntent: 'understanding_confirmation',
    expectedType: 'understanding_signal'
  },
  {
    id: 'arab-vocalized-ack',
    subject: { id: 'arab', title: 'Bahasa Arab' },
    topic: { id: 'mufradat', title: 'مفردات' },
    question: { id: 'p26b1-ar-2', q: 'اختر اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'] },
    prompt: 'فَهِمْتُ الآنَ',
    expectedIntent: 'understanding_confirmation',
    expectedType: 'understanding_signal'
  },
  {
    id: 'arab-why-wrong',
    subject: { id: 'arab', title: 'Bahasa Arab' },
    topic: { id: 'mufradat', title: 'مفردات', note: 'اسم المكان يدل على مكان.' },
    question: { id: 'p26b1-ar-3', q: 'اختر اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'], options: ['مدرسة', 'يلعب'] },
    learnerAnswer: 'يلعب', isCorrect: false, attemptCount: 1,
    prompt: 'لماذا إجابتي خاطئة؟',
    expectedIntent: 'wrong_answer_coaching',
    expectedType: 'help_request'
  }
];

describe('P2.6-B1 multilingual understanding and wrong-answer coaching', () => {
  it.each(scenarios)('returns grounded ungraded public tutoring for $id', async scenario => {
    const { id, expectedIntent, expectedType, ...input } = scenario;
    const response = await getTutorResponse({
      student, ...input, conversationKey: `synthetic::p26b1::${id}`,
      locale: scenario.subject.id === 'english' ? 'en-MY' : 'ar-MY'
    });
    expect(response.studentTurn).toMatchObject({
      intent: expectedIntent, messageType: expectedType, answerCandidate: ''
    });
    expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
    expect(response.isCorrect).toBeNull();
    expect(response.expectedAnswer).toBe('');
    expect(response.correctAnswer).toBe('');
    expect(response.acceptedAnswers).toEqual([]);
    expect(response.text).toBeTruthy();
    expect(response.text).not.toContain(input.question.answer);
    expect(response.remoteAttempted).toBe(false);
    expect(response.generativeUsed).toBe(false);
    for (const field of ['score', 'xp', 'coins', 'rewards']) expect(response).not.toHaveProperty(field);
    if (id.includes('ack')) {
      expect(response.text).not.toMatch(/I am listening|أنا أستمع إليك/iu);
    }
  });

  it('does not mistake stand-alone English/Arabic confirmations for exercise answers without an explicit accepted-answer match', () => {
    for (const prompt of ['I understand now', 'I get it now', 'Now I understand', 'فهمت الآن', 'الآن فهمت', 'فَهِمْتُ الآنَ']) {
      const turn = understandStudentTurn({
        prompt, expectedAnswer: 'school', acceptedAnswers: ['school'], hasExerciseContext: true
      });
      expect(turn).toMatchObject({ intent: 'understanding_confirmation', messageType: 'understanding_signal', answerCandidate: '' });
    }
  });

  it('preserves authoritative exact accepted quiz answers even when their literal text is a confirmation', () => {
    for (const prompt of ['I understand now', 'فهمت الآن']) {
      const turn = understandStudentTurn({
        prompt, expectedAnswer: prompt, acceptedAnswers: [prompt], hasExerciseContext: true
      });
      expect(turn).toMatchObject({ intent: 'direct_answer', messageType: 'answer_attempt', answerCandidate: prompt });
    }
  });

  it('recognizes scoped Arabic wrong-answer queries while leaving ordinary why questions untouched', () => {
    for (const prompt of ['لماذا إجابتي خاطئة؟', 'لماذا جوابي خطأ؟', 'أين أخطأت في إجابتي؟']) {
      const turn = understandStudentTurn({ prompt, hasExerciseContext: true, expectedAnswer: 'مدرسة' });
      expect(turn).toMatchObject({ intent: 'wrong_answer_coaching', messageType: 'help_request', answerCandidate: '' });
    }
    const ordinary = understandStudentTurn({ prompt: 'لماذا هذا اسم؟', hasExerciseContext: true });
    expect(ordinary.intent).toBe('why_question');
  });

  it('keeps arbitrary text that merely contains understanding words outside the exact confirmation match', () => {
    const turn = understandStudentTurn({ prompt: 'I understand why the wrong answer was chosen?', hasExerciseContext: true });
    expect(turn.intent).not.toBe('understanding_confirmation');
  });
});
