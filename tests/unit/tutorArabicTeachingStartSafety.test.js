import { describe, expect, it } from 'vitest';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';

const student = { id: 'synthetic-p26c1', studentId: 'synthetic-p26c1' };
const subject = { id: 'arab', title: 'Bahasa Arab', topics: [{ id: 'mufradat', title: 'مفردات' }] };
const topic = { id: 'mufradat', title: 'مفردات' };
const question = { id: 'p26c1-ar-q', q: 'اختر اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'] };
const base = {
  student, subject, topic, question, expectedAnswer: 'مدرسة', acceptedAnswers: ['مدرسة'],
  locale: 'ar-MY', conversationKey: 'synthetic::p26c1::arab::active'
};

function noGradeAndNoReveal(response) {
  expect(response.studentTurn).toMatchObject({
    intent: 'how_question', messageType: 'help_request',
    teachingStartRequest: true, answerCandidate: ''
  });
  expect(response.isCorrect ?? null).toBeNull();
  expect(response.expectedAnswer ?? '').toBe('');
  expect(response.correctAnswer ?? '').toBe('');
  expect(response.acceptedAnswers ?? []).toEqual([]);
  expect(response.options ?? []).toEqual([]);
  expect(response.text).not.toContain('مدرسة');
  expect(response.text).toMatch(/لنبدأ|خطوة صغيرة|شرح/u);
  expect(response.text).not.toMatch(/[A-Za-z]/u);
  expect(response.quickReplies).toHaveLength(3);
  expect(response.quickReplies.join(' ')).not.toMatch(/[A-Za-z]/u);
  expect(response.remoteAttempted).toBe(false);
  expect(response.generativeUsed).toBe(false);
  for (const field of ['xp', 'score', 'coins', 'rewards']) expect(response).not.toHaveProperty(field);
}

describe('P2.6-C1 Arabic start-teaching directives never become wrong quiz attempts', () => {
  it.each(['ابدأ بالشرح', 'ابدأ بالتفسير', 'لنبدأ بالشرح', 'اِبْدَأْ بِالشَّرْحِ'])(
    'recognizes Arabic teaching command before short-answer extraction: %s', prompt => {
      const turn = understandStudentTurn({
        prompt, expectedAnswer: 'مدرسة', acceptedAnswers: ['مدرسة'], hasExerciseContext: true,
        activeConcept: 'arab::mufradat::p26c1-ar-q'
      });
      expect(turn).toMatchObject({
        intent: 'how_question', messageType: 'help_request',
        teachingStartRequest: true, answerCandidate: ''
      });
    }
  );

  it('returns an Arabic teaching option rather than false wrong-answer grading after a study plan', async () => {
    const first = await getTutorResponse({ ...base, prompt: 'ماذا أتعلم اليوم؟', history: [] });
    expect(first.studentTurn.intent).toBe('learning_recommendation');
    const history = buildBoundedDialogueContext([
      { role: 'user', text: 'ماذا أتعلم اليوم؟' },
      { role: 'ai', text: first.text, dialogueClassification: first.dialogueClassification,
        pedagogicalState: first.pedagogicalState ?? null }
    ]);
    const response = await getTutorResponse({ ...base, prompt: 'ابدأ بالشرح', history });
    expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
    noGradeAndNoReveal(response);
  });

  it('keeps literal accepted-answer precedence when the quiz intentionally expects the same phrase', () => {
    const phrase = 'ابدأ بالشرح';
    const turn = understandStudentTurn({
      prompt: phrase, expectedAnswer: phrase, acceptedAnswers: [phrase],
      hasExerciseContext: true, activeConcept: 'arab::mufradat::some-question'
    });
    expect(turn).toMatchObject({ intent: 'direct_answer', messageType: 'answer_attempt', answerCandidate: phrase });
  });

  it('does not misclassify a real Arabic answer as a teaching directive', () => {
    const turn = understandStudentTurn({
      prompt: 'مدرسة', expectedAnswer: 'مدرسة', acceptedAnswers: ['مدرسة'],
      hasExerciseContext: true
    });
    expect(turn).toMatchObject({ intent: 'direct_answer', messageType: 'answer_attempt', answerCandidate: 'مدرسة' });
  });

  it('keeps ordinary English help routing unaffected', () => {
    const turn = understandStudentTurn({
      prompt: 'Can you explain nouns?', hasExerciseContext: true,
      expectedAnswer: 'school'
    });
    expect(turn.teachingStartRequest).not.toBe(true);
    expect(turn.messageType).not.toBe('answer_attempt');
  });
});
