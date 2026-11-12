import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';

const student = { id: 'synthetic-p26e3-child', studentId: 'synthetic-p26e3-child' };
const subject = { id: 'arab', title: 'Bahasa Arab', topics: [{ id: 'mufradat', title: 'مفردات' }] };
const topic = { id: 'mufradat', title: 'مفردات' };
const question = { id: 'p26e3-place-q', q: 'اختر اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'] };
const base = {
  student, subject, topic, question, expectedAnswer: 'مدرسة',
  acceptedAnswers: ['مدرسة'], locale: 'ar-MY', conversationKey: 'synthetic::p26e3::place'
};

function assertSafeTeaching(reply, forbidden = 'مدرسة') {
  expect(reply.dialogueClassification).toBe('LOCAL_HANDLED');
  expect(reply.remoteAttempted).toBe(false);
  expect(reply.generativeUsed).toBe(false);
  expect(reply.isCorrect ?? null).toBeNull();
  expect(reply.expectedAnswer ?? '').toBe('');
  expect(reply.correctAnswer ?? '').toBe('');
  expect(reply.acceptedAnswers ?? []).toEqual([]);
  expect(reply.options ?? []).toEqual([]);
  expect(reply.studentTurn.messageType).not.toBe('answer_attempt');
  if (forbidden) expect(reply.text).not.toContain(forbidden);
  expect(reply.text).not.toMatch(/[A-Za-z]/u);
  expect(reply.quickReplies.join(' ')).not.toMatch(/[A-Za-z]/u);
  for (const key of ['xp', 'coins', 'score', 'rewards']) expect(reply).not.toHaveProperty(key);
}

function appendHistory(history, prompt, reply) {
  return buildBoundedDialogueContext([...history,
    { role: 'user', text: prompt },
    { role: 'ai', text: reply.text, intent: reply.intent,
      dialogueClassification: reply.dialogueClassification,
      pedagogicalState: reply.pedagogicalState ?? null }
  ]);
}

describe('P2.6-E3 Arabic place-noun reteaching is scoped and progressive', () => {
  it('explains the visible place-noun clue after begin-teaching rather than a generic word prompt', async () => {
    const first = await getTutorResponse({ ...base, prompt: 'ابدأ بالشرح' });
    assertSafeTeaching(first);
    expect(first.text).toContain('اسم المكان كلمة تدل على مكان');
    const history = appendHistory([], 'ابدأ بالشرح', first);
    const next = await getTutorResponse({ ...base, prompt: 'لا أفهم', history });
    assertSafeTeaching(next);
    expect(next.studentTurn.intent).toBe('misunderstanding');
    expect(next.pedagogicalState).toMatchObject({
      supportStage: 'concept_explanation', misunderstandingCount: 1
    });
    expect(next.text).toContain('اسم المكان كلمة تسمّي مكانًا');
    expect(next.text).toContain('هل الكلمة التي تفكر فيها');
    expect(next.text).not.toContain('ابحث عن الكلمة المطلوبة');
    expect(next.text).not.toContain('مثال سهل:');
    expect(next.questionId).toBe(question.id);
  });

  it('moves through explanation, alternative and small step, then seeks adult help without invented examples', async () => {
    let history = [];
    const expected = [
      ['concept_explanation', 'اسم المكان كلمة تسمّي مكانًا'],
      ['alternative_strategy', 'فكّر في معنى الكلمة'],
      ['guided_small_step', 'اقرأ الكلمات واحدةً واحدةً'],
      ['adult_support_referral', 'المعلم أو ولي الأمر'],
      ['adult_support_acknowledgement', 'المعلم أو ولي الأمر']
    ];
    for (const [i, [stage, phrase]] of expected.entries()) {
      const result = await getTutorResponse({ ...base, prompt: 'لا أفهم', history });
      assertSafeTeaching(result);
      expect(result.pedagogicalState).toMatchObject({
        supportStage: stage,
        misunderstandingCount: i + 1
      });
      expect(result.text).toContain(phrase);
      expect(result.text).not.toContain('مثال سهل:');
      history = appendHistory(history, 'لا أفهم', result);
    }
  });

  it('does not reuse a previous exercise stage when question identity changes', async () => {
    const prior = await getTutorResponse({ ...base, prompt: 'لا أفهم' });
    let history = appendHistory([], 'لا أفهم', prior);
    const next = await getTutorResponse({
      ...base, question: { ...question, id: 'p26e3-place-other' },
      prompt: 'لا أفهم', history
    });
    assertSafeTeaching(next);
    expect(next.pedagogicalState).toMatchObject({
      supportStage: 'concept_explanation', misunderstandingCount: 1
    });
  });

  it.each([
    ['generic exercise', { ...question, q: 'اختر الكلمة الصحيحة.' }],
    ['negated exercise', { ...question, q: 'لا تختر اسم المكان.' }],
    ['nonexistent question identity', { ...question, id: '' }]
  ])('does not invent category-specific instruction for %s', async (_description, q) => {
    const result = await getTutorResponse({ ...base, prompt: 'لا أفهم', question: q });
    assertSafeTeaching(result);
    expect(result.text).not.toContain('اسم المكان كلمة تسمّي مكانًا');
    expect(result.text).not.toContain('فكّر في معنى الكلمة');
  });

  it('does not claim a current place-noun question when there is no active exercise', async () => {
    const result = await getTutorResponse({
      ...base, prompt: 'لا أفهم', question: null, expectedAnswer: '', acceptedAnswers: [],
      conversationKey: 'synthetic::p26e3::without-question'
    });
    assertSafeTeaching(result);
    expect(result.text).not.toContain('اسم المكان كلمة تسمّي مكانًا');
  });

  it('does not reveal a protected answer that overlaps the approved explanation text', async () => {
    const protectedQuestion = { ...question, answer: 'مكان', acceptedAnswers: ['مكان'] };
    const result = await getTutorResponse({
      ...base, prompt: 'لا أفهم', question: protectedQuestion,
      expectedAnswer: 'مكان', acceptedAnswers: ['مكان']
    });
    assertSafeTeaching(result, 'مكان');
    expect(result.text).not.toContain('اسم المكان كلمة تسمّي مكانًا');
    expect(result.text).toContain('لا توجد معلومات تعليمية معتمدة');
  });

  it('does not carry Arabic reteaching copy into BM lessons', async () => {
    const result = await getTutorResponse({
      ...base, prompt: 'Saya tak faham.',
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      question: { id: 'p26e3-bm', q: 'Pilih kata nama tempat.', answer: 'taman' },
      expectedAnswer: 'taman', acceptedAnswers: ['taman'], locale: 'ms-MY'
    });
    expect(result.text).not.toContain('اسم المكان كلمة تسمّي مكانًا');
    expect(result.remoteAttempted).toBe(false);
    expect(result.isCorrect ?? null).toBeNull();
  });

  it('retains literal Arabic quiz-answer precedence', async () => {
    const answer = await getTutorResponse({ ...base, prompt: 'مدرسة' });
    expect(answer.studentTurn.messageType).toBe('answer_attempt');
    expect(answer.isCorrect).toBe(true);
  });
});
