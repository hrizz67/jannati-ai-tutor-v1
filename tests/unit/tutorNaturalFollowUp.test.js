import { describe, expect, it } from 'vitest';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const concept = 'bm::kata_nama_am::p24a-1';
const teachingHistory = [
  { role: 'user', text: 'Saya tak faham' },
  {
    role: 'ai',
    text: 'Mari kita cuba satu langkah kecil.',
    dialogueClassification: 'LOCAL_HANDLED',
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
    ["What’s next?", 'recovery_first_step'],
    ["What‘s next?", 'recovery_first_step'],
    ['وماذا بعد؟', 'recovery_first_step'],
    ['الخطوة التالية', 'recovery_first_step'],
    ['Apa maksudnya?', 'recovery_meaning'],
    ['apa maksud tadi?', 'recovery_meaning'],
    ['What does that mean?', 'recovery_meaning'],
    ['ما معنى ذلك؟', 'recovery_meaning']
  ])('routes %s to %s when the last Tutor turn has a teaching stage', (prompt, intent) => {
    const turn = understandStudentTurn({
      prompt, history: teachingHistory, hasExerciseContext: true, hasLearningContext: true,
      activeConcept: concept, expectedAnswer: 'Ali', acceptedAnswers: ['Ali']
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
      const meaning = understandStudentTurn({ prompt: 'Apa maksudnya?', history, hasExerciseContext: true, activeConcept: concept });
      expect(meaning.intent).not.toBe('recovery_meaning');
      const nextStep = understandStudentTurn({ prompt: 'Lepas tu?', history, hasExerciseContext: true, activeConcept: concept });
      expect(nextStep.intent).not.toBe('recovery_first_step');
    }
    const noExercise = understandStudentTurn({
      prompt: 'Lepas tu?', history: teachingHistory, hasExerciseContext: false, hasLearningContext: false,
      activeConcept: concept
    });
    expect(noExercise.intent).not.toBe('recovery_first_step');
  });

  it('does not revive a stale pedagogical step after switching questions', () => {
    const activeConcept = 'bm::kata_nama_am::different-question';
    for (const prompt of ['Lepas tu?', 'Apa maksudnya?']) {
      const turn = understandStudentTurn({
        prompt, history: teachingHistory, hasExerciseContext: true, activeConcept
      });
      expect(turn.intent).not.toMatch(/^recovery_(?:first_step|meaning)$/);
      expect(turn.hasTeachingStage).toBe(false);
    }
  });

  it('ignores a prior teaching state if a newer learner turn followed it without a Tutor reply', () => {
    const staleHistory = [...teachingHistory, { role: 'user', text: 'Saya mahu tukar topik' }];
    for (const prompt of ['Lepas tu?', 'Apa maksudnya?']) {
      const turn = understandStudentTurn({
        prompt, history: staleHistory, hasExerciseContext: true, activeConcept: concept
      });
      expect(turn.intent).not.toMatch(/^recovery_(?:first_step|meaning)$/);
      expect(turn.hasTeachingStage).toBe(false);
    }
  });

  it.each(['Lepas tu?', 'Apa maksudnya?'])(
    'fails closed on %s when the current question has no stable ID',
    async prompt => {
      const response = await getTutorResponse({
        ...base,
        question: { ...base.question, id: undefined },
        prompt,
        history: [
          { role: 'user', text: 'Saya masih tak faham' },
          {
            role: 'ai', text: 'Cuba kita ulang.',
            pedagogicalState: {
              currentConcept: 'bm::kata_nama_am::general',
              supportStage: 'concept_explanation',
              misunderstandingCount: 1
            }
          }
        ]
      });
      expect(response.studentTurn.intent).not.toMatch(/^recovery_(?:first_step|meaning)$/);
      expect(response.studentTurn.hasTeachingStage).toBe(false);
      expect(response.expectedAnswer).toBe('');
      expect(response.remoteAttempted).toBe(false);
    }
  );

  it.each([
    'resolved',
    'new_topic',
    'clarification',
    'adult_support_referral',
    'adult_support_closed',
    'knowledge_safe_fallback',
    'example_unavailable'
  ])('does not resume a terminal or ungrounded teaching stage: %s', supportStage => {
    const history = [
      { role: 'user', text: 'Saya tak faham' },
      {
        role: 'ai', text: 'Sesi ini sudah selesai atau tidak dapat disahkan.',
        pedagogicalState: { currentConcept: concept, supportStage }
      }
    ];
    for (const prompt of ['Lepas tu?', 'Apa maksudnya?']) {
      const turn = understandStudentTurn({
        prompt, history, hasExerciseContext: true, activeConcept: concept
      });
      expect(turn.hasTeachingStage).toBe(false);
      expect(turn.intent).not.toMatch(/^recovery_(?:first_step|meaning)$/);
    }
  });

  it.each([
    ['SAFETY_BLOCKED', 'child-privacy'],
    ['UNSUPPORTED', 'local-scope-boundary'],
    ['NEEDS_CLARIFICATION', 'local-dialogue-router'],
    ['REMOTE_ELIGIBLE', 'local-safe-fallback'],
    ['UNKNOWN', 'intelligent-teaching-engine']
  ])('rejects forged or legacy %s predecessor teaching state', (classification, source) => {
    const history = [
      { role: 'user', text: 'Saya tak faham' },
      {
        role: 'ai', text: 'Tidak dapat sambung pelajaran.',
        dialogueClassification: classification, source,
        pedagogicalState: { currentConcept: concept, supportStage: 'concept_explanation' }
      }
    ];
    for (const prompt of ['Lepas tu?', 'Apa maksudnya?', "What’s next?"]) {
      const turn = understandStudentTurn({
        prompt, history, hasExerciseContext: true, activeConcept: concept
      });
      expect(turn.intent).not.toMatch(/^recovery_(?:first_step|meaning)$/);
      expect(turn.hasTeachingStage).toBe(false);
    }
  });

  it.each(['Lepas tu?', 'Apa maksudnya?'])('does not recover through unclassified legacy messages: %s', prompt => {
    const history = teachingHistory.map(message => {
      const { dialogueClassification: _classification, ...legacy } = message;
      return legacy;
    });
    const turn = understandStudentTurn({ prompt, history, hasExerciseContext: true, activeConcept: concept });
    expect(turn.hasTeachingStage).toBe(false);
    expect(turn.intent).not.toMatch(/^recovery_(?:first_step|meaning)$/);
  });

  it.each([
    ['personal-data', 'Saya tak faham, nama penuh saya Ali bin Ahmad', 'SAFETY_BLOCKED'],
    ['safety', 'Saya tak faham, saya nak bunuh diri', 'SAFETY_BLOCKED'],
    ['unsupported', 'Saya tak faham politik', 'UNSUPPORTED']
  ])('does not resume %s route in the real Tutor service', async (_label, firstPrompt, expectedClassification) => {
    const first = await getTutorResponse({ ...base, history: [], prompt: firstPrompt });
    expect(first.dialogueClassification).toBe(expectedClassification);
    expect(first).not.toHaveProperty('pedagogicalState');
    expect(first.remoteAttempted).toBe(false);
    const history = [
      { role: 'user', text: firstPrompt },
      {
        role: 'ai', text: first.text,
        dialogueClassification: first.dialogueClassification,
        source: first.source,
        pedagogicalState: first.pedagogicalState || null
      }
    ];
    for (const prompt of ['Lepas tu?', 'Apa maksudnya?']) {
      const next = await getTutorResponse({ ...base, prompt, history });
      expect(next.studentTurn.hasTeachingStage).toBe(false);
      expect(next.studentTurn.intent).not.toMatch(/^recovery_(?:first_step|meaning)$/);
      expect(next.remoteAttempted).toBe(false);
    }
  });

  it('treats iOS smart apostrophe as a real next-step request end to end', async () => {
    const response = await getTutorResponse({ ...base, prompt: 'What’s next?' });
    expect(response.studentTurn.intent).toBe('recovery_first_step');
    expect(response.source).toBe('intelligent-teaching-engine');
    expect(response.pedagogicalState?.supportStage).toBe('recovery_first_step');
    expect(response.expectedAnswer).toBe('');
    expect(response.acceptedAnswers).toEqual([]);
    expect(response.remoteAttempted).toBe(false);
  });

  it('does not treat a standalone quiz answer as a conversational follow-up', () => {
    const turn = understandStudentTurn({
      prompt: 'Ali', history: teachingHistory, hasExerciseContext: true, activeConcept: concept, expectedAnswer: 'Ali',
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
