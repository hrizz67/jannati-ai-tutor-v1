import { describe, expect, it } from 'vitest';
import { textContainsExpectedAnswer } from '../../src/ai/policy/answerRevealPolicy.js';
import { getTutorResponse } from '../../src/utils/tutorResponseService.js';

const student = { id: 'synthetic-child', studentId: 'synthetic-child' };
const rewardFields = ['score', 'mastery', 'xp', 'stars', 'coins', 'rewards', 'reward'];

const bmQuestion = {
  id: 'qa-review-place',
  q: 'Kami bermain bola di ___. Pilih kata nama tempat.',
  instruction: 'Pilih perkataan yang menamakan tempat.',
  answer: 'taman',
  acceptedAnswers: ['taman']
};

const bmBase = {
  student,
  subject: { id: 'bm', title: 'Bahasa Melayu' },
  topic: {
    id: 'kata_nama_am',
    title: 'Kata Nama Am',
    note: 'Kata nama tempat ialah perkataan yang menamakan sesuatu lokasi.'
  },
  question: bmQuestion,
  expectedAnswer: bmQuestion.answer,
  acceptedAnswers: bmQuestion.acceptedAnswers,
  learnerAnswer: bmQuestion.answer,
  isCorrect: true,
  attemptCount: 1,
  explanationMode: 'correct',
  conversationKey: 'synthetic::bm::kata_nama_am::qa-review-place'
};

function expectUngradedAnswerSafe(response, answer) {
  expect(response.expectedAnswer || '').toBe('');
  expect(response.correctAnswer || '').toBe('');
  expect(response.acceptedAnswers || []).toEqual([]);
  expect(response.learnerAnswer || '').toBe('');
  expect(response.learnerAnswerText || '').toBe('');
  expect(response.isCorrect ?? null).toBeNull();
  expect(response.praise).toBe('');
  expect(response.contextUsed).toMatchObject({
    expectedAnswer: '', acceptedAnswers: [], learnerAnswer: '', isCorrect: null
  });
  expect(response.sections).toMatchObject({ correctAnswer: '', acceptedAnswers: [] });
  const publicSurface = {
    text: response.text,
    shortText: response.shortText,
    sections: response.sections,
    quickReplies: response.quickReplies,
    quickActions: response.quickActions,
    suggestions: response.suggestions,
    options: response.options,
    expectedAnswer: response.expectedAnswer,
    correctAnswer: response.correctAnswer,
    acceptedAnswers: response.acceptedAnswers,
    learnerAnswer: response.learnerAnswer,
    learnerAnswerText: response.learnerAnswerText,
    contextUsed: response.contextUsed
  };
  expect(textContainsExpectedAnswer(JSON.stringify(publicSurface), [answer])).toBe(false);
  for (const field of rewardFields) expect(response).not.toHaveProperty(field);
}

describe('PR #175 QA-review P1 remediation', () => {
  it.each([
    'Kalau perkataan itu nama lokasi, saya tengok bahagian mana dulu?',
    'Bahagian ayat mana saya tengok dulu?',
    'Bahagian mana dalam ayat ini yang penting?',
    'Kalau nama lokasi, apa petunjuknya?',
    'Macam mana nak cam kata nama tempat tanpa jawapan?'
  ])('keeps a held-out BM active-question follow-up grounded: %s', async prompt => {
    const response = await getTutorResponse({ ...bmBase, prompt });

    expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
    expect(response.grounded).toBe(true);
    expect(response.text).toMatch(/kata nama tempat|perkataan|tempat|lokasi|petunjuk|ayat/iu);
    expect(response.text).not.toMatch(/12\s*÷\s*3|operasi bahagi|memisahkan sesuatu sama rata|matematik/iu);
    expect(response.subject).toMatch(/Bahasa Melayu/iu);
    expectUngradedAnswerSafe(response, bmQuestion.answer);
  });

  it('keeps repeated deictic help attached to the current question', async () => {
    const first = await getTutorResponse({ ...bmBase, prompt: 'Bahagian ayat mana saya tengok dulu?' });
    const history = [
      { role: 'user', text: 'Bahagian ayat mana saya tengok dulu?' },
      {
        role: 'ai', text: first.text, intent: first.intent, source: first.source,
        dialogueClassification: first.dialogueClassification,
        pedagogicalState: first.pedagogicalState
      }
    ];
    const second = await getTutorResponse({ ...bmBase, history, prompt: 'Yang mana patut saya tengok sekarang?' });

    expect(first.text).not.toMatch(/12\s*÷\s*3|memisahkan sesuatu sama rata/iu);
    expect(second.studentTurn).toMatchObject({ intent: 'question_help', referencesPreviousTurn: true });
    expect(second.text).toMatch(/tempat|perkataan|ayat|petunjuk/iu);
    expectUngradedAnswerSafe(second, bmQuestion.answer);
  });

  it('does not invent Mathematics when the word bahagian has no active context', async () => {
    const response = await getTutorResponse({
      student,
      subject: { id: 'bm', title: 'Bahasa Melayu' },
      prompt: 'Bahagian mana yang penting?'
    });

    expect(response.dialogueClassification).toBe('NEEDS_CLARIFICATION');
    expect(response.text).toMatch(/bahagian.*maksud|subjek.*topik|soalan/iu);
    expect(response.text).not.toMatch(/12\s*÷\s*3|memisahkan sesuatu sama rata/iu);
  });

  it('answers a genuine Mathematics division request and preserves an explicit topic switch', async () => {
    const math = {
      id: 'math', title: 'Matematik',
      topics: [{ id: 'bahagi', title: 'Bahagi', note: 'Bahagi memisahkan jumlah kepada kumpulan sama banyak.' }]
    };
    const direct = await getTutorResponse({
      student, subject: math, topic: math.topics[0],
      conversationKey: 'synthetic::math::bahagi::general',
      prompt: 'Apa maksud bahagi dalam Matematik?'
    });
    const switched = await getTutorResponse({
      ...bmBase,
      availableSubjects: [bmBase.subject, math],
      prompt: 'Saya mahu belajar topik bahagi.'
    });

    for (const response of [direct, switched]) {
      expect(response.dialogueClassification).toBe('LOCAL_HANDLED');
      expect(response.text).toMatch(/bahagi.*sama rata|kumpulan.*sama/iu);
      expect(response.text).not.toMatch(/kata nama tempat/iu);
    }
    expect(switched.studentTurn.newTopicRequest).toBe(true);
    expect(switched.subject).toBe('Matematik');
  });

  it.each([
    {
      label: 'BM correct prior attempt',
      subject: bmBase.subject,
      topic: bmBase.topic,
      question: bmQuestion,
      answer: 'taman', learnerAnswer: 'taman', isCorrect: true, attemptCount: 1,
      prompt: 'Bahagian ayat mana saya tengok dulu?', locale: 'ms-MY'
    },
    {
      label: 'English wrong prior attempt',
      subject: { id: 'english', title: 'English' },
      topic: { id: 'nouns', title: 'Nouns', note: 'A place noun names a place.' },
      question: { id: 'qa-en', q: 'We read at ___. Choose a place noun.', instruction: 'Choose a place noun.', answer: 'school', acceptedAnswers: ['school'] },
      answer: 'school', learnerAnswer: 'play', isCorrect: false, attemptCount: 2,
      prompt: 'Which part should I check first?', locale: 'en-MY'
    },
    {
      label: 'Arabic no prior result',
      subject: { id: 'arab', title: 'Bahasa Arab' },
      topic: { id: 'mufradat', title: 'مفردات', note: 'اسم المكان يدل على مكان.' },
      question: { id: 'qa-ar', q: 'نقرأ في ___. اختر اسم مكان.', instruction: 'اختر اسم مكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'] },
      answer: 'مدرسة', learnerAnswer: '', isCorrect: null, attemptCount: 0,
      prompt: 'كيف أفهم هذا السؤال؟', locale: 'ar-MY'
    }
  ])('clears protected metadata on ungraded guidance: $label', async config => {
    const response = await getTutorResponse({
      student,
      subject: config.subject,
      topic: config.topic,
      question: config.question,
      expectedAnswer: config.answer,
      acceptedAnswers: [config.answer],
      learnerAnswer: config.learnerAnswer,
      isCorrect: config.isCorrect,
      attemptCount: config.attemptCount,
      locale: config.locale,
      conversationKey: `synthetic::${config.subject.id}::qa-review-metadata`,
      prompt: config.prompt
    });

    expect(response.studentTurn.messageType).not.toBe('answer_attempt');
    expectUngradedAnswerSafe(response, config.answer);
  });

  it('preserves reviewed misconception evidence without exporting stale grading metadata', async () => {
    const response = await getTutorResponse({
      student,
      subject: bmBase.subject,
      topic: { id: 'kata_nama_khas', title: 'Kata Nama Khas' },
      question: {
        id: 'qa-reviewed-wrong', q: 'Pilih kata nama khas.', instruction: 'Pilih nama khusus.',
        options: ['Aina', 'murid'], answer: 'Aina', acceptedAnswers: ['Aina'],
        misconceptionEvidence: [{
          answer: 'murid', type: 'common_noun_vs_proper_noun', confidence: 0.9,
          verified: true, source: 'reviewed-question', evidence: 'Reviewed distractor.',
          childSafeLabel: 'Kamu memilih nama umum, tetapi soalan meminta nama khusus.'
        }]
      },
      expectedAnswer: 'Aina', acceptedAnswers: ['Aina'], learnerAnswer: 'murid', isCorrect: false,
      attemptCount: 1, intent: 'wrong_answer_coaching', prompt: 'Kenapa jawapan saya salah?',
      conversationKey: 'synthetic::bm::qa-reviewed-wrong'
    });

    expect(response.learningExperience.misconception).toMatchObject({
      type: 'common_noun_vs_proper_noun', supported: true, evidenceAnswer: 'murid'
    });
    expect(response.text).toMatch(/nama umum.*nama khusus/iu);
    expectUngradedAnswerSafe(response, 'Aina');
  });

  it.each([
    ['hint', 'Beri saya petunjuk lagi.'],
    ['wrong_answer_coaching', 'Kenapa jawapan saya salah?']
  ])('keeps third-turn %s guidance answer-safe while retaining stronger support', async (intent, prompt) => {
    const response = await getTutorResponse({
      ...bmBase,
      learnerAnswer: 'padang',
      isCorrect: false,
      attemptCount: 3,
      intent,
      prompt
    });

    expect(response.answerRevealPolicy).toMatchObject({ stage: 'strong_hint', canRevealAnswer: false });
    expectUngradedAnswerSafe(response, bmQuestion.answer);
  });

  it.each([
    ['BM', bmBase.subject, bmBase.topic, bmQuestion, 'taman', 'ms-MY'],
    ['English', { id: 'english', title: 'English' }, { id: 'nouns', title: 'Nouns' }, { id: 'graded-en', q: 'Type the place noun.', answer: 'school', acceptedAnswers: ['school'] }, 'school', 'en-MY'],
    ['Arabic', { id: 'arab', title: 'Bahasa Arab' }, { id: 'mufradat', title: 'مفردات' }, { id: 'graded-ar', q: 'اكتب اسم المكان.', answer: 'مدرسة', acceptedAnswers: ['مدرسة'] }, 'مدرسة', 'ar-MY']
  ])('preserves genuine graded Tutor answer submission for %s', async (_label, subject, topic, question, answer, locale) => {
    const response = await getTutorResponse({
      student, subject, topic, question,
      expectedAnswer: answer, acceptedAnswers: [answer], prompt: answer, locale,
      conversationKey: `synthetic::${subject.id}::graded-answer`
    });

    expect(response.studentTurn).toMatchObject({ messageType: 'answer_attempt', answerCandidate: answer });
    expect(response.isCorrect).toBe(true);
    expect(response.expectedAnswer).toBe(answer);
    expect(response.correctAnswer).toBe(answer);
    expect(response.acceptedAnswers).toContain(answer);
    for (const field of rewardFields) expect(response).not.toHaveProperty(field);
  });

  it('keeps permitted correct-answer explanation while clearing response metadata', async () => {
    const response = await getTutorResponse({
      ...bmBase,
      intent: 'correct_answer_reinforcement',
      prompt: 'Terangkan kenapa jawapan saya betul.'
    });

    expect(response.text).toMatch(/betul|tepat|jawapan/iu);
    expectUngradedAnswerSafe(response, bmQuestion.answer);
  });
});
