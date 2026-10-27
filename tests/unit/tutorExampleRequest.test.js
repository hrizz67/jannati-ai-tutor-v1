import { describe, expect, it } from 'vitest';
import { resolveTutorQuickReplyAction } from '../../src/ai/conversation/tutorQuickReplyActions.js';
import { getTutorResponse } from '../../src/ai/tutorResponseEngine.js';

const languageCases = [
  {
    language: 'BM',
    label: 'Beri contoh mudah',
    subject: { id: 'bm', title: 'Bahasa Melayu' },
    topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
    answer: 'Ali',
    options: ['Ali', 'berlari', 'cantik'],
    approved: ['sekolah', 'doktor']
  },
  {
    language: 'English',
    label: 'Give an easy example',
    subject: { id: 'english', title: 'English' },
    topic: { id: 'nouns', title: 'Nouns' },
    answer: 'teacher',
    options: ['teacher', 'runs', 'happy'],
    approved: ['school', 'doctor']
  },
  {
    language: 'Arabic',
    label: 'أعطني مثالًا سهلًا',
    subject: { id: 'arab', title: 'Bahasa Arab' },
    topic: { id: 'mufradat', title: 'Mufradat' },
    answer: 'قَلَمٌ',
    options: ['قَلَمٌ', 'كِتَابٌ', 'مَدْرَسَةٌ'],
    locale: 'ar-MY',
    approved: ['Dengar bunyi مَدْرَسَةٌ dengan teliti.', 'Baca contoh كِتَابٌ satu demi satu.']
  }
];

function asHistory(response) {
  return [{
    role: 'ai',
    text: response.text,
    pedagogicalState: response.pedagogicalState
  }];
}

async function askForExample(config, overrides = {}) {
  const questionId = overrides.questionId || `${config.subject.id}-example-request`;
  const expectedAnswer = overrides.expectedAnswer || config.answer;
  const action = resolveTutorQuickReplyAction(config.label, {
    hasExerciseContext: true,
    conversationKey: `account-a::child-a::session-a::${questionId}`,
    questionId,
    subjectId: config.subject.id,
    topicId: config.topic.id
  });
  return getTutorResponse({
    student: { id: 'child-a', name: 'Murid' },
    subject: config.subject,
    topic: config.topic,
    question: {
      id: questionId,
      q: 'Pilih jawapan yang betul.',
      options: config.options,
      answer: expectedAnswer,
      acceptedAnswers: [expectedAnswer]
    },
    expectedAnswer,
    acceptedAnswers: [expectedAnswer],
    prompt: action.label,
    intent: action.intent,
    tutorAction: action,
    conversationKey: action.conversationKey,
    locale: config.locale,
    history: overrides.history || [],
    isCorrect: overrides.isCorrect ?? false
  });
}

describe('approved example-request teaching path', () => {
  it.each(languageCases)('returns an actual approved $language example on the first request', async config => {
    const response = await askForExample(config);

    expect(response.source).toBe('intelligent-teaching-engine');
    expect(response.text).toContain(config.approved[0]);
    expect(response.pedagogicalState).toMatchObject({
      signal: 'example_request',
      misunderstandingCount: 0,
      strategyUsed: 'verified-micro-example',
      supportStage: 'example'
    });
    expect((response.text.match(/[?؟]/g) || []).length).toBeLessThanOrEqual(1);
  });

  it('preserves the prior confusion count and selects a fresh example', async () => {
    const config = languageCases[0];
    const confused = await getTutorResponse({
      student: { id: 'child-a', name: 'Murid' },
      subject: config.subject,
      topic: config.topic,
      question: {
        id: 'bm-after-confusion',
        q: 'Pilih kata nama orang.',
        options: config.options,
        answer: config.answer,
        acceptedAnswers: [config.answer]
      },
      prompt: 'Saya masih tak faham',
      conversationKey: 'account-a::child-a::session-a::bm-after-confusion',
      isCorrect: false
    });
    const response = await askForExample(config, {
      questionId: 'bm-after-confusion',
      history: asHistory(confused)
    });

    expect(confused.pedagogicalState.misunderstandingCount).toBe(1);
    expect(confused.text).toContain(config.approved[0]);
    expect(response.text).toContain(config.approved[1]);
    expect(response.pedagogicalState).toMatchObject({
      signal: 'example_request',
      misunderstandingCount: 1,
      supportStage: 'example'
    });
  });

  it('does not repeat exhausted approved examples', async () => {
    const config = languageCases[0];
    const first = await askForExample(config, { questionId: 'bm-repeat' });
    const second = await askForExample(config, {
      questionId: 'bm-repeat',
      history: asHistory(first)
    });
    const third = await askForExample(config, {
      questionId: 'bm-repeat',
      history: [...asHistory(first), ...asHistory(second)]
    });

    expect(first.text).toContain(config.approved[0]);
    expect(second.text).toContain(config.approved[1]);
    expect(second.text).not.toBe(first.text);
    expect(third.text).toContain('Tiada contoh baharu diluluskan');
    expect(third.text).not.toContain(config.approved[0]);
    expect(third.text).not.toContain(config.approved[1]);
    expect(third.quickReplies).not.toContain('Beri contoh mudah');
    expect([first, second, third].map(item => item.pedagogicalState.misunderstandingCount)).toEqual([0, 0, 0]);
  });

  it('uses a truthful fallback when the active topic has no approved example', async () => {
    const response = await askForExample({
      language: 'BM',
      label: 'Beri contoh mudah',
      subject: { id: 'sains', title: 'Sains' },
      topic: { id: 'haiwan', title: 'Haiwan' },
      answer: 'kucing',
      options: ['kucing', 'pokok'],
      approved: []
    });

    expect(response.text).toContain('Tiada contoh baharu diluluskan');
    expect(response.pedagogicalState).toMatchObject({
      signal: 'example_request',
      misunderstandingCount: 0,
      strategyUsed: 'knowledge-safe-fallback',
      supportStage: 'example_unavailable'
    });
    expect(response.quickReplies).not.toContain('Beri contoh mudah');
  });

  it('filters an approved example that would reveal the protected answer', async () => {
    const config = languageCases[0];
    const response = await askForExample(config, { expectedAnswer: 'sekolah' });

    expect(response.text).toContain('doktor');
    expect(response.text.toLocaleLowerCase('ms-MY')).not.toContain('sekolah');
    expect(response.expectedAnswer).toBe('');
    expect(response.isCorrect).toBe(false);
  });

  it('preserves canonical correctness without changing score or reward data', async () => {
    const response = await askForExample(languageCases[0], { isCorrect: true });

    expect(response.isCorrect).toBe(true);
    expect(response.expectedAnswer).toBe('Ali');
    expect(response.pedagogicalState.misunderstandingCount).toBe(0);
    expect(response).not.toHaveProperty('xp');
    expect(response).not.toHaveProperty('coins');
    expect(response).not.toHaveProperty('reward');
  });
});
