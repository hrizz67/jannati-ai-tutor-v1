import { describe, expect, it } from 'vitest';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const question = {
  id: 'chrome-grounding-1',
  q: 'Pilih kata nama orang.',
  instruction: 'Pilih satu jawapan.',
  options: ['Ali', 'berlari', 'cantik'],
  answer: 'Ali',
  acceptedAnswers: ['Ali'],
  explanation: 'Kata nama orang menamakan seseorang.'
};

const base = {
  student: { id: 'child-a', studentId: 'child-a', name: 'Murid' },
  childId: 'child-a',
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
  question,
  expectedAnswer: question.answer,
  acceptedAnswers: question.acceptedAnswers,
  conversationKey: 'account-a::child-a::bm::kata_nama_am::chrome-grounding-1',
  attemptCount: 0,
  history: []
};

const teachingHistory = [
  { role: 'user', text: 'Saya tak faham' },
  {
    role: 'ai',
    text: 'Mari kita lihat satu langkah kecil.',
    dialogueClassification: 'LOCAL_HANDLED',
    pedagogicalState: {
      currentConcept: 'bm::kata_nama_am::chrome-grounding-1',
      supportStage: 'concept_explanation',
      misunderstandingCount: 1
    }
  }
];

describe('Chrome audit informal understanding and active-question grounding', () => {
  it.each(['tak paham', 'x faham', 'sy x paham', 'I dun understand', "I don't get it"]) (
    'recognises informal confusion without treating it as a quiz answer: %s',
    async prompt => {
      const response = await getTutorResponse({ ...base, prompt });
      expect(response.studentTurn).toMatchObject({
        intent: 'misunderstanding',
        messageType: 'understanding_signal',
        answerCandidate: ''
      });
      expect(response.expectedAnswer).toBe('');
      expect(response.acceptedAnswers).toEqual([]);
      expect(response.text).not.toMatch(/jawapan(?:nya| betul)?\s+(?:ialah|adalah|:)\s*Ali/iu);
      expect(response.remoteAttempted).toBe(false);
      expect(response.generativeUsed).toBe(false);
      for (const property of ['score', 'xp', 'coins', 'rewards']) expect(response).not.toHaveProperty(property);
    }
  );

  it('keeps an exact canonical answer authoritative even when its text resembles confusion', () => {
    const turn = understandStudentTurn({
      prompt: 'tak paham',
      expectedAnswer: 'tak paham',
      acceptedAnswers: ['tak paham'],
      hasExerciseContext: true
    });
    expect(turn).toMatchObject({ intent: 'direct_answer', answerCandidate: 'tak paham' });
  });

  it.each(['Dia tanya apa?', 'Apa tu?', 'What does the question ask?', 'ماذا يسأل؟']) (
    'grounds a deictic request in the active question without inventing a topic: %s',
    async prompt => {
      const response = await getTutorResponse({ ...base, prompt });
      expect(response.studentTurn).toMatchObject({ intent: 'question_help', answerCandidate: '' });
      expect(response.questionId).toBe(question.id);
      expect(response.isCorrect).toBeNull();
      expect(response.grounded).toBe(true);
      expect(response.text).not.toMatch(/ayat\s+tanya/iu);
      expect(response.expectedAnswer).toBe('');
      expect(response.acceptedAnswers).toEqual([]);
      expect(response.remoteAttempted).toBe(false);
      expect(response.generativeUsed).toBe(false);
    }
  );

  it('routes colloquial next-step wording through the existing scoped teaching recovery', async () => {
    const response = await getTutorResponse({ ...base, history: teachingHistory, prompt: 'Pastu camna?' });
    expect(response.studentTurn).toMatchObject({
      intent: 'recovery_first_step',
      referencesPreviousTurn: true,
      answerCandidate: ''
    });
    expect(response.pedagogicalState?.supportStage).toBe('recovery_first_step');
    expect(response.expectedAnswer).toBe('');
    expect(response.remoteAttempted).toBe(false);
  });

  it('asks for context instead of guessing when no active question exists', () => {
    const turn = understandStudentTurn({ prompt: 'Apa tu?', hasExerciseContext: false, hasLearningContext: false });
    expect(turn).toMatchObject({
      intent: 'clarification_needed',
      needsClarification: true,
      answerCandidate: ''
    });
    expect(turn.clarifyingQuestion).toMatch(/soalan yang mana/iu);
  });

  it('does not carry an old question into a new scoped question', async () => {
    const nextQuestion = { ...question, id: 'chrome-grounding-2', q: 'Pilih kata nama tempat.' };
    const response = await getTutorResponse({
      ...base,
      question: nextQuestion,
      conversationKey: 'account-a::child-a::bm::kata_nama_am::chrome-grounding-2',
      history: teachingHistory,
      prompt: 'Dia tanya apa?'
    });
    expect(response.questionId).toBe(nextQuestion.id);
    expect(response.studentTurn.hasTeachingStage).toBe(false);
    expect(response.studentTurn.intent).toBe('question_help');
    expect(response.expectedAnswer).toBe('');
  });
});
