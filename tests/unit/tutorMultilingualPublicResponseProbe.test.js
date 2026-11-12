import { describe, expect, it } from 'vitest';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const student = { id: 'synthetic-tutor-child', studentId: 'synthetic-tutor-child' };
const scenarios = [
  {
    id: 'english-understood-question-active',
    subject: { id: 'english', title: 'English' },
    topic: { id: 'nouns', title: 'Nouns', note: 'A noun names a person, place, animal or thing.' },
    question: { id: 'p26b-en-q1', q: 'Choose the place noun.', answer: 'school', acceptedAnswers: ['school'] },
    prompt: 'I understand now'
  },
  {
    id: 'arab-understood-question-active',
    subject: { id: 'arab', title: 'Bahasa Arab' },
    topic: { id: 'mufradat', title: 'مفردات', note: 'المفردات أسماء الأشياء والأماكن.' },
    question: { id: 'p26b-ar-q1', q: 'اختر اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'] },
    prompt: 'فهمت الآن'
  },
  {
    id: 'arab-understood-no-question',
    subject: { id: 'arab', title: 'Bahasa Arab' },
    topic: { id: 'mufradat', title: 'مفردات' },
    prompt: 'فهمت الآن'
  },
  {
    id: 'arab-why-wrong',
    subject: { id: 'arab', title: 'Bahasa Arab' },
    topic: { id: 'mufradat', title: 'مفردات', note: 'اسم المكان يدل على مكان.' },
    question: { id: 'p26b-ar-q2', q: 'اختر اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'], options: ['مدرسة', 'يلعب'] },
    learnerAnswer: 'يلعب',
    isCorrect: false,
    attemptCount: 1,
    prompt: 'لماذا إجابتي خاطئة؟'
  },
  {
    id: 'arab-learning-plan',
    subject: { id: 'arab', title: 'Bahasa Arab' },
    topic: { id: 'mufradat', title: 'مفردات' },
    prompt: 'ماذا أتعلم اليوم؟'
  },
  {
    id: 'english-topic-switch',
    subject: { id: 'english', title: 'English' },
    topic: { id: 'nouns', title: 'Nouns' },
    prompt: 'I want to learn nouns and places'
  },
  {
    id: 'bm-understood-control',
    subject: { id: 'bm', title: 'Bahasa Melayu' },
    topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
    question: { id: 'p26b-bm-q1', q: 'Pilih kata nama tempat.', answer: 'taman', acceptedAnswers: ['taman'] },
    prompt: 'Saya dah faham'
  }
];

describe('P2.6-B multilingual public Tutor response probes (diagnostic only)', () => {
  it('captures response-level routing without sending remote requests or grading a quiz', async () => {
    const report = [];
    for (const fixture of scenarios) {
      const { id, ...options } = fixture;
      const response = await getTutorResponse({
        student,
        conversationKey: `synthetic::p26b::${id}`,
        locale: fixture.subject.id === 'english' ? 'en-MY' : fixture.subject.id === 'arab' ? 'ar-MY' : 'ms-MY',
        ...options
      });
      const record = {
        id, prompt: fixture.prompt,
        intent: response.studentTurn?.intent ?? null,
        messageType: response.studentTurn?.messageType ?? null,
        answerCandidate: response.studentTurn?.answerCandidate ?? null,
        isCorrect: response.isCorrect ?? null,
        classification: response.dialogueClassification ?? null,
        responseText: String(response.text || '').slice(0, 300),
        source: response.source ?? null,
        protectedAnswerPresentInText: Boolean(fixture.question?.answer && String(response.text || '').includes(fixture.question.answer)),
        answerFieldsPresent: Boolean(response.expectedAnswer || response.correctAnswer || response.acceptedAnswers?.length),
        remoteAttempted: Boolean(response.remoteAttempted),
        generativeUsed: Boolean(response.generativeUsed)
      };
      report.push(record);
      expect(response.remoteAttempted).toBe(false);
      expect(response.generativeUsed).toBe(false);
      expect(response).not.toHaveProperty('xp');
      expect(response).not.toHaveProperty('coins');
      expect(response).not.toHaveProperty('score');
    }
    console.log('P26B_RESPONSE_PROBE=' + JSON.stringify(report));
    expect(report).toHaveLength(7);
  });
});
