import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getTutorQuickReplyDispatch,
  resolveTutorQuickReplyAction
} from '../../src/ai/conversation/tutorQuickReplyActions.js';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/ai/tutorResponseEngine.js';

const exerciseContext = {
  hasExerciseContext: true,
  conversationKey: 'account-a::child-a::session-a::question-a',
  questionId: 'quick-reply-question',
  subjectId: 'bm',
  topicId: 'kata_nama_am'
};

const tutorOptions = {
  student: { id: 'child-a', name: 'Murid' },
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
  question: {
    id: 'quick-reply-question',
    q: 'Pilih kata nama orang.',
    options: ['Ali', 'berlari', 'cantik'],
    answer: 'Ali',
    acceptedAnswers: ['Ali'],
    explanation: 'Kata nama orang digunakan untuk menamakan seseorang.',
    simpleExplanation: 'Kata nama orang ialah nama bagi seseorang.'
  },
  expectedAnswer: 'Ali',
  acceptedAnswers: ['Ali'],
  attemptCount: 1,
  conversationKey: exerciseContext.conversationKey
};

function click(label) {
  const action = resolveTutorQuickReplyAction(label, exerciseContext);
  return { action, dispatch: getTutorQuickReplyDispatch(action) };
}

function priorState(currentConcept, count, supportStage = 'concept_explanation') {
  return [{
    role: 'ai',
    text: 'Bantuan terdahulu.',
    pedagogicalState: {
      supportStage,
      misunderstandingCount: count,
      strategyUsed: 'concept-and-example',
      currentConcept,
      pendingFollowUp: '',
      signal: 'misunderstanding',
      misconceptionType: ''
    }
  }];
}

async function getInitialTeachingState() {
  const response = await getTutorResponse({
    ...tutorOptions,
    prompt: 'Saya tak faham',
    isCorrect: true,
    history: []
  });
  return response.pedagogicalState;
}

describe('Tutor quick-reply click integration', () => {
  it.each([
    ['Saya sudah faham', 'confirm_understanding', 'understanding_confirmation'],
    ['I understand now', 'confirm_understanding', 'understanding_confirmation'],
    ['فهمت الآن', 'confirm_understanding', 'understanding_confirmation'],
    ['Terangkan cara lain', 'request_alternative_explanation', 'alternative_explanation'],
    ['Explain another way', 'request_alternative_explanation', 'alternative_explanation'],
    ['اشرح بطريقة أخرى', 'request_alternative_explanation', 'alternative_explanation'],
    ['Beri contoh mudah', 'request_approved_example', 'example_request'],
    ['Give an easy example', 'request_approved_example', 'example_request'],
    ['أعطني مثالًا سهلًا', 'request_approved_example', 'example_request'],
    ['Maksud perkataan', 'explain_recovery_meaning', 'recovery_meaning'],
    ['The first step', 'explain_recovery_first_step', 'recovery_first_step'],
    ['الخطوة الأولى', 'explain_recovery_first_step', 'recovery_first_step']
  ])('maps click label %s to %s and %s', (label, actionId, intent) => {
    const { action, dispatch } = click(label);
    expect(action).toMatchObject({ actionId, intent, source: 'tutor_quick_action' });
    expect(dispatch).toMatchObject({ type: 'message', action: { actionId, intent } });
    expect(understandStudentTurn({
      prompt: label,
      intent: action.intent,
      hasExerciseContext: true,
      hasLearningContext: true
    }).intent).toBe(intent);
  });

  it('emits structured pedagogical actions before the modal click', async () => {
    const response = await getTutorResponse({
      ...tutorOptions,
      prompt: 'Saya tak faham',
      isCorrect: true,
      history: []
    });
    expect(response.quickActions).toEqual([
      expect.objectContaining({ actionId: 'request_approved_example', intent: 'example_request', label: 'Beri contoh mudah' }),
      expect.objectContaining({ actionId: 'request_alternative_explanation', intent: 'alternative_explanation', label: 'Terangkan cara lain' }),
      expect.objectContaining({ actionId: 'confirm_understanding', intent: 'understanding_confirmation', label: 'Saya sudah faham' })
    ]);
  });

  it('resets teaching state when understanding is clicked after correct quiz feedback', async () => {
    const { action } = click('Saya sudah faham');
    const initialState = await getInitialTeachingState();
    const response = await getTutorResponse({
      ...tutorOptions,
      prompt: action.label,
      intent: action.intent,
      tutorAction: action,
      isCorrect: true,
      history: priorState(initialState.currentConcept, 3, 'guided_small_step')
    });

    expect(response.isCorrect).toBe(true);
    expect(response.pedagogicalState).toMatchObject({
      signal: 'resolved',
      misunderstandingCount: 0,
      strategyUsed: 'check-completed'
    });
  });

  it.each([
    ['Terangkan cara lain', 'alternative-connection'],
    ['Beri contoh mudah', 'alternative-connection']
  ])('routes %s into the teaching progression despite previous correct feedback', async (label, strategyUsed) => {
    const { action } = click(label);
    const initialState = await getInitialTeachingState();
    const response = await getTutorResponse({
      ...tutorOptions,
      prompt: action.label,
      intent: action.intent,
      tutorAction: action,
      isCorrect: true,
      history: priorState(initialState.currentConcept, 1)
    });

    expect(response.isCorrect).toBe(true);
    expect(response.source).toBe('intelligent-teaching-engine');
    expect(response.pedagogicalState).toMatchObject({
      signal: 'misunderstanding',
      misunderstandingCount: 2,
      strategyUsed
    });
    expect(response.expectedAnswer).toBe('Ali');
  });

  it.each([
    ['Maksud perkataan', 'recovery_meaning', 'recovery_meaning'],
    ['Langkah pertama', 'recovery_first_step', 'recovery_first_step']
  ])('handles recovery click %s with bounded grounded support', async (label, intent, supportStage) => {
    const { action } = click(label);
    const initialState = await getInitialTeachingState();
    expect(action.intent).toBe(intent);
    const response = await getTutorResponse({
      ...tutorOptions,
      prompt: action.label,
      intent: action.intent,
      tutorAction: action,
      isCorrect: false,
      history: priorState(initialState.currentConcept, 4, 'verified_micro_example')
    });

    expect(response.source).toBe('intelligent-teaching-engine');
    expect(response.pedagogicalState).toMatchObject({
      signal: 'recovery_selection',
      misunderstandingCount: 4,
      supportStage
    });
    expect(response.expectedAnswer).toBe('');
    expect(response.text).not.toMatch(/jawapan(?:nya| betul)?(?: ialah|:) Ali/i);
    expect((response.text.match(/[?؟]/g) || []).length).toBeLessThanOrEqual(1);
  });

  it('acknowledges adult support locally, then exposes a real close action', async () => {
    const { action } = click('Saya akan tanya orang dewasa');
    const initialState = await getInitialTeachingState();
    const response = await getTutorResponse({
      ...tutorOptions,
      prompt: action.label,
      intent: action.intent,
      tutorAction: action,
      isCorrect: false,
      history: priorState(initialState.currentConcept, 5, 'adult_support_referral')
    });

    expect(response.pedagogicalState).toMatchObject({
      signal: 'adult_support',
      misunderstandingCount: 5,
      supportStage: 'adult_support_acknowledgement',
      pendingFollowUp: ''
    });
    expect(response.quickActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ actionId: 'close_tutor', intent: 'close_tutor', label: 'Tutup Tutor' })
    ]));
    expect(getTutorQuickReplyDispatch(response.quickActions.find(item => item.actionId === 'close_tutor')).type).toBe('close');
  });

  it.each(['Tutup Tutor', 'Close Tutor', 'إغلاق المعلّم'])('dispatches %s through the modal close path without a tutor message', label => {
    const { action, dispatch } = click(label);
    expect(action).toMatchObject({ actionId: 'close_tutor', intent: 'close_tutor' });
    expect(dispatch.type).toBe('close');
  });

  it('does not advertise unsupported save or dashboard navigation actions', () => {
    const engineSource = readFileSync(resolve('src/ai/pedagogy/intelligentTeachingEngine.js'), 'utf8');
    const modalSource = readFileSync(resolve('src/components/ai/TutorAIModal.jsx'), 'utf8');
    expect(engineSource).not.toMatch(/Simpan soalan ini|Keep this question|Kembali ke papan utama|Return to dashboard|العودة إلى الصفحة الرئيسية/);
    expect(modalSource).toMatch(/getTutorQuickReplyDispatch\(action\)/);
    expect(modalSource).toMatch(/dispatch\.type === 'close'[\s\S]*?onTutup\(\)/);
  });
});
