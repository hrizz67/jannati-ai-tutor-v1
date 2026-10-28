import { describe, expect, it } from 'vitest';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const concept = 'bm::kata_nama_am::p24c-q1';
const history = [
  { role: 'user', text: 'Saya tak faham' },
  { role: 'ai', text: 'Apakah petunjuk utama?', dialogueClassification: 'LOCAL_HANDLED',
    pedagogicalState: { currentConcept: concept, supportStage: 'concept_explanation',
      pendingFollowUp: 'Apakah petunjuk utama?' } }
];
const context = {
  student: { id: 'child-a', studentId: 'child-a' },
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
  question: { id: 'p24c-q1', q: 'Pilih kata nama orang.', options: ['Ali', 'berlari', 'cantik'],
    answer: 'Ali', acceptedAnswers: ['Ali'],
    explanation: 'Kata nama ialah perkataan untuk menamakan orang, tempat atau benda.' },
  expectedAnswer: 'Ali', acceptedAnswers: ['Ali'],
  conversationKey: 'account-a::child-a::bm::kata_nama_am::p24c-q1'
};

describe('P2.4-C scoped ungraded micro-check responses', () => {
  it.each([
    ['Petunjuknya ialah kata nama'],
    ['Petunjuk utama ialah orang'],
    ['The clue is a naming word'],
    ['الدليل هو الاسم']
  ])('treats %s as learning feedback, not as a quiz answer', (prompt) => {
    const turn = understandStudentTurn({
      prompt, history, activeConcept: concept, hasExerciseContext: true,
      expectedAnswer: 'Ali', acceptedAnswers: ['Ali']
    });
    expect(turn).toMatchObject({
      intent: 'recovery_first_step', messageType: 'learning_response',
      answerCandidate: '', isQuestion: false, referencesPreviousTurn: true,
      pendingCheck: true, hasTeachingStage: true
    });
  });

  it.each([
    ['no pending check', history.map(m => m.role === 'ai'
      ? { ...m, pedagogicalState: { ...m.pedagogicalState, pendingFollowUp: '' } } : m)],
    ['different question', history],
    ['blocked warning', history.map(m => m.role === 'ai'
      ? { ...m, dialogueClassification: 'SAFETY_BLOCKED' } : m)],
    ['unsupported reply', history.map(m => m.role === 'ai'
      ? { ...m, dialogueClassification: 'UNSUPPORTED' } : m)],
    ['intervening learner message', [...history, { role: 'user', text: 'Tukar topik' }]]
  ])('does not revive micro-check on %s', (label, olderHistory) => {
    const turn = understandStudentTurn({
      prompt: 'Petunjuknya ialah orang', history: olderHistory,
      activeConcept: label === 'different question' ? 'bm::kata_nama_am::p24c-q2' : concept,
      hasExerciseContext: true, expectedAnswer: 'Ali'
    });
    expect(turn.messageType).not.toBe('learning_response');
  });

  it('keeps explicitly labeled canonical quiz answers on their original route', () => {
    const turn = understandStudentTurn({
      prompt: 'Jawapan saya ialah Ali', history, activeConcept: concept,
      hasExerciseContext: true, expectedAnswer: 'Ali', acceptedAnswers: ['Ali']
    });
    expect(turn).toMatchObject({ intent: 'direct_answer', messageType: 'answer_attempt' });
  });

  it('continues to a protected authored teaching step across two real Tutor turns', async () => {
    const first = await getTutorResponse({ ...context, prompt: 'Saya tak faham', history: [] });
    expect(first).toMatchObject({ dialogueClassification: 'LOCAL_HANDLED',
      source: 'intelligent-teaching-engine' });
    expect(first.pedagogicalState?.pendingFollowUp).toBeTruthy();

    const firstHistory = [
      { role: 'user', text: 'Saya tak faham' },
      { role: 'ai', text: first.text, dialogueClassification: first.dialogueClassification,
        pedagogicalState: first.pedagogicalState }
    ];
    const second = await getTutorResponse({
      ...context, prompt: 'Petunjuknya ialah kata nama', history: firstHistory
    });
    expect(second.studentTurn).toMatchObject({
      intent: 'recovery_first_step', messageType: 'learning_response', answerCandidate: ''
    });
    expect(second.source).toBe('intelligent-teaching-engine');
    expect(second.pedagogicalState?.supportStage).toBe('recovery_first_step');
    expect(second.expectedAnswer).toBe('');
    expect(second.acceptedAnswers).toEqual([]);
    expect(second.remoteAttempted).toBe(false);
    expect(second.generativeUsed).toBe(false);
    for (const key of ['score', 'xp', 'coins', 'rewards']) expect(second).not.toHaveProperty(key);

    const third = await getTutorResponse({
      ...context, prompt: 'The clue is to check the word',
      history: [...firstHistory,
        { role: 'user', text: 'Petunjuknya ialah kata nama' },
        { role: 'ai', text: second.text, dialogueClassification: second.dialogueClassification,
          pedagogicalState: second.pedagogicalState }]
    });
    expect(third.studentTurn).toMatchObject({ intent: 'recovery_first_step',
      messageType: 'learning_response', answerCandidate: '' });
    expect(third.expectedAnswer).toBe('');
    expect(third.acceptedAnswers).toEqual([]);
    expect(third.remoteAttempted).toBe(false);
  });

  it('does not change the quiz answer classification when there is no micro-check', () => {
    const turn = understandStudentTurn({
      prompt: 'Ali', history: [], activeConcept: concept, hasExerciseContext: true,
      expectedAnswer: 'Ali', acceptedAnswers: ['Ali']
    });
    expect(turn).toMatchObject({ intent: 'direct_answer', answerCandidate: 'Ali' });
  });
});
