import { describe, expect, it } from 'vitest';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const concept = 'bm::kata_nama_am::p24a-1';
const teachingHistory = [
  { role: 'user', text: 'Saya tak faham' },
  {
    role: 'ai',
    text: 'Mari kita cuba satu langkah kecil.',
    pedagogicalState: {
      currentConcept: concept,
      supportStage: 'concept_explanation',
      misunderstandingCount: 1,
      strategyUsed: 'concept-and-example'
    }
  }
];

const base = {
  student: { id: 'p24a-child', studentId: 'p24a-child', name: 'Murid' },
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
  question: {
    id: 'p24a-1',
    q: 'Pilih kata nama orang.',
    options: ['Ali', 'berlari', 'cantik'],
    answer: 'Ali',
    acceptedAnswers: ['Ali'],
    explanation: 'Kata nama orang digunakan untuk menamakan seseorang.'
  },
  expectedAnswer: 'Ali',
  acceptedAnswers: ['Ali'],
  conversationKey: 'account-a::p24a-child::bm::kata_nama_am::p24a-1',
  attemptCount: 0,
  history: teachingHistory
};

describe('P2.4-A grounded natural multi-turn follow-ups', () => {
  it.each([
    ['Lepas tu?', 'recovery_first_step'],
    ['apa langkah seterusnya?', 'recovery_first_step'],
    ['Then what?', 'recovery_first_step'],
    ["What's next?", 'recovery_first_step'],
    ['وماذا بعد؟', 'recovery_first_step'],
    ['الخطوة التالية', 'recovery_first_step'],
    ['Apa maksudnya?', 'recovery_meaning'],
    ['apa maksud tadi?', 'recovery_meaning'],
    ['What does that mean?', 'recovery_meaning'],
    ['ما معنى ذلك؟', 'recovery_meaning']
  ])('routes %s to %s when the last Tutor turn has a teaching stage', (prompt, intent) => {
    const turn = understandStudentTurn({
      prompt, history: teachingHistory, hasExerciseContext: true, hasLearningContext: true,
      expectedAnswer: 'Ali', acceptedAnswers: ['Ali']
    });
    expect(turn).toMatchObject({
      intent,
      messageType: 'follow_up_question',
      referencesPreviousTurn: true,
      answerCandidate: ''
    });
  });

  it('never invents a grounded recovery stage after a greeting or an unscoped discussion', () => {
    for (const history of [
      [],
      [{ role: 'ai', text: 'Hai. Mari belajar bersama.' }],
      [{ role: 'user', text: 'Hai' }, { role: 'ai', text: 'Hai. Mari belajar bersama.' }]
    ]) {
      const meaning = understandStudentTurn({ prompt: 'Apa maksudnya?', history, hasExerciseContext: true });
      expect(meaning.intent).not.toBe('recovery_meaning');
      const nextStep = understandStudentTurn({ prompt: 'Lepas tu?', history, hasExerciseContext: true });
      expect(nextStep.intent).not.toBe('recovery_first_step');
    }
    const noExercise = understandStudentTurn({
      prompt: 'Lepas tu?', history: teachingHistory, hasExerciseContext: false, hasLearningContext: false
    });
    expect(noExercise.intent).not.toBe('recovery_first_step');
  });

  it('does not treat a standalone quiz answer as a conversational follow-up', () => {
    const turn = understandStudentTurn({
      prompt: 'Ali', history: teachingHistory, hasExerciseContext: true, expectedAnswer: 'Ali',
      acceptedAnswers: ['Ali']
    });
    expect(turn).toMatchObject({ intent: 'direct_answer', answerCandidate: 'Ali' });
  });

  it.each([
    ['Lepas tu?', 'recovery_first_step'],
    ['Apa maksudnya?', 'recovery_meaning']
  ])('uses the existing safe teaching recovery for %s without score, coins or answer disclosure', async (prompt, supportStage) => {
    const response = await getTutorResponse({ ...base, prompt });
    expect(response.source).toBe('intelligent-teaching-engine');
    expect(response.pedagogicalState).toMatchObject({
      supportStage,
      misunderstandingCount: 1
    });
    expect(response.expectedAnswer).toBe('');
    expect(response.acceptedAnswers).toEqual([]);
    expect(response.remoteAttempted).toBe(false);
    expect(response.generativeUsed).toBe(false);
    for (const property of ['xp', 'coins', 'rewards', 'score']) {
      expect(response).not.toHaveProperty(property);
    }
  });
});
