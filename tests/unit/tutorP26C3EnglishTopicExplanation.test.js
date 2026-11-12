import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';

const student = { id: 'synthetic-p26c3-en', studentId: 'synthetic-p26c3-en' };
const nouns = { id: 'nouns', title: 'Nouns', note: 'Nouns name a person, animal, place, or thing.' };
const verbs = { id: 'verbs', title: 'Verbs', note: 'Verbs show an action.' };
const subject = { id: 'english', title: 'English', topics: [verbs, nouns] };
const base = {
  student, subject, topic: verbs,
  locale: 'en-MY', conversationKey: 'synthetic::p26c3::en'
};

function safeAndUngraded(result) {
  expect(result.remoteAttempted).toBe(false);
  expect(result.generativeUsed).toBe(false);
  expect(result.isCorrect ?? null).toBeNull();
  expect(result.expectedAnswer ?? '').toBe('');
  expect(result.acceptedAnswers ?? []).toEqual([]);
  expect(result.correctAnswer ?? '').toBe('');
  expect(result.options ?? []).toEqual([]);
  for (const key of ['xp', 'score', 'coins', 'rewards']) {
    expect(result).not.toHaveProperty(key);
  }
}

describe('P2.6-C3 explain a matched English topic without stale question help', () => {
  it.each(['Can you explain nouns?', 'Could you explain nouns?', 'Please explain nouns.', 'Explain nouns'])(
    'actually teaches the matching approved Nouns note for %s', async prompt => {
      const result = await getTutorResponse({ ...base, prompt, question: null });
      safeAndUngraded(result);
      expect(result.studentTurn).toMatchObject({
        intent: 'question_help', messageType: 'help_request',
        namedTopicExplainRequest: true, newTopicRequest: true,
        answerCandidate: ''
      });
      expect(result.topic).toBe('Nouns');
      expect(result.text).toContain('Nouns name a person, animal, place, or thing.');
      expect(result.text).toContain('Can you think of one example?');
      expect(result.text).not.toContain('First, check the instruction');
      expect(result.questionId).toBe('');
      expect(result.questionText).toBe('');
      expect(result.instruction).toBe('');
      expect(result.quickReplies).toEqual(['Show an example', 'I will try', 'Explain again']);
    }
  );

  it('does not invent an explanation when the matched topic has no approved note', async () => {
    const noNote = { id: 'nouns', title: 'Nouns' };
    const result = await getTutorResponse({
      ...base, subject: { ...subject, topics: [noNote] }, topic: noNote,
      prompt: 'Can you explain nouns?'
    });
    safeAndUngraded(result);
    expect(result.text).toContain('do not have a clear explanation');
    expect(result.text).not.toContain('First, check the instruction');
    expect(result.text).not.toContain('Nouns name a');
  });

  it('does not fabricate a topic match for an unknown English request', async () => {
    const result = await getTutorResponse({ ...base, prompt: 'Can you explain astronomy?' });
    safeAndUngraded(result);
    expect(result.studentTurn.namedTopicExplainRequest).not.toBe(true);
    expect(result.text).not.toContain('Nouns name a person');
    expect(result.text).not.toContain('Verbs show an action');
  });

  it('does not reveal protected answer text embedded inside a topic note', async () => {
    const unsafeNouns = { ...nouns, note: 'Nouns: the answer is teacher.' };
    const result = await getTutorResponse({
      ...base, subject: { ...subject, topics: [unsafeNouns] }, topic: unsafeNouns,
      prompt: 'Can you explain nouns?', acceptedAnswers: ['teacher']
    });
    safeAndUngraded(result);
    expect(result.text).toContain('do not have a clear explanation');
    expect(result.text).not.toContain('teacher');
  });

  it('keeps active exercise help separate, without switching or leaking answers', async () => {
    const question = { id: 'old-verbs', q: 'Choose the action word.', answer: 'jumping', acceptedAnswers: ['jumping'] };
    const result = await getTutorResponse({
      ...base, question, expectedAnswer: 'jumping', acceptedAnswers: ['jumping'],
      prompt: 'Can you explain nouns?'
    });
    safeAndUngraded(result);
    expect(result.studentTurn.namedTopicExplainRequest).not.toBe(true);
    expect(result.text).not.toContain('jumping');
    expect(result.text).not.toContain('Nouns name a person');
  });

  it('preserves exact accepted-answer classification when phrase is an exercise answer', () => {
    const answer = 'Can you explain nouns?';
    const turn = understandStudentTurn({
      prompt: answer, expectedAnswer: answer, acceptedAnswers: [answer],
      hasExerciseContext: true
    });
    expect(turn).toMatchObject({
      intent: 'direct_answer', messageType: 'answer_attempt', answerCandidate: answer
    });
  });
});
