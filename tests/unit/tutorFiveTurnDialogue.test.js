import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';

const question = {
  id: 'p24d-bm-1', q: 'Pilih kata nama orang.',
  options: ['Ali', 'berlari', 'cantik'], answer: 'Ali', acceptedAnswers: ['Ali'],
  explanation: 'Kata nama menamakan orang, haiwan, tempat atau benda.'
};
const base = {
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
  question, expectedAnswer: 'Ali', acceptedAnswers: ['Ali'],
  student: { id: 'child-a', studentId: 'child-a' },
  conversationKey: 'account-a::child-a::bm::kata_nama_am::p24d-bm-1'
};

async function send(prompt, history, options = {}) {
  const response = await getTutorResponse({ ...base, ...options, prompt, history });
  const nextHistory = buildBoundedDialogueContext([...history,
    { role: 'user', text: prompt },
    { role: 'ai', text: response.text, dialogueClassification: response.dialogueClassification,
      source: response.source, privacySignal: response.privacySignal,
      safetySignal: response.safetySignal, pedagogicalState: response.pedagogicalState }
  ]);
  return { response, history: nextHistory };
}

describe('P2.4-D full multi-turn Tutor regression', () => {
  it('keeps a grounded five-turn BM/English/Arabic exchange answer-safe and ungraded where applicable', async () => {
    let history = [];
    const prompts = [
      'Saya tak faham',
      'Petunjuknya ialah kata nama',
      'What’s next?',
      'The clue is naming words',
      'الدليل هو الاسم'
    ];
    for (const [index, prompt] of prompts.entries()) {
      const turn = await send(prompt, history, index > 0 && index !== 2
        ? {
            isCorrect: index % 2 === 0,
            learnerAnswer: 'Ali', studentAnswer: 'Ali',
            question: { ...question, learnerAnswer: 'Ali', studentAnswer: 'Ali', answerAttempt: 'Ali' },
            attemptCount: 4, hintsUsed: 3, explanationMode: 'show_answer'
          }
        : {});
      const response = turn.response;
      expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
      expect(response.remoteAttempted).toBe(false);
      expect(response.generativeUsed).toBe(false);
      expect(response.source).toBe('intelligent-teaching-engine');
      expect(response.expectedAnswer).toBe('');
      expect(response.acceptedAnswers).toEqual([]);
      expect(response.text).toBeTruthy();
      expect(response.text).not.toMatch(/jawapannya ialah Ali|the answer is Ali/i);
      for (const field of ['score', 'xp', 'coins', 'rewards']) expect(response).not.toHaveProperty(field);
      if ([1, 3, 4].includes(index)) {
        expect(response.studentTurn).toMatchObject({
          intent: 'recovery_first_step', messageType: 'learning_response',
          answerCandidate: ''
        });
        expect(response.isCorrect).toBeNull();
        expect(response.contextUsed).toMatchObject({
          learnerAnswer: '', isCorrect: null, supportStage: 'learning_response'
        });
        expect(response.learningExperience).toMatchObject({
          stage: 'learning_response', misconception: null, praise: '', revealAnswer: false
        });
        expect(response.answerRevealPolicy.canRevealAnswer).toBe(false);
        expect(response.learnerAnswer).toBe('');
      }
      if (index === 2) {
        expect(response.studentTurn.intent).toBe('recovery_first_step');
        expect(response.studentTurn.messageType).toBe('follow_up_question');
      }
      history = turn.history;
    }
    expect(history.length).toBeGreaterThan(0);
  });

  it('does not reuse a five-turn check state after a question or child switch', async () => {
    let history = [];
    for (const prompt of ['Saya tak faham', 'Petunjuknya ialah kata nama',
      'The clue is a word', 'الدليل هو الاسم', 'What’s next?']) {
      history = (await send(prompt, history)).history;
    }
    for (const overrides of [
      { question: { ...question, id: 'p24d-bm-2' } },
      { subject: { id: 'english' }, topic: { id: 'grammar' }, question: { ...question, id: 'p24d-en-2' } }
    ]) {
      const response = (await send('Petunjuknya ialah kata nama', history, overrides)).response;
      expect(response.studentTurn.messageType).not.toBe('learning_response');
      expect(response.studentTurn.hasTeachingStage).toBe(false);
    }
  });

  it('does not reactivate a teaching state after a child privacy boundary', async () => {
    let history = [];
    history = (await send('Saya tak faham', history)).history;
    const blocked = await send('Nombor telefon saya 0123456789', history);
    expect(blocked.response.dialogueClassification).toBe('SAFETY_BLOCKED');
    const next = (await send('Petunjuknya ialah kata nama', blocked.history)).response;
    expect(next.studentTurn.messageType).not.toBe('learning_response');
    expect(next.studentTurn.hasTeachingStage).toBe(false);
    expect(next.remoteAttempted).toBe(false);
  });
});
