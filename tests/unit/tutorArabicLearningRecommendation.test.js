import { describe, expect, it } from 'vitest';
import { understandStudentTurn } from '../../src/ai/conversation/studentTurnEngine.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';
import { getSubjectTextProps } from '../../src/components/SubjectLanguageText.jsx';

const student = { id: 'synthetic-p26b2', studentId: 'synthetic-p26b2' };
const subject = { id: 'arab', title: 'Bahasa Arab', topics: [{ id: 'mufradat', title: 'مفردات' }] };
const topic = { id: 'mufradat', title: 'مفردات' };

function safeUnscored(response, answer = '') {
  expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
  expect(response.isCorrect).toBeNull();
  expect(response.expectedAnswer).toBe('');
  expect(response.acceptedAnswers).toEqual([]);
  expect(response.correctAnswer).toBe('');
  expect(response.studentTurn.answerCandidate).toBe('');
  expect(response.remoteAttempted).toBe(false);
  expect(response.generativeUsed).toBe(false);
  for (const field of ['score', 'xp', 'coins', 'rewards']) expect(response).not.toHaveProperty(field);
  if (answer) expect(response.text).not.toContain(answer);
}

describe('P2.6-B2 Arabic learning-recommendation locale and grounding', () => {
  it.each(['ماذا أتعلم اليوم؟', 'ماذا أدرس اليوم؟', 'بماذا أبدأ اليوم؟'])(
    'gives Arabic-only Year 2 study guidance for %s', async prompt => {
      const response = await getTutorResponse({
        student, subject, topic, prompt, locale: 'ar-MY',
        conversationKey: 'synthetic::p26b2::study'
      });
      expect(response.studentTurn).toMatchObject({
        intent: 'learning_recommendation', messageType: 'learning_plan_question'
      });
      safeUnscored(response);
      expect(response.text).toMatch(/اللغة العربية|مفردات/u);
      expect(response.text).toMatch(/شرح|مثال|تدريب|أسئلة/u);
      expect(response.text).not.toMatch(/[A-Za-z]/u);
      expect(response.quickReplies).toHaveLength(3);
      for (const reply of response.quickReplies) expect(reply).toMatch(/\p{Script=Arabic}/u);
      for (const reply of response.quickReplies) expect(reply).not.toMatch(/[A-Za-z]/u);
      expect(getSubjectTextProps(response.text, 'arab', { teaching: true })).toEqual({ lang: 'ar', dir: 'rtl' });
    }
  );

  it('does not invent weak-topic evidence when the student has no practice records', async () => {
    const response = await getTutorResponse({
      student, subject, topic, prompt: 'ماذا أتعلم اليوم؟',
      locale: 'ar-MY', weakTopics: [], conversationKey: 'synthetic::p26b2::empty'
    });
    expect(response.text).toMatch(/ليس لدي تدريبات كافية/u);
    expect(response.text).not.toMatch(/بناءً على تدريباتك/u);
    safeUnscored(response);
  });

  it('uses actual synthetic weak-topic evidence only when explicitly supplied', async () => {
    const response = await getTutorResponse({
      student, subject, topic, prompt: 'ماذا أتعلم اليوم؟',
      locale: 'ar-MY', weakTopics: [{ subjectId: 'arab', topicId: 'mufradat' }],
      conversationKey: 'synthetic::p26b2::weak'
    });
    expect(response.studentTurn.intent).toBe('learning_recommendation');
    expect(response.text).toMatch(/بناءً على تدريباتك/u);
    safeUnscored(response);
  });

  it('does not relabel an unrelated Latin-only weak topic using the active Arabic topic name', async () => {
    const response = await getTutorResponse({
      student, subject, topic, prompt: 'ماذا أتعلم اليوم؟',
      locale: 'ar-MY',
      weakTopics: [{ subjectId: 'arab', topicId: 'english_catalog', title: 'Vocabulary' }],
      conversationKey: 'synthetic::p26b2::unmatched-weak'
    });
    expect(response.studentTurn.intent).toBe('learning_recommendation');
    expect(response.text).toMatch(/درس أساسي في اللغة العربية/u);
    expect(response.text).not.toMatch(/بناءً على تدريباتك/u);
    expect(response.text).not.toMatch(/مفردات/u);
    expect(response.text).not.toMatch(/[A-Za-z]/u);
    safeUnscored(response);
  });

  it('gives a safe Arabic fallback when no approved Arabic topic title is available', async () => {
    const response = await getTutorResponse({
      student, subject: { id: 'arab', title: 'Bahasa Arab' }, topic: { id: 'english_catalog', title: 'Vocabulary' },
      prompt: 'ماذا أتعلم اليوم؟', locale: 'ar-MY',
      conversationKey: 'synthetic::p26b2::missing'
    });
    expect(response.text).toMatch(/درس أساسي في اللغة العربية/u);
    expect(response.text).not.toMatch(/[A-Za-z]/u);
    safeUnscored(response);
  });

  it('preserves accepted-answer precedence and ordinary Arabic meaning questions', () => {
    expect(understandStudentTurn({
      prompt: 'ماذا أتعلم اليوم؟', expectedAnswer: 'ماذا أتعلم اليوم؟',
      acceptedAnswers: ['ماذا أتعلم اليوم؟'], hasExerciseContext: true
    })).toMatchObject({ intent: 'direct_answer', messageType: 'answer_attempt' });
    expect(understandStudentTurn({ prompt: 'ماذا يعني هذا؟', hasExerciseContext: true }).intent).not.toBe('learning_recommendation');
  });

  it('keeps existing BM study recommendations in Malay', async () => {
    const response = await getTutorResponse({
      student, subject: { id: 'bm', title: 'Bahasa Melayu' },
      topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
      prompt: 'Apa patut saya belajar hari ini?', locale: 'ms-MY',
      conversationKey: 'synthetic::p26b2::bm'
    });
    expect(response.studentTurn.intent).toBe('learning_recommendation');
    expect(response.text).toMatch(/pelan kita|hari ini/iu);
    safeUnscored(response);
  });

  it('keeps protected active-question answers out of Arabic study guidance', async () => {
    const response = await getTutorResponse({
      student, subject, topic, prompt: 'ماذا أتعلم اليوم؟',
      question: { id: 'p26b2-1', q: 'اختر اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'] },
      expectedAnswer: 'مدرسة', acceptedAnswers: ['مدرسة'], locale: 'ar-MY',
      conversationKey: 'synthetic::p26b2::protected'
    });
    safeUnscored(response, 'مدرسة');
    expect(response.studentTurn.intent).toBe('learning_recommendation');
  });
});
