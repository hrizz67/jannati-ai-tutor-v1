import { describe, expect, it } from 'vitest';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

// Reference implementation from main before PR #155. Keep this independent
// of the optimized production implementation to detect behavior drift.
const recoverableStages = new Set([
  'concept_explanation', 'alternative_strategy', 'guided_small_step',
  'verified_micro_example', 'evidence_guided_correction',
  'recovery_meaning', 'recovery_first_step', 'example'
]);
function clean(value = '') {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
function originalRecentConversation(history = [], activeConcept = '') {
  const safeHistory = Array.isArray(history) ? history.filter(item => clean(item?.text)) : [];
  const lastStudentTurn = [...safeHistory].reverse().find(item => item?.role === 'user')?.text || '';
  const lastTutorMessage = [...safeHistory].reverse().find(item => item?.role === 'ai');
  return {
    lastStudentTurn: clean(lastStudentTurn),
    lastTutorTurn: clean(lastTutorMessage?.text),
    hasHistory: Boolean(lastStudentTurn),
    pendingCheck: Boolean(lastTutorMessage?.pedagogicalState?.pendingFollowUp),
    hasTeachingStage: Boolean(
      safeHistory.at(-1)?.role === 'ai' &&
      lastTutorMessage?.dialogueClassification === 'LOCAL_HANDLED' &&
      !lastTutorMessage?.privacySignal &&
      !lastTutorMessage?.safetySignal &&
      clean(activeConcept) &&
      lastTutorMessage?.pedagogicalState?.currentConcept === clean(activeConcept) &&
      recoverableStages.has(lastTutorMessage?.pedagogicalState?.supportStage)
    )
  };
}

function randomGenerator(seed = 1789) {
  let state = seed >>> 0;
  return function random(n) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % n;
  };
}

describe('P2.4-D unchanged semantics of optimized recentConversation', () => {
  it('matches old guarded history semantics across 10,000 deterministic transitions', () => {
    const random = randomGenerator();
    const concept = 'bm::kata_nama_am::p24d-1';
    const roles = ['user', 'ai', 'assistant', 'system', '', null];
    const texts = ['Saya tak faham', ' ', '', '\t\n', 'Petunjuknya ialah kata nama',
      'Lepas tu?', 'What’s next?', 'الدليل هو الاسم', 'Mari belajar',
      0, false, 0n, NaN, 1, true, 2n, Infinity, null, undefined];
    const stages = ['concept_explanation', 'recovery_first_step', 'recovery_meaning',
      'adult_support_referral', 'clarification', 'resolved', 'knowledge_safe_fallback', ''];
    const classes = ['LOCAL_HANDLED', 'SAFETY_BLOCKED', 'UNSUPPORTED',
      'NEEDS_CLARIFICATION', undefined, ''];
    const concepts = [concept, 'bm::kata_nama_am::p24d-2',
      'english::grammar::p24d-1', '', undefined];
    for (let i = 0; i < 10000; i++) {
      const history = [];
      const length = random(18);
      for (let j = 0; j < length; j++) {
        if (random(16) === 0) {
          history.push(null);
          continue;
        }
        history.push({
          role: roles[random(roles.length)],
          text: texts[random(texts.length)],
          dialogueClassification: classes[random(classes.length)],
          privacySignal: random(8) === 0 ? 'personal-data' : '',
          safetySignal: random(8) === 0 ? 'dangerous' : '',
          pedagogicalState: {
            currentConcept: concepts[random(concepts.length)],
            supportStage: stages[random(stages.length)],
            pendingFollowUp: random(2) ? 'Apakah petunjuk utama?' : ''
          }
        });
      }
      const activeConcept = concepts[random(concepts.length)];
      const expected = originalRecentConversation(history, activeConcept);
      const before = structuredClone(history);
      const prompt = i % 3 === 0 ? 'Lepas tu?' : i % 3 === 1
        ? 'Apa maksudnya?' : 'Petunjuknya ialah kata nama';
      const actual = understandStudentTurn({
        prompt, history, activeConcept, hasExerciseContext: true,
        expectedAnswer: 'Ali', acceptedAnswers: ['Ali']
      });
      for (const key of ['lastStudentTurn', 'lastTutorTurn', 'hasHistory',
        'pendingCheck', 'hasTeachingStage']) {
        expect(actual[key]).toEqual(expected[key]);
      }
      expect(history).toEqual(before);
      if (prompt === 'Apa maksudnya?' && expected.hasHistory && expected.hasTeachingStage) {
        expect(actual.intent).toBe('recovery_meaning');
      }
      if (prompt === 'Petunjuknya ialah kata nama' &&
          expected.hasHistory && expected.hasTeachingStage && expected.pendingCheck) {
        expect(actual.messageType).toBe('learning_response');
      }
    }
  });

  it.each([
    ['zero number', 0],
    ['false boolean', false],
    ['zero bigint', 0n],
    ['NaN number', NaN]
  ])('preserves legacy untyped falsey learner text: %s', async (_name, value) => {
    const activeConcept = 'bm::kata_nama_am::p24d-1';
    const history = [
      { role: 'user', text: value },
      { role: 'ai', text: 'Mari kita baca petunjuk.',
        dialogueClassification: 'LOCAL_HANDLED',
        pedagogicalState: {
          currentConcept: activeConcept,
          supportStage: 'concept_explanation',
          pendingFollowUp: 'Apakah petunjuk utama?'
        }
      }
    ];
    const expected = originalRecentConversation(history, activeConcept);
    const turn = understandStudentTurn({
      prompt: 'Lepas tu?', history, activeConcept,
      hasExerciseContext: true, expectedAnswer: 'Ali', acceptedAnswers: ['Ali']
    });
    expect(turn).toMatchObject(expected);
    expect(turn).toMatchObject({
      lastStudentTurn: '', hasHistory: false,
      intent: 'knowledge_question', messageType: 'knowledge_question'
    });

    const response = await getTutorResponse({
      prompt: 'Lepas tu?', history,
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      question: {
        id: 'p24d-1', q: 'Pilih kata nama orang.',
        options: ['Ali', 'berlari'], answer: 'Ali', acceptedAnswers: ['Ali'],
        explanation: 'Kata nama menamakan orang atau benda.'
      },
      expectedAnswer: 'Ali', acceptedAnswers: ['Ali'],
      student: { id: 'child-a', studentId: 'child-a' },
      conversationKey: 'account-a::child-a::bm::kata_nama_am::p24d-1'
    });
    // Public service deliberately sanitizes history into strings first.
    // Assert wrapper parity separately from the raw exported turn classifier.
    const sanitized = await getTutorResponse({
      prompt: 'Lepas tu?',
      history: history.map(message => message.role === 'user'
        ? { ...message, text: String(value) } : message),
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      question: {
        id: 'p24d-1', q: 'Pilih kata nama orang.',
        options: ['Ali', 'berlari'], answer: 'Ali', acceptedAnswers: ['Ali'],
        explanation: 'Kata nama menamakan orang atau benda.'
      },
      expectedAnswer: 'Ali', acceptedAnswers: ['Ali'],
      student: { id: 'child-a', studentId: 'child-a' },
      conversationKey: 'account-a::child-a::bm::kata_nama_am::p24d-1'
    });
    expect(response.studentTurn).toMatchObject({
      lastStudentTurn: String(value), hasHistory: true,
      intent: sanitized.studentTurn.intent,
      messageType: sanitized.studentTurn.messageType
    });
    // Authored check questions can vary between calls; compare routing,
    // source and policy, not verbatim pedagogical copy.
    expect(response.source).toBe(sanitized.source);
    expect(response.dialogueClassification).toBe(sanitized.dialogueClassification);
    expect(response.expectedAnswer).toBe('');
    expect(response.acceptedAnswers).toEqual([]);
    expect(response.remoteAttempted).toBe(false);
  });

  it('does not mutate frozen history or revive teaching after interleaved turns', () => {
    const concept = 'bm::kata_nama_am::p24d-1';
    const oldTutor = Object.freeze({
      role: 'ai', text: 'Baca soalan semula.',
      dialogueClassification: 'LOCAL_HANDLED',
      pedagogicalState: Object.freeze({
        currentConcept: concept, supportStage: 'concept_explanation',
        pendingFollowUp: 'Apakah petunjuk utama?'
      })
    });
    const history = Object.freeze([
      Object.freeze({ role: 'user', text: 'Saya tak faham' }),
      oldTutor,
      Object.freeze({ role: 'user', text: 'Saya mahu topik lain' })
    ]);
    const turn = understandStudentTurn({
      prompt: 'Petunjuknya ialah kata nama', history,
      activeConcept: concept, hasExerciseContext: true, expectedAnswer: 'Ali'
    });
    expect(turn).toMatchObject({
      hasTeachingStage: false, messageType: 'answer_attempt'
    });
    expect(history[1]).toBe(oldTutor);
  });

  it('cannot recover a teaching stage across mismatched concepts or unsafe last replies', () => {
    const concept = 'bm::kata_nama_am::p24d-1';
    for (const last of [
      { dialogueClassification: 'SAFETY_BLOCKED' },
      { dialogueClassification: 'UNSUPPORTED' },
      { dialogueClassification: 'LOCAL_HANDLED', privacySignal: 'personal-data' },
      { dialogueClassification: 'LOCAL_HANDLED', safetySignal: 'dangerous' },
      { dialogueClassification: 'LOCAL_HANDLED',
        pedagogicalState: { currentConcept: 'bm::kata_nama_am::p24d-2', supportStage: 'concept_explanation' } }
    ]) {
      const history = [
        { role: 'user', text: 'Saya tak faham' },
        {
          role: 'ai', text: 'Sila semak petunjuk.',
          dialogueClassification: 'LOCAL_HANDLED',
          pedagogicalState: { currentConcept: concept, supportStage: 'concept_explanation',
            pendingFollowUp: 'Apakah petunjuk utama?' }, ...last
        }
      ];
      for (const prompt of ['Lepas tu?', 'Apa maksudnya?', 'Petunjuknya ialah kata nama']) {
        const turn = understandStudentTurn({ prompt, history,
          activeConcept: concept, hasExerciseContext: true });
        expect(turn.hasTeachingStage).toBe(false);
        expect(turn.messageType).not.toBe('learning_response');
        expect(turn.intent).not.toMatch(/^recovery_(?:meaning|first_step)$/);
      }
    }
  });
});
