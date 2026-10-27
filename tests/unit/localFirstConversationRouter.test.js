import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  TUTOR_MEMORY_REDACTION_TEXT,
  createBoundedTutorConversationMemory
} from '../../src/ai/conversation/boundedConversationMemory.js';
import {
  DIALOGUE_CLASSIFICATION,
  LOCAL_FIRST_REMOTE_ENABLED,
  applyLocalFirstDialogueRoute,
  buildBoundedDialogueContext,
  classifyLocalFirstDialogue
} from '../../src/ai/conversation/localFirstConversationRouter.js';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const ungroundedResponse = {
  text: 'Saya belum pasti.',
  shortText: 'Saya belum pasti.',
  intent: 'knowledge_question',
  grounded: false,
  needsGenerativeTutor: true,
  source: 'conversation-engine'
};

describe('bounded tutor conversation memory', () => {
  it('keeps only bounded turns and returns defensive copies', () => {
    const memory = createBoundedTutorConversationMemory({ maxTurns: 4, maxScopes: 2 });
    memory.set('account-a::child-a', [
      { role: 'ai', text: '1' },
      { role: 'user', text: '2' },
      { role: 'ai', text: '3' },
      { role: 'user', text: '4' },
      { role: 'ai', text: '5', unknownPrivateField: 'not-retained' }
    ]);
    const result = memory.get('account-a::child-a');
    expect(result.map(item => item.text)).toEqual(['2', '3', '4', '5']);
    expect(result.at(-1)).not.toHaveProperty('unknownPrivateField');
    result[0].text = 'mutated';
    expect(memory.get('account-a::child-a')[0].text).toBe('2');
  });

  it('isolates child scopes, evicts least-recently-used scopes and expires entries', () => {
    let currentTime = 1000;
    const memory = createBoundedTutorConversationMemory({ maxTurns: 4, maxScopes: 2, ttlMs: 1000, now: () => currentTime });
    memory.set('account-a::child-a', [{ role: 'user', text: 'A' }]);
    memory.set('account-a::child-b', [{ role: 'user', text: 'B' }]);
    expect(memory.get('account-a::child-a')[0].text).toBe('A');
    memory.set('account-a::child-c', [{ role: 'user', text: 'C' }]);
    expect(memory.get('account-a::child-b')).toEqual([]);
    expect(memory.get('account-a::child-c')[0].text).toBe('C');
    currentTime = 2001;
    expect(memory.get('account-a::child-a')).toEqual([]);
    expect(memory.size()).toBe(0);
  });

  it('never writes memory to browser or cloud storage', () => {
    const source = readFileSync(resolve('src/ai/conversation/boundedConversationMemory.js'), 'utf8');
    expect(source).not.toMatch(/localStorage|sessionStorage|createClient|functions\.invoke|fetch\s*\(/i);
  });

  it.each([
    ['email', 'Email saya ali.murid@example.com'],
    ['phone', 'Nombor telefon saya 012-345 6789'],
    ['named identifier', 'Nama saya Ali bin Ahmad'],
    ['address', 'Alamat saya di 12 Jalan Melur'],
    ['school', 'Sekolah saya SK Seri Damai']
  ])('never retains %s personal data verbatim', (_label, personalMessage) => {
    const memory = createBoundedTutorConversationMemory();
    memory.set('account-a::child-a', [{ role: 'user', text: personalMessage }]);
    const stored = memory.get('account-a::child-a')[0];
    expect(stored.text).toBe(TUTOR_MEMORY_REDACTION_TEXT.personalData);
    expect(stored.text).not.toContain(personalMessage);
    expect(stored.privacySignal).toBe('personal-data');
  });

  it('retains only a bounded safety marker instead of sensitive student text', () => {
    const memory = createBoundedTutorConversationMemory();
    memory.set('account-a::child-a', [{ role: 'user', text: 'Saya nak bunuh diri' }]);
    const stored = memory.get('account-a::child-a')[0];
    expect(stored.text).toBe(TUTOR_MEMORY_REDACTION_TEXT.safety);
    expect(stored.text).not.toContain('bunuh diri');
    expect(stored.safetySignal).toBe('self_harm');
  });
});

describe('multilingual deterministic intent handling', () => {
  it.each([
    ['Saya tak faham', 'misunderstanding'],
    ["I don't get it", 'misunderstanding'],
    ['لا أفهم', 'misunderstanding'],
    ['مرحبا', 'general'],
    ['Why is this correct?', 'why_question'],
    ['كيف أقرأ هذه الكلمة؟', 'how_question'],
    ['أعطني مثال', 'example_request'],
    ['أعطني تلميح', 'hint'],
    ['ساعدني', 'question_help']
  ])('classifies %s as %s', (prompt, expectedIntent) => {
    expect(understandStudentTurn({ prompt, hasLearningContext: true }).intent).toBe(expectedIntent);
  });

  it('uses a bounded six-turn context for routing', () => {
    const history = Array.from({ length: 9 }, (_, index) => ({ role: index % 2 ? 'user' : 'ai', text: String(index) }));
    expect(buildBoundedDialogueContext(history).map(item => item.text)).toEqual(['3', '4', '5', '6', '7', '8']);
  });
});

describe('local-first deterministic routing', () => {
  it('classifies a sufficient local answer as LOCAL_HANDLED', () => {
    const decision = classifyLocalFirstDialogue({
      prompt: 'Kenapa tumbuhan perlukan air?',
      studentTurn: { intent: 'why_question' },
      localResponse: { ...ungroundedResponse, grounded: true, needsGenerativeTutor: false }
    });
    expect(decision.classification).toBe(DIALOGUE_CLASSIFICATION.LOCAL_HANDLED);
  });

  it('requires a local clarification before remote eligibility', () => {
    const firstDecision = classifyLocalFirstDialogue({
      prompt: 'Kenapa proses itu berlaku?',
      history: [],
      studentTurn: { intent: 'why_question' },
      localResponse: ungroundedResponse
    });
    expect(firstDecision.classification).toBe(DIALOGUE_CLASSIFICATION.NEEDS_CLARIFICATION);
    expect(firstDecision.remoteEligible).toBe(false);

    const secondDecision = classifyLocalFirstDialogue({
      prompt: 'Saya maksudkan kenapa daun perlukan cahaya untuk membuat makanan.',
      history: [
        { role: 'user', text: 'Kenapa proses itu berlaku?' },
        { role: 'ai', text: 'Bahagian mana?', dialogueClassification: DIALOGUE_CLASSIFICATION.NEEDS_CLARIFICATION }
      ],
      studentTurn: { intent: 'why_question' },
      localResponse: ungroundedResponse
    });
    expect(secondDecision.classification).toBe(DIALOGUE_CLASSIFICATION.REMOTE_ELIGIBLE);
    expect(secondDecision.remoteEligible).toBe(true);
    const safeFallback = applyLocalFirstDialogueRoute(ungroundedResponse, secondDecision, {});
    expect(safeFallback.source).toBe('local-safe-fallback');
    expect(safeFallback.remoteAttempted).toBe(false);
    expect(safeFallback.generativeUsed).toBe(false);
  });

  it('does not reuse an old clarification after a newer tutor turn', () => {
    const decision = classifyLocalFirstDialogue({
      prompt: 'Kenapa proses itu berlaku?',
      history: [
        { role: 'ai', text: 'Bahagian mana?', dialogueClassification: DIALOGUE_CLASSIFICATION.NEEDS_CLARIFICATION },
        { role: 'user', text: 'Topik lain' },
        { role: 'ai', text: 'Mari belajar topik lain.', dialogueClassification: DIALOGUE_CLASSIFICATION.LOCAL_HANDLED }
      ],
      studentTurn: { intent: 'why_question' },
      localResponse: ungroundedResponse
    });
    expect(decision.classification).toBe(DIALOGUE_CLASSIFICATION.NEEDS_CLARIFICATION);
  });

  it.each([
    ['Boleh ramal harga saham esok?', DIALOGUE_CLASSIFICATION.UNSUPPORTED],
    ['What is the stock price today?', DIALOGUE_CLASSIFICATION.UNSUPPORTED],
    ['هل هذا موضوع سياسة؟', DIALOGUE_CLASSIFICATION.UNSUPPORTED],
    ['هل يمكنك شرح اختراق؟', DIALOGUE_CLASSIFICATION.UNSUPPORTED],
    ['Nama saya Ali dan alamat saya di sini', DIALOGUE_CLASSIFICATION.SAFETY_BLOCKED],
    ['Saya nak bunuh diri', DIALOGUE_CLASSIFICATION.SAFETY_BLOCKED]
  ])('routes %s without a remote call', (prompt, expected) => {
    const decision = classifyLocalFirstDialogue({ prompt, studentTurn: { intent: 'knowledge_question' }, localResponse: ungroundedResponse });
    expect(decision.classification).toBe(expected);
    expect(decision.remoteAttempted).toBe(false);
  });

  it('uses Unicode-aware Arabic boundaries without matching longer safe words', () => {
    const decision = classifyLocalFirstDialogue({
      prompt: 'ما معنى سياسات المدرسة؟',
      studentTurn: { intent: 'knowledge_question' },
      localResponse: { ...ungroundedResponse, grounded: true, needsGenerativeTutor: false }
    });
    expect(decision.classification).toBe(DIALOGUE_CLASSIFICATION.LOCAL_HANDLED);
  });

  it('blocks the current safety signal but allows a later safe learning question', () => {
    const currentRisk = classifyLocalFirstDialogue({
      prompt: 'Saya nak bunuh diri',
      studentTurn: { intent: 'knowledge_question' },
      localResponse: ungroundedResponse
    });
    expect(currentRisk.classification).toBe(DIALOGUE_CLASSIFICATION.SAFETY_BLOCKED);

    const historicalContext = buildBoundedDialogueContext(buildBoundedDialogueContext([
      { role: 'user', text: 'Saya nak bunuh diri' }
    ]));
    const safeFollowUp = classifyLocalFirstDialogue({
      prompt: 'Berapakah 2 tambah 2?',
      history: historicalContext,
      studentTurn: { intent: 'knowledge_question' },
      localResponse: { ...ungroundedResponse, grounded: true, needsGenerativeTutor: false }
    });
    expect(safeFollowUp.classification).toBe(DIALOGUE_CLASSIFICATION.LOCAL_HANDLED);
    expect(safeFollowUp.historicalSafetySignal).toBe('self_harm');
  });

  it('does not let historical personal data poison a safe follow-up question', () => {
    const historicalContext = buildBoundedDialogueContext(buildBoundedDialogueContext([
      { role: 'user', text: 'Nama saya Ali dan sekolah saya SK Seri Damai' }
    ]));
    const decision = classifyLocalFirstDialogue({
      prompt: 'Mengapa tumbuhan perlukan air?',
      history: historicalContext,
      studentTurn: { intent: 'why_question' },
      localResponse: { ...ungroundedResponse, grounded: true, needsGenerativeTutor: false }
    });
    expect(decision.classification).toBe(DIALOGUE_CLASSIFICATION.LOCAL_HANDLED);
    expect(decision.historicalPrivacySignal).toBe(true);
    expect(historicalContext[0].text).toBe(TUTOR_MEMORY_REDACTION_TEXT.personalData);
  });

  it.each([
    DIALOGUE_CLASSIFICATION.SAFETY_BLOCKED,
    DIALOGUE_CLASSIFICATION.NEEDS_CLARIFICATION,
    DIALOGUE_CLASSIFICATION.REMOTE_ELIGIBLE,
    DIALOGUE_CLASSIFICATION.UNSUPPORTED
  ])('clears answer-success metadata from the %s non-answer route', (classification) => {
    const response = applyLocalFirstDialogueRoute({
      ...ungroundedResponse,
      isCorrect: true,
      pedagogicalStepCorrect: true,
      status: 'correct',
      supportStage: 'correct_first_try',
      expectedAnswer: '4',
      acceptedAnswers: ['4'],
      score: 100,
      success: true
    }, {
      classification,
      reason: classification === DIALOGUE_CLASSIFICATION.SAFETY_BLOCKED ? 'personal-data' : 'test-route',
      remoteEligible: classification === DIALOGUE_CLASSIFICATION.REMOTE_ELIGIBLE
    });
    for (const field of ['isCorrect', 'pedagogicalStepCorrect', 'status', 'supportStage', 'expectedAnswer', 'acceptedAnswers', 'score', 'success']) {
      expect(response).not.toHaveProperty(field);
    }
  });

  it('preserves correctness metadata for a genuine locally handled answer', () => {
    const response = applyLocalFirstDialogueRoute({ ...ungroundedResponse, isCorrect: true }, {
      classification: DIALOGUE_CLASSIFICATION.LOCAL_HANDLED,
      reason: 'local-response-sufficient'
    });
    expect(response.isCorrect).toBe(true);
  });

  it('blocks unsafe text without advancing a pending teaching step', () => {
    const pendingPedagogicalStep = { stepId: 'math-step-1', attempts: 0 };
    const decision = classifyLocalFirstDialogue({
      prompt: 'Nama saya Ali',
      studentTurn: { intent: 'direct_answer' },
      localResponse: { ...ungroundedResponse, pendingPedagogicalStep: { ...pendingPedagogicalStep, attempts: 1 } }
    });
    const response = applyLocalFirstDialogueRoute(ungroundedResponse, decision, { pendingPedagogicalStep });
    expect(response.pendingPedagogicalStep).toEqual(pendingPedagogicalStep);
    expect(response.needsGenerativeTutor).toBe(false);
    expect(response.remoteAttempted).toBe(false);
  });

  it('keeps the remote execution gate hard-disabled', () => {
    const serviceSource = readFileSync(resolve('src/utils/tutorResponseService.js'), 'utf8');
    expect(LOCAL_FIRST_REMOTE_ENABLED).toBe(false);
    expect(serviceSource).not.toMatch(/maybeEnhanceTutorResponse|functions\.invoke|fetch\s*\(/);
  });
});

describe('canonical answer and response-policy regression', () => {
  it('preserves canonical checking and the existing answer-reveal policy', async () => {
    const baseOptions = {
      student: { id: 'synthetic-child', name: 'Murid' },
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      question: { id: 'synthetic-bm-1', q: 'Pilih kata nama am: buku atau membaca.', answer: 'buku', acceptedAnswers: ['buku'] },
      expectedAnswer: 'buku',
      acceptedAnswers: ['buku'],
      attemptCount: 1,
      history: []
    };
    const response = await getTutorResponse({
      ...baseOptions,
      prompt: 'buku'
    });
    expect(response.isCorrect).toBe(true);
    expect(response.dialogueClassification).toBe(DIALOGUE_CLASSIFICATION.LOCAL_HANDLED);
    expect(response.expectedAnswer).toBe('buku');
    expect(response.remoteAttempted).toBe(false);

    const wrongResponse = await getTutorResponse({ ...baseOptions, prompt: 'membaca' });
    expect(wrongResponse.isCorrect).toBe(false);
    expect(wrongResponse.expectedAnswer).toBe('');
    expect(wrongResponse.acceptedAnswers).toEqual([]);
    expect(wrongResponse.text).not.toMatch(/jawapannya ialah buku|jawapan betul.*buku/i);
  });
});

describe('future remote fallback contract', () => {
  it('documents every mandatory gate without authorizing execution', () => {
    const contract = readFileSync(resolve('docs/engineering/P21_LOCAL_FIRST_CONVERSATION_ROUTER.md'), 'utf8');
    for (const phrase of [
      'Guardian consent',
      'Provider eligibility',
      'server-side authorization',
      'privacy, retention',
      'per-account, per-child and global daily quotas',
      'hard zero-spend policy',
      'Approved curriculum evidence IDs',
      'Input and output safety',
      'Automatic fallback'
    ]) expect(contract).toContain(phrase);
    expect(contract).toMatch(/No real API call/i);
  });
});
