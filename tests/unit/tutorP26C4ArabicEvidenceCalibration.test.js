import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';

const student = { id: 'synthetic-p26c4-ar', studentId: 'synthetic-p26c4-ar' };
const subject = { id: 'arab', title: 'Bahasa Arab', topics: [{ id: 'mufradat', title: 'مفردات' }] };
const topic = { id: 'mufradat', title: 'مفردات' };
const question = {
  id: 'p26c4-ar-place', q: 'اختر اسم المكان.',
  answer: 'مدرسة', acceptedAnswers: ['مدرسة']
};
const base = {
  student, subject, topic, question, expectedAnswer: 'مدرسة',
  acceptedAnswers: ['مدرسة'], locale: 'ar-MY',
  conversationKey: 'synthetic::p26c4::ar::place',
  prompt: 'لماذا إجابتي خاطئة؟'
};

function expectSafeUngraded(response) {
  expect(response.studentTurn).toMatchObject({
    intent: 'wrong_answer_coaching', messageType: 'help_request', answerCandidate: ''
  });
  expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
  expect(response.remoteAttempted).toBe(false);
  expect(response.generativeUsed).toBe(false);
  expect(response.isCorrect ?? null).toBeNull();
  expect(response.expectedAnswer ?? '').toBe('');
  expect(response.correctAnswer ?? '').toBe('');
  expect(response.acceptedAnswers ?? []).toEqual([]);
  expect(response.options ?? []).toEqual([]);
  expect(response.text).not.toContain('مدرسة');
  for (const field of ['xp', 'score', 'coins', 'rewards']) {
    expect(response).not.toHaveProperty(field);
  }
}

function expectUnverifiedReply(response) {
  expectSafeUngraded(response);
  expect(response.text).toContain('لا أرى إجابة سابقة');
  expect(response.text).not.toContain('إجابتك صحيحة');
  expect(response.quickReplies).toEqual(['اشرح السؤال', 'أعطني تلميحًا']);
  expect(response.text).not.toMatch(/[A-Za-z]/u);
  expect(response.quickReplies.join(' ')).not.toMatch(/[A-Za-z]/u);
}

describe('P2.6-C4 Arabic wrong-answer coaching needs verified evidence', () => {
  it('does not assert a wrong answer when no answer has been submitted', async () => {
    expectUnverifiedReply(await getTutorResponse({ ...base }));
  });

  it.each([false, true])(
    'does not trust a correctness flag %s without an associated learner answer', async isCorrect => {
      expectUnverifiedReply(await getTutorResponse({ ...base, isCorrect }));
    }
  );

  it('does not infer a graded attempt from a bare chat history utterance', async () => {
    const history = buildBoundedDialogueContext([
      { role: 'user', text: 'بيت' },
      { role: 'ai', text: 'لنراجع السؤال.', dialogueClassification: 'LOCAL_HANDLED' }
    ]);
    expectUnverifiedReply(await getTutorResponse({ ...base, history }));
  });

  it('does not invent a previous answer when the exercise is not active', async () => {
    expectUnverifiedReply(await getTutorResponse({
      ...base, question: null, expectedAnswer: '', acceptedAnswers: [],
      conversationKey: 'synthetic::p26c4::ar::general'
    }));
  });

  it('allows evidence-guided coaching when wrong feedback and a learner answer both exist', async () => {
    const result = await getTutorResponse({
      ...base, isCorrect: false, learnerAnswer: 'بيت'
    });
    expectSafeUngraded(result);
    expect(result.text).not.toContain('لا أرى إجابة سابقة');
  });

  it('preserves correct-answer status when supported by an actual learner answer', async () => {
    const result = await getTutorResponse({
      ...base, isCorrect: true, learnerAnswer: 'مدرسة'
    });
    expectSafeUngraded(result);
    expect(result.text).toContain('إجابتك صحيحة');
    expect(result.text).not.toContain('لا أرى إجابة سابقة');
  });

  it('retains literal accepted-answer precedence in an exercise', () => {
    const accepted = 'لماذا إجابتي خاطئة؟';
    const turn = understandStudentTurn({
      prompt: accepted, hasExerciseContext: true,
      expectedAnswer: accepted, acceptedAnswers: [accepted]
    });
    expect(turn).toMatchObject({
      intent: 'direct_answer', messageType: 'answer_attempt', answerCandidate: accepted
    });
  });
});
