import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { isArabicPlaceNounInstruction } from '../../src/ai/pedagogy/arabicPlaceNounInstruction.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';

const positive = [
  'اختر اسم المكان.',
  'اِخْتَرْ اِسْمَ الْمَكَانِ.',
  'حَدِّدْ اسْمَ الْمَكَانِ.',
  'عَيِّنْ اسْمَ الْمَكَانِ',
  'ضع دائرة حول اسم المكان.',
  'ضَعْ دَائِرَةً حَوْلَ اسْمِ الْمَكَانِ.',
  'اختر الكلمة التي تدل على مكان.',
  'حَدِّدْ الْكَلِمَةَ الَّتِي تَدُلُّ عَلَى مَكَانٍ.',
  'أي كلمة تدل على مكان؟',
  'أَيُّ كَلِمَةٍ تَدُلُّ عَلَى مَكَانٍ؟'
];
const negative = [
  'لا تختر اسم المكان.',
  'لا تضع دائرة حول اسم المكان.',
  'اختر اسم المكان والزمان.',
  'اختر اسم الحيوان.',
  'اختر اسم الشخص.',
  'اختر اسم المكان من الخيارات التالية.',
  'اختر اسم المكان ثم اكتبه.',
  'أي كلمة تدل على مكان أو عمل؟',
  'اختر اسم المكان الآن.',
  'هل اسم المكان صحيح؟',
  'اختر اسم المكان واكتب رقم هاتفك.'
];
const base = {
  student: { id: 'synthetic-e4', studentId: 'synthetic-e4' },
  subject: { id: 'arab', title: 'Bahasa Arab', topics: [{ id: 'mufradat', title: 'مفردات' }] },
  topic: { id: 'mufradat', title: 'مفردات' },
  expectedAnswer: 'مدرسة', acceptedAnswers: ['مدرسة'],
  locale: 'ar-MY', conversationKey: 'synthetic::p26e4::arab'
};
const question = (q, id = 'p26e4-ar-1') => ({
  id, q, answer: 'مدرسة', acceptedAnswers: ['مدرسة']
});
function safe(result) {
  expect(result.remoteAttempted).toBe(false);
  expect(result.generativeUsed).toBe(false);
  expect(result.isCorrect ?? null).toBeNull();
  expect(result.expectedAnswer ?? '').toBe('');
  expect(result.correctAnswer ?? '').toBe('');
  expect(result.acceptedAnswers ?? []).toEqual([]);
  expect(result.options ?? []).toEqual([]);
  expect(result.text).not.toContain('مدرسة');
  expect(result.text).not.toMatch(/[A-Za-z]/u);
  expect(result.quickReplies.join(' ')).not.toMatch(/[A-Za-z]/u);
  for (const field of ['xp', 'score', 'coins', 'rewards']) expect(result).not.toHaveProperty(field);
}

describe('P2.6-E4 exact Arabic place-noun instruction grammar', () => {
  it.each(positive)('recognizes this complete positive command: %s', q => {
    expect(isArabicPlaceNounInstruction(q)).toBe(true);
  });
  it.each(negative)('rejects incomplete/negated/unreviewed command: %s', q => {
    expect(isArabicPlaceNounInstruction(q)).toBe(false);
  });
  it.each([null, undefined, 5, {}, [], '', ' '.repeat(201)])(
    'rejects missing/non-string/oversize input: %s', q => {
      expect(isArabicPlaceNounInstruction(q)).toBe(false);
    }
  );

  it.each(positive)('direct teaching and misunderstanding agree on scope for: %s', async q => {
    const first = await getTutorResponse({ ...base, question: question(q), prompt: 'ابدأ بالشرح' });
    safe(first);
    expect(first.dialogueClassification).toBe('LOCAL_HANDLED');
    expect(first.text).toContain('اسم المكان كلمة تدل على مكان');
    expect(first.studentTurn.teachingStartRequest).toBe(true);
    const history = buildBoundedDialogueContext([
      { role: 'user', text: 'ابدأ بالشرح' },
      { role: 'ai', text: first.text, dialogueClassification: first.dialogueClassification,
        pedagogicalState: first.pedagogicalState ?? null }
    ]);
    const next = await getTutorResponse({
      ...base, question: question(q), prompt: 'لا أفهم', history
    });
    safe(next);
    expect(next.dialogueClassification).toBe('LOCAL_HANDLED');
    expect(next.text).toContain('اسم المكان كلمة تسمّي مكانًا');
    expect(next.pedagogicalState?.supportStage).toBe('concept_explanation');
    expect(next.questionId).toBe('p26e4-ar-1');
  });

  it.each(negative)('never infers place-noun teaching from this negative/unknown sentence: %s', async q => {
    const first = await getTutorResponse({ ...base, question: question(q), prompt: 'ابدأ بالشرح' });
    safe(first);
    expect(first.text).not.toContain('اسم المكان كلمة تدل على مكان');
    const next = await getTutorResponse({ ...base, question: question(q), prompt: 'لا أفهم' });
    safe(next);
    expect(next.text).not.toContain('اسم المكان كلمة تسمّي مكانًا');
  });

  it('requires question identity in both direct teaching and re-explanation', async () => {
    const q = question('اختر اسم المكان.', '');
    const first = await getTutorResponse({ ...base, question: q, prompt: 'ابدأ بالشرح' });
    safe(first);
    expect(first.text).not.toContain('اسم المكان كلمة تدل على مكان');
    const next = await getTutorResponse({ ...base, question: q, prompt: 'لا أفهم' });
    safe(next);
    expect(next.text).not.toContain('اسم المكان كلمة تسمّي مكانًا');
  });

  it('does not let an answer token hidden in Arabic diacritics appear in any teaching stage', async () => {
    const q = { id: 'p26e4-ar-answer', q: 'اِخْتَرْ اِسْمَ الْمَكَانِ.',
      answer: 'مكان', acceptedAnswers: ['مكان'] };
    const first = await getTutorResponse({ ...base, question: q,
      expectedAnswer: 'مكان', acceptedAnswers: ['مكان'], prompt: 'ابدأ بالشرح' });
    expect(first.text).not.toContain('مكان');
    const second = await getTutorResponse({ ...base, question: q,
      expectedAnswer: 'مكان', acceptedAnswers: ['مكان'], prompt: 'لا أفهم' });
    expect(second.text).not.toContain('مكان');
    safe(first);
    safe(second);
  });
});
