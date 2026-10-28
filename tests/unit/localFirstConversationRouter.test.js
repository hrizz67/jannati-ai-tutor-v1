import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  TUTOR_CONVERSATION_MEMORY_LIMITS,
  TUTOR_MEMORY_REDACTION_TEXT,
  createBoundedTutorConversationMemory,
  prepareTutorConversationMessagesForPersistence
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

  it('rejects overlong scope keys instead of aliasing their shared prefix', () => {
    const memory = createBoundedTutorConversationMemory();
    const sharedPrefix = 'scope-'.padEnd(TUTOR_CONVERSATION_MEMORY_LIMITS.maxScopeLength, 'x');
    const childAScope = `${sharedPrefix}-child-a`;
    const childBScope = `${sharedPrefix}-child-b`;
    expect(childAScope.slice(0, TUTOR_CONVERSATION_MEMORY_LIMITS.maxScopeLength)).toBe(
      childBScope.slice(0, TUTOR_CONVERSATION_MEMORY_LIMITS.maxScopeLength)
    );

    expect(memory.set(childAScope, [{ role: 'ai', text: 'child-a-message' }])).toEqual([]);
    expect(memory.set(childBScope, [{ role: 'ai', text: 'child-b-message' }])).toEqual([]);
    expect(memory.get(childAScope)).toEqual([]);
    expect(memory.get(childBScope)).toEqual([]);
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

  it.each([
    ['BM', 'Nur Aisyah', 'Hai Nur Aisyah. Mari kita belajar bersama.', 'Hai. Mari kita belajar bersama.'],
    ['English', 'Adam Lee', 'Hi Adam Lee. What would you like to understand?', 'Hi. What would you like to understand?']
  ])('keeps a natural personalized %s AI greeting on screen but never persists the child identity', (_language, studentName, visibleText, persistedText) => {
    const visibleGreeting = { role: 'ai', text: visibleText, persistedText, suggestions: [] };
    expect(visibleGreeting.text).toContain(studentName);

    const prepared = prepareTutorConversationMessagesForPersistence([visibleGreeting], studentName);
    expect(prepared[0].text).toBe(persistedText);
    expect(prepared[0].text).not.toContain(studentName);
    expect(prepared[0]).not.toHaveProperty('persistedText');

    const memory = createBoundedTutorConversationMemory();
    memory.set('account-a::child-a', [visibleGreeting]);
    expect(memory.get('account-a::child-a')[0].text).toBe(persistedText);
    expect(memory.get('account-a::child-a')[0].text).not.toContain(studentName);
  });

  it('removes the child identity from any assistant-origin message at the persistence boundary', () => {
    const prepared = prepareTutorConversationMessagesForPersistence([
      { role: 'ai', text: 'Aina, jawapan kamu menunjukkan usaha yang baik.' }
    ], 'Aina');
    expect(prepared[0].text).toBe('kamu, jawapan kamu menunjukkan usaha yang baik.');
    expect(prepared[0].text).not.toContain('Aina');
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

  it.each([
    'Saya mahu belajar kata kerja',
    'Tukar ke topik kata nama',
    'Switch to a new topic',
    'موضوع جديد'
  ])('distinguishes the new-topic request %s from repeated confusion', prompt => {
    expect(understandStudentTurn({ prompt, hasLearningContext: true })).toMatchObject({
      intent: 'how_question',
      messageType: 'new_topic_request',
      newTopicRequest: true
    });
  });

  it('uses a bounded six-turn context for routing', () => {
    const history = Array.from({ length: 9 }, (_, index) => ({ role: index % 2 ? 'user' : 'ai', text: String(index) }));
    expect(buildBoundedDialogueContext(history).map(item => item.text)).toEqual(['3', '4', '5', '6', '7', '8']);
  });

  it('carries only the already-sanitized pedagogical state through local routing context', () => {
    const memory = createBoundedTutorConversationMemory();
    memory.set('account-a::child-a', [{
      role: 'ai',
      text: 'Mari cuba cara lain.',
      pedagogicalState: {
        supportStage: 'alternative_strategy',
        misunderstandingCount: 2,
        strategyUsed: 'alternative-connection',
        currentConcept: 'bm::kata-nama::question-1',
        pendingFollowUp: 'Apakah petunjuk utama',
        signal: 'misunderstanding'
      }
    }]);
    const context = buildBoundedDialogueContext(memory.get('account-a::child-a'));
    expect(context[0].pedagogicalState).toMatchObject({
      misunderstandingCount: 2,
      strategyUsed: 'alternative-connection',
      currentConcept: 'bm::kata-nama::question-1'
    });
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

  it.each([
    DIALOGUE_CLASSIFICATION.SAFETY_BLOCKED,
    DIALOGUE_CLASSIFICATION.NEEDS_CLARIFICATION,
    DIALOGUE_CLASSIFICATION.REMOTE_ELIGIBLE,
    DIALOGUE_CLASSIFICATION.UNSUPPORTED
  ])('drops synthetic prior teaching progress for non-answer %s routes', classification => {
    const response = applyLocalFirstDialogueRoute({
      text: 'Mari belajar topik ini.',
      quickActions: [{ actionId: 'show_old_hint', intent: 'hint', label: 'Beri petunjuk lama' }],
      suggestedActions: ['Beri petunjuk lama'],
      pedagogicalState: {
        currentConcept: 'bm::kata_nama_am::q-1',
        supportStage: 'concept_explanation',
        misunderstandingCount: 1
      }
    }, {
      classification,
      reason: classification === DIALOGUE_CLASSIFICATION.SAFETY_BLOCKED ? 'personal-data' : 'test-route'
    });
    expect(response).not.toHaveProperty('pedagogicalState');
    expect(response).not.toHaveProperty('quickActions');
    expect(response).not.toHaveProperty('suggestedActions');
    expect(response).not.toHaveProperty('isCorrect');
    expect(response.remoteAttempted).toBe(false);
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
  it.each([
    ['Saya masih tak faham', 'concept-and-example'],
    ['Boleh terangkan cara lain?', 'alternative-connection']
  ])('does not let previous correct feedback override the new comprehension request %s', async (prompt, strategyUsed) => {
    const response = await getTutorResponse({
      student: { id: 'synthetic-child', name: 'Murid' },
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      question: {
        id: 'synthetic-bm-correct-then-confused',
        q: 'Pilih kata nama orang.',
        options: ['Ali', 'berlari', 'cantik'],
        answer: 'Ali',
        acceptedAnswers: ['Ali'],
        explanation: 'Kata nama orang digunakan untuk menamakan seseorang.'
      },
      expectedAnswer: 'Ali',
      acceptedAnswers: ['Ali'],
      isCorrect: true,
      attemptCount: 1,
      prompt,
      history: []
    });

    expect(response.source).toBe('intelligent-teaching-engine');
    expect(response.isCorrect).toBe(true);
    expect(response.pedagogicalState).toMatchObject({
      signal: 'misunderstanding',
      misunderstandingCount: 1,
      strategyUsed
    });
    expect(response.text).not.toMatch(/bagus.*betul|tepat.*jawapan/i);
    expect(response.remoteAttempted).toBe(false);
  });

  it.each([
    ['verb', 'berlari'],
    ['adjective', 'cantik'],
    ['noun', 'murid']
  ])('keeps an unsupported BM %s distractor unclassified end to end', async (_category, prompt) => {
    const response = await getTutorResponse({
      student: { id: 'synthetic-child', name: 'Murid' },
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_khas', title: 'Kata Nama Khas' },
      question: {
        id: `synthetic-bm-unsupported-${prompt}`,
        q: 'Pilih kata nama khas bagi orang.',
        options: ['Aina', 'berlari', 'cantik', 'murid'],
        answer: 'Aina',
        acceptedAnswers: ['Aina'],
        explanation: 'Kata nama khas ialah nama khusus.'
      },
      expectedAnswer: 'Aina',
      acceptedAnswers: ['Aina'],
      attemptCount: 1,
      prompt,
      history: []
    });
    expect(response.isCorrect).toBe(false);
    expect(response.misconception).toBeNull();
    expect(response.contextUsed.misconceptionType).toBe('');
    expect(response.text).not.toMatch(/sudah menjumpai kata nama|memilih nama umum/i);
    expect(response.expectedAnswer).toBe('');
  });

  it('wires scoped multi-turn misunderstanding state into the tutor response', async () => {
    const baseOptions = {
      student: { id: 'synthetic-child', name: 'Murid' },
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      question: {
        id: 'synthetic-bm-teaching-1',
        q: 'Pilih kata nama orang.',
        options: ['Ali', 'berlari', 'cantik'],
        answer: 'Ali',
        acceptedAnswers: ['Ali'],
        explanation: 'Kata nama orang digunakan untuk menamakan seseorang.',
        simpleExplanation: 'Kata nama orang ialah nama bagi seseorang.'
      },
      expectedAnswer: 'Ali',
      acceptedAnswers: ['Ali'],
      attemptCount: 0
    };
    const first = await getTutorResponse({ ...baseOptions, prompt: 'Saya tak faham', history: [] });
    const second = await getTutorResponse({
      ...baseOptions,
      prompt: 'Saya masih tak faham',
      history: [{ role: 'ai', text: first.text, pedagogicalState: first.pedagogicalState }]
    });

    expect(first.source).toBe('intelligent-teaching-engine');
    expect(first.pedagogicalState).toMatchObject({
      misunderstandingCount: 1,
      strategyUsed: 'concept-and-example'
    });
    expect(second.pedagogicalState).toMatchObject({
      misunderstandingCount: 2,
      strategyUsed: 'alternative-connection'
    });
    expect(first.expectedAnswer).toBe('');
    expect(second.expectedAnswer).toBe('');
    expect(`${first.text} ${second.text}`).not.toMatch(/jawapan(?:nya| betul)?(?: ialah|:) Ali/i);
    expect(first.remoteAttempted).toBe(false);
    expect(second.remoteAttempted).toBe(false);
  });

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
    expect(response).not.toHaveProperty('xp');
    expect(response).not.toHaveProperty('coins');
    expect(response).not.toHaveProperty('rewards');

    const wrongResponse = await getTutorResponse({ ...baseOptions, prompt: 'membaca' });
    expect(wrongResponse.isCorrect).toBe(false);
    expect(wrongResponse.expectedAnswer).toBe('');
    expect(wrongResponse.acceptedAnswers).toEqual([]);
    expect(wrongResponse.text).not.toMatch(/jawapannya ialah buku|jawapan betul.*buku/i);
    expect(wrongResponse).not.toHaveProperty('xp');
    expect(wrongResponse).not.toHaveProperty('coins');
    expect(wrongResponse).not.toHaveProperty('rewards');
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
