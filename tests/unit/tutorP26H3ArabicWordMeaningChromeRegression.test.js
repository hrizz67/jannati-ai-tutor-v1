import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { resolveArabicWordMeaningSupport } from '../../src/ai/conversation/arabicWordMeaningSupport.js';

const question = {
  id: 'p26h3-chrome-kitab',
  subjectId: 'arab',
  q: 'Perkataan Arab كِتَابٌ bermaksud ________.',
  instruction: 'Tulis maksud perkataan.',
  options: ['buku', 'pensel', 'rumah'],
  answer: 'buku',
  acceptedAnswers: ['buku'],
  explanation: 'بُوكُو ialah maksud perkataan.'
};
const base = {
  student: { id: 'synthetic-p26h3', studentId: 'synthetic-p26h3' },
  subject: { id: 'arab', title: 'Bahasa Arab' },
  // Deliberately misleading stale category note for the reported Chrome failure.
  topic: { id: 'mufradat', title: 'مفردات', note: 'اختر اسم شخص.' },
  question,
  expectedAnswer: 'buku',
  acceptedAnswers: ['buku'],
  locale: 'ar-MY',
  conversationKey: 'synthetic::p26h3::arab::mufradat::p26h3-chrome-kitab'
};

function expectArabicSafe(result) {
  expect(result.dialogueClassification).toBe('LOCAL_HANDLED');
  expect(result.questionId).toBe(question.id);
  expect(result.text).toMatch(/\p{Script=Arabic}/u);
  expect(result.text).not.toMatch(/\p{Script=Latin}/u);
  expect(result.text).not.toMatch(/اسم\s+شخص|Cuba fikir|buku|baca|jawapan|petunjuk/iu);
  expect(result.quickReplies.join(' ')).not.toMatch(/\p{Script=Latin}/u);
  expect(result.isCorrect ?? null).toBeNull();
  expect(result.expectedAnswer ?? '').toBe('');
  expect(result.acceptedAnswers ?? []).toEqual([]);
  expect(result.correctAnswer ?? '').toBe('');
  expect(result.remoteAttempted).toBe(false);
  expect(result.generativeUsed).toBe(false);
  for (const name of ['xp', 'score', 'coins', 'rewards']) expect(result).not.toHaveProperty(name);
}

function append(history, prompt, reply) {
  return buildBoundedDialogueContext([
    ...history, { role: 'user', text: prompt },
    { role: 'ai', text: reply.text, source: reply.source,
      dialogueClassification: reply.dialogueClassification,
      privacySignal: reply.privacySignal, safetySignal: reply.safetySignal,
      pedagogicalState: reply.pedagogicalState }
  ]);
}

describe('P2.6-H3 real Chrome Arabic كتاب word-meaning remediation', () => {
  it('recognizes direct Arabic teaching requests before interpreting them as short quiz answers', () => {
    const turn = understandStudentTurn({
      prompt: 'ابدأ بالشرح', expectedAnswer: 'buku', acceptedAnswers: ['buku'],
      hasExerciseContext: true, hasLearningContext: true
    });
    expect(turn).toMatchObject({
      intent: 'how_question', messageType: 'help_request',
      teachingStartRequest: true, answerCandidate: ''
    });
  });

  it('replays the complete six-turn Chrome conversation without a person-noun or mixed-Malay lesson', async () => {
    const turns = [
      ['ماذا أتعلم اليوم؟', /نتعلّم.*معنى كلمة عربية/u],
      ['ابدأ بالشرح', /السؤال يطلب معنى كلمة عربية/u],
      ['لا أفهم', /معنى الكلمة/u],
      ['أعطني تلميحًا', /تلميح.*صفحات/u],
      ['فهمت الآن', /أحسنت/u],
      ['لماذا إجابتي خاطئة؟', /لم أتحقق من إجابتك بعد/u]
    ];
    let history = [];
    for (const [prompt, expected] of turns) {
      const response = await getTutorResponse({ ...base, prompt, history });
      expectArabicSafe(response);
      expect(response.text).toMatch(expected);
      expect(response.pedagogicalState?.supportStage).toMatch(/^word_meaning_/u);
      history = append(history, prompt, response);
    }
  });

  it('does not assert a wrong grade merely because the learner asks why an answer is wrong', async () => {
    for (const isCorrect of [null, true, false]) {
      const response = await getTutorResponse({ ...base, prompt: 'لماذا إجابتي خاطئة؟', isCorrect });
      expectArabicSafe(response);
      expect(response.text).toMatch(/لم أتحقق من إجابتك/u);
      expect(response.text).not.toMatch(/إجابتك خاطئة|إجابتك صحيحة/u);
    }
  });

  it('leaves evidence-backed graded feedback untouched', async () => {
    const response = await getTutorResponse({
      ...base, prompt: 'لماذا إجابتي خاطئة؟',
      learnerAnswer: 'rumah', isCorrect: false
    });
    expect(response.pedagogicalState?.supportStage).not.toBe('word_meaning_unverified_grade');
    expect(response.expectedAnswer ?? '').toBe('');
    expect(response.remoteAttempted).toBe(false);
  });

  it('never treats an exact literal accepted teaching command as an explanation request', async () => {
    const answer = 'ابدأ بالشرح';
    const turn = understandStudentTurn({
      prompt: answer, hasExerciseContext: true,
      expectedAnswer: answer, acceptedAnswers: [answer]
    });
    expect(turn).toMatchObject({
      intent: 'direct_answer', messageType: 'answer_attempt', answerCandidate: answer
    });
  });

  it('does not apply vocabulary-meaning scaffolds to a place-noun or different subject exercise', () => {
    expect(resolveArabicWordMeaningSupport({
      prompt: 'ابدأ بالشرح', subjectId: 'arab', questionId: 'place-1',
      questionText: 'اختر اسم المكان.', hasExerciseContext: true
    })).toBeNull();
    expect(resolveArabicWordMeaningSupport({
      prompt: 'ابدأ بالشرح', subjectId: 'english', questionId: question.id,
      questionText: question.q, hasExerciseContext: true
    })).toBeNull();
    expect(resolveArabicWordMeaningSupport({
      prompt: 'ابدأ بالشرح', subjectId: 'arab', questionId: '',
      questionText: question.q, hasExerciseContext: true
    })).toBeNull();
  });

  it('does not reveal a protected Arabic word even when it appears in the active stem', async () => {
    const answer = 'كِتَابٌ';
    const response = await getTutorResponse({
      ...base, question: { ...question, id: 'p26h3-protected-kitab', answer, acceptedAnswers: [answer] },
      expectedAnswer: answer, acceptedAnswers: [answer],
      prompt: 'ابدأ بالشرح',
      conversationKey: 'synthetic::p26h3::protected-kitab'
    });
    expect(response.text.replace(/[\u0610-\u061a\u064b-\u065f\u0670]/gu, '')).not.toContain('كتاب');
    expect(response.expectedAnswer ?? '').toBe('');
    expect(response.remoteAttempted).toBe(false);
  });
});
