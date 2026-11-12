import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';

const student = { id: 'synthetic-p26e1-bm', studentId: 'synthetic-p26e1-bm' };
const subject = { id: 'bm', title: 'Bahasa Melayu' };
const topic = { id: 'kata_nama_am', title: 'Kata Nama Am' };
const question = { id: 'p26e1-place', q: 'Pilih kata nama tempat.', answer: 'taman', acceptedAnswers: ['taman'], options: ['taman', 'berlari'] };
const base = {
  student, subject, topic, question, expectedAnswer: 'taman',
  acceptedAnswers: ['taman'], conversationKey: 'synthetic::p26e1::bm::place', locale: 'ms-MY'
};

async function confirmedHistory(context = base) {
  const confirmed = await getTutorResponse({ ...context, prompt: 'Saya dah faham.' });
  expect(confirmed.pedagogicalState?.supportStage).toBe('resolved');
  expect(confirmed.dialogueClassification).toBe('LOCAL_HANDLED');
  return buildBoundedDialogueContext([
    { role: 'user', text: 'Saya dah faham.' },
    { role: 'ai', text: confirmed.text, intent: confirmed.intent,
      dialogueClassification: confirmed.dialogueClassification,
      pedagogicalState: confirmed.pedagogicalState }
  ]);
}

function assertSafeUngraded(result) {
  expect(result.dialogueClassification).toBe('LOCAL_HANDLED');
  expect(result.remoteAttempted).toBe(false);
  expect(result.generativeUsed).toBe(false);
  expect(result.isCorrect ?? null).toBeNull();
  expect(result.expectedAnswer ?? '').toBe('');
  expect(result.correctAnswer ?? '').toBe('');
  expect(result.acceptedAnswers ?? []).toEqual([]);
  expect(result.options ?? []).toEqual([]);
  expect(result.text).not.toContain('taman');
  for (const name of ['xp', 'score', 'coins', 'rewards']) expect(result).not.toHaveProperty(name);
}

describe('P2.6-E1 question-scoped BM continuation after understanding', () => {
  it.each(['Pastu camna?', 'Lepas tu macam mana?', 'Apa langkah seterusnya?'])(
    'gives the next learner action, not the same clue, for %s', async prompt => {
      const history = await confirmedHistory();
      const result = await getTutorResponse({ ...base, prompt, history });
      assertSafeUngraded(result);
      expect(result.studentTurn).toMatchObject({
        intent: 'question_help', messageType: 'follow_up_question',
        scopedNextStepAfterUnderstanding: true, answerCandidate: ''
      });
      expect(result.text).toContain('sekarang giliran kamu cuba');
      expect(result.text).toContain('Beritahu saya pilihan kamu dan sebabnya');
      expect(result.text).not.toContain('Soalan meminta kata nama tempat');
      expect(result.questionId).toBe(question.id);
    }
  );

  it('never treats an unscoped continuation without history as a completed teaching step', async () => {
    const result = await getTutorResponse({ ...base, prompt: 'Pastu camna?', history: [] });
    assertSafeUngraded(result);
    expect(result.studentTurn.scopedNextStepAfterUnderstanding).not.toBe(true);
    expect(result.text).not.toContain('sekarang giliran kamu cuba');
  });

  it('does not resume a resolved state from a different question id', async () => {
    const history = await confirmedHistory();
    const changed = { ...base, question: { ...question, id: 'another-question' } };
    const result = await getTutorResponse({ ...changed, prompt: 'Pastu camna?', history });
    assertSafeUngraded(result);
    expect(result.studentTurn.scopedNextStepAfterUnderstanding).not.toBe(true);
  });

  it('rejects a bare text-only history that has no locally resolved state', async () => {
    const result = await getTutorResponse({
      ...base, prompt: 'Pastu camna?',
      history: [{ role: 'user', text: 'Saya dah faham.' }, { role: 'ai', text: 'Bagus.' }]
    });
    assertSafeUngraded(result);
    expect(result.studentTurn.scopedNextStepAfterUnderstanding).not.toBe(true);
  });

  it('rejects an unsafe or non-local prior tutor turn', async () => {
    const history = await confirmedHistory();
    const result = await getTutorResponse({
      ...base, prompt: 'Pastu camna?',
      history: history.map(turn => turn.role === 'ai'
        ? { ...turn, dialogueClassification: 'SAFETY_BLOCKED' }
        : turn)
    });
    assertSafeUngraded(result);
    expect(result.studentTurn.scopedNextStepAfterUnderstanding).not.toBe(true);
  });

  it('does not infer confirmation from a user message that did not say they understood', async () => {
    const history = await confirmedHistory();
    const result = await getTutorResponse({
      ...base, prompt: 'Pastu camna?',
      history: history.map(turn => turn.role === 'user' ? { ...turn, text: 'Saya tak faham.' } : turn)
    });
    assertSafeUngraded(result);
    expect(result.studentTurn.scopedNextStepAfterUnderstanding).not.toBe(true);
  });

  it('does not invent a step when the exercise is no longer active', async () => {
    const history = await confirmedHistory();
    const result = await getTutorResponse({
      ...base, prompt: 'Pastu camna?', history,
      question: null, expectedAnswer: '', acceptedAnswers: []
    });
    assertSafeUngraded(result);
    expect(result.studentTurn.scopedNextStepAfterUnderstanding).not.toBe(true);
  });

  it('does not expose an answer word even if it overlaps next-step copy', async () => {
    const context = { ...base, expectedAnswer: 'tempat',
      acceptedAnswers: ['tempat'],
      question: { ...question, answer: 'tempat', acceptedAnswers: ['tempat'] } };
    const history = await confirmedHistory(context);
    const result = await getTutorResponse({ ...context, prompt: 'Pastu camna?', history });
    expect(result.studentTurn.scopedNextStepAfterUnderstanding).toBe(true);
    expect(result.text).not.toMatch(/\btempat\b/iu);
    expect(result.text).toContain('Sekarang cuba jawab sendiri');
    expect(result.expectedAnswer ?? '').toBe('');
    expect(result.isCorrect ?? null).toBeNull();
  });
});
