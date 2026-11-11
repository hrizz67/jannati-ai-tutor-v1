import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const student = { id: 'synthetic-child', studentId: 'synthetic-child' };

async function dialogue(subjectId, prompts, overrides = {}) {
  let history = [];
  const turns = [];
  const subject = {
    id: subjectId,
    title: subjectId === 'english' ? 'English' : 'Bahasa Arab'
  };
  for (const prompt of prompts) {
    const response = await getTutorResponse({
      student,
      subject,
      conversationKey: `synthetic-account::synthetic-child::${subjectId}::general::session-a`,
      ...overrides,
      prompt,
      history
    });
    turns.push(response);
    history = [...history,
      { role: 'user', text: prompt },
      {
        role: 'ai',
        text: response.text,
        dialogueClassification: response.dialogueClassification,
        pedagogicalState: response.pedagogicalState || null
      }
    ].slice(-12);
  }
  return { turns, history };
}

function expectSafeHelp(response) {
  expect(response.expectedAnswer || '').toBe('');
  expect(response.correctAnswer || '').toBe('');
  expect(response.acceptedAnswers || []).toEqual([]);
  expect(response.isCorrect ?? null).toBeNull();
  for (const key of ['xp', 'stars', 'coins', 'score', 'mastery', 'rewards']) {
    expect(response).not.toHaveProperty(key);
  }
}

describe('P1-B scoped English and Arabic tutoring', () => {
  it('keeps five connected English common-noun turns grounded and in English', async () => {
    const prompts = [
      'What is a common noun?',
      'I do not understand. What does that mean?',
      'I still do not understand. Give me another example.',
      'How can I spot one? Do not give me the answer.',
      'Can we continue from the common noun idea?'
    ];
    const { turns } = await dialogue('english', prompts);
    const texts = turns.map(turn => turn.text);
    expect(texts[0]).toMatch(/common noun.*general name/iu);
    expect(turns[0].pedagogicalState?.teachingAnchor?.conceptId).toBe('english_common_noun');
    expect(texts[1]).toMatch(/common noun|person|animal|place|thing|cat/iu);
    expect(texts[2]).toMatch(/example|cat|school|animal|place/iu);
    expect(texts[3]).toMatch(/step|clue|find|name/iu);
    expect(texts[4]).toMatch(/common noun|animal|place|thing|find|name/iu);
    expect(new Set(texts).size).toBe(5);
    expect(texts.slice(1).join(' ')).not.toMatch(/\b(?:saya|awak|cikgu|langkah|faham|pilih|beri|contoh)\b/iu);
    expect(turns.slice(1).every(turn => turn.pedagogicalState?.teachingAnchor?.conceptId === 'english_common_noun')).toBe(true);
    for (const response of turns) expectSafeHelp(response);
  });

  it('teaches the reviewed Arabic book meaning across five connected Arabic turns', async () => {
    const prompts = [
      'ما معنى كِتَابٌ؟',
      'أريد معنى الكلمة.',
      'لا أفهم. أعطني مثالًا آخر.',
      'ماذا تقصد؟ لا تعطِ الجواب مباشرة.',
      'تابع من الكلمة السابقة.'
    ];
    const { turns } = await dialogue('arab', prompts);
    const texts = turns.map(turn => turn.text);
    expect(texts[0]).toMatch(/كِتَاب|صفحات|نقرأ/u);
    expect(turns[0].pedagogicalState?.teachingAnchor?.conceptId).toBe('arab_book');
    expect(texts[1]).toMatch(/صفحات|القراءة|نقرأ|نتعلّم/u);
    expect(texts[2]).toMatch(/مثال|المدرسة|أقرأ|كتاب/u);
    expect(texts[3]).toMatch(/خطوة|تلميح|صفحات|تقرأ/u);
    expect(texts[4]).toMatch(/خطوة|تلميح|صفحات|تقرأ|نقرأ/u);
    expect(new Set(texts).size).toBe(5);
    expect(texts.join(' ')).not.toMatch(/\b(?:saya|awak|cikgu|langkah|pilih|beri|contoh|faham)\b/iu);
    expect(turns.slice(1).every(turn => turn.pedagogicalState?.teachingAnchor?.conceptId === 'arab_book')).toBe(true);
    for (const response of turns) expectSafeHelp(response);
  });

  it.each([
    ['english', 'Hello', /hello|explain|learn/iu, /[A-Za-z]/u],
    ['arab', 'مرحبا', /مرحب|أستطيع|نتعلّم/u, /[\p{Script=Arabic}]/u]
  ])('gives a localized %s greeting and quick replies', async (subjectId, prompt, textPattern, scriptPattern) => {
    const { turns } = await dialogue(subjectId, [prompt]);
    const response = turns[0];
    expect(response.text).toMatch(textPattern);
    expect(response.quickReplies.length).toBeGreaterThan(0);
    for (const option of response.quickReplies) expect(option).toMatch(scriptPattern);
    expectSafeHelp(response);
  });

  it('drops an old language anchor after a change to a different synthetic scope', async () => {
    for (const [subjectId, first] of [
      ['english', 'What is a common noun?'],
      ['arab', 'ما معنى كِتَابٌ؟']
    ]) {
      const { history } = await dialogue(subjectId, [first]);
      const response = await getTutorResponse({
        student,
        subject: { id: subjectId, title: subjectId === 'arab' ? 'Bahasa Arab' : 'English' },
        conversationKey: `other-account::synthetic-child::${subjectId}::general::session-b`,
        history,
        prompt: subjectId === 'arab' ? 'تابع من الكلمة السابقة.' : 'Can we continue from the common noun idea?'
      });
      expect(response.pedagogicalState?.teachingAnchor || null).toBeNull();
      expectSafeHelp(response);
    }
  });

  it('does not reveal an active Arabic quiz answer through the curated word explanation', async () => {
    const { turns } = await dialogue('arab', ['ما معنى كِتَابٌ؟'], {
      topic: { id: 'mufradat', title: 'المفردات' },
      question: {
        id: 'arab-q2',
        q: 'ما الشيء الذي نقرأ صفحاته؟',
        answer: 'كِتَابٌ',
        options: ['كِتَابٌ', 'قَلَمٌ']
      },
      expectedAnswer: 'كِتَابٌ',
      acceptedAnswers: ['كِتَابٌ']
    });
    expect(turns[0].text).not.toMatch(/كِتَابٌ/u);
    expect(turns[0].pedagogicalState?.teachingAnchor?.conceptId).not.toBe('arab_book');
    expectSafeHelp(turns[0]);
  });
});
