import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';

const student = { id: 'synthetic-h4', studentId: 'synthetic-h4' };
const bm = {
  student,
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_nama_am', title: 'Kata Nama Am', note: 'Contoh tempat ialah sekolah dan taman.' },
  question: {
    id: 'h4-bm-object', q: 'Siti membaca buku di ruang tamu. Apakah kata nama am bagi benda dalam ayat itu?',
    instruction: 'Baca ayat dan jawab.', options: ['Siti', 'buku', 'ruang tamu'],
    answer: 'buku', acceptedAnswers: ['buku']
  },
  expectedAnswer: 'buku', acceptedAnswers: ['buku'],
  conversationKey: 'synthetic::h4::bm-object'
};
const en = {
  student,
  subject: { id: 'english', title: 'English' },
  topic: { id: 'animal_vocabulary', title: 'Animals', note: 'A verb is an action word.' },
  question: {
    id: 'h4-en-noun', q: 'The animal in the pond has fins and gills. It is a ________.',
    instruction: 'Choose the naming word.', options: ['fish', 'pond', 'swim'],
    answer: 'fish', acceptedAnswers: ['fish']
  },
  expectedAnswer: 'fish', acceptedAnswers: ['fish'],
  locale: 'en-MY', conversationKey: 'synthetic::h4::english'
};
const ar = {
  student,
  subject: { id: 'arab', title: 'Bahasa Arab' },
  topic: { id: 'mufradat', title: 'مفردات', note: 'اختر اسم شخص.' },
  question: {
    id: 'h4-ar-word', q: 'Perkataan Arab كِتَابٌ bermaksud ________.',
    instruction: 'Tulis maksud perkataan.', options: ['buku', 'rumah'],
    answer: 'buku', acceptedAnswers: ['buku']
  },
  expectedAnswer: 'buku', acceptedAnswers: ['buku'],
  locale: 'ar-MY', conversationKey: 'synthetic::h4::arabic'
};

function checkSafe(reply, answer = '', { allowClarification = false } = {}) {
  if (allowClarification) {
    // A vague unanchored question may appropriately ask for clarification.
    // It must remain local and must not invent a noun/verb lesson.
    expect(['LOCAL_HANDLED', 'NEEDS_CLARIFICATION']).toContain(reply.dialogueClassification);
  } else {
    expect(reply.dialogueClassification).toBe('LOCAL_HANDLED');
  }
  expect(reply.remoteAttempted).toBe(false);
  expect(reply.generativeUsed).toBe(false);
  expect(reply.isCorrect ?? null).toBeNull();
  expect(reply.expectedAnswer ?? '').toBe('');
  expect(reply.correctAnswer ?? '').toBe('');
  expect(reply.acceptedAnswers ?? []).toEqual([]);
  for (const field of ['score', 'xp', 'coins', 'rewards']) expect(reply).not.toHaveProperty(field);
  if (answer) {
    const explicitReveal = new RegExp('(?:the answer is|jawapan\\s+ialah|الجواب\\s+هو)\\s+' + answer, 'iu');
    expect(reply.text).not.toMatch(explicitReveal);
  }
}

const withHistory = (history, prompt, reply) =>
  buildBoundedDialogueContext([
    ...history,
    { role: 'user', text: prompt },
    { role: 'ai', text: reply.text, source: reply.source,
      dialogueClassification: reply.dialogueClassification,
      pedagogicalState: reply.pedagogicalState,
      safetySignal: reply.safetySignal, privacySignal: reply.privacySignal }
  ]);

describe('P2.6-H4 integrated BM/EN/AR active-question ownership', () => {
  it('isolation: a shared synthetic child cannot carry BM/EN/AR topic hints across exercise identity', async () => {
    let history = [];
    const first = await getTutorResponse({ ...bm, prompt: 'Dia tanya apa?', history });
    checkSafe(first, 'buku');
    expect(first.text).toMatch(/benda/iu);
    expect(first.text).not.toMatch(/cari\s+perkataan\s+yang\s+menamakan\s+tempat/iu);
    history = withHistory(history, 'Dia tanya apa?', first);

    const second = await getTutorResponse({ ...en, prompt: 'Can you explain nouns?', history });
    checkSafe(second, 'fish');
    expect(second.text).toMatch(/noun is a naming word/iu);
    expect(second.text).not.toMatch(/verb is an action word|\bsoalan\b/iu);
    expect(second.questionId).toBe(en.question.id);
    history = withHistory(history, 'Can you explain nouns?', second);

    const third = await getTutorResponse({ ...ar, prompt: 'ابدأ بالشرح', history });
    checkSafe(third, 'buku');
    expect(third.text).toMatch(/معنى كلمة عربية/u);
    expect(third.text).not.toMatch(/اسم شخص/u);
    expect(third.text).not.toMatch(/\p{Script=Latin}/u);
    expect(third.questionId).toBe(ar.question.id);
  });

  it('keeps BM learner correction separate from English noun and Arabic meaning arbitration', async () => {
    const r = await getTutorResponse({ ...bm, prompt: 'Macam mana saya nak tahu itu nama tempat?' });
    checkSafe(r, 'buku');
    expect(r.text).toMatch(/bukan kata nama tempat/iu);
    expect(r.text).toMatch(/kata nama benda/iu);

    const e = await getTutorResponse({ ...en, prompt: 'Can you explain nouns?' });
    checkSafe(e, 'fish');
    expect(e.text).not.toMatch(/kata nama tempat|kata nama benda/iu);

    const a = await getTutorResponse({ ...ar, prompt: 'لا أفهم' });
    checkSafe(a, 'buku');
    expect(a.text).toMatch(/معنى الكلمة/u);
    expect(a.text).not.toMatch(/اسم شخص/u);
  });

  it('ungraded turns do not use literal accepted answers from another subject', async () => {
    const e = await getTutorResponse({ ...en, prompt: 'Which word should I look at?' });
    checkSafe(e, 'fish', { allowClarification: true });
    expect(e.text).not.toMatch(/verb is an action word|pick the verb/iu);
    expect(e.questionId).toBe(en.question.id);

    const a = await getTutorResponse({ ...ar, prompt: 'لماذا إجابتي خاطئة؟' });
    checkSafe(a, 'buku');
    expect(a.text).toMatch(/لم أتحقق من إجابتك/u);
    expect(a.text).not.toMatch(/إجابتك صحيحة/u);
  });

  it('literal accepted-answer precedence remains intact in all three subjects', () => {
    for (const [prompt, subject] of [
      ['Dia tanya apa?', 'bm'],
      ['Can you explain nouns?', 'english'],
      ['ابدأ بالشرح', 'arab']
    ]) {
      const turn = understandStudentTurn({
        prompt, hasExerciseContext: true, subjectId: subject,
        expectedAnswer: prompt, acceptedAnswers: [prompt]
      });
      expect(turn.messageType).toBe('answer_attempt');
      expect(turn.answerCandidate).toBe(prompt);
    }
  });

  it('long chat history never overrides the active question identity', async () => {
    let history = [];
    for (let i = 0; i < 10; i++) {
      const prompt = ['Dia tanya apa?', 'Beri petunjuk.'][i % 2];
      const r = await getTutorResponse({ ...bm, prompt, history });
      checkSafe(r, 'buku');
      expect(r.questionId).toBe(bm.question.id);
      history = withHistory(history, prompt, r);
    }
    const switched = await getTutorResponse({
      ...bm,
      question: {
        id: 'h4-bm-place-new', q: 'Kami bermain di ___. Pilih kata nama tempat.',
        instruction: 'Pilih kata nama tempat.', answer: 'padang', acceptedAnswers: ['padang']
      },
      expectedAnswer: 'padang', acceptedAnswers: ['padang'],
      conversationKey: 'synthetic::h4::bm-place-new',
      prompt: 'Dia tanya apa?', history
    });
    checkSafe(switched, 'padang');
    expect(switched.questionId).toBe('h4-bm-place-new');
    expect(switched.text).toMatch(/tempat/iu);
    expect(switched.text).not.toMatch(/cari\s+(?:kata\s+nama\s+)?benda/iu);
  });
});
