import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { buildBoundedDialogueContext } from '../../src/ai/conversation/localFirstConversationRouter.js';
import { resolveEnglishNounSupport } from '../../src/ai/conversation/englishNounSupport.js';

const activeQuestion = {
  id: 'p26h2-english-pond',
  subjectId: 'english',
  q: 'The animal in the pond has fins and gills. It is a ________.',
  instruction: 'Fill in the missing word.',
  options: ['fish', 'pond', 'swim'],
  answer: 'fish',
  acceptedAnswers: ['fish'],
  explanation: 'A fish lives in water.'
};

const base = {
  student: { id: 'synthetic-p26h2', studentId: 'synthetic-p26h2', name: 'Test Learner' },
  subject: { id: 'english', title: 'English' },
  // Purposefully unrelated topic metadata is the Chrome failure stress case.
  topic: { id: 'animal_vocabulary', title: 'Animals and Descriptions', note: 'A verb is an action word.' },
  question: activeQuestion,
  expectedAnswer: activeQuestion.answer,
  acceptedAnswers: activeQuestion.acceptedAnswers,
  conversationKey: 'synthetic::p26h2::english::animal_vocabulary::p26h2-english-pond',
  locale: 'en-MY'
};

function safe(response) {
  expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
  expect(response.remoteAttempted).toBe(false);
  expect(response.generativeUsed).toBe(false);
  expect(response.isCorrect ?? null).toBeNull();
  expect(response.expectedAnswer ?? '').toBe('');
  expect(response.acceptedAnswers ?? []).toEqual([]);
  expect(response.correctAnswer ?? '').toBe('');
  expect(response.learnerAnswer ?? '').toBe('');
  expect(response.text).not.toMatch(/\bfish\b/iu);
  expect(response.text).not.toMatch(/a verb is an action word|look for the verb|find an action word|pick the verb/iu);
  expect(response.text).not.toMatch(/\b(?:saya|kamu|soalan|petunjuk|cuba|jawapan|benda|tempat)\b/iu);
  for (const key of ['xp', 'score', 'coins', 'rewards']) expect(response).not.toHaveProperty(key);
}

async function nextTurn(prompt, history, overrides = {}) {
  const response = await getTutorResponse({ ...base, ...overrides, prompt, history });
  const nextHistory = buildBoundedDialogueContext([
    ...history, { role: 'user', text: prompt },
    { role: 'ai', text: response.text, dialogueClassification: response.dialogueClassification,
      source: response.source, privacySignal: response.privacySignal,
      safetySignal: response.safetySignal, pedagogicalState: response.pedagogicalState }
  ]);
  return { response, history: nextHistory };
}

describe('P2.6-H2 Chrome P1 English Nouns education and scoping', () => {
  it('teaches Nouns inside the actual active pond exercise instead of a generic instruction', async () => {
    const { response } = await nextTurn('Can you explain nouns?', []);
    safe(response);
    expect(response.questionId).toBe(activeQuestion.id);
    expect(response.text).toMatch(/a noun is a naming word/i);
    expect(response.text).toMatch(/person.*animal.*place.*thing/i);
    expect(response.text).not.toMatch(/first,? check the instruction/i);
    expect(response.pedagogicalState?.teachingAnchor?.conceptId).toBe('english_common_noun');
  });

  it('keeps the complete six-turn Chrome learner conversation on nouns, not verbs', async () => {
    const turns = [
      ['Can you explain nouns?', /noun.*nam(?:ing|e)/iu],
      ["I don't understand.", /noun.*(?:name|word)/iu],
      ['Which word should I look at?', /(?:look at|naming word|words near)/iu],
      ['Can you give me a simple example?', /(?:teacher|pencil|park).*noun/iu],
      ['Why is that a noun?', /noun.*(?:person|animal|place|thing)/iu],
      ['Okay, what do I do next?', /read the sentence.*clue/iu]
    ];
    let history = [];
    for (const [prompt, expected] of turns) {
      const result = await nextTurn(prompt, history);
      safe(result.response);
      expect(result.response.text).toMatch(expected);
      expect(result.response.questionId).toBe(activeQuestion.id);
      expect(result.response.pedagogicalState?.teachingAnchor?.conceptId).toBe('english_common_noun');
      expect(result.response.pedagogicalState?.supportStage).toMatch(/^noun_/u);
      history = result.history;
    }
  });

  it('continues a learner-requested noun lesson in an active Nouns topic, but never hijacks generic help', async () => {
    const nounTopic = { id: 'nouns', title: 'Nouns', note: 'Nouns name people, animals, places and things.' };
    const first = await nextTurn('Can you explain nouns?', [], { topic: nounTopic });
    safe(first.response);
    const followUp = await nextTurn('Which word should I look at?', first.history, { topic: nounTopic });
    safe(followUp.response);
    expect(followUp.response.text).toMatch(/naming word/i);
  });

  it('does not leak a protected noun used in an authored example', async () => {
    const teacherQuestion = {
      ...activeQuestion, id: 'p26h2-teacher',
      q: 'A person who teaches is a ____.',
      options: ['teacher', 'walk', 'tall'],
      answer: 'teacher', acceptedAnswers: ['teacher']
    };
    const option = {
      ...base, question: teacherQuestion, expectedAnswer: 'teacher',
      acceptedAnswers: ['teacher'],
      conversationKey: 'synthetic::p26h2::english::animal_vocabulary::p26h2-teacher'
    };
    let history = [];
    for (const prompt of ['Can you explain nouns?', 'Give me an example']) {
      const result = await nextTurn(prompt, history, option);
      const response = result.response;
      expect(response.text).not.toMatch(/\bteacher\b/i);
      expect(response.expectedAnswer ?? '').toBe('');
      expect(response.correctAnswer ?? '').toBe('');
      expect(response.remoteAttempted).toBe(false);
      history = result.history;
    }
  });

  it('keeps literal authored correct-answer precedence above noun explanation routing', async () => {
    const phrase = 'Can you explain nouns?';
    const question = { ...activeQuestion, id: 'p26h2-exact-answer', answer: phrase, acceptedAnswers: [phrase] };
    const response = (await nextTurn(phrase, [], {
      question, expectedAnswer: phrase, acceptedAnswers: [phrase],
      conversationKey: 'synthetic::p26h2::english::p26h2-exact-answer'
    })).response;
    expect(response.studentTurn.messageType).toBe('answer_attempt');
    expect(response.pedagogicalState?.supportStage).not.toBe('noun_concept_explanation');
  });

  it('does not carry a noun anchor across question identity or an unrelated subject', async () => {
    const first = await nextTurn('Can you explain nouns?', []);
    const anotherQuestion = { ...activeQuestion, id: 'p26h2-other-question' };
    const staleHistory = first.history;
    const questionSwitch = (await nextTurn('Which word should I look at?', staleHistory, {
      question: anotherQuestion,
      conversationKey: 'synthetic::p26h2::english::animal_vocabulary::p26h2-other-question'
    })).response;
    expect(questionSwitch.pedagogicalState?.supportStage).not.toBe('noun_clue');
    const otherSubject = resolveEnglishNounSupport({
      prompt: 'Can you explain nouns?', subjectId: 'bm', questionId: activeQuestion.id,
      hasExerciseContext: true
    });
    expect(otherSubject).toBeNull();
  });

  it('does not classify unrelated new-topic requests as active noun assistance', async () => {
    const result = await nextTurn('I want to learn verbs', []);
    expect(result.response.pedagogicalState?.supportStage).not.toBe('noun_concept_explanation');
    expect(result.response.pedagogicalState?.supportStage).not.toBe('noun_clue');
  });
});
