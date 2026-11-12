import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';

const student = { id: 'synthetic-p26e2-ar', studentId: 'synthetic-p26e2-ar' };
const subject = { id: 'arab', title: 'Bahasa Arab', topics: [{ id: 'mufradat', title: 'مفردات' }] };
const topic = { id: 'mufradat', title: 'مفردات' };
const question = { id: 'p26e2-ar-place', q: 'اختر اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'] };
const base = {
  student, subject, topic, question, expectedAnswer: 'مدرسة',
  acceptedAnswers: ['مدرسة'], locale: 'ar-MY', conversationKey: 'synthetic::p26e2::ar',
  prompt: 'ابدأ بالشرح'
};

function assertSafeUngraded(result, forbidden = 'مدرسة') {
  expect(result.studentTurn).toMatchObject({
    intent: 'how_question', messageType: 'help_request',
    teachingStartRequest: true, answerCandidate: ''
  });
  expect(result.dialogueClassification).toBe('LOCAL_HANDLED');
  expect(result.remoteAttempted).toBe(false);
  expect(result.generativeUsed).toBe(false);
  expect(result.isCorrect ?? null).toBeNull();
  expect(result.expectedAnswer ?? '').toBe('');
  expect(result.correctAnswer ?? '').toBe('');
  expect(result.acceptedAnswers ?? []).toEqual([]);
  expect(result.options ?? []).toEqual([]);
  if (forbidden) expect(result.text).not.toContain(forbidden);
  expect(result.text).not.toMatch(/[A-Za-z]/u);
  expect(result.quickReplies.join(' ')).not.toMatch(/[A-Za-z]/u);
  for (const field of ['xp', 'score', 'coins', 'rewards']) expect(result).not.toHaveProperty(field);
}

describe('P2.6-E2 begins Arabic teaching, never repeats a teaching menu', () => {
  it.each(['ابدأ بالشرح', 'ابدأ بالتفسير', 'لنبدأ بالشرح'])(
    'teaches the visible name-of-place clue on request: %s', async prompt => {
      const result = await getTutorResponse({ ...base, prompt });
      assertSafeUngraded(result);
      expect(result.text).toContain('اسم المكان كلمة تدل على مكان');
      expect(result.text).toContain('أخبرني لماذا اخترتها');
      expect(result.text).not.toContain('هل تريد أن نشرح');
      expect(result.quickReplies).toEqual(['لم أفهم', 'اشرح مرة أخرى', 'أعطني تلميحًا']);
      expect(result.questionId).toBe(question.id);
    }
  );

  it('starts teaching directly after a bounded study-plan turn', async () => {
    const first = await getTutorResponse({ ...base, prompt: 'ماذا أتعلم اليوم؟' });
    expect(first.studentTurn.intent).toBe('learning_recommendation');
    const history = buildBoundedDialogueContext([
      { role: 'user', text: 'ماذا أتعلم اليوم؟' },
      { role: 'ai', text: first.text, dialogueClassification: first.dialogueClassification,
        pedagogicalState: first.pedagogicalState ?? null }
    ]);
    const result = await getTutorResponse({ ...base, history });
    assertSafeUngraded(result);
    expect(result.text).toContain('اسم المكان كلمة تدل على مكان');
    expect(result.text).not.toContain('هل تريد أن نشرح');
  });

  it('uses an Arabic-only supplied topic note when no active exercise is available', async () => {
    const noted = { ...topic, note: 'الاسم يدل على شخص أو حيوان أو مكان أو شيء.' };
    const result = await getTutorResponse({
      ...base, topic: noted, question: null, expectedAnswer: '',
      acceptedAnswers: [], conversationKey: 'synthetic::p26e2::note'
    });
    assertSafeUngraded(result);
    expect(result.text).toContain(noted.note);
    expect(result.text).toContain('اشرح الفكرة بكلماتك');
  });

  it('never teaches an answer-unsafe Arabic topic note', async () => {
    const badNote = { ...topic, note: 'الجواب هو بيت.' };
    const result = await getTutorResponse({
      ...base, topic: badNote, question: null, expectedAnswer: 'بيت',
      acceptedAnswers: ['بيت'], conversationKey: 'synthetic::p26e2::unsafe'
    });
    assertSafeUngraded(result, 'بيت');
    expect(result.text).toContain('ليس لدي شرح مؤكد');
  });

  it('uses a reading step for an exercise with no category-specific clue', async () => {
    const changed = { ...question, q: 'اختر الكلمة الصحيحة.' };
    const result = await getTutorResponse({ ...base, question: changed });
    assertSafeUngraded(result);
    expect(result.text).toContain('لنبدأ بقراءة تعليمات السؤال');
    expect(result.text).not.toContain('اسم المكان كلمة');
  });

  it('states a safe lack-of-content boundary rather than fabricating a lesson', async () => {
    const result = await getTutorResponse({
      ...base, question: null, expectedAnswer: '', acceptedAnswers: [],
      conversationKey: 'synthetic::p26e2::no-context'
    });
    assertSafeUngraded(result);
    expect(result.text).toContain('ليس لدي شرح مؤكد');
    expect(result.text).not.toContain('هل تريد أن نشرح');
  });

  it('retains exact accepted-answer precedence over the teaching command', () => {
    const phrase = 'ابدأ بالشرح';
    const turn = understandStudentTurn({
      prompt: phrase, expectedAnswer: phrase, acceptedAnswers: [phrase],
      hasExerciseContext: true, activeConcept: 'arab::mufradat::p26e2-literal'
    });
    expect(turn).toMatchObject({ intent: 'direct_answer', messageType: 'answer_attempt',
      answerCandidate: phrase });
  });
});
