import { describe, expect, it } from 'vitest';
import { buildIntelligentTeachingTurn } from '../../src/ai/pedagogy/intelligentTeachingEngine.js';

const contentPack = {
  grounded: true,
  explanations: ['Kata nama merujuk kepada orang, haiwan, tempat dan benda.', 'Perkataan nama memberitahu siapa atau apa.'],
  alternatives: ['Cari benda yang dinamakan dan bukannya perbuatan.'],
  steps: ['Baca soalan dan cari kata kuncinya.', 'Semak pilihan satu persatu sebelum menjawab.'],
  checkQuestions: ['Apakah petunjuk utama dalam soalan ini']
};

function makeTurn(overrides = {}) {
  return buildIntelligentTeachingTurn({
    studentTurn: { intent: 'recovery_first_step', messageType: 'follow_up_question' },
    resolvedIntent: 'recovery_first_step',
    subjectId: 'bm',
    topicId: 'kata_nama',
    questionId: 'BM-KN-101',
    expectedAnswer: 'Ali',
    acceptedAnswers: ['Ali'],
    teachingContent: contentPack,
    history: [],
    locale: 'ms-MY',
    ...overrides
  });
}

function prior(reply, overrides = {}) {
  return {
    role: 'ai',
    text: reply.reply.text,
    dialogueClassification: 'LOCAL_HANDLED',
    pedagogicalState: reply.pedagogicalState,
    ...overrides
  };
}

describe('P2.4-B safe non-repetitive grounded follow-up support', () => {
  it('offers the next unused reviewed learning step, then stays within authored content', () => {
    const first = makeTurn();
    const second = makeTurn({ history: [prior(first)] });
    const third = makeTurn({ history: [prior(first), prior(second)] });

    expect(first.reply.text).toContain('Baca soalan dan cari kata kuncinya.');
    expect(second.reply.text).toContain('Semak pilihan satu persatu sebelum menjawab.');
    expect(second.reply.text).not.toContain('Baca soalan dan cari kata kuncinya.');
    expect(third.reply.text).toContain('Cari benda yang dinamakan dan bukannya perbuatan.');
    expect(new Set([first.reply.text, second.reply.text, third.reply.text]).size).toBe(3);
    for (const turn of [first, second, third]) {
      expect(turn.reply.text).not.toMatch(/jawapan(?:nya)? (?:ialah|adalah) Ali/i);
      expect(turn.reply.quickReplies.length).toBeGreaterThan(0);
      expect(turn.reply.text).toMatch(/\?/);
    }
  });

  it('does not jump between topics/questions or consult a prior unsafe route', () => {
    const first = makeTurn();
    const crossQuestion = makeTurn({ questionId: 'BM-KN-102', history: [prior(first)] });
    const blocked = makeTurn({ history: [prior(first, { dialogueClassification: 'SAFETY_BLOCKED' })] });
    const unsupported = makeTurn({ history: [prior(first, { dialogueClassification: 'UNSUPPORTED' })] });
    const privateMessage = makeTurn({ history: [prior(first, { privacySignal: 'personal-data' })] });

    for (const turn of [crossQuestion, blocked, unsupported, privateMessage]) {
      expect(turn.reply.text).toContain('Baca soalan dan cari kata kuncinya.');
      expect(turn.reply.text).not.toContain('Semak pilihan satu persatu sebelum menjawab.');
    }
  });

  it('only chooses answer-safe reviewed content and falls back if none is unused', () => {
    const first = makeTurn({
      teachingContent: {
        grounded: true,
        steps: ['Perhatikan kata kunci.', 'Jawapannya ialah Ali.'],
        explanations: [],
        alternatives: [],
        checkQuestions: ['Apakah petunjuk utama']
      }
    });
    const second = makeTurn({
      history: [prior(first)],
      teachingContent: {
        grounded: true,
        steps: ['Perhatikan kata kunci.', 'Jawapannya ialah Ali.'],
        explanations: [],
        alternatives: [],
        checkQuestions: ['Apakah petunjuk utama']
      }
    });
    expect(second.reply.text).toContain('Perhatikan kata kunci.');
    expect(second.reply.text).not.toContain('Jawapannya ialah Ali.');
  });

  it.each([
    ['BM', 'bm', 'ms-MY', 'recovery_meaning', 'Idea utama:'],
    ['English', 'english', 'en-MY', 'recovery_first_step', 'Do just one small step:'],
    ['Arabic', 'arabic', 'ar-MY', 'recovery_meaning', 'الفكرة الأولى:']
  ])('keeps %s follow-up copy localized while selecting fresh authored support', (_label, subjectId, locale, intent, label) => {
    const first = makeTurn({ subjectId, locale, resolvedIntent: intent });
    const second = makeTurn({ subjectId, locale, resolvedIntent: intent, history: [prior(first)] });
    expect(first.reply.text).toContain(label);
    expect(second.reply.text).toContain(label);
    expect(second.reply.text).not.toBe(first.reply.text);
    expect(second.reply.text).not.toContain('Jawapannya ialah Ali');
  });

  it('does not alter the specialized Mathematics path', () => {
    expect(makeTurn({ subjectId: 'math' })).toBeNull();
  });
});
