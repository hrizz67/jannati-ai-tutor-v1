import { describe, expect, it } from 'vitest';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const student = { id: 'synthetic-p26b3', studentId: 'synthetic-p26b3' };
const english = {
  id: 'english', title: 'English',
  topics: [
    { id: 'verbs', title: 'Verbs', note: 'Verbs describe actions.' },
    { id: 'nouns', title: 'Nouns', note: 'Nouns name people, animals, places and things.' }
  ]
};
const oldTopic = { id: 'verbs', title: 'Verbs', note: 'Verbs describe actions.' };
const oldQuestion = {
  id: 'old-verbs-question',
  q: 'Choose the action word from these words.',
  instruction: 'Pick the verb.',
  options: ['jumping', 'tall'],
  answer: 'jumping',
  acceptedAnswers: ['jumping']
};
const oldHistory = [
  { role: 'user', text: 'How do I choose the verb?' },
  { role: 'ai', text: 'Look for an action in the sentence.', dialogueClassification: 'LOCAL_HANDLED',
    pedagogicalState: { currentConcept: 'english::verbs::old-verbs-question', supportStage: 'concept_explanation' } }
];
const base = { student, subject: english, topic: oldTopic, question: oldQuestion, history: oldHistory, locale: 'en-MY' };

function assertNoOldQuestion(response) {
  expect(response.studentTurn.newTopicRequest).toBe(true);
  expect(response.studentTurn.answerCandidate).toBe('');
  expect(response.studentTurn.hasTeachingStage).toBe(false);
  expect(response.questionId).toBe('');
  expect(response.questionText).toBe('');
  expect(response.instruction).toBe('');
  expect(response.options).toEqual([]);
  expect(response.expectedAnswer).toBe('');
  expect(response.correctAnswer).toBe('');
  expect(response.acceptedAnswers).toEqual([]);
  expect(response.isCorrect).toBeNull();
  expect(response.pedagogicalState).toBeNull();
  expect(response.text).not.toMatch(/jumping|action word|pick the verb|look for an action/iu);
  expect(response.remoteAttempted).toBe(false);
  expect(response.generativeUsed).toBe(false);
  for (const name of ['xp','score','coins','rewards']) expect(response).not.toHaveProperty(name);
}

describe('P2.6-B3 English named-topic requests and isolated new scope', () => {
  it.each(['I want to learn nouns and places', 'I would like to learn about nouns', 'I want to study nouns'])(
    'recognizes an explicit named learning request: %s', prompt => {
      const turn = understandStudentTurn({ prompt, hasExerciseContext: true, expectedAnswer: 'jumping' });
      expect(turn).toMatchObject({ intent: 'how_question', messageType: 'new_topic_request', newTopicRequest: true, answerCandidate: '' });
    }
  );

  it('matches an approved English topic and discards the previous question and teaching state', async () => {
    const response = await getTutorResponse({
      ...base, prompt: 'I want to learn nouns and places',
      conversationKey: 'synthetic::p26b3::matched'
    });
    expect(response.studentTurn.intent).toBe('how_question');
    expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
    expect(response.topic).toBe('Nouns');
    expect(response.text).toMatch(/learn about nouns/iu);
    expect(response.text).toMatch(/explanation|example|practice/iu);
    expect(response.quickReplies).toEqual(['Explain this topic', 'Show an example', 'Try a short practice']);
    assertNoOldQuestion(response);
  });

  it('uses the active topic as a candidate only when its title matches the explicit request', async () => {
    const response = await getTutorResponse({
      ...base, subject: { id: 'english', title: 'English' },
      topic: { id: 'nouns', title: 'Nouns' },
      prompt: 'I want to learn nouns and places',
      conversationKey: 'synthetic::p26b3::active-matching'
    });
    expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
    expect(response.topic).toBe('Nouns');
    assertNoOldQuestion(response);
  });

  it('does not manufacture a topic or preserve stale question metadata when no approved topic matches', async () => {
    const response = await getTutorResponse({
      ...base, prompt: 'I want to learn astronomy and galaxies',
      conversationKey: 'synthetic::p26b3::unmatched'
    });
    expect(response.studentTurn.intent).toBe('how_question');
    expect(response.topic).toBe('');
    expect(response.text).not.toMatch(/learn about verbs|learn about nouns|jumping/iu);
    expect(response.text).toMatch(/topic|subject|lesson/iu);
    expect(['LOCAL_HANDLED','NEEDS_CLARIFICATION']).toContain(response.dialogueClassification);
    assertNoOldQuestion(response);
  });

  it('retains authoritative exact-answer precedence if an authored quiz expects the same literal phrase', () => {
    const phrase = 'I want to learn nouns';
    const turn = understandStudentTurn({ prompt: phrase, hasExerciseContext: true,
      expectedAnswer: phrase, acceptedAnswers: [phrase] });
    expect(turn).toMatchObject({ intent: 'direct_answer', messageType: 'answer_attempt', answerCandidate: phrase });
  });

  it('does not interpret an incomplete request or an ordinary noun question as a new topic', () => {
    expect(understandStudentTurn({ prompt: 'I want to learn', hasExerciseContext: true }).newTopicRequest).not.toBe(true);
    expect(understandStudentTurn({ prompt: 'What is a noun?', hasExerciseContext: true }).newTopicRequest).not.toBe(true);
  });

  it('does not alter existing Bahasa Melayu named-learning recognition', () => {
    const turn = understandStudentTurn({ prompt: 'Saya mahu belajar kata nama am', hasExerciseContext: false });
    expect(turn).toMatchObject({ intent: 'how_question', messageType: 'new_topic_request', newTopicRequest: true });
  });
});
